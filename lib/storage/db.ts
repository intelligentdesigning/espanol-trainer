"use client";

import type { ItemKind, ProgressRecord, SessionRecord } from "@/lib/types";
import { activeDbName } from "./profile";

const DB_VERSION = 3;
const LEITNER_DAYS = [0, 1, 2, 4, 8, 16];

/** Local YYYY-MM-DD for "today" bucketing (local time, not UTC). */
function dayKey(ts = Date.now()): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("no-idb"));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(activeDbName(), DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("progress")) {
        const s = db.createObjectStore("progress", { keyPath: "itemKey" });
        s.createIndex("dueAt", "dueAt");
        s.createIndex("kind", "kind");
      }
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("notebook")) {
        db.createObjectStore("notebook", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("daily")) {
        const s = db.createObjectStore("daily", { keyPath: "key" });
        s.createIndex("date", "date");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

function getAll<T>(store: string): Promise<T[]> {
  return tx<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>).catch(() => []);
}

/** Every store that holds user data — used for backup export/import. */
const DATA_STORES = ["progress", "sessions", "daily", "notebook", "meta"] as const;

/**
 * Ask the browser to keep our storage permanently. Without this, Safari (ITP)
 * evicts IndexedDB after ~7 days of no visits — the cause of "my progress
 * vanished". Safe to call repeatedly; returns whether storage is persistent.
 */
export async function requestPersist(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage) return false;
    if (navigator.storage.persisted && (await navigator.storage.persisted())) return true;
    if (navigator.storage.persist) return await navigator.storage.persist();
  } catch {}
  return false;
}

export async function isPersisted(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted?.()) ?? false;
  } catch {
    return false;
  }
}

export interface BackupData {
  app: "espanol-trainer";
  version: number;
  exportedAt: number;
  stores: Record<string, unknown[]>;
}

/** Snapshot the active profile's data as a portable object (→ JSON download). */
export async function exportData(): Promise<BackupData> {
  const stores: Record<string, unknown[]> = {};
  for (const s of DATA_STORES) stores[s] = await getAll(s);
  return { app: "espanol-trainer", version: DB_VERSION, exportedAt: Date.now(), stores };
}

/** Replace the active profile's data with a backup. Unknown stores are ignored. */
export async function importData(data: BackupData): Promise<void> {
  if (!data || data.app !== "espanol-trainer" || !data.stores) throw new Error("bad-backup");
  const db = await openDB();
  const names = new Set(Array.from(db.objectStoreNames));
  for (const s of DATA_STORES) {
    if (!names.has(s)) continue;
    const rows = Array.isArray(data.stores[s]) ? data.stores[s] : [];
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction(s, "readwrite");
      const store = t.objectStore(s);
      store.clear();
      for (const r of rows) store.put(r);
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  }
  emitChange();
}

// --- change notifications (drives automatic cloud sync) -------------------
let changeListeners: Array<() => void> = [];
/** Subscribe to local data changes (used by sync.ts). Returns an unsubscribe. */
export function onDbChange(cb: () => void): () => void {
  changeListeners.push(cb);
  return () => { changeListeners = changeListeners.filter((c) => c !== cb); };
}
function emitChange(): void {
  for (const c of changeListeners) {
    try { c(); } catch {}
  }
}

// --- sync bundle (the syncable subset, per active profile) -----------------
const SYNC_STORES = ["progress", "sessions", "daily", "notebook"] as const;
export interface SyncBundle {
  progress: ProgressRecord[];
  sessions: SessionRecord[];
  daily: DailyRecord[];
  notebook: NotebookEntry[];
}

/** Read the active profile's full syncable data. */
export async function getBundle(): Promise<SyncBundle> {
  const [progress, sessions, daily, notebook] = await Promise.all([
    getAll<ProgressRecord>("progress"),
    getAll<SessionRecord>("sessions"),
    getAll<DailyRecord>("daily"),
    getAll<NotebookEntry>("notebook"),
  ]);
  return { progress, sessions, daily, notebook };
}

/** Upsert a (server-merged) bundle into the active DB. Does not emit a change. */
export async function putBundle(bundle: Partial<SyncBundle>): Promise<void> {
  let db: IDBDatabase;
  try {
    db = await openDB();
  } catch {
    return;
  }
  const names = new Set(Array.from(db.objectStoreNames));
  for (const s of SYNC_STORES) {
    const rows = (bundle as Record<string, unknown[]>)[s];
    if (!names.has(s) || !Array.isArray(rows) || rows.length === 0) continue;
    await new Promise<void>((resolve) => {
      const t = db.transaction(s, "readwrite");
      const store = t.objectStore(s);
      for (const r of rows) store.put(r);
      t.oncomplete = () => resolve();
      t.onerror = () => resolve();
    });
  }
}

/** Record one answer; updates stats + a simple Leitner schedule. */
export async function recordResult(itemKey: string, kind: ItemKind, correct: boolean): Promise<void> {
  let db: IDBDatabase;
  try {
    db = await openDB();
  } catch {
    return; // no IndexedDB (e.g. SSR / private mode) — fail silently
  }
  const now = Date.now();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction("progress", "readwrite");
    const store = t.objectStore("progress");
    const getReq = store.get(itemKey);
    getReq.onsuccess = () => {
      const prev = getReq.result as ProgressRecord | undefined;
      const rec: ProgressRecord = prev ?? {
        itemKey, kind, box: 0, ease: 2.5, intervalDays: 0, dueAt: now,
        seen: 0, correct: 0, streak: 0, lastResult: null, updatedAt: now,
      };
      rec.seen += 1;
      if (correct) {
        rec.correct += 1;
        rec.streak += 1;
        rec.box = Math.min(rec.box + 1, LEITNER_DAYS.length - 1);
        rec.ease = Math.min(3.0, rec.ease + 0.05);
      } else {
        rec.streak = 0;
        rec.box = Math.max(rec.box - 1, 0);
        rec.ease = Math.max(1.3, rec.ease - 0.2);
      }
      rec.intervalDays = LEITNER_DAYS[rec.box];
      rec.dueAt = now + rec.intervalDays * 86400000;
      rec.lastResult = correct ? "right" : "wrong";
      rec.updatedAt = now;
      store.put(rec);
    };
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  await bumpDaily(db, itemKey, kind, correct, now);
  emitChange();
}

