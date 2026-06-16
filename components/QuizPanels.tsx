"use client";

import { useI18n } from "@/lib/i18n/locale";
import { IconBook, IconBookOpen } from "@/components/icons";
import type { VocabDetail } from "@/lib/types";

// One context panel (Definition / Beispiel): Spanish on top, translation below.
function ContextPanel({
  label, accent, es, tr, revealed, hint, Icon,
}: {
  label: string; accent: string; es?: string; tr?: string;
  revealed: boolean; hint: string; Icon: (p: { className?: string }) => React.ReactElement;
}) {
  return (
    <aside className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${revealed ? "block" : "hidden xl:block"}`}>
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${accent}`}>
        <Icon className="h-4 w-4" /> {label}
      </div>
      {revealed && es ? (
        <div className="mt-2.5 animate-[fadeIn_.25s_ease]">
          <p className="text-[15px] font-medium leading-snug text-foreground" lang="es">{es}</p>
          {tr && <p className="mt-1 text-sm leading-snug text-muted">{tr}</p>}
        </div>
      ) : (
        <p className="mt-2.5 text-sm leading-snug text-muted/70">{hint}</p>
      )}
    </aside>
  );
}

/**
 * Wraps a quiz's center column with Definition (left) + Beispiel (right) panels.
 * - `enabled` false  → plain centered column (no details available).
 * - large screens    → full-bleed 3-column grid flanking the center.
 * - small screens    → center first, then the panels stacked below (after answering).
 */
export function QuizWithPanels({
  detail, answered, enabled, children,
}: {
  detail?: VocabDetail;
  answered: boolean;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const { t, locale } = useI18n();
  const tr = (de: string, en: string) => (locale === "de" ? de : en);

  if (!enabled) return <div className="mx-auto max-w-md">{children}</div>;

  const definition = (
    <ContextPanel
      label={t("quiz.definition")} accent="text-vocab" Icon={IconBook}
      revealed={answered} hint={t("quiz.revealHint")}
      es={detail?.defEs} tr={detail ? tr(detail.defDe, detail.defEn) : undefined}
    />
  );
  const example = (
    <ContextPanel
      label={t("quiz.example")} accent="text-brand-2" Icon={IconBookOpen}
      revealed={answered} hint={t("quiz.revealHint")}
      es={detail?.exEs} tr={detail ? tr(detail.exDe, detail.exEn) : undefined}
    />
  );

  return (
    <div className="mx-auto max-w-md xl:mx-[calc(50%-50vw)] xl:w-screen xl:max-w-none xl:px-6">
      <div className="flex flex-col gap-5 xl:mx-auto xl:grid xl:max-w-6xl xl:grid-cols-[minmax(0,1fr)_30rem_minmax(0,1fr)] xl:items-start xl:gap-6">
        <div className="order-2 xl:order-none xl:pt-16">{definition}</div>
        <div className="order-1 xl:order-none">{children}</div>
        <div className="order-3 xl:order-none xl:pt-16">{example}</div>
      </div>
    </div>
  );
}
