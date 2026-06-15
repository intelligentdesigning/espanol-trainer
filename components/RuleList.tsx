"use client";

import { useI18n } from "@/lib/i18n/locale";
import type { GrammarRule } from "@/lib/types";

export function RuleList({ rules }: { rules: GrammarRule[] }) {
  const { L } = useI18n();
  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <section key={rule.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold">{L(rule.title)}</h3>
          <p className="mt-1 text-sm text-muted">{L(rule.body)}</p>
          <ul className="mt-3 space-y-2 border-l-2 border-brand/30 pl-3">
            {rule.examples.map((ex, i) => (
              <li key={i} className="text-sm">
                <span lang="es" className="font-semibold text-brand">{ex.es}</span>
                <span className="text-muted"> — {L(ex.gloss)}</span>
                {ex.note && <span className="mt-0.5 block text-xs italic text-muted/80">{L(ex.note)}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
