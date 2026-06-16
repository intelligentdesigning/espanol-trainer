"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { getStats, getRecentSessions, resetAll, type Stats } from "@/lib/storage/db";
import { loadMastery, type MasterySnapshot, type CatId } from "@/lib/progress";
import { ScoreRing } from "@/components/ScoreRing";
import type { SessionRecord } from "@/lib/types";

const CATS: CatId[] = ["common", "verbs", "nouns", "adj"];

export default function StatsPage() {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [snap, setSnap] = useState<MasterySnapshot | null>(null);

  const refresh = () => {
    getStats().then(setStats);
    getRecentSessions(100).then(setSessions);
    loadMastery().then(setSnap);
  };
  useEffect(refresh, []);

  const hasData = stats && stats.totalQuestions > 0;
  const bestRound = sessions.length
    ? Math.round(Math.max(...sessions.map((s) => (s.total ? s.correct / s.total : 0))) * 100)
    : 0;
  const catLabel: Record<CatId, string> = {
    common: t("vocab.cat.common"), verbs: t("vocab.cat.verbs"), nouns: t("vocab.cat.nouns"), adj: t("vocab.cat.adj"),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("stats.title")}</h1>

      {!hasData ? (
        <p className="text-muted">{t("stats.none")}</p>
      ) : (
        <>
          {/* mastery headline — the "high score" */}
          {snap && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:gap-6">
              <ScoreRing correct={snap.overall.mastered} total={snap.overall.total} />
              <div className="text-center sm:text-left">
                <div className="text-sm text-muted">{t("stats.mastered")}</div>
                <div className="text-3xl font-bold">
                  {snap.overall.mastered} <span className="text-lg text-muted">/ {snap.overall.total}</span>
                </div>
                <div className="mt-1 text-sm text-muted">
                  {t("stats.accuracy")}: <b className="text-foreground">{snap.overall.accuracy}%</b>
                  {" · "}
                  {t("stats.bestRound")}: <b className="text-foreground">{bestRound}%</b>
                </div>
              </div>
            </div>
          )}

          {/* per-category breakdown */}
          {snap && (
            <section>
              <h2 className="mb-2 font-semibold">{t("stats.breakdown")}</h2>
              <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                {CATS.map((id) => {
                  const c = snap.byCat[id];
                  const pct = (n: number) => (c.total ? (n / c.total) * 100 : 0);
                  return (
                    <div key={id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{catLabel[id]}</span>
                        <span className="text-muted">{c.mastered}/{c.total} · {c.masteredPct}%</span>
                      </div>
                      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-foreground/10">
                        <div className="bg-green-500 transition-all" style={{ width: `${pct(c.mastered)}%` }} />
                        <div className="bg-brand-2 transition-all" style={{ width: `${pct(c.learning)}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" />{t("vocab.cat.mastered")}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-2" />{t("stats.mLearning")}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-foreground/15" />{t("stats.mNew")}</span>
                </div>
              </div>
            </section>
          )}

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
                {sessions.slice(0, 10).map((s) => (
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
