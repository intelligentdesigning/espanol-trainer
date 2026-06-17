"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { getStats, getRecentSessions, resetAll, getDailyStats, getDailyHistory, exportData, importData, isPersisted, type Stats, type DailyStats } from "@/lib/storage/db";
import { getActiveProfile } from "@/lib/storage/profile";
import { loadMastery, type MasterySnapshot, type CatId } from "@/lib/progress";
import { loadGrammarProgress, type GrammarProgress } from "@/lib/grammar-progress";
import { loadBuchMastery, type BuchMastery } from "@/lib/buch-progress";
import { loadArticleProgress, type ArticleProgress } from "@/lib/article-progress";
import { ScoreRing } from "@/components/ScoreRing";
import { IconArrowRight, IconDownload, IconUpload, IconShield } from "@/components/icons";
import type { SessionRecord } from "@/lib/types";

const CATS: CatId[] = ["common", "verbs", "nouns", "adj"];

export default function StatsPage() {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [snap, setSnap] = useState<MasterySnapshot | null>(null);
  const [today, setToday] = useState<DailyStats | null>(null);
  const [history, setHistory] = useState<{ date: string; total: number; correct: number }[]>([]);
  const [gprog, setGprog] = useState<GrammarProgress | null>(null);
  const [buch, setBuch] = useState<BuchMastery | null>(null);
  const [art, setArt] = useState<ArticleProgress | null>(null);

  const refresh = () => {
    getStats().then(setStats);
    getRecentSessions(100).then(setSessions);
    loadMastery().then(setSnap);
    getDailyStats().then(setToday);
    getDailyHistory(30).then(setHistory);
    loadGrammarProgress().then(setGprog);
    loadBuchMastery().then(setBuch);
    loadArticleProgress().then(setArt);
  };
  useEffect(refresh, []);

  const hasData = stats && stats.totalQuestions > 0;
  const bestRound = sessions.length
    ? Math.round(Math.max(...sessions.map((s) => (s.total ? s.correct / s.total : 0))) * 100)
    : 0;
  // today's practice minutes (from session durations) + day-streak
  const sameDay = (ts: number) => new Date(ts).toDateString() === new Date().toDateString();
  const minutesToday = Math.round(sessions.filter((s) => sameDay(s.endedAt)).reduce((a, s) => a + (s.endedAt - s.startedAt), 0) / 60000);
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) { if (history[i].total > 0) streak++; else break; }
  const last7 = history.slice(-7);
  const maxDay = Math.max(1, ...last7.map((d) => d.total));
  const weekday = (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", { weekday: "short" });
  };
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
          {/* today — how much practiced today (right/wrong/total, right wins on retry) */}
          {today && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{t("stats.today")}</h2>
                <span className="text-xs text-muted">
                  {streak > 0 && <>{streak} {t("stats.streak")}</>}
                  {streak > 0 && minutesToday > 0 && " · "}
                  {minutesToday > 0 && <>{minutesToday} {t("stats.minutes")}</>}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{today.correct}</div>
                  <div className="text-xs text-muted">{t("stats.todayCorrect")}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{today.wrong}</div>
                  <div className="text-xs text-muted">{t("stats.todayWrong")}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{today.total}</div>
                  <div className="text-xs text-muted">{t("stats.todayTotal")}</div>
                </div>
              </div>
              {/* 7-day mini chart */}
              <div className="mt-4">
                <div className="mb-1.5 text-xs text-muted">{t("stats.last7")}</div>
                <div className="flex h-16 items-end gap-1.5">
                  {last7.map((d) => (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t bg-vocab/70 transition-all"
                          style={{ height: `${d.total ? Math.max(8, Math.round((d.total / maxDay) * 100)) : 3}%`, opacity: d.total ? 1 : 0.4 }}
                          title={`${d.correct}/${d.total}`}
                        />
                      </div>
                      <span className="text-[10px] text-muted">{weekday(d.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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

          {/* grammar level */}
          {gprog && (
            <Link href="/grammatik" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <ScoreRing correct={gprog.passedCount} total={gprog.total} size={84} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("grammar.progressTitle")}</div>
                <div className="text-lg font-bold"><span className="text-brand">{t("grammar.level")} {gprog.level}</span> · {gprog.levelTitle}</div>
                <div className="text-sm text-muted">{gprog.passedCount}/{gprog.total} {t("grammar.chaptersPassed")}</div>
              </div>
              <IconArrowRight className="h-5 w-5 shrink-0 text-muted" />
            </Link>
          )}

          {/* coursebook (Buch) mastery */}
          {buch && buch.overall.total > 0 && (
            <Link href="/buch" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <ScoreRing correct={buch.overall.mastered} total={buch.overall.total} size={84} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("home.buch.title")}</div>
                <div className="text-lg font-bold">{buch.overall.masteredPct}% <span className="text-sm font-medium text-muted">{t("vocab.cat.mastered")}</span></div>
                <div className="text-sm text-muted">{buch.overall.mastered}/{buch.overall.total}</div>
              </div>
              <IconArrowRight className="h-5 w-5 shrink-0 text-muted" />
            </Link>
          )}

          {/* article (gender) trainer */}
          {art && art.total > 0 && (
            <Link href="/vokabular/artikel" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <ScoreRing correct={art.mastered} total={art.total} size={84} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("artikel.title")}</div>
                <div className="text-lg font-bold">{art.masteredPct}% <span className="text-sm font-medium text-muted">{t("vocab.cat.mastered")}</span></div>
                <div className="text-sm text-muted">{art.mastered}/{art.total}</div>
              </div>
              <IconArrowRight className="h-5 w-5 shrink-0 text-muted" />
            </Link>
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

      <BackupCard />
    </div>
  );
}

function BackupCard() {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    isPersisted().then(setPersisted);
  }, []);

  const doExport = async () => {
    const data = await exportData();
    const profile = getActiveProfile();
    const safe = profile.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "profil";
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `espanol-trainer-${safe}-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;
    if (!window.confirm(t("backup.importConfirm"))) return;
    try {
      const data = JSON.parse(await file.text());
      await importData(data);
      setMsg({ kind: "ok", text: t("backup.imported") });
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setMsg({ kind: "err", text: t("backup.importError") });
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">{t("backup.title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("backup.desc")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={doExport} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <IconDownload className="h-4 w-4" /> {t("backup.export")}
        </button>
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-foreground/5">
          <IconUpload className="h-4 w-4" /> {t("backup.import")}
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} className="hidden" />
      </div>
      {msg && (
        <p className={`mt-2 text-sm ${msg.kind === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{msg.text}</p>
      )}
      {persisted !== null && (
        <div className={`mt-3 flex items-start gap-2 text-xs ${persisted ? "text-muted" : "text-amber-600 dark:text-amber-400"}`}>
          <IconShield className="mt-px h-4 w-4 shrink-0" />
          <span>{persisted ? t("backup.persisted") : t("backup.notPersisted")}</span>
        </div>
      )}
    </section>
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
