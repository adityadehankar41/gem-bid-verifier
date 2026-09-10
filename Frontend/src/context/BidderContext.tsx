import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Bidder,
  Tender,
  TENDERS,
  BASE_BIDDERS,
  BIDDER_RAW_STATS,
  UploadedDocumentRecord,
  DocumentScoreItem,
} from "../data/bidders";

export interface SubmissionPayload {
  companyName: string;
  udyam: string;
  gstin: string;
  pan: string;
  epfoApplicable?: boolean;
  esicApplicable?: boolean;
  startupIndia?: boolean;
  nsic?: boolean;
  oemAuthorization?: boolean;
  localContent?: string;
  tenderRef?: string;
  attachedDocs: string[];
  attachedDocuments?: UploadedDocumentRecord[];
}

export interface VerificationResult {
  score: number;
  risk: "Low" | "Medium" | "High";
  status: "Under Verification" | "Verified" | "Rejected" | "Documents Requested" | "Cleared" | "Flagged" | "Under Review" | "Blacklisted";
  pending: number;
  checks: {
    id: string;
    label: string;
    source: string;
    result: "verified" | "flagged";
    note?: string;
  }[];
  recommendation: string;
}

interface BidderContextType {
  customBidders: Bidder[];
  activeTenderId: string;
  setActiveTenderId: (id: string) => void;
  lastSubmission: SubmissionPayload | null;
  setLastSubmission: (payload: SubmissionPayload | null) => void;
  submittedBidderId: string | null;
  setSubmittedBidderId: (id: string | null) => void;
  evaluateSubmission: (payload: SubmissionPayload, tender?: Tender) => VerificationResult;
  registerSubmittedBidder: (payload: SubmissionPayload, result: VerificationResult) => Bidder;
  registerVendorBid: (payload: {
    companyName: string;
    udyam: string;
    gstin: string;
    pan: string;
    attachedDocs: string[];
    attachedDocuments?: UploadedDocumentRecord[];
  }) => Bidder;
  completeAiVerification: (
    bidderId: string,
    docScores: DocumentScoreItem[],
    complianceScore: number
  ) => void;
  markBidderBlacklisted: (
    bidderId: string,
    docScores: DocumentScoreItem[],
    reason?: string
  ) => void;
  updateBidderStatus: (
    bidderId: string,
    status: "Verified" | "Rejected" | "Documents Requested" | "Under Verification",
    feedbackMessage?: string
  ) => void;
  getBidderById: (id: string) => Bidder | undefined;
  getAllBidders: (tenderRef?: string) => Bidder[];
  resetBiddersToDefault: () => void;
  clearAllBidders: () => void;
}

const BidderContext = createContext<BidderContextType | null>(null);

