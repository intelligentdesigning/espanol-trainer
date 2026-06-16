// Mastery model derived from the Leitner `box` that recordResult() already tracks.
// Joins per-word progress (IndexedDB) with the vocab list to report, per category,
// how much the learner "can" already. Reuses loadVocab + getAllProgress — no dupes.

import { loadVocab } from "@/lib/data";
import { getAllProgress } from "@/lib/storage/db";
import type { ProgressRecord, VocabItem } from "@/lib/types";

/** box ∈ 0..5 (recordResult: +1 per correct, −1 per wrong). Reaching 4 = "mastered". */
export const MASTERED_BOX = 4;

export type Mastery = "new" | "learning" | "mastered";
export type CatId = "common" | "verbs" | "nouns" | "adj";

export function masteryOf(rec?: ProgressRecord): Mastery {
  if (!rec || rec.seen === 0) return "new";
  if (rec.box >= MASTERED_BOX) return "mastered";
  return "learning";
}

export interface CatProgress {
  total: number;
  seen: number;
  mastered: number;
  learning: number;
  new: number;
  accuracy: number;    // 0..100 over answered questions in this category
  masteredPct: number; // 0..100 = mastered / total
}

export interface MasterySnapshot {
  byCat: Record<CatId, CatProgress>;
  overall: CatProgress;             // = common (all vocab)
  records: Map<string, ProgressRecord>; // keyed by vocab id (NOT itemKey)
}

function computeCat(items: VocabItem[], records: Map<string, ProgressRecord>): CatProgress {
  const c: CatProgress = { total: items.length, seen: 0, mastered: 0, learning: 0, new: 0, accuracy: 0, masteredPct: 0 };
  let correct = 0;
  let answered = 0;
  for (const v of items) {
    const rec = records.get(v.id);
    const m = masteryOf(rec);
    if (m === "mastered") c.mastered++;
    else if (m === "learning") c.learning++;
    else c.new++;
    if (rec && rec.seen > 0) { c.seen++; correct += rec.correct; answered += rec.seen; }
  }
  c.accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  c.masteredPct = c.total ? Math.round((c.mastered / c.total) * 100) : 0;
  return c;
}

export async function loadMastery(): Promise<MasterySnapshot> {
  const [vocab, progress] = await Promise.all([loadVocab(), getAllProgress()]);
  // Only the representative id of an en-es synonym group ever gets a record; that's fine —
  // it's the most frequent member, so mastery is tracked on the word worth tracking.
  const records = new Map<string, ProgressRecord>();
  for (const r of progress) if (r.kind === "vocab") records.set(r.itemKey.slice("vocab:".length), r);
  const byCat: Record<CatId, CatProgress> = {
    common: computeCat(vocab, records),
    verbs: computeCat(vocab.filter((v) => v.pos === "verb"), records),
    nouns: computeCat(vocab.filter((v) => v.pos === "noun"), records),
    adj: computeCat(vocab.filter((v) => v.pos === "adj"), records),
  };
  return { byCat, overall: byCat.common, records };
}
