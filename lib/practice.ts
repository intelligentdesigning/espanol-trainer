import { normalize } from "@/lib/quiz";
import type { PracticeItem } from "@/lib/types";

/** Check a practice answer. Choice = EXACT option match (case/accent matter — many
 *  questions are *about* capitalization or accents); fill = accent/case-insensitive. */
export function checkPractice(item: PracticeItem, input: string): boolean {
  if (item.kind === "choice") {
    return input.trim() === item.answer.trim();
  }
  const accepted = [item.answer, ...(item.altAnswers ?? [])];
  const n = normalize(input);
  return !!n && accepted.some((a) => normalize(a) === n);
}
