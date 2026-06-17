"use client";

// Automatic cloud sync. Local IndexedDB stays the fast, offline-first store;
// this pushes changes to the Netlify function (debounced) and pulls on load,
// on an interval, and when the tab regains focus / the network returns. Every
// round-trip merges server <-> local, so all devices converge to the newest
// state — and a device whose local storage was evicted is auto-restored.

import { getBundle, putBundle, onDbChange, type SyncBundle } from "./db";
import { getActiveId, getProfilesRaw, mergeProfiles } from "./profile";

const ENDPOINT = "/api/sync";
const PUSH_DELAY = 1500;
const POLL_MS = 45000;

export type SyncState = "idle" | "syncing" | "ok" | "offline" | "error";
let state: SyncState = "idle";
let lastSyncAt = 0;

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
    const profile = getActiveId();
    const bundle = await getBundle();
    const data = await post({ profiles: getProfilesRaw(), profile, bundle });
    if (data) {
      if (Array.isArray(data.profiles)) mergeProfiles(data.profiles as never);
      if (data.bundle) await putBundle(data.bundle);
      lastSyncAt = Date.now();
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

/** Debounced push (called after every local change). */
export function scheduleSync(delay = PUSH_DELAY): void {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { void syncNow(); }, delay);
}

/** Authoritatively clear the active profile's data on the server (for reset). */
export async function wipeRemote(): Promise<void> {
  try {
    await post({ profile: getActiveId(), replace: true, bundle: { progress: [], sessions: [], daily: [], notebook: [] } });
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
