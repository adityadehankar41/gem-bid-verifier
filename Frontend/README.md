# GeM BidSure — AI-Powered Bid Compliance Verification Platform

An automated public procurement compliance verification and technical bid evaluation platform for the Government e-Marketplace (GeM), governed by GFR 2017 and standard statutory compliance regulations.

---

## Architecture & User Workflows

The application connects the **Vendor / Bidder** and **Procurement Officer** through a unified state management layer (`BidderContext`):

### 1. Bidder Workflow (`/bidder/submit`)
- **Navigation Tabs**:
  - **Submit Tender Bid**: 3-step structured wizard covering Enterprise Credentials (Udyam, GSTIN, PAN), Statutory Document Attachments (Udyam cert, GST certificate, PAN card, ITR acknowledgments), and Final Solemn Declaration.
  - **Submitted Bids & Status**: Clean, tabular view of all registered bids with live procurement status (`Pending Verification`, `Verified`, `Rejected`, `Documents Requested`) and official Officer Remarks.
- **Submission Action**:
  - On submission, the bid is registered with `isAiVerified: false` and `status: "Under Verification"`.
  - The form clears, and the user is redirected to the clean "Submitted Bids & Status" tab.
  - Documents are internally routed to the officer queue for verification.

### 2. Officer Workflow (`/officer/dashboard` & `/officer/verified`)
- **Pending Verification Queue (`/officer/dashboard`)**:
  - Displays newly submitted vendor bids awaiting document verification alongside existing tenders.
  - Procurement officers initiate automated multi-source compliance verification across Udyam, GSTN, CBDT PAN, and DigiLocker databases.
- **Verified Bidders & Official Determination (`/officer/verified`)**:
  - Lists all verified bids with overall compliance score (0–100) and risk tier (Low, Medium, High).
  - Officer can inspect document-level scores and record final official determinations:
    - **Accept / Verify Bid**: Qualifies the vendor for commercial stage opening.
    - **Disqualify / Reject**: Disqualifies the bid with recorded statutory discrepancy reasons.
    - **Request Documents**: Solicits supplementary documents or clarifications.
- **Live Status Sync**:
  - Any decision recorded by the officer immediately updates the bidder's status on the vendor side.

---

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Routing**: React Router DOM (v7)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Typography**: Google Fonts (*Fraunces* serif & *IBM Plex Sans*)
- **State Management**: React Context (`BidderContext`, `AuditLogContext`) with `sessionStorage` fallback

---

## Project Structure

```text
src/
├── components/           # UI components (OfficerHeader, Footer, Badges, Icons)
├── context/
│   ├── BidderContext.tsx # Central state management for tenders, bids, and officer decisions
│   └── AuditLogContext.tsx # Audit logs for verification activities
├── data/
│   └── bidders.ts        # Data contracts, interfaces, and baseline tender mock data
├── pages/
│   ├── LandingRoleLogin.tsx     # Role-based landing portal (Vendor vs. Officer)
│   ├── BidderSubmission.tsx     # 3-step vendor bid filing + clean submitted bids table
│   ├── ComplianceDashboard.tsx  # Officer verification dashboard & pending queue
│   └── VerifiedBidders.tsx      # Officer evaluation matrix & qualification actions
├── App.tsx               # Route configurations and Context Providers
├── index.css             # Tailwind CSS tokens
└── main.tsx              # React entry point
```

---

## Backend Integration Guide

The frontend is fully prepared for backend handoff. Backend engineers can integrate API endpoints at the marked integration points in the codebase:

### API Endpoints Mapping:

| Endpoint | Method | Component / Context | Purpose |
|---|---|---|---|
| `/api/vendor/bids` | `POST` | `BidderSubmission.tsx` (`handleFinalSubmit`) | Submits vendor credentials, statutory IDs, and file attachments. |
| `/api/vendor/bids` | `GET` | `BidderSubmission.tsx` (`SubmittedBidsTable`) | Fetches all submitted bids and live officer decisions for the vendor. |
| `/api/officer/bids/pending` | `GET` | `ComplianceDashboard.tsx` | Retrieves all bids currently in queue (`isAiVerified: false`). |
| `/api/officer/verify` | `POST` | `ComplianceDashboard.tsx` (`completeAiVerification`) | Runs AI verification pipeline across government databases and returns document scores. |
| `/api/officer/decision` | `POST` | `VerifiedBidders.tsx` (`updateBidderStatus`) | Records officer determination (`Verified`, `Rejected`, `Documents Requested`). |

### Key State Contracts (`src/context/BidderContext.tsx`):
- `registerVendorBid(payload)`: Creates and queues vendor submission.
- `completeAiVerification(bidderId, docScores, score)`: Marks AI analysis completed.
- `updateBidderStatus(bidderId, status, feedbackMessage)`: Updates official decision and reflects on the bidder portal.