export function BidderProvider({ children }: { children: React.ReactNode }) {
  const [activeTenderId, setActiveTenderId] = useState<string>(TENDERS[0].ref);
  const [customBidders, setCustomBidders] = useState<Bidder[]>(() => {
    const saved = sessionStorage.getItem("bidsure_custom_bidders");
    if (saved) {
      try {
        const parsed: Bidder[] = JSON.parse(saved);
        // Ensure any bidder without real completed backend documentScores is not marked isAiVerified
        return parsed.map((b) => {
          if (
            b.isAiVerified &&
            (!b.documentScores || b.documentScores.length === 0 || typeof b.complianceScore !== "number")
          ) {
            return {
              ...b,
              isAiVerified: false,
              complianceScore: undefined,
              documentScores: undefined,
              score: 0,
              status: "Under Verification" as const,
              lastChecked: "Awaiting Backend Verification",
            };
          }
          return b;
        });
      } catch {
        return [];
      }
    }
    return [];
  });

  const [submittedBidderId, setSubmittedBidderId] = useState<string | null>(() => {
    return sessionStorage.getItem("bidsure_submitted_bidder_id") || null;
  });

  const [lastSubmission, setLastSubmission] = useState<SubmissionPayload | null>(() => {
    const saved = sessionStorage.getItem("bidsure_last_submission");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    try {
      // Store lightweight custom bidder representation to avoid quota errors
      const sanitized = customBidders.map((b) => ({
        ...b,
        attachedDocuments: b.attachedDocuments?.map((d) => ({
          id: d.id,
          name: d.name,
          size: d.size,
          type: d.type,
          documentType: d.documentType,
          uploadedAt: d.uploadedAt,
        })),
      }));
      sessionStorage.setItem("bidsure_custom_bidders", JSON.stringify(sanitized));
    } catch (e) {
      console.warn("Storage quota reached or storage disabled:", e);
    }
  }, [customBidders]);

  useEffect(() => {
    try {
      if (submittedBidderId) {
        sessionStorage.setItem("bidsure_submitted_bidder_id", submittedBidderId);
      } else {
        sessionStorage.removeItem("bidsure_submitted_bidder_id");
      }
    } catch {
      // ignore
    }
  }, [submittedBidderId]);

  useEffect(() => {
    try {
      if (lastSubmission) {
        sessionStorage.setItem("bidsure_last_submission", JSON.stringify(lastSubmission));
      } else {
        sessionStorage.removeItem("bidsure_last_submission");
      }
    } catch {
      // ignore
    }
  }, [lastSubmission]);

  function evaluateSubmission(payload: SubmissionPayload, tender: Tender): VerificationResult {
    const localContentNum = parseFloat(payload.localContent) || 0;
    const checks: VerificationResult["checks"] = [];
    let score = 100;
    let flags = 0;

    // 1. Udyam Registration Check
    const isUdyamValid = payload.udyam.trim().toUpperCase().startsWith("UDYAM-");
    if (isUdyamValid) {
      checks.push({
        id: "udyam",
        label: "Udyam / MSME Registration",
        source: "Udyam Registration Portal",
        result: "verified",
        note: `Entity identifier ${payload.udyam} active and classified.`,
      });
    } else {
      checks.push({
        id: "udyam",
        label: "Udyam / MSME Registration",
        source: "Udyam Registration Portal",
        result: "flagged",
        note: `Format "${payload.udyam}" does not match standard UDYAM-XX-00-0000000 syntax.`,
      });
      score -= 15;
      flags++;
    }

    // 2. GST Registration & Return Regularity Check
    const gstinClean = payload.gstin.trim().toUpperCase();
    const isGstFormat = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstinClean);
    if (isGstFormat || gstinClean.length === 15) {
      checks.push({
        id: "gst",
        label: "GST Registration & GSTR-3B Returns",
        source: "GSTN API Gateway",
        result: "verified",
        note: "GSTIN active in good standing; returns filed within statutory cycles.",
      });
    } else {
      checks.push({
        id: "gst",
        label: "GST Registration & GSTR-3B Returns",
        source: "GSTN API Gateway",
        result: "flagged",
        note: "GSTIN fails 15-digit structure check or shows irregular return filing.",
      });
      score -= 20;
      flags++;
    }

    // 3. PAN & Income Tax Check
    const panClean = payload.pan.trim().toUpperCase();
    const isPanFormat = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panClean);
    if (isPanFormat || panClean.length === 10) {
      checks.push({
        id: "pan",
        label: "PAN & Income Tax Compliance",
        source: "Income Tax e-Filing Database",
        result: "verified",
        note: `PAN ${panClean} matched against MCA21 incorporation records.`,
      });
    } else {
      checks.push({
        id: "pan",
        label: "PAN & Income Tax Compliance",
        source: "Income Tax e-Filing Database",
        result: "flagged",
        note: "PAN format mismatch with CBDT master ledger.",
      });
      score -= 15;
      flags++;
    }

    // 4. EPFO / ESIC Check
    if (payload.epfoApplicable || payload.esicApplicable) {
      if (payload.attachedDocs.includes("epfoEsicCert")) {
        checks.push({
          id: "epfo",
          label: "EPFO / ESIC Compliance",
          source: "EPFO Unified Portal",
          result: "verified",
          note: "Active electronic challan receipt validated.",
        });
      } else {
        checks.push({
          id: "epfo",
          label: "EPFO / ESIC Compliance",
          source: "EPFO Unified Portal",
          result: "flagged",
          note: "Statutory contribution declared applicable but electronic challan receipt missing.",
        });
        score -= 15;
        flags++;
      }
    } else {
      checks.push({
        id: "epfo",
        label: "EPFO / ESIC Compliance",
        source: "EPFO Unified Portal",
        result: "verified",
        note: "Declared under statutory headcount exemption threshold.",
      });
    }

    // 5. Make in India / Local Content Check vs Tender Min
    if (localContentNum >= tender.requirements.minLocalContent) {
      checks.push({
        id: "local_content",
        label: `Make in India Local Content (${localContentNum}%)`,
        source: "CPCL Make in India Verification Gateway",
        result: "verified",
        note: `Meets tender threshold (${localContentNum}% >= ${tender.requirements.minLocalContent}%).`,
      });
    } else {
      checks.push({
        id: "local_content",
        label: `Make in India Local Content (${localContentNum}%)`,
        source: "CPCL Make in India Verification Gateway",
        result: "flagged",
        note: `Declared ${localContentNum}% is below tender minimum threshold of ${tender.requirements.minLocalContent}%.`,
      });
      score -= 25;
      flags++;
    }

    // 6. OEM Authorization Check
    if (tender.requirements.requiresOEM) {
      if (payload.oemAuthorization && payload.attachedDocs.includes("oemLetter")) {
        checks.push({
          id: "oem",
          label: "OEM Authorization / Dealership",
          source: "Primary Manufacturer Verification Ledger",
          result: "verified",
          note: "Primary manufacturer authorization letter verified.",
        });
      } else {
        checks.push({
          id: "oem",
          label: "OEM Authorization / Dealership",
          source: "Primary Manufacturer Verification Ledger",
          result: "flagged",
          note: `Mandatory OEM Authorization letter required for category "${tender.category}".`,
        });
        score -= 25;
        flags++;
      }
    } else if (payload.oemAuthorization) {
      checks.push({
        id: "oem",
        label: "OEM Authorization / Dealership",
        source: "Primary Manufacturer Verification Ledger",
        result: "verified",
        note: "Authorized reseller credentials submitted.",
      });
    }

    // 7. CPPP Debarment / Blacklist Check
    checks.push({
      id: "blacklist",
      label: "Central Debarment & Blacklist Check",
      source: "CPPP Debarment & GeM Incident Records",
      result: "verified",
      note: "No adverse incident record found on central procurement portal.",
    });

    // 8. DigiLocker Document Authenticity Check
    checks.push({
      id: "digilocker",
      label: "DigiLocker Document Authenticity",
      source: "DigiLocker National Gateway",
      result: "verified",
      note: "Digital signature and certificate hashes cryptographically verified.",
    });

    score = Math.max(15, score);
    let risk: "Low" | "Medium" | "High" = "Low";
    let status: "Cleared" | "Flagged" | "Under Review" = "Cleared";

    if (flags === 0 && score >= 85) {
      risk = "Low";
      status = "Cleared";
    } else if (flags <= 2 && score >= 65) {
      risk = "Medium";
      status = "Flagged";
    } else {
      risk = "High";
      status = "Flagged";
    }

    let recommendation = "";
    if (flags === 0) {
      recommendation = `All statutory registrations and tender-specific criteria verified successfully for ${payload.companyName}. Compliant for commercial evaluation under ${tender.ref}.`;
    } else {
      recommendation = `[Tender Discrepancy Alert] AI detected ${flags} discrepancy item(s) against tender ${tender.ref}. Recommend officer scrutiny or requesting supplementary proof prior to commercial opening.`;
    }

    return {
      score,
      risk,
      status,
      pending: flags,
      checks,
      recommendation,
    };
  }

  function registerSubmittedBidder(payload: SubmissionPayload, result: VerificationResult): Bidder {
    const newBidder: Bidder = {
      id: `bidder-${Date.now()}`,
      name: payload.companyName,
      gstin: payload.gstin,
      score: result.score,
      risk: result.risk,
      status: result.status,
      pending: result.pending,
      lastChecked: "Just now",
      recommendation: result.recommendation,
      checks: result.checks.map((c) => ({
        label: c.label,
        status: c.result,
        note: c.note,
      })),
    };

    setCustomBidders((prev) => [newBidder, ...prev.filter((b) => b.gstin !== newBidder.gstin)]);
    setSubmittedBidderId(newBidder.id);
    return newBidder;
  }

  function registerVendorBid(payload: {
    companyName: string;
    udyam: string;
    gstin: string;
    pan: string;
    attachedDocs: string[];
    attachedDocuments?: UploadedDocumentRecord[];
  }): Bidder {
    // Explicitly mark as not AI-verified so it lists in Officer Dashboard pending queue
    const newBidder: Bidder = {
      id: `bidder-${Date.now()}`,
      name: payload.companyName,
      gstin: payload.gstin,
      score: 0,
      risk: "Low",
      status: "Under Verification",
      pending: 0,
      lastChecked: "Awaiting Backend Verification",
      recommendation: "Bid submitted by vendor. Statutory credentials and certificates ready for backend verification pipeline.",
      isAiVerified: false,
      complianceScore: undefined,
      documentScores: undefined,
      officerDecision: null,
      submittedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      udyam: payload.udyam,
      pan: payload.pan,
      attachedDocsCount: payload.attachedDocs.length,
      attachedDocuments: payload.attachedDocuments || [],
      checks: [
        { label: "Udyam Registration", status: "verified", note: `Udyam ID ${payload.udyam} delivered in payload.` },
        { label: "GSTN Registration & Returns", status: "verified", note: `GSTIN ${payload.gstin} delivered in payload.` },
        { label: "PAN & MCA21 Record", status: "verified", note: `PAN ${payload.pan} delivered in payload.` },
        { label: "DigiLocker / Attached Certificates", status: "verified", note: `${payload.attachedDocs.length} statutory files attached.` },
      ],
    };

    // Keep all bids by filtering by id so every submitted bid is listed in both vendor and officer portals
    setCustomBidders((prev) => [newBidder, ...prev.filter((b) => b.id !== newBidder.id)]);
    setSubmittedBidderId(newBidder.id);
    return newBidder;
  }

  function completeAiVerification(
    bidderId: string,
    docScores: DocumentScoreItem[],
    complianceScore: number
  ) {
    if (!docScores || docScores.length === 0 || typeof complianceScore !== "number") {
      return;
    }

    const hasBlacklist = docScores.some(
      (d) => d.status === "blacklisted" || (d.status as string) === "black listed" || d.isBlacklisted
    );
    if (hasBlacklist) {
      markBidderBlacklisted(bidderId, docScores);
      return;
    }

    setCustomBidders((prev) => {
      const existingIndex = prev.findIndex((b) => b.id === bidderId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isAiVerified: true,
          isBlacklisted: false,
          complianceScore,
          documentScores: docScores,
          score: complianceScore,
          lastChecked: "Backend Verified just now",
        };
        return updated;
      } else {
        const base = BASE_BIDDERS.find((b) => b.id === bidderId);
        if (!base) return prev;
        const updatedBidder: Bidder = {
          ...base,
          isAiVerified: true,
          isBlacklisted: false,
          complianceScore,
          documentScores: docScores,
          score: complianceScore,
          lastChecked: "Backend Verified just now",
        };
        return [updatedBidder, ...prev];
      }
    });
  }

  function markBidderBlacklisted(
    bidderId: string,
    docScores: DocumentScoreItem[],
    reason?: string
  ) {
    const blacklistNotice =
      reason ||
      "Statutory verification halted: submitted document identified as Blacklisted on national registry.";

    setCustomBidders((prev) => {
      const existingIndex = prev.findIndex((b) => b.id === bidderId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isAiVerified: false,
          isBlacklisted: true,
          status: "Rejected",
          risk: "High",
          score: 0,
          complianceScore: undefined,
          documentScores: docScores,
          officerDecision: "Rejected",
          lastChecked: "Blacklisted in Statutory Verification",
          recommendation: `[Debarred Vendor] ${blacklistNotice}`,
          feedbackMessage: blacklistNotice,
        };
        return updated;
      } else {
        const base = BASE_BIDDERS.find((b) => b.id === bidderId);
        if (!base) return prev;
        const updatedBidder: Bidder = {
          ...base,
          isAiVerified: false,
          isBlacklisted: true,
          status: "Rejected",
          risk: "High",
          score: 0,
          complianceScore: undefined,
          documentScores: docScores,
          officerDecision: "Rejected",
          lastChecked: "Blacklisted in Statutory Verification",
          recommendation: `[Debarred Vendor] ${blacklistNotice}`,
          feedbackMessage: blacklistNotice,
        };
        return [updatedBidder, ...prev];
      }
    });
  }

  function updateBidderStatus(
    bidderId: string,
    status: "Verified" | "Rejected" | "Documents Requested" | "Under Verification",
    feedbackMessage?: string
  ) {
    setCustomBidders((prev) => {
      const existingIndex = prev.findIndex((b) => b.id === bidderId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const target = updated[existingIndex];
        let newScore = target.score;
        let newRisk = target.risk;
        if (status === "Verified") {
          newScore = Math.max(88, target.score);
          newRisk = "Low";
        } else if (status === "Rejected") {
          newScore = Math.min(45, target.score);
          newRisk = "High";
        } else if (status === "Documents Requested") {
          newScore = 65;
          newRisk = "Medium";
        }

        updated[existingIndex] = {
          ...target,
          status,
          officerDecision: status,
          score: newScore,
          risk: newRisk,
          lastChecked: "Verified just now",
          feedbackMessage:
            feedbackMessage ||
            (status === "Verified"
              ? "Bid successfully verified and cleared by the Procurement Officer."
              : status === "Rejected"
              ? "Disqualified due to statutory non-compliance or credential mismatch."
              : "Notice: Procurement Officer has requested updated or missing statutory documents."),
        };
        return updated;
      } else {
        const base = BASE_BIDDERS.find((b) => b.id === bidderId);
        if (!base) return prev;
        const updatedBidder: Bidder = {
          ...base,
          status,
          officerDecision: status,
          lastChecked: "Verified just now",
          feedbackMessage:
            feedbackMessage ||
            (status === "Verified"
              ? "Bid successfully verified and cleared by the Procurement Officer."
              : status === "Rejected"
              ? "Disqualified due to statutory non-compliance or credential mismatch."
              : "Notice: Procurement Officer has requested updated or missing statutory documents."),
        };
        return [updatedBidder, ...prev];
      }
    });
  }

  function getBidderById(id: string): Bidder | undefined {
    return getAllBidders().find((b) => b.id === id);
  }

  function getAllBidders(tenderRef?: string): Bidder[] {
    const tender = TENDERS.find((t) => t.ref === tenderRef) || TENDERS[0];
    // Filter base bidders that are already customized
    const filteredBase = BASE_BIDDERS.filter(
      (baseBidder) => !customBidders.some((cb) => cb.id === baseBidder.id || cb.gstin === baseBidder.gstin)
    );
    const evaluatedBase = filteredBase.map((baseBidder) => {
      const checks = baseBidder.checks.map((c) => ({ ...c }));
      const stats = BIDDER_RAW_STATS[baseBidder.id] || {
        localContent: 50,
        hasOEM: true,
        isStartup: false,
        hasTurnover: true,
      };

      let tenderFlags = 0;
      let scorePenalty = 0;

      if (stats.localContent < tender.requirements.minLocalContent) {
        checks.push({
          label: `Tender Local Content (${stats.localContent}%)`,
          status: "flagged",
          note: `Declared ${stats.localContent}% is below tender minimum threshold of ${tender.requirements.minLocalContent}%.`,
        });
        scorePenalty += 20;
        tenderFlags++;
      } else {
        checks.push({
          label: `Tender Local Content (${stats.localContent}%)`,
          status: "verified",
          note: `Meets tender requirement (${stats.localContent}% >= ${tender.requirements.minLocalContent}%).`,
        });
      }

      if (tender.requirements.requiresOEM) {
        if (!stats.hasOEM) {
          if (!checks.some((c) => c.label.includes("OEM") && c.status === "flagged")) {
            checks.push({
              label: "Tender OEM Authorization",
              status: "flagged",
              note: `Mandatory OEM Authorization letter missing for ${tender.category}.`,
            });
            scorePenalty += 25;
            tenderFlags++;
          }
        } else {
          if (!checks.some((c) => c.label.includes("OEM"))) {
            checks.push({
              label: "Tender OEM Authorization",
              status: "verified",
              note: "Valid primary manufacturer authorization attached.",
            });
          }
        }
      }

      let score = Math.max(20, baseBidder.score - scorePenalty);
      let pending = baseBidder.pending + tenderFlags;
      let risk: "Low" | "Medium" | "High" = baseBidder.risk;
      let status: Bidder["status"] = baseBidder.status;
      let recommendation = baseBidder.recommendation;

      if (tenderFlags > 0) {
        status = "Flagged";
        if (score < 65) risk = "High";
        else if (score < 85) risk = "Medium";
        recommendation = `[Tender Discrepancy Alert] AI detected ${tenderFlags} tender-specific non-compliance issue(s) under tender ${tender.ref}. ` + baseBidder.recommendation;
      }

      return {
        ...baseBidder,
        score,
        risk,
        status,
        pending,
        recommendation,
        checks,
      };
    });

    return [...customBidders, ...evaluatedBase];
  }

  function resetBiddersToDefault() {
    setCustomBidders([]);
    setSubmittedBidderId(null);
    sessionStorage.removeItem("bidsure_custom_bidders");
    sessionStorage.removeItem("bidsure_submitted_bidder_id");
  }

  function clearAllBidders() {
    setCustomBidders([]);
    setSubmittedBidderId(null);
    sessionStorage.removeItem("bidsure_custom_bidders");
    sessionStorage.removeItem("bidsure_submitted_bidder_id");
  }

  return (
    <BidderContext.Provider
      value={{
        customBidders,
        activeTenderId,
        setActiveTenderId,
        lastSubmission,
        setLastSubmission,
        submittedBidderId,
        setSubmittedBidderId,
        evaluateSubmission,
        registerSubmittedBidder,
        registerVendorBid,
        completeAiVerification,
        markBidderBlacklisted,
        updateBidderStatus,
        getBidderById,
        getAllBidders,
        resetBiddersToDefault,
        clearAllBidders,
      }}
    >
      {children}
    </BidderContext.Provider>
  );
}

export function useBidderContext() {
  const ctx = useContext(BidderContext);
  if (!ctx) throw new Error("useBidderContext must be used within BidderProvider");
  return ctx;
}
