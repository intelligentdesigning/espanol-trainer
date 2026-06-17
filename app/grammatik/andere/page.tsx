"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { topics } from "@/content/topics";
import { loadGrammarProgress, type GrammarProgress } from "@/lib/grammar-progress";
import { ChapterBadge } from "@/components/grammar/ChapterBadge";

export default function AndereIndex() {
  const { L, t } = useI18n();
  const [prog, setProg] = useState<GrammarProgress | null>(null);
  useEffect(() => { loadGrammarProgress().then(setProg); }, []);

  const passed = topics.filter((tp) => prog?.byId.get(tp.id)?.passed).length;

  return (
    <div className="space-y-5">
      <Link href="/grammatik" className="text-sm text-muted hover:text-foreground">← {t("nav.grammar")}</Link>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("grammar.area.andere")}</h1>
          <p className="mt-1 text-muted">{t("grammar.area.andere.desc")}</p>
        </div>
        {prog && <span className="shrink-0 rounded-full bg-foreground/5 px-3 py-1 text-sm font-semibold">{passed}/{topics.length}</span>}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {topics.map((tp) => (
          <Link
            key={tp.id}
            href={`/grammatik/andere/${tp.id}`}
            className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold group-hover:text-brand">{L(tp.name)}</div>
              <ChapterBadge stat={prog?.byId.get(tp.id)} />
            </div>
            <div className="mt-0.5 line-clamp-2 text-sm text-muted">{L(tp.summary)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
