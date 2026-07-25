"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { loadBuch, loadBuchDetails } from "@/lib/data";
import { checkAnswer, orderByScope, formatNotation, type QuizScope } from "@/lib/quiz";
import { recordResult, addSession, getAllProgress } from "@/lib/storage/db";
import { loadBuchMastery, pickBuchRec, type BuchMastery } from "@/lib/buch-progress";
import { SpanishInput, type SpanishInputHandle } from "@/components/SpanishInput";
import { ScoreRing } from "@/components/ScoreRing";
import { QuizWithPanels } from "@/components/QuizPanels";
import { MasteryBar } from "@/components/MasteryBar";
import { SpeakButton } from "@/components/SpeakButton";
import { PosTag } from "@/components/PosTag";
import { CefrBadge } from "@/components/CefrBadge";
import type { BuchData, BuchDetails, ProgressRecord, Pos, Cefr } from "@/lib/types";

type Dir = "es-de" | "de-es";
type Phase = "setup" | "run" | "done";
type Status = "idle" | "right" | "wrong";

const FOCI: QuizScope[] = ["smart", "weak", "new"];
const COUNTS = [10, 20, 30, 50];

// Keep slash notation intact (checkAnswer/expandForms expands "Kellner/in" etc.);
// only split true synonym separators.
const splitMeanings = (s: string) =>
  [s.trim(), ...s.split(/[,;]|\boder\b/).map((x) => x.trim())].filter(Boolean);

// Stable, accent-stripped key per word → mastery accumulates across rounds.
const keyOf = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

interface Q { id: string; es: string; prompt: string; accepted: string[]; canonical: string; pos?: Pos; cefr?: Cefr; }