interface DailyRecord {
  key: string;        // `${date}:${itemKey}`
  date: string;       // YYYY-MM-DD (local)
  itemKey: string;
  kind: ItemKind;
  result: "right" | "wrong";
  updatedAt: number;
}

/**
 * One row per (day, item). "right" wins: if a word was wrong then right on the
 * same day, it counts once as right — never double-counted as both.
 */
async function bumpDaily(db: IDBDatabase, itemKey: string, kind: ItemKind, correct: boolean, now: number): Promise<void> {
  const date = dayKey(now);
  const key = `${date}:${itemKey}`;
  await new Promise<void>((resolve) => {
    const t = db.transaction("daily", "readwrite");
    const store = t.objectStore("daily");
    const getReq = store.get(key);
    getReq.onsuccess = () => {
      const prev = getReq.result as DailyRecord | undefined;
      const result: "right" | "wrong" = prev?.result === "right" || correct ? "right" : "wrong";
      store.put({ key, date, itemKey, kind, result, updatedAt: now });
    };
    t.oncomplete = () => resolve();
    t.onerror = () => resolve();
  });
}

export interface DailyStats {
  date: string;
  total: number;
  correct: number;
  wrong: number;
}

/** Today's practice: unique items answered, split by best result (right wins). */
export async function getDailyStats(date = dayKey()): Promise<DailyStats> {
  const all = await getAll<DailyRecord>("daily");
  const day = all.filter((r) => r.date === date);
  const correct = day.filter((r) => r.result === "right").length;
  return { date, total: day.length, correct, wrong: day.length - correct };
}

/** Last `days` days (oldest→newest), each with totals — for the mini chart + streak. */
export async function getDailyHistory(days = 7): Promise<{ date: string; total: number; correct: number }[]> {
  const all = await getAll<DailyRecord>("daily");
  const byDate = new Map<string, { total: number; correct: number }>();
  for (const r of all) {
    const e = byDate.get(r.date) ?? { total: 0, correct: 0 };
    e.total += 1;
    if (r.result === "right") e.correct += 1;
    byDate.set(r.date, e);
  }
  const out: { date: string; total: number; correct: number }[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(now - i * 86400000);
    const e = byDate.get(k);
    out.push({ date: k, total: e?.total ?? 0, correct: e?.correct ?? 0 });
  }
  return out;
}

export async function addSession(rec: SessionRecord): Promise<void> {
  try {
    await tx("sessions", "readwrite", (s) => s.put(rec));
  } catch {}
  emitChange();
}

export function getAllProgress(): Promise<ProgressRecord[]> {
  return getAll<ProgressRecord>("progress");
}

export async function getRecentSessions(limit = 10): Promise<SessionRecord[]> {
  const all = await getAll<SessionRecord>("sessions");
  return all.sort((a, b) => b.endedAt - a.endedAt).slice(0, limit);
}

export function getAllSessions(): Promise<SessionRecord[]> {
  return getAll<SessionRecord>("sessions");
}

/** Best score (0..100) + attempts for one grammar chapter test (mode `grammar:<id>`). */
export async function getChapterBest(chapterId: string): Promise<{ bestPct: number; attempts: number }> {
  const all = await getAll<SessionRecord>("sessions");
  const mine = all.filter((s) => s.mode === `grammar:${chapterId}` && s.total > 0);
  const bestPct = mine.length ? Math.max(...mine.map((s) => Math.round((s.correct / s.total) * 100))) : 0;
  return { bestPct, attempts: mine.length };
}

export interface Stats {
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
  vocabSeen: number;
  verbSeen: number;
  grammarSeen: number;
}

export async function getStats(): Promise<Stats> {
  const progress = await getAllProgress();
  let totalQuestions = 0;
  let totalCorrect = 0;
  let vocabSeen = 0;
  let verbSeen = 0;
  let grammarSeen = 0;
  for (const p of progress) {
    totalQuestions += p.seen;
    totalCorrect += p.correct;
    if (p.kind === "vocab") vocabSeen += 1;
    else if (p.kind === "conj") verbSeen += 1;
    else grammarSeen += 1;
  }
  return {
    totalQuestions,
    totalCorrect,
    accuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    vocabSeen,
    verbSeen,
    grammarSeen,
  };
}

export async function resetAll(): Promise<void> {
  try {
    await tx("progress", "readwrite", (s) => s.clear());
    await tx("sessions", "readwrite", (s) => s.clear());
    await tx("daily", "readwrite", (s) => s.clear());
  } catch {}
}

// --- Vokabelheft (personal notebook) ---------------------------------------
export interface NotebookEntry {
  id: string;
  es: string;
  de: string;
  en: string;
  createdAt: number;
  updatedAt: number;
}

export async function getNotebook(): Promise<NotebookEntry[]> {
  const all = await getAll<NotebookEntry>("notebook");
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveNote(entry: NotebookEntry): Promise<void> {
  try {
    await tx("notebook", "readwrite", (s) => s.put(entry));
  } catch {}
  emitChange();
}

export async function deleteNote(id: string): Promise<void> {
  try {
    await tx("notebook", "readwrite", (s) => s.delete(id));
  } catch {}
  emitChange();
}
