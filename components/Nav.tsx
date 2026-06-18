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
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" />
          <span>Español</span>
        </Link>
        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 rounded-md px-2 py-1.5 text-sm font-medium transition-colors sm:px-2.5 ${
                isUnder(pathname, l.href)
                  ? "bg-brand/10 text-brand"
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
          className="shrink-0 rounded-md border border-border px-2 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
        >
          {locale === "de" ? "EN" : "DE"}
        </button>
        <ProfileSwitcher />
      </div>
    </header>
  );
}
