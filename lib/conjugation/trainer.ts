import type { Locale, TenseKey, Tier, VerbItem } from "@/lib/types";

/** Everything the trainer can drill: the 13 six-person tenses + imperative + non-finite. */
export type FormKey = TenseKey | "imperativo-af" | "imperativo-neg" | "gerundio" | "participio";

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

export const FORM_LABELS: Record<FormKey, string> = {
  "presente": "Presente",
  "preterito-imperfecto": "Pretérito imperfecto",
  "preterito-indefinido": "Pretérito indefinido",
  "futuro": "Futuro simple",
  "condicional": "Condicional simple",
  "preterito-perfecto": "Pretérito perfecto",
  "pluscuamperfecto": "Pluscuamperfecto",
  "futuro-perfecto": "Futuro perfecto",
  "condicional-perfecto": "Condicional perfecto",
  "subjuntivo-presente": "Subjuntivo presente",
  "subjuntivo-imperfecto": "Subjuntivo imperfecto",
  "subjuntivo-perfecto": "Subjuntivo perfecto",
  "subjuntivo-pluscuamperfecto": "Subjuntivo pluscuamperfecto",
  "imperativo-af": "Imperativo afirmativo",
  "imperativo-neg": "Imperativo negativo",
  "gerundio": "Gerundio",
  "participio": "Participio",
};

export const FORM_GROUPS: { mood: string; keys: FormKey[] }[] = [
  { mood: "Indicativo", keys: ["presente", "preterito-imperfecto", "preterito-indefinido", "futuro", "condicional", "preterito-perfecto", "pluscuamperfecto", "futuro-perfecto", "condicional-perfecto"] },
  { mood: "Subjuntivo", keys: ["subjuntivo-presente", "subjuntivo-imperfecto", "subjuntivo-perfecto", "subjuntivo-pluscuamperfecto"] },
  { mood: "Otras formas / Other", keys: ["imperativo-af", "imperativo-neg", "gerundio", "participio"] },
];

const TENSE_KEYS = new Set<string>(FORM_GROUPS[0].keys.concat(FORM_GROUPS[1].keys));

export interface ConjQuestion {
  itemKey: string;
  infinitive: string;
  meaning: string;
  person: number;        // 0..5, or -1 for non-finite forms
  formLabel?: string;    // shown instead of a person label for non-finite forms
  expected: string;
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

export function buildConjSession(verbs: VerbItem[], tier: Tier, count: number, form: FormKey): ConjQuestion[] {
  const pool = shuffle(verbs.filter((v) => v.tier === tier));
  if (pool.length === 0) return [];
  const out: ConjQuestion[] = [];

  for (let i = 0; out.length < count && i < count * 4; i++) {
    const v = pool[i % pool.length];

    if (TENSE_KEYS.has(form)) {
      const forms = v.tenses[form as TenseKey];
      if (!forms) continue;
      const person = Math.floor(Math.random() * 6);
      out.push({ itemKey: `conj:${v.inf}:${form}:${person}`, infinitive: v.inf, meaning: v.en, person, expected: forms[person] });
    } else if (form === "imperativo-af" || form === "imperativo-neg") {
      const arr = form === "imperativo-af" ? v.imperative.afirmativo : v.imperative.negativo;
      const persons = [1, 3, 4].filter((p) => arr[p] && arr[p] !== "-"); // tú, nosotros, vosotros
      if (!persons.length) continue;
      const person = persons[Math.floor(Math.random() * persons.length)];
      out.push({ itemKey: `conj:${v.inf}:${form}:${person}`, infinitive: v.inf, meaning: v.en, person, expected: arr[person] });
    } else {
      const expected = form === "gerundio" ? v.nonfinite.gerundio : v.nonfinite.participio;
      out.push({ itemKey: `conj:${v.inf}:${form}`, infinitive: v.inf, meaning: v.en, person: -1, formLabel: FORM_LABELS[form], expected });
    }
  }
  return out.slice(0, count);
}
