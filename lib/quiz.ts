import type { Pos, VocabItem } from "@/lib/types";

export type Direction = "es-en" | "en-es";

export interface QuizConfig {
  pos?: Pos | "all";
  direction: Direction;
  count: number;
  freqWindow?: [number, number];
}

export interface QuizQuestion {
  itemKey: string;
  prompt: string;       // what the learner sees
  accepted: string[];   // accepted answers (raw, accented)
  canonical: string;    // the "official" answer to display
}

// --- answer normalization (accent/case-insensitive, like the JetPunk rules) ---
const LEADING = /^(to|the|el|la|los|las|un|una|unos|unas)\s+/;

export function normalize(s: string): string {
  let v = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;!?¿¡"'()]/g, "")
    .trim();
  v = v.replace(LEADING, "");
  return v.trim();
}

export function checkAnswer(input: string, accepted: string[]): boolean {
  const n = normalize(input);
  if (!n) return false;
  return accepted.some((a) => normalize(a) === n);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildSession(vocab: VocabItem[], config: QuizConfig): QuizQuestion[] {
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
        prompt: items[0].clue,
        accepted: items.map((i) => i.es),
        canonical: items.map((i) => i.es).join(" / "),
      };
    });
  }

  return shuffle(questions).slice(0, config.count);
}
