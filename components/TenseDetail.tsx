"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { RuleList } from "@/components/RuleList";
import { PERSON_LABELS } from "@/lib/conjugation/trainer";
import type { TenseTopic } from "@/lib/types";

export function TenseDetail({ topic }: { topic: TenseTopic }) {
  const { L, t, locale } = useI18n();
  const persons = PERSON_LABELS[locale];

  return (
    <div className="space-y-6">
      <Link href="/grammatik/zeitformen" className="text-sm text-muted hover:text-foreground">← {t("grammar.area.zeitformen")}</Link>

      <header>
        <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{L(topic.mood)}</span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{L(topic.name)}</h1>
        <p className="mt-1 text-muted">{L(topic.summary)}</p>
      </header>

      {!topic.available && (
        <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">
          {t("common.comingSoon")} …
        </div>
      )}

      {topic.available && (
        <>
          {topic.endings && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-3 font-semibold">{L(topic.endings.label)}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted">
                      <th className="py-1 pr-3 font-medium"></th>
                      <th className="py-1 px-3 font-mono font-medium">-ar</th>
                      <th className="py-1 px-3 font-mono font-medium">-er</th>
                      <th className="py-1 px-3 font-mono font-medium">-ir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {persons.map((p, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1.5 pr-3 text-muted">{p}</td>
                        <td className="py-1.5 px-3 font-mono text-brand">{topic.endings!.ar[i]}</td>
                        <td className="py-1.5 px-3 font-mono text-brand">{topic.endings!.er[i]}</td>
                        <td className="py-1.5 px-3 font-mono text-brand">{topic.endings!.ir[i]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <RuleList rules={topic.rules} />

          {topic.examples.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-2 font-semibold">{t("common.examples")}</h3>
              <ul className="space-y-2 border-l-2 border-brand/30 pl-3">
                {topic.examples.map((ex, i) => (
                  <li key={i} className="text-sm">
                    <span lang="es" className="font-semibold text-brand">{ex.es}</span>
                    <span className="text-muted"> — {L(ex.gloss)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {topic.practiceTenseKey && (
            <Link
              href={`/grammatik/uebung/konjugation?tense=${topic.practiceTenseKey}`}
              className="block rounded-xl bg-brand px-5 py-4 text-center font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              {t("grammar.practiceCta")} →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
