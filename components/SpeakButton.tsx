"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { speak, primeVoices } from "@/lib/tts";
import { IconVolume } from "@/components/icons";

/** Small speaker button: clicking pronounces the given Spanish text aloud. */
export function SpeakButton({ text, className = "" }: { text: string; className?: string }) {
  const { t } = useI18n();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => { primeVoices(); }, []);

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    speak(text, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("tts.play")}
      title={t("tts.play")}
      className={`inline-flex shrink-0 items-center justify-center rounded-md p-1.5 transition-colors hover:bg-foreground/10 hover:text-foreground ${speaking ? "text-brand animate-pulse" : "text-muted"} ${className}`}
    >
      <IconVolume className="h-4 w-4" />
    </button>
  );
}
