"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { checkPractice } from "@/lib/practice";
import { recordResult, addSession, getChapterBest } from "@/lib/storage/db";
import { PASS_PCT } from "@/lib/grammar-progress";
import { SpanishInput, type SpanishInputHandle } from "@/components/SpanishInput";
import { ScoreRing } from "@/components/ScoreRing";
import { IconTrophy, IconCheck } from "@/components/icons";
import type { PracticeItem } from "@/lib/types";

type Status = "idle" | "right" | "wrong";

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function renderPrompt(prompt: string) {
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
  const [order, setOrder] = useState<PracticeItem[]>(items);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState(0);            // best % before this run
  const [finalBest, setFinalBest] = useState(0);  // best % after this run
  const startedAt = useRef(Date.now());
  const inputRef = useRef<SpanishInputHandle>(null);

  useEffect(() => { getChapterBest(topicId).then((b) => { setBest(b.bestPct); setFinalBest(b.bestPct); }); }, [topicId]);
  useEffect(() => { if (started && status === "idle") inputRef.current?.focus(); }, [started, status, idx]);

  if (items.length === 0) return null;

  const begin = () => {
    setOrder(shuffle(items));
    setStarted(true);
    setDone(false);
    setIdx(0);
    setInput("");
    setPicked(null);
    setStatus("idle");
    setCorrect(0);
    startedAt.current = Date.now();
  };

  if (!started && !done) {
    const passed = best >= PASS_PCT;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="text-muted">{t("grammar.passInfo")}</span>
          {best > 0 ? (
            <span className={`inline-flex items-center gap-1.5 font-semibold ${passed ? "text-green-600 dark:text-green-400" : "text-brand-2"}`}>
              {passed && <IconCheck className="h-4 w-4" />}
              {t("grammar.best")}: {best}%
            </span>
          ) : (
            <span className="text-muted">{t("grammar.notTried")}</span>
          )}
        </div>
        <button
          onClick={begin}
          className="w-full rounded-xl bg-brand px-5 py-4 text-center font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          {best > 0 ? t("grammar.retry") : t("practice.start")} ({items.length})
        </button>
      </div>
    );
  }

  if (done) {
    const pct = order.length ? Math.round((correct / order.length) * 100) : 0;
    const passed = pct >= PASS_PCT;
    const isNewBest = pct > best;
    return (
      <div className={`rounded-2xl border p-6 text-center shadow-sm ${passed ? "border-green-500/50 bg-green-500/5" : "border-border bg-card"}`}>
        <div className="flex justify-center">
          {passed ? <IconTrophy className="h-10 w-10 text-green-500" /> : null}
        </div>
        <div className="mt-2 flex justify-center"><ScoreRing correct={correct} total={order.length} size={120} /></div>
        <div className={`mt-3 text-lg font-bold ${passed ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
          {passed ? t("grammar.passedTitle") : t("grammar.notPassedTitle")}
        </div>
        <p className="mt-1 text-sm text-muted">
          {passed ? t("grammar.passedMsg") : t("grammar.notPassedMsg")}
        </p>
        {isNewBest && <div className="mt-2 inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{t("grammar.newBest")}</div>}
        <div className="mt-2 text-xs text-muted">{t("grammar.best")}: {finalBest}%</div>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={begin} className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:opacity-90">{t("grammar.retry")}</button>
        </div>
      </div>
    );
  }

  const item = order[idx];
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
    if (idx + 1 >= order.length) {
      addSession({
        id: `${startedAt.current}-grammar-${topicId}`,
        mode: `grammar:${topicId}`,
        startedAt: startedAt.current,
        endedAt: Date.now(),
        total: order.length,
        correct,
      });
      setStarted(false);
      setDone(true);
      getChapterBest(topicId).then((b) => setFinalBest(b.bestPct));
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
        <span>{idx + 1} / {order.length}</span>
        <span>{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-brand transition-all" style={{ width: `${(idx / order.length) * 100}%` }} />
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
                <button key={opt} onClick={() => answer(opt)} disabled={status !== "idle"} className={`rounded-lg border-2 px-4 py-2.5 text-left font-medium transition-colors ${cls}`} lang="es">
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <SpanishInput
              ref={inputRef}
              value={input}
              onChange={setInput}
              onEnter={() => (status === "idle" ? answer(input) : next())}
              readOnly={status !== "idle"}
              placeholder={t("quiz.placeholder")}
              className={`w-full rounded-lg border-2 bg-card px-3 py-2 outline-none ${
                status === "right" ? "border-green-500" : status === "wrong" ? "border-red-500" : "border-border focus:border-brand"
              }`}
            />
            {status === "idle" && (
              <button type="button" onClick={() => answer(input)} className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:opacity-90">{t("common.check")}</button>
            )}
          </div>
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
