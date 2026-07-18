"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/locale";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import type { UIKey } from "@/lib/i18n/strings";

const isUnder = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

export function Nav() {
  const { t, locale, toggle } = useI18n();
  const pathname = usePathname();

  // Flat bar — every section visible at once (no dropdowns, no sliding).
  const links: { href: string; key: UIKey }[] = [
    { href: "/", key: "nav.home" },
    { href: "/vokabular", key: "nav.vocab" },
    { href: "/zahlen", key: "nav.numbers" },
    { href: "/konjugation", key: "nav.conj" },
    { href: "/grammatik", key: "nav.grammar" },
    { href: "/buch", key: "nav.buch" },
    { href: "/vokabelheft", key: "nav.notebook" },
    { href: "/stats", key: "nav.stats" },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      {/* wide header so the whole nav fits without scrolling on desktop */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand transition-transform group-hover:scale-125" />
          <span className="font-display text-lg font-semibold tracking-tight">Español</span>
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
        <button
          onClick={toggle}
          aria-label={t("lang.label")}
          className="btn btn-secondary btn-sm shrink-0"
        >
          {locale === "de" ? "EN" : "DE"}
        </button>
        <ProfileSwitcher />
      </div>
    </header>
  );
}
