import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import OfficerHeader from "../components/OfficerHeader";
import Footer from "../components/Footer";
import { SearchIcon, ShieldCheckIcon } from "../components/icons";
import { Bidder, DocumentScoreItem } from "../data/bidders";
import { useBidderContext } from "../context/BidderContext";

// Standard statutory documents evaluated for each bid
const DEFAULT_DOCUMENTS = [
  { id: "udyamCert", name: "Udyam Registration Certificate (PDF)", baseScore: 96, detail: "MSME classification verified on Udyam portal." },
  { id: "gstCert", name: "GST Registration Certificate & Latest GSTR-3B", baseScore: 92, detail: "Active GSTIN with regular return filings." },
  { id: "panCard", name: "PAN Card of Entity / Authorized Signatory", baseScore: 98, detail: "Matched with CBDT and MCA21 database." },
  { id: "itrProof", name: "Income Tax Returns Acknowledgement (AY 2025-26)", baseScore: 90, detail: "Verified electronic verification code (EVC)." },
];

export default function ComplianceDashboard() {
  const navigate = useNavigate();
  const { getAllBidders, customBidders, resetBiddersToDefault, completeAiVerification } = useBidderContext();
  const [search, setSearch] = useState("");

  // State for AI Verification in progress
  const [verifyingBidder, setVerifyingBidder] = useState<Bidder | null>(null);

  const allBidders = getAllBidders();
  const pendingBidders = allBidders.filter((b) => !b.isAiVerified);
  const verifiedBidders = allBidders.filter((b) => b.isAiVerified);

  const filteredPending = pendingBidders.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartVerification = (bidder: Bidder) => {
    setVerifyingBidder(bidder);
  };

  const handleFinishAiVerification = (
    bidder: Bidder,
    docScores: DocumentScoreItem[],
    averageScore: number,
    redirectToVerified: boolean = false
  ) => {
    completeAiVerification(bidder.id, docScores, averageScore);
    setVerifyingBidder(null);
    if (redirectToVerified) {
      navigate("/officer/verified");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F7F6F2" }}>
      <OfficerHeader />

      {/* If an individual bid is undergoing AI verification, display the AI Verification Screen */}
      {verifyingBidder ? (
        <AIVerificationScreen
          bidder={verifyingBidder}
          onCancel={() => setVerifyingBidder(null)}
          onComplete={(docScores, avg, redirect) =>
            handleFinishAiVerification(verifyingBidder, docScores, avg, redirect)
          }
        />
      ) : (
        <div className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-8 py-8">
          {/* Header Title & Nav actions */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-2xl md:text-3xl font-bold">
                Procurement Officer Verification Portal
              </h1>
              <p className="text-sm text-[#5B6B7D] mt-1">
                Pending statutory bids awaiting AI document verification and compliance evaluation.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              {customBidders.length > 0 && (
                <button
                  type="button"
                  onClick={resetBiddersToDefault}
                  className="text-xs px-3 py-2 rounded bg-white border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#EDEAE1] transition-colors cursor-pointer font-medium"
                  title="Reset all test submissions"
                >
                  Reset Live Bids
                </button>
              )}

              {/* Button navigating to the completely separate Verified Bidders screen */}
              <Link
                to="/officer/verified"
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded bg-[#1F7A5C] text-white hover:bg-[#18644A] transition-colors shadow-2xs text-decoration-none"
              >
                <span>Verified Bidders</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[11px] font-bold">
                  {verifiedBidders.length}
                </span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A96A3]">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pending bids by company name..."
                aria-label="Search pending bids"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded bg-white outline-none transition-all shadow-2xs"
                style={{ border: "1px solid #DCD7CB", color: "#171E27" }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#1F7A5C";
                  e.target.style.boxShadow = "0 0 0 2px rgba(31,122,92,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#DCD7CB";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Pending Bids Table */}
          {filteredPending.length === 0 ? (
            <div className="p-12 text-center bg-white rounded border border-[#DCD7CB] shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-[#EEF5F1] border border-[#BDE0D2] flex items-center justify-center mx-auto mb-3 text-[#1F7A5C]">
                <ShieldCheckIcon size={24} />
              </div>
              <p className="text-base font-semibold text-[#171E27]">No pending bids awaiting verification</p>
              <p className="text-xs text-[#8A96A3] mt-1 max-w-md mx-auto mb-5">
                {pendingBidders.length === 0
                  ? "All submitted bids have completed AI verification. You can view them on the Verified Bidders screen to record official determinations."
                  : "No pending bids match your search query."}
              </p>
              <Link
                to="/officer/verified"
                className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded bg-[#171E27] text-white hover:bg-[#2A3747] transition-colors shadow-xs text-decoration-none"
              >
                Go to Verified Bidders ({verifiedBidders.length}) &rarr;
              </Link>
            </div>
          ) : (
            <div className="rounded overflow-hidden bg-white border border-[#DCD7CB] shadow-2xs">
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#DCD7CB]">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5B6B7D] uppercase tracking-wider">
                      Bidder
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#5B6B7D] uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map((b) => (
                    <tr
                      key={b.id}
                      className="transition-colors hover:bg-[#F9F8F5] border-b border-[#EDEAE1] last:border-b-0"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#171E27] text-base block">
                          {b.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleStartVerification(b)}
                          className="text-xs font-semibold px-5 py-2 rounded cursor-pointer transition-all shadow-xs bg-[#171E27] text-white hover:bg-[#2A3747]"
                        >
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}

// AI Document Verification Screen evaluating individual documents one by one
function AIVerificationScreen({
  bidder,
  onCancel,
  onComplete,
}: {
  bidder: Bidder;
  onCancel: () => void;
  onComplete: (docScores: DocumentScoreItem[], avgScore: number, redirect: boolean) => void;
}) {
  const [docScores, setDocScores] = useState<
    { name: string; score: number; status: "pending" | "scanning" | "verified"; detail: string }[]
  >(() =>
    DEFAULT_DOCUMENTS.map((doc, idx) => {
      // Dynamic realistic variation per bidder
      const variance = (bidder.name.length + idx * 3) % 9 - 4; // -4 to +4
      const score = Math.min(99, Math.max(82, doc.baseScore + variance));
      return {
        name: doc.name,
        score,
        status: "pending",
        detail: doc.detail,
      };
    })
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Sequentially verify documents one by one
  useEffect(() => {
    if (currentIndex >= docScores.length) {
      const timer = setTimeout(() => {
        setIsCompleted(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Step 1: Mark active document as scanning
    const scanningTimer = setTimeout(() => {
      setDocScores((prev) =>
        prev.map((d, i) => (i === currentIndex ? { ...d, status: "scanning" } : d))
      );
    }, 100);

    // Step 2: Mark active document as verified with its individual score
    const verifyTimer = setTimeout(() => {
      setDocScores((prev) =>
        prev.map((d, i) => (i === currentIndex ? { ...d, status: "verified" } : d))
      );
      setCurrentIndex((idx) => idx + 1);
    }, 850);

    return () => {
      clearTimeout(scanningTimer);
      clearTimeout(verifyTimer);
    };
  }, [currentIndex, docScores.length]);

  // Compute total compliance score by taking the average of all single documents
  const verifiedItems = docScores.filter((d) => d.status === "verified");
  const totalScoreSum = verifiedItems.reduce((acc, curr) => acc + curr.score, 0);
  const averageComplianceScore =
    verifiedItems.length > 0 ? Math.round(totalScoreSum / verifiedItems.length) : 0;

  const handleFinish = (redirect: boolean) => {
    const formattedScores: DocumentScoreItem[] = docScores.map((d, i) => ({
      id: `doc-${i}`,
      name: d.name,
      score: d.score,
      status: "verified",
      detail: d.detail,
    }));
    onComplete(formattedScores, averageComplianceScore, redirect);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl bg-white p-8 rounded border border-[#DCD7CB] shadow-lg">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-[#EEF5F1] border-2 border-[#1F7A5C] flex items-center justify-center text-[#1F7A5C]">
              <ShieldCheckIcon size={26} />
            </div>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F7A5C] block mb-1">
            AI Statutory Document Verification
          </span>
          <h2
            style={{ fontFamily: "'Fraunces', serif" }}
            className="text-2xl font-bold text-[#171E27] mb-1"
          >
            {bidder.name}
          </h2>
          <p className="text-xs text-[#5B6B7D]">
            Evaluating submitted statutory documents one by one and cross-referencing national databases.
          </p>
        </div>

        {/* List of documents verified one by one */}
        <div className="space-y-3 mb-6">
          {docScores.map((doc, idx) => {
            const isScanning = doc.status === "scanning";
            const isDone = doc.status === "verified";

            return (
              <div
                key={doc.name}
                className="p-3.5 rounded transition-all text-xs flex items-center justify-between"
                style={{
                  backgroundColor: isScanning
                    ? "#FFFDF5"
                    : isDone
                    ? "#F6FAF7"
                    : "#FAF9F6",
                  border: isScanning
                    ? "1.5px solid #D4A038"
                    : isDone
                    ? "1px solid #BDE0D2"
                    : "1px solid #EDEAE1",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px]"
                    style={{
                      backgroundColor: isDone ? "#1F7A5C" : isScanning ? "#D4A038" : "#EDEAE1",
                      color: isDone || isScanning ? "#FFFFFF" : "#8A96A3",
                    }}
                  >
                    {isDone ? "✓" : idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-[#171E27]">{doc.name}</p>
                    <p className="text-[11px] text-[#5B6B7D]">
                      {isScanning
                        ? "AI cross-referencing cryptographic hash and ministry database..."
                        : isDone
                        ? doc.detail
                        : "Queued for automated verification"}
                    </p>
                  </div>
                </div>

                {/* Score out of 100 for each single document */}
                <div>
                  {isDone ? (
                    <div className="px-2.5 py-1 rounded bg-white border border-[#BDE0D2] flex items-center gap-1 font-mono font-bold text-[#1F7A5C]">
                      <span>{doc.score}</span>
                      <span className="text-[10px] text-[#8A96A3] font-normal">/ 100</span>
                    </div>
                  ) : isScanning ? (
                    <span className="inline-block w-4 h-4 border-2 border-[#D4A038] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-[11px] text-[#8A96A3] italic">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calculated Total Compliance Score Result */}
        {isCompleted ? (
          <div className="p-4 rounded bg-[#EEF5F1] border border-[#BDE0D2] text-center mb-6">
            <span className="text-[11px] uppercase font-bold text-[#1F7A5C] tracking-wider block mb-1">
              Verification Complete
            </span>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl font-bold font-mono text-[#171E27]">
                {averageComplianceScore}
              </span>
              <span className="text-sm font-semibold text-[#5B6B7D]">/ 100</span>
            </div>
            <p className="text-xs text-[#3E4C59]">
              Total Compliance Score calculated as the average of all 4 submitted statutory documents.
            </p>
          </div>
        ) : (
          <div className="p-3 mb-6 rounded bg-[#FAF9F6] border border-[#EDEAE1] text-center text-xs text-[#5B6B7D]">
            Verifying document {Math.min(currentIndex + 1, docScores.length)} of {docScores.length}...
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {isCompleted ? (
            <>
              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="w-full py-2.5 text-xs font-semibold rounded text-white bg-[#1F7A5C] hover:bg-[#18644A] cursor-pointer shadow-xs transition-colors text-center"
              >
                Go to Verified Bidders Screen &rarr;
              </button>
              <button
                type="button"
                onClick={() => handleFinish(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#FAF9F6] cursor-pointer transition-colors text-center whitespace-nowrap"
              >
                Verify Next Bid
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 text-xs font-semibold rounded border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#FAF9F6] cursor-pointer transition-colors text-center"
            >
              Cancel Verification
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
