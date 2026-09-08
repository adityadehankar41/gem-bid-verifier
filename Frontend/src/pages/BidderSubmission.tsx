import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DocIcon, CheckIcon, BigCheckIcon } from "../components/icons";
import Footer from "../components/Footer";
import { TENDERS, Tender } from "../data/bidders";
import { useBidderContext, SubmissionPayload } from "../context/BidderContext";

interface BidderSubmissionProps {
  activeTenderId?: string;
  onSelectTender?: (ref: string) => void;
}

const STEPS = ["Business Details", "Statutory & Certifications", "Document Uploads", "Review & Submit"];

const BASE_DOCS = [
  { id: "udyamCert", label: "Udyam Registration Certificate (PDF)" },
  { id: "gstCert", label: "GST Registration Certificate & Latest GSTR-3B" },
  { id: "panCard", label: "PAN Card of Entity / Authorized Signatory" },
  { id: "itrProof", label: "Income Tax Returns Acknowledgement (AY 2025-26)" },
];

export default function BidderSubmission({
  activeTenderId = TENDERS[0].ref,
  onSelectTender,
}: BidderSubmissionProps) {
  const { setLastSubmission } = useBidderContext();
  const [selectedTenderRef, setSelectedTenderRef] = useState<string>(activeTenderId);
  const currentTender = TENDERS.find((t) => t.ref === selectedTenderRef) || TENDERS[0];
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Starts completely blank — NO hardcoded default data!
  const [formData, setFormData] = useState({
    companyName: "",
    udyam: "",
    gstin: "",
    pan: "",
    epfoApplicable: false,
    esicApplicable: false,
    startupIndia: false,
    nsic: false,
    oemAuthorization: false,
    localContent: "",
    declaration: false,
  });

  // Starts completely empty — NO pre-attached mock files!
  const [files, setFiles] = useState<Record<string, { name: string; size: number }>>({});

  const update = (key: string, value: string | boolean) =>
    setFormData((f) => ({ ...f, [key]: value }));

  const setFile = (id: string, file: File) =>
    setFiles((f) => ({ ...f, [id]: { name: file.name, size: file.size } }));

  // Helper for quick testing/demoing when evaluator requests sample data
  const handleFillSample = () => {
    setFormData({
      companyName: "Sundaram Industrial Equipments Pvt. Ltd.",
      udyam: "UDYAM-TN-03-0012345",
      gstin: "33AAAAA0000A1Z5",
      pan: "AAAAA0000A",
      epfoApplicable: true,
      esicApplicable: true,
      startupIndia: false,
      nsic: false,
      oemAuthorization: currentTender.requirements.requiresOEM,
      localContent: currentTender.requirements.minLocalContent ? `${currentTender.requirements.minLocalContent + 10}` : "65",
      declaration: true,
    });
    setFiles({
      udyamCert: { name: "udyam_registration_cert.pdf", size: 345000 },
      gstCert: { name: "gstn_33AAAAA0000A1Z5.pdf", size: 520000 },
      panCard: { name: "pan_card_copy.pdf", size: 210000 },
      itrProof: { name: "itr_ay_2025_26.pdf", size: 840000 },
      epfoEsicCert: { name: "epfo_electronic_challan_receipt.pdf", size: 310000 },
      ...(currentTender.requirements.requiresOEM
        ? { oemLetter: { name: "oem_authorization_letter.pdf", size: 410000 } }
        : {}),
    });
  };

  // Helper to clear form back to pristine empty state
  const handleClearForm = () => {
    setFormData({
      companyName: "",
      udyam: "",
      gstin: "",
      pan: "",
      epfoApplicable: false,
      esicApplicable: false,
      startupIndia: false,
      nsic: false,
      oemAuthorization: false,
      localContent: "",
      declaration: false,
    });
    setFiles({});
    setStep(0);
  };

  // Dynamically calculate required documents based on statutory selections & tender rules
  const conditionalDocs = [];
  if (formData.epfoApplicable || formData.esicApplicable) {
    conditionalDocs.push({ id: "epfoEsicCert", label: "EPFO & ESIC Active Registration Certificate" });
  }
  if (formData.oemAuthorization || currentTender.requirements.requiresOEM) {
    conditionalDocs.push({ id: "oemLetter", label: "OEM Authorization / Dealership Letter from Primary Manufacturer" });
  }
  if (formData.startupIndia || formData.nsic) {
    conditionalDocs.push({ id: "startupNsicCert", label: "Startup India / NSIC Recognition Certificate" });
  }
  const allDocs = [...BASE_DOCS, ...conditionalDocs];

  const canProceedStep0 =
    Boolean(formData.companyName.trim() && formData.udyam.trim() && formData.gstin.trim() && formData.pan.trim());

  const handleTenderChange = (ref: string) => {
    setSelectedTenderRef(ref);
    if (onSelectTender) {
      onSelectTender(ref);
    }
  };

  const handleFinalSubmit = () => {
    if (!formData.declaration) return;
    const payload: SubmissionPayload = {
      companyName: formData.companyName.trim(),
      udyam: formData.udyam.trim(),
      gstin: formData.gstin.trim(),
      pan: formData.pan.trim(),
      epfoApplicable: formData.epfoApplicable,
      esicApplicable: formData.esicApplicable,
      startupIndia: formData.startupIndia,
      nsic: formData.nsic,
      oemAuthorization: formData.oemAuthorization,
      localContent: formData.localContent.trim(),
      tenderRef: currentTender.ref,
      attachedDocs: Object.keys(files),
    };
    setLastSubmission(payload);
    setSubmitted(true);
  };

  if (submitted) {
    return <SubmittedView companyName={formData.companyName} tender={currentTender} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F7F6F2" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 md:px-16 py-4 bg-white sticky top-0 z-30"
        style={{ borderBottom: "1px solid #DCD7CB" }}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-[#171E27]">
              BidSure AI
            </span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded border border-[#DCD7CB] text-[#5B6B7D]">
            Vendor Submission Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleFillSample}
            className="text-xs px-2.5 py-1 rounded border border-[#C8BFAD] text-[#1F7A5C] bg-[#F2F8F5] hover:bg-[#E3EFE9] transition-colors cursor-pointer font-medium"
            title="Populate sample company details for testing"
          >
            Auto-fill Sample Data
          </button>
          <button
            type="button"
            onClick={handleClearForm}
            className="text-xs px-2.5 py-1 rounded border border-[#DCD7CB] text-[#7C8896] hover:bg-[#EDEAE1] transition-colors cursor-pointer"
            title="Reset all form fields"
          >
            Clear Form
          </button>
          <Link
            to="/"
            className="text-xs px-2.5 py-1 rounded border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#EDEAE1]"
          >
            Cancel &amp; Exit
          </Link>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {/* Tender Context & Selector Banner */}
        <div
          className="p-5 mb-8 rounded bg-white"
          style={{ border: "1px solid #DCD7CB" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <label htmlFor="bidding-tender" className="text-xs font-semibold uppercase tracking-wider text-[#1F7A5C]">
              Bidding for Tender:
            </label>
            <select
              id="bidding-tender"
              value={selectedTenderRef}
              onChange={(e) => handleTenderChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-[#F4EFE6] border border-[#C8BFAD] text-[#171E27] cursor-pointer"
            >
              {TENDERS.map((t) => (
                <option key={t.ref} value={t.ref}>
                  {t.ref} — {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#EDEAE1] text-xs">
            <div>
              <span className="text-[#8A96A3] block">Procuring Entity</span>
              <span className="font-semibold text-[#171E27]">{currentTender.department}</span>
            </div>
            <div>
              <span className="text-[#8A96A3] block">Min. Local Content (MII)</span>
              <span className="font-semibold text-[#171E27]">{currentTender.requirements.minLocalContent}% Required</span>
            </div>
            <div>
              <span className="text-[#8A96A3] block">OEM Authorization</span>
              <span className={`font-semibold ${currentTender.requirements.requiresOEM ? "text-[#95601F]" : "text-[#171E27]"}`}>
                {currentTender.requirements.requiresOEM ? "Mandatory for this Category" : "Standard Reseller Allowed"}
              </span>
            </div>
          </div>
        </div>

        <Stepper steps={STEPS} current={step} />

        {step === 0 && <StepBusiness formData={formData} update={update} />}
        {step === 1 && (
          <StepStatutory
            formData={formData}
            update={update}
            tender={currentTender}
          />
        )}
        {step === 2 && (
          <StepDocuments
            docs={allDocs}
            files={files}
            setFile={setFile}
            onAttachDemoDocs={() => {
              const sampleFiles: Record<string, { name: string; size: number }> = {
                udyamCert: { name: "udyam_registration_cert.pdf", size: 345000 },
                gstCert: { name: "gstn_certificate_33.pdf", size: 520000 },
                panCard: { name: "pan_card_copy.pdf", size: 210000 },
                itrProof: { name: "itr_ay_2025_26.pdf", size: 840000 },
              };
              if (formData.epfoApplicable || formData.esicApplicable) {
                sampleFiles.epfoEsicCert = { name: "epfo_electronic_challan.pdf", size: 310000 };
              }
              if (formData.oemAuthorization || currentTender.requirements.requiresOEM) {
                sampleFiles.oemLetter = { name: "oem_dealership_auth.pdf", size: 410000 };
              }
              if (formData.startupIndia || formData.nsic) {
                sampleFiles.startupNsicCert = { name: "startup_india_dpiit.pdf", size: 290000 };
              }
              setFiles((prev) => ({ ...prev, ...sampleFiles }));
            }}
          />
        )}
        {step === 3 && (
          <StepReview
            formData={formData}
            update={update}
            files={files}
            allDocs={allDocs}
            tender={currentTender}
          />
        )}

        {/* Stepper Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#DCD7CB]">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-5 py-2 text-sm font-medium rounded transition-colors cursor-pointer"
            style={{
              color: step === 0 ? "#C9C2B2" : "#5B6B7D",
              backgroundColor: step === 0 ? "transparent" : "#FFFFFF",
              border: step === 0 ? "none" : "1px solid #DCD7CB",
            }}
          >
            &larr; Previous Step
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !canProceedStep0}
              className="px-6 py-2.5 text-sm font-medium rounded transition-colors cursor-pointer shadow-xs"
              style={{
                backgroundColor: step === 0 && !canProceedStep0 ? "#C9C2B2" : "#0F1B2D",
                color: "#F7F6F2",
              }}
            >
              Continue &rarr;
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={!formData.declaration}
              className="px-6 py-2.5 text-sm font-medium rounded transition-colors cursor-pointer shadow-sm"
              style={{
                backgroundColor: formData.declaration ? "#1F7A5C" : "#C9C2B2",
                color: "#F7F6F2",
              }}
            >
              Submit for AI Verification
            </button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-start mb-8 overflow-x-auto pb-2">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <div key={label} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center" style={{ minWidth: 96 }}>
              <div
                className="flex items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  width: 28,
                  height: 28,
                  border: `1.5px solid ${state === "upcoming" ? "#C9C2B2" : "#1F7A5C"}`,
                  backgroundColor: state === "done" ? "#1F7A5C" : "transparent",
                  color: state === "done" ? "#F7F6F2" : state === "active" ? "#1F7A5C" : "#9B9285",
                }}
              >
                {state === "done" ? (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#F7F6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className="mt-1.5 text-xs text-center font-medium"
                style={{ color: state === "upcoming" ? "#9B9285" : "#171E27", maxWidth: 110 }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-2"
                style={{ backgroundColor: i < current ? "#1F7A5C" : "#DCD7CB", marginTop: 14 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepBusiness({
  formData,
  update,
}: {
  formData: any;
  update: (k: string, v: string) => void;
}) {
  return (
    <div className="p-6 md:p-8 rounded bg-white" style={{ border: "1px solid #DCD7CB" }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-2xl mb-1 font-semibold">
        Business Details
      </h2>
      <p className="text-sm mb-6" style={{ color: "#5B6B7D" }}>
        Enter official registration identifiers for automated cross-portal verification against Udyam, GSTN, and Income Tax records.
      </p>
      <div className="space-y-5">
        <Field
          label="Company / Enterprise Legal Name"
          value={formData.companyName}
          onChange={(v) => update("companyName", v)}
          placeholder="Enter registered entity name (e.g. Apex Engineering Solutions Pvt. Ltd.)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Udyam Registration Number"
            value={formData.udyam}
            onChange={(v) => update("udyam", v)}
            placeholder="e.g. UDYAM-TN-03-0012345"
            hint="For MSME classification & statutory exemptions"
          />
          <Field
            label="GSTIN (15 Characters)"
            value={formData.gstin}
            onChange={(v) => update("gstin", v)}
            placeholder="e.g. 33AAAAA0000A1Z5"
            hint="Validated against GSTN return logs"
          />
        </div>
        <Field
          label="Permanent Account Number (PAN)"
          value={formData.pan}
          onChange={(v) => update("pan", v)}
          placeholder="e.g. AAAAA0000A"
          hint="Matched with MCA21 and CBDT master database"
        />
      </div>
    </div>
  );
}

function StepStatutory({
  formData,
  update,
  tender,
}: {
  formData: any;
  update: (k: string, v: any) => void;
  tender: Tender;
}) {
  return (
    <div className="p-6 md:p-8 rounded bg-white" style={{ border: "1px solid #DCD7CB" }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-2xl mb-1 font-semibold">
        Statutory & Certifications
      </h2>
      <p className="text-sm mb-6" style={{ color: "#5B6B7D" }}>
        Select statutory provisions applicable to your organization. The system dynamically updates required document attachments.
      </p>

      <div className="space-y-3">
        <Toggle
          label="Registered under EPFO"
          description="Employees' Provident Fund Organisation registration validation"
          checked={formData.epfoApplicable}
          onChange={(v) => update("epfoApplicable", v)}
        />
        <Toggle
          label="Registered under ESIC"
          description="Employees' State Insurance Corporation compliance validation"
          checked={formData.esicApplicable}
          onChange={(v) => update("esicApplicable", v)}
        />
        <Toggle
          label="DPIIT Recognized Startup"
          description="Exemption eligibility for prior turnover/experience under Startup India"
          checked={formData.startupIndia}
          onChange={(v) => update("startupIndia", v)}
        />
        <Toggle
          label="National Small Industries Corporation (NSIC) Enrolled"
          description="Additional benefits for government procurement participation"
          checked={formData.nsic}
          onChange={(v) => update("nsic", v)}
        />
        <Toggle
          label={
            tender.requirements.requiresOEM
              ? "OEM Manufacturer Authorization (Mandatory for this Tender)"
              : "OEM Manufacturer Authorization / Dealership"
          }
          description="Original equipment manufacturer authorization or primary dealership credentials"
          checked={formData.oemAuthorization}
          onChange={(v) => update("oemAuthorization", v)}
        />
      </div>

      <div className="mt-6 pt-6 border-t border-[#EDEAE1]">
        <Field
          label="Declared Make in India / Local Content (%)"
          value={formData.localContent}
          onChange={(v) => update("localContent", v)}
          placeholder={`Minimum ${tender.requirements.minLocalContent}% required for ${tender.ref}`}
          hint={`Active Tender Requirement: Minimum ${tender.requirements.minLocalContent}%. If below, BidSure AI flags a local content mismatch.`}
        />
      </div>
    </div>
  );
}

function StepDocuments({
  docs,
  files,
  setFile,
  onAttachDemoDocs,
}: {
  docs: { id: string; label: string }[];
  files: Record<string, { name: string; size: number }>;
  setFile: (id: string, file: File) => void;
  onAttachDemoDocs: () => void;
}) {
  const uploadedCount = docs.filter((d) => files[d.id]).length;

  return (
    <div className="p-6 md:p-8 rounded bg-white" style={{ border: "1px solid #DCD7CB" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-2xl mb-1 font-semibold">
            Upload Verification Documents
          </h2>
          <p className="text-sm" style={{ color: "#5B6B7D" }}>
            Upload PDF credentials or authenticate certificates. {uploadedCount} of {docs.length} attached.
          </p>
        </div>
        <button
          type="button"
          onClick={onAttachDemoDocs}
          className="text-xs px-3 py-1.5 rounded font-medium text-[#1F7A5C] bg-[#F2F8F5] border border-[#C8BFAD] hover:bg-[#E3EFE9] transition-colors cursor-pointer self-start sm:self-auto"
        >
          Attach Demo PDFs
        </button>
      </div>

      <div className="space-y-3">
        {docs.map((d) => (
          <DocumentRow key={d.id} id={d.id} label={d.label} file={files[d.id]} onFile={setFile} />
        ))}
      </div>
    </div>
  );
}

function StepReview({
  formData,
  update,
  files,
  allDocs,
  tender,
}: {
  formData: any;
  update: (k: string, v: boolean) => void;
  files: Record<string, { name: string; size: number }>;
  allDocs: any[];
  tender: Tender;
}) {
  const attachedCount = allDocs.filter((d) => files[d.id]).length;

  return (
    <div className="p-6 md:p-8 rounded bg-white" style={{ border: "1px solid #DCD7CB" }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-2xl mb-1 font-semibold">
        Review &amp; Statutory Declaration
      </h2>
      <p className="text-sm mb-6" style={{ color: "#5B6B7D" }}>
        Review your declarations before submitting for automated AI cross-verification.
      </p>

      <div className="p-4 rounded mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-[#FAF9F6] border border-[#DCD7CB]">
        <ReviewItem label="Enterprise Name" value={formData.companyName || "Not provided"} />
        <ReviewItem label="Udyam Number" value={formData.udyam || "Not provided"} />
        <ReviewItem label="GSTIN" value={formData.gstin || "Not provided"} />
        <ReviewItem label="PAN" value={formData.pan || "Not provided"} />
        <ReviewItem
          label="Declared Local Content"
          value={formData.localContent ? `${formData.localContent}% (Tender req: ${tender.requirements.minLocalContent}%)` : "Not provided"}
        />
        <ReviewItem label="Attached Documents" value={`${attachedCount} of ${allDocs.length} files attached`} />
      </div>

      <Toggle
        label="Statutory Truth & Authorization Declaration"
        description="I declare that all information and uploaded documents provided are authentic and accurate. I authorize automated validation against Udyam, GSTN, Income Tax, EPFO, ESIC, CPPP Debarment, and DigiLocker databases for GeM evaluation."
        checked={formData.declaration}
        onChange={(v) => update("declaration", v)}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1.5 text-[#5B6B7D]">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm rounded outline-none transition-all"
        style={{ border: "1px solid #DCD7CB", backgroundColor: "#FFFFFF", color: "#171E27" }}
        onFocus={(e) => {
          e.target.style.borderColor = "#1F7A5C";
          e.target.style.boxShadow = "0 0 0 2px rgba(31,122,92,0.15)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#DCD7CB";
          e.target.style.boxShadow = "none";
        }}
      />
      {hint && <span className="block text-xs mt-1 text-[#8A96A3]">{hint}</span>}
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 p-4 rounded text-left transition-colors cursor-pointer"
      style={{
        border: `1px solid ${checked ? "#1F7A5C" : "#DCD7CB"}`,
        backgroundColor: checked ? "#EEF5F1" : "#FFFFFF",
      }}
    >
      <span
        className="mt-0.5 flex items-center justify-center flex-shrink-0 rounded-xs"
        style={{
          width: 18,
          height: 18,
          border: `1.5px solid ${checked ? "#1F7A5C" : "#A8B4C0"}`,
          backgroundColor: checked ? "#1F7A5C" : "transparent",
        }}
      >
        {checked && <CheckIcon small color="#FFFFFF" />}
      </span>
      <div>
        <span className="block text-sm font-semibold text-[#171E27]">{label}</span>
        {description && <span className="block text-xs mt-0.5 text-[#5B6B7D] leading-snug">{description}</span>}
      </div>
    </button>
  );
}

function DocumentRow({
  id,
  label,
  file,
  onFile,
}: {
  key?: string;
  id: string;
  label: string;
  file?: { name: string; size: number };
  onFile: (id: string, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded bg-white" style={{ border: "1px solid #DCD7CB" }}>
      <div className="flex items-center gap-3">
        <DocIcon />
        <div>
          <p className="text-sm font-medium text-[#171E27]">{label}</p>
          <p className="text-xs" style={{ color: file ? "#1F7A5C" : "#9B9285" }}>
            {file ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)` : "Pending document upload"}
          </p>
        </div>
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFile(id, e.target.files[0]);
            }
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs font-semibold px-3 py-1.5 rounded cursor-pointer transition-colors"
          style={{
            color: file ? "#1F7A5C" : "#0F1B2D",
            backgroundColor: file ? "#EEF5F1" : "#FAF9F6",
            border: "1px solid #DCD7CB",
          }}
        >
          {file ? "Replace File" : "Choose File"}
        </button>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs mb-0.5 text-[#8A96A3]">{label}</p>
      <p className="font-semibold text-[#171E27]">{value}</p>
    </div>
  );
}

function SubmittedView({ companyName, tender }: { companyName: string; tender: Tender }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#0F1B2D" }}>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full p-8 rounded bg-[#132234] border border-[#263749]">
          <div className="flex justify-center mb-6">
            <BigCheckIcon size={52} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#4FA37C] block mb-2">
            Submission Acknowledged
          </span>
          <h1 style={{ fontFamily: "'Fraunces', serif", color: "#F2EFE9" }} className="text-2xl md:text-3xl mb-3 font-semibold">
            Ready for Automated AI Verification
          </h1>
          <p className="text-sm leading-relaxed text-[#B8C2CE]">
            <span className="text-white font-medium">{companyName}</span> has submitted statutory credentials for tender{" "}
            <span className="text-[#68BA97] font-mono">{tender.ref}</span> ({tender.title}).
          </p>
          <p className="text-xs text-[#8A96A3] mt-3">
            BidSure AI will cross-verify documents against Udyam, GSTN, Income Tax, EPFO/ESIC, Startup India, and DigiLocker databases in real time.
          </p>

          <button
            onClick={() => navigate("/bidder/verifying")}
            className="mt-8 w-full py-3 text-sm font-semibold rounded cursor-pointer transition-all shadow-md"
            style={{ backgroundColor: "#1F7A5C", color: "#F7F6F2" }}
          >
            Start Real-Time AI Verification &rarr;
          </button>
        </div>
      </div>
      <Footer dark />
    </div>
  );
}
