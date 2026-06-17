// Mastery model for the coursebook vocabulary (Buch-Trainer), per Lektion.
// Mirrors lib/progress.ts but groups by Lektion. Progress keyed `buch:<keyOf(es)>`.

import { loadBuch } from "@/lib/data";
import { getAllProgress } from "@/lib/storage/db";
import { masteryOf } from "@/lib/progress";
import type { ProgressRecord } from "@/lib/types";

export const buchKeyOf = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export interface LektionStat {
  name: string;
  total: number;
  mastered: number;
  learning: number;
  new: number;
  right: number;       // last answer was correct
  wrong: number;       // last answer was wrong
  masteredPct: number;
}

export interface BuchMastery {
  byLektion: Map<string, LektionStat>;
  overall: LektionStat;
  records: Map<string, ProgressRecord>; // keyed by keyOf(es)
}

const empty = (name: string): LektionStat => ({ name, total: 0, mastered: 0, learning: 0, new: 0, right: 0, wrong: 0, masteredPct: 0 });

export async function loadBuchMastery(): Promise<BuchMastery> {
  const [buch, progress] = await Promise.all([loadBuch(), getAllProgress()]);
  const records = new Map<string, ProgressRecord>();
  for (const r of progress) if (r.kind === "vocab" && r.itemKey.startsWith("buch:")) records.set(r.itemKey.slice(5), r);

  const byLektion = new Map<string, LektionStat>();
  const overall = empty("__all__");
  for (const e of buch.entries) {
    let s = byLektion.get(e.lektion);
    if (!s) { s = empty(e.lektion); byLektion.set(e.lektion, s); }
    const rec = records.get(buchKeyOf(e.es));
    const m = masteryOf(rec);
    s.total++; overall.total++;
    if (m === "mastered") { s.mastered++; overall.mastered++; }
    else if (m === "learning") { s.learning++; overall.learning++; }
    else { s.new++; overall.new++; }
    if (rec && rec.seen > 0) {
      if (rec.lastResult === "right") { s.right++; overall.right++; }
      else { s.wrong++; overall.wrong++; }
    }
  }
  for (const s of [...byLektion.values(), overall]) s.masteredPct = s.total ? Math.round((s.mastered / s.total) * 100) : 0;
  return { byLektion, overall, records };
}
