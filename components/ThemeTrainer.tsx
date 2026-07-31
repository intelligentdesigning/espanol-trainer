"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { loadThemes } from "@/lib/data";
import { useLang } from "@/lib/lang";
import { checkAnswer, formatNotation } from "@/lib/quiz";
import { recordResult, addSession } from "@/lib/storage/db";
import { SpanishInput, type SpanishInputHandle } from "@/components/SpanishInput";
import { ScoreRing } from "@/components/ScoreRing";
import { SpeakButton } from "@/components/SpeakButton";
import { PosTag } from "@/components/PosTag";
import { CefrBadge } from "@/components/CefrBadge";
import { cefrRange } from "@/lib/cefr";
import type { ThemesData, ThemeEntry, Cefr, Pos } from "@/lib/types";

type Dir = "es-de" | "de-es";
type Phase = "index" | "setup" | "run" | "done";
type Status = "idle" | "right" | "wrong";

const LEVELS: (Cefr | "all")[] = ["all", "A1", "A2", "B1", "B2"];
const COUNTS = [10, 20, 30, 50];
const keyOf = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const splitMeanings = (s: string) => [s.trim(), ...s.split(/[,;]|\boder\b/).map((x) => x.trim())].filter(Boolean);
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

interface Q { es: string; prompt: string; accepted: string[]; canonical: string; pos?: Pos; cefr?: Cefr; }

