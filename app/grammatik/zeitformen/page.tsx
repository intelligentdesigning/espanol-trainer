"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { zeitformen } from "@/content/zeitformen";

export default function ZeitformenIndex() {
  const { L, t } = useI18n();
  return (
    <div className="space-y-5">
      <Link href="/grammatik" className="text-sm text-muted hover:text-foreground">← {t("nav.grammar")}</Link>
      <h1 className="text-2xl font-bold tracking-tight">{t("grammar.area.zeitformen")}</h1>

      <div className="grid gap-2">
        {zeitformen.map((tn) =>
          tn.available ? (
            <Link
              key={tn.id}
              href={`/grammatik/zeitformen/${tn.id}`}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="font-semibold group-hover:text-brand">{L(tn.name)}</div>
                <div className="text-xs text-muted">{L(tn.mood)}</div>
              </div>
              <span className="text-brand">→</span>
            </Link>
          ) : (
            <div key={tn.id} className="flex items-center justify-between rounded-xl border border-dashed border-border p-4 opacity-70">
              <div>
                <div className="font-medium">{L(tn.name)}</div>
                <div className="text-xs text-muted">{L(tn.mood)}</div>
              </div>
              <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase">{t("common.comingSoon")}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
