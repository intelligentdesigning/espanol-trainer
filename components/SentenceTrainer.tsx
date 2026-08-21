"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { useLang } from "@/lib/lang";
import { loadThemes, loadBuch, loadLessonGrammar } from "@/lib/data";
import { recordResult, addSession } from "@/lib/storage/db";
import { shuffleTiles, checkSentence, splitSentence, type SentenceTask } from "@/lib/sentence";
import { buildSentencePool, type SentenceSource, type LengthBand } from "@/lib/sentence-pool";
import { ScoreRing } from "@/components/ScoreRing";
import { SpeakButton } from "@/components/SpeakButton";
import { CefrBadge } from "@/components/CefrBadge";
import type { Cefr, LocalizedText } from "@/lib/types";

type Phase = "setup" | "run" | "done";
type Status = "idle" | "right" | "alsoOk" | "wrong";

const COUNTS = [10, 20, 30];
const LENGTHS: LengthBand[] = ["short", "medium", "long", "any"];
const LEVELS: (Cefr | "all")[] = ["all", "A1", "A2", "B1", "B2"];

export function SentenceTrainer() {
  const { t, L, locale } = useI18n();
  const { lang, picked } = useLang();

  const [source, setSource] = useState<SentenceSource>("all");
  const [topic, setTopic] = useState<string>("");
  const [length, setLength] = useState<LengthBand>("short");
  const [level, setLevel] = useState<Cefr | "all">("all");
  const [knownOnly, setKnownOnly] = useState(true);
  const [count, setCount] = useState(10);
  const [phase, setPhase] = useState<Phase>("setup");
  const [note, setNote] = useState("");
  const [poolSize, setPoolSize] = useState<number | null>(null);
  const [topics, setTopics] = useState<{ id: string; name: LocalizedText }[]>([]);

  const [tasks, setTasks] = useState<SentenceTask[]>([]);
  const [wrongTasks, setWrongTasks] = useState<SentenceTask[]>([]);
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);   // indices into tiles
  const [status, setStatus] = useState<Status>("idle");
  const [correct, setCorrect] = useState(0);
  const startedAt = useRef(Date.now());

  // topic list for the "restrict to" chips. `lang` starts as "es" and only
  // settles after hydration, so this effect runs twice — without the guard the
  // first (Spanish) response can land after the second and overwrite it.
  useEffect(() => {
    // `lang` defaults to "es" until the provider's effect runs, so loading here
    // too early fetches the wrong language's files (a 404 plus a pointless
    // download). `picked` flips in that same effect, so it is the ready signal.
    if (!picked) return;
    let alive = true;
    const set = (xs: { id: string; name: LocalizedText }[]) => { if (alive) setTopics(xs); };
    if (lang === "ka") {
      loadLessonGrammar().then((ls) => set(ls.map((l) => ({ id: l.id, name: l.name })))).catch(() => {});
    } else {
      loadThemes().then((d) => set(d.themes.map((x) => ({ id: x.id, name: x.name })))).catch(() => {});
    }
    if (lang === "es") loadBuch().catch(() => {});
    return () => { alive = false; };
  }, [lang, picked]);

  // live count of what the current filters would give
  useEffect(() => {
    let alive = true;
    buildSentencePool({ source, topic: topic || undefined, length, cefr: level, knownOnly, glossLang: locale === "en" ? "en" : "de" })
      .then((p) => { if (alive) setPoolSize(p.length); })
      .catch(() => { if (alive) setPoolSize(0); });
    return () => { alive = false; };
  }, [source, topic, length, level, knownOnly, locale]);

  /** Start a round with exactly these sentences, tiles reshuffled. */
  const run = (list: SentenceTask[]) => {
    setTasks(list.map((s) => ({ ...s, tiles: shuffleTiles(s.solution) })));
    setWrongTasks([]); setIdx(0); setPlaced([]); setStatus("idle"); setCorrect(0);
    startedAt.current = Date.now();
    setPhase("run");
  };

  const start = async () => {
    const pool = await buildSentencePool({
      source, topic: topic || undefined, length, cefr: level, knownOnly,
      glossLang: locale === "en" ? "en" : "de",
    });
    if (pool.length === 0) { setNote(t("sentence.empty")); return; }
    setNote("");
    run(shuffleTiles(pool.map((_, i) => String(i))).slice(0, count).map((i) => pool[Number(i)]));
  };

  const chip = (sel: boolean) => `chip${sel ? " is-active" : ""}`;
  const accent = { ["--chip-accent" as string]: "var(--color-brand-2)" };

  // ---------- setup ----------
  if (phase === "setup") {
    return (
      <div className="space-y-6 stagger">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-brand-2">{t("sentence.title")}</h1>
          <p className="mt-1 text-muted">{t("sentence.subtitle")}</p>
        </div>

        {/* Georgian has no vocabulary trainer, so "only words I know" has nothing
            to filter on, and every sentence comes from a lesson — the source row
            collapses into a plain lesson picker. */}
        {lang !== "ka" && (
          <button onClick={() => setKnownOnly((v) => !v)} className={`${chip(knownOnly)} !px-4 !py-2.5`} style={accent}>
            {knownOnly ? "✓ " : ""}{t("sentence.knownOnly")}
          </button>
        )}

        {lang === "ka" ? (
          <div>
            <div className="mb-2 section-label">{t("sentence.lesson")}</div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setTopic("")} className={`${chip(!topic)} !text-xs`} style={accent}>{t("themes.levelAll")}</button>
              {topics.map((x) => (
                <button key={x.id} onClick={() => setTopic(x.id)} className={`${chip(topic === x.id)} !text-xs`} style={accent}>{L(x.name)}</button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2 section-label">{t("sentence.source")}</div>
            <div className="flex flex-wrap gap-2">
              {(["all", "vocab", "buch", "theme"] as SentenceSource[])
                .filter((s) => lang === "es" || (s !== "vocab" && s !== "buch"))
                .map((s) => (
                  <button key={s} onClick={() => { setSource(s); if (s !== "theme") setTopic(""); }} className={chip(source === s)} style={accent}>
                    {t(`sentence.src.${s}` as never)}
                  </button>
                ))}
            </div>
            {source === "theme" && topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button onClick={() => setTopic("")} className={`${chip(!topic)} !text-xs`} style={accent}>{t("themes.levelAll")}</button>
                {topics.map((x) => (
                  <button key={x.id} onClick={() => setTopic(x.id)} className={`${chip(topic === x.id)} !text-xs`} style={accent}>{L(x.name)}</button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 section-label">{t("sentence.length")}</div>
            <div className="flex flex-wrap gap-2">
              {LENGTHS.map((l) => (
                <button key={l} onClick={() => setLength(l)} className={chip(length === l)} style={accent}>{t(`sentence.len.${l}` as never)}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 section-label">{t("themes.level")}</div>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lv) => (
                <button key={lv} onClick={() => setLevel(lv)} className={chip(level === lv)} style={accent}>
                  {lv === "all" ? t("themes.levelAll") : lv}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 section-label">{t("vocab.setup.round")}</div>
          <div className="flex flex-wrap gap-2">
            {COUNTS.map((n) => <button key={n} onClick={() => setCount(n)} className={chip(count === n)} style={accent}>{n}</button>)}
          </div>
        </div>

        <p className="text-sm text-muted">
          {poolSize === null ? t("common.loading") : t("sentence.available").replace("{n}", String(poolSize))}
        </p>
        {note && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">{note}</p>}

        <button onClick={() => void start()} disabled={poolSize === 0} className="btn btn-lg w-full bg-brand-2 text-white disabled:opacity-50">
          {t("common.start")}
        </button>
      </div>
    );
  }

  // ---------- done ----------
  if (phase === "done") {
    const total = tasks.length;
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-center pt-2"><ScoreRing correct={correct} total={total} /></div>
        <div className="grid grid-cols-2 gap-3 text-center stagger">
          <div className="card py-3"><div className="font-display text-2xl font-bold text-success">{correct}</div><div className="text-xs text-muted">{t("stats.todayCorrect")}</div></div>
          <div className="card py-3"><div className="font-display text-2xl font-bold text-danger">{total - correct}</div><div className="text-xs text-muted">{t("stats.todayWrong")}</div></div>
        </div>
        <div className="space-y-2">
          {wrongTasks.length > 0 && (
            <button onClick={() => run(wrongTasks)}
              className="w-full rounded-xl border-2 border-danger/40 px-5 py-3 font-semibold text-danger transition-colors hover:bg-danger/10">
              {t("buch.retryWrong")} ({wrongTasks.length})
            </button>
          )}
          <button onClick={() => void start()} className="btn btn-lg w-full bg-brand-2 text-white">{t("buch.more")} ({count})</button>
          <button onClick={() => run(tasks)} className="btn btn-secondary btn-lg w-full">
            {t("quiz.result.again")} ({total})
          </button>
          <button onClick={() => setPhase("setup")} className="btn btn-ghost w-full">{t("buch.overview")}</button>
        </div>
      </div>
    );
  }

  // ---------- run ----------
  const task = tasks[idx];
  const { tail } = splitSentence(task.target);
  const answered = status !== "idle";
  const usedIdx = new Set(placed);

  const tap = (i: number) => { if (!answered && !usedIdx.has(i)) setPlaced((p) => [...p, i]); };
  const undo = (pos: number) => { if (!answered) setPlaced((p) => p.filter((_, k) => k !== pos)); };

  const submit = () => {
    if (answered) return next();
    const attempt = placed.map((i) => task.tiles[i]);
    const v = checkSentence(attempt, task.solution, { alt: task.alt, allowRotation: task.allowRotation });
    const ok = v.kind !== "wrong";
    setStatus(v.kind === "correct" ? "right" : v.kind === "alsoOk" ? "alsoOk" : "wrong");
    setCorrect((c) => c + (ok ? 1 : 0));
    if (!ok) setWrongTasks((w) => [...w, task]);
    recordResult(`sentence:${task.target.slice(0, 60)}`, "grammar", ok);
  };
  const next = () => {
    if (idx + 1 >= tasks.length) {
      addSession({ id: `${startedAt.current}-sentence`, mode: `sentence:${lang}`, startedAt: startedAt.current, endedAt: Date.now(), total: tasks.length, correct });
      setPhase("done");
      return;
    }
    setIdx((i) => i + 1); setPlaced([]); setStatus("idle");
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">{t("quiz.round")} {idx + 1} / {tasks.length}</div>
          <div className="text-xs text-muted">{t("sentence.hint")}</div>
        </div>
        <span className="text-sm text-muted">{t("quiz.score")}: <b className="text-foreground">{correct}</b></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full bg-brand-2 transition-all" style={{ width: `${(idx / tasks.length) * 100}%` }} />
      </div>

      {/* the meaning to translate */}
      <div className="card p-5 text-center">
        {task.cefr && <div className="mb-2 flex justify-center"><CefrBadge level={task.cefr} /></div>}
        <div className="text-lg leading-snug">{task.gloss}</div>
      </div>

      {/* the sentence you are building */}
      <div className={`min-h-[4.5rem] rounded-xl border-2 border-dashed p-3 transition-colors ${
        status === "right" || status === "alsoOk" ? "border-success bg-success/5"
          : status === "wrong" ? "border-danger bg-danger/5" : "border-border"
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          {placed.map((tileIdx, pos) => (
            <button key={pos} onClick={() => undo(pos)} disabled={answered}
              className="rounded-lg border border-border bg-card px-3 py-1.5 font-medium shadow-sm transition-transform hover:-translate-y-0.5 disabled:hover:translate-y-0"
              lang={lang}>
              {task.tiles[tileIdx]}
            </button>
          ))}
          {placed.length > 0 && tail && <span className="text-muted">{tail}</span>}
          {placed.length === 0 && <span className="px-1 text-sm text-muted">{t("sentence.tapPrompt")}</span>}
        </div>
      </div>

      {/* the shuffled tiles */}
      <div className="flex flex-wrap gap-2">
        {task.tiles.map((w, i) => (
          <button key={i} onClick={() => tap(i)} disabled={answered || usedIdx.has(i)}
            className={`rounded-lg border-2 px-3 py-1.5 font-medium transition-all ${
              usedIdx.has(i) ? "border-dashed border-border text-transparent" : "border-border bg-card hover:-translate-y-0.5 hover:border-brand-2/60"
            }`}
            lang={lang}>
            {w}
          </button>
        ))}
      </div>

      {answered && (
        <div className={`animate-pop rounded-xl p-3 text-sm ${
          status === "wrong" ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
        }`}>
          <div className="font-semibold">
            {status === "right" ? t("quiz.correct") : status === "alsoOk" ? t("sentence.alsoOk") : t("quiz.wrong")}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-foreground">
            <span lang={lang}>{status === "right" ? task.target : `${t("sentence.usual")} ${task.target}`}</span>
            <SpeakButton text={task.target} />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={submit}
          disabled={!answered && placed.length !== task.tiles.length}
          className="btn btn-lg flex-1 bg-brand-2 text-white disabled:opacity-50">
          {answered ? t("common.continue") : t("common.check")}
        </button>
        {!answered && placed.length > 0 && (
          <button type="button" onClick={() => setPlaced([])} className="btn btn-secondary">{t("sentence.clear")}</button>
        )}
      </div>
    </div>
  );
}
