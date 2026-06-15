"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";

export default function Home() {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
      <section className="text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-brand">Español</span> Trainer
        </h1>
        <p className="mt-2 text-muted">{t("app.tagline")}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/vokabular"
          className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="text-3xl">🗂️</div>
          <h2 className="mt-3 text-xl font-semibold group-hover:text-vocab">{t("home.vocab.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("home.vocab.desc")}</p>
        </Link>

        <Link
          href="/grammatik"
          className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="text-3xl">📖</div>
          <h2 className="mt-3 text-xl font-semibold group-hover:text-brand">{t("home.grammar.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("home.grammar.desc")}</p>
        </Link>
      </div>
    </div>
  );
}
