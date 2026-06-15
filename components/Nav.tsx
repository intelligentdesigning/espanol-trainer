"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/locale";

export function Nav() {
  const { t, locale, toggle } = useI18n();
  const pathname = usePathname();

  const links: { href: string; key: Parameters<typeof t>[0] }[] = [
    { href: "/", key: "nav.home" },
    { href: "/vokabular", key: "nav.vocab" },
    { href: "/grammatik", key: "nav.grammar" },
    { href: "/stats", key: "nav.stats" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-1 px-4 py-3">
        <Link href="/" className="mr-auto flex items-center gap-2 font-bold tracking-tight">
          <span className="text-brand">●</span>
          <span>Español</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? "bg-brand/10 text-brand"
                  : "text-muted hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
          <button
            onClick={toggle}
            aria-label={t("lang.label")}
            className="ml-1 rounded-md border border-border px-2 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
          >
            {locale === "de" ? "EN" : "DE"}
          </button>
        </nav>
      </div>
    </header>
  );
}
