import type { TenseTopic } from "@/lib/types";

const stub = (
  id: string,
  de: string,
  en: string,
  moodDe: string,
  moodEn: string,
  sumDe: string,
  sumEn: string
): TenseTopic => ({
  id,
  name: { de, en },
  shortName: { de, en },
  mood: { de: moodDe, en: moodEn },
  summary: { de: sumDe, en: sumEn },
  rules: [],
  examples: [],
  available: false,
});

export const zeitformen: TenseTopic[] = [
  {
    id: "presente",
    name: { de: "Präsens (presente)", en: "Present (presente)" },
    shortName: { de: "Präsens", en: "Present" },
    mood: { de: "Indikativ", en: "Indicative" },
    summary: {
      de: "Die Gegenwart: Gewohnheiten, allgemeine Wahrheiten, aktuelle Zustände und oft die nahe Zukunft.",
      en: "The present: habits, general truths, current states – and often the near future.",
    },
    rules: [
      {
        id: "regular",
        title: { de: "Regelmäßige Bildung", en: "Regular formation" },
        body: {
          de: "Endung -ar/-er/-ir vom Infinitiv entfernen und die Personalendungen anhängen.",
          en: "Remove the -ar/-er/-ir ending from the infinitive and add the personal endings.",
        },
        examples: [
          { es: "hablar → hablo, hablas, habla …", gloss: { de: "sprechen → ich spreche …", en: "to speak → I speak …" } },
          { es: "comer → como, comes, come …", gloss: { de: "essen → ich esse …", en: "to eat → I eat …" } },
          { es: "vivir → vivo, vives, vive …", gloss: { de: "leben → ich lebe …", en: "to live → I live …" } },
        ],
      },
      {
        id: "stem",
        title: { de: "Stammwechsel (Diphthongierung)", en: "Stem changes" },
        body: {
          de: "Viele Verben ändern den Stammvokal in allen Formen AUSSER nosotros/vosotros: e→ie, o→ue, e→i, u→ue.",
          en: "Many verbs change the stem vowel in every form EXCEPT nosotros/vosotros: e→ie, o→ue, e→i, u→ue.",
        },
        examples: [
          { es: "pensar → pienso", gloss: { de: "denken → ich denke", en: "to think → I think" }, note: { de: "e→ie", en: "e→ie" } },
          { es: "poder → puedo", gloss: { de: "können → ich kann", en: "to be able → I can" }, note: { de: "o→ue", en: "o→ue" } },
          { es: "pedir → pido", gloss: { de: "bitten → ich bitte", en: "to ask for → I ask", }, note: { de: "e→i", en: "e→i" } },
          { es: "jugar → juego", gloss: { de: "spielen → ich spiele", en: "to play → I play" }, note: { de: "u→ue", en: "u→ue" } },
        ],
      },
      {
        id: "yo-irregular",
        title: { de: "Unregelmäßige ich-Form", en: "Irregular yo-form" },
        body: {
          de: "Viele Verben sind nur in der ich-Form unregelmäßig (-go oder -zco), der Rest ist regelmäßig.",
          en: "Many verbs are irregular only in the yo-form (-go or -zco); the rest is regular.",
        },
        examples: [
          { es: "hacer → hago", gloss: { de: "machen → ich mache", en: "to do → I do" } },
          { es: "poner → pongo", gloss: { de: "stellen → ich stelle", en: "to put → I put" } },
          { es: "conocer → conozco", gloss: { de: "kennen → ich kenne", en: "to know → I know" } },
        ],
      },
      {
        id: "fully-irregular",
        title: { de: "Ganz unregelmäßige Verben", en: "Fully irregular verbs" },
        body: {
          de: "Die wichtigsten Verben sind komplett unregelmäßig – am besten auswendig lernen.",
          en: "The most important verbs are completely irregular – best learned by heart.",
        },
        examples: [
          { es: "ser → soy, eres, es, somos, sois, son", gloss: { de: "sein (Eigenschaft)", en: "to be (essence)" } },
          { es: "estar → estoy, estás, está …", gloss: { de: "sein (Zustand/Ort)", en: "to be (state/place)" } },
          { es: "ir → voy, vas, va, vamos, vais, van", gloss: { de: "gehen", en: "to go" } },
          { es: "tener → tengo, tienes, tiene …", gloss: { de: "haben", en: "to have" } },
        ],
      },
      {
        id: "use",
        title: { de: "Verwendung", en: "Usage" },
        body: {
          de: "Gewohnheiten, allgemeine Wahrheiten, aktuelle Zustände – und umgangssprachlich die nahe Zukunft.",
          en: "Habits, general truths, current states – and colloquially the near future.",
        },
        examples: [
          { es: "Todos los días estudio.", gloss: { de: "Jeden Tag lerne ich.", en: "Every day I study." } },
          { es: "El agua hierve a 100°.", gloss: { de: "Wasser kocht bei 100°.", en: "Water boils at 100°." } },
          { es: "Mañana trabajo.", gloss: { de: "Morgen arbeite ich.", en: "Tomorrow I work." }, note: { de: "nahe Zukunft", en: "near future" } },
        ],
      },
    ],
    endings: {
      label: { de: "Regelmäßige Endungen", en: "Regular endings" },
      ar: ["-o", "-as", "-a", "-amos", "-áis", "-an"],
      er: ["-o", "-es", "-e", "-emos", "-éis", "-en"],
      ir: ["-o", "-es", "-e", "-imos", "-ís", "-en"],
    },
    examples: [
      { es: "Hablo español.", gloss: { de: "Ich spreche Spanisch.", en: "I speak Spanish." } },
      { es: "¿Dónde vives?", gloss: { de: "Wo wohnst du?", en: "Where do you live?" } },
      { es: "Soy de Alemania.", gloss: { de: "Ich bin aus Deutschland.", en: "I'm from Germany." } },
    ],
    practiceTenseKey: "presente",
    available: true,
  },

  // --- listed but not yet authored (coming in later phases) ---
  stub("preterito-indefinido", "Indefinido (pretérito indefinido)", "Preterite (pretérito indefinido)", "Indikativ", "Indicative",
    "Abgeschlossene Handlungen in der Vergangenheit.", "Completed actions in the past."),
  stub("preterito-imperfecto", "Imperfekt (pretérito imperfecto)", "Imperfect (pretérito imperfecto)", "Indikativ", "Indicative",
    "Gewohnheiten und Beschreibungen in der Vergangenheit.", "Past habits and descriptions."),
  stub("preterito-perfecto", "Perfekt (pretérito perfecto)", "Present perfect (pretérito perfecto)", "Indikativ", "Indicative",
    "haber (Präsens) + Partizip; jüngste Vergangenheit.", "haber (present) + participle; recent past."),
  stub("pluscuamperfecto", "Plusquamperfekt", "Past perfect (pluscuamperfecto)", "Indikativ", "Indicative",
    "haber (Imperfekt) + Partizip; Vorvergangenheit.", "haber (imperfect) + participle; the past before the past."),
  stub("futuro", "Futur (futuro simple)", "Future (futuro simple)", "Indikativ", "Indicative",
    "Zukunft und Vermutungen.", "Future actions and conjecture."),
  stub("futuro-perfecto", "Futur II (futuro perfecto)", "Future perfect (futuro perfecto)", "Indikativ", "Indicative",
    "Was bis zu einem Zeitpunkt geschehen sein wird.", "What will have happened by a point in time."),
  stub("condicional", "Konditional (condicional simple)", "Conditional (condicional simple)", "Indikativ", "Indicative",
    "Höflichkeit, Hypothesen, Zukunft aus der Vergangenheit.", "Politeness, hypotheses, future-in-the-past."),
  stub("condicional-perfecto", "Konditional II (condicional perfecto)", "Conditional perfect", "Indikativ", "Indicative",
    "Was geschehen wäre.", "What would have happened."),
  stub("subjuntivo-presente", "Subjuntivo Präsens", "Present subjunctive", "Subjuntivo", "Subjunctive",
    "Wunsch, Zweifel, Gefühl, Notwendigkeit.", "Wishes, doubt, emotion, necessity."),
  stub("subjuntivo-perfecto", "Subjuntivo Perfekt", "Present perfect subjunctive", "Subjuntivo", "Subjunctive",
    "haya + Partizip im Konjunktiv.", "haya + participle in the subjunctive."),
  stub("subjuntivo-imperfecto", "Subjuntivo Imperfekt", "Imperfect subjunctive", "Subjuntivo", "Subjunctive",
    "Hypothesen und Höflichkeit in der Vergangenheit.", "Hypotheses and politeness in the past."),
  stub("subjuntivo-pluscuamperfecto", "Subjuntivo Plusquamperfekt", "Pluperfect subjunctive", "Subjuntivo", "Subjunctive",
    "hubiera + Partizip.", "hubiera + participle."),
  stub("imperativo", "Imperativ (imperativo)", "Imperative (imperativo)", "Imperativ", "Imperative",
    "Befehle und Aufforderungen (bejaht/verneint).", "Commands and requests (affirmative/negative)."),
  stub("gerundio", "Gerundium (gerundio)", "Gerund (gerundio)", "Infinite Form", "Non-finite",
    "-ando/-iendo; Verlaufsform mit estar.", "-ando/-iendo; progressive with estar."),
  stub("participio", "Partizip (participio)", "Past participle (participio)", "Infinite Form", "Non-finite",
    "-ado/-ido; für zusammengesetzte Zeiten.", "-ado/-ido; for compound tenses."),
];

export function getTense(id: string): TenseTopic | undefined {
  return zeitformen.find((t) => t.id === id);
}
