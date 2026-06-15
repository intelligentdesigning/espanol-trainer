"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { getStats, getRecentSessions, resetAll, type Stats } from "@/lib/storage/db";
import type { SessionRecord } from "@/lib/types";

export default function StatsPage() {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  const refresh = () => {
    getStats().then(setStats);
    getRecentSessions(10).then(setSessions);
  };
  useEffect(refresh, []);

  const hasData = stats && stats.totalQuestions > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("stats.title")}</h1>

      {!hasData ? (
        <p className="text-muted">{t("stats.none")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label={t("stats.totalQuestions")} value={String(stats!.totalQuestions)} />
            <Stat label={t("stats.accuracy")} value={`${stats!.accuracy}%`} />
            <Stat label={t("stats.wordsSeen")} value={String(stats!.vocabSeen)} />
            <Stat label={t("stats.verbsSeen")} value={String(stats!.verbSeen)} />
            <Stat label={t("stats.grammarSeen")} value={String(stats!.grammarSeen)} />
          </div>

          {sessions.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold">{t("stats.recent")}</h2>
              <div className="divide-y divide-border rounded-xl border border-border bg-card">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div>
                      <div className="font-medium">{s.mode}</div>
                      <div className="text-xs text-muted">
                        {new Date(s.endedAt).toLocaleString(locale === "de" ? "de-DE" : "en-US")}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {s.correct}/{s.total}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <button
            onClick={() => {
              if (confirm(t("stats.resetConfirm"))) resetAll().then(refresh);
            }}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
          >
            {t("stats.reset")}
          </button>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}
