// Shared types for the Spanish trainer.

/** Interface language: what the app itself is written in (not what you learn). */
export type Locale = "en" | "de" | "ka";
/** Authored content. `ka` is optional — Georgian falls back to English. */
export type LocalizedText = { de: string; en: string; ka?: string };

export type Pos =
  | "verb" | "noun" | "adj" | "adv" | "pron"
  | "prep" | "conj" | "art" | "num" | "interj"
  | "phrase" | "name" | "other";

export type Gender = "m" | "f" | null;
export type Tier = 1 | 2 | 3 | 4;
/** CEFR difficulty level, shown as a colour-coded badge across the app. */
export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

/** One row of public/data/vocab.json */
export interface VocabItem {
  id: string;
  es: string;
  clue: string;       // primary English clue (used for EN->ES prompts)
  en: string[];       // accepted English answers (ES->EN)
  pos: Pos;
  gender: Gender;
  rank: number;       // 1 = most frequent
  diff: Tier;
  cefr?: Cefr;
}

/** Six-person conjugation tenses supported by the trainer (keys match content ids). */
export type TenseKey =
  | "presente"
  | "preterito-imperfecto"
  | "preterito-indefinido"
  | "futuro"
  | "condicional"
  | "preterito-perfecto"
  | "pluscuamperfecto"
  | "futuro-perfecto"
  | "condicional-perfecto"
  | "subjuntivo-presente"
  | "subjuntivo-imperfecto"
  | "subjuntivo-perfecto"
  | "subjuntivo-pluscuamperfecto";

/** One row of public/data/verbs.json (conjugation trainer pool) */
export interface VerbItem {
  inf: string;
  en: string;
  rank: number;
  irr: number;        // 0..5 irregularity score
  tier: Tier;
  tenses: Record<TenseKey, string[]>;          // each: 6 forms yo..ellos
  nonfinite: { gerundio: string; participio: string };
  imperative: { afirmativo: string[]; negativo: string[] }; // 6 with "-" placeholders
}

/** public/data/buch.json — vocabulary from the user's coursebook (Estudiantes.ELE A1). */
export interface BuchEntry {
  es: string;
  de: string;
  lektion: string;
  en?: string;     // English translation (accepted on input + shown alongside DE)
  deAlt?: string;  // close German synonyms also accepted (comma-separated)
  pos?: Pos;       // part of speech (Wortart) for the label
  cefr?: Cefr;
}
export interface BuchData {
  lektionen: { name: string; count: number }[];
  entries: BuchEntry[];
}

/** public/data/themes.json — thematic vocabulary sets ("Temas"). */
export interface ThemeEntry {
  es: string;
  de: string;
  en: string;
  pos?: Pos;
  gender: Gender;
  cefr?: Cefr;
}
export interface Theme {
  id: string;
  name: LocalizedText;
  icon?: string;      // icon key for the card
  entries: ThemeEntry[];
}
export interface ThemesData {
  themes: { id: string; name: LocalizedText; count: number; icon?: string }[];
  byTheme: Record<string, ThemeEntry[]>;
}

/** public/data/details.json — learner-dictionary content per vocab id. */
export interface VocabDetail {
  defEs: string; defDe: string; defEn: string;   // definition: Spanish + translations
  exEs: string;  exDe: string;  exEn: string;    // example sentence: Spanish + translations
}
export type VocabDetails = Record<string, VocabDetail>; // keyed by vocab id
export type BuchDetails = Record<string, VocabDetail>;  // keyed by accent-stripped es

/** public/data/articles.json — gender training: noun → definite article. */
export interface NounArticle {
  es: string;
  article: "el" | "la" | "der" | "die" | "das";  // Spanish or German mode
  irregular: boolean;      // gender not predictable from the word's form
  note?: LocalizedText;    // hint shown for irregulars
  en?: string;             // meaning (German mode)
  cefr?: Cefr;
}

/** public/data/de/grammar.json — a German A1 grammar lesson. */
export interface DeLesson {
  id: string;
  name: LocalizedText;
  summary: LocalizedText;
  cefr?: Cefr;
  rules: GrammarRule[];
  practice: PracticeItem[];
}

export interface VocabIndex {
  total: number;
  counts: Partial<Record<Pos, number>>;
  verbCount: number;
  verbsByTier: number[];
}

// --- Grammar content -------------------------------------------------------
export interface GrammarExample {
  es: string;            // the target-language example (Spanish / German / Georgian)
  gloss: LocalizedText;  // its meaning in DE/EN
  note?: LocalizedText;
  /** Further word orders that are equally correct, each a full sentence.
   *  Used by the sentence builder for languages with free constituent order. */
  alt?: string[];
  /** Set when this example should feed the sentence builder. */
  buildable?: boolean;
}
export interface GrammarRule {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
  examples: GrammarExample[];
}
export interface GrammarSection {
  id: string;
  title: LocalizedText;
  intro?: LocalizedText;
  rules: GrammarRule[];
}

/** A solvable practice question for a grammar topic. */
export interface PracticeItem {
  kind: "choice" | "fill";
  prompt: string;            // Spanish sentence with a "___" blank
  promptGloss?: LocalizedText;
  options?: string[];        // present for kind "choice"
  answer: string;            // correct option text, or the fill-in answer
  altAnswers?: string[];     // extra accepted answers (fill)
  explain: LocalizedText;
}

/** A topic in "Andere Grammatikformen": rules + examples + solvable practice. */
export interface GrammarTopic {
  id: string;
  name: LocalizedText;
  summary: LocalizedText;
  rules: GrammarRule[];
  practice: PracticeItem[];
  cefr?: Cefr;
}
export interface TenseTopic {
  id: string;
  name: LocalizedText;
  shortName: LocalizedText;
  mood: LocalizedText;
  summary: LocalizedText;
  rules: GrammarRule[];
  endings?: { label: LocalizedText; ar: string[]; er: string[]; ir: string[] };
  examples: GrammarExample[];
  practiceTenseKey?: string; // links to the conjugation trainer
  practice?: PracticeItem[]; // scored rules/usage test for this tense
  available: boolean;        // false => listed but "coming soon"
  cefr?: Cefr;
}

// --- Local progress / SRS (IndexedDB) --------------------------------------
export type ItemKind = "vocab" | "conj" | "grammar";
export interface ProgressRecord {
  itemKey: string;   // stable, e.g. "vocab:casa" | "conj:hablar:presente:1"
  kind: ItemKind;
  box: number;
  ease: number;
  intervalDays: number;
  dueAt: number;
  seen: number;
  correct: number;
  streak: number;
  lastResult: "right" | "wrong" | null;
  updatedAt: number;
}
export interface SessionRecord {
  id: string;
  mode: string;
  startedAt: number;
  endedAt: number;
  total: number;
  correct: number;
}
