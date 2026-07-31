"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { loadDeGrammar } from "@/lib/data";
import { loadGrammarProgress, type GrammarProgress } from "@/lib/grammar-progress";
import { RuleList } from "@/components/RuleList";
import { GrammarPractice } from "@/components/GrammarPractice";
import { Segment } from "@/components/grammar/Segment";
import { LessonNav } from "@/components/grammar/LessonNav";
import { ChapterBadge } from "@/components/grammar/ChapterBadge";
import { CefrBadge } from "@/components/CefrBadge";
import type { DeLesson } from "@/lib/types";

/** German A1 grammar: an index of lessons, and the lesson view (rules + test). */
export function DeGrammar() {
  const { t, L } = useI18n();
  const [lessons, setLessons] = useState<DeLesson[] | null>(null);
  const [prog, setProg] = useState<GrammarProgress | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  useEffect(() => { loadDeGrammar().then(setLessons); }, []);
  useEffect(() => { loadGrammarProgress().then(setProg); }, [openId]);

  if (!lessons) return (
    <div className="space-y-3">
      <div className="h-8 w-56 skeleton rounded-lg" />
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
    </div>
  );

  const lesson = openId ? lessons.find((l) => l.id === openId) : null;

  // ---- one lesson ----
  if (lesson) {
    const hasTest = lesson.practice.length > 0;
    const nav = [
      { id: "ueberblick", label: t("lesson.overview") },
      { id: "regeln", label: t("lesson.rules") },
      ...(hasTest ? [{ id: "test", label: t("lesson.test") }] : []),
    ];
    return (
      <div className="space-y-6">
        <button onClick={() => { setOpenId(null); setTestRunning(false); }} className="text-sm text-muted hover:text-foreground">
          ← {t("nav.grammar")}
        </button>

        <header>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight">{L(lesson.name)}</h1>
            {lesson.cefr && <CefrBadge level={lesson.cefr} />}
          </div>
          <p className="mt-1 text-muted">{L(lesson.summary)}</p>
        </header>

        {!testRunning && <LessonNav items={nav} />}

        <div className="space-y-8">
          {!testRunning && (
            <>
              <Segment id="ueberblick" title={t("lesson.overview")}>
                <p className="text-[15px] leading-relaxed">{L(lesson.summary)}</p>
                <div className="card p-4">
                  <div className="mb-2 section-label">{t("lesson.quickRef")}</div>
                  <ol className="space-y-1.5 text-sm">
                    {lesson.rules.map((r, i) => (
                      <li key={r.id ?? i} className="flex gap-2.5">
                        <span className="text-brand">{i + 1}.</span>
                        <span>{L(r.title)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Segment>

              <Segment id="regeln" title={t("lesson.rules")} hint={`${lesson.rules.length}`}>
                <RuleList rules={lesson.rules} />
              </Segment>
            </>
          )}

          {hasTest && (
            <Segment id="test" title={t("lesson.test")} hint={`${lesson.practice.length}`}>
              {!testRunning && <p className="text-sm text-muted">{t("lesson.testIntro")}</p>}
              <GrammarPractice topicId={`de-${lesson.id}`} items={lesson.practice} cefr={lesson.cefr} onRunningChange={setTestRunning} />
            </Segment>
          )}
        </div>
      </div>
    );
  }

  // ---- index ----
  const passed = lessons.filter((l) => prog?.byId.get(`de-${l.id}`)?.passed).length;
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t("nav.grammar")}</h1>
          <p className="mt-1 text-muted">{t("de.grammar.desc")}</p>
        </div>
        {prog && <span className="shrink-0 rounded-full bg-foreground/5 px-3 py-1 text-sm font-semibold">{passed}/{lessons.length}</span>}
      </div>

      <div className="grid gap-2 stagger sm:grid-cols-2">
        {lessons.map((l) => (
          <button key={l.id} onClick={() => setOpenId(l.id)} className="card card-hover group p-4 text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold group-hover:text-brand">{L(l.name)}</span>
                {l.cefr && <CefrBadge level={l.cefr} />}
              </div>
              <ChapterBadge stat={prog?.byId.get(`de-${l.id}`)} />
            </div>
            <div className="mt-0.5 line-clamp-2 text-sm text-muted">{L(l.summary)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