export function BuchTrainer() {
  const { t } = useI18n();
  const [data, setData] = useState<BuchData | null>(null);
  const [details, setDetails] = useState<BuchDetails>({});
  const [mastery, setMastery] = useState<BuchMastery | null>(null);
  const [lektion, setLektion] = useState<string>("__all__");
  const [dir, setDir] = useState<Dir>("es-de");
  const [scope, setScope] = useState<QuizScope>("smart");
  const [count, setCount] = useState(20);
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("setup");

  const [questions, setQuestions] = useState<Q[]>([]);
  const [wrongQs, setWrongQs] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const [roundMs, setRoundMs] = useState(0);
  const [finishing, setFinishing] = useState(0); // >0 → showing the last N words of a unit
  const [review, setReview] = useState(false);    // unit fully learned → refresh round
  const startedAt = useRef(Date.now());
  const inputRef = useRef<SpanishInputHandle>(null);

  const refreshMastery = () => loadBuchMastery(dir).then(setMastery);
  useEffect(() => { loadBuch().then(setData); loadBuchDetails().then(setDetails); }, []);
  // mastery bars reflect the selected direction (es-de and de-es are separate scores)
  useEffect(() => { loadBuchMastery(dir).then(setMastery); }, [dir]);
  useEffect(() => { if (phase === "run" && status === "idle") inputRef.current?.focus(); }, [phase, status, idx]);

  // On the setup screen, Enter starts the selected Unidad (ignore typing in inputs).
  useEffect(() => {
    if (phase !== "setup") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      e.preventDefault();
      void start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lektion, scope, count, dir, data]);

  const beginRound = (qs: Q[], lek: string) => {
    setLektion(lek);
    setQuestions(qs); setWrongQs([]); setIdx(0); setInput(""); setStatus("idle"); setCorrect(0);
    startedAt.current = Date.now();
    setPhase("run");
  };

  // Build a fresh round for a Lektion (default: current), honouring scope + count.
  const start = async (lek: string = lektion) => {
    if (!data) return;
    const prog = await getAllProgress();
    const recs = new Map<string, ProgressRecord>();
    for (const r of prog) if (r.kind === "vocab" && r.itemKey.startsWith("buch:")) recs.set(r.itemKey.slice(5), r);
    const recOf = (e: BuchData["entries"][number]) => pickBuchRec(recs, keyOf(e.es), dir);
    const pool = lek === "__all__" ? data.entries : data.entries.filter((e) => e.lektion === lek);

    // Words still to learn in THIS direction = never seen or last answered wrong.
    const todo = pool.filter((e) => { const r = recOf(e); return !r || r.seen === 0 || r.lastResult === "wrong"; });
    let picked: BuchData["entries"];
    let isFinishing = 0;
    let isReview = false;
    if (scope === "all") {
      picked = orderByScope(pool, recOf, "all", count);
    } else if (scope === "smart" && todo.length === 0) {
      // unit complete in this direction → light refresh of already-learned words
      picked = orderByScope(pool, recOf, "smart", count);
      isReview = true;
    } else if (scope === "smart" && todo.length <= count) {
      // only the last few left — practice exactly those, don't pad with knowns
      picked = orderByScope(todo, recOf, "smart", todo.length);
      isFinishing = picked.length;
    } else {
      picked = orderByScope(pool, recOf, scope, count);
      if (scope !== "smart" && picked.length > 0 && picked.length < count) isFinishing = picked.length;
    }
    if (picked.length === 0) { setLektion(lek); setNote(scope === "weak" ? t("vocab.empty.mastered") : t("quiz.empty")); setPhase("setup"); return; }
    setNote("");
    setFinishing(isFinishing);
    setReview(isReview);
    const qs: Q[] = picked.map((e) => {
      if (dir === "es-de") {
        // Answer = the meaning: accept German, close German synonyms AND English.
        const accepted = [
          ...splitMeanings(e.de),
          ...(e.deAlt ? splitMeanings(e.deAlt) : []),
          ...(e.en ? splitMeanings(e.en) : []),
        ];
        const canonical = e.en ? `${e.de}  ·  ${e.en}` : e.de;
        return { id: keyOf(e.es), es: e.es, prompt: e.es, accepted, canonical, pos: e.pos, cefr: e.cefr };
      }
      // de -> es: answer is the Spanish word itself.
      return { id: keyOf(e.es), es: e.es, prompt: e.de, accepted: splitMeanings(e.es), canonical: e.es, pos: e.pos, cefr: e.cefr };
    });
    beginRound(qs, lek);
  };

  const retryWrong = () => { if (wrongQs.length) beginRound(shuffle(wrongQs), lektion); };

  if (!data) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton rounded-lg" />
      <div className="h-24 w-full skeleton rounded-2xl" />
      <div className="h-24 w-full skeleton rounded-2xl" />
    </div>
  );

  if (phase === "setup") {
    const chip = (selected: boolean) => `chip${selected ? " is-active" : ""}`;
    const chipAccent = (selected: boolean) =>
      selected ? { ["--chip-accent" as string]: "var(--color-vocab)" } : undefined;
    const stat = (name: string) => (name === "__all__" ? mastery?.overall : mastery?.byLektion.get(name));

    return (
      <div className="space-y-6 stagger">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t("buch.title")}</h1>
          <p className="mt-1 text-muted">{t("buch.subtitle")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["es-de", "de-es"] as Dir[]).map((d) => (
            <button key={d} onClick={() => setDir(d)}
              className={chip(dir === d)} style={chipAccent(dir === d)}>
              {d === "es-de" ? t("buch.dirEsDe") : t("buch.dirDeEs")}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 section-label">{t("vocab.setup.focus")}</div>
            <div className="flex flex-wrap gap-2">
              {FOCI.map((s) => <button key={s} onClick={() => setScope(s)} title={t(`vocab.focusDesc.${s}` as never)} className={chip(scope === s)} style={chipAccent(scope === s)}>{t(`vocab.focus.${s}` as never)}</button>)}
            </div>
          </div>
          <div>
            <div className="mb-2 section-label">{t("vocab.setup.round")}</div>
            <div className="flex flex-wrap gap-2">
              {COUNTS.map((n) => <button key={n} onClick={() => setCount(n)} className={chip(count === n)} style={chipAccent(count === n)}>{n}</button>)}
            </div>
          </div>
        </div>

        <div className="grid gap-2.5">
          {[{ name: "__all__", label: t("buch.all"), n: data.entries.length }, ...data.lektionen.map((l) => ({ name: l.name, label: l.name, n: l.count }))].map((l) => {
            const st = stat(l.name);
            const active = lektion === l.name;
            return (
              <button key={l.name} onClick={() => setLektion(l.name)}
                className={`card p-4 text-left ${active ? "border-vocab bg-vocab/10" : "card-hover"}`}>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-semibold">{l.label}</span>
                  <span className="text-sm text-muted">{l.n} {t("vocab.cat.words")}</span>
                </div>
                {st ? <MasteryBar right={st.right} wrong={st.wrong} neu={st.new} /> : <div className="mt-2.5 h-2 w-full rounded-full bg-foreground/10" />}
              </button>
            );
          })}
        </div>

        {note && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">{note}</p>}

        <button onClick={() => start()} className="btn btn-lg w-full bg-vocab text-white">
          {t("common.start")}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const totalDone = questions.length;
    const wrong = totalDone - correct;
    const secs = Math.round(roundMs / 1000);
    const timeStr = secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    const lekStat = lektion === "__all__" ? mastery?.overall : mastery?.byLektion.get(lektion);
    const lekLabel = lektion === "__all__" ? t("buch.all") : lektion;
    const lekIdx = data.lektionen.findIndex((l) => l.name === lektion);
    const nextLek = lekIdx >= 0 ? data.lektionen[lekIdx + 1]?.name : undefined;

    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-center pt-2"><ScoreRing correct={correct} total={totalDone} /></div>

        {/* richtig / falsch / Zeit */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="card py-3">
            <div className="font-display text-2xl font-bold text-success">{correct}</div>
            <div className="text-xs text-muted">{t("stats.todayCorrect")}</div>
          </div>
          <div className="card py-3">
            <div className="font-display text-2xl font-bold text-danger">{wrong}</div>
            <div className="text-xs text-muted">{t("stats.todayWrong")}</div>
          </div>
          <div className="card py-3">
            <div className="font-display text-2xl font-bold">{timeStr}</div>
            <div className="text-xs text-muted">{t("buch.time")}</div>
          </div>
        </div>

        {/* overall Lektion progress */}
        {lekStat && (
          <div className="card p-4">
            <div className="text-sm font-semibold">{lekLabel}</div>
            <MasteryBar right={lekStat.right} wrong={lekStat.wrong} neu={lekStat.new} />
          </div>
        )}

        {/* actions */}
        <div className="space-y-2">
          {wrongQs.length > 0 && (
            <button onClick={retryWrong} className="w-full rounded-xl border-2 border-danger/40 px-5 py-3 font-semibold text-danger transition-colors hover:bg-danger/10">
              {t("buch.retryWrong")} ({wrongQs.length})
            </button>
          )}
          <button onClick={() => start()} className="btn btn-lg w-full bg-vocab text-white">
            {t("buch.more")} ({count})
          </button>
          {nextLek && (
            <button onClick={() => start(nextLek)} className="btn btn-secondary btn-lg w-full gap-1.5">
              {t("buch.next").replace("{l}", nextLek)} →
            </button>
          )}
          <button onClick={() => { setPhase("setup"); refreshMastery(); }} className="btn btn-ghost btn-sm w-full text-muted">
            {t("buch.overview")}
          </button>
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
    if (!ok) setWrongQs((w) => [...w, q]);
    recordResult(`buch:${dir}:${q.id}`, "vocab", ok);
  };
  const next = () => {
    if (idx + 1 >= total) {
      setRoundMs(Date.now() - startedAt.current);
      addSession({ id: `${startedAt.current}-buch`, mode: `buch:${lektion}:${dir}`, startedAt: startedAt.current, endedAt: Date.now(), total, correct });
      refreshMastery();
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
          <div className={`text-xs ${finishing > 0 ? "font-medium text-vocab" : "text-muted"}`}>
            {finishing > 0
              ? t("buch.finishing").replace("{n}", String(total))
              : review
                ? t("buch.review")
                : t("quiz.roundNote")}
          </div>
        </div>
        <span className="text-sm text-muted">{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-vocab transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="card p-6 text-center">
        <div className="section-label">{dir === "es-de" ? t("buch.dirEsDe") : t("buch.dirDeEs")}</div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="font-display text-4xl font-bold" lang={dir === "es-de" ? "es" : "de"}>{formatNotation(q.prompt)}</span>
          {dir === "es-de" && <SpeakButton text={q.es} />}
        </div>
        {(q.pos || q.cefr) && <div className="mt-2.5 flex items-center justify-center gap-2">{q.cefr && <CefrBadge level={q.cefr} />}{q.pos && <PosTag pos={q.pos} />}</div>}
      </div>

      <div className="space-y-3">
        <SpanishInput ref={inputRef} value={input} onChange={setInput} onEnter={submit} readOnly={status !== "idle"}
          placeholder={t("quiz.placeholder")} showAccents={dir === "de-es"}
          className={`input-quiz w-full ${status === "right" ? "!border-success" : status === "wrong" ? "!border-danger" : ""}`} />
        {status !== "idle" && (
          <div className={`animate-pop rounded-xl p-3 text-sm ${status === "right" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            <div className="font-semibold">{status === "right" ? t("quiz.correct") : t("quiz.wrong")}</div>
            <div className="mt-1 flex items-center gap-1.5 text-foreground">
              <span>{status === "wrong" ? t("quiz.answerWas") : `${t("quiz.meaning")}:`} <b>{formatNotation(q.canonical)}</b></span>
              {dir === "de-es" && <SpeakButton text={q.es} />}
            </div>
          </div>
        )}
        <button type="button" onClick={submit} className="btn btn-lg w-full bg-vocab text-white">
          {status === "idle" ? t("common.check") : t("common.continue")}
        </button>
      </div>
    </div>
  );

  return (
    <QuizWithPanels detail={details[q.es]} answered={status !== "idle"} enabled={Object.keys(details).length > 0}>
      {center}
    </QuizWithPanels>
  );
}
