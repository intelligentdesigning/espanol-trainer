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

/** One row of public/data/verbs.json (present-tense trainer pool) */
export interface VerbItem {
  inf: string;
  en: string;
  rank: number;
  irr: number;        // 0..5 irregularity score
  tier: Tier;
  present: string[];  // 6 forms: yo, tú, él/ella, nosotros, vosotros, ellos
}

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
  available: boolean;        // false => listed but "coming soon"
}

// --- Local progress / SRS (IndexedDB) --------------------------------------
export type ItemKind = "vocab" | "conj";
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
