// Sentence building: turn an example sentence into ordered word tiles, shuffle
// them, and judge the learner's arrangement. Pure + unit-testable.

import type { Cefr } from "@/lib/types";

export interface SentenceTask {
  /** the target-language sentence, exactly as authored */
  target: string;
  /** its meaning in the learner's own language */
  gloss: string;
  /** tiles to arrange (sentence-final punctuation is added automatically) */
  tiles: string[];
  /** correct order of those tiles */
  solution: string[];
  source: "vocab" | "buch" | "theme" | "lesson";
  topic?: string;
  cefr?: Cefr;
  /** Further word orders that are equally correct, each as a token list.
   *  Georgian marks roles by case, so constituents scramble freely and the
   *  neutral order is only one of several grammatical ones. Authored per
   *  sentence rather than guessed at runtime. */
  alt?: string[][];
  /** Off for languages whose word order the front/back heuristic cannot model. */
  allowRotation?: boolean;
}

/** Trailing . ! ? is not a tile — it is appended for the learner. */
const FINAL_PUNCT = /[.!?]+$/;

export function splitSentence(sentence: string): { tokens: string[]; tail: string } {
  const trimmed = sentence.trim();
  const m = trimmed.match(FINAL_PUNCT);
  const tail = m ? m[0] : "";
  const body = tail ? trimmed.slice(0, -tail.length) : trimmed;
  // keep commas/¿/¡ attached to their word so tiles stay readable
  const tokens = body.split(/\s+/).filter(Boolean);
  return { tokens, tail };
}

/** Fisher-Yates, guaranteed to differ from the solution when that is possible. */
export function shuffleTiles(tokens: string[], rnd: () => number = Math.random): string[] {
  if (tokens.length < 2) return tokens.slice();
  for (let attempt = 0; attempt < 12; attempt++) {
    const r = tokens.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    if (r.some((t, i) => t !== tokens[i])) return r;
  }
  return tokens.slice().reverse();
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[.,;:!?¡¿"']/g, "").trim();

export type SentenceVerdict =
  | { kind: "correct" }
  /** grammatical but not the authored order — counts as correct, shows the usual one */
  | { kind: "alsoOk"; canonical: string }
  | { kind: "wrong"; canonical: string };

/** Accepts a rotation: one contiguous chunk of up to three words moved from the
 *  very front to the very back or vice versa ("Hoy comemos en casa" ↔ "Comemos
 *  en casa hoy"). Swapping neighbours is NOT a rotation and stays wrong.
 *  Orders listed in `alt` always count; `allowRotation: false` turns the
 *  heuristic off for languages whose word order it cannot model. */
export function checkSentence(
  attempt: string[],
  solution: string[],
  opts: { alt?: string[][]; allowRotation?: boolean } = {},
): SentenceVerdict {
  const { alt = [], allowRotation = true } = opts;
  const canonical = solution.join(" ");
  const a = attempt.map(norm).filter(Boolean);
  const s = solution.map(norm).filter(Boolean);
  if (a.length !== s.length) return { kind: "wrong", canonical };
  if (a.every((t, i) => t === s[i])) return { kind: "correct" };

  // an order the content itself declares valid
  for (const other of alt) {
    const o = other.map(norm).filter(Boolean);
    if (o.length === a.length && a.every((t, i) => t === o[i])) return { kind: "alsoOk", canonical };
  }

  // same multiset only — otherwise it is a different sentence entirely
  const bag = (xs: string[]) => xs.slice().sort().join("\u0000");
  if (bag(a) !== bag(s)) return { kind: "wrong", canonical };
  // languages whose word order this heuristic cannot model opt out here
  if (!allowRotation) return { kind: "wrong", canonical };

  // one contiguous chunk moved between the very front and the very back
  const rotationsOk = (from: string[], to: string[]) => {
    for (let len = 1; len <= Math.min(3, from.length - 1); len++) {
      const head = from.slice(0, len), rest = from.slice(len);
      if ([...rest, ...head].every((t, i) => t === to[i])) return true;
      const tail = from.slice(from.length - len), start = from.slice(0, from.length - len);
      if ([...tail, ...start].every((t, i) => t === to[i])) return true;
    }
    return false;
  };
  if (rotationsOk(a, s) || rotationsOk(s, a)) return { kind: "alsoOk", canonical };
  return { kind: "wrong", canonical };
}

/** Words a learner is assumed to know without ever drilling them. */
export const FUNCTION_WORDS = new Set([
  // Spanish
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "a", "al", "en", "y", "o",
  "que", "no", "se", "es", "son", "está", "estan", "están", "con", "por", "para", "mi", "mis",
  "tu", "tus", "su", "sus", "me", "te", "le", "lo", "nos", "muy", "más", "pero", "si", "ya",
  "yo", "tú", "él", "ella", "usted", "nosotros", "ellos", "hay", "esta", "este", "eso",
  // German
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines",
  "ich", "du", "er", "sie", "es", "wir", "ihr", "und", "oder", "aber", "nicht", "kein", "keine",
  "ist", "sind", "bin", "bist", "hat", "habe", "hast", "haben", "im", "in", "auf", "mit", "zu",
  "für", "von", "vom", "am", "an", "sehr", "auch", "noch", "schon", "hier", "da", "dass", "wie",
  "mein", "meine", "dein", "deine", "sein", "seine", "wir", "man", "es",
]);

/** Is this sentence buildable from what the learner already knows?
 *  `known` holds normalised words that were practised at least once. */
export function isBuildable(tokens: string[], known: Set<string>, allowUnknown = 1): boolean {
  let unknown = 0;
  for (const t of tokens) {
    const w = norm(t);
    if (!w || FUNCTION_WORDS.has(w) || known.has(w)) continue;
    unknown++;
    if (unknown > allowUnknown) return false;
  }
  return true;
}

export const normalizeWord = norm;
