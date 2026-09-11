import { useState, useRef, Fragment } from "react";
import { Link } from "react-router-dom";
import { DocIcon, CheckIcon } from "../components/icons";
import Footer from "../components/Footer";
import { useBidderContext } from "../context/BidderContext";
import { UploadedDocumentRecord } from "../data/bidders";

const STEPS = ["Business Details", "Document Uploads", "Review & Submit"];

const BASE_DOCS = [
  { id: "panCard", label: "PAN Card of Entity / Authorized Signatory" },
  { id: "gstCert", label: "GST Registration Certificate & Latest GSTR-3B" },
  { id: "udyamCert", label: "Udyam Registration Certificate (PDF)" },
];

// Validation helper functions
function validateUdyam(val: string): string | null {
  const trimmed = val.trim().toUpperCase();
  if (!trimmed) return "Udyam Registration Number is required.";
  const pattern = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
  if (!pattern.test(trimmed)) {
    return "Invalid Udyam format. Must follow UDYAM-XX-00-0000000 (e.g., UDYAM-TN-03-0012345).";
  }
  return null;
}

function validateGSTIN(val: string): string | null {
  const trimmed = val.trim().toUpperCase();
  if (!trimmed) return "GSTIN is required.";
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(trimmed)) {
    return "Invalid GSTIN format. Must be 15 alphanumeric characters (e.g., 33AAAAA0000A1Z5).";
  }
  return null;
}

function validatePAN(val: string): string | null {
  const trimmed = val.trim().toUpperCase();
  if (!trimmed) return "PAN is required.";
  const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!pattern.test(trimmed)) {
    return "Invalid PAN format. Must be 10 characters: 5 letters, 4 digits, 1 letter (e.g., AAAAA0000A).";
  }
  return null;
}

function validateCompanyName(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return "Enterprise Legal Name is required.";
  if (trimmed.length < 3) return "Enterprise Legal Name must be at least 3 characters.";
  return null;
}

