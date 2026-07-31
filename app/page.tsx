"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { useLang, setActiveLang } from "@/lib/lang";
import { IconCards, IconBook, IconNotebook, IconConjugate, IconBookOpen, IconLetters, IconHash } from "@/components/icons";

export default function Home() {
  const { t } = useI18n();
  const { lang, picked } = useLang();

  // ---- first visit (or after "change language"): pick what to learn ----
  if (!picked) {
    const choices = [
      {
        id: "es" as const, word: "Español", flag: "🇪🇸",
        title: t("pick.es.title"), desc: t("pick.es.desc"),
        cls: "border-[#d6452a]/30 hover:border-[#d6452a]/70",
        glow: "bg-[#d6452a]/15", accent: "text-[#d6452a]", face: "font-display",
      },
      {
        id: "de" as const, word: "Deutsch", flag: "🇩🇪",
        title: t("pick.de.title"), desc: t("pick.de.desc"),
        cls: "border-[#1d4ed8]/30 hover:border-[#1d4ed8]/70",
        glow: "bg-[#1d4ed8]/15", accent: "text-[#1d4ed8] dark:text-[#60a5fa]", face: "font-sans",
      },
    ];
    return (
      <div className="space-y-8">
        <section className="pt-2 text-center">
          <p className="section-label mb-2">{t("pick.kicker")}</p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{t("pick.title")}</h1>
          <p className="mx-auto mt-3 max-w-md text-lg text-muted">{t("pick.subtitle")}</p>
        </section>

        <div className="stagger grid gap-4 sm:grid-cols-2">
          {choices.map((c) => (
            <button key={c.id} onClick={() => setActiveLang(c.id)}
              className={`card card-hover relative overflow-hidden p-7 text-left ${c.cls}`}>
              <div aria-hidden className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${c.glow} blur-2xl`} />
              <div className="relative">
                <div className="text-3xl">{c.flag}</div>
                <div className={`mt-3 text-3xl font-bold ${c.face} ${c.accent}`}>{c.word}</div>
                <div className="mt-1 font-medium">{c.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---- normal landing for the chosen language ----
  const esCards = [
    { href: "/vokabular", Icon: IconCards, title: t("home.vocab.title"), desc: t("home.vocab.desc"), accent: "text-vocab", bg: "bg-vocab/10" },
    { href: "/themen", Icon: IconShapesLike, title: t("themes.title"), desc: t("themes.subtitle"), accent: "text-brand-2", bg: "bg-brand-2/10" },
    { href: "/konjugation", Icon: IconConjugate, title: t("home.conj.title"), desc: t("home.conj.desc"), accent: "text-brand", bg: "bg-brand/10" },
    { href: "/grammatik", Icon: IconBook, title: t("home.grammar.title"), desc: t("home.grammar.desc"), accent: "text-brand", bg: "bg-brand/10" },
    { href: "/buch", Icon: IconBookOpen, title: t("home.buch.title"), desc: t("home.buch.desc"), accent: "text-vocab", bg: "bg-vocab/10" },
    { href: "/vokabelheft", Icon: IconNotebook, title: t("home.notebook.title"), desc: t("home.notebook.desc"), accent: "text-brand-2", bg: "bg-brand-2/10" },
  ];
  const deCards = [
    { href: "/themen", Icon: IconCards, title: t("themes.title"), desc: t("themes.subtitle"), accent: "text-vocab", bg: "bg-vocab/10" },
    { href: "/vokabular/artikel", Icon: IconLetters, title: t("de.articles.title"), desc: t("de.articles.desc"), accent: "text-article", bg: "bg-article/10" },
    { href: "/konjugation", Icon: IconConjugate, title: t("home.conj.title"), desc: t("de.conj.desc"), accent: "text-brand", bg: "bg-brand/10" },
    { href: "/grammatik", Icon: IconBook, title: t("home.grammar.title"), desc: t("de.grammar.desc"), accent: "text-brand", bg: "bg-brand/10" },
    { href: "/zahlen", Icon: IconHash, title: t("numbers.title"), desc: t("numbers.subtitle"), accent: "text-noun", bg: "bg-noun/10" },
    { href: "/vokabelheft", Icon: IconNotebook, title: t("home.notebook.title"), desc: t("home.notebook.desc"), accent: "text-brand-2", bg: "bg-brand-2/10" },
  ];
  const cards = lang === "de" ? deCards : esCards;

  return (
    <div className="space-y-10">
      <section className="relative pt-2">
        <div aria-hidden className="pointer-events-none absolute -right-2 -top-12 select-none font-display text-[8rem] leading-none text-brand/[0.08] sm:text-[11rem]">
          {lang === "de" ? "ß" : "ñ"}
        </div>
        <div className="relative">
          <p className="section-label mb-2">{lang === "de" ? t("home.de.kicker") : "¡Hola! · Vamos a aprender"}</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            <span className="text-brand">{lang === "de" ? "Deutsch" : "Español"}</span> Trainer
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">{lang === "de" ? t("home.de.tagline") : t("app.tagline")}</p>
        </div>
      </section>

      <div className="stagger grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, Icon, title, desc, accent, bg }) => (
          <Link key={href} href={href} className="group card card-hover relative overflow-hidden p-6">
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

// small alias so the Themen card has its own glyph without touching icons.tsx
function IconShapesLike({ className }: { className?: string }) {
  return <IconCards className={className} />;
}
