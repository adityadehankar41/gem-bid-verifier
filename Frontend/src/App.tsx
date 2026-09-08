import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuditLogProvider } from "./context/AuditLogContext";
import { BidderProvider } from "./context/BidderContext";
import LandingRoleLogin from "./pages/LandingRoleLogin";
import BidderSubmission from "./pages/BidderSubmission";
import AIVerificationProcessing from "./pages/AIVerificationProcessing";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import BidderReport from "./pages/BidderReport";
import AuditTrail from "./pages/AuditTrail";
import { TENDERS } from "./data/bidders";

export default function App() {
  // Global active tender state managing tender-specific evaluations
  const [activeTenderId, setActiveTenderId] = useState<string>(TENDERS[0].ref);

  return (
    <BidderProvider>
      <AuditLogProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingRoleLogin />} />
            <Route
              path="/bidder/submit"
              element={
                <BidderSubmission
                  activeTenderId={activeTenderId}
                  onSelectTender={setActiveTenderId}
                />
              }
            />
            <Route
              path="/bidder/verifying"
              element={<AIVerificationProcessing activeTenderId={activeTenderId} />}
            />
            <Route
              path="/officer/dashboard"
              element={
                <ComplianceDashboard
                  activeTenderId={activeTenderId}
                  onSelectTender={setActiveTenderId}
                />
              }
            />
            <Route
              path="/officer/bidder/:id"
              element={
                <BidderReport
                  activeTenderId={activeTenderId}
                  onSelectTender={setActiveTenderId}
                />
              }
            />
            <Route
              path="/officer/audit-trail"
              element={
                <AuditTrail
                  activeTenderId={activeTenderId}
                  onSelectTender={setActiveTenderId}
                />
              }
            />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuditLogProvider>
    </BidderProvider>
  );
}
