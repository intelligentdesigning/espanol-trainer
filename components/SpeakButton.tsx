"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { speak, primeVoices } from "@/lib/tts";
import { IconVolume } from "@/components/icons";

/** Small speaker button: clicking pronounces the word in the language you learn.
 *  If the browser accepts the request but stays silent (Brave's fingerprinting
 *  shield does exactly that), a short hint appears instead of nothing happening. */
export function SpeakButton({ text, className = "" }: { text: string; className?: string }) {
  const { t } = useI18n();
  const [speaking, setSpeaking] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => { primeVoices(); }, []);
  useEffect(() => {
    if (!blocked) return;
    const id = setTimeout(() => setBlocked(false), 6000);
    return () => clearTimeout(id);
  }, [blocked]);

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setBlocked(false);
    speak(text, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onFail: () => setBlocked(true),
    });
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-label={t("tts.play")}
        title={blocked ? t("tts.blocked") : t("tts.play")}
        className={`inline-flex shrink-0 items-center justify-center rounded-md p-1.5 transition-colors hover:bg-foreground/10 hover:text-foreground ${
          blocked ? "text-brand-2" : speaking ? "text-brand animate-pulse" : "text-muted"
        } ${className}`}
      >
        <IconVolume className="h-4 w-4" />
      </button>
      {blocked && (
        <span
          role="status"
          className="animate-pop absolute left-1/2 top-full z-30 mt-1 w-56 -translate-x-1/2 rounded-lg border border-border bg-card p-2 text-xs leading-snug text-muted shadow-lg"
        >
          {t("tts.blocked")}
        </span>
      )}
    </span>
  );
}
