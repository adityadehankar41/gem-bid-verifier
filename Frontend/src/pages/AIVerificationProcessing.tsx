import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheckIcon } from "../components/icons";
import Footer from "../components/Footer";
import { TENDERS } from "../data/bidders";
import { useBidderContext } from "../context/BidderContext";
import { useAuditLog } from "../context/AuditLogContext";

const STEP_MS = 650;

interface AIVerificationProcessingProps {
  activeTenderId?: string;
}

export default function AIVerificationProcessing({ activeTenderId }: AIVerificationProcessingProps) {
  const navigate = useNavigate();
  const { lastSubmission, evaluateSubmission, registerSubmittedBidder } = useBidderContext();
  const { addLog } = useAuditLog();

  const currentTender =
    TENDERS.find((t) => t.ref === (lastSubmission?.tenderRef || activeTenderId)) || TENDERS[0];

  // Dynamic evaluation based on actual submission or fallback if accessed directly
  const evaluation = lastSubmission
    ? evaluateSubmission(lastSubmission, currentTender)
    : {
        score: 88,
        risk: "Low" as const,
        status: "Cleared" as const,
        pending: 0,
        checks: [
          { id: "udyam", label: "Udyam / MSME Registration", source: "Udyam Registration Portal", result: "verified" as const, note: "Entity active and verified." },
          { id: "gst", label: "GST Registration & Returns", source: "GSTN API Gateway", result: "verified" as const, note: "GSTR-3B filings regular." },
          { id: "pan", label: "PAN & Income Tax Compliance", source: "Income Tax e-Filing Database", result: "verified" as const, note: "Active MCA21 linked PAN." },
          { id: "epfo", label: "EPFO / ESIC Compliance", source: "EPFO Unified Portal", result: "verified" as const, note: "Statutory records validated." },
          { id: "local_content", label: `Make in India Local Content`, source: "CPCL Verification Gateway", result: "verified" as const, note: "Satisfies tender threshold." },
          { id: "blacklist", label: "Blacklisting & Debarment Status", source: "CPPP Debarment & GeM Incident Records", result: "verified" as const, note: "Clean central record." },
          { id: "digilocker", label: "Document Authenticity", source: "DigiLocker Verification Gateway", result: "verified" as const, note: "Cryptographic hash verified." },
        ],
        recommendation: "Statutory checks verified clean.",
      };

  const checks = evaluation.checks;
  const [activeIndex, setActiveIndex] = useState(0);
  const [statuses, setStatuses] = useState<string[]>(() => checks.map(() => "pending"));
  const [done, setDone] = useState(false);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (activeIndex >= checks.length) {
      const t = setTimeout(() => setDone(true), 350);
      return () => clearTimeout(t);
    }
    const checkingTimer = setTimeout(() => {
      setStatuses((s) => s.map((v, i) => (i === activeIndex ? "checking" : v)));
    }, 70);
    const resolveTimer = setTimeout(() => {
      setStatuses((s) => s.map((v, i) => (i === activeIndex ? checks[i].result : v)));
      setActiveIndex((i) => i + 1);
    }, STEP_MS);
    return () => {
      clearTimeout(checkingTimer);
      clearTimeout(resolveTimer);
    };
  }, [activeIndex, checks]);

  // Once done, register bidder and write to audit trail
  useEffect(() => {
    if (done && !registeredRef.current) {
      registeredRef.current = true;
      if (lastSubmission) {
        registerSubmittedBidder(lastSubmission, evaluation);
        addLog({
          bidder: lastSubmission.companyName,
          event: "AI statutory verification complete",
          actor: "BidSure AI Engine",
          detail: `Automated assessment for tender ${currentTender.ref}. Score: ${evaluation.score}/100, Risk: ${evaluation.risk}, Status: ${evaluation.status}. ${evaluation.pending} flag(s) identified.`,
        });
      }
    }
  }, [done, lastSubmission, currentTender, evaluation, registerSubmittedBidder, addLog]);

  const verifiedCount = statuses.filter((s) => s === "verified").length;
  const flaggedCount = statuses.filter((s) => s === "flagged").length;
  const progressPct = Math.round((Math.min(activeIndex, checks.length) / checks.length) * 100);

  const bidderName = lastSubmission?.companyName || "Demo Bidder Entity";

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#0F1B2D" }}>
      <style>{`
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(31,122,92,0.45); }
          100% { box-shadow: 0 0 0 12px rgba(31,122,92,0); }
        }
      `}</style>

      {/* Top Bar */}
      <div
        className="flex items-center justify-between px-6 md:px-16 py-4 bg-[#0A121E] border-b border-[#1C2A3E]"
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-bold text-white" style={{ fontFamily: "'Fraunces', serif" }}>
            BidSure AI
          </Link>
          <span className="text-xs px-2 py-0.5 rounded border border-[#263749] text-[#7C8B9C]">
            Real-Time Engine Verification
          </span>
        </div>
        <Link
          to="/bidder/submit"
          className="text-xs px-3 py-1 rounded border border-[#263749] text-[#93A1AF] hover:text-white"
        >
          &larr; Back to Form
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 54,
                  height: 54,
                  border: "1.5px solid #1F7A5C",
                  animation: done ? "none" : "pulseRing 1.8s ease-out infinite",
                }}
              >
                <ShieldCheckIcon size={26} />
              </div>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#68BA97] block mb-1">
              BidSure AI &middot; Automated Compliance Verification
            </span>
            <h1 style={{ fontFamily: "'Fraunces', serif", color: "#F2EFE9" }} className="text-2xl md:text-3xl font-semibold mb-2">
              {done ? "Verification Sequence Complete" : "Verifying Bidder Compliance"}
            </h1>
            <p className="text-sm max-w-md mx-auto" style={{ color: "#93A1AF" }}>
              Evaluating submitted statutory documents and declarations for{" "}
              <span className="text-white font-medium">{bidderName}</span> against tender{" "}
              <span className="text-[#68BA97] font-mono">{currentTender.ref}</span>.
            </p>
          </div>

          <div className="mb-6 p-4 rounded bg-[#132234] border border-[#1C2A3E]">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#1C2A3E" }}>
              <div
                className="h-full transition-all rounded-full"
                style={{ width: `${progressPct}%`, backgroundColor: "#1F7A5C", transitionDuration: "600ms" }}
              />
            </div>
            <div className="flex justify-between items-center mt-2.5">
              <span className="text-xs font-mono" style={{ color: "#8E9DAE" }}>
                Target Tender: {currentTender.ref}
              </span>
              <span className="text-xs font-semibold" style={{ color: "#8E9DAE" }}>
                {Math.min(activeIndex, checks.length)} of {checks.length} checks resolved ({progressPct}%)
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {checks.map((check, i) => (
              <CheckRow key={check.id} check={check} status={statuses[i]} />
            ))}
          </div>

          {done && (
            <div
              className="p-5 mb-6 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              style={{ border: "1px solid #263749", backgroundColor: "#132234" }}
            >
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "#7C8896" }}>Verified Clean</p>
                  <p className="text-xl font-bold" style={{ color: "#4FA37C" }}>{verifiedCount}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "#7C8896" }}>Flags Detected</p>
                  <p className="text-xl font-bold" style={{ color: flaggedCount > 0 ? "#D89A4E" : "#4FA37C" }}>
                    {flaggedCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "#7C8896" }}>AI Compliance Score</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-sm font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: evaluation.score >= 85 ? "rgba(31,122,92,0.2)" : "rgba(216,154,78,0.2)",
                        color: evaluation.score >= 85 ? "#4FA37C" : "#D89A4E",
                      }}
                    >
                      {evaluation.score}/100
                    </span>
                    <span className="text-xs font-medium" style={{ color: "#A8B4C0" }}>
                      ({evaluation.risk} Risk)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {done && (
            <div className="space-y-3">
              <button
                onClick={() => navigate("/officer/dashboard")}
                className="w-full py-3 text-sm font-semibold rounded cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1F7A5C", color: "#F7F6F2" }}
              >
                <span>View Bid in Procurement Officer Dashboard</span>
                <span>&rarr;</span>
              </button>

              <div className="flex justify-between items-center px-1">
                <Link
                  to="/bidder/submit"
                  className="text-xs text-[#8E9DAE] hover:text-white underline"
                >
                  Submit Another Bid
                </Link>
                <Link
                  to="/officer/audit-trail"
                  className="text-xs text-[#68BA97] hover:underline"
                >
                  View Immutable Audit Log &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer dark />
    </div>
  );
}

