// Pure merge helpers for the sync function — no Netlify deps, so they can be
// unit-tested with plain node. Files prefixed "_" are not deployed as routes.

export const EMPTY = { progress: [], sessions: [], daily: [], notebook: [] };

const num = (x) => (typeof x === "number" && isFinite(x) ? x : 0);

export function mergeByKey(a = [], b = [], keyFn, pick) {
  const m = new Map();
  for (const x of a) if (x) m.set(keyFn(x), x);
  for (const y of b) {
    if (!y) continue;
    const k = keyFn(y);
    const ex = m.get(k);
    m.set(k, ex ? pick(ex, y) : y);
  }
  return [...m.values()];
}

export const newer = (x, y) => (num(y.updatedAt) >= num(x.updatedAt) ? y : x);

export function mergeBundle(a = EMPTY, b = EMPTY) {
  return {
    progress: mergeByKey(a.progress, b.progress, (r) => r.itemKey, newer),
    notebook: mergeByKey(a.notebook, b.notebook, (r) => r.id, newer),
    sessions: mergeByKey(a.sessions, b.sessions, (r) => r.id, (x) => x),
    daily: mergeByKey(a.daily, b.daily, (r) => r.key, (x, y) => ({
      ...newer(x, y),
      // a word answered right on either device counts as right
      result: x.result === "right" || y.result === "right" ? "right" : newer(x, y).result,
      updatedAt: Math.max(num(x.updatedAt), num(y.updatedAt)),
    })),
  };
}

export function mergeProfiles(a = [], b = []) {
  return mergeByKey(a, b, (p) => p.id, newer);
}

export const visible = (list) => list.filter((p) => p && !p.deleted);
