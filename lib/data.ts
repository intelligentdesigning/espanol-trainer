import type { VocabItem, VerbItem, VocabIndex } from "@/lib/types";

// Client-side loaders for the committed data files (in public/data, fetched lazily).
let vocabPromise: Promise<VocabItem[]> | null = null;
let verbsPromise: Promise<VerbItem[]> | null = null;
let indexPromise: Promise<VocabIndex> | null = null;

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
