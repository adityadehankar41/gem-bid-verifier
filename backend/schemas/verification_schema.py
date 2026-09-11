from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class UploadedDocumentItem(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    size: Optional[int] = None
    type: Optional[str] = None
    documentType: Optional[str] = None


class VerificationRequest(BaseModel):
    bidderId: Optional[str] = Field(default="", description="Unique identifier of the bidder")
    bidderName: Optional[str] = Field(default="", description="Legal name of the bidding organization")
    udyam: Optional[str] = Field(default="", description="Udyam registration number if supplied")
    gstin: Optional[str] = Field(default="", description="GSTIN number if supplied")
    pan: Optional[str] = Field(default="", description="PAN number if supplied")
    documents: Optional[List[UploadedDocumentItem]] = Field(default_factory=list, description="Attached documents metadata")


class DocumentScoreResult(BaseModel):
    id: str
    name: str
    score: Optional[float] = None
    status: str  # "verified" | "flagged" | "blacklisted" | "halted"
    detail: Optional[str] = ""
    isBlacklisted: Optional[bool] = False
    verdict: Optional[str] = None
    issues: Optional[List[str]] = Field(default_factory=list)


class VerificationResponse(BaseModel):
    # Core prompt specification fields
    blocked: bool = Field(description="True if bidder is debarred/blacklisted")
    overall_status: str = Field(description="COMPLIANT, NEEDS_REVIEW, or BLOCKED")
    overall_score: Optional[float] = Field(default=None, description="Overall compliance score (0-100)")
    reason: Optional[str] = Field(default=None, description="Reason if blocked or review needed")
    documents: Dict[str, Any] = Field(default_factory=dict, description="Per-document status and scores dictionary")

    # Aggregator rich metadata
    risk_level: Optional[str] = None
    recommendation: Optional[str] = None
    issues: Optional[List[str]] = Field(default_factory=list)
    breakdown: Optional[Dict[str, Any]] = None

    # Frontend backward compatibility fields
    bidderId: Optional[str] = ""
    bidderName: Optional[str] = ""
    complianceScore: Optional[float] = None
    status: Optional[str] = ""
    isBlacklisted: Optional[bool] = False
    blacklistedReason: Optional[str] = None
    documentScores: Optional[List[DocumentScoreResult]] = Field(default_factory=list)
    message: Optional[str] = None
    summary: Optional[str] = None
