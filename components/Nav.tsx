"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { IconChevronDown } from "@/components/icons";
import type { UIKey } from "@/lib/i18n/strings";

type NavItem = { href: string; key: UIKey };

const isUnder = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

const DD_WIDTH = 208; // w-52

/**
 * A grouped nav entry. The dropdown is rendered in a portal with fixed
 * positioning so the horizontally-scrollable (overflow-clipping) nav bar
 * never cuts it off, and the bar itself stays a single compact row.
 */
function NavGroup({ label, items }: { label: UIKey; items: NavItem[] }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const ddRef = useRef<HTMLDivElement>(null);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - DD_WIDTH - 8)) });
  };

  useEffect(() => setOpen(false), [pathname]); // close on navigation

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const tgt = e.target as Node;
      if (!btnRef.current?.contains(tgt) && !ddRef.current?.contains(tgt)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const active = items.some((i) => isUnder(pathname, i.href));

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => { if (!open) place(); setOpen((o) => !o); }}
        className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
          active ? "bg-brand/10 text-brand" : "text-muted hover:bg-foreground/5 hover:text-foreground"
        }`}
      >
        {t(label)}
        <IconChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={ddRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: DD_WIDTH, zIndex: 50 }}
            className="rounded-xl border border-border bg-card p-1.5 shadow-lg"
          >
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isUnder(pathname, i.href) ? "bg-brand/10 text-brand" : "text-foreground hover:bg-foreground/5"
                }`}
              >
                {t(i.key)}
              </Link>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

export function Nav() {
  const { t, locale, toggle } = useI18n();
  const pathname = usePathname();

  const vocab: NavItem[] = [
    { href: "/vokabular", key: "nav.vocabTrainer" },
    { href: "/buch", key: "nav.buch" },
    { href: "/vokabelheft", key: "nav.notebook" },
  ];
  const grammar: NavItem[] = [
    { href: "/grammatik", key: "nav.grammarHub" },
    { href: "/konjugation", key: "nav.conj" },
  ];

  const linkCls = (active: boolean) =>
    `shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-brand/10 text-brand" : "text-muted hover:bg-foreground/5 hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" />
          <span>Español</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/" className={linkCls(pathname === "/")}>{t("nav.home")}</Link>
          <NavGroup label="nav.vocabGroup" items={vocab} />
          <NavGroup label="nav.grammar" items={grammar} />
          <Link href="/stats" className={linkCls(isUnder(pathname, "/stats"))}>{t("nav.stats")}</Link>
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
