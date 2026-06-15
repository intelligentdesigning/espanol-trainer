"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";

export default function GrammatikPage() {
  const { t } = useI18n();

  const areas = [
    { href: "/grammatik/grundregeln", icon: "🔤", title: t("grammar.area.grundregeln"), desc: t("grammar.area.grundregeln.desc"), enabled: true },
    { href: "/grammatik/zeitformen", icon: "⏱️", title: t("grammar.area.zeitformen"), desc: t("grammar.area.zeitformen.desc"), enabled: true },
    { href: "#", icon: "🧩", title: t("grammar.area.andere"), desc: t("grammar.area.andere.desc"), enabled: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.grammar")}</h1>
        <p className="mt-1 text-muted">{t("grammar.intro")}</p>
      </div>

      <div className="grid gap-3">
        {areas.map((a) =>
          a.enabled ? (
            <Link
              key={a.title}
              href={a.href}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">{a.icon}</span>
              <div>
                <div className="font-semibold group-hover:text-brand">{a.title}</div>
                <div className="mt-0.5 text-sm text-muted">{a.desc}</div>
              </div>
            </Link>
          ) : (
            <div key={a.title} className="flex items-start gap-4 rounded-xl border border-dashed border-border p-5 opacity-70">
              <span className="text-2xl grayscale">{a.icon}</span>
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  {a.title}
                  <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase">{t("common.comingSoon")}</span>
                </div>
                <div className="mt-0.5 text-sm text-muted">{a.desc}</div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
