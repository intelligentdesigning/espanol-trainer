// German A1 conjugation: present tense (6 persons) + perfect (haben/sein + Partizip II).
// Regular forms are generated; the A1 irregulars are listed explicitly.

export const DE_PERSONS = ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"];

export interface DeVerb {
  inf: string;
  en: string;
  /** present tense, 6 forms — filled in by conjugateDe() when not listed */
  present?: string[];
  /** Partizip II, e.g. "gemacht" / "gegangen" */
  pp: string;
  /** perfect auxiliary */
  aux: "haben" | "sein";
  tier: 1 | 2 | 3;       // 1 = most common
  irregular?: boolean;
}

/** Regular present tense from the infinitive (handles -eln/-ern, d/t stems, s/ß/z stems). */
export function regularPresent(inf: string): string[] {
  const stem = inf.replace(/e?[nm]$/, "");            // machen → mach, sammeln → sammel
  const needsE = /[dt]$/.test(stem) || /[mn]$/.test(stem) && !/[aeiouäöü][mn]$/.test(stem);
  const e = needsE ? "e" : "";
  const duEnd = /[sßxz]$/.test(stem) ? "t" : `${e}st`;  // heißen → du heißt
  return [
    `${stem}e`,
    `${stem}${duEnd}`,
    `${stem}${e}t`,
    inf,
    `${stem}${e}t`,
    inf,
  ];
}

