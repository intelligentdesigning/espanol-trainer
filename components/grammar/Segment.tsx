import type { ReactNode } from "react";

/** One lesson segment: an anchored section with a clear, accented heading. */
export function Segment({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 space-y-3">
      <div className="flex items-baseline gap-2.5">
        <span className="h-5 w-1.5 shrink-0 rounded-full bg-brand" />
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
