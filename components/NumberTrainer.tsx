"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { useLang } from "@/lib/lang";
import { addSession } from "@/lib/storage/db";
import { spellSpanish, checkNumberWords, parseDigits, groupDigits } from "@/lib/numbers-es";
import { spellGerman, checkGermanWords } from "@/lib/numbers-de";
import { SpanishInput, type SpanishInputHandle } from "@/components/SpanishInput";
import { ScoreRing } from "@/components/ScoreRing";
import { SpeakButton } from "@/components/SpeakButton";

type Mode = "d2w" | "w2d"; // digit→words | words→digit
type Phase = "setup" | "run" | "done";
type Status = "idle" | "right" | "wrong";

const RANGES: { max: number; label: string }[] = [
  { max: 10, label: "1–10" },
  { max: 100, label: "1–100" },
  { max: 1000, label: "1–1.000" },
  { max: 10000, label: "1–10.000" },
  { max: 100000, label: "1–100.000" },
  { max: 1000000, label: "1–1 Mio." },
  { max: 1000000000, label: "1–1 Mrd." },
  { max: 1000000000000, label: "1–1 Bio." },
];
const COUNTS = [10, 20, 30, 50];

const randomIn = (max: number) => BigInt(Math.floor(Math.random() * max) + 1);

export function NumberTrainer() {
  const { t } = useI18n();
  const { lang } = useLang();
  // the trainer speaks whichever language is being learned
  const spell = (n: bigint) => (lang === "de" ? spellGerman(n) : spellSpanish(n));
  const checkWords = (input: string, n: bigint) => (lang === "de" ? checkGermanWords(input, n) : checkNumberWords(input, n));
  const [mode, setMode] = useState<Mode>("d2w");
  const [rangeMax, setRangeMax] = useState(100);
  const [count, setCount] = useState(20);
  const [phase, setPhase] = useState<Phase>("setup");

  const [questions, setQuestions] = useState<bigint[]>([]);
  const [wrongQs, setWrongQs] = useState<bigint[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const [roundMs, setRoundMs] = useState(0);
  const startedAt = useRef(Date.now());
  const inputRef = useRef<SpanishInputHandle>(null);

  useEffect(() => { if (phase === "run" && status === "idle") inputRef.current?.focus(); }, [phase, status, idx]);

  /** Start a round with exactly these numbers (fresh, a repeat, or the misses). */
  const run = (qs: bigint[]) => {
    setQuestions(qs); setWrongQs([]); setIdx(0); setInput(""); setStatus("idle"); setCorrect(0);
    startedAt.current = Date.now();
    setPhase("run");
  };

  const start = () => run(Array.from({ length: count }, () => randomIn(rangeMax)));

  const chip = (selected: boolean) => `chip${selected ? " is-active" : ""}`;

  if (phase === "setup") {
    return (
      <div className="space-y-6 stagger">
        <div className="flex items-start gap-3">
          <Link href="/vokabular" className="text-sm text-muted hover:text-foreground">←</Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-noun">{t("numbers.title")}</h1>
            <p className="mt-1 text-muted">{t("numbers.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["d2w", "w2d"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={chip(mode === m)} style={{ ["--chip-accent" as string]: "var(--color-noun)" }}>
              {m === "d2w" ? t("numbers.modeD2w") : t("numbers.modeW2d")}
            </button>
          ))}
        </div>

        <div>
          <div className="mb-2 section-label">{t("numbers.range")}</div>
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => <button key={r.max} onClick={() => setRangeMax(r.max)} className={chip(rangeMax === r.max)} style={{ ["--chip-accent" as string]: "var(--color-noun)" }}>{r.label}</button>)}
          </div>
        </div>

        <div>
          <div className="mb-2 section-label">{t("vocab.setup.round")}</div>
          <div className="flex flex-wrap gap-2">
            {COUNTS.map((n) => <button key={n} onClick={() => setCount(n)} className={chip(count === n)} style={{ ["--chip-accent" as string]: "var(--color-noun)" }}>{n}</button>)}
          </div>
        </div>

        <button onClick={start} className="btn btn-lg bg-noun text-white w-full">
          {t("common.start")}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const total = questions.length;
    const wrong = total - correct;
    const secs = Math.round(roundMs / 1000);
    const timeStr = secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-center pt-2"><ScoreRing correct={correct} total={total} /></div>
        <div className="grid grid-cols-3 gap-3 text-center stagger">
          <div className="card py-3"><div className="font-display text-2xl font-bold text-success">{correct}</div><div className="text-xs text-muted">{t("stats.todayCorrect")}</div></div>
          <div className="card py-3"><div className="font-display text-2xl font-bold text-danger">{wrong}</div><div className="text-xs text-muted">{t("stats.todayWrong")}</div></div>
          <div className="card py-3"><div className="font-display text-2xl font-bold">{timeStr}</div><div className="text-xs text-muted">{t("buch.time")}</div></div>
        </div>
        <div className="space-y-2">
          {wrongQs.length > 0 && (
            <button onClick={() => run(wrongQs)}
              className="w-full rounded-xl border-2 border-danger/40 px-5 py-3 font-semibold text-danger transition-colors hover:bg-danger/10">
              {t("buch.retryWrong")} ({wrongQs.length})
            </button>
          )}
          <button onClick={start} className="btn btn-lg bg-noun text-white w-full">{t("buch.more")} ({count})</button>
          <button onClick={() => run(questions)} className="btn btn-secondary btn-lg w-full">
            {t("quiz.result.again")} ({total})
          </button>
          <button onClick={() => setPhase("setup")} className="btn btn-ghost w-full">{t("buch.overview")}</button>
        </div>
      </div>
    );
  }

  // run
  const total = questions.length;
  const n = questions[idx];
  const words = spell(n);

  const submit = () => {
    if (status !== "idle") return next();
    const ok = mode === "d2w" ? checkWords(input, n) : parseDigits(input) === n;
    setStatus(ok ? "right" : "wrong");
    setCorrect((c) => c + (ok ? 1 : 0));
    if (!ok) setWrongQs((w) => [...w, n]);
  };
  const next = () => {
    if (idx + 1 >= total) {
      setRoundMs(Date.now() - startedAt.current);
      addSession({ id: `${startedAt.current}-numbers`, mode: `numbers:${mode}`, startedAt: startedAt.current, endedAt: Date.now(), total, correct });
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
          <div className="text-xs text-muted">{mode === "d2w" ? t("numbers.promptD2w") : t("numbers.promptW2d")}</div>
        </div>
        <span className="text-sm text-muted">{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-noun transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="card p-6 text-center">
        {mode === "d2w" ? (
          <div className="font-display text-4xl font-bold tabular-nums">{groupDigits(n)}</div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span className="font-display text-2xl font-bold leading-snug" lang="es">{words}</span>
            <SpeakButton text={words} />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SpanishInput ref={inputRef} value={input} onChange={setInput} onEnter={submit} readOnly={status !== "idle"}
          placeholder={mode === "d2w" ? t("numbers.placeholderWords") : t("numbers.placeholderDigits")} showAccents={mode === "d2w"}
          className={`input-quiz w-full ${status === "right" ? "!border-success" : status === "wrong" ? "!border-danger" : ""}`} />
        {status !== "idle" && (
          <div className={`animate-pop rounded-xl p-3 text-sm ${status === "right" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
            <div className="mt-1 flex items-center gap-1.5 text-foreground">
              <span>{t("quiz.answerWas")} <b lang={mode === "d2w" ? "es" : undefined}>{mode === "d2w" ? words : groupDigits(n)}</b></span>
              {mode === "d2w" && <SpeakButton text={words} />}
            </div>
          </div>
        )}
        <button type="button" onClick={submit} className="btn btn-lg bg-noun text-white w-full">
          {status === "idle" ? t("common.check") : t("common.continue")}
        </button>
      </div>
    </div>
  );
}
