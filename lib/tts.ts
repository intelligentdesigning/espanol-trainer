"use client";

// Free, no-backend pronunciation via the browser's Web Speech API. Speaks the
// text in the language being learned, using the device's installed voices —
// no API key, works offline.

import { getActiveLang } from "@/lib/lang";

let voices: SpeechSynthesisVoice[] = [];
let primed = false;

function loadVoices(): void {
  try {
    voices = window.speechSynthesis.getVoices() || [];
  } catch {
    voices = [];
  }
}

/** Cache the voice list (it loads asynchronously). Safe to call repeatedly. */
export function primeVoices(): void {
  if (primed || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  primed = true;
  loadVoices();
  try {
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
  } catch {}
}

/** Best voice for a BCP-47 tag, preferring the exact locale then any of that language. */
function pickVoice(tag: string): SpeechSynthesisVoice | undefined {
  if (!voices.length) loadVoices();
  const base = tag.slice(0, 2).toLowerCase();
  const same = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(base));
  if (!same.length) return undefined;
  const code = (c: string) => same.find((v) => v.lang.toLowerCase().replace("_", "-") === c);
  if (base === "de") return code("de-de") || code("de-at") || code("de-ch") || same[0];
  return code("es-es") || code("es-mx") || code("es-us") || code("es-419") || same[0];
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Speak text in the language currently being learned (Spanish or German).
 *  Returns false if the browser has no speech support at all. `onFail` fires
 *  when the browser accepted the request but never actually spoke — Brave's
 *  fingerprinting shield and some locked-down setups do exactly that, and the
 *  UI should say so instead of silently doing nothing. */
export function speak(
  text: string,
  opts?: { onStart?: () => void; onEnd?: () => void; onFail?: () => void; lang?: string },
): boolean {
  if (!canSpeak() || !text.trim()) return false;
  const synth = window.speechSynthesis;
  const tag = opts?.lang || (getActiveLang() === "de" ? "de-DE" : "es-ES");

  const utter = () => {
    try {
      // Only cancel when something is actually queued: a bare cancel() right
      // before speak() is a known Chrome bug that swallows the next utterance.
      if (synth.speaking || synth.pending) synth.cancel();
      if (synth.paused) synth.resume(); // Chrome sometimes leaves it paused

      const u = new SpeechSynthesisUtterance(text);
      u.lang = tag;
      u.rate = 0.9; // a touch slower for learners
      const v = pickVoice(tag);
      if (v) u.voice = v;

      let started = false;
      u.onstart = () => { started = true; opts?.onStart?.(); };
      u.onend = () => opts?.onEnd?.();
      u.onerror = () => { opts?.onEnd?.(); if (!started) opts?.onFail?.(); };
      synth.speak(u);

      // Nothing happened within a second → treat as blocked.
      setTimeout(() => {
        if (!started && !synth.speaking && !synth.pending) {
          opts?.onEnd?.();
          opts?.onFail?.();
        }
      }, 1200);
    } catch {
      opts?.onEnd?.();
      opts?.onFail?.();
    }
  };

  // Voices load asynchronously; on the very first click they are often still
  // empty. Give them one short beat rather than speaking with no voice at all.
  if (!voices.length) {
    loadVoices();
    if (!voices.length) {
      setTimeout(() => { loadVoices(); utter(); }, 120);
      return true;
    }
  }
  utter();
  return true;
}
