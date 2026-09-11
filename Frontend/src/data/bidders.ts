export interface Tender {
  ref: string;
  title: string;
  department: string;
  category: string;
  estimatedValue: string;
  closingDate: string;
  requirements: {
    minLocalContent: number;
    requiresOEM: boolean;
    requiresEPFO: boolean;
    startupExemption: boolean;
    turnoverReq: string;
  };
}

export interface VerificationCheck {
  label: string;
  status: "verified" | "flagged";
  note?: string;
}

export interface DocumentScoreItem {
  id: string;
  name: string;
  score?: number | null; // out of 100, null if blacklisted or unrated
  status: "verified" | "flagged" | "blacklisted" | "halted" | "pending";
  detail?: string;
  isBlacklisted?: boolean;
}

export interface UploadedDocumentRecord {
  id: string;
  name: string;
  size: number;
  type?: string;
  dataUrl?: string;
  base64?: string;
  uploadedAt?: string;
  documentType?: string;
}

export interface Bidder {
  id: string;
  name: string;
  gstin: string;
  score: number;
  risk: "Low" | "Medium" | "High";
  status: "Under Verification" | "Verified" | "Rejected" | "Documents Requested" | "Cleared" | "Flagged" | "Under Review" | "Blacklisted";
  pending: number;
  lastChecked: string;
  recommendation: string;
  checks: VerificationCheck[];
  feedbackMessage?: string;
  officerDecision?: "Verified" | "Rejected" | "Documents Requested" | "Under Verification" | null;
  submittedAt?: string;
  udyam?: string;
  pan?: string;
  attachedDocsCount?: number;
  attachedDocuments?: UploadedDocumentRecord[];
  isAiVerified?: boolean;
  isBlacklisted?: boolean;
  complianceScore?: number;
  documentScores?: DocumentScoreItem[];
}

export const TENDERS: Tender[] = [
  {
    ref: "GEM/2026/B/458213",
    title: "Supply of Industrial Safety & Protective Equipment",
    department: "Central Public Procurement Division",
    category: "Safety Equipment",
    estimatedValue: "₹ 48.50 Lakhs",
    closingDate: "15 Oct 2026",
    requirements: {
      minLocalContent: 50, // 50% Class-II Local Supplier
      requiresOEM: false,  // Standard reseller allowed
      requiresEPFO: true,
      startupExemption: true,
      turnoverReq: "₹ 15 Lakhs (Exempt for Startups/MSME)",
    },
  },
  {
    ref: "GEM/2026/B/992104",
    title: "High-Pressure Refinery Valve Assemblies & Actuators",
    department: "Engineering Procurement Directorate",
    category: "Heavy Machinery & Refinery Valves",
    estimatedValue: "₹ 3.20 Crores",
    closingDate: "28 Oct 2026",
    requirements: {
      minLocalContent: 75, // Stricter 75% Make in India requirement
      requiresOEM: true,   // Mandatory OEM Authorization Letter
      requiresEPFO: true,
      startupExemption: false, // Critical equipment - no turnover exemption
      turnoverReq: "₹ 1.00 Crore",
    },
  },
  {
    ref: "GEM/2026/B/110482",
    title: "Turnkey Fire Hydrant Automation & Leak Monitoring",
    department: "Fire & Safety Systems Directorate",
    category: "Safety Instrumentation",
    estimatedValue: "₹ 1.85 Crores",
    closingDate: "05 Nov 2026",
    requirements: {
      minLocalContent: 60,
      requiresOEM: true,
      requiresEPFO: true,
      startupExemption: true,
      turnoverReq: "₹ 50 Lakhs (Exempt for Startups/MSME)",
    },
  },
];

export const TENDER = TENDERS[0];

// Hidden raw stats evaluated against tender rules by the AI Verification Engine
export const BIDDER_RAW_STATS: Record<
  string,
  { localContent: number; hasOEM: boolean; isStartup: boolean; hasTurnover: boolean }
> = {
  b1: { localContent: 60, hasOEM: false, isStartup: false, hasTurnover: true }, // Passes Tender 1, Fails Tender 2 (Local Content 60 < 75 & no OEM)
  b2: { localContent: 85, hasOEM: true, isStartup: false, hasTurnover: true },  // Passes all tenders
  b3: { localContent: 55, hasOEM: true, isStartup: false, hasTurnover: true },  // Fails Tender 2 (55 < 75) & Tender 3 (55 < 60)
  b4: { localContent: 90, hasOEM: true, isStartup: false, hasTurnover: true },  // Passes all tenders
  b5: { localContent: 40, hasOEM: false, isStartup: false, hasTurnover: false }, // Fails all
  b6: { localContent: 100, hasOEM: true, isStartup: true, hasTurnover: false }, // Startup: passes Tender 1 & 3, Fails Tender 2 (no exemption)
  b7: { localContent: 62, hasOEM: false, isStartup: false, hasTurnover: true }, // Fails Tender 2 (62 < 75 & no OEM)
};

