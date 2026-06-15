"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConjugationTrainer } from "@/components/ConjugationTrainer";
import { TENSE_LABELS } from "@/lib/conjugation/trainer";
import type { TenseKey } from "@/lib/types";

function Inner() {
  const sp = useSearchParams();
  const raw = sp.get("tense") ?? "";
  const tense: TenseKey = (raw in TENSE_LABELS ? raw : "presente") as TenseKey;
  return <ConjugationTrainer initialTense={tense} />;
}

export default function KonjugationPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