export function ThemeTrainer() {
  const { t, L } = useI18n();
  const { lang } = useLang();
  const [data, setData] = useState<ThemesData | null>(null);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [dir, setDir] = useState<Dir>("es-de");
  const [level, setLevel] = useState<Cefr | "all">("all");
  const [count, setCount] = useState(20);
  const [phase, setPhase] = useState<Phase>("index");

  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const [note, setNote] = useState("");
  const startedAt = useRef(Date.now());
  const inputRef = useRef<SpanishInputHandle>(null);

  useEffect(() => { loadThemes().then(setData); }, []);
  useEffect(() => { if (phase === "run" && status === "idle") inputRef.current?.focus(); }, [phase, status, idx]);

  if (!data) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
    </div>
  );

  const theme = themeId ? data.themes.find((x) => x.id === themeId) : null;
  const entriesOf = (id: string) => data.byTheme[id] ?? [];

  const start = () => {
    if (!themeId) return;
    let pool: ThemeEntry[] = entriesOf(themeId);
    if (level !== "all") pool = pool.filter((e) => e.cefr === level);
    if (pool.length === 0) { setNote(t("themes.emptyLevel")); return; }
    setNote("");
    const picked = shuffle(pool).slice(0, count);
    const qs: Q[] = picked.map((e) => dir === "es-de"
      ? { es: e.es, prompt: e.es, accepted: [...splitMeanings(e.de), ...(e.en ? splitMeanings(e.en) : [])], canonical: e.en ? `${e.de}  ·  ${e.en}` : e.de, pos: e.pos, cefr: e.cefr }
      : { es: e.es, prompt: e.de, accepted: splitMeanings(e.es), canonical: e.es, pos: e.pos, cefr: e.cefr });
    setQuestions(qs); setIdx(0); setInput(""); setStatus("idle"); setCorrect(0);
    startedAt.current = Date.now();
    setPhase("run");
  };

  // ---- Index: pick a theme ----
  if (phase === "index") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-vocab">{t("themes.title")}</h1>
          <p className="mt-1 text-muted">{t("themes.subtitle")}</p>
        </div>
        <div className="stagger grid gap-3 sm:grid-cols-2">
          {data.themes.map((th) => {
            const range = cefrRange(entriesOf(th.id).map((e) => e.cefr));
            return (
              <button key={th.id} onClick={() => { setThemeId(th.id); setLevel("all"); setPhase("setup"); }}
                className="card card-hover relative overflow-hidden p-5 text-left">
                <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-vocab/10 opacity-70 blur-2xl" />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-lg font-semibold">{L(th.name)}</div>
                    <div className="mt-0.5 text-sm text-muted">{th.count} {t("vocab.cat.words")}</div>
                  </div>
                  {range && <CefrBadge level={range.min} label={range.label} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- Setup: direction + level + round ----
  if (phase === "setup" && theme) {
    const chip = (sel: boolean) => `chip${sel ? " is-active" : ""}`;
    const acc = { ["--chip-accent" as string]: "var(--color-vocab)" };
    const levelCount = (lv: Cefr | "all") => lv === "all" ? theme.count : entriesOf(theme.id).filter((e) => e.cefr === lv).length;
    return (
      <div className="space-y-6 stagger">
        <div className="flex items-start gap-3">
          <button onClick={() => setPhase("index")} className="text-sm text-muted hover:text-foreground">←</button>
          <h1 className="font-display text-2xl font-bold tracking-tight text-vocab">{L(theme.name)}</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["es-de", "de-es"] as Dir[]).map((d) => (
            <button key={d} onClick={() => setDir(d)} className={chip(dir === d)} style={acc}>
              {lang === "de"
                ? (d === "es-de" ? "Deutsch → English" : "English → Deutsch")
                : (d === "es-de" ? t("buch.dirEsDe") : t("buch.dirDeEs"))}
            </button>
          ))}
        </div>

        <div>
          <div className="mb-2 section-label">{t("themes.level")}</div>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((lv) => (
              <button key={lv} onClick={() => setLevel(lv)} disabled={levelCount(lv) === 0}
                className={`${chip(level === lv)} disabled:cursor-not-allowed disabled:opacity-40`} style={acc}>
                {lv === "all" ? t("themes.levelAll") : lv} <span className="opacity-60">{levelCount(lv)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 section-label">{t("vocab.setup.round")}</div>
          <div className="flex flex-wrap gap-2">
            {COUNTS.map((n) => <button key={n} onClick={() => setCount(n)} className={chip(count === n)} style={acc}>{n}</button>)}
          </div>
        </div>

        {note && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">{note}</p>}
        <button onClick={start} className="btn btn-lg bg-vocab text-white w-full">{t("common.start")}</button>
      </div>
    );
  }

  // ---- Done ----
  if (phase === "done") {
    const total = questions.length;
    const wrong = total - correct;
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-center pt-2"><ScoreRing correct={correct} total={total} /></div>
        <div className="grid grid-cols-2 gap-3 text-center stagger">
          <div className="card py-3"><div className="font-display text-2xl font-bold text-success">{correct}</div><div className="text-xs text-muted">{t("stats.todayCorrect")}</div></div>
          <div className="card py-3"><div className="font-display text-2xl font-bold text-danger">{wrong}</div><div className="text-xs text-muted">{t("stats.todayWrong")}</div></div>
        </div>
        <div className="space-y-2">
          <button onClick={start} className="btn btn-lg bg-vocab text-white w-full">{t("buch.more")} ({count})</button>
          <button onClick={() => setPhase("setup")} className="btn btn-ghost w-full">{t("buch.overview")}</button>
        </div>
      </div>
    );
  }

  // ---- Run ----
  const total = questions.length;
  const q = questions[idx];
  const submit = () => {
    if (status !== "idle") return next();
    const ok = checkAnswer(input, q.accepted);
    setStatus(ok ? "right" : "wrong");
    setCorrect((c) => c + (ok ? 1 : 0));
    recordResult(`theme:${themeId}:${dir}:${keyOf(q.es)}`, "vocab", ok);
  };
  const next = () => {
    if (idx + 1 >= total) {
      addSession({ id: `${startedAt.current}-theme`, mode: `theme:${themeId}:${dir}`, startedAt: startedAt.current, endedAt: Date.now(), total, correct });
      setPhase("done");
      return;
    }
    setIdx((i) => i + 1); setInput(""); setStatus("idle");
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">{t("quiz.round")} {idx + 1} / {total}</div>
          <div className="text-xs text-muted">{theme ? L(theme.name) : ""}</div>
        </div>
        <span className="text-sm text-muted">{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-vocab transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="card p-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          {q.cefr && <CefrBadge level={q.cefr} />}
          {q.pos && <PosTag pos={q.pos} />}
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="font-display text-4xl font-bold" lang={dir === "es-de" ? (lang === "de" ? "de" : "es") : (lang === "de" ? "en" : "de")}>{formatNotation(q.prompt)}</span>
          {dir === "es-de" && <SpeakButton text={q.es} />}
        </div>
      </div>

      <div className="space-y-3">
        <SpanishInput ref={inputRef} value={input} onChange={setInput} onEnter={submit} readOnly={status !== "idle"}
          placeholder={t("quiz.placeholder")} showAccents={dir === "de-es"}
          className={`input-quiz w-full ${status === "right" ? "!border-success" : status === "wrong" ? "!border-danger" : ""}`} />
        {status !== "idle" && (
          <div className={`animate-pop rounded-xl p-3 text-sm ${status === "right" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
            <div className="mt-1 flex items-center gap-1.5 text-foreground">
              <span>{status === "wrong" ? t("quiz.answerWas") : `${t("quiz.meaning")}:`} <b>{formatNotation(q.canonical)}</b></span>
              {dir === "de-es" && <SpeakButton text={q.es} />}
            </div>
          </div>
        )}
        <button type="button" onClick={submit} className="btn btn-lg bg-vocab text-white w-full">
          {status === "idle" ? t("common.check") : t("common.continue")}
        </button>
      </div>
    </div>
  );
}
