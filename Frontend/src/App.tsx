import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuditLogProvider } from "./context/AuditLogContext";
import { BidderProvider } from "./context/BidderContext";
import LandingRoleLogin from "./pages/LandingRoleLogin";
import BidderSubmission from "./pages/BidderSubmission";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import VerifiedBidders from "./pages/VerifiedBidders";

export default function App() {
  return (
    <BidderProvider>
      <AuditLogProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingRoleLogin />} />
            <Route path="/bidder/submit" element={<BidderSubmission />} />
            <Route path="/officer/dashboard" element={<ComplianceDashboard />} />
            <Route path="/officer/verified" element={<VerifiedBidders />} />
            {/* Fallbacks */}
            <Route path="/bidder/verifying" element={<Navigate to="/bidder/submit" replace />} />
            <Route path="/officer/*" element={<Navigate to="/officer/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuditLogProvider>
    </BidderProvider>
  );
}
