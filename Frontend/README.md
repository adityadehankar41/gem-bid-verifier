# GeM BidSure — Frontend Client

A high-performance React application for automated public procurement compliance verification and technical bid evaluation on the Government e-Marketplace (GeM).

---

## Overview

GeM BidSure streamlines the technical evaluation and compliance lifecycle for government tenders governed by **GFR 2017** and **GeM Procurement Guidelines**.

The frontend provides specialized workflows tailored to both public vendors and designated procurement officers:

- **Public Tender Discovery (`/`)**: Real-time tender search, parameter inspection, and direct navigation based on organizational role.
- **Vendor Submission Portal (`/bidder/submit`)**: Guided multi-step bid documentation intake including GSTIN validation, GFR Rule 144(xi) land border declarations, DPIIT Make in India (Class-I / Class-II) local content verification, and technical parameter checklists.
- **AI Verification Simulator (`/bidder/processing`)**: Real-time stage-by-stage document verification progress with visual feedback.
- **Bidder Evaluation Report (`/bidder/report/:id`)**: Vendor self-service feedback and compliance breakdown for submitted bids.
- **Procurement Officer Dashboard (`/officer/dashboard`)**: Centralized bid evaluation matrix displaying real-time risk scores (0–100), flag categorization (High / Medium / Low), Make in India status, land border compliance, and technical parameter deviations.
- **Audit Trail & Governance (`/officer/audit`)**: Immutable chronological logging of tender parameter modifications, bidder evaluations, and officer actions.
- **Matrix Export**: Export complete evaluation matrices directly to CSV for tender committee review and official procurement records.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion (`motion/react`)
- **Routing**: React Router v7

---

## Project Structure

```text
Frontend/
├── public/                 # Static assets & public resources
├── src/
│   ├── components/         # Reusable UI components (Headers, Cards, Badges, Modals)
│   ├── context/            # React Context providers (TenderContext for global state)
│   ├── data/               # Mock evaluation datasets & tender rule constants
│   ├── pages/              # Core application views
│   │   ├── LandingRoleLogin.tsx          # Public tender discovery & role entry
│   │   ├── BiddersSubmission.tsx        # Multi-step vendor bid submission
│   │   ├── AIVerificationProcessing.tsx  # Document verification engine screen
│   │   ├── BidderReport.tsx              # Detailed vendor compliance breakdown
│   │   ├── ComplianceDashboard.tsx       # Procurement officer evaluation dashboard
│   │   └── AuditTrail.tsx                # Compliance event log and audit records
│   ├── App.tsx             # Route definitions and application shell
│   ├── index.css           # Tailwind CSS directives and global theme tokens
│   └── main.tsx            # React application entry point
├── index.html              # HTML shell
├── package.json            # Project dependencies and npm scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build and plugin configuration
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### Installation

```bash
# Navigate to the Frontend directory
cd Frontend

# Install project dependencies
npm install
```

### Running Locally

```bash
# Start the local development server
npm run dev
```
The application will launch at `http://localhost:3000` (or the next available port).

### Production Build

```bash
# Build optimized static assets into dist/
npm run build

# Preview the production build locally
npm run preview
```

---

## Backend Integration Guide

The frontend is currently architected as a pure client-side SPA with state managed via React Context (`src/context/TenderContext.tsx`). 

When connecting to the FastAPI backend (`backend/`):
1. Configure proxy rules or base URL in `src/` to point to `/api/*`.
2. Map endpoints to:
   - `POST /api/bids/submit` (Vendor bid intake & document uploads)
   - `GET /api/bids/evaluate` (Officer compliance matrix & risk calculations)
   - `GET /api/audit-logs` (Procurement audit trail)
