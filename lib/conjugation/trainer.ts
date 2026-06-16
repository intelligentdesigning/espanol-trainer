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
  siblings?: string[];   // all 6 forms of this tense (for "wrong person" detection)
  irr?: number;          // verb irregularity score (for explanations)
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
      out.push({ itemKey: `conj:${v.inf}:${form}:${person}`, infinitive: v.inf, meaning: v.en, person, expected: forms[person], siblings: forms, irr: v.irr });
    } else if (form === "imperativo-af" || form === "imperativo-neg") {
      const arr = form === "imperativo-af" ? v.imperative.afirmativo : v.imperative.negativo;
      const persons = [1, 3, 4].filter((p) => arr[p] && arr[p] !== "-"); // tú, nosotros, vosotros
      if (!persons.length) continue;
      const person = persons[Math.floor(Math.random() * persons.length)];
      out.push({ itemKey: `conj:${v.inf}:${form}:${person}`, infinitive: v.inf, meaning: v.en, person, expected: arr[person], siblings: arr, irr: v.irr });
    } else {
      const expected = form === "gerundio" ? v.nonfinite.gerundio : v.nonfinite.participio;
      out.push({ itemKey: `conj:${v.inf}:${form}`, infinitive: v.inf, meaning: v.en, person: -1, formLabel: FORM_LABELS[form], expected, irr: v.irr });
    }
  }
  return out.slice(0, count);
}

const PERSON_SHORT = ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos/ellas"];

/** Explain WHY an answer was wrong, so the learner understands the mistake. */
export function explainConjugation(q: ConjQuestion, input: string, locale: Locale): string {
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
  const inp = input.trim();

  // 1) Wrong person: the input is a valid form of this verb/tense, just another person.
  if (q.person >= 0 && q.siblings) {
    const idx = q.siblings.findIndex((f, i) => f && f !== "-" && i !== q.person && norm(f) === norm(inp));
    if (idx >= 0) {
      return locale === "de"
        ? `„${inp}" ist die Form für ${PERSON_SHORT[idx]}. Gefragt war ${PERSON_SHORT[q.person]} → ${q.expected}.`
        : `"${inp}" is the ${PERSON_SHORT[idx]} form. We asked for ${PERSON_SHORT[q.person]} → ${q.expected}.`;
    }
  }

  // 2) Irregularity hint.
  const irr = q.irr ?? 0;
  if (irr >= 4) {
    return locale === "de"
      ? "Unregelmäßiges Verb – diese Form folgt keiner Regel und muss auswendig gelernt werden."
      : "Irregular verb – this form follows no rule and must be memorized.";
  }
  if (irr >= 2) {
    return locale === "de"
      ? "Achtung: unregelmäßige Form (Stammwechsel oder Sonderform)."
      : "Watch out: irregular form (stem change or special form).";
  }

  // 3) Regular: point at the person/ending.
  if (q.person >= 0) {
    return locale === "de"
      ? `Achte auf die richtige Endung für ${PERSON_SHORT[q.person]}.`
      : `Mind the correct ending for ${PERSON_SHORT[q.person]}.`;
  }
  return locale === "de" ? "Diese Form genau einprägen." : "Memorize this exact form.";
}
