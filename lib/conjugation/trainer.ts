import type { Locale, Tier, VerbItem } from "@/lib/types";

export const PERSON_LABELS: Record<Locale, string[]> = {
  de: [
    "yo (ich)", "tú (du)", "él/ella (er/sie)",
    "nosotros (wir)", "vosotros (ihr)", "ellos/ellas (sie, Pl.)",
  ],
  en: [
    "yo (I)", "tú (you)", "él/ella (he/she)",
    "nosotros (we)", "vosotros (you, pl.)", "ellos/ellas (they)",
  ],
};

export interface ConjQuestion {
  itemKey: string;       // conj:<inf>:presente:<person>
  infinitive: string;
  meaning: string;       // English clue of the verb
  person: number;        // 0..5
  expected: string;      // accented correct form
}

/** Accent-SENSITIVE check (accents are grammatically meaningful in conjugation). */
export function checkConjugation(input: string, expected: string): boolean {
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
  return norm(input) === norm(expected);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildConjSession(verbs: VerbItem[], tier: Tier, count: number): ConjQuestion[] {
  const pool = verbs.filter((v) => v.tier === tier);
  if (pool.length === 0) return [];
  const questions: ConjQuestion[] = [];
  // Sample verbs with replacement if the pool is small, varying the person each time.
  const order = shuffle(pool);
  for (let i = 0; i < count; i++) {
    const v = order[i % order.length];
    const person = Math.floor(Math.random() * 6);
    questions.push({
      itemKey: `conj:${v.inf}:presente:${person}`,
      infinitive: v.inf,
      meaning: v.en,
      person,
      expected: v.present[person],
    });
  }
  return questions;
}
