import { notFound } from "next/navigation";
import { zeitformen, getTense } from "@/content/zeitformen";
import { TenseDetail } from "@/components/TenseDetail";

export function generateStaticParams() {
  return zeitformen.map((t) => ({ tense: t.id }));
}

export const dynamicParams = false;

export default async function TensePage({ params }: { params: Promise<{ tense: string }> }) {
  const { tense } = await params;
  const topic = getTense(tense);
  if (!topic) notFound();
  return <TenseDetail topic={topic} />;
}
