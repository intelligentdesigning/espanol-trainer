"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Locale, LocalizedText } from "@/lib/types";
import { ui, type UIKey } from "@/lib/i18n/strings";

const STORAGE_KEY = "locale";

/** Interface languages, in the order shown in the switcher. */
export const LOCALES: { id: Locale; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "de", label: "Deutsch", short: "DE" },
  { id: "ka", label: "ქართული", short: "ქარ" },
];
const isLocale = (v: unknown): v is Locale => v === "en" || v === "de" || v === "ka";

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Step to the next interface language (kept for existing call sites). */
  toggle: () => void;
  t: (key: UIKey) => string;
  L: (text: LocalizedText) => string;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Default 'en' on the server and on the first client render (avoids hydration
  // mismatch); corrected from localStorage / browser language right after mount.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isLocale(stored)) { setLocaleState(stored); return; }
      const nav = navigator.language?.toLowerCase() ?? "";
      if (nav.startsWith("ka")) setLocaleState("ka");
      else if (nav.startsWith("de")) setLocaleState("de");
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  };
  const toggle = () => {
    const i = LOCALES.findIndex((x) => x.id === locale);
    setLocale(LOCALES[(i + 1) % LOCALES.length].id);
  };

  // English is the fallback for both UI strings and authored content.
  const t = (key: UIKey) => ui[locale]?.[key] ?? ui.en[key] ?? key;
  const L = (text: LocalizedText) => text[locale] ?? text.en ?? text.de;

  return <Ctx.Provider value={{ locale, setLocale, toggle, t, L }}>{children}</Ctx.Provider>;
}

export function useI18n(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
