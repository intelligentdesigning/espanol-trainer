"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { loadVocab, loadDetails } from "@/lib/data";
import { buildSession, checkAnswer, formatNotation, type QuizConfig, type QuizQuestion } from "@/lib/quiz";
import { recordResult, addSession, getAllProgress } from "@/lib/storage/db";
import { SpanishInput, type SpanishInputHandle } from "@/components/SpanishInput";
import { ScoreRing } from "@/components/ScoreRing";
import { QuizWithPanels } from "@/components/QuizPanels";
import { SpeakButton } from "@/components/SpeakButton";
import { PosTag } from "@/components/PosTag";
import { CefrBadge } from "@/components/CefrBadge";
import type { ProgressRecord, VocabDetails } from "@/lib/types";

type Status = "idle" | "right" | "wrong";

export function QuizRunner({ config, modeId }: { config: QuizConfig; modeId: string }) {
  const { t } = useI18n();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [details, setDetails] = useState<VocabDetails>({});
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());
  const inputRef = useRef<SpanishInputHandle>(null);

  // Build a fresh session, seeded with current per-word progress so the scope
  // filter (smart/weak/new) can prioritise — and fade out mastered words.
  const buildFromStore = () =>
    Promise.all([loadVocab(), getAllProgress()]).then(([v, prog]) => {
      const map = new Map<string, ProgressRecord>();
      for (const r of prog) if (r.kind === "vocab") map.set(r.itemKey.slice(6), r);
      setQuestions(buildSession(v, config, map));
    });

  useEffect(() => {
    buildFromStore();
    loadDetails().then(setDetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId]);

  useEffect(() => {
    if (status === "idle") inputRef.current?.focus();
  }, [idx, status, questions]);

  if (!questions)
    return (
      <div className="mx-auto max-w-md space-y-5">
        <div className="h-4 w-32 skeleton rounded-md" />
        <div className="h-40 w-full skeleton rounded-2xl" />
        <div className="h-12 w-full skeleton rounded-xl" />
      </div>
    );
  if (questions.length === 0)
    return (
      <div className="space-y-4">
        <p className="text-muted">{config.scope === "weak" ? t("vocab.empty.mastered") : t("quiz.empty")}</p>
        <Link href="/vokabular" className="text-brand underline">{t("common.back")}</Link>
      </div>
    );

  const total = questions.length;
  const q = questions[idx];
  const d = details[q.es]; // details are keyed by exact (accented) es, not the slug id
  const promptLabel = config.direction === "es-en" ? t("quiz.translateToEn") : t("quiz.translateToEs");
  const answered = status !== "idle";

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
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight">{t("quiz.result.title")}</h1>
        <div className="flex justify-center"><ScoreRing correct={correctCount} total={total} /></div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setIdx(0); setInput(""); setStatus("idle");
              setCorrectCount(0); setStreak(0); setFinished(false);
              startedAt.current = Date.now();
              buildFromStore();
            }}
            className="btn bg-vocab text-white"
          >
            {t("quiz.result.again")}
          </button>
          <Link href="/vokabular" className="btn btn-secondary">
            {t("quiz.result.home")}
          </Link>
        </div>
      </div>
    );
  }

  const center = (
    <div className="space-y-5 stagger">
      {/* progress */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">{t("quiz.round")} {idx + 1} / {total}</div>
          <div className="text-xs text-muted">{t("quiz.roundNote")}</div>
        </div>
        <span className="text-sm text-muted">
          {t("quiz.score")}: <b className="text-foreground">{correctCount}</b>
          {streak >= 2 && <span className="ml-2 rounded-full bg-vocab/10 px-2 py-0.5 text-xs font-semibold text-vocab">×{streak}</span>}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-vocab transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      {/* card */}
      <div className="card p-6 text-center">
        <div className="section-label">{promptLabel}</div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="font-display text-4xl font-bold" lang={config.direction === "es-en" ? "es" : "en"}>{formatNotation(q.prompt)}</span>
          {config.direction === "es-en" && <SpeakButton text={q.es} />}
        </div>
        {(q.pos || q.cefr) && <div className="mt-2.5 flex items-center justify-center gap-2">{q.cefr && <CefrBadge level={q.cefr} />}{q.pos && <PosTag pos={q.pos} />}</div>}
      </div>

      <div className="space-y-3">
        <SpanishInput
          ref={inputRef}
          value={input}
          onChange={setInput}
          onEnter={submit}
          readOnly={status !== "idle"}
          placeholder={t("quiz.placeholder")}
          showAccents={config.direction === "en-es"}
          className={`w-full input-quiz ${
            status === "right" ? "!border-success" : status === "wrong" ? "!border-danger" : ""
          }`}
        />

        {answered && (
          <div className={`rounded-xl p-3 text-sm animate-pop ${status === "right" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
            <div className="mt-1 flex items-center gap-1.5 text-foreground">
              <span>
                {status === "wrong"
                  ? <>{t("quiz.answerWas")} <b>{formatNotation(q.canonical)}</b></>
                  : config.direction === "es-en"
                    ? <>{t("quiz.meaning")}: <b>{formatNotation(q.canonical)}</b></>
                    : <>{t("quiz.answerWas")} <b>{formatNotation(q.canonical)}</b></>}
              </span>
              {config.direction === "en-es" && <SpeakButton text={q.es} />}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            className="btn btn-lg bg-vocab text-white flex-1"
          >
            {status === "idle" ? t("common.check") : t("common.continue")}
          </button>
          {status === "idle" && (
            <button
              type="button"
              onClick={() => { setStatus("wrong"); setStreak(0); recordResult(q.itemKey, "vocab", false); }}
              className="btn btn-secondary btn-sm"
            >
              {t("quiz.skip")}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <QuizWithPanels detail={d} answered={answered} enabled={Object.keys(details).length > 0}>
      {center}
    </QuizWithPanels>
  );
}
