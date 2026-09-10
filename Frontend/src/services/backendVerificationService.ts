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
}

/**
 * Standard statutory documents verified in GeM procurement tenders.
 */
export const STATUTORY_DOCUMENT_SPECS = [
  {
    id: "udyamCert",
    name: "Udyam Registration Certificate (PDF)",
    defaultDetail: "MSME classification verified on national MSME registry.",
  },
  {
    id: "gstCert",
    name: "GST Registration Certificate & Latest GSTR-3B",
    defaultDetail: "Active GSTIN with regular return filings verified on GSTN API Gateway.",
  },
  {
    id: "panCard",
    name: "PAN Card of Entity / Authorized Signatory",
    defaultDetail: "Matched with CBDT master database and MCA21 incorporation records.",
  },
  {
    id: "itrProof",
    name: "Income Tax Returns Acknowledgement (AY 2025-26)",
    defaultDetail: "Verified electronic verification code (EVC) and statutory turnover compliance.",
  },
];

/**
 * Sends the bidder information and attached documents to the backend verification API.
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

  try {
    const response = await fetch("/api/verify-documents", {
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
    return data;
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
