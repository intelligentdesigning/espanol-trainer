"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { RuleList } from "@/components/RuleList";
import { GrammarPractice } from "@/components/GrammarPractice";
import { Segment } from "@/components/grammar/Segment";
import { LessonNav } from "@/components/grammar/LessonNav";
import { PERSON_LABELS } from "@/lib/conjugation/trainer";
import type { TenseTopic } from "@/lib/types";

export function TenseDetail({ topic }: { topic: TenseTopic }) {
  const { L, t, locale } = useI18n();
  const persons = PERSON_LABELS[locale];

  const hasTest = !!topic.practice && topic.practice.length > 0;
  const nav = [
    { id: "verwendung", label: t("lesson.usage") },
    ...(topic.endings ? [{ id: "bildung", label: t("lesson.formation") }] : []),
    { id: "regeln", label: t("lesson.rules") },
    ...(topic.examples.length > 0 ? [{ id: "beispiele", label: t("lesson.examples") }] : []),
    ...(topic.practiceTenseKey ? [{ id: "konjugieren", label: t("lesson.conjugate") }] : []),
    ...(hasTest ? [{ id: "test", label: t("lesson.test") }] : []),
  ];

  return (
    <div className="space-y-6">
      <Link href="/grammatik/zeitformen" className="text-sm text-muted hover:text-foreground">← {t("grammar.area.zeitformen")}</Link>

      <header>
        <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{L(topic.mood)}</span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{L(topic.name)}</h1>
        <p className="mt-1 text-muted">{L(topic.summary)}</p>
      </header>

      {!topic.available ? (
        <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">
          {t("common.comingSoon")} …
        </div>
      ) : (
        <>
          <LessonNav items={nav} />

          <div className="space-y-8">
            <Segment id="verwendung" title={t("lesson.usage")}>
              <p className="text-[15px] leading-relaxed">{L(topic.summary)}</p>
            </Segment>

            {topic.endings && (
              <Segment id="bildung" title={t("lesson.formation")}>
                <div className="overflow-x-auto rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="mb-3 font-semibold">{L(topic.endings.label)}</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted">
                        <th className="py-1 pr-3 font-medium"></th>
                        <th className="px-3 py-1 font-mono font-medium">-ar</th>
                        <th className="px-3 py-1 font-mono font-medium">-er</th>
                        <th className="px-3 py-1 font-mono font-medium">-ir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {persons.map((p, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="py-1.5 pr-3 text-muted">{p}</td>
                          <td className="px-3 py-1.5 font-mono text-brand">{topic.endings!.ar[i]}</td>
                          <td className="px-3 py-1.5 font-mono text-brand">{topic.endings!.er[i]}</td>
                          <td className="px-3 py-1.5 font-mono text-brand">{topic.endings!.ir[i]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Segment>
            )}

            <Segment id="regeln" title={t("lesson.rules")} hint={`${topic.rules.length}`}>
              <RuleList rules={topic.rules} />
            </Segment>

            {topic.examples.length > 0 && (
              <Segment id="beispiele" title={t("lesson.examples")}>
                <ul className="space-y-2 rounded-xl border border-border bg-card p-5 shadow-sm">
                  {topic.examples.map((ex, i) => (
                    <li key={i} className="border-l-2 border-brand/30 pl-3 text-sm">
                      <span lang="es" className="font-semibold text-brand">{ex.es}</span>
                      <span className="text-muted"> — {L(ex.gloss)}</span>
                    </li>
                  ))}
                </ul>
              </Segment>
            )}

            {topic.practiceTenseKey && (
              <Segment id="konjugieren" title={t("lesson.conjugate")}>
                <Link
                  href={`/grammatik/uebung/konjugation?tense=${topic.practiceTenseKey}`}
                  className="block rounded-xl bg-brand px-5 py-4 text-center font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  {t("grammar.practiceCta")} →
                </Link>
              </Segment>
            )}

            {hasTest && (
              <Segment id="test" title={t("lesson.test")} hint={`${topic.practice!.length}`}>
                <p className="text-sm text-muted">{t("lesson.testIntro")}</p>
                <GrammarPractice topicId={topic.id} items={topic.practice!} />
              </Segment>
            )}
          </div>
        </>
      )}
    </div>
  );
}
