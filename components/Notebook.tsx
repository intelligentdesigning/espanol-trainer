"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { SpanishInput } from "@/components/SpanishInput";
import { suggestSpanish } from "@/lib/data";
import { getNotebook, saveNote, deleteNote, type NotebookEntry } from "@/lib/storage/db";

export function Notebook() {
  const { t } = useI18n();
  const [notes, setNotes] = useState<NotebookEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [es, setEs] = useState("");
  const [de, setDe] = useState("");
  const [en, setEn] = useState("");
  const [suggestion, setSuggestion] = useState<{ es: string; en: string } | null>(null);
  const [query, setQuery] = useState("");

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

  const cell = "rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("notebook.title")}</h1>
        <p className="mt-1 text-muted">{t("notebook.subtitle")}</p>
      </div>

      {/* add form */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand">{t("notebook.es")}</label>
            <SpanishInput value={es} onChange={onEsChange} onEnter={add} placeholder={t("notebook.es")} className={`w-full ${cell}`} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{t("notebook.de")}</label>
            <input value={de} onChange={(e) => setDe(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={t("notebook.de")} className={`w-full ${cell}`} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{t("notebook.en")}</label>
            <input value={en} onChange={(e) => setEn(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={t("notebook.en")} className={`w-full ${cell}`} />
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

        <button onClick={add} className="mt-3 w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:opacity-90">
          {t("notebook.add")}
        </button>
      </div>

      {/* list */}
      <div className="flex items-center justify-between gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("notebook.search")} className={`${cell} w-48`} />
        <span className="text-sm text-muted">{notes.length} {t("notebook.count")}</span>
      </div>

      {loaded && notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t("notebook.empty")}</p>
      ) : (
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
            <span lang="es">{t("notebook.es")}</span><span>{t("notebook.de")}</span><span>{t("notebook.en")}</span><span></span>
          </div>
          {filtered.map((n) => (
            <div key={n.id} className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-card p-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:border-0 sm:bg-transparent sm:p-0">
              <input value={n.es} lang="es" onChange={(e) => update(n.id, "es", e.target.value)} onBlur={() => persist(n.id)} className={`${cell} font-medium`} />
              <input value={n.de} onChange={(e) => update(n.id, "de", e.target.value)} onBlur={() => persist(n.id)} className={cell} />
              <input value={n.en} onChange={(e) => update(n.id, "en", e.target.value)} onBlur={() => persist(n.id)} className={cell} />
              <button onClick={() => remove(n.id)} aria-label={t("notebook.delete")} className="rounded-lg border border-border px-3 text-muted hover:border-red-500 hover:text-red-500">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
