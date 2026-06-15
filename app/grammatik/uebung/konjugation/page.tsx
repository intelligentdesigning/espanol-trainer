"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConjugationTrainer } from "@/components/ConjugationTrainer";
import type { TenseKey } from "@/lib/types";

function Inner() {
  const sp = useSearchParams();
  const tense: TenseKey = sp.get("tense") === "imperfecto" ? "imperfecto" : "presente";
  return <ConjugationTrainer initialTense={tense} />;
}

export default function KonjugationPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
