import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import OfficerHeader from "../components/OfficerHeader";
import Footer from "../components/Footer";
import { SearchIcon, ShieldCheckIcon } from "../components/icons";
import { Bidder, DocumentScoreItem } from "../data/bidders";
import { useBidderContext } from "../context/BidderContext";
import {
  performBackendDocumentVerification,
  STATUTORY_DOCUMENT_SPECS,
} from "../services/backendVerificationService";

export default function ComplianceDashboard() {
  const navigate = useNavigate();
  const {
    getAllBidders,
    customBidders,
    resetBiddersToDefault,
    completeAiVerification,
    markBidderBlacklisted,
  } = useBidderContext();
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
    if (redirectToVerified) {
      setVerifyingBidder(null);
      navigate("/officer/verified");
    } else {
      // Find the next unverified bidder
      const remaining = allBidders.filter((b) => b.id !== bidder.id && !b.isAiVerified);
      if (remaining.length > 0) {
        setVerifyingBidder(remaining[0]);
      } else {
        setVerifyingBidder(null);
      }
    }
  };

  const handleBlacklistBidder = (
    bidder: Bidder,
    docScores: DocumentScoreItem[],
    reason: string
  ) => {
    markBidderBlacklisted(bidder.id, docScores, reason);
    setVerifyingBidder(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F7F6F2" }}>
      <OfficerHeader />

      {/* If an individual bid is undergoing AI verification, display the AI Verification Screen */}
      {verifyingBidder ? (
        <AIVerificationScreen
          bidder={verifyingBidder}
          onCancel={() => setVerifyingBidder(null)}
          onBlacklist={(docScores, reason) =>
            handleBlacklistBidder(verifyingBidder, docScores, reason)
          }
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

// AI Document Verification Screen evaluating individual documents via backend verification
function AIVerificationScreen({
  bidder,
  onCancel,
  onComplete,
  onBlacklist,
}: {
  bidder: Bidder;
  onCancel: () => void;
  onComplete: (docScores: DocumentScoreItem[], avgScore: number, redirect: boolean) => void;
  onBlacklist: (docScores: DocumentScoreItem[], reason: string) => void;
}) {
  const [docScores, setDocScores] = useState<
    {
      id: string;
      name: string;
      score: number | null;
      status: "pending" | "scanning" | "verified" | "flagged" | "blacklisted" | "halted";
      detail: string;
      isBlacklisted?: boolean;
    }[]
  >(() =>
    STATUTORY_DOCUMENT_SPECS.map((spec) => {
      const existing = bidder.documentScores?.find((d) => d.id === spec.id);
      const attachedDoc = bidder.attachedDocuments?.find(
        (d) => d.id === spec.id || d.documentType === spec.id || d.name.toLowerCase().includes(spec.id.toLowerCase())
      );
      const existingStatus = existing?.status || "pending";
      return {
        id: spec.id,
        name: spec.name,
        score: existing ? (existing.score ?? null) : null,
        status: existingStatus as any,
        detail: existing
          ? existing.detail || spec.defaultDetail
          : attachedDoc
          ? `Uploaded document "${attachedDoc.name}" (${(attachedDoc.size / 1024).toFixed(0)} KB). Packaged in backend payload.`
          : spec.defaultDetail,
        isBlacklisted: existing?.isBlacklisted || existingStatus === "blacklisted",
      };
    })
  );

  const [isLoadingBackend, setIsLoadingBackend] = useState(true);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendScores, setBackendScores] = useState<DocumentScoreItem[] | null>(
    bidder.documentScores && bidder.documentScores.length > 0 ? bidder.documentScores : null
  );
  const [backendAvgScore, setBackendAvgScore] = useState<number>(bidder.complianceScore || 0);
  const [isCompleted, setIsCompleted] = useState<boolean>(
    Boolean(bidder.isAiVerified && bidder.documentScores && bidder.documentScores.length > 0)
  );
  const [isBlacklisted, setIsBlacklisted] = useState<boolean>(Boolean(bidder.isBlacklisted));
  const [blacklistedReason, setBlacklistedReason] = useState<string | null>(
    bidder.feedbackMessage || null
  );

  // Trigger backend document verification API call
  const triggerBackendVerification = () => {
    setIsLoadingBackend(true);
    setBackendError(null);
    setBackendMessage(null);

    performBackendDocumentVerification(bidder)
      .then((res) => {
        setIsLoadingBackend(false);

        const rawScores = res.documentScores;
        const isOverallBlacklisted =
          res.status === "blacklisted" ||
          (res.status as string) === "black listed" ||
          res.isBlacklisted === true;

        let blacklistedIdx = -1;
        if (rawScores && Array.isArray(rawScores)) {
          blacklistedIdx = rawScores.findIndex(
            (d: any) =>
              d.status === "blacklisted" ||
              d.status === "black listed" ||
              d.isBlacklisted === true ||
              (typeof d.detail === "string" && d.detail.toLowerCase().includes("blacklist"))
          );
        }

        // Handle case where backend returns "blacklisted" for a single document or entire entity
        if (isOverallBlacklisted || blacklistedIdx >= 0) {
          setIsBlacklisted(true);
          setIsCompleted(true);
          const reason =
            res.blacklistedReason ||
            (blacklistedIdx >= 0 && rawScores ? rawScores[blacklistedIdx].detail : null) ||
            res.message ||
            "Vendor or statutory credential flagged as Blacklisted in statutory debarment database.";
          setBlacklistedReason(reason);

          const targetIdx = blacklistedIdx >= 0 ? blacklistedIdx : 0;
          const mappedDocs = STATUTORY_DOCUMENT_SPECS.map((spec, idx) => {
            const rawDoc = rawScores?.find((d) => d.id === spec.id) || (rawScores && rawScores[idx]);
            if (idx < targetIdx) {
              return {
                id: spec.id,
                name: spec.name,
                score: rawDoc?.score ?? null,
                status: (rawDoc?.status === "flagged" ? "flagged" : "verified") as "verified" | "flagged",
                detail: rawDoc?.detail || spec.defaultDetail,
              };
            } else if (idx === targetIdx) {
              return {
                id: spec.id,
                name: spec.name,
                score: null, // Scoring NOT given to blacklisted document
                status: "blacklisted" as const,
                detail:
                  rawDoc?.detail ||
                  res.blacklistedReason ||
                  "Matched national statutory blacklist registry (CVC / MSME / GSTN). Debarred from procurement.",
                isBlacklisted: true,
              };
            } else {
              // Further verification process stops here
              return {
                id: spec.id,
                name: spec.name,
                score: null,
                status: "halted" as const,
                detail: "Verification process stopped: Prior statutory document triggered blacklisting.",
              };
            }
          });

          setDocScores(mappedDocs);
          setBackendScores(mappedDocs);
          return;
        }

        // Standard verification response from backend
        if (
          rawScores &&
          Array.isArray(rawScores) &&
          rawScores.length > 0 &&
          typeof res.complianceScore === "number"
        ) {
          setBackendScores(rawScores);
          setBackendAvgScore(res.complianceScore);
          setIsCompleted(true);
          setIsBlacklisted(false);
          setDocScores(
            rawScores.map((d) => ({
              id: d.id,
              name: d.name,
              score: d.score ?? null,
              status: (d.status === "flagged" ? "flagged" : "verified") as any,
              detail: d.detail || "Verified by backend statutory engine",
            }))
          );
        } else {
          // Backend endpoint acknowledged the documents; awaiting backend team's scoring pipeline
          setBackendMessage(
            res.message || "Attached statutory documents and credentials delivered to POST /api/verify-documents."
          );
        }
      })
      .catch((err) => {
        setIsLoadingBackend(false);
        setBackendError(err?.message || "Failed to reach backend verification API");
      });
  };

  useEffect(() => {
    if (!isCompleted) {
      triggerBackendVerification();
    } else {
      setIsLoadingBackend(false);
    }
  }, [bidder]);

  const handleFinish = (redirect: boolean) => {
    if (isBlacklisted && backendScores) {
      onBlacklist(backendScores, blacklistedReason || "Debarred in statutory verification.");
      return;
    }

    if (backendScores && backendScores.length > 0 && typeof backendAvgScore === "number") {
      onComplete(backendScores, backendAvgScore, redirect);
    } else {
      onCancel();
    }
  };

  const handleRecordBlacklist = () => {
    const scoresToRecord =
      backendScores && backendScores.length > 0
        ? backendScores
        : docScores.map((d) => ({
            id: d.id,
            name: d.name,
            score: null,
            status: d.status as any,
            detail: d.detail,
          }));
    onBlacklist(scoresToRecord, blacklistedReason || "Debarred in statutory document verification.");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl bg-white p-8 rounded border border-[#DCD7CB] shadow-lg">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isBlacklisted ? "#FDF3F3" : "#EEF5F1",
                border: isBlacklisted ? "2px solid #8A2525" : "2px solid #1F7A5C",
                color: isBlacklisted ? "#8A2525" : "#1F7A5C",
              }}
            >
              <ShieldCheckIcon size={26} />
            </div>
          </div>
          <span
            className="text-[11px] font-bold uppercase tracking-wider block mb-1"
            style={{ color: isBlacklisted ? "#8A2525" : "#1F7A5C" }}
          >
            {isBlacklisted ? "Statutory Verification Terminated" : "AI Statutory Document Verification"}
          </span>
          <h2
            style={{ fontFamily: "'Fraunces', serif" }}
            className="text-2xl font-bold text-[#171E27] mb-1"
          >
            {bidder.name}
          </h2>
          <p className="text-xs text-[#5B6B7D]">
            {isBlacklisted
              ? "Debarred / Blacklisted status identified. Verification stopped and score withheld."
              : "Statutory documents and vendor credentials delivered to backend verification endpoint."}
          </p>
        </div>

        {/* Backend Info / Status Banner */}
        {backendMessage && !isBlacklisted && (
          <div className="mb-6 p-4 rounded bg-[#FAF9F6] border border-[#EDEAE1] text-xs text-[#5B6B7D]">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#1F7A5C]" />
              <p className="font-semibold text-[#171E27]">Backend Interface Connected</p>
            </div>
            <p className="text-[11px] mb-1">{backendMessage}</p>
            <p className="text-[11px] text-[#8A96A3]">
              Endpoint: <code className="bg-[#EDEAE1] px-1 py-0.5 rounded text-[#171E27]">POST /api/verify-documents</code>
            </p>
          </div>
        )}

        {/* Backend Error Banner if API fails */}
        {backendError && (
          <div className="mb-6 p-4 rounded bg-[#FDF3F3] border border-[#F0B8B8] text-xs text-[#8A2525]">
            <p className="font-semibold mb-1">Backend Connection Notice:</p>
            <p className="text-[11px] mb-3">{backendError}</p>
            <button
              type="button"
              onClick={triggerBackendVerification}
              className="px-3 py-1.5 rounded bg-[#8A2525] text-white font-medium text-xs hover:bg-[#6E1C1C] transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* List of documents */}
        <div className="space-y-3 mb-6">
          {docScores.map((doc, idx) => {
            const isDocBlacklisted = doc.status === "blacklisted";
            const isDocHalted = doc.status === "halted";
            const hasScore = doc.score !== null && !isDocBlacklisted && !isDocHalted;

            return (
              <div
                key={doc.id || doc.name}
                className="p-3.5 rounded transition-all text-xs flex items-center justify-between"
                style={{
                  backgroundColor: isDocBlacklisted
                    ? "#FDF3F3"
                    : isDocHalted
                    ? "#FAF9F6"
                    : "#FAF9F6",
                  border: isDocBlacklisted
                    ? "1.5px solid #F0B8B8"
                    : isDocHalted
                    ? "1px dashed #DCD7CB"
                    : "1px solid #EDEAE1",
                  opacity: isDocHalted ? 0.65 : 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px]"
                    style={{
                      backgroundColor: isDocBlacklisted
                        ? "#8A2525"
                        : isDocHalted
                        ? "#EDEAE1"
                        : "#EEF5F1",
                      color: isDocBlacklisted ? "#FFFFFF" : isDocHalted ? "#8A96A3" : "#1F7A5C",
                    }}
                  >
                    {isDocBlacklisted ? "!" : isDocHalted ? "—" : idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className="font-semibold"
                        style={{ color: isDocBlacklisted ? "#8A2525" : "#171E27" }}
                      >
                        {doc.name}
                      </p>
                      {isDocBlacklisted && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#8A2525] text-white uppercase tracking-wider">
                          Blacklisted
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[11px]"
                      style={{ color: isDocBlacklisted ? "#8A2525" : "#5B6B7D" }}
                    >
                      {doc.detail || "Queued in backend verification payload"}
                    </p>
                  </div>
                </div>

                {/* Score or Status Pill */}
                <div>
                  {isDocBlacklisted ? (
                    <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-[#8A2525] text-white shadow-2xs whitespace-nowrap">
                      Blacklisted
                    </span>
                  ) : isDocHalted ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#EDEAE1] text-[#8A96A3] whitespace-nowrap">
                      Process Stopped
                    </span>
                  ) : hasScore ? (
                    <div className="px-2.5 py-1 rounded bg-white border border-[#BDE0D2] flex items-center gap-1 font-mono font-bold text-[#1F7A5C]">
                      <span>{doc.score}</span>
                      <span className="text-[10px] text-[#8A96A3] font-normal">/ 100</span>
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EEF5F1] text-[#1F7A5C] border border-[#BDE0D2]">
                      Payload Ready
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status / Compliance Score Box */}
        {isBlacklisted ? (
          <div className="p-4 rounded bg-[#FDF3F3] border border-[#F0B8B8] text-center mb-6">
            <span className="text-[11px] uppercase font-bold text-[#8A2525] tracking-wider block mb-1">
              Verification Halted & Debarred
            </span>
            <p className="text-base font-bold text-[#8A2525] mb-1">
              Document Flagged on Central Blacklist
            </p>
            <p className="text-xs text-[#8A2525] opacity-90 max-w-md mx-auto">
              {blacklistedReason ||
                "In compliance with public procurement rules, scoring has been stopped. This bidder is disqualified and will not be added to verified bidders."}
            </p>
          </div>
        ) : isCompleted && backendScores ? (
          <div className="p-4 rounded bg-[#EEF5F1] border border-[#BDE0D2] text-center mb-6">
            <span className="text-[11px] uppercase font-bold text-[#1F7A5C] tracking-wider block mb-1">
              Backend Verification Complete
            </span>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl font-bold font-mono text-[#171E27]">
                {backendAvgScore}
              </span>
              <span className="text-sm font-semibold text-[#5B6B7D]">/ 100</span>
            </div>
            <p className="text-xs text-[#3E4C59]">
              Overall Compliance Score returned from backend verification pipeline.
            </p>
          </div>
        ) : (
          <div className="p-3.5 mb-6 rounded bg-[#FAF9F6] border border-[#EDEAE1] text-center text-xs text-[#5B6B7D]">
            <p className="font-semibold text-[#171E27] mb-0.5">Frontend Integration Ready for Backend Team</p>
            <p className="text-[11px] text-[#8A96A3]">
              Statutory documents, files, and vendor IDs are delivered to the backend team's endpoint. Awaiting backend scoring pipeline.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {isBlacklisted ? (
            <>
              <button
                type="button"
                onClick={handleRecordBlacklist}
                className="w-full py-2.5 text-xs font-semibold rounded text-white bg-[#8A2525] hover:bg-[#6E1C1C] cursor-pointer shadow-xs transition-colors text-center"
              >
                Record Blacklist & Return to Dashboard
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#FAF9F6] cursor-pointer transition-colors text-center whitespace-nowrap"
              >
                Back to Pending List
              </button>
            </>
          ) : isCompleted && backendScores ? (
            <>
              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="w-full py-2.5 text-xs font-semibold rounded text-white bg-[#1F7A5C] hover:bg-[#18644A] cursor-pointer shadow-xs transition-colors text-center"
              >
                Proceed to Verified Bidders Dossier &rarr;
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#FAF9F6] cursor-pointer transition-colors text-center whitespace-nowrap"
              >
                Back to Pending List
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={triggerBackendVerification}
                disabled={isLoadingBackend}
                className="w-full py-2.5 text-xs font-semibold rounded text-white bg-[#171E27] hover:bg-[#2A3747] disabled:opacity-50 cursor-pointer shadow-xs transition-colors text-center"
              >
                {isLoadingBackend ? "Checking Backend..." : "Refresh / Check Backend Status"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#FAF9F6] cursor-pointer transition-colors text-center whitespace-nowrap"
              >
                Back to Pending List
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
