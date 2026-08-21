import type { VocabItem, VerbItem, VocabIndex, BuchData, VocabDetails, BuchDetails, NounArticle, ThemesData, DeLesson } from "@/lib/types";
import { getActiveLang } from "@/lib/lang";

// Client-side loaders for the committed data files (in public/data, fetched lazily).
let vocabPromise: Promise<VocabItem[]> | null = null;
let themesPromise: Promise<ThemesData> | null = null;
let deGrammarPromise: Promise<DeLesson[]> | null = null;
let themeDetailsPromise: Promise<BuchDetails> | null = null;
let verbsPromise: Promise<VerbItem[]> | null = null;
let indexPromise: Promise<VocabIndex> | null = null;
let buchPromise: Promise<BuchData> | null = null;
let detailsPromise: Promise<VocabDetails> | null = null;
let buchDetailsPromise: Promise<BuchDetails> | null = null;
let articlesPromise: Promise<NounArticle[]> | null = null;

/** Path of a per-language data file. Spanish keeps the historic root paths,
 *  every other language lives in its own folder. Must not be a "de or else"
 *  check: that quietly served the Spanish files to any third language. */
function langFile(name: string): string {
  const lang = getActiveLang();
  return lang === "es" ? name : `${lang}/${name}`;
}

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
/** Thematic vocabulary sets — per learned language ("Temas" / "Themen"). */
export function loadThemes(): Promise<ThemesData> {
  const file = langFile("themes.json");
  return (themesPromise ??= load<ThemesData>(file));
}

/** Definitions + example sentences for the topic words (per learned language,
 *  keyed by accent-stripped word). Tolerates a missing file. */
export function loadThemeDetails(): Promise<BuchDetails> {
  const file = langFile("theme-details.json");
  return (themeDetailsPromise ??= load<BuchDetails>(file).catch(() => ({} as BuchDetails)));
}

/** Lesson-based grammar for the modes that use it: German A1 and Georgian.
 *  Spanish has its own hand-built topics/tenses content instead. Switching the
 *  learned language reloads the app, so one cache is enough. */
export function loadLessonGrammar(): Promise<DeLesson[]> {
  const lang = getActiveLang();
  if (lang === "es") return Promise.resolve([]);
  return (deGrammarPromise ??= load<DeLesson[]>(`${lang}/grammar.json`).catch(() => [] as DeLesson[]));
}
/** Definitions + example sentences (keyed by vocab id). Tolerates a missing file. */
export function loadDetails(): Promise<VocabDetails> {
  return (detailsPromise ??= load<VocabDetails>("details.json").catch(() => ({} as VocabDetails)));
}
/** Coursebook definitions + examples (keyed by accent-stripped es). Tolerates a missing file. */
export function loadBuchDetails(): Promise<BuchDetails> {
  return (buchDetailsPromise ??= load<BuchDetails>("buch-details.json").catch(() => ({} as BuchDetails)));
}
/** Noun gender database for the article trainer (el/la — or der/die/das in German
 *  mode). Tolerates a missing file. */
export function loadArticles(): Promise<NounArticle[]> {
  const file = langFile("articles.json");
  return (articlesPromise ??= load<NounArticle[]>(file).catch(() => [] as NounArticle[]));
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
