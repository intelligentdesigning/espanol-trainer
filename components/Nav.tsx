"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/locale";
import { useLang, clearLang } from "@/lib/lang";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { KA_SECTIONS } from "@/lib/sections";
import { IconChevronDown } from "@/components/icons";
import type { UIKey } from "@/lib/i18n/strings";

const isUnder = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

export function Nav() {
  const { t } = useI18n();
  const { lang } = useLang();
  const pathname = usePathname();

  // Flat bar — every section visible at once (no dropdowns, no sliding).
  // The coursebook trainer is Spanish-only (it mirrors the user's own book).
  // Georgian is a grammar reference: it has no articles, and every other
  // trainer would need a Georgian keyboard, so only the tap-only ones are shown.
  const links: { href: string; key: UIKey }[] = lang === "ka"
    ? KA_SECTIONS
    : [
        { href: "/", key: "nav.home" },
        ...(lang === "es" ? [{ href: "/vokabular", key: "nav.vocab" as UIKey }] : []),
        { href: "/themen", key: "nav.themen" },
        { href: "/satzbau", key: "nav.sentence" },
        ...(lang === "de" ? [{ href: "/vokabular/artikel", key: "nav.articles" as UIKey }] : []),
        { href: "/zahlen", key: "nav.numbers" },
        { href: "/konjugation", key: "nav.conj" },
        { href: "/grammatik", key: "nav.grammar" },
        ...(lang === "es" ? [{ href: "/buch", key: "nav.buch" as UIKey }] : []),
        { href: "/vokabelheft", key: "nav.notebook" },
        { href: "/stats", key: "nav.stats" },
      ];

  const WORDMARK = { es: "Español", de: "Deutsch", ka: "ქართული" };
  const FLAG = { es: "🇪🇸", de: "🇩🇪", ka: "🇬🇪" };

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      {/* wide header so the whole nav fits without scrolling on desktop */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand transition-transform group-hover:scale-125" />
          <span className="font-display text-lg font-semibold tracking-tight" lang={lang}>{WORDMARK[lang]}</span>
        </Link>
        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isUnder(pathname, l.href) ? "page" : undefined}
              className={`shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors sm:px-2.5 ${
                isUnder(pathname, l.href)
                  ? "bg-brand/10 font-semibold text-brand"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        {/* which language you're learning + one click to switch */}
        <button
          onClick={clearLang}
          title={t("lang.switchLearn")}
          aria-label={t("lang.switchLearn")}
          className="btn btn-secondary btn-sm shrink-0 gap-1"
        >
          <span>{FLAG[lang]}</span>
          <span className="hidden sm:inline">{lang.toUpperCase()}</span>
          <IconChevronDown className="h-3 w-3 opacity-60" />
        </button>
        <LocaleSwitcher />
        <ProfileSwitcher />
      </div>
    </header>
  );
}
