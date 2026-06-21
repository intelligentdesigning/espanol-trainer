"use client";

import { useI18n } from "@/lib/i18n/locale";

// Category colours mirror the Vokabular cards; everything else stays muted.
const COLOR: Record<string, string> = {
  noun: "text-noun",
  verb: "text-verb",
  adj: "text-adj",
};

/** Small "Wortart" badge (Substantiv / Verb / Adjektiv …) shown next to a word. */
export function PosTag({ pos, className = "" }: { pos?: string; className?: string }) {
  const { t } = useI18n();
  if (!pos) return null;
  const key = `pos.${pos}`;
  const label = t(key as never);
  if (!label || label === key) return null; // unknown / unlabelled → render nothing
  return (
    <span
      className={`inline-block rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium ${COLOR[pos] || "text-muted"} ${className}`}
    >
      {label}
    </span>
  );
}
