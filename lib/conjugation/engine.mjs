// @ts-check
/**
 * Spanish PRESENT-tense (presente de indicativo) conjugation engine.
 *
 * Written in plain ESM JavaScript on purpose: it is the single source of truth
 * imported BOTH by the Node build pipeline (scripts/build-data.mjs, to precompute
 * difficulty) AND by the TypeScript app at runtime (the conjugation trainer).
 *
 * Scope: presente only (the MVP tense). The public interface
 * (conjugate / analyze / difficultyTier) is designed so additional tenses can be
 * added later without changing call sites.
 *
 * Correctness strategy: explicit full forms for genuinely irregular verbs, rule
 * sets for the regular stem-change families, and plain regular endings otherwise.
 * `analyze().confident` marks whether we can guarantee the forms — the trainer
 * only ever quizzes confident verbs so it never teaches a wrong answer.
 */

/** Person order: yo, tú, él/ella/usted, nosotros, vosotros, ellos/ellas/ustedes */
export const PERSONS = ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos/ellas"];

const ENDINGS = {
  ar: ["o", "as", "a", "amos", "áis", "an"],
  er: ["o", "es", "e", "emos", "éis", "en"],
  ir: ["o", "es", "e", "imos", "ís", "en"],
};

/** Persons that take the stem change in the present tense (all but nosotros/vosotros). */
const STEM_PERSONS = new Set([0, 1, 2, 5]);

/** Fully/strongly irregular verbs: explicit six forms (highest precedence). */
const FULL_IRREGULAR = {
  ser: ["soy", "eres", "es", "somos", "sois", "son"],
  estar: ["estoy", "estás", "está", "estamos", "estáis", "están"],
  ir: ["voy", "vas", "va", "vamos", "vais", "van"],
  haber: ["he", "has", "ha", "hemos", "habéis", "han"],
  tener: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
  venir: ["vengo", "vienes", "viene", "venimos", "venís", "vienen"],
  decir: ["digo", "dices", "dice", "decimos", "decís", "dicen"],
  oír: ["oigo", "oyes", "oye", "oímos", "oís", "oyen"],
  oler: ["huelo", "hueles", "huele", "olemos", "oléis", "huelen"],
  ver: ["veo", "ves", "ve", "vemos", "veis", "ven"],
  dar: ["doy", "das", "da", "damos", "dais", "dan"],
  saber: ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
  caber: ["quepo", "cabes", "cabe", "cabemos", "cabéis", "caben"],
  valer: ["valgo", "vales", "vale", "valemos", "valéis", "valen"],
  hacer: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
  poner: ["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"],
  salir: ["salgo", "sales", "sale", "salimos", "salís", "salen"],
  traer: ["traigo", "traes", "trae", "traemos", "traéis", "traen"],
  caer: ["caigo", "caes", "cae", "caemos", "caéis", "caen"],
  seguir: ["sigo", "sigues", "sigue", "seguimos", "seguís", "siguen"],
  conseguir: ["consigo", "consigues", "consigue", "conseguimos", "conseguís", "consiguen"],
  reír: ["río", "ríes", "ríe", "reímos", "reís", "ríen"],
};

/** Suppletive verbs → top difficulty regardless of frequency. */
const SUPPLETIVE = new Set(["ser", "ir", "haber", "estar"]);

/** Stem-change families (applied to yo/tú/él/ellos for verbs not in FULL_IRREGULAR). */
const STEM_CHANGE = {
  e_ie: new Set([
    "pensar", "empezar", "comenzar", "entender", "perder", "querer", "cerrar",
    "sentar", "despertar", "calentar", "encender", "defender", "recomendar",
    "gobernar", "nevar", "preferir", "sentir", "mentir", "sugerir", "herir",
    "convertir", "divertir", "advertir", "atender", "encerrar", "negar", "fregar",
  ]),
  o_ue: new Set([
    "poder", "volver", "contar", "encontrar", "recordar", "mostrar", "costar",
    "dormir", "morir", "soñar", "mover", "doler", "llover", "resolver", "acordar",
    "almorzar", "probar", "devolver", "envolver", "volar", "rogar", "colgar",
    "demostrar", "aprobar", "acostar", "forzar",
  ]),
  e_i: new Set([
    "pedir", "servir", "repetir", "vestir", "medir", "despedir", "impedir",
    "corregir", "elegir", "competir", "freír", "sonreír",
  ]),
  u_ue: new Set(["jugar"]),
};

/** Verbs whose yo form is "-zco" (conocer→conozco), rest regular. */
const ZCO = new Set([
  "conocer", "reconocer", "parecer", "aparecer", "desaparecer", "ofrecer",
  "crecer", "nacer", "agradecer", "establecer", "pertenecer", "merecer",
  "obedecer", "permanecer", "conducir", "producir", "traducir", "reducir",
  "introducir", "lucir",
]);

/** @param {string} inf */
function ending(inf) {
  return inf.slice(-2);
}

