"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n, LOCALES } from "@/lib/i18n/locale";
import { IconChevronDown, IconCheck } from "@/components/icons";

/** Picks the language the *interface* is written in (English / Deutsch / ქართული). */
export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.id === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("lang.label")}
        title={t("lang.label")}
        className="btn btn-secondary btn-sm gap-1"
      >
        {current.short}
        <IconChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <div className="card absolute right-0 z-20 mt-2 w-44 p-1.5 animate-pop">
          {LOCALES.map((l) => (
            <button
              key={l.id}
              onClick={() => { setLocale(l.id); setOpen(false); }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                l.id === locale ? "bg-brand/10 font-semibold text-brand" : "hover:bg-foreground/5"
              }`}
            >
              {l.label}
              {l.id === locale && <IconCheck className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
