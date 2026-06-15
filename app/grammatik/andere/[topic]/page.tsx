import { notFound } from "next/navigation";
import { topics, getTopic } from "@/content/topics";
import { TopicDetail } from "@/components/TopicDetail";

export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.id }));
}

export const dynamicParams = false;

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const data = getTopic(topic);
  if (!data) notFound();
  return <TopicDetail topic={data} />;
}
