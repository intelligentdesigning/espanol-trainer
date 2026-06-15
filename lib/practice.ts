import { normalize } from "@/lib/quiz";
import type { PracticeItem } from "@/lib/types";

/** Check a practice answer. Choice = exact option match; fill = accent/case-insensitive. */
export function checkPractice(item: PracticeItem, input: string): boolean {
  if (item.kind === "choice") {
    return input.trim().toLowerCase() === item.answer.trim().toLowerCase();
  }
  const accepted = [item.answer, ...(item.altAnswers ?? [])];
  const n = normalize(input);
  return !!n && accepted.some((a) => normalize(a) === n);
}
