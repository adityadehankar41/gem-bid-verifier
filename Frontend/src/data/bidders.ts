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

export interface Bidder {
  id: string;
  name: string;
  gstin: string;
  score: number;
  risk: "Low" | "Medium" | "High";
  status: "Cleared" | "Flagged" | "Under Review";
  pending: number;
  lastChecked: string;
  recommendation: string;
  checks: VerificationCheck[];
}

export const TENDERS: Tender[] = [
  {
    ref: "GEM/2026/B/458213",
    title: "Supply of Industrial Safety & Protective Equipment",
    department: "Chennai Petroleum Corporation Limited (CPCL)",
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
    department: "Chennai Petroleum Corporation Limited (CPCL)",
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
    department: "Chennai Petroleum Corporation Limited (CPCL)",
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
    score: 96,
    risk: "Low",
    status: "Cleared",
    pending: 0,
    lastChecked: "2 hours ago",
    recommendation:
      "All statutory and eligibility requirements verified against portal records. Bidder meets core GeM procurement parameters.",
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
    score: 88,
    risk: "Low",
    status: "Cleared",
    pending: 0,
    lastChecked: "3 hours ago",
    recommendation:
      "All statutory requirements verified. Minor documentation formatting noted, no impact on statutory eligibility.",
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
    score: 72,
    risk: "Medium",
    status: "Flagged",
    pending: 2,
    lastChecked: "45 minutes ago",
    recommendation:
      "EPFO certificate has expired and GST returns show a delay in the last filing cycle. Recommend requesting updated documents before commercial opening.",
    checks: [
      { label: "Udyam / MSME Registration", status: "verified" },
      { label: "GST Registration & Returns", status: "flagged", note: "GSTR-3B return for Q2 filed 18 days past due date." },
      { label: "PAN & Income Tax Compliance", status: "verified" },
      { label: "EPFO / ESIC Compliance", status: "flagged", note: "EPFO electronic challan return receipt expired 3 months ago." },
    ],
  },
  {
    id: "b4",
    name: "Vikram Safety Systems",
    gstin: "24DDDDD3333D4Z8",
    score: 91,
    risk: "Low",
    status: "Cleared",
    pending: 0,
    lastChecked: "1 hour ago",
    recommendation: "All statutory registrations and tender-specific eligibility verified. Fully compliant for award consideration.",
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
    score: 58,
    risk: "High",
    status: "Flagged",
    pending: 4,
    lastChecked: "20 minutes ago",
    recommendation:
      "Multiple severe discrepancies detected, including a possible match on the Central Public Procurement Portal debarment list. Manual officer scrutiny required.",
    checks: [
      { label: "Udyam / MSME Registration", status: "flagged", note: "Udyam enterprise number does not match registered entity name." },
      { label: "PAN & Income Tax Compliance", status: "flagged", note: "PAN records mismatch with MCA21 incorporation filing." },
      { label: "OEM Authorization", status: "flagged", note: "Mandatory OEM Authorization letter not submitted." },
      { label: "Blacklisting & Debarment Status", status: "flagged", note: "Exact company name match found on CPPP Debarment list." },
    ],
  },
  {
    id: "b6",
    name: "Anand Startup Innovations",
    gstin: "27FFFFF5555F6Z0",
    score: 84,
    risk: "Low",
    status: "Cleared",
    pending: 1,
    lastChecked: "4 hours ago",
    recommendation:
      "Statutory requirements verified. DPIIT Startup India certificate is due for annual renewal within 30 days.",
    checks: [
      { label: "Udyam / MSME Registration", status: "verified" },
      { label: "GST Registration & Returns", status: "verified" },
      { label: "Startup India Recognition", status: "flagged", note: "DPIIT recognition renewal due in 30 days." },
    ],
  },
  {
    id: "b7",
    name: "Ganga Engineering Works",
    gstin: "09GGGGG6666G7Z1",
    score: 65,
    risk: "Medium",
    status: "Under Review",
    pending: 3,
    lastChecked: "10 minutes ago",
    recommendation:
      "Verification in progress for declared local content and ESIC active registration. Awaiting officer review of uploaded chartered engineer certificate.",
    checks: [
      { label: "GST Registration & Returns", status: "verified" },
      { label: "PAN & Income Tax Compliance", status: "verified" },
      { label: "ESIC Compliance", status: "flagged", note: "Employer registration code under manual validation." },
      { label: "Make in India / Local Content", status: "flagged", note: "Declared 62% local content, supporting auditor certificate pending." },
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
    let status: "Cleared" | "Flagged" | "Under Review" = baseBidder.status;
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
