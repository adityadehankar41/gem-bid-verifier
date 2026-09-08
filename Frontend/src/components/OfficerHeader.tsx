import { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import { Tender, TENDERS } from "../data/bidders";

interface OfficerHeaderProps {
  tenders?: Tender[];
  activeTenderId?: string;
  onSelectTender?: (ref: string) => void;
}

export default function OfficerHeader({
  tenders = TENDERS,
  activeTenderId = TENDERS[0].ref,
  onSelectTender,
}: OfficerHeaderProps) {
  return (
    <header
      className="bg-white px-6 md:px-12 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30"
      style={{ borderBottom: "1px solid #DCD7CB" }}
    >
      <div className="flex items-center gap-6 md:gap-8">
        <Link to="/" className="flex items-center gap-2 text-decoration-none">
          <span
            style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }}
            className="text-2xl font-bold tracking-tight"
          >
            BidSure AI
          </span>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#EEF5F1] text-[#1F7A5C] border border-[#BDE0D2]">
            GeM CPCL
          </span>
        </Link>

        <nav className="flex items-center gap-5 border-l pl-5" style={{ borderColor: "#DCD7CB" }}>
          <HeaderLink to="/officer/dashboard">Dashboard</HeaderLink>
          <HeaderLink to="/officer/audit-trail">Audit Trail</HeaderLink>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {tenders && tenders.length > 0 && onSelectTender && (
          <div className="flex items-center gap-2">
            <label htmlFor="tender-select" className="text-xs uppercase tracking-wider font-semibold text-[#5B6B7D]">
              Active Tender:
            </label>
            <select
              id="tender-select"
              value={activeTenderId}
              onChange={(e) => onSelectTender(e.target.value)}
              aria-label="Select active tender"
              className="px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors bg-[#F4EFE6] border border-[#C8BFAD] text-[#171E27] focus:outline-none"
            >
              {tenders.map((t) => (
                <option key={t.ref} value={t.ref}>
                  {t.ref} — {t.title.length > 32 ? t.title.slice(0, 32) + "..." : t.title} ({t.estimatedValue})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#1F7A5C]" />
          <span className="text-xs font-medium hidden sm:inline-block text-[#5B6B7D]">
            Procurement Officer
          </span>
          <Link
            to="/"
            className="text-xs ml-2 px-2.5 py-1 rounded transition-colors border border-[#DCD7CB] text-[#5B6B7D] bg-[#FAF9F6] hover:bg-[#EDEAE1]"
          >
            Exit
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className="text-sm py-1 transition-colors relative"
      style={({ isActive }) => ({
        color: isActive ? "#1F7A5C" : "#5B6B7D",
        fontWeight: isActive ? 600 : 400,
        borderBottom: isActive ? "2px solid #1F7A5C" : "2px solid transparent",
      })}
    >
      {children}
    </NavLink>
  );
}
