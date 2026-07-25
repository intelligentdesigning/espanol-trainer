import { cefrColor } from "@/lib/cefr";
import type { Cefr } from "@/lib/types";

/** Colour-coded CEFR level pill (A1 green → C2 violet). Pass a level or a range label. */
export function CefrBadge({ level, label, title, className = "" }: { level?: Cefr; label?: string; title?: string; className?: string }) {
  if (!level && !label) return null;
  // colour by the (lower) level; range labels colour by their first level
  const key = (level ?? (label?.slice(0, 2) as Cefr)) as Cefr;
  return (
    <span className={`cefr-badge ${className}`} style={{ ["--c" as string]: cefrColor(key) }} title={title ?? `Niveau ${label ?? level}`}>
      {label ?? level}
    </span>
  );
}
