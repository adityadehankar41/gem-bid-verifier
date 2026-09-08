import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import OfficerHeader from "../components/OfficerHeader";
import Footer from "../components/Footer";
import { ScoreBar, RiskBadge, StatusBadge } from "../components/badges";
import { getBidderById, TENDERS } from "../data/bidders";
import { useAuditLog } from "../context/AuditLogContext";

interface BidderReportProps {
  activeTenderId?: string;
  onSelectTender?: (ref: string) => void;
}

export default function BidderReport({
  activeTenderId = TENDERS[0].ref,
  onSelectTender,
}: BidderReportProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentTender = TENDERS.find((t) => t.ref === activeTenderId) || TENDERS[0];
  const bidder = getBidderById(id, activeTenderId);
  const { logs, addLog } = useAuditLog();
  const [decision, setDecision] = useState<string | null>(null);

  if (!bidder) {
    return (
      <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F7F6F2" }}>
        <OfficerHeader tenders={TENDERS} activeTenderId={activeTenderId} onSelectTender={onSelectTender} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-base font-semibold text-[#171E27] mb-2">Bidder Dossier Not Found</p>
          <p className="text-sm text-[#5B6B7D] mb-4">The requested bidder identifier does not exist in the active evaluation matrix.</p>
          <Link to="/officer/dashboard" className="text-sm font-semibold text-[#1F7A5C] hover:underline">
            &larr; Return to Compliance Dashboard
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const bidderHistory = logs.filter((l) => l.bidder === bidder.name);

  function handleDecision(label: string, detail: string) {
    if (!bidder) return;
    setDecision(label);
    addLog({
      bidder: bidder.name,
      event: `Officer ${label.toLowerCase()}`,
      actor: "Procurement Officer",
      detail: `${detail} (Tender ${currentTender.ref})`,
    });
  }

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F7F6F2" }}>
      <OfficerHeader tenders={TENDERS} activeTenderId={activeTenderId} onSelectTender={onSelectTender} />

      <div className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-8 py-8">
        <button
          onClick={() => navigate("/officer/dashboard")}
          className="text-xs font-semibold mb-6 flex items-center gap-1.5 cursor-pointer text-[#5B6B7D] hover:text-[#171E27]"
        >
          &larr; Back to Compliance Dashboard
        </button>

        {/* Top Header Card */}
        <div className="p-6 rounded bg-white border border-[#DCD7CB] mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#FAF9F6] text-[#5B6B7D] border border-[#EDEAE1]">
              Tender Ref: {currentTender.ref} &middot; {currentTender.title}
            </span>
            <span className="text-xs text-[#8A96A3]">Evaluated against {currentTender.department} specifications</span>
          </div>

          <h1 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-2xl md:text-3xl font-bold mb-1">
            {bidder.name}
          </h1>
          <p className="text-xs font-mono text-[#5B6B7D] mb-4">GSTIN: {bidder.gstin}</p>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#EDEAE1]">
            <ScoreBar score={bidder.score} wide />
            <RiskBadge risk={bidder.risk} />
            <StatusBadge status={bidder.status} />
            <span className="text-xs text-[#8A96A3] ml-auto">
              Last automated check: {bidder.lastChecked}
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main 2-column content */}
          <div className="md:col-span-2 space-y-6">
            {/* Checklist */}
            <div className="p-6 rounded bg-white border border-[#DCD7CB]">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-xl font-bold">
                  Statutory &amp; Tender Checklist
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EEF5F1] text-[#1F7A5C]">
                  {bidder.checks.filter((c) => c.status === "verified").length} / {bidder.checks.length} Cleared
                </span>
              </div>

              <div className="space-y-2.5">
                {bidder.checks.map((c) => (
                  <div
                    key={c.label}
                    className="p-3.5 rounded text-sm transition-colors"
                    style={{
                      border: `1px solid ${c.status === "verified" ? "#EDEAE1" : "#F0DEC6"}`,
                      backgroundColor: c.status === "verified" ? "#FFFFFF" : "#FDF8F0",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#171E27]">{c.label}</span>
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

            {/* Bidder History Log */}
            <div className="p-6 rounded bg-white border border-[#DCD7CB]">
              <h2 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-xl font-bold mb-3">
                Audit Timeline for This Bidder
              </h2>
              {bidderHistory.length === 0 ? (
                <p className="text-xs text-[#8A96A3]">No historical procurement events logged for this bidder yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {bidderHistory.map((l) => (
                    <div key={l.id} className="p-3 rounded bg-[#FAF9F6] border border-[#EDEAE1]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#171E27]">{l.event}</span>
                        <span className="text-xs text-[#8A96A3]">{l.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#5B6B7D]">
                        Actor: <span className="font-medium text-[#171E27]">{l.actor}</span> &middot; {l.detail}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: BidSure AI Advisory & Officer Actions */}
          <div className="md:col-span-1 space-y-6">
            <div
              className="p-5 rounded"
              style={{
                borderLeft: `4px solid ${bidder.status === "Cleared" ? "#1F7A5C" : "#B8752E"}`,
                backgroundColor: "#FFFFFF",
                borderTop: "1px solid #DCD7CB",
                borderRight: "1px solid #DCD7CB",
                borderBottom: "1px solid #DCD7CB",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#1F7A5C]" />
                <p className="text-xs font-semibold text-[#171E27]">BidSure AI Advisory Recommendation</p>
              </div>
              <p className="text-xs leading-relaxed text-[#3E4C59]">{bidder.recommendation}</p>
            </div>

            <div className="p-5 rounded bg-white border border-[#DCD7CB]">
              <p className="text-xs uppercase tracking-wider font-semibold text-[#5B6B7D] mb-3">
                Officer Qualification Verdict
              </p>

              {decision ? (
                <div className="p-3.5 rounded bg-[#EEF5F1] border border-[#BDE0D2] text-[#1F7A5C] text-xs font-semibold">
                  &check; Marked as {decision}. Recorded in the audit repository.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => handleDecision("Approved", "Approved for commercial opening.")}
                    className="w-full py-2.5 text-xs font-semibold rounded text-white cursor-pointer shadow-xs transition-all"
                    style={{ backgroundColor: "#1F7A5C" }}
                  >
                    Qualify &amp; Approve
                  </button>
                  <button
                    onClick={() => handleDecision("Documents Requested", "Notice issued for supplementary statutory proof.")}
                    className="w-full py-2.5 text-xs font-semibold rounded cursor-pointer transition-all"
                    style={{ border: "1px solid #DCD7CB", color: "#171E27", backgroundColor: "#FFFFFF" }}
                  >
                    Request Documents
                  </button>
                  <button
                    onClick={() => handleDecision("Rejected", "Disqualified due to unfulfilled eligibility criteria.")}
                    className="w-full py-2.5 text-xs font-semibold rounded cursor-pointer transition-all"
                    style={{ border: "1px solid #F0C4C4", color: "#973434", backgroundColor: "#FDF5F5" }}
                  >
                    Reject Bidder
                  </button>
                </div>
              )}

              <p className="text-[11px] text-[#8A96A3] mt-4 leading-normal">
                Human-in-the-loop: BidSure AI provides decision-support verification. Qualification authority remains exclusively with the Procurement Officer.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
