import { Bidder, DocumentScoreItem, UploadedDocumentRecord } from "../data/bidders";

export interface BackendVerificationResponse {
  bidderId: string;
  bidderName: string;
  verifiedAt?: string;
  documentScores?: DocumentScoreItem[] | null;
  complianceScore?: number | null;
  status: "verified" | "flagged" | "blacklisted" | "pending_backend_engine" | "pending" | string;
  isBlacklisted?: boolean;
  blacklistedDocumentId?: string;
  blacklistedReason?: string;
  message?: string;
  summary?: string;
  engine?: string;
  receivedDocumentsCount?: number;
  // Prompt-standardized fields
  blocked?: boolean;
  overall_status?: "COMPLIANT" | "NEEDS_REVIEW" | "BLOCKED" | "NON_COMPLIANT" | string;
  overall_score?: number | null;
  reason?: string;
  documents?: Record<string, { status: string; score?: number; verdict?: string; issues?: string[] }>;
}

/**
 * Standard statutory documents verified in GeM procurement tenders.
 */
export const STATUTORY_DOCUMENT_SPECS = [
  {
    id: "panCard",
    name: "PAN Card of Entity / Authorized Signatory",
    defaultDetail: "Matched with CBDT master database and MCA21 incorporation records.",
  },
  {
    id: "gstCert",
    name: "GST Registration Certificate & Latest GSTR-3B",
    defaultDetail: "Active GSTIN with regular return filings verified on GSTN API Gateway.",
  },
  {
    id: "udyamCert",
    name: "Udyam Registration Certificate (PDF)",
    defaultDetail: "MSME classification verified on national MSME registry.",
  },
];

/**
 * Sends the bidder information and attached documents to the FastAPI verification endpoint.
 */
export async function performBackendDocumentVerification(
  bidder: Bidder
): Promise<BackendVerificationResponse> {
  const payload = {
    bidderId: bidder?.id || "",
    bidderName: bidder?.name || "",
    udyam: bidder?.udyam || "",
    gstin: bidder?.gstin || "",
    pan: bidder?.pan || "",
    documents: bidder?.attachedDocuments || [],
  };

  const API_URL = "/api/verification/run";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        bidderId: bidder?.id || "",
        bidderName: bidder?.name || "",
        status: "pending_backend_engine",
        message: `Backend verification endpoint returned HTTP ${response.status}.`,
        documentScores: null,
        complianceScore: null,
      };
    }

    const data: BackendVerificationResponse = await response.json();

    // Map standardized response fields
    const isBlocked = data.blocked === true || data.overall_status === "BLOCKED" || data.isBlacklisted === true;
    const finalScore = typeof data.overall_score === "number" ? data.overall_score : data.complianceScore;
    const finalStatus = isBlocked ? "blacklisted" : (data.overall_status === "COMPLIANT" ? "verified" : (data.status || "flagged"));

    return {
      ...data,
      isBlacklisted: isBlocked,
      blacklistedReason: isBlocked ? (data.reason || data.blacklistedReason || "Bidder found on national statutory blacklist registry.") : undefined,
      complianceScore: finalScore,
      status: finalStatus,
    };
  } catch (err: any) {
    return {
      bidderId: bidder?.id || "",
      bidderName: bidder?.name || "",
      status: "pending_backend_engine",
      message: err?.message || "Backend verification endpoint unavailable.",
      documentScores: null,
      complianceScore: null,
    };
  }
}

