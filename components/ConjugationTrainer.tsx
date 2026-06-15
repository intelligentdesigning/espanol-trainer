"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { loadVerbs } from "@/lib/data";
import { addSession, recordResult } from "@/lib/storage/db";
import {
  PERSON_LABELS,
  TENSE_LABELS,
  TENSE_GROUPS,
  buildConjSession,
  checkConjugation,
  type ConjQuestion,
} from "@/lib/conjugation/trainer";
import type { TenseKey, Tier } from "@/lib/types";

type Phase = "setup" | "run" | "done";
type Status = "idle" | "right" | "wrong";

export function ConjugationTrainer({ initialTense = "presente" }: { initialTense?: TenseKey }) {
  const { t, locale } = useI18n();
  const [phase, setPhase] = useState<Phase>("setup");
  const [tense, setTense] = useState<TenseKey>(initialTense);
  const [tier, setTier] = useState<Tier>(1);
  const [questions, setQuestions] = useState<ConjQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const startedAt = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === "run" && status === "idle") inputRef.current?.focus();
  }, [phase, status, idx]);

  const tierLabels: Record<Tier, string> = {
    1: t("conj.tier1"), 2: t("conj.tier2"), 3: t("conj.tier3"), 4: t("conj.tier4"),
  };

  const start = async (chosen: Tier) => {
    const verbs = await loadVerbs();
    const qs = buildConjSession(verbs, chosen, 15, tense);
    setTier(chosen);
    setQuestions(qs);
    setIdx(0); setInput(""); setStatus("idle"); setCorrect(0);
    startedAt.current = Date.now();
    setPhase(qs.length ? "run" : "setup");
    if (!qs.length) alert(t("conj.poolEmpty"));
  };

  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <Link href="/grammatik/zeitformen" className="text-sm text-muted hover:text-foreground">← {t("grammar.area.zeitformen")}</Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("conj.title")}</h1>
          <p className="mt-1 text-muted">{t("conj.pickTense")}</p>
        </div>
        <select
          value={tense}
          onChange={(e) => setTense(e.target.value as TenseKey)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand"
        >
          {TENSE_GROUPS.map((g) => (
            <optgroup key={g.mood} label={g.mood}>
              {g.keys.map((k) => (
                <option key={k} value={k}>{TENSE_LABELS[k]}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-sm font-medium text-muted">{t("conj.pickDifficulty")} · {TENSE_LABELS[tense]}</p>
        <div className="grid gap-3">
          {([1, 2, 3, 4] as Tier[]).map((tr) => (
            <button
              key={tr}
              onClick={() => start(tr)}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-semibold">{tierLabels[tr]}</span>
              <span className="text-brand">{t("conj.start")} →</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">{t("conj.tip.accents")}</p>
      </div>
    );
  }

  if (phase === "done") {
    const total = questions.length;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="text-5xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <h1 className="text-2xl font-bold">{t("quiz.result.title")}</h1>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-4xl font-bold text-brand">{correct}/{total}</div>
          <div className="mt-1 text-sm text-muted">{pct}%</div>
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={() => start(tier)} className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:opacity-90">
            {t("quiz.result.again")}
          </button>
          <button onClick={() => setPhase("setup")} className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-foreground/5">
            {t("conj.pickDifficulty")}
          </button>
        </div>
      </div>
    );
  }

  // run
  const total = questions.length;
  const q = questions[idx];
  const persons = PERSON_LABELS[locale];

  const submit = () => {
    if (status !== "idle") return next();
    const ok = checkConjugation(input, q.expected);
    setStatus(ok ? "right" : "wrong");
    setCorrect((c) => c + (ok ? 1 : 0));
    recordResult(q.itemKey, "conj", ok);
  };

  const next = () => {
    if (idx + 1 >= total) {
      addSession({
        id: `${startedAt.current}-conj-presente-t${tier}`,
        mode: `conj:presente:tier${tier}`,
        startedAt: startedAt.current,
        endedAt: Date.now(),
        total,
        correct,
      });
      setPhase("done");
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setStatus("idle");
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{idx + 1} / {total}</span>
        <span>{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-brand transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("conj.prompt")} · {TENSE_LABELS[tense]}
        </div>
        <div className="mt-3 text-3xl font-bold text-brand" lang="es">{q.infinitive}</div>
        <div className="mt-1 text-sm text-muted">{q.meaning}</div>
        <div className="mt-4 inline-block rounded-lg bg-foreground/5 px-3 py-1.5 text-lg font-semibold" lang="es">
          {persons[q.person]}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
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
          className={`w-full rounded-xl border-2 bg-card px-4 py-3 text-lg outline-none transition-colors ${
            status === "right" ? "border-green-500" : status === "wrong" ? "border-red-500" : "border-border focus:border-brand"
          }`}
        />

        {status !== "idle" && (
          <div className={`rounded-xl p-3 text-sm ${status === "right" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
            <div className="font-semibold">{status === "right" ? t("conj.correct") : t("conj.wrong")}</div>
            {status === "wrong" && (
              <div className="mt-1 text-foreground" lang="es">{t("conj.answerWas")} <b>{q.expected}</b></div>
            )}
          </div>
        )}

        <button type="submit" className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:opacity-90">
          {status === "idle" ? t("common.check") : t("common.continue")}
        </button>
      </form>
      <p className="text-center text-xs text-muted">{t("conj.tip.accents")}</p>
    </div>
  );
}
