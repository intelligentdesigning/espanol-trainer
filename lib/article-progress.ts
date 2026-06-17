// Progress for the article (gender) trainer: counts over the noun set, keyed
// by `art:<es>` records. Mirrors the buch/vocab mastery shape.

import { loadArticles } from "@/lib/data";
import { getAllProgress } from "@/lib/storage/db";
import { masteryOf } from "@/lib/progress";

export interface ArticleProgress {
  total: number;
  right: number;   // last answer correct
  wrong: number;   // last answer wrong
  new: number;     // not yet tried
  mastered: number; // box >= 4
  masteredPct: number;
}

export async function loadArticleProgress(): Promise<ArticleProgress> {
  const [arts, prog] = await Promise.all([loadArticles(), getAllProgress()]);
  const rec = new Map<string, (typeof prog)[number]>();
  for (const r of prog) if (r.itemKey.startsWith("art:")) rec.set(r.itemKey.slice("art:".length), r);
  const p: ArticleProgress = { total: arts.length, right: 0, wrong: 0, new: 0, mastered: 0, masteredPct: 0 };
  for (const a of arts) {
    const r = rec.get(a.es);
    if (!r || r.seen === 0) { p.new++; continue; }
    if (r.lastResult === "right") p.right++; else p.wrong++;
    if (masteryOf(r) === "mastered") p.mastered++;
  }
  p.masteredPct = p.total ? Math.round((p.mastered / p.total) * 100) : 0;
  return p;
}
