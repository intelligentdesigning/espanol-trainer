import type { Pos, ProgressRecord, VocabItem } from "@/lib/types";

export type Direction = "es-en" | "en-es";
export type QuizScope = "smart" | "weak" | "new" | "all";

const MASTERED_BOX = 4; // keep in sync with lib/progress.ts

export interface QuizConfig {
  pos?: Pos | "all";
  direction: Direction;
  count: number;
  freqWindow?: [number, number];
  scope?: QuizScope; // default "smart"
}

export interface QuizQuestion {
  itemKey: string;
  id: string;           // vocab id (for the details/definition lookup)
  es: string;           // the Spanish word (shown in the context panels)
  prompt: string;       // what the learner sees
  accepted: string[];   // accepted answers (raw, accented)
  canonical: string;    // the "official" answer to display
}

// --- answer normalization (accent/case-insensitive, like the JetPunk rules) ---
// Strip leading articles (EN/ES/DE) and the EN infinitive marker "to".
const LEADING = /^(to|the|el|la|los|las|un|una|unos|unas|der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)\s+/;

export function normalize(s: string): string {
  let v = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;!?¿¡"'()]/g, "")
    .trim();
  // Strip leading articles repeatedly so "das der Kaffee" → "kaffee".
  let prev;
  do { prev = v; v = v.replace(LEADING, ""); } while (v !== prev);
  return v.trim();
}

/** Whole-word containment: every token in `needle` appears as a token in `hay`. */
function containsAllTokens(hay: string, needle: string): boolean {
  if (!needle) return false;
  const hayTokens = new Set(hay.split(" ").filter(Boolean));
  const needleTokens = needle.split(" ").filter(Boolean);
  if (!needleTokens.length || needleTokens.length > hayTokens.size) return false;
  return needleTokens.every((t) => hayTokens.has(t));
}

/**
 * A parenthetical is an *optional* clarifier, so "E-Mail(-Adresse)" should also
 * accept "E-Mail". Returns the original plus the version with "(...)" removed.
 */
function optionalVariants(answer: string): string[] {
  const stripped = answer.replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  return stripped && stripped !== answer ? [answer, stripped] : [answer];
}

/** Ignore spacing & hyphenation entirely: "E-Mail" = "Email" = "e mail". */
function squash(s: string): string {
  return normalize(s).replace(/[\s-]+/g, "");
}

const ARTICLE_WORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines",
]);
const VOWEL_END = /[aeiouáéíóúü]$/i;

/**
 * Expand the gender/alternative slash notation used in the glossary into every
 * acceptable surface form, e.g.
 *   "Kellner/in"     → Kellner, Kellnerin
 *   "camarero/-a"    → camarero, camarera
 *   "Herr/Frau"      → Herr, Frau
 *   "dein/e"         → dein, deine
 * Over-generation is fine — extra junk forms never match a real typed word; we
 * only need every legitimate form to be present.
 */
function slashTokenForms(tok: string): string[] {
  if (!tok.includes("/")) return [tok];
  const parts = tok.split("/").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return [tok];
  const base = parts[0];
  const out = new Set<string>([base]);
  for (const p of parts.slice(1)) {
    if (p.startsWith("-")) {
      const suf = p.slice(1);
      if (!suf) continue;
      out.add(base + suf); // append
      for (let k = 1; k <= Math.min(6, base.length - 1); k++) out.add(base.slice(0, -k) + suf); // replace tail
    } else {
      out.add(base + p); // suffix: Kellner+in, dein+e, profesor+a
      if (VOWEL_END.test(base)) out.add(base.slice(0, -1) + p); // este→est+a
      // full word / article alternative: Herr/Frau, Arzt/Ärztin, nosotros/nosotras
      if (p.length >= 4 || /^[A-ZÀ-Þ]/.test(p) || ARTICLE_WORDS.has(p.toLowerCase())) out.add(p);
    }
  }
  return [...out];
}

const isArticleGroup = (tok: string) => {
  const parts = tok.toLowerCase().split("/").filter(Boolean);
  return parts.length > 0 && parts.every((p) => ARTICLE_WORDS.has(p));
};

/** All surface forms of one phrase (cartesian over its slash tokens). */
function phraseForms(phrase: string): string[] {
  let tokens = phrase.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && isArticleGroup(tokens[0])) tokens = tokens.slice(1); // drop leading "el/la"
  let combos: string[] = [""];
  for (const tok of tokens) {
    const opts = slashTokenForms(tok);
    const next: string[] = [];
    for (const c of combos) for (const o of opts) next.push(c ? `${c} ${o}` : o);
    combos = next.slice(0, 240); // bound the explosion
  }
  return combos;
}

