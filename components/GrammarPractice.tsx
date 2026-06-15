"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { checkPractice } from "@/lib/practice";
import { recordResult, addSession } from "@/lib/storage/db";
import type { PracticeItem } from "@/lib/types";

type Status = "idle" | "right" | "wrong";

function renderPrompt(prompt: string) {
  // Highlight the ___ blank.
  const parts = prompt.split(/_{2,}/);
  if (parts.length === 1) return prompt;
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && <span className="mx-1 rounded bg-brand/15 px-3 font-bold text-brand">___</span>}
    </span>
  ));
}

export function GrammarPractice({ topicId, items }: { topicId: string; items: PracticeItem[] }) {
  const { t, L } = useI18n();
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (started && status === "idle") inputRef.current?.focus();
  }, [started, status, idx]);

  if (items.length === 0) return null;

  if (!started) {
    return (
      <button
        onClick={() => { setStarted(true); startedAt.current = Date.now(); }}
        className="w-full rounded-xl bg-brand px-5 py-4 text-center font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
      >
        🎯 {t("practice.start")} ({items.length})
      </button>
    );
  }

  if (done) {
    const pct = Math.round((correct / items.length) * 100);
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="text-3xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <div className="mt-2 text-2xl font-bold text-brand">{correct}/{items.length}</div>
        <button
          onClick={() => { setStarted(true); setDone(false); setIdx(0); setInput(""); setPicked(null); setStatus("idle"); setCorrect(0); startedAt.current = Date.now(); }}
          className="mt-4 rounded-lg bg-brand px-4 py-2 font-medium text-white hover:opacity-90"
        >
          {t("quiz.result.again")}
        </button>
      </div>
    );
  }

  const item = items[idx];
  const itemKey = `grammar:${topicId}:${idx}`;

  const answer = (value: string) => {
    if (status !== "idle") return;
    const ok = checkPractice(item, value);
    setPicked(value);
    setStatus(ok ? "right" : "wrong");
    setCorrect((c) => c + (ok ? 1 : 0));
    recordResult(itemKey, "grammar", ok);
  };

  const next = () => {
    if (idx + 1 >= items.length) {
      addSession({
        id: `${startedAt.current}-grammar-${topicId}`,
        mode: `grammar:${topicId}`,
        startedAt: startedAt.current,
        endedAt: Date.now(),
        total: items.length,
        correct,
      });
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setPicked(null);
    setStatus("idle");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{idx + 1} / {items.length}</span>
        <span>{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="text-lg" lang="es">{renderPrompt(item.prompt)}</div>
        {item.promptGloss && <div className="mt-1 text-sm text-muted">{L(item.promptGloss)}</div>}

        {item.kind === "choice" && item.options ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {item.options.map((opt) => {
              const isAnswer = opt.toLowerCase() === item.answer.toLowerCase();
              const isPicked = picked === opt;
              let cls = "border-border hover:bg-foreground/5";
              if (status !== "idle") {
                if (isAnswer) cls = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                else if (isPicked) cls = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
                else cls = "border-border opacity-60";
              }
              return (
                <button
                  key={opt}
                  onClick={() => answer(opt)}
                  disabled={status !== "idle"}
                  className={`rounded-lg border-2 px-4 py-2.5 text-left font-medium transition-colors ${cls}`}
                  lang="es"
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); status === "idle" ? answer(input) : next(); }} className="mt-4 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== "idle"}
              placeholder={t("quiz.placeholder")}
              lang="es"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className={`flex-1 rounded-lg border-2 bg-card px-3 py-2 outline-none ${
                status === "right" ? "border-green-500" : status === "wrong" ? "border-red-500" : "border-border focus:border-brand"
              }`}
            />
            {status === "idle" && (
              <button type="submit" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:opacity-90">{t("common.check")}</button>
            )}
          </form>
        )}
      </div>

      {status !== "idle" && (
        <div className={`rounded-xl p-4 text-sm ${status === "right" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
          <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
          {status === "wrong" && <div className="mt-1 text-foreground" lang="es">{t("quiz.answerWas")} <b>{item.answer}</b></div>}
          <div className="mt-1 text-foreground/80">{L(item.explain)}</div>
          <button onClick={next} className="mt-3 rounded-lg bg-brand px-4 py-2 font-medium text-white hover:opacity-90">{t("common.continue")}</button>
        </div>
      )}
    </div>
  );
}
