import type { VocabItem, VerbItem, VocabIndex, BuchData } from "@/lib/types";

// Client-side loaders for the committed data files (in public/data, fetched lazily).
let vocabPromise: Promise<VocabItem[]> | null = null;
let verbsPromise: Promise<VerbItem[]> | null = null;
let indexPromise: Promise<VocabIndex> | null = null;
let buchPromise: Promise<BuchData> | null = null;

function load<T>(file: string): Promise<T> {
  return fetch(`/data/${file}`).then((r) => {
    if (!r.ok) throw new Error(`failed to load ${file}: ${r.status}`);
    return r.json() as Promise<T>;
  });
}

export function loadVocab(): Promise<VocabItem[]> {
  return (vocabPromise ??= load<VocabItem[]>("vocab.json"));
}
export function loadVerbs(): Promise<VerbItem[]> {
  return (verbsPromise ??= load<VerbItem[]>("verbs.json"));
}
export function loadIndex(): Promise<VocabIndex> {
  return (indexPromise ??= load<VocabIndex>("vocab.index.json"));
}
export function loadBuch(): Promise<BuchData> {
  return (buchPromise ??= load<BuchData>("buch.json"));
}

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

let strippedIndex: Map<string, VocabItem> | null = null;

/**
 * "Autocorrect" for the notebook: if the typed word matches a known dataset word
 * ignoring accents, return the correctly accented Spanish + its English meaning.
 * Returns null if no match or the input is already correct.
 */
export async function suggestSpanish(input: string): Promise<{ es: string; en: string } | null> {
  const key = strip(input);
  if (!key) return null;
  const vocab = await loadVocab();
  if (!strippedIndex) {
    strippedIndex = new Map();
    for (const it of vocab) {
      const k = strip(it.es);
      if (!strippedIndex.has(k)) strippedIndex.set(k, it);
    }
  }
  const hit = strippedIndex.get(key);
  if (hit && hit.es !== input.trim()) {
    return { es: hit.es, en: hit.en.join(" / ") };
  }
  return null;
}
