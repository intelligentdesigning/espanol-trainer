"use client";

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";

/** Which language the app currently teaches. Each mode is a separate world:
 *  own content, own colours, own progress database. */
export type LearnLang = "es" | "de" | "ka";

const KEY = "learn-lang";
export const LANGS: LearnLang[] = ["es", "de", "ka"];

const isLang = (v: unknown): v is LearnLang => v === "es" || v === "de" || v === "ka";

/** Read the chosen language outside React (storage layer, before hydration). */
export function getActiveLang(): LearnLang {
  if (typeof window === "undefined") return "es";
  const v = window.localStorage.getItem(KEY);
  return isLang(v) ? v : "es";
}

/** Has the learner picked a language yet? (null → show the picker) */
export function hasPickedLang(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) !== null;
}

/** Switch mode: persist, then hard-reload so every store/loader re-reads it. */
export function setActiveLang(lang: LearnLang): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, lang);
  window.location.href = "/";
}

/** Clear the choice → back to the language picker. */
export function clearLang(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.location.href = "/";
}

/** BCP-47 tag per learned language, for speech + `lang` attributes. */
export const SPEECH: Record<LearnLang, string> = { es: "es-ES", de: "de-DE", ka: "ka-GE" };

interface LangCtx {
  lang: LearnLang;
  picked: boolean;
  /** The language being learned, as a BCP-47 tag (for speech + lang attributes). */
  speechLang: string;
}
const Ctx = createContext<LangCtx>({ lang: "es", picked: false, speechLang: "es-ES" });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LearnLang>("es");
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    const l = getActiveLang();
    setLang(l);
    setPicked(hasPickedLang());
    // drives the per-language colour theme in globals.css
    document.documentElement.setAttribute("data-lang", l);
  }, []);

  return createElement(
    Ctx.Provider,
    { value: { lang, picked, speechLang: SPEECH[lang] } },
    children,
  );
}

export function useLang(): LangCtx {
  return useContext(Ctx);
}
