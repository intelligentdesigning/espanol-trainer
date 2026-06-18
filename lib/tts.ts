"use client";

// Free, no-backend pronunciation via the browser's Web Speech API. Speaks any
// Spanish text using the device's installed voices — no API key, works offline.

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

function pickSpanishVoice(): SpeechSynthesisVoice | undefined {
  if (!voices.length) loadVoices();
  const es = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("es"));
  if (!es.length) return undefined;
  const code = (c: string) => es.find((v) => v.lang.toLowerCase().replace("_", "-") === c);
  return code("es-es") || code("es-mx") || code("es-us") || code("es-419") || es[0];
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Speak Spanish text. Cancels any ongoing utterance first. Returns false if unsupported. */
export function speak(text: string, opts?: { onStart?: () => void; onEnd?: () => void }): boolean {
  if (!canSpeak() || !text.trim()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 0.9; // a touch slower for learners
    const v = pickSpanishVoice();
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
