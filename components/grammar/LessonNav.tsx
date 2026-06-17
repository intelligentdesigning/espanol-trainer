"use client";

import { useEffect, useState } from "react";

/** Sticky in-page jump nav: scrolls to a lesson segment, highlights the current one. */
export function LessonNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const i of items) {
      const el = document.getElementById(i.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [items]);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <nav className="sticky top-[53px] z-10 -mx-4 border-b border-border bg-background/85 px-4 py-2 backdrop-blur">
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((i) => (
          <button
            key={i.id}
            onClick={() => go(i.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              active === i.id ? "bg-brand text-white" : "text-muted hover:bg-foreground/5"
            }`}
          >
            {i.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
