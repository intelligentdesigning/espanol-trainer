"use client";

// Login-free profiles. Each profile owns a *separate* IndexedDB locally, and
// is mirrored to the cloud (see sync.ts) so it appears on every device. The
// default profile maps to the original DB name so existing data is kept.
//
// Profiles carry `updatedAt` (+ a `deleted` tombstone) so the server can merge
// changes from several devices by last-write-wins.

export interface Profile {
  id: string;
  name: string;
  updatedAt: number;
  deleted?: boolean;
}

const PROFILES_KEY = "espanol-profiles";
const ACTIVE_KEY = "espanol-active-profile";
const DEFAULT: Profile = { id: "default", name: "Alex", updatedAt: 0 };

function now(): number {
  return Date.now();
}

function readRaw(): Profile[] {
  if (typeof localStorage === "undefined") return [DEFAULT];
  try {
    const v = localStorage.getItem(PROFILES_KEY);
    const list = v ? (JSON.parse(v) as Profile[]) : null;
    if (!Array.isArray(list) || list.length === 0) return [DEFAULT];
    // tolerate older records that lack updatedAt/deleted
    return list
      .filter((p) => p && typeof p.id === "string" && typeof p.name === "string")
      .map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt || 0, deleted: !!p.deleted }));
  } catch {
    return [DEFAULT];
  }
}

function writeRaw(list: Profile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list.length ? list : [DEFAULT]));
  } catch {}
}

/** All profiles including tombstones — for sync. */
export function getProfilesRaw(): Profile[] {
  return readRaw();
}

/** Visible profiles (no tombstones) — for the UI. Never empty. */
export function getProfiles(): Profile[] {
  const visible = readRaw().filter((p) => !p.deleted);
  return visible.length ? visible : [DEFAULT];
}

export function getActiveId(): string {
  const profiles = getProfiles();
  if (typeof localStorage === "undefined") return profiles[0].id;
  const id = localStorage.getItem(ACTIVE_KEY);
  return id && profiles.some((p) => p.id === id) ? id : profiles[0].id;
}

export function getActiveProfile(): Profile {
  const profiles = getProfiles();
  return profiles.find((p) => p.id === getActiveId()) ?? profiles[0];
}

export function setActiveId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {}
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `p-${now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function addProfile(name: string): Profile {
  const p: Profile = { id: newId(), name: name.trim() || "Profil", updatedAt: now() };
  writeRaw([...readRaw(), p]);
  return p;
}

export function renameProfile(id: string, name: string): void {
  const clean = name.trim();
  if (!clean) return;
  writeRaw(readRaw().map((p) => (p.id === id ? { ...p, name: clean, updatedAt: now() } : p)));
}

/** Soft-delete (tombstone) so the deletion propagates to other devices. */
export function deleteProfile(id: string): void {
  writeRaw(readRaw().map((p) => (p.id === id ? { ...p, deleted: true, updatedAt: now() } : p)));
  if (getActiveId() === id) setActiveId(getProfiles()[0].id);
}

/** Merge a server profile list into local storage (last-write-wins by id). */
export function mergeProfiles(incoming: Profile[]): Profile[] {
  if (!Array.isArray(incoming)) return getProfiles();
  const byId = new Map<string, Profile>();
  for (const p of readRaw()) byId.set(p.id, p);
  for (const p of incoming) {
    if (!p || typeof p.id !== "string") continue;
    const ex = byId.get(p.id);
    if (!ex || (p.updatedAt || 0) >= ex.updatedAt) {
      byId.set(p.id, { id: p.id, name: p.name, updatedAt: p.updatedAt || 0, deleted: !!p.deleted });
    }
  }
  writeRaw([...byId.values()]);
  return getProfiles();
}

/** IndexedDB name for a profile. Default keeps the original name (no data loss). */
export function dbNameFor(id: string): string {
  return id === "default" ? "espanol-trainer" : `espanol-trainer-${id}`;
}

export function activeDbName(): string {
  return dbNameFor(getActiveId());
}
