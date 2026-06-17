"use client";

import { useI18n } from "@/lib/i18n/locale";

/**
 * Stacked progress bar (richtig green · falsch red · neu grey) + a counts line
 * and a meaningful "X% gelernt" figure (= richtig / total). Replaces the old
 * single "X% gemeistert" bar that showed a confusing 0% even with words right.
 */
export function MasteryBar({ right, wrong, neu }: { right: number; wrong: number; neu: number }) {
  const { t } = useI18n();
  const total = right + wrong + neu || 1;
  const learned = Math.round((right / total) * 100);
  const dot = (c: string, n: number, label: string) => (
    <span className="inline-flex items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${c}`} />
      <b className="text-foreground">{n}</b> {label}
    </span>
  );
  return (
    <div className="mt-2.5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="bg-green-500 transition-all" style={{ width: `${(right / total) * 100}%` }} />
        <div className="bg-red-500/80 transition-all" style={{ width: `${(wrong / total) * 100}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {dot("bg-green-500", right, t("stats.todayCorrect"))}
          {dot("bg-red-500", wrong, t("stats.todayWrong"))}
          {dot("bg-foreground/25", neu, t("stats.mNew"))}
        </span>
        <span className="font-semibold text-foreground">{learned}% {t("vocab.learned")}</span>
      </div>
    </div>
  );
}
