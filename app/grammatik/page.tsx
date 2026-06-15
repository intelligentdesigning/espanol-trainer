"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { IconLetters, IconClock, IconShapes, IconArrowRight } from "@/components/icons";

export default function GrammatikPage() {
  const { t } = useI18n();

  const areas = [
    { href: "/grammatik/grundregeln", Icon: IconLetters, title: t("grammar.area.grundregeln"), desc: t("grammar.area.grundregeln.desc") },
    { href: "/grammatik/zeitformen", Icon: IconClock, title: t("grammar.area.zeitformen"), desc: t("grammar.area.zeitformen.desc") },
    { href: "/grammatik/andere", Icon: IconShapes, title: t("grammar.area.andere"), desc: t("grammar.area.andere.desc") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.grammar")}</h1>
        <p className="mt-1 text-muted">{t("grammar.intro")}</p>
      </div>

      <div className="grid gap-3">
        {areas.map((a) => (
          <Link
            key={a.title}
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
            <IconArrowRight className="h-5 w-5 text-muted transition-colors group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </div>
  );
}