/** The A1 verb set. Irregular presents are spelled out; the rest are generated. */
export const DE_VERBS: DeVerb[] = [
  { inf: "sein", en: "to be", present: ["bin", "bist", "ist", "sind", "seid", "sind"], pp: "gewesen", aux: "sein", tier: 1, irregular: true },
  { inf: "haben", en: "to have", present: ["habe", "hast", "hat", "haben", "habt", "haben"], pp: "gehabt", aux: "haben", tier: 1, irregular: true },
  { inf: "werden", en: "to become", present: ["werde", "wirst", "wird", "werden", "werdet", "werden"], pp: "geworden", aux: "sein", tier: 1, irregular: true },
  { inf: "können", en: "can, to be able to", present: ["kann", "kannst", "kann", "können", "könnt", "können"], pp: "gekonnt", aux: "haben", tier: 1, irregular: true },
  { inf: "müssen", en: "must, to have to", present: ["muss", "musst", "muss", "müssen", "müsst", "müssen"], pp: "gemusst", aux: "haben", tier: 1, irregular: true },
  { inf: "wollen", en: "to want", present: ["will", "willst", "will", "wollen", "wollt", "wollen"], pp: "gewollt", aux: "haben", tier: 1, irregular: true },
  { inf: "dürfen", en: "may, to be allowed", present: ["darf", "darfst", "darf", "dürfen", "dürft", "dürfen"], pp: "gedurft", aux: "haben", tier: 2, irregular: true },
  { inf: "mögen", en: "to like", present: ["mag", "magst", "mag", "mögen", "mögt", "mögen"], pp: "gemocht", aux: "haben", tier: 2, irregular: true },
  { inf: "sollen", en: "should, ought to", present: ["soll", "sollst", "soll", "sollen", "sollt", "sollen"], pp: "gesollt", aux: "haben", tier: 2, irregular: true },
  { inf: "wissen", en: "to know (a fact)", present: ["weiß", "weißt", "weiß", "wissen", "wisst", "wissen"], pp: "gewusst", aux: "haben", tier: 2, irregular: true },

  // vowel-changing strong verbs (A1 core)
  { inf: "fahren", en: "to drive, to go", present: ["fahre", "fährst", "fährt", "fahren", "fahrt", "fahren"], pp: "gefahren", aux: "sein", tier: 1, irregular: true },
  { inf: "schlafen", en: "to sleep", present: ["schlafe", "schläfst", "schläft", "schlafen", "schlaft", "schlafen"], pp: "geschlafen", aux: "haben", tier: 2, irregular: true },
  { inf: "laufen", en: "to run, to walk", present: ["laufe", "läufst", "läuft", "laufen", "lauft", "laufen"], pp: "gelaufen", aux: "sein", tier: 2, irregular: true },
  { inf: "tragen", en: "to carry, to wear", present: ["trage", "trägst", "trägt", "tragen", "tragt", "tragen"], pp: "getragen", aux: "haben", tier: 2, irregular: true },
  { inf: "essen", en: "to eat", present: ["esse", "isst", "isst", "essen", "esst", "essen"], pp: "gegessen", aux: "haben", tier: 1, irregular: true },
  { inf: "geben", en: "to give", present: ["gebe", "gibst", "gibt", "geben", "gebt", "geben"], pp: "gegeben", aux: "haben", tier: 1, irregular: true },
  { inf: "nehmen", en: "to take", present: ["nehme", "nimmst", "nimmt", "nehmen", "nehmt", "nehmen"], pp: "genommen", aux: "haben", tier: 1, irregular: true },
  { inf: "sprechen", en: "to speak", present: ["spreche", "sprichst", "spricht", "sprechen", "sprecht", "sprechen"], pp: "gesprochen", aux: "haben", tier: 1, irregular: true },
  { inf: "sehen", en: "to see", present: ["sehe", "siehst", "sieht", "sehen", "seht", "sehen"], pp: "gesehen", aux: "haben", tier: 1, irregular: true },
  { inf: "lesen", en: "to read", present: ["lese", "liest", "liest", "lesen", "lest", "lesen"], pp: "gelesen", aux: "haben", tier: 1, irregular: true },
  { inf: "helfen", en: "to help", present: ["helfe", "hilfst", "hilft", "helfen", "helft", "helfen"], pp: "geholfen", aux: "haben", tier: 2, irregular: true },
  { inf: "treffen", en: "to meet", present: ["treffe", "triffst", "trifft", "treffen", "trefft", "treffen"], pp: "getroffen", aux: "haben", tier: 2, irregular: true },
  { inf: "vergessen", en: "to forget", present: ["vergesse", "vergisst", "vergisst", "vergessen", "vergesst", "vergessen"], pp: "vergessen", aux: "haben", tier: 3, irregular: true },

  // strong verbs without vowel change in the present
  { inf: "gehen", en: "to go", pp: "gegangen", aux: "sein", tier: 1, irregular: true },
  { inf: "kommen", en: "to come", pp: "gekommen", aux: "sein", tier: 1, irregular: true },
  { inf: "trinken", en: "to drink", pp: "getrunken", aux: "haben", tier: 1, irregular: true },
  { inf: "schreiben", en: "to write", pp: "geschrieben", aux: "haben", tier: 1, irregular: true },
  { inf: "bleiben", en: "to stay", pp: "geblieben", aux: "sein", tier: 2, irregular: true },
  { inf: "finden", en: "to find", pp: "gefunden", aux: "haben", tier: 1, irregular: true },
  { inf: "trinken", en: "to drink", pp: "getrunken", aux: "haben", tier: 1, irregular: true },
  { inf: "singen", en: "to sing", pp: "gesungen", aux: "haben", tier: 3, irregular: true },
  { inf: "schwimmen", en: "to swim", pp: "geschwommen", aux: "sein", tier: 3, irregular: true },
  { inf: "verstehen", en: "to understand", pp: "verstanden", aux: "haben", tier: 1, irregular: true },
  { inf: "beginnen", en: "to begin", pp: "begonnen", aux: "haben", tier: 3, irregular: true },
  { inf: "heißen", en: "to be called", pp: "geheißen", aux: "haben", tier: 1, irregular: true },

  // regular verbs (present generated)
  { inf: "machen", en: "to do, to make", pp: "gemacht", aux: "haben", tier: 1 },
  { inf: "lernen", en: "to learn", pp: "gelernt", aux: "haben", tier: 1 },
  { inf: "wohnen", en: "to live, to reside", pp: "gewohnt", aux: "haben", tier: 1 },
  { inf: "spielen", en: "to play", pp: "gespielt", aux: "haben", tier: 1 },
  { inf: "sagen", en: "to say", pp: "gesagt", aux: "haben", tier: 1 },
  { inf: "fragen", en: "to ask", pp: "gefragt", aux: "haben", tier: 1 },
  { inf: "kaufen", en: "to buy", pp: "gekauft", aux: "haben", tier: 1 },
  { inf: "kochen", en: "to cook", pp: "gekocht", aux: "haben", tier: 2 },
  { inf: "hören", en: "to hear, to listen", pp: "gehört", aux: "haben", tier: 1 },
  { inf: "lieben", en: "to love", pp: "geliebt", aux: "haben", tier: 2 },
  { inf: "brauchen", en: "to need", pp: "gebraucht", aux: "haben", tier: 1 },
  { inf: "suchen", en: "to look for", pp: "gesucht", aux: "haben", tier: 2 },
  { inf: "danken", en: "to thank", pp: "gedankt", aux: "haben", tier: 3 },
  { inf: "arbeiten", en: "to work", pp: "gearbeitet", aux: "haben", tier: 1 },
  { inf: "warten", en: "to wait", pp: "gewartet", aux: "haben", tier: 2 },
  { inf: "kosten", en: "to cost", pp: "gekostet", aux: "haben", tier: 2 },
  { inf: "öffnen", en: "to open", pp: "geöffnet", aux: "haben", tier: 3 },
  { inf: "reisen", en: "to travel", pp: "gereist", aux: "sein", tier: 2 },
  { inf: "tanzen", en: "to dance", pp: "getanzt", aux: "haben", tier: 3 },
  { inf: "lachen", en: "to laugh", pp: "gelacht", aux: "haben", tier: 3 },
  { inf: "wandern", en: "to hike", pp: "gewandert", aux: "sein", tier: 3 },
  { inf: "studieren", en: "to study", pp: "studiert", aux: "haben", tier: 2 },
  { inf: "telefonieren", en: "to phone", pp: "telefoniert", aux: "haben", tier: 2 },
  { inf: "besuchen", en: "to visit", pp: "besucht", aux: "haben", tier: 2 },
  { inf: "bezahlen", en: "to pay", pp: "bezahlt", aux: "haben", tier: 2 },
  { inf: "erklären", en: "to explain", pp: "erklärt", aux: "haben", tier: 3 },
];

