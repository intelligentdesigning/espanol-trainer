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

export function checkAnswer(input: string, accepted: string[]): boolean {
  const n = normalize(input);
  if (!n) return false;
  for (const a of accepted) {
    const na = normalize(a);
    if (!na) continue;
    if (na === n) return true;
    // Lenient match: the correct answer is contained whole-word in the user's
    // answer (e.g. "das Kaffee" ⊇ "Kaffee"), or vice-versa.
    if (containsAllTokens(n, na) || containsAllTokens(na, n)) return true;
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

  // --- scope: pick which questions to ask, based on per-word mastery ---------
  const scope = config.scope ?? "smart";
  const recOf = (q: QuizQuestion) => progress?.get(q.id);
  const seen = (q: QuizQuestion) => { const r = recOf(q); return !!r && r.seen > 0; };
  const mastered = (q: QuizQuestion) => { const r = recOf(q); return !!r && r.seen > 0 && r.box >= MASTERED_BOX; };
  const wrongLast = (q: QuizQuestion) => recOf(q)?.lastResult === "wrong";
  const due = (q: QuizQuestion) => { const r = recOf(q); return !!r && r.dueAt <= Date.now(); };

  if (scope === "all") return shuffle(questions).slice(0, config.count);
  if (scope === "new") return shuffle(questions.filter((q) => !seen(q))).slice(0, config.count);
  if (scope === "weak") {
    const weak = questions.filter((q) => seen(q) && !mastered(q));
    const wrong = shuffle(weak.filter(wrongLast));
    const rest = shuffle(weak.filter((q) => !wrongLast(q)));
    return [...wrong, ...rest].slice(0, config.count);
  }
  // smart (default): new + weak first, mastered last → known words fade out naturally.
  const tier = (q: QuizQuestion) => {
    if (!seen(q)) return 0;              // new material
    if (!mastered(q)) {
      if (wrongLast(q)) return 1;        // shaky, missed last time
      if (due(q)) return 2;             // due for review
      return 3;                          // still learning
    }
    return 4;                            // mastered — light reinforcement
  };
  const ordered = shuffle(questions);
  ordered.sort((a, b) => tier(a) - tier(b)); // stable sort → shuffled within each tier
  return ordered.slice(0, config.count);
}
