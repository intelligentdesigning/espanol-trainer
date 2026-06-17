"use client";

// Local, login-free profiles. Each profile owns a *separate* IndexedDB, so two
// people on the same machine (e.g. Alex / Marco) keep fully independent progress.
// The default profile maps to the original DB name so existing data is kept.

export interface Profile {
  id: string;
  name: string;
}

const PROFILES_KEY = "espanol-profiles";
const ACTIVE_KEY = "espanol-active-profile";
const DEFAULT: Profile = { id: "default", name: "Alex" };

function readJSON<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getProfiles(): Profile[] {
  const list = readJSON<Profile[]>(PROFILES_KEY, []);
  if (!Array.isArray(list) || list.length === 0) return [DEFAULT];
  return list.filter((p) => p && typeof p.id === "string" && typeof p.name === "string");
}

function saveProfiles(list: Profile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list.length ? list : [DEFAULT]));
  } catch {}
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
  return `p-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function addProfile(name: string): Profile {
  const p: Profile = { id: newId(), name: name.trim() || "Profil" };
  saveProfiles([...getProfiles(), p]);
  return p;
}

export function renameProfile(id: string, name: string): void {
  const clean = name.trim();
  if (!clean) return;
  saveProfiles(getProfiles().map((p) => (p.id === id ? { ...p, name: clean } : p)));
}

export function deleteProfile(id: string): void {
  const list = getProfiles().filter((p) => p.id !== id);
  saveProfiles(list);
  if (getActiveId() === id) setActiveId((list[0] ?? DEFAULT).id);
}

/** IndexedDB name for a profile. Default keeps the original name (no data loss). */
export function dbNameFor(id: string): string {
  return id === "default" ? "espanol-trainer" : `espanol-trainer-${id}`;
}

export function activeDbName(): string {
  return dbNameFor(getActiveId());
}
