import data from "@/content/tenses.json";
import type { TenseTopic } from "@/lib/types";

// Content authored by the build-time workflow (author-tense-content), grounded in
// library-correct forms; endings tables injected from the conjugation engine.
// Regenerate: node scripts/_ref.mjs && node scripts/_assemble-tenses.mjs
export const zeitformen = data as unknown as TenseTopic[];

export function getTense(id: string): TenseTopic | undefined {
  return zeitformen.find((t) => t.id === id);
}
