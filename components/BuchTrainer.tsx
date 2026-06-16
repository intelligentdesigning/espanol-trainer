"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { loadBuch, loadBuchDetails } from "@/lib/data";
import { checkAnswer } from "@/lib/quiz";
import { recordResult, addSession } from "@/lib/storage/db";
import { SpanishInput, type SpanishInputHandle } from "@/components/SpanishInput";
import { ScoreRing } from "@/components/ScoreRing";
import { QuizWithPanels } from "@/components/QuizPanels";
import type { BuchData, BuchEntry, BuchDetails } from "@/lib/types";

type Dir = "es-de" | "de-es";
type Phase = "setup" | "run" | "done";
type Status = "idle" | "right" | "wrong";

const splitMeanings = (s: string) =>
  [s.trim(), ...s.split(/[,/;]|\boder\b/).map((x) => x.trim())].filter(Boolean);

// Must match the key used in build-data.mjs (accent-stripped, lowercased es).
const keyOf = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

interface Q { id: string; es: string; prompt: string; accepted: string[]; canonical: string; }

export function BuchTrainer() {
  const { t } = useI18n();
  const [data, setData] = useState<BuchData | null>(null);
  const [details, setDetails] = useState<BuchDetails>({});
  const [lektion, setLektion] = useState<string>("__all__");
  const [dir, setDir] = useState<Dir>("es-de");
  const [phase, setPhase] = useState<Phase>("setup");

  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const startedAt = useRef(Date.now());
  const inputRef = useRef<SpanishInputHandle>(null);

  useEffect(() => { loadBuch().then(setData); loadBuchDetails().then(setDetails); }, []);
  useEffect(() => { if (phase === "run" && status === "idle") inputRef.current?.focus(); }, [phase, status, idx]);

  const start = () => {
    if (!data) return;
    const pool = lektion === "__all__" ? data.entries : data.entries.filter((e) => e.lektion === lektion);
    const qs: Q[] = shuffle(pool).slice(0, 20).map((e: BuchEntry, i) => {
      const prompt = dir === "es-de" ? e.es : e.de;
      const ans = dir === "es-de" ? e.de : e.es;
      return { id: `${e.lektion}:${i}:${e.es}`, es: e.es, prompt, accepted: splitMeanings(ans), canonical: ans };
    });
    setQuestions(qs); setIdx(0); setInput(""); setStatus("idle"); setCorrect(0);
    startedAt.current = Date.now();
    setPhase(qs.length ? "run" : "setup");
  };

  if (!data) return <p className="text-muted">{t("common.loading")}</p>;

  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("buch.title")}</h1>
          <p className="mt-1 text-muted">{t("buch.subtitle")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["es-de", "de-es"] as Dir[]).map((d) => (
            <button key={d} onClick={() => setDir(d)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${dir === d ? "border-vocab bg-vocab/10 text-vocab" : "border-border text-muted hover:bg-foreground/5"}`}>
              {d === "es-de" ? t("buch.dirEsDe") : t("buch.dirDeEs")}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button onClick={() => setLektion("__all__")}
            className={`flex items-center justify-between rounded-xl border p-4 text-left ${lektion === "__all__" ? "border-vocab bg-vocab/10" : "border-border hover:bg-foreground/5"}`}>
            <span className="font-semibold">{t("buch.all")}</span>
            <span className="text-sm text-muted">{data.entries.length}</span>
          </button>
          {data.lektionen.map((l) => (
            <button key={l.name} onClick={() => setLektion(l.name)}
              className={`flex items-center justify-between rounded-xl border p-4 text-left ${lektion === l.name ? "border-vocab bg-vocab/10" : "border-border hover:bg-foreground/5"}`}>
              <span className="font-semibold">{l.name}</span>
              <span className="text-sm text-muted">{l.count}</span>
            </button>
          ))}
        </div>

        <button onClick={start} className="w-full rounded-xl bg-vocab px-5 py-4 font-semibold text-white hover:opacity-90">
          {t("common.start")}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <ScoreRing correct={correct} total={questions.length} />
        <div className="flex justify-center gap-3">
          <button onClick={start} className="rounded-lg bg-vocab px-4 py-2 font-medium text-white hover:opacity-90">{t("quiz.result.again")}</button>
          <button onClick={() => setPhase("setup")} className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-foreground/5">{t("buch.title")}</button>
        </div>
      </div>
    );
  }

  const total = questions.length;
  const q = questions[idx];

  const submit = () => {
    if (status !== "idle") return next();
    const ok = checkAnswer(input, q.accepted);
    setStatus(ok ? "right" : "wrong");
    setCorrect((c) => c + (ok ? 1 : 0));
    recordResult(`buch:${q.id}`, "vocab", ok);
  };
  const next = () => {
    if (idx + 1 >= total) {
      addSession({ id: `${startedAt.current}-buch`, mode: `buch:${lektion}:${dir}`, startedAt: startedAt.current, endedAt: Date.now(), total, correct });
      setPhase("done");
      return;
    }
    setIdx((i) => i + 1); setInput(""); setStatus("idle");
  };

  const center = (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">{t("quiz.round")} {idx + 1} / {total}</div>
          <div className="text-xs text-muted">{t("quiz.roundNote")}</div>
        </div>
        <span className="text-sm text-muted">{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-vocab transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{dir === "es-de" ? t("buch.dirEsDe") : t("buch.dirDeEs")}</div>
        <div className="mt-3 text-3xl font-bold" lang={dir === "es-de" ? "es" : "de"}>{q.prompt}</div>
      </div>

      <div className="space-y-3">
        <SpanishInput ref={inputRef} value={input} onChange={setInput} onEnter={submit} readOnly={status !== "idle"}
          placeholder={t("quiz.placeholder")} showAccents={dir === "de-es"}
          className={`w-full rounded-xl border-2 bg-card px-4 py-3 text-lg outline-none transition-colors ${status === "right" ? "border-green-500" : status === "wrong" ? "border-red-500" : "border-border focus:border-vocab"}`} />
        {status !== "idle" && (
          <div className={`rounded-xl p-3 text-sm ${status === "right" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
            <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
            <div className="mt-1 text-foreground">{status === "wrong" ? t("quiz.answerWas") : `${t("quiz.meaning")}:`} <b>{q.canonical}</b></div>
          </div>
        )}
        <button type="button" onClick={submit} className="w-full rounded-xl bg-vocab px-4 py-3 font-semibold text-white hover:opacity-90">
          {status === "idle" ? t("common.check") : t("common.continue")}
        </button>
      </div>
    </div>
  );

  return (
    <QuizWithPanels detail={details[keyOf(q.es)]} answered={status !== "idle"} enabled={Object.keys(details).length > 0}>
      {center}
    </QuizWithPanels>
  );
}
