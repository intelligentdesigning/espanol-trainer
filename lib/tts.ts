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
 *  Cancels any ongoing utterance first. Returns false if unsupported. */
export function speak(text: string, opts?: { onStart?: () => void; onEnd?: () => void; lang?: string }): boolean {
  if (!canSpeak() || !text.trim()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const tag = opts?.lang || (getActiveLang() === "de" ? "de-DE" : "es-ES");
    u.lang = tag;
    u.rate = 0.9; // a touch slower for learners
    const v = pickVoice(tag);
    if (v) u.voice = v;
    if (opts?.onStart) u.onstart = opts.onStart;
    if (opts?.onEnd) {
      u.onend = opts.onEnd;
      u.onerror = opts.onEnd;
    }
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}
