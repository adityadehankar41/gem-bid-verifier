import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OfficerHeader from "../components/OfficerHeader";
import Footer from "../components/Footer";
import { SearchIcon, ShieldCheckIcon } from "../components/icons";
import { Bidder, DocumentScoreItem } from "../data/bidders";
import { useBidderContext } from "../context/BidderContext";

export default function VerifiedBidders() {
  const navigate = useNavigate();
  const { getAllBidders, updateBidderStatus, resetBiddersToDefault, customBidders } = useBidderContext();
  const [search, setSearch] = useState("");

  // Modal for reject / request doc
  const [decisionModal, setDecisionModal] = useState<{
    bidder: Bidder;
    type: "reject" | "request";
  } | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  // Modal to inspect document-by-document scores
  const [breakdownModalBidder, setBreakdownModalBidder] = useState<Bidder | null>(null);

  const allBidders = getAllBidders();
  const verifiedBidders = allBidders.filter((b) => b.isAiVerified);

  const filtered = verifiedBidders.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAcceptBid = (bidder: Bidder) => {
    updateBidderStatus(
      bidder.id,
      "Verified",
      "All statutory credentials and certificates verified and accepted by the Procurement Officer."
    );
  };

  const handleConfirmModalDecision = () => {
    if (!decisionModal) return;
    const { bidder, type } = decisionModal;
    const message =
      reasonInput.trim() ||
      (type === "reject"
        ? "Disqualified due to statutory non-compliance or credential mismatch."
        : "Missing or incomplete documents. Please upload the required statutory certificates.");

    if (type === "reject") {
      updateBidderStatus(bidder.id, "Rejected", message);
    } else {
      updateBidderStatus(bidder.id, "Documents Requested", message);
    }

    setDecisionModal(null);
    setReasonInput("");
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F7F6F2" }}>
      <OfficerHeader />

      <div className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-8 py-8">
        {/* Top Navigation & Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => navigate("/officer/dashboard")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-white border border-[#DCD7CB] text-[#171E27] hover:bg-[#EDEAE1] transition-colors cursor-pointer shadow-2xs"
              >
                &larr; Return to Dashboard
              </button>
              <span className="text-xs text-[#8A96A3]">|</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#EEF5F1] text-[#1F7A5C] border border-[#BDE0D2]">
                {verifiedBidders.length} Verified Bidders
              </span>
            </div>

            <h1
              style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }}
              className="text-2xl md:text-3xl font-bold"
            >
              Verified Bidders
            </h1>
            <p className="text-sm text-[#5B6B7D] mt-1">
              AI verification completed. Record official procurement determinations for each verified bid.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {customBidders.length > 0 && (
              <button
                type="button"
                onClick={resetBiddersToDefault}
                className="text-xs px-3 py-2 rounded bg-white border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#EDEAE1] transition-colors cursor-pointer font-medium"
                title="Reset all test submissions"
              >
                Reset Live Data
              </button>
            )}
            <Link
              to="/officer/dashboard"
              className="text-xs font-semibold px-4 py-2 rounded bg-[#0F1B2D] text-white hover:bg-[#1C2C42] transition-colors shadow-2xs text-decoration-none"
            >
              + Verify More Bids
            </Link>
          </div>
        </div>

        {/* Search Filter */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A96A3]">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search verified bidders by company name..."
              aria-label="Search verified bidders"
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

        {/* Verified Bidders Table */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded border border-[#DCD7CB] shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#DCD7CB] flex items-center justify-center mx-auto mb-3 text-[#8A96A3]">
              <ShieldCheckIcon size={24} />
            </div>
            <p className="text-base font-semibold text-[#171E27]">No verified bidders found</p>
            <p className="text-xs text-[#8A96A3] mt-1 max-w-md mx-auto mb-5">
              {verifiedBidders.length === 0
                ? "No bids have completed AI verification yet. Go to the dashboard to run verification on pending bids."
                : "No verified bidders match your search query."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/officer/dashboard")}
              className="text-xs font-semibold px-5 py-2.5 rounded bg-[#171E27] text-white hover:bg-[#2A3747] transition-colors cursor-pointer shadow-xs"
            >
              &larr; Return to Dashboard to Verify Bids
            </button>
          </div>
        ) : (
          <div className="rounded overflow-hidden bg-white border border-[#DCD7CB] shadow-2xs">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#DCD7CB]">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5B6B7D] uppercase tracking-wider">
                    Bidder
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-[#5B6B7D] uppercase tracking-wider">
                    Compliance Score
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#5B6B7D] uppercase tracking-wider">
                    Officer Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const scoreVal = b.complianceScore || b.score || 92;
                  const decision = b.officerDecision;

                  return (
                    <tr
                      key={b.id}
                      className="transition-colors hover:bg-[#F9F8F5] border-b border-[#EDEAE1] last:border-b-0"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#171E27] text-base block">
                          {b.name}
                        </span>
                        {decision && (
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-[11px] font-bold px-2.5 py-0.5 rounded"
                              style={{
                                backgroundColor:
                                  decision === "Verified"
                                    ? "#EEF5F1"
                                    : decision === "Rejected"
                                    ? "#FDF2F2"
                                    : "#FFF6EB",
                                color:
                                  decision === "Verified"
                                    ? "#1F7A5C"
                                    : decision === "Rejected"
                                    ? "#B23A3A"
                                    : "#B8752E",
                                border: `1px solid ${
                                  decision === "Verified"
                                    ? "#BDE0D2"
                                    : decision === "Rejected"
                                    ? "#F5C2C2"
                                    : "#F5D6B3"
                                }`,
                              }}
                            >
                              Decision: {decision}
                            </span>
                            {b.feedbackMessage && (
                              <span className="text-[11px] text-[#5B6B7D] italic truncate max-w-xs" title={b.feedbackMessage}>
                                "{b.feedbackMessage}"
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => setBreakdownModalBidder(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#DCD7CB] hover:border-[#1F7A5C] cursor-pointer transition-colors"
                            title="Click to view score breakdown per document"
                          >
                            <span className="text-base font-bold font-mono text-[#171E27]">
                              {scoreVal}
                            </span>
                            <span className="text-xs text-[#8A96A3]">/ 100</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBreakdownModalBidder(b)}
                            className="text-[10px] text-[#1F7A5C] hover:underline mt-0.5 cursor-pointer"
                          >
                            View Docs
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptBid(b)}
                            className="text-xs font-semibold px-3 py-1.5 rounded cursor-pointer transition-all shadow-2xs"
                            style={{
                              backgroundColor: decision === "Verified" ? "#1F7A5C" : "#EEF5F1",
                              color: decision === "Verified" ? "#FFFFFF" : "#1F7A5C",
                              border: "1px solid #BDE0D2",
                            }}
                            title="Accept and qualify bidder"
                          >
                            {decision === "Verified" ? "✓ Accepted" : "Accept"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDecisionModal({ bidder: b, type: "reject" });
                              setReasonInput(
                                "Disqualified due to statutory non-compliance or credential mismatch."
                              );
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded cursor-pointer transition-all shadow-2xs"
                            style={{
                              backgroundColor: decision === "Rejected" ? "#B23A3A" : "#FDF2F2",
                              color: decision === "Rejected" ? "#FFFFFF" : "#B23A3A",
                              border: "1px solid #F5C2C2",
                            }}
                            title="Reject bidder"
                          >
                            {decision === "Rejected" ? "✕ Rejected" : "Reject"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDecisionModal({ bidder: b, type: "request" });
                              setReasonInput(
                                "Missing or incomplete documents. Please upload required statutory records."
                              );
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded cursor-pointer transition-all shadow-2xs"
                            style={{
                              backgroundColor: decision === "Documents Requested" ? "#B8752E" : "#FFF6EB",
                              color: decision === "Documents Requested" ? "#FFFFFF" : "#B8752E",
                              border: "1px solid #F5D6B3",
                            }}
                            title="Request additional statutory documents"
                          >
                            {decision === "Documents Requested" ? "! Docs Requested" : "Request Doc"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal for Reject or Request Doc */}
      {decisionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full p-6 border border-[#DCD7CB] shadow-xl">
            <h3
              style={{ fontFamily: "'Fraunces', serif" }}
              className="text-lg font-bold text-[#171E27] mb-1"
            >
              {decisionModal.type === "reject"
                ? "Disqualify / Reject Bid"
                : "Request Supplementary Documents"}
            </h3>
            <p className="text-xs text-[#5B6B7D] mb-4">
              Bidder: <strong>{decisionModal.bidder.name}</strong>. This notice will be transmitted directly to the bidder portal.
            </p>

            <label className="block text-xs font-semibold text-[#171E27] mb-1.5">
              {decisionModal.type === "reject"
                ? "Reason for Rejection:"
                : "Specify Required Documents / Instructions:"}
            </label>
            <textarea
              rows={3}
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              className="w-full p-2.5 text-xs rounded border border-[#DCD7CB] text-[#171E27] outline-none mb-4 focus:border-[#1F7A5C]"
              placeholder="Enter specific feedback or requirements for the bidder..."
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#FAF9F6] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmModalDecision}
                className="px-4 py-2 text-xs font-semibold rounded text-white cursor-pointer"
                style={{
                  backgroundColor: decisionModal.type === "reject" ? "#B23A3A" : "#B8752E",
                }}
              >
                {decisionModal.type === "reject" ? "Confirm Rejection" : "Send Document Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Score Breakdown Modal */}
      {breakdownModalBidder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-lg w-full p-6 border border-[#DCD7CB] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] uppercase font-bold text-[#1F7A5C] tracking-wider block">
                  AI Document Audit Dossier
                </span>
                <h3
                  style={{ fontFamily: "'Fraunces', serif" }}
                  className="text-lg font-bold text-[#171E27]"
                >
                  {breakdownModalBidder.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBreakdownModalBidder(null)}
                className="text-[#8A96A3] hover:text-[#171E27] text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 mb-5">
              {(breakdownModalBidder.documentScores || [
                { id: "1", name: "Udyam Registration Certificate (PDF)", score: 96, detail: "MSME classification verified on Udyam portal." },
                { id: "2", name: "GST Registration Certificate & Latest GSTR-3B", score: 92, detail: "Active GSTIN with regular return filings." },
                { id: "3", name: "PAN Card of Entity / Authorized Signatory", score: 98, detail: "Matched with CBDT and MCA21 database." },
                { id: "4", name: "Income Tax Returns Acknowledgement (AY 2025-26)", score: 90, detail: "Verified electronic verification code." },
              ]).map((doc) => (
                <div
                  key={doc.id || doc.name}
                  className="p-3 rounded bg-[#FAF9F6] border border-[#EDEAE1] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#171E27]">{doc.name}</p>
                    {doc.detail && <p className="text-[11px] text-[#5B6B7D] mt-0.5">{doc.detail}</p>}
                  </div>
                  <div className="px-2.5 py-1 rounded bg-white border border-[#BDE0D2] font-mono font-bold text-[#1F7A5C] text-xs">
                    {doc.score} / 100
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-[#EEF5F1] border border-[#BDE0D2] mb-5 text-xs">
              <span className="font-bold text-[#171E27]">Overall Total Compliance Score:</span>
              <span className="text-base font-bold font-mono text-[#1F7A5C]">
                {breakdownModalBidder.complianceScore || breakdownModalBidder.score} / 100
              </span>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setBreakdownModalBidder(null)}
                className="px-4 py-2 text-xs font-semibold rounded bg-[#171E27] text-white hover:bg-[#2A3747] cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
