"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";

export default function VokabularPage() {
  const { t } = useI18n();

  const active = [
    {
      href: "/vokabular/quiz?mode=common&dir=es-en",
      title: t("vocab.mode.commonEsEn"),
      desc: t("vocab.mode.commonEsEn.desc"),
      badge: t("vocab.dir.esEn"),
    },
    {
      href: "/vokabular/quiz?mode=common&dir=en-es",
      title: t("vocab.mode.commonEnEs"),
      desc: t("vocab.mode.commonEnEs.desc"),
      badge: t("vocab.dir.enEs"),
    },
    {
      href: "/vokabular/quiz?mode=verbs&dir=es-en",
      title: t("vocab.mode.verbs"),
      desc: t("vocab.mode.verbs.desc"),
      badge: t("vocab.dir.esEn"),
    },
    {
      href: "/vokabular/quiz?mode=nouns&dir=es-en",
      title: t("vocab.mode.nouns"),
      desc: t("vocab.mode.nouns.desc"),
      badge: t("vocab.dir.esEn"),
    },
    {
      href: "/vokabular/quiz?mode=adj&dir=es-en",
      title: t("vocab.mode.adj"),
      desc: t("vocab.mode.adj.desc"),
      badge: t("vocab.dir.esEn"),
    },
  ];
  const soon: string[] = [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("vocab.pick.title")}</h1>

      <div className="grid gap-3">
        {active.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <div className="font-semibold group-hover:text-vocab">{m.title}</div>
              <div className="mt-0.5 text-sm text-muted">{m.desc}</div>
            </div>
            <span className="ml-4 shrink-0 rounded-full bg-vocab/10 px-2.5 py-1 text-xs font-semibold text-vocab">
              {m.badge}
            </span>
          </Link>
        ))}
      </div>

      {soon.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {soon.map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-dashed border-border p-4 text-sm text-muted"
            >
              {label}
              <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase">
                {t("common.comingSoon")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
