import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronIcon, OfficerIcon, BidderIcon } from "../components/icons";
import Footer from "../components/Footer";

const CHECKS = [
  "Udyam / MSME Registration & Classification",
  "GST Registration & GSTR-3B Return Regularity",
  "PAN & Income Tax Compliance (MCA21 Cross-Check)",
  "EPFO & ESIC Active Employee Contribution Status",
  "Central Debarment & GeM Incident Blacklisting",
  "Make in India / Class-I/II Local Content %",
  "DigiLocker Certified Document Authenticity",
];

export default function LandingRoleLogin() {
  const navigate = useNavigate();
  const [visibleChecks, setVisibleChecks] = useState(0);

  useEffect(() => {
    if (visibleChecks < CHECKS.length) {
      const t = setTimeout(() => setVisibleChecks((v) => v + 1), 350);
      return () => clearTimeout(t);
    }
  }, [visibleChecks]);

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F7F6F2" }}>
      <div className="flex flex-col md:flex-row flex-1">
        {/* Left: Brand / Mission Panel */}
        <div
          className="w-full md:w-5/12 flex flex-col justify-between p-8 md:p-14"
          style={{ backgroundColor: "#0F1B2D", color: "#F2EFE9" }}
        >
          <div>
            <div className="mb-10">
              <span
                style={{ fontFamily: "'Fraunces', serif", letterSpacing: "0.02em" }}
                className="text-3xl font-bold block"
              >
                BidSure AI
              </span>
              <span className="text-xs text-[#8E9DAE] tracking-wider uppercase font-semibold">
                GeM Compliance Verification Engine
              </span>
            </div>

            <h1
              style={{ fontFamily: "'Fraunces', serif" }}
              className="text-3xl lg:text-4xl leading-tight max-w-md font-semibold"
            >
              Every bidder participating in GeM procurement
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-relaxed" style={{ color: "#B8C2CE" }}>
              Cross-checked against Udyam, GSTN, Income Tax, EPFO, ESIC, CPPP Debarment, and DigiLocker
              registries against tender-specific eligibility requirements.
            </p>

            <div className="mt-8 space-y-2.5">
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#768696" }}>
                Multi-Portal Verification Gates:
              </p>
              {CHECKS.map((c, i) => (
                <div
                  key={c}
                  className="flex items-center gap-3 transition-opacity duration-300"
                  style={{ opacity: i < visibleChecks ? 1 : 0 }}
                >
                  <CheckDot done={i < visibleChecks} />
                  <span className="text-sm" style={{ color: "#DCE3EA" }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 mt-8 border-t" style={{ borderColor: "#1F2E42" }}>
            <p className="text-xs leading-relaxed max-w-sm" style={{ color: "#8A96A3" }}>
              Government e-Marketplace (GeM) Statutory Compliance &amp; Verification Platform.
            </p>
          </div>
        </div>

        {/* Right: Role Selection */}
        <div
          className="w-full md:w-7/12 flex flex-col justify-center p-8 md:p-16"
          style={{ backgroundColor: "#F7F6F2" }}
        >
          <div className="max-w-md w-full mx-auto md:mx-0">
            <h2
              style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }}
              className="text-3xl mb-2 font-semibold"
            >
              Continue as
            </h2>
            <p className="text-sm mb-8" style={{ color: "#5B6B7D" }}>
              Select your procurement role to access the tailored BidSure AI workspace.
            </p>

            <div className="space-y-4">
              <RoleTile
                title="Procurement Officer"
                description="Monitor tender-specific compliance scores, evaluate AI discrepancy recommendations, and execute qualification decisions."
                action="Enter as Officer"
                icon={<OfficerIcon />}
                onSelect={() => navigate("/officer/dashboard")}
              />
              <RoleTile
                title="Bidder / Vendor"
                description="Select an active GeM tender, submit business details and statutory declarations, and upload verification credentials."
                action="Continue as Bidder"
                icon={<BidderIcon />}
                onSelect={() => navigate("/bidder/submit")}
              />
            </div>

            <div className="mt-8 p-4 rounded text-xs leading-relaxed" style={{ backgroundColor: "#EDEAE1", color: "#655E52" }}>
              <span className="font-semibold text-[#171E27]">Human-in-the-Loop Safeguard:</span> As mandated by government procurement guidelines, qualification authority strictly remains with the Procurement Officer. BidSure AI functions as an auditable verification and decision-support tool.
            </div>

            <p className="mt-6 text-xs" style={{ color: "#8B95A1" }}>
              All actions on this platform are logged in an immutable audit ledger for complete transparency.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function RoleTile({
  title,
  description,
  action,
  icon,
  onSelect,
}: {
  title: string;
  description: string;
  action: string;
  icon: ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-6 flex items-start gap-4 transition-all duration-200 hover:shadow-md cursor-pointer rounded"
      style={{
        border: "1px solid #DCD7CB",
        backgroundColor: "#FFFFFF",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#1F7A5C";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#DCD7CB";
      }}
    >
      <div className="mt-1 p-2 rounded" style={{ backgroundColor: "#F7F6F2" }}>{icon}</div>
      <div className="flex-1">
        <span className="text-base font-semibold block" style={{ color: "#171E27" }}>
          {title}
        </span>
        <p className="text-sm mt-1 leading-snug" style={{ color: "#5B6B7D" }}>
          {description}
        </p>
        <span
          className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold"
          style={{ color: "#1F7A5C" }}
        >
          {action}
          <ChevronIcon />
        </span>
      </div>
    </button>
  );
}

function CheckDot({ done }: { done: boolean }) {
  return (
    <span
      className="flex items-center justify-center rounded-full transition-all duration-300"
      style={{
        width: 18,
        height: 18,
        border: `1px solid ${done ? "#4FA37C" : "#3E4C59"}`,
        backgroundColor: done ? "#1F7A5C" : "transparent",
      }}
    >
      {done && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#F2EFE9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
