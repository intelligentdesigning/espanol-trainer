"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { topics } from "@/content/topics";

export default function AndereIndex() {
  const { L, t } = useI18n();
  return (
    <div className="space-y-5">
      <Link href="/grammatik" className="text-sm text-muted hover:text-foreground">← {t("nav.grammar")}</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("grammar.area.andere")}</h1>
        <p className="mt-1 text-muted">{t("grammar.area.andere.desc")}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {topics.map((tp) => (
          <Link
            key={tp.id}
            href={`/grammatik/andere/${tp.id}`}
            className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="font-semibold group-hover:text-brand">{L(tp.name)}</div>
            <div className="mt-0.5 line-clamp-2 text-sm text-muted">{L(tp.summary)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
