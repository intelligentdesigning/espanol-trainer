"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { loadVocab } from "@/lib/data";
import { buildSession, checkAnswer, type QuizConfig, type QuizQuestion } from "@/lib/quiz";
import { recordResult, addSession } from "@/lib/storage/db";

type Status = "idle" | "right" | "wrong";

export function QuizRunner({ config, modeId }: { config: QuizConfig; modeId: string }) {
  const { t } = useI18n();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVocab().then((v) => setQuestions(buildSession(v, config)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId]);

  useEffect(() => {
    if (status === "idle") inputRef.current?.focus();
  }, [idx, status, questions]);

  if (!questions) return <p className="text-muted">{t("common.loading")}</p>;
  if (questions.length === 0)
    return (
      <div className="space-y-4">
        <p className="text-muted">{t("quiz.empty")}</p>
        <Link href="/vokabular" className="text-brand underline">{t("common.back")}</Link>
      </div>
    );

  const total = questions.length;
  const q = questions[idx];
  const promptLabel = config.direction === "es-en" ? t("quiz.translateToEn") : t("quiz.translateToEs");

  const submit = () => {
    if (status !== "idle") return next();
    const ok = checkAnswer(input, q.accepted);
    setStatus(ok ? "right" : "wrong");
    setCorrectCount((c) => c + (ok ? 1 : 0));
    setStreak((s) => (ok ? s + 1 : 0));
    recordResult(q.itemKey, "vocab", ok);
  };

  const next = () => {
    if (idx + 1 >= total) {
      addSession({
        id: `${startedAt.current}-${modeId}`,
        mode: `vocab:${modeId}`,
        startedAt: startedAt.current,
        endedAt: Date.now(),
        total,
        correct: correctCount,
      });
      setFinished(true);
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setStatus("idle");
  };

  if (finished) {
    const pct = Math.round((correctCount / total) * 100);
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="text-5xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <h1 className="text-2xl font-bold">{t("quiz.result.title")}</h1>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-4xl font-bold text-vocab">{correctCount}/{total}</div>
          <div className="mt-1 text-sm text-muted">{pct}%</div>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setIdx(0); setInput(""); setStatus("idle");
              setCorrectCount(0); setStreak(0); setFinished(false);
              startedAt.current = Date.now();
              loadVocab().then((v) => setQuestions(buildSession(v, config)));
            }}
            className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:opacity-90"
          >
            {t("quiz.result.again")}
          </button>
          <Link href="/vokabular" className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-foreground/5">
            {t("quiz.result.home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      {/* progress */}
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{idx + 1} / {total}</span>
        <span>{t("quiz.score")}: <b className="text-foreground">{correctCount}</b>{streak >= 2 && <span className="ml-2">🔥{streak}</span>}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-vocab transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      {/* card */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{promptLabel}</div>
        <div className="mt-3 text-3xl font-bold" lang={config.direction === "es-en" ? "es" : "en"}>{q.prompt}</div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="space-y-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "idle"}
          placeholder={t("quiz.placeholder")}
          lang={config.direction === "es-en" ? "en" : "es"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className={`w-full rounded-xl border-2 bg-card px-4 py-3 text-lg outline-none transition-colors ${
            status === "right" ? "border-green-500" : status === "wrong" ? "border-red-500" : "border-border focus:border-vocab"
          }`}
        />

        {status !== "idle" && (
          <div className={`rounded-xl p-3 text-sm ${status === "right" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
            <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
            {status === "wrong" && (
              <div className="mt-1 text-foreground">{t("quiz.answerWas")} <b>{q.canonical}</b></div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-vocab px-4 py-3 font-semibold text-white hover:opacity-90"
          >
            {status === "idle" ? t("common.check") : t("common.continue")}
          </button>
          {status === "idle" && (
            <button
              type="button"
              onClick={() => { setStatus("wrong"); setStreak(0); recordResult(q.itemKey, "vocab", false); }}
              className="rounded-xl border border-border px-4 py-3 text-sm text-muted hover:bg-foreground/5"
            >
              {t("quiz.skip")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
