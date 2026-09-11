import { Link } from "react-router-dom";
import { Tender } from "../data/bidders";

interface OfficerHeaderProps {
  tenders?: Tender[];
  activeTenderId?: string;
  onSelectTender?: (ref: string) => void;
}

export default function OfficerHeader(_props?: OfficerHeaderProps) {
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
            GeM Procurement
          </span>
        </Link>

        <span className="text-sm font-medium text-[#1F7A5C] border-l pl-5 hidden sm:inline-block" style={{ borderColor: "#DCD7CB" }}>
          Officer Verification Portal
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#1F7A5C]" />
          <span className="text-xs font-medium text-[#5B6B7D]">
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
