// Automatic cloud sync for Español Trainer — Cloudflare Pages Function.
//
// Same contract as the previous Netlify function, so the client needs no change:
// the browser keeps a fast local IndexedDB copy and posts here on every change,
// the server merges and returns the merged result, and every device converges.
// Conflict-free per record:
//   - progress / notebook : last write wins by `updatedAt`
//   - daily               : "right wins" (matches the local rule), newest time
//   - sessions            : union by id (sessions are immutable)
//
// Storage is D1 rather than Netlify Blobs. D1 gives read-after-write
// consistency, which sync depends on: a device must read the newest data right
// after another device pushed, otherwise it would serve a stale (empty) bundle.
// Cloudflare KV would NOT be safe here — its eventual consistency could let a
// stale read overwrite newer progress.
//
// Access model: OPEN (no code) — chosen by the user for zero-friction sync.

import { EMPTY, mergeBundle, mergeProfiles, visible } from "../../shared/sync-merge.mjs";

const PROFILES_KEY = "profiles";
const SYNC_VERSION = 3; // bump to detect which deploy is live
const dataKey = (id) => `data:${id}`;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

async function readJson(db, key) {
  const row = await db.prepare("SELECT v FROM blobs WHERE k = ?").bind(key).first();
  if (!row) return null;
  try {
    return JSON.parse(row.v);
  } catch {
    return null;
  }
}

async function writeJson(db, key, value) {
  await db
    .prepare(
      "INSERT INTO blobs (k, v, updated_at) VALUES (?1, ?2, ?3) " +
        "ON CONFLICT(k) DO UPDATE SET v = ?2, updated_at = ?3",
    )
    .bind(key, JSON.stringify(value), Date.now())
    .run();
}

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "storage-unavailable" }, 503);

  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const profile = url.searchParams.get("profile");
      const profiles = (await readJson(db, PROFILES_KEY)) || [];
      const out = { v: SYNC_VERSION, profiles: visible(profiles) };
      if (profile) out.bundle = (await readJson(db, dataKey(profile))) || EMPTY;
      return json(out);
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      let profiles = (await readJson(db, PROFILES_KEY)) || [];

      if (Array.isArray(body.profiles)) {
        profiles = mergeProfiles(profiles, body.profiles);
        await writeJson(db, PROFILES_KEY, profiles);
      }

      let bundle;
      if (body.profile && body.replace) {
        // authoritative overwrite — used by "reset progress" so a wipe sticks
        bundle = { ...EMPTY, ...(body.bundle || {}) };
        await writeJson(db, dataKey(body.profile), bundle);
      } else if (body.profile && body.bundle) {
        const stored = (await readJson(db, dataKey(body.profile))) || EMPTY;
        bundle = mergeBundle(stored, body.bundle);
        await writeJson(db, dataKey(body.profile), bundle);
      } else if (body.profile) {
        bundle = (await readJson(db, dataKey(body.profile))) || EMPTY;
      }

      return json({ profiles: visible(profiles), bundle });
    }

    return json({ error: "method-not-allowed" }, 405);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
}
