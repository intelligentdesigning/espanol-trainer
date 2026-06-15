"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Locale, LocalizedText } from "@/lib/types";
import { ui, type UIKey } from "@/lib/i18n/strings";

const STORAGE_KEY = "locale";

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  t: (key: UIKey) => string;
  L: (text: LocalizedText) => string;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Default 'de' on both server render and first client (hydration) render to
  // avoid hydration mismatch; correct from localStorage right after mount.
  const [locale, setLocaleState] = useState<Locale>("de");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === "de" || stored === "en") setLocaleState(stored);
      else if (navigator.language?.toLowerCase().startsWith("en")) setLocaleState("en");
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
  const toggle = () => setLocale(locale === "de" ? "en" : "de");

  const t = (key: UIKey) => ui[locale][key] ?? ui.de[key] ?? key;
  const L = (text: LocalizedText) => text[locale] ?? text.de;

  return <Ctx.Provider value={{ locale, setLocale, toggle, t, L }}>{children}</Ctx.Provider>;
}

export function useI18n(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
