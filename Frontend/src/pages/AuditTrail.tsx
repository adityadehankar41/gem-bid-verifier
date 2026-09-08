import { useState } from "react";
import { Link } from "react-router-dom";
import OfficerHeader from "../components/OfficerHeader";
import Footer from "../components/Footer";
import { SearchIcon } from "../components/icons";
import { useAuditLog } from "../context/AuditLogContext";
import { TENDERS, BASE_BIDDERS } from "../data/bidders";

interface AuditTrailProps {
  activeTenderId?: string;
  onSelectTender?: (ref: string) => void;
}

export default function AuditTrail({
  activeTenderId = TENDERS[0].ref,
  onSelectTender,
}: AuditTrailProps) {
  const { logs } = useAuditLog();
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("All");

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      l.bidder.toLowerCase().includes(q) ||
      l.event.toLowerCase().includes(q) ||
      l.detail.toLowerCase().includes(q);
    const matchesActor = actorFilter === "All" || l.actor.includes(actorFilter);
    return matchesSearch && matchesActor;
  });

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F7F6F2" }}>
      <OfficerHeader
        tenders={TENDERS}
        activeTenderId={activeTenderId}
        onSelectTender={onSelectTender}
      />

      <div className="flex-1 max-w-4xl w-full mx-auto px-6 md:px-8 py-8">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A5C] block mb-1">
            Statutory Traceability Repository
          </span>
          <h1 style={{ fontFamily: "'Fraunces', serif", color: "#171E27" }} className="text-3xl font-bold">
            Audit Trail
          </h1>
          <p className="text-sm mt-1" style={{ color: "#5B6B7D" }}>
            An immutable, timestamped ledger of every automated AI verification check, portal API response, and procurement officer decision.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A96A3]">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by bidder, event, or detail..."
              aria-label="Search audit trail"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded bg-white outline-none"
              style={{ border: "1px solid #DCD7CB", color: "#171E27" }}
            />
          </div>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            aria-label="Filter by actor"
            className="px-3.5 py-2.5 text-sm rounded bg-white cursor-pointer"
            style={{ border: "1px solid #DCD7CB", color: "#171E27" }}
          >
            <option value="All">All Actors (System &amp; Officer)</option>
            <option value="System">System (AI Engine) Only</option>
            <option value="Officer">Procurement Officer Only</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div
            className="p-12 text-center rounded bg-white border border-[#DCD7CB]"
          >
            <p className="text-sm font-semibold text-[#171E27]">No audit records match your query</p>
            <p className="text-xs text-[#8A96A3] mt-1">Try clearing your search query or actor filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((l) => {
              const matchedBidder = BASE_BIDDERS.find((b) => b.name === l.bidder);
              const isOfficer = l.actor.includes("Officer");
              return (
                <div
                  key={l.id}
                  className="p-4 rounded bg-white transition-all hover:shadow-2xs"
                  style={{
                    border: "1px solid #DCD7CB",
                    borderLeft: `3px solid ${isOfficer ? "#1F7A5C" : "#5B6B7D"}`,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#171E27]">
                      {l.event}
                    </span>
                    <span className="text-xs font-mono text-[#8A96A3]">
                      {l.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-[#5B6B7D] mb-1.5">
                    Bidder:{" "}
                    {matchedBidder ? (
                      <Link
                        to={`/officer/bidder/${matchedBidder.id}`}
                        className="font-medium text-[#1F7A5C] hover:underline"
                      >
                        {l.bidder}
                      </Link>
                    ) : (
                      <span className="font-medium text-[#171E27]">{l.bidder}</span>
                    )}{" "}
                    &middot; Actor: <span className="font-semibold text-[#171E27]">{l.actor}</span>
                  </p>

                  <p className="text-xs text-[#3E4C59] leading-relaxed">
                    {l.detail}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
