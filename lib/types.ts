// Shared types for the Spanish trainer.

export type Locale = "de" | "en";
export type LocalizedText = { de: string; en: string };

export type Pos =
  | "verb" | "noun" | "adj" | "adv" | "pron"
  | "prep" | "conj" | "art" | "num" | "interj" | "other";

export type Gender = "m" | "f" | null;
export type Tier = 1 | 2 | 3 | 4;

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
}
export interface BuchData {
  lektionen: { name: string; count: number }[];
  entries: BuchEntry[];
}

/** public/data/details.json — learner-dictionary content per vocab id. */
export interface VocabDetail {
  defEs: string; defDe: string; defEn: string;   // definition: Spanish + translations
  exEs: string;  exDe: string;  exEn: string;    // example sentence: Spanish + translations
}
export type VocabDetails = Record<string, VocabDetail>; // keyed by vocab id
export type BuchDetails = Record<string, VocabDetail>;  // keyed by accent-stripped es

export interface VocabIndex {
  total: number;
  counts: Partial<Record<Pos, number>>;
  verbCount: number;
  verbsByTier: number[];
}

// --- Grammar content -------------------------------------------------------
export interface GrammarExample {
  es: string;            // the Spanish example (subject matter, not translated)
  gloss: LocalizedText;  // its meaning in DE/EN
  note?: LocalizedText;
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
