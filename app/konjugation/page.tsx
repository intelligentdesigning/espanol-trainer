"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConjugationTrainer } from "@/components/ConjugationTrainer";
import { DeConjugationTrainer } from "@/components/DeConjugationTrainer";
import { useLang } from "@/lib/lang";
import { FORM_LABELS, type FormKey } from "@/lib/conjugation/trainer";

function Inner() {
  const sp = useSearchParams();
  const raw = sp.get("tense") ?? "";
  const tense: FormKey = (raw in FORM_LABELS ? raw : "presente") as FormKey;
  return <ConjugationTrainer initialTense={tense} />;
}

export default function KonjugationPage() {
  const { lang } = useLang();
  // German mode has its own A1 drill (present + perfect), not the Spanish engine
  if (lang === "de") return <DeConjugationTrainer />;
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
