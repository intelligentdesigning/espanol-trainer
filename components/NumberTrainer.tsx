"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { addSession } from "@/lib/storage/db";
import { spellSpanish, checkNumberWords, parseDigits, groupDigits } from "@/lib/numbers-es";
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
  const [mode, setMode] = useState<Mode>("d2w");
  const [rangeMax, setRangeMax] = useState(100);
  const [count, setCount] = useState(20);
  const [phase, setPhase] = useState<Phase>("setup");

  const [questions, setQuestions] = useState<bigint[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const [roundMs, setRoundMs] = useState(0);
  const startedAt = useRef(Date.now());
  const inputRef = useRef<SpanishInputHandle>(null);

  useEffect(() => { if (phase === "run" && status === "idle") inputRef.current?.focus(); }, [phase, status, idx]);

  const start = () => {
    setQuestions(Array.from({ length: count }, () => randomIn(rangeMax)));
    setIdx(0); setInput(""); setStatus("idle"); setCorrect(0);
    startedAt.current = Date.now();
    setPhase("run");
  };

  const chip = (selected: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
      selected ? "border-transparent bg-noun/15 text-noun" : "border-border text-muted hover:bg-foreground/5 hover:text-foreground"
    }`;

  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Link href="/vokabular" className="text-sm text-muted hover:text-foreground">←</Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-noun">{t("numbers.title")}</h1>
            <p className="mt-1 text-muted">{t("numbers.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["d2w", "w2d"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${mode === m ? "border-noun bg-noun/10 text-noun" : "border-border text-muted hover:bg-foreground/5"}`}>
              {m === "d2w" ? t("numbers.modeD2w") : t("numbers.modeW2d")}
            </button>
          ))}
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("numbers.range")}</div>
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => <button key={r.max} onClick={() => setRangeMax(r.max)} className={chip(rangeMax === r.max)}>{r.label}</button>)}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("vocab.setup.round")}</div>
          <div className="flex flex-wrap gap-2">
            {COUNTS.map((n) => <button key={n} onClick={() => setCount(n)} className={chip(count === n)}>{n}</button>)}
          </div>
        </div>

        <button onClick={start} className="w-full rounded-xl bg-noun px-5 py-4 font-semibold text-white hover:opacity-90">
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
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-border bg-card py-3"><div className="text-2xl font-bold text-green-600 dark:text-green-400">{correct}</div><div className="text-xs text-muted">{t("stats.todayCorrect")}</div></div>
          <div className="rounded-xl border border-border bg-card py-3"><div className="text-2xl font-bold text-red-600 dark:text-red-400">{wrong}</div><div className="text-xs text-muted">{t("stats.todayWrong")}</div></div>
          <div className="rounded-xl border border-border bg-card py-3"><div className="text-2xl font-bold">{timeStr}</div><div className="text-xs text-muted">{t("buch.time")}</div></div>
        </div>
        <div className="space-y-2">
          <button onClick={start} className="w-full rounded-xl bg-noun px-5 py-3 font-semibold text-white hover:opacity-90">{t("buch.more")} ({count})</button>
          <button onClick={() => setPhase("setup")} className="w-full px-5 py-2 text-sm font-medium text-muted hover:text-foreground">{t("buch.overview")}</button>
        </div>
      </div>
    );
  }

  // run
  const total = questions.length;
  const n = questions[idx];
  const words = spellSpanish(n);

  const submit = () => {
    if (status !== "idle") return next();
    const ok = mode === "d2w" ? checkNumberWords(input, n) : parseDigits(input) === n;
    setStatus(ok ? "right" : "wrong");
    setCorrect((c) => c + (ok ? 1 : 0));
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

      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        {mode === "d2w" ? (
          <div className="text-4xl font-bold tabular-nums">{groupDigits(n)}</div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold leading-snug" lang="es">{words}</span>
            <SpeakButton text={words} />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SpanishInput ref={inputRef} value={input} onChange={setInput} onEnter={submit} readOnly={status !== "idle"}
          placeholder={mode === "d2w" ? t("numbers.placeholderWords") : t("numbers.placeholderDigits")} showAccents={mode === "d2w"}
          className={`w-full rounded-xl border-2 bg-card px-4 py-3 text-lg outline-none transition-colors ${status === "right" ? "border-green-500" : status === "wrong" ? "border-red-500" : "border-border focus:border-noun"}`} />
        {status !== "idle" && (
          <div className={`rounded-xl p-3 text-sm ${status === "right" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
            <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
            <div className="mt-1 flex items-center gap-1.5 text-foreground">
              <span>{t("quiz.answerWas")} <b lang={mode === "d2w" ? "es" : undefined}>{mode === "d2w" ? words : groupDigits(n)}</b></span>
              {mode === "d2w" && <SpeakButton text={words} />}
            </div>
          </div>
        )}
        <button type="button" onClick={submit} className="w-full rounded-xl bg-noun px-4 py-3 font-semibold text-white hover:opacity-90">
          {status === "idle" ? t("common.check") : t("common.continue")}
        </button>
      </div>
    </div>
  );
}
