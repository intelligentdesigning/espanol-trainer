"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuizRunner } from "@/components/QuizRunner";
import type { QuizConfig } from "@/lib/quiz";
import type { Pos } from "@/lib/types";

function Inner() {
  const sp = useSearchParams();
  const dir = sp.get("dir") === "en-es" ? "en-es" : "es-en";
  const mode = sp.get("mode") ?? "common";

  let config: QuizConfig;
  let modeId: string;
  if (mode === "verbs" || mode === "nouns" || mode === "adj") {
    const pos = (mode === "adj" ? "adj" : mode === "nouns" ? "noun" : "verb") as Pos;
    config = { pos, direction: dir, count: 20 };
    modeId = `${mode}-${dir}`;
  } else {
    config = { direction: dir, count: 20, freqWindow: [1, 200] };
    modeId = `common-${dir}`;
  }

  return <QuizRunner config={config} modeId={modeId} />;
}

export default function QuizPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