export const BASE_BIDDERS: Bidder[] = [
  {
    id: "b1",
    name: "Sundaram Industrial Equipments Pvt. Ltd.",
    gstin: "33AAAAA0000A1Z5",
    pan: "AAAAA0000A",
    udyam: "UDYAM-TN-01-1111111",
    score: 96,
    risk: "Low",
    status: "Under Verification",
    isAiVerified: false,
    pending: 0,
    lastChecked: "Awaiting Verification",
    recommendation: "Statutory credentials and certificates attached. Ready for AI document verification.",
    checks: [
      { label: "Udyam / MSME Registration", status: "verified" },
      { label: "GST Registration & Returns", status: "verified" },
      { label: "PAN & Income Tax Compliance", status: "verified" },
      { label: "EPFO / ESIC Compliance", status: "verified" },
      { label: "Blacklisting & Debarment Status", status: "verified" },
    ],
  },
  {
    id: "b2",
    name: "Bharat MSME Traders",
    gstin: "07BBBBB1111B2Z6",
    pan: "BBBBB1111B",
    udyam: "UDYAM-DL-01-2222222",
    score: 88,
    risk: "Low",
    status: "Under Verification",
    isAiVerified: false,
    pending: 0,
    lastChecked: "Awaiting Verification",
    recommendation: "Udyam and GST certificates submitted. Ready for AI document verification.",
    checks: [
      { label: "Udyam / MSME Registration", status: "verified" },
      { label: "GST Registration & Returns", status: "verified" },
      { label: "PAN & Income Tax Compliance", status: "verified" },
      { label: "Blacklisting & Debarment Status", status: "verified" },
    ],
  },
  {
    id: "b3",
    name: "Coastal EPC Solutions",
    gstin: "29CCCCC2222C3Z7",
    pan: "CCCCC2222C",
    udyam: "UDYAM-KA-01-3333333",
    score: 72,
    risk: "Medium",
    status: "Under Verification",
    isAiVerified: false,
    pending: 2,
    lastChecked: "Awaiting Verification",
    recommendation: "Certificates uploaded. Potential filing delay noted in GSTR-3B audit.",
    checks: [
      { label: "Udyam / MSME Registration", status: "verified" },
      { label: "GST Registration & Returns", status: "flagged", note: "GSTR-3B return for Q2 filed past due date." },
      { label: "PAN & Income Tax Compliance", status: "verified" },
      { label: "EPFO / ESIC Compliance", status: "flagged", note: "EPFO electronic challan return receipt expired." },
    ],
  },
  {
    id: "b4",
    name: "Vikram Safety Systems",
    gstin: "24DDDDD3333D4Z8",
    pan: "DDDDD3333D",
    udyam: "UDYAM-GJ-22-0199736",
    score: 91,
    risk: "Low",
    status: "Under Verification",
    isAiVerified: false,
    pending: 0,
    lastChecked: "Awaiting Verification",
    recommendation: "All statutory registrations and tender-specific documents uploaded.",
    checks: [
      { label: "Udyam / MSME Registration", status: "verified" },
      { label: "GST Registration & Returns", status: "verified" },
      { label: "PAN & Income Tax Compliance", status: "verified" },
      { label: "OEM Authorization", status: "verified" },
    ],
  },
  {
    id: "b5",
    name: "NovaTech OEM Partners",
    gstin: "19EEEEE4444E5Z9",
    pan: "EEEEE4444E",
    udyam: "UDYAM-KA-01-9876543",
    score: 58,
    risk: "High",
    status: "Under Verification",
    isAiVerified: false,
    pending: 4,
    lastChecked: "Awaiting Verification",
    recommendation: "Statutory documents uploaded. Cross-portal validation required.",
    checks: [
      { label: "Udyam / MSME Registration", status: "flagged", note: "Udyam enterprise number requires officer review." },
      { label: "PAN & Income Tax Compliance", status: "flagged", note: "PAN records under verification." },
      { label: "OEM Authorization", status: "flagged", note: "OEM Authorization letter pending validation." },
    ],
  },
];

/**
 * AI Verification Engine: Evaluates bidders against tender-specific requirements
 */
export function getEvaluatedBidders(tenderRef?: string): Bidder[] {
  const tender = TENDERS.find((t) => t.ref === tenderRef) || TENDERS[0];

  return BASE_BIDDERS.map((baseBidder) => {
    const checks: VerificationCheck[] = baseBidder.checks.map((c) => ({ ...c }));
    const stats = BIDDER_RAW_STATS[baseBidder.id] || {
      localContent: 50,
      hasOEM: true,
      isStartup: false,
      hasTurnover: true,
    };

    let tenderFlags = 0;
    let scorePenalty = 0;

    // 1. Check Make in India / Local Content against tender minimum
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

    // 2. Check OEM Authorization requirement
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

    // 3. Check Startup & MSME Turnover Exemption policy
    if (!tender.requirements.startupExemption && stats.isStartup && !stats.hasTurnover) {
      checks.push({
        label: "Turnover Exemption Ineligible",
        status: "flagged",
        note: `Tender ${tender.ref} strictly requires ${tender.requirements.turnoverReq}; prior turnover exemption not allowed for this critical category.`,
      });
      scorePenalty += 15;
      tenderFlags++;
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
      score: baseBidder.complianceScore || score,
      risk,
      status: baseBidder.officerDecision || baseBidder.status,
      pending,
      recommendation,
      checks,
      isAiVerified: baseBidder.isAiVerified ?? false,
      complianceScore: baseBidder.complianceScore,
      documentScores: baseBidder.documentScores,
      officerDecision: baseBidder.officerDecision,
      feedbackMessage: baseBidder.feedbackMessage,
    };
  });
}

export const BIDDERS = getEvaluatedBidders(TENDERS[0].ref);

export function getBidderById(id: string | undefined, tenderRef?: string): Bidder | undefined {
  if (!id) return undefined;
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem("bidsure_custom_bidders");
      if (saved) {
        const custom: Bidder[] = JSON.parse(saved);
        const match = custom.find((b) => b.id === id);
        if (match) return match;
      }
    } catch {
      // ignore
    }
  }
  const allBidders = getEvaluatedBidders(tenderRef);
  return allBidders.find((b) => b.id === id);
}
