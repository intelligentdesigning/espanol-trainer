import data from "@/content/topics.json";
import type { GrammarTopic } from "@/lib/types";

// Authored by the build-time workflow (author-grammar-topics): rules + examples +
// solvable practice, bilingual DE/EN.
export const topics = data as unknown as GrammarTopic[];

export function getTopic(id: string): GrammarTopic | undefined {
  return topics.find((t) => t.id === id);
}
