"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { IconCards, IconBook, IconNotebook, IconConjugate } from "@/components/icons";

export default function Home() {
  const { t } = useI18n();

  const cards = [
    { href: "/vokabular", Icon: IconCards, title: t("home.vocab.title"), desc: t("home.vocab.desc"), accent: "text-vocab", bg: "bg-vocab/10" },
    { href: "/konjugation", Icon: IconConjugate, title: t("home.conj.title"), desc: t("home.conj.desc"), accent: "text-brand", bg: "bg-brand/10" },
    { href: "/grammatik", Icon: IconBook, title: t("home.grammar.title"), desc: t("home.grammar.desc"), accent: "text-brand", bg: "bg-brand/10" },
    { href: "/vokabelheft", Icon: IconNotebook, title: t("home.notebook.title"), desc: t("home.notebook.desc"), accent: "text-brand-2", bg: "bg-brand-2/10" },
  ] as const;

  return (
    <div className="space-y-10">
      <section className="pt-4 text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-brand">Español</span> Trainer
        </h1>
        <p className="mt-3 text-lg text-muted">{t("app.tagline")}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, Icon, title, desc, accent, bg }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${accent}`}>
              <Icon className="h-6 w-6" />
            </div>
            <h2 className={`mt-4 text-xl font-semibold transition-colors ${accent}`}>{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