function CheckRow({ check, status }: { key?: string; check: any; status: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded"
      style={{
        border: `1px solid ${status === "pending" ? "#1C2A3E" : status === "flagged" ? "#473822" : "#263749"}`,
        backgroundColor: status === "pending" ? "transparent" : status === "flagged" ? "#1B222E" : "#132234",
        opacity: status === "pending" ? 0.6 : 1,
        transition: "all 300ms",
      }}
    >
      <div className="pr-3">
        <p className="text-sm font-medium" style={{ color: "#E7ECF1" }}>{check.label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#768696" }}>
          Source: {check.source}
          {status === "flagged" && check.note && (
            <span className="text-[#D89A4E] block mt-0.5">&bull; {check.note}</span>
          )}
          {status === "verified" && check.note && (
            <span className="text-[#4FA37C] block mt-0.5">&bull; {check.note}</span>
          )}
        </p>
      </div>
      <StatusPill status={status} />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { text: string; color: string; dot: string }> = {
    pending: { text: "Pending", color: "#6C7A88", dot: "#3E4C59" },
    checking: { text: "Verifying...", color: "#C9A227", dot: "#C9A227" },
    verified: { text: "Verified", color: "#4FA37C", dot: "#1F7A5C" },
    flagged: { text: "Flagged", color: "#D89A4E", dot: "#B8752E" },
  };
  const s = map[status] || map.pending;
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span
        className="rounded-full"
        style={{
          width: 7,
          height: 7,
          backgroundColor: s.dot,
        }}
      />
      <span className="text-xs font-medium" style={{ color: s.color }}>{s.text}</span>
    </div>
  );
}
