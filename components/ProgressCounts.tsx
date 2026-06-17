"use client";

import { useI18n } from "@/lib/i18n/locale";

/** Compact right / wrong / new breakdown for a vocab unit (last-result based). */
export function ProgressCounts({ right, wrong, neu }: { right: number; wrong: number; neu: number }) {
  const { t } = useI18n();
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted">
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /><b className="text-foreground">{right}</b> {t("stats.todayCorrect")}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /><b className="text-foreground">{wrong}</b> {t("stats.todayWrong")}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/25" /><b className="text-foreground">{neu}</b> {t("stats.mNew")}
      </span>
    </div>
  );
}
