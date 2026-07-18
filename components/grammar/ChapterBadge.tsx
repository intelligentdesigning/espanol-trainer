"use client";

import { IconCheck } from "@/components/icons";
import type { ChapterStat } from "@/lib/grammar-progress";

/** Per-chapter status pill: passed (green ✓ + best%), attempted (amber best%), or nothing. */
export function ChapterBadge({ stat }: { stat?: ChapterStat }) {
  if (!stat || stat.bestPct === 0) return null;
  if (stat.passed) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
        <IconCheck className="h-3.5 w-3.5" /> {stat.bestPct}%
      </span>
    );
  }
  return <span className="shrink-0 rounded-full bg-brand-2/15 px-2 py-0.5 text-xs font-bold text-brand-2">{stat.bestPct}%</span>;
}