/** @param {string} stem @param {"e_ie"|"o_ue"|"e_i"|"u_ue"} kind */
function applyStemChange(stem, kind) {
  const map = { e_ie: ["e", "ie"], o_ue: ["o", "ue"], e_i: ["e", "i"], u_ue: ["u", "ue"] };
  const [from, to] = map[kind];
  const idx = stem.lastIndexOf(from);
  if (idx === -1) return stem;
  return stem.slice(0, idx) + to + stem.slice(idx + 1);
}

/** @param {string} inf @returns {"e_ie"|"o_ue"|"e_i"|"u_ue"|null} */
function stemKind(inf) {
  for (const k of /** @type {const} */ (["e_ie", "o_ue", "e_i", "u_ue"])) {
    if (STEM_CHANGE[k].has(inf)) return k;
  }
  return null;
}

/** -uir verbs (construir, incluir, huir...) insert a "y" — but not -guir/-quir. */
function isUir(inf) {
  return inf.endsWith("uir") && !inf.endsWith("guir") && !inf.endsWith("quir");
}

/**
 * Conjugate a verb in the present indicative.
 * @param {string} infinitive
 * @returns {string[]|null} six forms, or null if the verb cannot be conjugated confidently
 */
export function conjugatePresentAll(infinitive) {
  const inf = infinitive.trim().toLowerCase();
  if (FULL_IRREGULAR[inf]) return FULL_IRREGULAR[inf].slice();

  const end = ending(inf);
  if (end !== "ar" && end !== "er" && end !== "ir") return null;
  const type = end;
  const stem = inf.slice(0, -2);
  const e = ENDINGS[type];

  if (isUir(inf)) {
    return e.map((suf, i) => (STEM_PERSONS.has(i) ? stem + "y" + suf : stem + suf));
  }

  if (ZCO.has(inf)) {
    const yo = stem.slice(0, -1) + "zco"; // conoc -> cono + zco
    return e.map((suf, i) => (i === 0 ? yo : stem + suf));
  }

  const kind = stemKind(inf);
  if (kind) {
    const changed = applyStemChange(stem, kind);
    return e.map((suf, i) => (STEM_PERSONS.has(i) ? changed + suf : stem + suf));
  }

  // Regular.
  return e.map((suf) => stem + suf);
}

/**
 * @param {string} infinitive
 * @param {number} person 0..5
 * @returns {string|null}
 */
export function conjugatePresent(infinitive, person) {
  const all = conjugatePresentAll(infinitive);
  return all ? all[person] : null;
}

/**
 * Classify a verb's irregularity and whether we can conjugate it confidently.
 * @param {string} infinitive
 * @returns {{ ending: "ar"|"er"|"ir"|null, irregularityScore: number, kind: string, confident: boolean }}
 */
export function analyze(infinitive) {
  const inf = infinitive.trim().toLowerCase();
  const end = ending(inf);
  const validEnding = end === "ar" || end === "er" || end === "ir";
  /** @type {"ar"|"er"|"ir"|null} */
  const e = validEnding ? /** @type {any} */ (end) : null;

  if (SUPPLETIVE.has(inf)) return { ending: e, irregularityScore: 5, kind: "suppletive", confident: true };
  if (FULL_IRREGULAR[inf]) {
    // -go / single-irregularity verbs are a bit easier than stem+irregular ones.
    const milder = new Set(["hacer", "poner", "salir", "traer", "caer", "valer", "ver", "dar", "saber", "caber"]);
    const score = milder.has(inf) ? 3 : 4;
    return { ending: e, irregularityScore: score, kind: "irregular", confident: true };
  }
  if (!validEnding) return { ending: null, irregularityScore: 0, kind: "non-verb", confident: false };
  if (isUir(inf)) return { ending: e, irregularityScore: 3, kind: "uir", confident: true };
  if (ZCO.has(inf)) return { ending: e, irregularityScore: 3, kind: "zco", confident: true };
  if (stemKind(inf)) return { ending: e, irregularityScore: 2, kind: "stem-change", confident: true };
  return { ending: e, irregularityScore: 0, kind: "regular", confident: true };
}

/**
 * Difficulty tier 1..4 combining irregularity and frequency rank.
 * @param {number} irregularityScore 0..5
 * @param {number} freqRank 1 = most common
 * @returns {1|2|3|4}
 */
export function difficultyTier(irregularityScore, freqRank) {
  // Difficulty is driven primarily by how hard the verb is to CONJUGATE
  // (irregularity); a regular verb conjugates the same whether common or rare.
  // Frequency only bumps genuinely rare verbs up one notch (you may not know them).
  let base = irregularityScore <= 0 ? 1 : irregularityScore <= 2 ? 2 : irregularityScore <= 3 ? 3 : 4;
  if (freqRank > 1500 && base < 4) base += 1;
  return /** @type {1|2|3|4} */ (Math.min(4, Math.max(1, base)));
}
