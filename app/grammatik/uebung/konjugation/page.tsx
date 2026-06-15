"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConjugationTrainer } from "@/components/ConjugationTrainer";
import { FORM_LABELS, type FormKey } from "@/lib/conjugation/trainer";

function Inner() {
  const sp = useSearchParams();
  const raw = sp.get("tense") ?? "";
  const tense: FormKey = (raw in FORM_LABELS ? raw : "presente") as FormKey;
  return <ConjugationTrainer initialTense={tense} />;
}

export default function KonjugationPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
