"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { IconArrowRight } from "@/components/icons";
import { zeitformen } from "@/content/zeitformen";
import { loadGrammarProgress, type GrammarProgress } from "@/lib/grammar-progress";
import { ChapterBadge } from "@/components/grammar/ChapterBadge";

export default function ZeitformenIndex() {
  const { L, t } = useI18n();
  const [prog, setProg] = useState<GrammarProgress | null>(null);
  useEffect(() => { loadGrammarProgress().then(setProg); }, []);
  const available = zeitformen.filter((z) => z.available);
  const passed = available.filter((z) => prog?.byId.get(z.id)?.passed).length;

  return (
    <div className="space-y-5">
      <Link href="/grammatik" className="text-sm text-muted hover:text-foreground">← {t("nav.grammar")}</Link>
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("grammar.area.zeitformen")}</h1>
        {prog && <span className="shrink-0 rounded-full bg-foreground/5 px-3 py-1 text-sm font-semibold">{passed}/{available.length}</span>}
      </div>

      <Link
        href="/grammatik/uebung/konjugation"
        className="flex items-center justify-between rounded-xl bg-brand px-5 py-4 font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
      >
        {t("conj.title")}
        <IconArrowRight className="h-5 w-5" />
      </Link>

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
              <div className="flex items-center gap-2">
                <ChapterBadge stat={prog?.byId.get(tn.id)} />
                <span className="text-brand">→</span>
              </div>
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