/** Every accepted surface form of a raw glossary answer (synonyms + slash + parens). */
function expandForms(raw: string): string[] {
  const out = new Set<string>();
  for (const altRaw of raw.split(/\s*[,;]\s*|\s+oder\s+/i)) {
    const alt = altRaw.trim();
    if (!alt) continue;
    for (const v of optionalVariants(alt)) {
      const clean = v.replace(/[?¿!¡…]+$/g, "").trim();
      for (const f of phraseForms(clean)) if (f) out.add(f);
    }
  }
  return out.size ? [...out] : [raw];
}

export function checkAnswer(input: string, accepted: string[]): boolean {
  const n = normalize(input);
  if (!n) return false;
  const nSquash = squash(input);
  for (const a of accepted) {
    for (const variant of expandForms(a)) {
      const na = normalize(variant);
      if (!na) continue;
      if (na === n) return true;
      // Lenient match: the correct answer is contained whole-word in the user's
      // answer (e.g. "das Kaffee" ⊇ "Kaffee"), or vice-versa.
      if (containsAllTokens(n, na) || containsAllTokens(na, n)) return true;
      // Spelling leniency: same word, just different spacing/hyphens.
      if (nSquash && nSquash === squash(variant)) return true;
    }
  }
  return false;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildSession(
  vocab: VocabItem[],
  config: QuizConfig,
  progress?: Map<string, ProgressRecord>,
): QuizQuestion[] {
  let pool = vocab;
  if (config.pos && config.pos !== "all") pool = pool.filter((v) => v.pos === config.pos);
  if (config.freqWindow) {
    const [lo, hi] = config.freqWindow;
    pool = pool.filter((v) => v.rank >= lo && v.rank <= hi);
  }

  let questions: QuizQuestion[];
  if (config.direction === "es-en") {
    questions = pool
      .filter((v) => v.en.length > 0)
      .map((v) => ({
        itemKey: `vocab:${v.id}`,
        id: v.id,
        es: v.es,
        prompt: v.es,
        accepted: v.en,
        canonical: v.en.join(" / "),
      }));
  } else {
    // EN -> ES: merge synonyms that share the same English clue.
    const byClue = new Map<string, VocabItem[]>();
    for (const v of pool) {
      const key = v.clue.toLowerCase();
      const list = byClue.get(key);
      if (list) list.push(v);
      else byClue.set(key, [v]);
    }
    questions = [...byClue.values()].map((items) => {
      items.sort((a, b) => a.rank - b.rank);
      return {
        itemKey: `vocab:${items[0].id}`,
        id: items[0].id,
        es: items[0].es,
        prompt: items[0].clue,
        accepted: items.map((i) => i.es),
        canonical: items.map((i) => i.es).join(" / "),
      };
    });
  }

  return orderByScope(questions, (q) => progress?.get(q.id), config.scope ?? "smart", config.count);
}

/**
 * Pick `count` items by mastery scope (reused by the vocab quiz AND the Buch trainer):
 * - all  = random
 * - new  = only unseen
 * - weak = only seen-but-not-mastered (wrong-last first); may return < count
 * - smart= new + weak first, due reviews, then mastered last (fades known items out)
 * `recOf` maps an item to its ProgressRecord (or undefined).
 */
export function orderByScope<T>(
  items: T[],
  recOf: (t: T) => ProgressRecord | undefined,
  scope: QuizScope,
  count: number,
): T[] {
  const seen = (q: T) => { const r = recOf(q); return !!r && r.seen > 0; };
  const mastered = (q: T) => { const r = recOf(q); return !!r && r.seen > 0 && r.box >= MASTERED_BOX; };
  const wrongLast = (q: T) => recOf(q)?.lastResult === "wrong";
  const due = (q: T) => { const r = recOf(q); return !!r && r.dueAt <= Date.now(); };

  if (scope === "all") return shuffle(items).slice(0, count);
  if (scope === "new") return shuffle(items.filter((q) => !seen(q))).slice(0, count);
  if (scope === "weak") {
    const weak = items.filter((q) => seen(q) && !mastered(q));
    return [...shuffle(weak.filter(wrongLast)), ...shuffle(weak.filter((q) => !wrongLast(q)))].slice(0, count);
  }
  const tier = (q: T) => {
    if (!seen(q)) return 0;
    if (!mastered(q)) { if (wrongLast(q)) return 1; if (due(q)) return 2; return 3; }
    return 4;
  };
  const ordered = shuffle(items);
  ordered.sort((a, b) => tier(a) - tier(b)); // stable sort → shuffled within each tier
  return ordered.slice(0, count);
}
