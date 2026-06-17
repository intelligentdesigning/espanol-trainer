"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { RuleList } from "@/components/RuleList";
import { GrammarPractice } from "@/components/GrammarPractice";
import { Segment } from "@/components/grammar/Segment";
import { LessonNav } from "@/components/grammar/LessonNav";
import type { GrammarTopic } from "@/lib/types";

export function TopicDetail({ topic }: { topic: GrammarTopic }) {
  const { L, t } = useI18n();
  const hasTest = topic.practice.length > 0;

  const nav = [
    { id: "ueberblick", label: t("lesson.overview") },
    { id: "regeln", label: t("lesson.rules") },
    ...(hasTest ? [{ id: "test", label: t("lesson.test") }] : []),
  ];

  return (
    <div className="space-y-6">
      <Link href="/grammatik/andere" className="text-sm text-muted hover:text-foreground">← {t("grammar.area.andere")}</Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">{L(topic.name)}</h1>
        <p className="mt-1 text-muted">{L(topic.summary)}</p>
      </header>

      <LessonNav items={nav} />

      <div className="space-y-8">
        <Segment id="ueberblick" title={t("lesson.overview")}>
          <p className="text-[15px] leading-relaxed">{L(topic.summary)}</p>
          {/* quick reference: every rule title at a glance */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("lesson.quickRef")}</div>
            <ol className="space-y-1.5 text-sm">
              {topic.rules.map((r, i) => (
                <li key={r.id} className="flex gap-2.5">
                  <span className="text-brand">{i + 1}.</span>
                  <span>{L(r.title)}</span>
                </li>
              ))}
            </ol>
          </div>
        </Segment>

        <Segment id="regeln" title={t("lesson.rules")} hint={`${topic.rules.length}`}>
          <RuleList rules={topic.rules} />
        </Segment>

        {hasTest && (
          <Segment id="test" title={t("lesson.test")} hint={`${topic.practice.length}`}>
            <p className="text-sm text-muted">{t("lesson.testIntro")}</p>
            <GrammarPractice topicId={topic.id} items={topic.practice} />
          </Segment>
        )}
      </div>
    </div>
  );
}
