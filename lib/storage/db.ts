"use client";

import type { ItemKind, ProgressRecord, SessionRecord } from "@/lib/types";

const DB_NAME = "espanol-trainer";
const DB_VERSION = 2;
const LEITNER_DAYS = [0, 1, 2, 4, 8, 16];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("no-idb"));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
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
}

export async function addSession(rec: SessionRecord): Promise<void> {
  try {
    await tx("sessions", "readwrite", (s) => s.put(rec));
  } catch {}
}

export function getAllProgress(): Promise<ProgressRecord[]> {
  return getAll<ProgressRecord>("progress");
}

export async function getRecentSessions(limit = 10): Promise<SessionRecord[]> {
  const all = await getAll<SessionRecord>("sessions");
  return all.sort((a, b) => b.endedAt - a.endedAt).slice(0, limit);
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
}

export async function deleteNote(id: string): Promise<void> {
  try {
    await tx("notebook", "readwrite", (s) => s.delete(id));
  } catch {}
}
