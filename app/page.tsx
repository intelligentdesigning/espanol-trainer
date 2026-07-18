"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { IconCards, IconBook, IconNotebook, IconConjugate, IconBookOpen } from "@/components/icons";

export default function Home() {
  const { t } = useI18n();

  const cards = [
    { href: "/vokabular", Icon: IconCards, title: t("home.vocab.title"), desc: t("home.vocab.desc"), accent: "text-vocab", bg: "bg-vocab/10" },
    { href: "/konjugation", Icon: IconConjugate, title: t("home.conj.title"), desc: t("home.conj.desc"), accent: "text-brand", bg: "bg-brand/10" },
    { href: "/grammatik", Icon: IconBook, title: t("home.grammar.title"), desc: t("home.grammar.desc"), accent: "text-brand", bg: "bg-brand/10" },
    { href: "/buch", Icon: IconBookOpen, title: t("home.buch.title"), desc: t("home.buch.desc"), accent: "text-vocab", bg: "bg-vocab/10" },
    { href: "/vokabelheft", Icon: IconNotebook, title: t("home.notebook.title"), desc: t("home.notebook.desc"), accent: "text-brand-2", bg: "bg-brand-2/10" },
  ] as const;

  return (
    <div className="space-y-10">
      <section className="relative pt-2">
        <div aria-hidden className="pointer-events-none absolute -right-2 -top-12 select-none font-display text-[8rem] leading-none text-brand/[0.08] sm:text-[11rem]">ñ</div>
        <div className="relative">
          <p className="section-label mb-2">¡Hola! · Vamos a aprender</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            <span className="text-brand">Español</span> Trainer
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">{t("app.tagline")}</p>
        </div>
      </section>

      <div className="stagger grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, Icon, title, desc, accent, bg }) => (
          <Link
            key={href}
            href={href}
            className="group card card-hover relative overflow-hidden p-6"
          >
            <div aria-hidden className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${bg} opacity-70 blur-2xl`} />
            <div className="relative">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${accent}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h2 className={`mt-4 font-display text-xl font-semibold ${accent}`}>{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
