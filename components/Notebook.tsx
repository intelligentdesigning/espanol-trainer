"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { SpanishInput } from "@/components/SpanishInput";
import { NotebookQuiz } from "@/components/NotebookQuiz";
import { suggestSpanish } from "@/lib/data";
import { getNotebook, saveNote, deleteNote, type NotebookEntry } from "@/lib/storage/db";

// Roomy, auto-growing cell (textarea). Spanish word is emphasized.
const cell =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-2 focus:ring-brand/15";
const cellEs = `${cell} font-medium`;

export function Notebook() {
  const { t } = useI18n();
  const [notes, setNotes] = useState<NotebookEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [es, setEs] = useState("");
  const [de, setDe] = useState("");
  const [en, setEn] = useState("");
  const [suggestion, setSuggestion] = useState<{ es: string; en: string } | null>(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "quiz">("list");

  useEffect(() => {
    getNotebook().then((n) => { setNotes(n); setLoaded(true); });
  }, []);

  const onEsChange = (v: string) => {
    setEs(v);
    suggestSpanish(v).then(setSuggestion);
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setEs(suggestion.es);
    if (!en) setEn(suggestion.en);
    setSuggestion(null);
  };

  const add = async () => {
    if (!es.trim() && !de.trim() && !en.trim()) return;
    const now = Date.now();
    const entry: NotebookEntry = {
      id: crypto.randomUUID(),
      es: es.trim(), de: de.trim(), en: en.trim(),
      createdAt: now, updatedAt: now,
    };
    setNotes((cur) => [...cur, entry]);
    setEs(""); setDe(""); setEn(""); setSuggestion(null);
    await saveNote(entry);
  };

  const update = (id: string, field: "es" | "de" | "en", value: string) => {
    setNotes((cur) => cur.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
  };
  const persist = (id: string) => {
    const n = notes.find((x) => x.id === id);
    if (n) saveNote({ ...n, updatedAt: Date.now() });
  };
  const remove = async (id: string) => {
    setNotes((cur) => cur.filter((n) => n.id !== id));
    await deleteNote(id);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => `${n.es} ${n.de} ${n.en}`.toLowerCase().includes(q));
  }, [notes, query]);

  const usable = notes.filter((n) => n.es.trim() && (n.de.trim() || n.en.trim())).length;

  if (mode === "quiz") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("notebook.title")}</h1>
        <NotebookQuiz entries={notes} onExit={() => setMode("list")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("notebook.title")}</h1>
          <p className="mt-1 text-muted">{t("notebook.subtitle")}</p>
        </div>
        {usable >= 4 && (
          <button onClick={() => setMode("quiz")} className="shrink-0 rounded-lg bg-vocab px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            {t("notebook.practice")}
          </button>
        )}
      </div>

      {/* add form */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3 sm:items-start">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand">{t("notebook.es")}</label>
            <SpanishInput value={es} onChange={onEsChange} onEnter={add} multiline placeholder={t("notebook.es")} className={cellEs} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{t("notebook.de")}</label>
            <SpanishInput value={de} onChange={setDe} onEnter={add} multiline showAccents={false} placeholder={t("notebook.notePlaceholder")} className={cell} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{t("notebook.en")}</label>
            <SpanishInput value={en} onChange={setEn} onEnter={add} multiline showAccents={false} placeholder={t("notebook.notePlaceholder")} className={cell} />
          </div>
        </div>

        {suggestion && (
          <button
            onClick={applySuggestion}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand/10 px-3 py-1.5 text-sm text-brand hover:bg-brand/20"
          >
            {t("notebook.suggest")}: <b lang="es">{suggestion.es}</b>
            <span className="text-muted">({suggestion.en})</span>
          </button>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">{t("notebook.hint")}</p>
          <button onClick={add} className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:opacity-90">
            {t("notebook.add")}
          </button>
        </div>
      </div>

      {/* list */}
      <div className="flex items-center justify-between gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("notebook.search")} className={`${cell} max-w-48`} />
        <span className="shrink-0 text-sm text-muted">{notes.length} {t("notebook.count")}</span>
      </div>

      {loaded && notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t("notebook.empty")}</p>
      ) : (
        <div className="space-y-2.5">
          {/* desktop column header */}
          <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
            <span lang="es">{t("notebook.es")}</span><span>{t("notebook.de")}</span><span>{t("notebook.en")}</span><span></span>
          </div>

          {filtered.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-brand/30 sm:bg-card/60 sm:p-2.5"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-start sm:gap-3">
                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand sm:hidden">{t("notebook.es")}</span>
                  <SpanishInput value={n.es} onChange={(v) => update(n.id, "es", v)} onBlur={() => persist(n.id)} multiline showAccents={false} className={cellEs} />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted sm:hidden">{t("notebook.de")}</span>
                  <SpanishInput value={n.de} onChange={(v) => update(n.id, "de", v)} onBlur={() => persist(n.id)} multiline showAccents={false} className={cell} />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted sm:hidden">{t("notebook.en")}</span>
                  <SpanishInput value={n.en} onChange={(v) => update(n.id, "en", v)} onBlur={() => persist(n.id)} multiline showAccents={false} className={cell} />
                </div>
                <button
                  onClick={() => remove(n.id)}
                  aria-label={t("notebook.delete")}
                  className="flex items-center justify-center gap-1.5 self-start rounded-lg border border-border py-2 text-sm text-muted transition-colors hover:border-red-500 hover:text-red-500 sm:h-10 sm:w-10 sm:py-0"
                >
                  <span className="sm:hidden">{t("notebook.delete")}</span>
                  <span aria-hidden>✕</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
