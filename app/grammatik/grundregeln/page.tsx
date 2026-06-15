"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { RuleList } from "@/components/RuleList";
import { grundregeln } from "@/content/grundregeln";

export default function GrundregelnPage() {
  const { L, t } = useI18n();
  return (
    <div className="space-y-5">
      <Link href="/grammatik" className="text-sm text-muted hover:text-foreground">← {t("nav.grammar")}</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{L(grundregeln.title)}</h1>
        {grundregeln.intro && <p className="mt-1 text-muted">{L(grundregeln.intro)}</p>}
      </div>
      <RuleList rules={grundregeln.rules} />
    </div>
  );
}
