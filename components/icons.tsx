// Minimal stroke icon set (currentColor). Replaces emoji used earlier.
type P = { className?: string };
const base = (className?: string) => ({
  className,
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconCards = ({ className }: P) => (
  <svg {...base(className)}><rect x="3" y="7" width="13" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /></svg>
);
export const IconBook = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M19 19H6a2 2 0 0 0-2 2" /></svg>
);
export const IconLetters = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 18 8 7l4 11" /><path d="M5.5 14h5" /><path d="M20 11.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" /><path d="M22.5 11.5V17" /></svg>
);
export const IconClock = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconShapes = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 3 4 9l3 9h10l3-9z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconNotebook = ({ className }: P) => (
  <svg {...base(className)}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3v18" /><path d="M12 8h4M12 12h4" /></svg>
);
export const IconCheck = ({ className }: P) => (
  <svg {...base(className)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconArrowRight = ({ className }: P) => (
  <svg {...base(className)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconBookOpen = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 6.5C10.5 5 8 4.5 4 5v13c4-.5 6.5 0 8 1.5 1.5-1.5 4-2 8-1.5V5c-4-.5-6.5 0-8 1.5z" /><path d="M12 6.5V20" /></svg>
);
export const IconConjugate = ({ className }: P) => (
  <svg {...base(className)}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>
);
export const IconTrophy = ({ className }: P) => (
  <svg {...base(className)}><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" /><path d="M10 14h4M9 20h6M12 14v6" /></svg>
);
