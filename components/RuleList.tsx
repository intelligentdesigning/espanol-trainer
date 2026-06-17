"use client";

import { useI18n } from "@/lib/i18n/locale";
import type { GrammarRule } from "@/lib/types";

export function RuleList({ rules }: { rules: GrammarRule[] }) {
  const { L } = useI18n();
  return (
    <div className="space-y-3">
      {rules.map((rule, i) => (
        <section key={rule.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="flex items-start gap-2.5 font-semibold">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">{i + 1}</span>
            <span>{L(rule.title)}</span>
          </h3>
          <p className="mt-1.5 pl-[34px] text-sm text-muted">{L(rule.body)}</p>
          <ul className="mt-3 ml-[34px] space-y-2 border-l-2 border-brand/30 pl-3">
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
