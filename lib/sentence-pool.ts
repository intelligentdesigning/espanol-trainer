"use client";

// Builds the pool of buildable sentences from everything the app already has:
// vocabulary examples, coursebook examples and topic examples.

import { loadVocab, loadDetails, loadBuch, loadBuchDetails, loadThemes, loadThemeDetails } from "@/lib/data";
import { getAllProgress } from "@/lib/storage/db";
import { getActiveLang } from "@/lib/lang";
import { splitSentence, isBuildable, normalizeWord, type SentenceTask } from "@/lib/sentence";
import type { Cefr, ThemesData } from "@/lib/types";

export type SentenceSource = "all" | "vocab" | "buch" | "theme";
export type LengthBand = "short" | "medium" | "long" | "any";

export const LENGTH_BANDS: Record<Exclude<LengthBand, "any">, [number, number]> = {
  short: [3, 5],
  medium: [6, 9],
  long: [10, 40],
};

export interface PoolOptions {
  source?: SentenceSource;
  topic?: string;            // restrict to one topic / coursebook unit
  length?: LengthBand;
  cefr?: Cefr | "all";
  /** only sentences whose words the learner has already met */
  knownOnly?: boolean;
  /** the learner's own language, for the prompt */
  glossLang?: "de" | "en";
}

/** Words the learner has practised at least once, plus the top of the frequency
 *  list (those are assumed known — otherwise almost nothing is buildable early). */
async function knownWords(): Promise<Set<string>> {
  const known = new Set<string>();
  const [progress, vocab] = await Promise.all([getAllProgress(), loadVocab().catch(() => [])]);
  for (const r of progress) {
    if (r.seen <= 0) continue;
    // itemKeys: vocab:<id> | buch:<dir>:<key> | theme:<id>:<dir>:<key>
    const tail = r.itemKey.split(":").pop() ?? "";
    for (const w of tail.split(/\s+/)) if (w) known.add(normalizeWord(w));
  }
  for (const v of vocab) if (v.rank <= 250) known.add(normalizeWord(v.es));
  return known;
}

/** Every example sentence we have, as build tasks. */
export async function buildSentencePool(opts: PoolOptions = {}): Promise<SentenceTask[]> {
  const lang = getActiveLang();
  const glossLang = opts.glossLang ?? "de";
  const out: SentenceTask[] = [];
  const seen = new Set<string>();

  const push = (
    target: string, glossDe: string, glossEn: string,
    source: SentenceTask["source"], topic?: string, cefr?: Cefr,
  ) => {
    if (!target || !target.trim()) return;
    const { tokens } = splitSentence(target);
    if (tokens.length < 3) return;                 // too short to arrange
    const key = normalizeWord(target);
    if (seen.has(key)) return;
    seen.add(key);
    const gloss = (glossLang === "en" ? glossEn : glossDe) || glossEn || glossDe;
    if (!gloss) return;
    out.push({ target: target.trim(), gloss: gloss.trim(), tiles: [], solution: tokens, source, topic, cefr });
  };

  if (lang === "es") {
    const [vocab, details, buch, buchDetails, themes, themeDetails] = await Promise.all([
      loadVocab().catch(() => []), loadDetails().catch(() => ({})),
      loadBuch().catch(() => ({ lektionen: [], entries: [] })), loadBuchDetails().catch(() => ({})),
      loadThemes().catch(() => ({ themes: [], byTheme: {} }) as ThemesData), loadThemeDetails().catch(() => ({})),
    ]);
    const cefrOf = new Map(vocab.map((v) => [v.id, v.cefr]));
    for (const [id, d] of Object.entries(details)) push(d.exEs, d.exDe, d.exEn, "vocab", undefined, cefrOf.get(id));
    const buchCefr = new Map(buch.entries.map((e) => [normalizeWord(e.es), e.cefr]));
    for (const [k, d] of Object.entries(buchDetails)) push(d.exEs, d.exDe, d.exEn, "buch", undefined, buchCefr.get(k));
    const topicOf = new Map<string, { topic: string; cefr?: Cefr }>();
    for (const t of themes.themes) for (const e of themes.byTheme[t.id] ?? []) topicOf.set(normalizeWord(e.es), { topic: t.id, cefr: e.cefr });
    for (const [k, d] of Object.entries(themeDetails)) {
      const meta = topicOf.get(k);
      push(d.exEs, d.exDe, d.exEn, "theme", meta?.topic, meta?.cefr);
    }
  } else {
    const [themes, themeDetails] = await Promise.all([
      loadThemes().catch(() => ({ themes: [], byTheme: {} }) as ThemesData), loadThemeDetails().catch(() => ({})),
    ]);
    const topicOf = new Map<string, { topic: string; cefr?: Cefr }>();
    for (const t of themes.themes) for (const e of themes.byTheme[t.id] ?? []) topicOf.set(normalizeWord(e.es), { topic: t.id, cefr: e.cefr });
    // in German mode exEs carries the German sentence, exEn its English meaning
    for (const [k, d] of Object.entries(themeDetails)) {
      const meta = topicOf.get(k);
      push(d.exEs, d.exDe, d.exEn, "theme", meta?.topic, meta?.cefr);
    }
  }

  // ---- filters ----
  let pool = out;
  if (opts.source && opts.source !== "all") pool = pool.filter((s) => s.source === opts.source);
  if (opts.topic) pool = pool.filter((s) => s.topic === opts.topic);
  if (opts.cefr && opts.cefr !== "all") pool = pool.filter((s) => s.cefr === opts.cefr);
  if (opts.length && opts.length !== "any") {
    const [lo, hi] = LENGTH_BANDS[opts.length];
    pool = pool.filter((s) => s.solution.length >= lo && s.solution.length <= hi);
  }
  if (opts.knownOnly) {
    const known = await knownWords();
    pool = pool.filter((s) => isBuildable(s.solution, known));
  }
  return pool;
}
