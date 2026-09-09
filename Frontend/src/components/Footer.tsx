export default function Footer({ dark }: { dark?: boolean }) {
  return (
    <footer
      className="w-full px-6 md:px-16 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left mt-auto"
      style={{ borderTop: `1px solid ${dark ? "#1C2A3E" : "#DCD7CB"}` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: dark ? "#4FA37C" : "#1F7A5C" }}
        />
        <span className="text-xs font-medium" style={{ color: dark ? "#8E9DAE" : "#7A7366" }}>
          BidSure AI &middot; Government e-Marketplace (GeM) Bid Compliance Platform
        </span>
      </div>
      <span className="text-xs" style={{ color: dark ? "#6C7A88" : "#9B9285" }}>
        Integrated Statutory &amp; Regulatory Verification System
      </span>
    </footer>
  );
}
