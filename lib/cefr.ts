import type { Cefr } from "@/lib/types";

export const CEFR_ORDER: Cefr[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const RANK: Record<Cefr, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };

/** CSS variable holding the colour for a level (theme-aware, defined in globals.css). */
export function cefrColor(level: Cefr): string {
  return `var(--cefr-${level.toLowerCase()})`;
}

/** The spread of levels in a set → "A1", or "A1–B2" if mixed. Ignores undefined. */
export function cefrRange(levels: (Cefr | undefined)[]): { min: Cefr; max: Cefr; label: string } | null {
  const present = levels.filter((l): l is Cefr => !!l);
  if (present.length === 0) return null;
  let min = present[0], max = present[0];
  for (const l of present) {
    if (RANK[l] < RANK[min]) min = l;
    if (RANK[l] > RANK[max]) max = l;
  }
  return { min, max, label: min === max ? min : `${min}–${max}` };
}

/** Frequency-rank → CEFR fallback (used when no per-word estimate exists). */
export function cefrFromRank(rank?: number): Cefr | undefined {
  if (rank == null) return undefined;
  if (rank <= 300) return "A1";
  if (rank <= 750) return "A2";
  if (rank <= 1400) return "B1";
  if (rank <= 2200) return "B2";
  if (rank <= 3200) return "C1";
  return "C2";
}
