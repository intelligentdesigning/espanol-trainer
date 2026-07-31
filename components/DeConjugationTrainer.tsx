"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { recordResult, addSession } from "@/lib/storage/db";
import { DE_VERBS, DE_PERSONS, DE_FORM_LABELS, conjugateDe, checkDeConjugation, type DeFormKey, type DeVerb } from "@/lib/conjugation/de";
import { SpanishInput, type SpanishInputHandle } from "@/components/SpanishInput";
import { ScoreRing } from "@/components/ScoreRing";
import { SpeakButton } from "@/components/SpeakButton";
import { CefrBadge } from "@/components/CefrBadge";

type Phase = "setup" | "run" | "done";
type Status = "idle" | "right" | "wrong";
const COUNTS = [10, 20, 30, 50];
const FORMS: DeFormKey[] = ["praesens", "perfekt"];
const TIERS = [
  { id: 1 as const, de: "Leicht", en: "Easy" },
  { id: 2 as const, de: "Mittel", en: "Medium" },
  { id: 3 as const, de: "Alle", en: "All" },
];

interface Q { verb: DeVerb; person: number; form: DeFormKey; answer: string; }

export function DeConjugationTrainer() {
  const { t, locale } = useI18n();
  const [form, setForm] = useState<DeFormKey>("praesens");
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const [count, setCount] = useState(20);
  const [phase, setPhase] = useState<Phase>("setup");

  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const startedAt = useRef(Date.now());
  const inputRef = useRef<SpanishInputHandle>(null);

  useEffect(() => { if (phase === "run" && status === "idle") inputRef.current?.focus(); }, [phase, status, idx]);

  const start = () => {
    const pool = DE_VERBS.filter((v) => v.tier <= tier);
    const qs: Q[] = Array.from({ length: count }, () => {
      const verb = pool[Math.floor(Math.random() * pool.length)];
      const person = Math.floor(Math.random() * 6);
      return { verb, person, form, answer: conjugateDe(verb, form, person) };
    });
    setQuestions(qs); setIdx(0); setInput(""); setStatus("idle"); setCorrect(0);
    startedAt.current = Date.now();
    setPhase("run");
  };

  const chip = (sel: boolean) => `chip${sel ? " is-active" : ""}`;

  if (phase === "setup") {
    return (
      <div className="space-y-6 stagger">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-brand">{t("home.conj.title")}</h1>
          <p className="mt-1 text-muted">{t("de.conj.desc")}</p>
        </div>

        <div>
          <div className="mb-2 section-label">{t("conj.tense")}</div>
          <div className="flex flex-wrap gap-2">
            {FORMS.map((f) => (
              <button key={f} onClick={() => setForm(f)} className={chip(form === f)}>{DE_FORM_LABELS[f]}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 section-label">{t("conj.difficulty")}</div>
          <div className="flex flex-wrap gap-2">
            {TIERS.map((x) => (
              <button key={x.id} onClick={() => setTier(x.id)} className={chip(tier === x.id)}>
                {locale === "de" ? x.de : x.en}
                <span className="opacity-60"> {DE_VERBS.filter((v) => v.tier <= x.id).length}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 section-label">{t("vocab.setup.round")}</div>
          <div className="flex flex-wrap gap-2">
            {COUNTS.map((n) => <button key={n} onClick={() => setCount(n)} className={chip(count === n)}>{n}</button>)}
          </div>
        </div>

        <button onClick={start} className="btn btn-primary btn-lg w-full">{t("common.start")}</button>
      </div>
    );
  }

  if (phase === "done") {
    const total = questions.length;
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-center pt-2"><ScoreRing correct={correct} total={total} /></div>
        <div className="grid grid-cols-2 gap-3 text-center stagger">
          <div className="card py-3"><div className="font-display text-2xl font-bold text-success">{correct}</div><div className="text-xs text-muted">{t("stats.todayCorrect")}</div></div>
          <div className="card py-3"><div className="font-display text-2xl font-bold text-danger">{total - correct}</div><div className="text-xs text-muted">{t("stats.todayWrong")}</div></div>
        </div>
        <div className="space-y-2">
          <button onClick={start} className="btn btn-primary btn-lg w-full">{t("buch.more")} ({count})</button>
          <button onClick={() => setPhase("setup")} className="btn btn-ghost w-full">{t("buch.overview")}</button>
        </div>
      </div>
    );
  }

  const total = questions.length;
  const q = questions[idx];
  const pronoun = DE_PERSONS[q.person];

  const submit = () => {
    if (status !== "idle") return next();
    const ok = checkDeConjugation(input, q.answer, q.person);
    setStatus(ok ? "right" : "wrong");
    setCorrect((c) => c + (ok ? 1 : 0));
    recordResult(`conj:${q.verb.inf}:${q.form}:${q.person}`, "conj", ok);
  };
  const next = () => {
    if (idx + 1 >= total) {
      addSession({ id: `${startedAt.current}-de-conj`, mode: `conj:de:${form}`, startedAt: startedAt.current, endedAt: Date.now(), total, correct });
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
          <div className="text-xs text-muted">{DE_FORM_LABELS[q.form]}</div>
        </div>
        <span className="text-sm text-muted">{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-brand transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="card p-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <CefrBadge level="A1" />
          {q.verb.irregular && <span className="rounded-full bg-brand-2/15 px-2 py-0.5 text-xs font-semibold text-brand-2">{t("conj.irregular")}</span>}
        </div>
        <div className="font-display text-4xl font-bold text-brand" lang="de">{q.verb.inf}</div>
        <div className="mt-1 text-sm text-muted">{q.verb.en}</div>
        <div className="mt-3 text-lg font-semibold">{pronoun} …</div>
      </div>

      <div className="space-y-3">
        <SpanishInput ref={inputRef} value={input} onChange={setInput} onEnter={submit} readOnly={status !== "idle"}
          placeholder={t("quiz.placeholder")} showAccents={false}
          className={`input-quiz w-full ${status === "right" ? "!border-success" : status === "wrong" ? "!border-danger" : ""}`} />
        {status !== "idle" && (
          <div className={`animate-pop rounded-xl p-3 text-sm ${status === "right" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
            <div className="mt-1 flex items-center gap-1.5 text-foreground">
              <span>{t("quiz.answerWas")} <b lang="de">{pronoun.split("/")[0]} {q.answer}</b></span>
              <SpeakButton text={`${pronoun.split("/")[0]} ${q.answer}`} />
            </div>
          </div>
        )}
        <button type="button" onClick={submit} className="btn btn-primary btn-lg w-full">
          {status === "idle" ? t("common.check") : t("common.continue")}
        </button>
      </div>
    </div>
  );
}
