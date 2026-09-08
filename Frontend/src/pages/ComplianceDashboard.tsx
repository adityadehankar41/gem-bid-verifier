import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import OfficerHeader from "../components/OfficerHeader";
import Footer from "../components/Footer";
import { SearchIcon, SortIcon, CloseIcon } from "../components/icons";
import { ScoreBar, RiskBadge, StatusBadge } from "../components/badges";
import { TENDERS, Bidder, Tender } from "../data/bidders";
import { useAuditLog } from "../context/AuditLogContext";
import { useBidderContext } from "../context/BidderContext";

interface ComplianceDashboardProps {
  activeTenderId?: string;
  onSelectTender?: (ref: string) => void;
}

export default function ComplianceDashboard({
  activeTenderId = TENDERS[0].ref,
  onSelectTender,
}: ComplianceDashboardProps) {
  const navigate = useNavigate();
  const { addLog } = useAuditLog();
  const { getAllBidders, customBidders, resetBiddersToDefault } = useBidderContext();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentTender = TENDERS.find((t) => t.ref === activeTenderId) || TENDERS[0];
  const evaluatedBidders = getAllBidders(activeTenderId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = evaluatedBidders
    .filter((b) => {
      const q = search.toLowerCase();
      const matchesSearch = b.name.toLowerCase().includes(q) || b.gstin.toLowerCase().includes(q);
      const matchesRisk = riskFilter === "All" || b.risk === riskFilter;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => (sortDir === "desc" ? b.score - a.score : a.score - b.score));

  const totalBidders = evaluatedBidders.length;
  const clearedCount = evaluatedBidders.filter((b) => b.status === "Cleared").length;
  const flaggedCount = evaluatedBidders.filter((b) => b.status === "Flagged").length;
  const highRiskCount = evaluatedBidders.filter((b) => b.risk === "High").length;

  const selectedBidder = evaluatedBidders.find((b) => b.id === selectedId) || null;

  // CSV Export Functionality
  function handleExportCSV() {
    const headers = ["Bidder ID", "Bidder Name", "GSTIN", "Risk Level", "Score", "Compliance Status", "Flagged Items", "Last Audited"];
    const rows = filtered.map((b) => [
      `"${b.id}"`,
      `"${b.name.replace(/"/g, '""')}"`,
      `"${b.gstin}"`,
      `"${b.risk}"`,
      b.score,
      `"${b.status}"`,
      b.pending,
      `"${b.lastChecked}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bid_Evaluation_${currentTender.ref.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F7F6F2" }}>
      <OfficerHeader
        tenders={TENDERS}
        activeTenderId={activeTenderId}
        onSelectTender={onSelectTender}
      />

      <div className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-8 py-8">
        {/* Tender Specification Banner */}
        <div className="p-5 rounded bg-white border border-[#DCD7CB] mb-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EDEAE1]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-[#EEF5F1] text-[#1F7A5C] border border-[#BDE0D2]">
                  {currentTender.ref}
                </span>
                <span className="text-xs text-[#5B6B7D]">&middot; {currentTender.department}</span>
              </div>
              <h1 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-2xl md:text-3xl font-bold">
                {currentTender.title}
              </h1>
            </div>

            {onSelectTender && (
              <div className="flex items-center gap-2 bg-[#FAF9F6] px-3 py-2 rounded border border-[#EDEAE1]">
                <span className="text-xs text-[#5B6B7D] font-medium">Switch Tender:</span>
                <select
                  value={activeTenderId}
                  onChange={(e) => onSelectTender(e.target.value)}
                  className="text-xs font-semibold bg-white px-2.5 py-1.5 rounded border border-[#DCD7CB] cursor-pointer"
                >
                  {TENDERS.map((t) => (
                    <option key={t.ref} value={t.ref}>
                      {t.ref} ({t.category})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-xs">
            <div>
              <span className="text-[#8A96A3] block">Estimated Tender Value</span>
              <span className="font-semibold text-[#171E27]">{currentTender.estimatedValue}</span>
            </div>
            <div>
              <span className="text-[#8A96A3] block">Min. Make in India (MII)</span>
              <span className="font-semibold text-[#1F7A5C]">{currentTender.requirements.minLocalContent}% Local Content</span>
            </div>
            <div>
              <span className="text-[#8A96A3] block">OEM Authorization</span>
              <span className={`font-semibold ${currentTender.requirements.requiresOEM ? "text-[#95601F]" : "text-[#171E27]"}`}>
                {currentTender.requirements.requiresOEM ? "Mandatory for Category" : "Standard Reseller Allowed"}
              </span>
            </div>
            <div>
              <span className="text-[#8A96A3] block">Turnover &amp; Exemption</span>
              <span className="font-semibold text-[#171E27]">
                {currentTender.requirements.startupExemption ? "Startup/MSME Exempt" : "No Exemption"}
              </span>
            </div>
          </div>
        </div>

        {/* Aggregate Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Bidders" value={totalBidders} dot="#5B6B7D" subtitle="Evaluated for this tender" />
          <StatCard label="Cleared" value={clearedCount} dot="#1F7A5C" subtitle="Compliant across all gates" />
          <StatCard label="Flagged" value={flaggedCount} dot="#B8752E" subtitle="Discrepancies identified" />
          <StatCard label="High Risk" value={highRiskCount} dot="#B23A3A" subtitle="Requires officer review" />
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A96A3]">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bidders by company name or GSTIN..."
              aria-label="Search bidders"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded bg-white outline-none transition-all"
              style={{ border: "1px solid #DCD7CB", color: "#171E27" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              aria-label="Filter by risk level"
              className="px-3.5 py-2.5 text-sm rounded bg-white cursor-pointer"
              style={{ border: "1px solid #DCD7CB", color: "#171E27" }}
            >
              <option value="All">All Risk Levels</option>
              <option value="Low">Low Risk Only</option>
              <option value="Medium">Medium Risk Only</option>
              <option value="High">High Risk Only</option>
            </select>
            <button
                onClick={handleExportCSV}
                className="px-3.5 py-2.5 text-xs font-semibold rounded bg-[#171E27] text-white hover:bg-[#25303D] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                title="Export complete technical evaluation summary to CSV"
>
                <span>Export Matrix (CSV)</span>
            </button>
            {customBidders.length > 0 && (
              <button
                onClick={resetBiddersToDefault}
                className="px-3 py-2.5 text-xs font-medium rounded bg-[#F4EFE6] border border-[#C8BFAD] text-[#7C8896] hover:text-[#171E27] hover:bg-[#EDEAE1] transition-colors cursor-pointer whitespace-nowrap"
                title="Clear live submissions and return to standard benchmarks"
              >
                Reset ({customBidders.length})
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded overflow-hidden" style={{ border: "1px solid #DCD7CB", backgroundColor: "#FFFFFF" }}>
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="bg-[#FAF9F6]" style={{ borderBottom: "1px solid #DCD7CB" }}>
                    <Th>Bidder / Company</Th>
                    <Th sortable sortDir={sortDir} onSort={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
                      BidSure AI Score
                    </Th>
                    <Th>Risk Level</Th>
                    <Th>Status</Th>
                    <Th>Tender Discrepancies</Th>
                    <Th>Last Verified</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr
                      key={b.id}
                      className="transition-colors hover:bg-[#F9F8F5]"
                      style={{ borderBottom: "1px solid #EDEAE1" }}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#171E27]">{b.name}</p>
                          {b.id.startsWith("bidder-") && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#E3F2EB] text-[#1F7A5C] border border-[#B5DECB]">
                              New Submission
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-[#8A96A3] mt-0.5">{b.gstin}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <ScoreBar score={b.score} />
                      </td>
                      <td className="px-4 py-3.5">
                        <RiskBadge risk={b.risk} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {b.pending > 0 ? (
                          <span className="font-semibold text-[#95601F] text-xs px-2 py-0.5 rounded bg-[#FBF1E4]">
                            {b.pending} flagged
                          </span>
                        ) : (
                          <span className="text-xs text-[#1F7A5C] font-medium">All gates cleared</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#8A96A3]">{b.lastChecked}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedId(b.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded cursor-pointer transition-colors shadow-2xs hover:bg-[#F4EFE6]"
                          style={{
                            color: "#0F1B2D",
                            border: "1px solid #DCD7CB",
                            backgroundColor: "#FFFFFF",
                          }}
                        >
                          Review &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filtered.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className="w-full text-left p-4 rounded bg-white"
                  style={{ border: "1px solid #DCD7CB" }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-[#171E27]">{b.name}</p>
                        {b.id.startsWith("bidder-") && (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#E3F2EB] text-[#1F7A5C]">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-[#8A96A3]">{b.gstin}</p>
                    </div>
                    <RiskBadge risk={b.risk} />
                  </div>
                  <ScoreBar score={b.score} wide />
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#EDEAE1]">
                    <StatusBadge status={b.status} />
                    <span className="text-xs text-[#8A96A3]">
                      {b.pending} flagged &middot; {b.lastChecked}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />

      {/* Slide-over Detail Drawer */}
      <div
        className="fixed inset-0 transition-opacity duration-300 z-50"
        style={{
          pointerEvents: selectedBidder ? "auto" : "none",
          opacity: selectedBidder ? 1 : 0,
        }}
        aria-hidden={!selectedBidder}
      >
        <div
          className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSelectedId(null)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bidder compliance detail"
          className="absolute top-0 right-0 h-full overflow-y-auto transition-transform duration-300 shadow-2xl"
          style={{
            width: "100%",
            maxWidth: 480,
            backgroundColor: "#FFFFFF",
            borderLeft: "1px solid #DCD7CB",
            transform: selectedBidder ? "translateX(0)" : "translateX(100%)",
          }}
        >
          {selectedBidder && (
            <DrawerContent
              key={selectedBidder.id}
              bidder={selectedBidder}
              currentTender={currentTender}
              onClose={() => setSelectedId(null)}
              onViewFullReport={() => {
                const id = selectedBidder.id;
                setSelectedId(null);
                navigate(`/officer/bidder/${id}`);
              }}
              addLog={addLog}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DrawerContent({
  bidder,
  currentTender,
  onClose,
  onViewFullReport,
  addLog,
}: {
  key?: string;
  bidder: Bidder;
  currentTender: Tender;
  onClose: () => void;
  onViewFullReport: () => void;
  addLog: any;
}) {
  const [decision, setDecision] = useState<string | null>(null);

  function handleDecision(label: string, detail: string) {
    setDecision(label);
    addLog({
      bidder: bidder.name,
      event: `Officer ${label.toLowerCase()}`,
      actor: "Procurement Officer",
      detail: `${detail} (Tender: ${currentTender.ref})`,
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-[#EDEAE1]">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8A96A3] block mb-1">
            Bidder Compliance Evaluation
          </span>
          <h2 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-xl font-bold leading-snug">
            {bidder.name}
          </h2>
          <p className="text-xs font-mono text-[#5B6B7D] mt-0.5">GSTIN: {bidder.gstin}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="p-1.5 rounded hover:bg-[#EDEAE1] cursor-pointer text-[#5B6B7D]"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex items-center justify-between p-3.5 rounded mb-6 bg-[#FAF9F6] border border-[#EDEAE1]">
        <div>
          <p className="text-xs text-[#8A96A3] mb-1">Calculated Score</p>
          <ScoreBar score={bidder.score} wide />
        </div>
        <div className="text-right">
          <p className="text-xs text-[#8A96A3] mb-1">Risk Classification</p>
          <RiskBadge risk={bidder.risk} />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider font-semibold text-[#5B6B7D] mb-2.5">
          Statutory &amp; Tender Verification Gates
        </p>
        <div className="space-y-2">
          {bidder.checks.map((c) => (
            <div
              key={c.label}
              className="p-3 rounded text-sm transition-colors"
              style={{
                border: `1px solid ${c.status === "verified" ? "#EDEAE1" : "#F0DEC6"}`,
                backgroundColor: c.status === "verified" ? "#FFFFFF" : "#FDF8F0",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#171E27]">{c.label}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: c.status === "verified" ? "#EEF5F1" : "#FBF1E4",
                    color: c.status === "verified" ? "#1F7A5C" : "#95601F",
                  }}
                >
                  {c.status === "verified" ? "Verified" : "Flagged"}
                </span>
              </div>
              {c.note && (
                <p className="text-xs mt-1 text-[#95601F] leading-snug">
                  &bull; {c.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BidSure AI Recommendation Card */}
      <div
        className="p-4 mb-6 rounded"
        style={{
          borderLeft: `4px solid ${bidder.status === "Cleared" ? "#1F7A5C" : "#B8752E"}`,
          backgroundColor: "#FAF9F6",
          borderTop: "1px solid #DCD7CB",
          borderRight: "1px solid #DCD7CB",
          borderBottom: "1px solid #DCD7CB",
        }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1F7A5C]" />
          <p className="text-xs font-semibold text-[#171E27]">BidSure AI Advisory Recommendation</p>
        </div>
        <p className="text-xs leading-relaxed text-[#3E4C59]">{bidder.recommendation}</p>
      </div>

      <button
        onClick={onViewFullReport}
        className="w-full py-2.5 text-xs font-semibold rounded mb-6 text-center cursor-pointer transition-colors"
        style={{ color: "#0F1B2D", border: "1px solid #DCD7CB", backgroundColor: "#FFFFFF" }}
      >
        View Complete Bidder Dossier &amp; History &rarr;
      </button>

      {/* Human in the loop decision actions */}
      <div className="border-t border-[#EDEAE1] pt-5">
        <p className="text-xs uppercase tracking-wider font-semibold text-[#5B6B7D] mb-3">
          Procurement Officer Decision
        </p>

        {decision ? (
          <div className="p-3.5 rounded bg-[#EEF5F1] border border-[#BDE0D2] text-[#1F7A5C] text-xs font-medium">
            &check; Bidder status recorded as <strong>{decision}</strong>. An immutable entry has been appended to the Audit Trail.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleDecision("Approved", "Bidder cleared for commercial opening.")}
              className="w-full py-2.5 text-xs font-semibold rounded text-white cursor-pointer shadow-2xs transition-all"
              style={{ backgroundColor: "#1F7A5C" }}
            >
              Qualify &amp; Approve for Award
            </button>
            <button
              onClick={() => handleDecision("Documents Requested", "Issued notice requesting missing/updated statutory proof.")}
              className="w-full py-2.5 text-xs font-semibold rounded cursor-pointer transition-all"
              style={{ border: "1px solid #DCD7CB", color: "#171E27", backgroundColor: "#FFFFFF" }}
            >
              Request Clarification / Documents
            </button>
            <button
              onClick={() => handleDecision("Rejected", "Disqualified due to statutory non-compliance.")}
              className="w-full py-2.5 text-xs font-semibold rounded cursor-pointer transition-all"
              style={{ border: "1px solid #F0C4C4", color: "#973434", backgroundColor: "#FDF5F5" }}
            >
              Disqualify / Reject Bidder
            </button>
          </div>
        )}

        <p className="text-[11px] text-[#8A96A3] mt-4 leading-normal">
          Statutory notice: As mandated by CPCL GeM procurement rules, the final qualification authority remains with the Procurement Officer. BidSure AI provides decision-support analysis only.
        </p>
      </div>
    </div>
  );
}

function Th({
  children,
  sortable,
  sortDir,
  onSort,
  className = "",
}: {
  children?: ReactNode;
  sortable?: boolean;
  sortDir?: "asc" | "desc";
  onSort?: () => void;
  className?: string;
}) {
  if (!sortable) {
    return (
      <th className={`px-4 py-3 text-left text-xs font-semibold text-[#5B6B7D] ${className}`}>
        {children}
      </th>
    );
  }
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-[#5B6B7D] ${className}`}>
      <button
        onClick={onSort}
        className="flex items-center gap-1.5 cursor-pointer hover:text-[#171E27]"
        aria-label={`Sort by ${children}, currently ${sortDir === "desc" ? "highest first" : "lowest first"}`}
      >
        <span>{children}</span>
        <SortIcon dir={sortDir || "desc"} />
      </button>
    </th>
  );
}

function StatCard({
  label,
  value,
  dot,
  subtitle,
}: {
  label: string;
  value: number;
  dot: string;
  subtitle: string;
}) {
  return (
    <div className="p-4 rounded bg-white shadow-2xs" style={{ border: "1px solid #DCD7CB" }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: dot }} />
        <span className="text-xs font-medium text-[#5B6B7D]">{label}</span>
      </div>
      <p style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-3xl font-bold">
        {value}
      </p>
      <p className="text-[11px] text-[#8A96A3] mt-1">{subtitle}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-4 rounded bg-white"
      style={{ border: "1px dashed #DCD7CB" }}
    >
      <SearchIcon large />
      <p className="text-base font-semibold mt-3 text-[#171E27]">No matching bidders found</p>
      <p className="text-xs text-[#8A96A3] mt-1 max-w-sm">
        Try modifying your search keywords or reset the risk filter to "All Risk Levels".
      </p>
    </div>
  );
}
