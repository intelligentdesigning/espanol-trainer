"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuizRunner } from "@/components/QuizRunner";
import type { QuizConfig, QuizScope } from "@/lib/quiz";
import type { Pos, Cefr } from "@/lib/types";

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];

const DIFF_WINDOW: Record<string, [number, number] | undefined> = {
  easy: [1, 400],
  medium: [401, 1000],
  hard: [1001, 999999],
  all: undefined,
};
const COUNTS = [10, 20, 30, 50];
const SCOPES: QuizScope[] = ["smart", "weak", "new", "all"];

function Inner() {
  const sp = useSearchParams();
  const dir = sp.get("dir") === "en-es" ? "en-es" : "es-en";
  const mode = sp.get("mode") ?? "common";
  const diff = sp.get("diff") ?? "easy";
  const freqWindow = diff in DIFF_WINDOW ? DIFF_WINDOW[diff] : DIFF_WINDOW.easy;
  const rawCount = Number(sp.get("count"));
  const count = COUNTS.includes(rawCount) ? rawCount : 20;
  const scopeParam = sp.get("scope") ?? "";
  const scope: QuizScope = SCOPES.includes(scopeParam as QuizScope) ? (scopeParam as QuizScope) : "smart";
  const levelParam = sp.get("level") ?? "";
  const level = (CEFR.includes(levelParam) ? levelParam : "all") as Cefr | "all";

  let config: QuizConfig;
  if (mode === "verbs" || mode === "nouns" || mode === "adj") {
    const pos = (mode === "adj" ? "adj" : mode === "nouns" ? "noun" : "verb") as Pos;
    config = { pos, direction: dir, count, freqWindow, scope, level };
  } else {
    config = { direction: dir, count, freqWindow, scope, level };
  }
  const modeId = `${mode}-${dir}-${diff}-${scope}-${level}-${count}`;

  return <QuizRunner config={config} modeId={modeId} />;
}

export default function QuizPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
