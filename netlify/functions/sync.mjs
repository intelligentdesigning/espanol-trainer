// Automatic cloud sync for Español Trainer.
//
// Stores each profile's learning data in Netlify Blobs (no DB to provision,
// no tokens in the client). The browser keeps a fast local IndexedDB copy and
// posts here on every change; the server merges and returns the merged result,
// so every device converges to the newest state. Conflict-free per record:
//   - progress / notebook : last write wins by `updatedAt`
//   - daily               : "right wins" (matches the local rule), newest time
//   - sessions            : union by id (sessions are immutable)
//
// Access model: OPEN (no code) — chosen by the user for zero-friction sync.

import { getStore } from "@netlify/blobs";
import { EMPTY, mergeBundle, mergeProfiles, visible } from "./_merge.mjs";

const STORE = "espanol-sync";
const PROFILES_KEY = "profiles";
const dataKey = (id) => `data:${id}`;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  let store;
  try {
    // strong consistency: a device must read the newest data right after another
    // device pushed, otherwise sync could serve a stale (empty) bundle.
    store = getStore({ name: STORE, consistency: "strong" });
  } catch {
    return json({ error: "blobs-unavailable" }, 503);
  }

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const profile = url.searchParams.get("profile");
      const profiles = (await store.get(PROFILES_KEY, { type: "json" })) || [];
      const out = { profiles: visible(profiles) };
      if (profile) out.bundle = (await store.get(dataKey(profile), { type: "json" })) || EMPTY;
      return json(out);
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      let profiles = (await store.get(PROFILES_KEY, { type: "json" })) || [];

      if (Array.isArray(body.profiles)) {
        profiles = mergeProfiles(profiles, body.profiles);
        await store.setJSON(PROFILES_KEY, profiles);
      }

      let bundle;
      if (body.profile && body.replace) {
        // authoritative overwrite — used by "reset progress" so a wipe sticks
        bundle = { ...EMPTY, ...(body.bundle || {}) };
        await store.setJSON(dataKey(body.profile), bundle);
      } else if (body.profile && body.bundle) {
        const stored = (await store.get(dataKey(body.profile), { type: "json" })) || EMPTY;
        bundle = mergeBundle(stored, body.bundle);
        await store.setJSON(dataKey(body.profile), bundle);
      } else if (body.profile) {
        bundle = (await store.get(dataKey(body.profile), { type: "json" })) || EMPTY;
      }

      return json({ profiles: visible(profiles), bundle });
    }

    return json({ error: "method-not-allowed" }, 405);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
};

export const config = { path: "/api/sync" };
