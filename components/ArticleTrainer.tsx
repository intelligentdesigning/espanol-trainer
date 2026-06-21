"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { loadArticles, loadVocab } from "@/lib/data";
import { recordResult, addSession } from "@/lib/storage/db";
import { loadArticleProgress, type ArticleProgress } from "@/lib/article-progress";
import { ScoreRing } from "@/components/ScoreRing";
import { MasteryBar } from "@/components/MasteryBar";
import { SpeakButton } from "@/components/SpeakButton";
import { PosTag } from "@/components/PosTag";
import type { NounArticle } from "@/lib/types";

type Mode = "mixed" | "hard";
type Phase = "setup" | "run" | "done";
type Status = "idle" | "right" | "wrong";
const COUNTS = [10, 20, 30, 50];

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export function ArticleTrainer() {
  const { t, L } = useI18n();
  const [articles, setArticles] = useState<NounArticle[] | null>(null);
  const [meaning, setMeaning] = useState<Map<string, string>>(new Map());
  const [prog, setProg] = useState<ArticleProgress | null>(null);
  const [mode, setMode] = useState<Mode>("mixed");
  const [count, setCount] = useState(20);
  const [phase, setPhase] = useState<Phase>("setup");

  const [questions, setQuestions] = useState<NounArticle[]>([]);
  const [wrongQs, setWrongQs] = useState<NounArticle[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const [roundMs, setRoundMs] = useState(0);
  const startedAt = useRef(Date.now());

  const refreshMastery = () => loadArticleProgress().then(setProg);
  useEffect(() => {
    loadArticles().then(setArticles);
    loadVocab().then((v) => { const m = new Map<string, string>(); for (const x of v) if (!m.has(x.es)) m.set(x.es, x.clue || x.en[0] || ""); setMeaning(m); });
    refreshMastery();
  }, []);

  const begin = (qs: NounArticle[]) => {
    setQuestions(qs); setWrongQs([]); setIdx(0); setPicked(null); setStatus("idle"); setCorrect(0);
    startedAt.current = Date.now();
    setPhase("run");
  };

  const start = () => {
    if (!articles) return;
    const irr = articles.filter((a) => a.irregular);
    const reg = articles.filter((a) => !a.irregular);
    let pool: NounArticle[];
    if (mode === "hard") pool = shuffle(irr).slice(0, count);
    else {
      const half = Math.ceil(count / 2);
      const pickIrr = shuffle(irr).slice(0, Math.min(half, irr.length));
      const pickReg = shuffle(reg).slice(0, count - pickIrr.length);
      pool = shuffle([...pickIrr, ...pickReg]);
    }
    begin(pool);
  };
  const retryWrong = () => { if (wrongQs.length) begin(shuffle(wrongQs)); };

  // Enter advances after answering (no text input here, so no conflict).
  useEffect(() => {
    if (phase !== "run" || status === "idle") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); next(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, status, idx]);

  if (!articles) return <p className="text-muted">{t("common.loading")}</p>;

  const chip = (selected: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
      selected ? "border-transparent bg-article/15 text-article" : "border-border text-muted hover:bg-foreground/5 hover:text-foreground"
    }`;

  if (phase === "setup") {
    const irrN = articles.filter((a) => a.irregular).length;
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Link href="/vokabular" className="text-sm text-muted hover:text-foreground">←</Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-article">{t("artikel.title")}</h1>
            <p className="mt-1 text-muted">{t("artikel.subtitle")}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold">{t("artikel.title")}</span>
            <span className="text-muted">{prog?.mastered ?? 0} {t("artikel.sure")} · {irrN} {t("artikel.irregular")}</span>
          </div>
          {prog ? <MasteryBar right={prog.right} wrong={prog.wrong} neu={prog.new} /> : <div className="mt-2.5 h-2 w-full rounded-full bg-foreground/10" />}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("artikel.mode")}</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setMode("mixed")} className={chip(mode === "mixed")}>{t("artikel.mixed")}</button>
              <button onClick={() => setMode("hard")} className={chip(mode === "hard")}>{t("artikel.hard")}</button>
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("vocab.setup.round")}</div>
            <div className="flex flex-wrap gap-2">
              {COUNTS.map((n) => <button key={n} onClick={() => setCount(n)} className={chip(count === n)}>{n}</button>)}
            </div>
          </div>
        </div>

        <button onClick={start} className="w-full rounded-xl bg-article px-5 py-4 font-semibold text-white hover:opacity-90">
          {t("common.start")}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const totalDone = questions.length;
    const wrong = totalDone - correct;
    const secs = Math.round(roundMs / 1000);
    const timeStr = secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-center pt-2"><ScoreRing correct={correct} total={totalDone} /></div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-border bg-card py-3"><div className="text-2xl font-bold text-green-600 dark:text-green-400">{correct}</div><div className="text-xs text-muted">{t("stats.todayCorrect")}</div></div>
          <div className="rounded-xl border border-border bg-card py-3"><div className="text-2xl font-bold text-red-600 dark:text-red-400">{wrong}</div><div className="text-xs text-muted">{t("stats.todayWrong")}</div></div>
          <div className="rounded-xl border border-border bg-card py-3"><div className="text-2xl font-bold">{timeStr}</div><div className="text-xs text-muted">{t("buch.time")}</div></div>
        </div>
        <div className="space-y-2">
          {wrongQs.length > 0 && (
            <button onClick={retryWrong} className="w-full rounded-xl border-2 border-red-500/40 px-5 py-3 font-semibold text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400">
              {t("buch.retryWrong")} ({wrongQs.length})
            </button>
          )}
          <button onClick={start} className="w-full rounded-xl bg-article px-5 py-3 font-semibold text-white hover:opacity-90">{t("buch.more")} ({count})</button>
          <button onClick={() => { setPhase("setup"); refreshMastery(); }} className="w-full px-5 py-2 text-sm font-medium text-muted hover:text-foreground">{t("buch.overview")}</button>
        </div>
      </div>
    );
  }

  // run
  const total = questions.length;
  const q = questions[idx];

  const answer = (opt: "el" | "la") => {
    if (status !== "idle") return;
    const ok = opt === q.article;
    setPicked(opt);
    setStatus(ok ? "right" : "wrong");
    setCorrect((c) => c + (ok ? 1 : 0));
    if (!ok) setWrongQs((w) => [...w, q]);
    recordResult(`art:${q.es}`, "vocab", ok);
  };
  const next = () => {
    if (idx + 1 >= total) {
      setRoundMs(Date.now() - startedAt.current);
      addSession({ id: `${startedAt.current}-artikel`, mode: `artikel:${mode}`, startedAt: startedAt.current, endedAt: Date.now(), total, correct });
      refreshMastery();
      setPhase("done");
      return;
    }
    setIdx((i) => i + 1); setPicked(null); setStatus("idle");
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">{t("quiz.round")} {idx + 1} / {total}</div>
          <div className="text-xs text-muted">{t("artikel.title")}</div>
        </div>
        <span className="text-sm text-muted">{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-article transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("artikel.q")}</div>
        <div className="mt-3 flex items-center justify-center gap-2 text-3xl font-bold">
          <span lang="es"><span className="text-muted">___</span> {q.es}</span>
          <SpeakButton text={q.es} />
        </div>
        <div className="mt-2.5 flex justify-center"><PosTag pos="noun" /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(["el", "la"] as const).map((opt) => {
          const isAnswer = opt === q.article;
          const isPicked = picked === opt;
          let cls = "border-border hover:bg-foreground/5";
          if (status !== "idle") {
            if (isAnswer) cls = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
            else if (isPicked) cls = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
            else cls = "border-border opacity-50";
          }
          return (
            <button key={opt} onClick={() => answer(opt)} disabled={status !== "idle"}
              className={`rounded-xl border-2 py-4 text-2xl font-bold transition-colors ${cls}`} lang="es">
              {opt}
            </button>
          );
        })}
      </div>

      {status !== "idle" && (
        <div className={`rounded-xl p-4 text-sm ${status === "right" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
          <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
          <div className="mt-1 text-foreground"><b lang="es">{q.article} {q.es}</b>{meaning.get(q.es) ? ` — ${meaning.get(q.es)}` : ""}</div>
          {q.irregular && q.note && (
            <div className="mt-1.5 text-xs text-foreground/80">
              <span className="mr-1.5 rounded bg-article/15 px-1.5 py-0.5 font-semibold text-article">{t("artikel.irregular")}</span>
              <span className="italic">{L(q.note)}</span>
            </div>
          )}
          <button onClick={next} className="mt-3 rounded-lg bg-article px-4 py-2 font-medium text-white hover:opacity-90">{t("common.continue")}</button>
        </div>
      )}
    </div>
  );
}
