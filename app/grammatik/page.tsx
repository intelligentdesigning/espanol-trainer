"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { IconClock, IconShapes, IconArrowRight } from "@/components/icons";
import { ScoreRing } from "@/components/ScoreRing";
import { topics } from "@/content/topics";
import { zeitformen } from "@/content/zeitformen";
import { loadGrammarProgress, type GrammarProgress } from "@/lib/grammar-progress";

export default function GrammatikPage() {
  const { t } = useI18n();
  const [prog, setProg] = useState<GrammarProgress | null>(null);
  useEffect(() => { loadGrammarProgress().then(setProg); }, []);

  const tenseList = zeitformen.filter((z) => z.available);
  const tensesPassed = tenseList.filter((z) => prog?.byId.get(z.id)?.passed).length;
  const topicsPassed = topics.filter((tp) => prog?.byId.get(tp.id)?.passed).length;

  const areas = [
    { href: "/grammatik/andere", Icon: IconShapes, title: t("grammar.area.andere"), desc: t("grammar.area.andere.desc"), passed: topicsPassed, total: topics.length },
    { href: "/grammatik/zeitformen", Icon: IconClock, title: t("grammar.area.zeitformen"), desc: t("grammar.area.zeitformen.desc"), passed: tensesPassed, total: tenseList.length },
  ];

  const toNext =
    prog && prog.nextAt != null && prog.nextTitle
      ? t("grammar.toNext").replace("{n}", String(prog.nextAt - prog.passedCount)).replace("{rank}", prog.nextTitle)
      : t("grammar.maxed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.grammar")}</h1>
        <p className="mt-1 text-muted">{t("grammar.intro")}</p>
      </div>

      {/* level banner */}
      {prog && (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <ScoreRing correct={prog.passedCount} total={prog.total} size={96} />
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("grammar.progressTitle")}</div>
            <div className="text-xl font-bold">
              <span className="text-brand">{t("grammar.level")} {prog.level}</span> · {prog.levelTitle}
            </div>
            <div className="text-sm text-muted">{prog.passedCount}/{prog.total} {t("grammar.chaptersPassed")}</div>
            <div className="mt-0.5 text-xs font-medium text-brand">{toNext}</div>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {areas.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <a.Icon className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <div className="font-semibold group-hover:text-brand">{a.title}</div>
              <div className="mt-0.5 text-sm text-muted">{a.desc}</div>
            </div>
            {prog && (
              <span className="shrink-0 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-semibold text-muted">{a.passed}/{a.total}</span>
            )}
            <IconArrowRight className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </div>
  );
}
