// Grammar progression / gamification: best score per chapter (from sessions),
// pass at 90%, and a Spanish-flavoured rank/level derived from chapters passed.

import { topics } from "@/content/topics";
import { zeitformen } from "@/content/zeitformen";
import { getAllSessions } from "@/lib/storage/db";

export const PASS_PCT = 90;

export interface ChapterStat {
  id: string;
  bestPct: number;
  attempts: number;
  passed: boolean;
}

export interface GrammarProgress {
  byId: Map<string, ChapterStat>;
  passedCount: number;
  total: number;
  pct: number; // passed / total, 0..100
  level: number; // 1..7
  levelTitle: string; // Spanish rank
  nextTitle: string | null; // next rank title (null if maxed)
  nextAt: number | null; // passedCount needed for next rank
}

// Spanish ranks unlocked by number of chapters passed.
const RANKS = [
  { at: 0, title: "Principiante" },
  { at: 4, title: "Aprendiz" },
  { at: 10, title: "Estudiante" },
  { at: 18, title: "Intermedio" },
  { at: 28, title: "Avanzado" },
  { at: 36, title: "Experto" },
  { at: 40, title: "Maestro" },
];

export async function loadGrammarProgress(): Promise<GrammarProgress> {
  const sessions = await getAllSessions();
  const best = new Map<string, { pct: number; attempts: number }>();
  for (const s of sessions) {
    if (!s.mode.startsWith("grammar:") || s.total <= 0) continue;
    const id = s.mode.slice("grammar:".length);
    const pct = Math.round((s.correct / s.total) * 100);
    const cur = best.get(id) ?? { pct: 0, attempts: 0 };
    best.set(id, { pct: Math.max(cur.pct, pct), attempts: cur.attempts + 1 });
  }

  const chapterIds = [...topics.map((t) => t.id), ...zeitformen.filter((z) => z.available).map((z) => z.id)];
  const byId = new Map<string, ChapterStat>();
  let passedCount = 0;
  for (const id of chapterIds) {
    const b = best.get(id);
    const bestPct = b?.pct ?? 0;
    const passed = bestPct >= PASS_PCT;
    if (passed) passedCount++;
    byId.set(id, { id, bestPct, attempts: b?.attempts ?? 0, passed });
  }

  const total = chapterIds.length;
  let rankIdx = 0;
  for (let i = 0; i < RANKS.length; i++) if (passedCount >= RANKS[i].at) rankIdx = i;
  const next = RANKS[rankIdx + 1] ?? null;

  return {
    byId,
    passedCount,
    total,
    pct: total ? Math.round((passedCount / total) * 100) : 0,
    level: rankIdx + 1,
    levelTitle: RANKS[rankIdx].title,
    nextTitle: next ? next.title : null,
    nextAt: next ? next.at : null,
  };
}