export type DeFormKey = "praesens" | "perfekt";

export const DE_FORM_LABELS: Record<DeFormKey, string> = {
  praesens: "Präsens",
  perfekt: "Perfekt",
};

/** The six present-tense forms of a verb. */
export function presentOf(v: DeVerb): string[] {
  return v.present ?? regularPresent(v.inf);
}

/** Perfect tense for one person, e.g. "ich habe gemacht" / "du bist gegangen". */
export function perfectOf(v: DeVerb, person: number): string {
  const habenF = ["habe", "hast", "hat", "haben", "habt", "haben"];
  const seinF = ["bin", "bist", "ist", "sind", "seid", "sind"];
  const aux = v.aux === "sein" ? seinF[person] : habenF[person];
  return `${aux} ${v.pp}`;
}

/** Expected answer for a drill question (person 0..5). */
export function conjugateDe(v: DeVerb, form: DeFormKey, person: number): string {
  return form === "praesens" ? presentOf(v)[person] : perfectOf(v, person);
}

/** Accept the typed answer: case-insensitive, tolerant of ß/ss and extra spaces,
 *  and the pronoun may be typed along ("ich habe gemacht" for "habe gemacht"). */
export function checkDeConjugation(input: string, expected: string, person: number): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/ß/g, "ss").replace(/\s+/g, " ").trim();
  const got = norm(input);
  const want = norm(expected);
  if (got === want) return true;
  const pron = norm(DE_PERSONS[person].split("/")[0]);
  return got === `${pron} ${want}` || got.replace(/^(ich|du|er|sie|es|wir|ihr)\s+/, "") === want;
}
