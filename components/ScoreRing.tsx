// Circular score indicator — replaces emoji result screens.
export function ScoreRing({ correct, total, size = 132 }: { correct: number; total: number; size?: number }) {
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct >= 80 ? "#16a34a" : pct >= 50 ? "var(--brand-2)" : "var(--brand)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={10} style={{ stroke: "var(--border)" }} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          style={{ stroke: color, transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold">{correct}<span className="text-lg text-muted">/{total}</span></span>
        <span className="text-xs text-muted">{pct}%</span>
      </div>
    </div>
  );
}