export default function BidderSubmission() {
  const {
    registerVendorBid,
    customBidders,
  } = useBidderContext();

  // Navigation tab state: "submit" (file new bid form) or "pending" (clean table of submitted bids)
  const [activeTab, setActiveTab] = useState<"submit" | "pending">(() => {
    return customBidders.length > 0 ? "pending" : "submit";
  });

  const [step, setStep] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    udyam: "",
    gstin: "",
    pan: "",
    declaration: false,
  });

  const [touched, setTouched] = useState({
    companyName: false,
    udyam: false,
    gstin: false,
    pan: false,
  });

  const [files, setFiles] = useState<
    Record<string, { name: string; size: number; type?: string; dataUrl?: string }>
  >({});

  const errors = {
    companyName: touched.companyName ? validateCompanyName(formData.companyName) : null,
    udyam: touched.udyam ? validateUdyam(formData.udyam) : null,
    gstin: touched.gstin ? validateGSTIN(formData.gstin) : null,
    pan: touched.pan ? validatePAN(formData.pan) : null,
  };

  const isStep0Valid =
    !validateCompanyName(formData.companyName) &&
    !validateUdyam(formData.udyam) &&
    !validateGSTIN(formData.gstin) &&
    !validatePAN(formData.pan);

  const update = (key: string, value: string | boolean) => {
    let finalValue = value;
    if (typeof value === "string" && (key === "udyam" || key === "gstin" || key === "pan")) {
      finalValue = value.toUpperCase();
    }
    setFormData((f) => ({ ...f, [key]: finalValue }));
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const setFile = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setFiles((f) => ({
        ...f,
        [id]: { name: file.name, size: file.size, type: file.type || "application/pdf", dataUrl },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFillSample = () => {
    setFormData({
      companyName: "Sundaram Industrial Equipments Pvt. Ltd.",
      udyam: "UDYAM-TN-03-0012345",
      gstin: "33AAAAA0000A1Z5",
      pan: "AAAAA0000A",
      declaration: true,
    });
    setTouched({
      companyName: true,
      udyam: true,
      gstin: true,
      pan: true,
    });
    setFiles({
      udyamCert: {
        name: "udyam_registration_cert.pdf",
        size: 345000,
        type: "application/pdf",
        dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJUlETVNNRS1TRUFMCg==",
      },
      gstCert: {
        name: "gstn_33AAAAA0000A1Z5.pdf",
        size: 520000,
        type: "application/pdf",
        dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJUdTVF9SRVRVUk5TCg==",
      },
      panCard: {
        name: "pan_card_copy.pdf",
        size: 210000,
        type: "application/pdf",
        dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJUNCQFRfUEFOCg==",
      },
    });
  };

  const handleClearForm = () => {
    setFormData({
      companyName: "",
      udyam: "",
      gstin: "",
      pan: "",
      declaration: false,
    });
    setTouched({
      companyName: false,
      udyam: false,
      gstin: false,
      pan: false,
    });
    setFiles({});
    setStep(0);
  };

  const handleNextFromStep0 = () => {
    setTouched({
      companyName: true,
      udyam: true,
      gstin: true,
      pan: true,
    });
    if (isStep0Valid) {
      setStep(1);
    }
  };

  // Transmits vendor credentials and attached statutory certificates to backend verification pipeline.
  // The newly created bid defaults to status "Under Verification" and queues on the Officer Dashboard.
  const handleFinalSubmit = () => {
    if (!formData.declaration) return;

    const attachedDocuments: UploadedDocumentRecord[] = Object.entries(files).map(([docId, f]) => ({
      id: docId,
      name: f.name,
      size: f.size,
      type: f.type || "application/pdf",
      dataUrl: f.dataUrl,
      documentType: docId,
      uploadedAt: new Date().toISOString(),
    }));

    registerVendorBid({
      companyName: formData.companyName.trim(),
      udyam: formData.udyam.trim(),
      gstin: formData.gstin.trim(),
      pan: formData.pan.trim(),
      attachedDocs: Object.keys(files),
      attachedDocuments,
    });
    handleClearForm();
    setActiveTab("pending");
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F7F6F2" }}>
      {/* Top Header & Navigation Bar */}
      <div
        className="flex items-center justify-between px-6 md:px-12 py-3.5 bg-white sticky top-0 z-30"
        style={{ borderBottom: "1px solid #DCD7CB" }}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-inherit no-underline">
            <span style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-[#171E27]">
              BidSure AI
            </span>
            <span className="text-xs px-2 py-0.5 rounded border border-[#DCD7CB] text-[#5B6B7D]">
              Vendor Portal
            </span>
          </Link>
        </div>

        {/* Clean Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("submit")}
            className={`text-xs px-3 py-1.5 rounded font-semibold cursor-pointer transition-colors ${
              activeTab === "submit"
                ? "bg-[#171E27] text-white shadow-2xs"
                : "bg-white border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#F7F6F2]"
            }`}
          >
            + Submit New Bid
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`text-xs px-3 py-1.5 rounded font-semibold cursor-pointer transition-colors ${
              activeTab === "pending"
                ? "bg-[#171E27] text-white shadow-2xs"
                : "bg-white border border-[#DCD7CB] text-[#5B6B7D] hover:bg-[#F7F6F2]"
            }`}
          >
            Bid Submission ({customBidders.length})
          </button>

          {activeTab === "submit" && (
            <>
              <button
                type="button"
                onClick={handleFillSample}
                className="text-xs px-2.5 py-1.5 rounded border border-[#C8BFAD] text-[#1F7A5C] bg-[#F2F8F5] hover:bg-[#E3EFE9] transition-colors cursor-pointer font-medium"
                title="Populate sample company details"
              >
                Auto-fill Sample
              </button>
              <button
                type="button"
                onClick={handleClearForm}
                className="text-xs px-2.5 py-1.5 rounded border border-[#DCD7CB] text-[#7C8896] hover:bg-[#EDEAE1] transition-colors cursor-pointer"
                title="Reset all form fields"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === "pending" ? (
        <SubmittedBidsTable
          bidders={customBidders}
          onNewBid={() => {
            handleClearForm();
            setActiveTab("submit");
          }}
        />
      ) : (
        <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
          <Stepper steps={STEPS} current={step} />

        {step === 0 && (
          <StepBusiness
            formData={formData}
            update={update}
            errors={errors}
            onBlur={handleBlur}
          />
        )}
        {step === 1 && (
          <StepDocuments
            docs={BASE_DOCS}
            files={files}
            setFile={setFile}
            onAttachDemoDocs={() => {
              setFiles({
                udyamCert: {
                  name: "udyam_registration_cert.pdf",
                  size: 345000,
                  type: "application/pdf",
                  dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJUlETVNNRS1TRUFMCg==",
                },
                gstCert: {
                  name: "gstn_certificate_33.pdf",
                  size: 520000,
                  type: "application/pdf",
                  dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJUdTVF9SRVRVUk5TCg==",
                },
                panCard: {
                  name: "pan_card_copy.pdf",
                  size: 210000,
                  type: "application/pdf",
                  dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJUNCQFRfUEFOCg==",
                },
              });
            }}
          />
        )}
        {step === 2 && (
          <StepReview
            formData={formData}
            update={update}
            files={files}
            allDocs={BASE_DOCS}
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

          {step === 0 ? (
            <button
              type="button"
              onClick={handleNextFromStep0}
              className="px-6 py-2.5 text-sm font-semibold rounded transition-colors cursor-pointer shadow-xs text-white"
              style={{
                backgroundColor: isStep0Valid ? "#0F1B2D" : "#8A96A3",
              }}
            >
              Continue &rarr;
            </button>
          ) : step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 text-sm font-semibold rounded transition-colors cursor-pointer shadow-xs bg-[#0F1B2D] text-white"
            >
              Continue &rarr;
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={!formData.declaration}
              className="px-6 py-2.5 text-sm font-semibold rounded transition-colors cursor-pointer shadow-xs"
              style={{
                backgroundColor: formData.declaration ? "#1F7A5C" : "#A3B8B0",
                color: "#FFFFFF",
              }}
            >
              Submit Bid
            </button>
          )}
        </div>
      </div>
      )}

      <Footer />
    </div>
  );
}

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#DCD7CB]">
      {steps.map((label, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              style={{
                backgroundColor: done ? "#1F7A5C" : active ? "#0F1B2D" : "#EDEAE1",
                color: done || active ? "#FFFFFF" : "#8A96A3",
              }}
            >
              {done ? "✓" : idx + 1}
            </span>
            <span
              className="text-xs font-semibold hidden sm:inline"
              style={{ color: active ? "#0F1B2D" : done ? "#1F7A5C" : "#8A96A3" }}
            >
              {label}
            </span>
            {idx < steps.length - 1 && (
              <span className="w-8 md:w-16 h-px bg-[#DCD7CB] mx-1" />
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
  errors,
  onBlur,
}: {
  formData: { companyName: string; udyam: string; gstin: string; pan: string };
  update: (k: string, v: string) => void;
  errors: {
    companyName: string | null;
    udyam: string | null;
    gstin: string | null;
    pan: string | null;
  };
  onBlur: (field: "companyName" | "udyam" | "gstin" | "pan") => void;
}) {
  return (
    <div className="space-y-6 bg-white p-6 md:p-8 rounded border border-[#DCD7CB] shadow-xs">
      <div>
        <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-xl font-bold text-[#171E27] mb-1">
          Business Details &amp; Statutory Identifiers
        </h2>
        <p className="text-xs text-[#5B6B7D]">
          Enter your registered enterprise details. Ensure all identification numbers follow national statutory formats.
        </p>
      </div>

      <div className="space-y-4">
        {/* Enterprise Legal Name */}
        <ValidatedField
          label="Enterprise / Company Legal Name"
          value={formData.companyName}
          onChange={(v) => update("companyName", v)}
          onBlur={() => onBlur("companyName")}
          error={errors.companyName}
          placeholder="e.g., Sundaram Industrial Equipments Pvt. Ltd."
          hint="Must match exactly with the legal registration certificates."
        />

        {/* Udyam Registration Number */}
        <ValidatedField
          label="Udyam / MSME Registration Number"
          value={formData.udyam}
          onChange={(v) => update("udyam", v)}
          onBlur={() => onBlur("udyam")}
          error={errors.udyam}
          placeholder="UDYAM-TN-03-0012345"
          hint="Required syntax: UDYAM-XX-00-0000000 (Ministry of MSME format)."
        />

        {/* GSTIN */}
        <ValidatedField
          label="GSTIN (Goods and Services Tax Identification Number)"
          value={formData.gstin}
          onChange={(v) => update("gstin", v)}
          onBlur={() => onBlur("gstin")}
          error={errors.gstin}
          placeholder="33AAAAA0000A1Z5"
          hint="Standard 15-character statutory GST identification code."
        />

        {/* PAN */}
        <ValidatedField
          label="Permanent Account Number (PAN)"
          value={formData.pan}
          onChange={(v) => update("pan", v)}
          onBlur={() => onBlur("pan")}
          error={errors.pan}
          placeholder="AAAAA0000A"
          hint="10-character alphanumeric PAN issued by Income Tax Department."
        />
      </div>
    </div>
  );
}

function ValidatedField({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error: string | null;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="block">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-[#171E27]">{label}</label>
        {error && (
          <span className="text-[11px] font-medium text-[#B23A3A] flex items-center gap-1">
            ⚠ Required format
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm rounded outline-none transition-all"
        style={{
          border: error ? "1.5px solid #D32F2F" : "1px solid #DCD7CB",
          backgroundColor: error ? "#FFF8F8" : "#FFFFFF",
          color: "#171E27",
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = "#1F7A5C";
            e.target.style.boxShadow = "0 0 0 2px rgba(31,122,92,0.15)";
          }
        }}
      />
      {error ? (
        <p className="text-xs font-medium text-[#D32F2F] mt-1.5 flex items-center gap-1">
          <span>{error}</span>
        </p>
      ) : hint ? (
        <span className="block text-xs mt-1 text-[#8A96A3]">{hint}</span>
      ) : null}
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
  return (
    <div className="space-y-6 bg-white p-6 md:p-8 rounded border border-[#DCD7CB] shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-xl font-bold text-[#171E27] mb-1">
            Document Uploads
          </h2>
          <p className="text-xs text-[#5B6B7D]">
            Upload the statutory certificates corresponding to your business registration.
          </p>
        </div>
        <button
          type="button"
          onClick={onAttachDemoDocs}
          className="text-xs px-3 py-1.5 rounded font-semibold text-[#1F7A5C] bg-[#EEF5F1] border border-[#BDE0D2] hover:bg-[#E0F0E8] cursor-pointer transition-colors"
        >
          Attach Demo PDFs
        </button>
      </div>

      <div className="space-y-3">
        {docs.map((d) => (
          <DocumentRow
            key={d.id}
            id={d.id}
            label={d.label}
            file={files[d.id]}
            onFile={setFile}
          />
        ))}
      </div>
    </div>
  );
}

function DocumentRow({
  id,
  label,
  file,
  onFile,
}: {
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

function StepReview({
  formData,
  update,
  files,
  allDocs,
}: {
  formData: { companyName: string; udyam: string; gstin: string; pan: string; declaration: boolean };
  update: (k: string, v: boolean) => void;
  files: Record<string, { name: string; size: number }>;
  allDocs: { id: string; label: string }[];
}) {
  const uploadedCount = Object.keys(files).length;

  return (
    <div className="space-y-6 bg-white p-6 md:p-8 rounded border border-[#DCD7CB] shadow-xs">
      <div>
        <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-xl font-bold text-[#171E27] mb-1">
          Review &amp; Submit
        </h2>
        <p className="text-xs text-[#5B6B7D]">
          Verify all entered details and confirm statutory authenticity before final submission.
        </p>
      </div>

      <div className="p-4 rounded bg-[#FAF9F6] border border-[#EDEAE1] space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6B7D]">Enterprise Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#8A96A3] block">Company Name</span>
            <span className="font-semibold text-[#171E27]">{formData.companyName}</span>
          </div>
          <div>
            <span className="text-[#8A96A3] block">Udyam Registration</span>
            <span className="font-semibold font-mono text-[#171E27]">{formData.udyam}</span>
          </div>
          <div>
            <span className="text-[#8A96A3] block">GSTIN</span>
            <span className="font-semibold font-mono text-[#171E27]">{formData.gstin}</span>
          </div>
          <div>
            <span className="text-[#8A96A3] block">PAN</span>
            <span className="font-semibold font-mono text-[#171E27]">{formData.pan}</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded bg-[#FAF9F6] border border-[#EDEAE1] space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6B7D]">
          Attached Certificates ({uploadedCount} of {allDocs.length})
        </h3>
        <div className="space-y-1 text-xs">
          {allDocs.map((doc) => {
            const f = files[doc.id];
            return (
              <div key={doc.id} className="flex items-center justify-between py-1 border-b border-[#EDEAE1] last:border-b-0">
                <span className="text-[#171E27]">{doc.label}</span>
                <span className="font-medium" style={{ color: f ? "#1F7A5C" : "#9B9285" }}>
                  {f ? `✓ ${f.name}` : "Not attached"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statutory Undertaking */}
      <button
        type="button"
        onClick={() => update("declaration", !formData.declaration)}
        className="w-full flex items-start gap-3 p-4 rounded text-left transition-colors cursor-pointer"
        style={{
          border: `1px solid ${formData.declaration ? "#1F7A5C" : "#DCD7CB"}`,
          backgroundColor: formData.declaration ? "#EEF5F1" : "#FFFFFF",
        }}
      >
        <span
          className="mt-0.5 flex items-center justify-center flex-shrink-0 rounded-xs"
          style={{
            width: 18,
            height: 18,
            border: `1.5px solid ${formData.declaration ? "#1F7A5C" : "#A8B4C0"}`,
            backgroundColor: formData.declaration ? "#1F7A5C" : "transparent",
          }}
        >
          {formData.declaration && <CheckIcon small color="#FFFFFF" />}
        </span>
        <div>
          <span className="block text-xs font-bold text-[#171E27]">
            Statutory Undertaking &amp; Declaration
          </span>
          <span className="block text-[11px] mt-0.5 text-[#5B6B7D] leading-snug">
            I hereby solemnly declare that all statements made and documents uploaded are authentic, accurate, and valid under the Government e-Marketplace (GeM) General Terms and Conditions.
          </span>
        </div>
      </button>
    </div>
  );
}

// BACKEND INTEGRATION: Clean Tabular Listing of Submitted Bids
// Displays all submitted vendor tenders with live verification status from the procurement officer
function SubmittedBidsTable({
  bidders,
  onNewBid,
}: {
  bidders: any[];
  onNewBid: () => void;
}) {
  const getStatusBadge = (b: any) => {
    const isVer = b.status === "Verified" || b.officerDecision === "Verified";
    const isRej = b.status === "Rejected" || b.officerDecision === "Rejected";
    const isDocReq = b.status === "Documents Requested" || b.officerDecision === "Documents Requested";

    if (isVer) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#EEF5F1] text-[#1F7A5C] border border-[#BDE0D2]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1F7A5C]" />
          Verified
        </span>
      );
    }
    if (isRej) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#FDF2F2] text-[#B23A3A] border border-[#F5C2C2]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B23A3A]" />
          Rejected
        </span>
      );
    }
    if (isDocReq) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#FFF6EB] text-[#B8752E] border border-[#F5D6B3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B8752E]" />
          Documents Requested
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#FFF8E7] text-[#9C731A] border border-[#F0DA9B]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A038] animate-pulse" />
        Pending Verification
      </span>
    );
  };

  if (!bidders || bidders.length === 0) {
    return (
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-16 text-center">
        <div className="bg-white rounded border border-[#DCD7CB] p-10 shadow-2xs">
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-xl font-bold text-[#171E27] mb-2">
            No Submitted Bids Yet
          </h2>
          <p className="text-xs text-[#5B6B7D] max-w-md mx-auto mb-6 leading-relaxed">
            Fill out the 3-step tender bid submission form to submit your statutory credentials for procurement officer verification.
          </p>
          <button
            type="button"
            onClick={onNewBid}
            className="px-5 py-2.5 rounded bg-[#171E27] text-white text-xs font-semibold hover:bg-[#2A3747] transition-colors cursor-pointer"
          >
            + Submit New Bid
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-8 py-8">
      {/* Title & Action */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1
            style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }}
            className="text-2xl md:text-3xl font-bold"
          >
            Bid Submission
          </h1>
          <p className="text-xs text-[#5B6B7D] mt-1">
            Official GeM tender submissions. Status reflects procurement officer evaluation in real-time.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewBid}
          className="text-xs font-semibold px-4 py-2 rounded bg-[#171E27] text-white hover:bg-[#2A3747] transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
        >
          + Submit Another Bid
        </button>
      </div>

      {/* Clean Tabular Listing */}
      <div className="rounded overflow-hidden bg-white border border-[#DCD7CB] shadow-2xs">
        <div className="px-6 py-3.5 bg-[#FAF9F6] border-b border-[#DCD7CB] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171E27]">
            Bid Submission ({bidders.length})
          </h2>
          <span className="text-[11px] text-[#8A96A3]">
            GeM Verification Queue
          </span>
        </div>

        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr className="bg-[#FAF9F6] border-b border-[#EDEAE1]">
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5B6B7D] uppercase tracking-wider w-5/12">
                Enterprise Name
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5B6B7D] uppercase tracking-wider w-7/12">
                Current Status
              </th>
            </tr>
          </thead>
          <tbody>
            {bidders.map((b) => {
              const refId = `GEM/2026/B-${b.id.replace("bidder-", "").slice(-5) || "08192"}`;
              const isVerified = b.status === "Verified" || b.officerDecision === "Verified";
              const isRejected = b.status === "Rejected" || b.officerDecision === "Rejected";
              const isDocRequested = b.status === "Documents Requested" || b.officerDecision === "Documents Requested";
              const hasOfficerNotice = Boolean(b.feedbackMessage || isVerified || isRejected || isDocRequested);

              return (
                <Fragment key={b.id}>
                  <tr
                    className={`transition-colors hover:bg-[#F9F8F5] ${
                      hasOfficerNotice ? "border-b-0" : "border-b border-[#EDEAE1]"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#171E27] block text-base">
                        {b.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-[#5B6B7D]">
                        <span className="font-mono text-[#8A96A3]">
                          {refId}
                        </span>
                        <span>•</span>
                        <span>
                          {b.submittedAt ? `Submitted ${b.submittedAt}` : "Submitted Today"}
                        </span>
                        {b.udyam && (
                          <>
                            <span>•</span>
                            <span>Udyam: <span className="font-mono text-[#171E27]">{b.udyam}</span></span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      {getStatusBadge(b)}
                    </td>
                  </tr>

                  {/* Officer Notice on Separate Row */}
                  {hasOfficerNotice && (
                    <tr className="border-b border-[#EDEAE1] bg-[#FAF9F6]">
                      <td colSpan={2} className="px-6 pb-4 pt-1">
                        <div
                          className="text-xs p-3 rounded border w-full leading-relaxed"
                          style={{
                            backgroundColor: isVerified
                              ? "#F0F8F4"
                              : isRejected
                              ? "#FDF3F3"
                              : isDocRequested
                              ? "#FFF9F0"
                              : "#FFFFFF",
                            borderColor: isVerified
                              ? "#BDE0D2"
                              : isRejected
                              ? "#F5C2C2"
                              : isDocRequested
                              ? "#F5D6B3"
                              : "#DCD7CB",
                          }}
                        >
                          <span
                            className="font-bold text-[11px] uppercase tracking-wider block mb-1"
                            style={{
                              color: isVerified
                                ? "#1F7A5C"
                                : isRejected
                                ? "#B23A3A"
                                : isDocRequested
                                ? "#B8752E"
                                : "#5B6B7D",
                            }}
                          >
                            {isVerified
                              ? "Officer Verification Cleared:"
                              : isRejected
                              ? "Officer Disqualification Notice:"
                              : isDocRequested
                              ? "Officer Document Request:"
                              : "Officer Response:"}
                          </span>
                          <p className="text-xs text-[#334155]">
                            {b.feedbackMessage ||
                              (isVerified
                                ? "All statutory credentials and certificates verified and accepted by the Procurement Officer."
                                : isRejected
                                ? "Disqualified by Procurement Officer due to statutory non-compliance or discrepancy."
                                : isDocRequested
                                ? "Notice: Supplementary statutory certificates requested."
                                : "Awaiting Procurement Officer document verification.")}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
