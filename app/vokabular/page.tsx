"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale";
import { loadVocab } from "@/lib/data";
import { loadMastery, type MasterySnapshot } from "@/lib/progress";
import { loadArticleProgress, type ArticleProgress } from "@/lib/article-progress";
import type { QuizScope } from "@/lib/quiz";
import type { Pos, VocabItem } from "@/lib/types";
import {
  IconCards,
  IconConjugate,
  IconShapes,
  IconLetters,
  IconArrowRight,
  IconHash,
} from "@/components/icons";
import { MasteryBar } from "@/components/MasteryBar";

type CatId = "common" | "verbs" | "nouns" | "adj";
type BandId = "easy" | "medium" | "hard" | "all";

const FOCI: QuizScope[] = ["smart", "weak", "new"];
const COUNTS = [10, 20, 30, 50];

const CATS: {
  id: CatId;
  pos: Pos | null;
  Icon: (p: { className?: string }) => React.ReactElement;
  // static class bundles (Tailwind JIT needs literal strings)
  text: string;
  bg: string;
  border: string;
  dot: string;
  hoverText: string;
  hoverBorder: string;
  ring: string;
}[] = [
  { id: "common", pos: null, Icon: IconCards, text: "text-common", bg: "bg-common/10", border: "border-common/30", dot: "bg-common", hoverText: "group-hover:text-common", hoverBorder: "hover:border-common/60", ring: "focus-visible:ring-common/50" },
  { id: "verbs", pos: "verb", Icon: IconConjugate, text: "text-verb", bg: "bg-verb/10", border: "border-verb/30", dot: "bg-verb", hoverText: "group-hover:text-verb", hoverBorder: "hover:border-verb/60", ring: "focus-visible:ring-verb/50" },
  { id: "nouns", pos: "noun", Icon: IconShapes, text: "text-noun", bg: "bg-noun/10", border: "border-noun/30", dot: "bg-noun", hoverText: "group-hover:text-noun", hoverBorder: "hover:border-noun/60", ring: "focus-visible:ring-noun/50" },
  { id: "adj", pos: "adj", Icon: IconLetters, text: "text-adj", bg: "bg-adj/10", border: "border-adj/30", dot: "bg-adj", hoverText: "group-hover:text-adj", hoverBorder: "hover:border-adj/60", ring: "focus-visible:ring-adj/50" },
];

const BANDS: { id: BandId; window: [number, number] | null }[] = [
  { id: "easy", window: [1, 400] },
  { id: "medium", window: [401, 1000] },
  { id: "hard", window: [1001, 999999] },
  { id: "all", window: null },
];

const inBand = (v: VocabItem, w: [number, number] | null) =>
  !w || (v.rank >= w[0] && v.rank <= w[1]);

