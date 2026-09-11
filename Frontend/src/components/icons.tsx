export function CheckIcon({ small, color = "#F7F6F2" }: { small?: boolean; color?: string }) {
  const s = small ? 8 : 10;
  return (
    <svg width={s} height={s * 0.8} viewBox="0 0 10 8" fill="none">
      <path
        d="M1 4L3.5 6.5L9 1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M7 3H14L18 7V21H7V3Z" stroke="#5B6B7D" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M14 3V7H18" stroke="#5B6B7D" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon({ large }: { large?: boolean } = {}) {
  const s = large ? 22 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="#9B9285" strokeWidth="1.4" />
      <path d="M14 14L18 18" stroke="#9B9285" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function SortIcon({ dir }: { dir: "asc" | "desc" }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      {dir === "desc" ? (
        <path d="M2 3.5L5 7L8 3.5" stroke="#5B6B7D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M2 6.5L5 3L8 6.5" stroke="#5B6B7D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path
        d="M1 5H10.5M10.5 5L6.5 1M10.5 5L6.5 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OfficerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="1" stroke="#171E27" strokeWidth="1.4" />
      <path d="M9 8H15" stroke="#171E27" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M9 12L11 14L15.5 9.5"
        stroke="#1F7A5C"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BidderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M7 3H14L18 7V21H7V3Z" stroke="#171E27" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M14 3V7H18" stroke="#171E27" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.5 12H15.5M9.5 15H15.5" stroke="#171E27" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 24, color = "#4FA37C" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L19 6V11C19 15.5 16 19 12 21C8 19 5 15.5 5 11V6L12 3Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12L11 14.5L15.5 9.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BigCheckIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" stroke="#1F7A5C" strokeWidth="1.5" />
      <path
        d="M15 24.5L21 30.5L33 17.5"
        stroke="#4FA37C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
