"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuizRunner } from "@/components/QuizRunner";
import type { QuizConfig } from "@/lib/quiz";
import type { Pos } from "@/lib/types";

const DIFF_WINDOW: Record<string, [number, number] | undefined> = {
  easy: [1, 400],
  medium: [401, 1000],
  hard: [1001, 999999],
  all: undefined,
};

function Inner() {
  const sp = useSearchParams();
  const dir = sp.get("dir") === "en-es" ? "en-es" : "es-en";
  const mode = sp.get("mode") ?? "common";
  const diff = sp.get("diff") ?? "easy";
  const freqWindow = diff in DIFF_WINDOW ? DIFF_WINDOW[diff] : DIFF_WINDOW.easy;

  let config: QuizConfig;
  if (mode === "verbs" || mode === "nouns" || mode === "adj") {
    const pos = (mode === "adj" ? "adj" : mode === "nouns" ? "noun" : "verb") as Pos;
    config = { pos, direction: dir, count: 20, freqWindow };
  } else {
    config = { direction: dir, count: 20, freqWindow };
  }
  const modeId = `${mode}-${dir}-${diff}`;

  return <QuizRunner config={config} modeId={modeId} />;
}

export default function QuizPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
