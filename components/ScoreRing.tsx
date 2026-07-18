// Circular score indicator — replaces emoji result screens.
export function ScoreRing({ correct, total, size = 132 }: { correct: number; total: number; size?: number }) {
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color = pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--brand-2)" : "var(--brand)";
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
          strokeDashoffset={offset}
          style={{ stroke: color, transition: "stroke-dashoffset .9s ease-out" }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from={circ}
            to={offset}
            dur="0.9s"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0 0 0.58 1"
            fill="freeze"
          />
        </circle>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-3xl font-bold">{correct}<span className="text-lg text-muted">/{total}</span></span>
        <span className="font-display text-xs text-muted">{pct}%</span>
      </div>
    </div>
  );
}
