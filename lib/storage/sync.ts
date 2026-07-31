"use client";

// Automatic cloud sync. Local IndexedDB stays the fast, offline-first store;
// this pushes changes to the Netlify function (debounced) and pulls on load,
// on an interval, and when the tab regains focus / the network returns. Every
// round-trip merges server <-> local, so all devices converge to the newest
// state — and a device whose local storage was evicted is auto-restored.

import { getBundle, putBundle, onDbChange, type SyncBundle } from "./db";
import { getActiveId, getProfilesRaw, mergeProfiles, type Profile } from "./profile";
import { getActiveLang } from "@/lib/lang";

const ENDPOINT = "/api/sync";
const PUSH_DELAY = 1500;
const POLL_MS = 45000;

/** Cloud key for the active profile *and* language. The local database is split
 *  per language, so the remote copy must be too — otherwise Spanish and German
 *  progress would merge into one blob and flow back mixed. Spanish keeps the
 *  historic key (plain profile id) so existing cloud data stays valid. */
function syncKey(): string {
  const id = getActiveId();
  const lang = getActiveLang();
  return lang === "es" ? id : `${id}--${lang}`;
}

export type SyncState = "idle" | "syncing" | "ok" | "offline" | "error";
let state: SyncState = "idle";

// Remembered across reloads so we can warn when the cloud backup has been
// failing for days (offline, function down) — before anything is at risk.
const OK_KEY = "sync-last-ok";
const readLastOk = (): number => {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(`${OK_KEY}:${syncKey()}`) || 0);
};
const writeLastOk = (ts: number) => {
  try { window.localStorage.setItem(`${OK_KEY}:${syncKey()}`, String(ts)); } catch {}
};
let lastSyncAt = 0;

/** Days since the last successful cloud backup of this profile+language
 *  (0 if it synced today, null if it never synced on this device). */
export function daysSinceBackup(): number | null {
  const ts = lastSyncAt || readLastOk();
  if (!ts) return null;
  return Math.floor((Date.now() - ts) / 86400000);
}

const listeners = new Set<(s: { state: SyncState; lastSyncAt: number }) => void>();
function emit() {
  const snap = { state, lastSyncAt };
  for (const l of listeners) {
    try { l(snap); } catch {}
  }
}
export function onSyncStatus(cb: (s: { state: SyncState; lastSyncAt: number }) => void): () => void {
  listeners.add(cb);
  cb({ state, lastSyncAt });
  return () => { listeners.delete(cb); };
}
export function getSyncState(): { state: SyncState; lastSyncAt: number } {
  return { state, lastSyncAt };
}

let inFlight = false;
let queued = false;
let timer: ReturnType<typeof setTimeout> | null = null;

async function post(body: unknown): Promise<{ profiles?: unknown[]; bundle?: Partial<SyncBundle> } | null> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`sync ${res.status}`);
  return res.json();
}

/** Push the active profile + its data, pull the merged result back. */
export async function syncNow(): Promise<void> {
  if (typeof window === "undefined") return;
  if (inFlight) { queued = true; return; }
  inFlight = true;
  state = "syncing";
  emit();
  try {
    const profile = syncKey();
    const bundle = await getBundle();
    const data = await post({ profiles: getProfilesRaw(), profile, bundle });
    if (data) {
      if (Array.isArray(data.profiles)) mergeProfiles(data.profiles as never);
      if (data.bundle) await putBundle(data.bundle);
      lastSyncAt = Date.now();
      writeLastOk(lastSyncAt);
      state = "ok";
      window.dispatchEvent(new CustomEvent("espanol-synced"));
    } else {
      state = "error";
    }
  } catch {
    state = "offline";
  } finally {
    inFlight = false;
    emit();
    if (queued) { queued = false; scheduleSync(300); }
  }
}

/** Read the cloud profile list and merge it into this device, *without* touching
 *  learning data. A brand new device knows no profiles yet, so the first-visit
 *  gate calls this before offering "create a profile" — otherwise a returning
 *  learner would build a duplicate instead of picking their own. */
export async function pullProfiles(): Promise<Profile[]> {
  const res = await fetch(ENDPOINT, { cache: "no-store" });
  if (!res.ok) throw new Error(`profiles ${res.status}`);
  const data = (await res.json()) as { profiles?: unknown };
  if (!Array.isArray(data.profiles)) throw new Error("no profile list");
  return mergeProfiles(data.profiles as Profile[]);
}

/** Debounced push (called after every local change). */
export function scheduleSync(delay = PUSH_DELAY): void {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { void syncNow(); }, delay);
}

/** Authoritatively clear the active profile's data on the server (for reset). */
export async function wipeRemote(): Promise<void> {
  try {
    await post({ profile: syncKey(), replace: true, bundle: { progress: [], sessions: [], daily: [], notebook: [] } });
  } catch {}
}

let started = false;
export function initSync(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  onDbChange(() => scheduleSync());
  void syncNow(); // initial push + pull (restores local if it was evicted)
  setInterval(() => {
    if (document.visibilityState === "visible") void syncNow();
  }, POLL_MS);
  window.addEventListener("online", () => void syncNow());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleSync(500);
  });
}
