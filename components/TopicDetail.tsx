"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { RuleList } from "@/components/RuleList";
import { GrammarPractice } from "@/components/GrammarPractice";
import type { GrammarTopic } from "@/lib/types";

export function TopicDetail({ topic }: { topic: GrammarTopic }) {
  const { L, t } = useI18n();
  return (
    <div className="space-y-6">
      <Link href="/grammatik/andere" className="text-sm text-muted hover:text-foreground">← {t("grammar.area.andere")}</Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">{L(topic.name)}</h1>
        <p className="mt-1 text-muted">{L(topic.summary)}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t("grammar.rules")}</h2>
        <RuleList rules={topic.rules} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t("grammar.practice")}</h2>
        <GrammarPractice topicId={topic.id} items={topic.practice} />
      </section>
    </div>
  );
}