export default function VokabularPage() {
  const { t } = useI18n();
  const [vocab, setVocab] = useState<VocabItem[] | null>(null);
  const [snap, setSnap] = useState<MasterySnapshot | null>(null);
  const [artProg, setArtProg] = useState<ArticleProgress | null>(null);
  const [cat, setCat] = useState<CatId | null>(null);
  const [band, setBand] = useState<BandId>("easy");
  const [scope, setScope] = useState<QuizScope>("smart");
  const [count, setCount] = useState(20);

  useEffect(() => {
    loadVocab().then(setVocab);
    loadMastery().then(setSnap);
    loadArticleProgress().then(setArtProg);
  }, []);

  // counts per category, and per band within the selected category
  const catCounts = useMemo(() => {
    const m: Record<CatId, number> = { common: 0, verbs: 0, nouns: 0, adj: 0 };
    if (!vocab) return m;
    for (const c of CATS) m[c.id] = c.pos ? vocab.filter((v) => v.pos === c.pos).length : vocab.length;
    return m;
  }, [vocab]);

  const bandCounts = useMemo(() => {
    const def = CATS.find((c) => c.id === cat);
    const m: Record<BandId, number> = { easy: 0, medium: 0, hard: 0, all: 0 };
    if (!vocab || !def) return m;
    const pool = def.pos ? vocab.filter((v) => v.pos === def.pos) : vocab;
    for (const b of BANDS) m[b.id] = pool.filter((v) => inBand(v, b.window)).length;
    return m;
  }, [vocab, cat]);

  const active = CATS.find((c) => c.id === cat) ?? null;

  // ---- Step 1: category grid ----------------------------------------------
  if (!active) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("vocab.pick.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("vocab.pick.subtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCat(c.id); setBand("easy"); }}
              className={`group relative overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${c.border} ${c.hoverBorder}`}
            >
              {/* colored corner wash */}
              <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${c.bg} blur-2xl`} />
              <div className="relative flex items-start gap-4">
                <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
                  <c.Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className={`text-lg font-semibold transition-colors ${c.hoverText}`}>{t(`vocab.cat.${c.id}` as never)}</div>
                  <p className="mt-0.5 text-sm leading-snug text-muted">{t(`vocab.cat.${c.id}.desc` as never)}</p>
                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full ${c.bg} px-2.5 py-1 text-xs font-semibold ${c.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                    {vocab ? `${catCounts[c.id]} ${t("vocab.cat.words")}` : "…"}
                  </div>
                  {snap ? (
                    <MasteryBar right={snap.byCat[c.id].right} wrong={snap.byCat[c.id].wrong} neu={snap.byCat[c.id].new} />
                  ) : (
                    <div className="mt-2.5 h-2 w-full rounded-full bg-foreground/10" />
                  )}
                </div>
                <IconArrowRight className={`ml-auto h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 ${c.hoverText}`} />
              </div>
            </button>
          ))}
        </div>

        {/* special exercise: gender / article trainer */}
        <Link
          href="/vokabular/artikel"
          className="group relative block overflow-hidden rounded-2xl border border-article/30 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-article/60 hover:shadow-lg"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-article/10 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-article/10 text-article">
              <IconLetters className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold transition-colors group-hover:text-article">{t("vocab.cat.article")}</div>
              <p className="mt-0.5 text-sm leading-snug text-muted">{t("vocab.cat.article.desc")}</p>
              {artProg && <MasteryBar right={artProg.right} wrong={artProg.wrong} neu={artProg.new} />}
            </div>
            <IconArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-article" />
          </div>
        </Link>

        {/* special exercise: numbers trainer */}
        <Link
          href="/zahlen"
          className="group relative block overflow-hidden rounded-2xl border border-noun/30 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-noun/60 hover:shadow-lg"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-noun/10 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-noun/10 text-noun">
              <IconHash className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold transition-colors group-hover:text-noun">{t("numbers.title")}</div>
              <p className="mt-0.5 text-sm leading-snug text-muted">{t("numbers.cardDesc")}</p>
            </div>
            <IconArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-noun" />
          </div>
        </Link>
      </div>
    );
  }

  // ---- Step 2: setup (difficulty + focus + round + direction) --------------
  const href = (dir: "es-en" | "en-es") =>
    `/vokabular/quiz?mode=${active.id}&dir=${dir}&diff=${band}&scope=${scope}&count=${count}`;

  const directions: { dir: "en-es" | "es-en"; title: string; desc: string; from: string; to: string }[] = [
    { dir: "en-es", title: t("vocab.setup.typeEs"), desc: t("vocab.setup.typeEs.desc"), from: "EN", to: "ES" },
    { dir: "es-en", title: t("vocab.setup.typeEn"), desc: t("vocab.setup.typeEn.desc"), from: "ES", to: "EN" },
  ];
  const bandEmpty = bandCounts[band] === 0;

  return (
    <div className="space-y-7">
      <button
        onClick={() => setCat(null)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <IconArrowRight className="h-4 w-4 rotate-180" /> {t("vocab.setup.back")}
      </button>

      <div className="flex items-center gap-3">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${active.bg} ${active.text}`}>
          <active.Icon className="h-6 w-6" />
        </div>
        <h1 className={`text-2xl font-bold tracking-tight ${active.text}`}>{t(`vocab.cat.${active.id}` as never)}</h1>
      </div>

      {/* difficulty */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("vocab.setup.difficulty")}</div>
        <div className="flex flex-wrap gap-2">
          {BANDS.map((b) => {
            const n = bandCounts[b.id];
            const selected = band === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setBand(b.id)}
                disabled={n === 0}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  selected ? `${active.bg} ${active.text} border-transparent` : "border-border text-muted hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                {t(`vocab.diff.${b.id}` as never)}
                <span className="ml-1.5 text-xs opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* focus (which words) + round length — compact, sensible defaults */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("vocab.setup.focus")}</div>
          <div className="flex flex-wrap gap-2">
            {FOCI.map((s) => {
              const selected = scope === s;
              return (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  title={t(`vocab.focusDesc.${s}` as never)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    selected ? `${active.bg} ${active.text} border-transparent` : "border-border text-muted hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  {t(`vocab.focus.${s}` as never)}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("vocab.setup.round")}</div>
          <div className="flex flex-wrap gap-2">
            {COUNTS.map((n) => {
              const selected = count === n;
              return (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    selected ? `${active.bg} ${active.text} border-transparent` : "border-border text-muted hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* direction = the two options; picking one starts the round */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("vocab.setup.directionTitle")}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {directions.map((d) =>
            bandEmpty ? (
              <div key={d.dir} className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
                {t("vocab.setup.emptyBand")}
              </div>
            ) : (
              <Link
                key={d.dir}
                href={href(d.dir)}
                className={`group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${active.border} ${active.hoverBorder}`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="rounded-md bg-foreground/5 px-2 py-0.5 font-mono text-xs">{d.from}</span>
                  <IconArrowRight className={`h-4 w-4 ${active.text}`} />
                  <span className={`rounded-md px-2 py-0.5 font-mono text-xs ${active.bg} ${active.text}`}>{d.to}</span>
                </div>
                <div className={`mt-3 text-lg font-semibold transition-colors ${active.hoverText}`}>{d.title}</div>
                <p className="mt-0.5 text-sm leading-snug text-muted">{d.desc}</p>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
