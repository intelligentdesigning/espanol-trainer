"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { checkAnswer } from "@/lib/quiz";
import { recordResult, addSession, type NotebookEntry } from "@/lib/storage/db";
import { SpanishInput, type SpanishInputHandle } from "@/components/SpanishInput";
import { ScoreRing } from "@/components/ScoreRing";

type Status = "idle" | "right" | "wrong";

interface Q {
  id: string;
  prompt: string;       // Spanish word
  accepted: string[];   // German + English translations
  canonical: string;
}

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function NotebookQuiz({ entries, onExit }: { entries: NotebookEntry[]; onExit: () => void }) {
  const { t } = useI18n();
  const questions = useMemo<Q[]>(() => {
    const usable = entries.filter((e) => e.es.trim() && (e.de.trim() || e.en.trim()));
    return shuffle(usable).map((e) => ({
      id: e.id,
      prompt: e.es,
      accepted: [e.de, e.en].filter((x) => x.trim()),
      canonical: [e.de, e.en].filter(Boolean).join(" · "),
    }));
  }, [entries]);

  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());
  const inputRef = useRef<SpanishInputHandle>(null);

  useEffect(() => {
    if (status === "idle") inputRef.current?.focus();
  }, [idx, status]);

  if (questions.length === 0) {
    return <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t("notebook.needMore")}</p>;
  }

  const total = questions.length;
  const q = questions[idx];

  const submit = () => {
    if (status !== "idle") return next();
    const ok = checkAnswer(input, q.accepted);
    setStatus(ok ? "right" : "wrong");
    setCorrect((c) => c + (ok ? 1 : 0));
    recordResult(`vocab:notebook:${q.id}`, "vocab", ok);
  };
  const next = () => {
    if (idx + 1 >= total) {
      addSession({ id: `${startedAt.current}-notebook`, mode: "notebook", startedAt: startedAt.current, endedAt: Date.now(), total, correct });
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setStatus("idle");
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <ScoreRing correct={correct} total={total} />
        <div className="flex justify-center gap-3">
          <button onClick={() => { setIdx(0); setInput(""); setStatus("idle"); setCorrect(0); setDone(false); startedAt.current = Date.now(); }} className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:opacity-90">{t("quiz.result.again")}</button>
          <button onClick={onExit} className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-foreground/5">{t("notebook.list")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{idx + 1} / {total}</span>
        <span>{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-vocab transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("quiz.translateToEn")} / DE</div>
        <div className="mt-3 text-3xl font-bold" lang="es">{q.prompt}</div>
      </div>

      <div className="space-y-3">
        <SpanishInput
          ref={inputRef}
          value={input}
          onChange={setInput}
          onEnter={submit}
          disabled={status !== "idle"}
          placeholder={t("quiz.placeholder")}
          showAccents={false}
          className={`w-full rounded-xl border-2 bg-card px-4 py-3 text-lg outline-none transition-colors ${status === "right" ? "border-green-500" : status === "wrong" ? "border-red-500" : "border-border focus:border-vocab"}`}
        />
        {status !== "idle" && (
          <div className={`rounded-xl p-3 text-sm ${status === "right" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
            <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
            {status === "wrong" && <div className="mt-1 text-foreground">{t("quiz.answerWas")} <b>{q.canonical}</b></div>}
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={submit} className="flex-1 rounded-xl bg-vocab px-4 py-3 font-semibold text-white hover:opacity-90">
            {status === "idle" ? t("common.check") : t("common.continue")}
          </button>
          <button type="button" onClick={onExit} className="rounded-xl border border-border px-4 py-3 text-sm text-muted hover:bg-foreground/5">{t("notebook.list")}</button>
        </div>
      </div>
    </div>
  );
}
