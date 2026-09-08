export type RiskType = "Low" | "Medium" | "High";
export type StatusType = "Cleared" | "Flagged" | "Under Review";

export const RISK_STYLE: Record<RiskType, { bg: string; text: string; dot: string }> = {
  Low: { bg: "#EEF5F1", text: "#1F7A5C", dot: "#1F7A5C" },
  Medium: { bg: "#FBF1E4", text: "#95601F", dot: "#B8752E" },
  High: { bg: "#F7EAEA", text: "#973434", dot: "#B23A3A" },
};

export const STATUS_STYLE: Record<StatusType, { bg: string; text: string }> = {
  Cleared: { bg: "#EEF5F1", text: "#1F7A5C" },
  Flagged: { bg: "#FBF1E4", text: "#95601F" },
  "Under Review": { bg: "#EEF1F4", text: "#42566B" },
};

export function scoreColor(score: number): string {
  if (score >= 85) return "#1F7A5C";
  if (score >= 65) return "#B8752E";
  return "#B23A3A";
}

export function ScoreBar({ score, wide }: { score: number; wide?: boolean }) {
  const color = scoreColor(score);
  return (
    <div className="flex items-center gap-2" style={{ minWidth: wide ? 160 : 110 }}>
      <div className="flex-1 h-1.5" style={{ backgroundColor: "#EDEAE1" }}>
        <div className="h-1.5 transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-medium" style={{ color }}>{score}</span>
    </div>
  );
}

export function RiskBadge({ risk }: { risk: RiskType | string }) {
  const s = RISK_STYLE[risk as RiskType] || RISK_STYLE.Medium;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: s.dot }} />
      {risk} risk
    </span>
  );
}

export function StatusBadge({ status }: { status: StatusType | string }) {
  const s = STATUS_STYLE[status as StatusType] || STATUS_STYLE["Under Review"];
  return (
    <span
      className="inline-block px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
}
