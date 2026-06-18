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
export const IconUser = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const IconChevronDown = ({ className }: P) => (
  <svg {...base(className)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconPlus = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconPencil = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);
export const IconTrash = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
);
export const IconDownload = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 3v12M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
);
export const IconUpload = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 15V3M8 7l4-4 4 4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
);
export const IconShield = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconVolume = ({ className }: P) => (
  <svg {...base(className)}><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>
);
export const IconHash = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></svg>
);
