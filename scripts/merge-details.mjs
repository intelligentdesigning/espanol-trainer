// Merge the per-batch outputs from the vocab-enrich workflow into one
// committed file: scripts/vendor/details.json  (keyed by vocab id).
// Validates coverage + field completeness and reports gaps.
//
// Run: node scripts/merge-details.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "vendor", "details");
const FIELDS = ["defEs", "defDe", "defEn", "exEs", "exDe", "exEn"];

const files = readdirSync(DIR).filter((f) => /^_in-\d+\.json$/.test(f)).sort();
const expected = new Set();
for (const f of files) {
  for (const w of JSON.parse(readFileSync(join(DIR, f), "utf8"))) expected.add(w.id);
}

const out = {};
const badBatches = [];
const outFiles = readdirSync(DIR).filter((f) => /^_out-\d+\.json$/.test(f)).sort();
for (const f of outFiles) {
  let arr;
  try {
    arr = JSON.parse(readFileSync(join(DIR, f), "utf8"));
    if (!Array.isArray(arr)) throw new Error("not an array");
  } catch (e) {
    badBatches.push(`${f}: ${e.message}`);
    continue;
  }
  for (const d of arr) {
    if (!d || !d.id) continue;
    const ok = FIELDS.every((k) => typeof d[k] === "string" && d[k].trim());
    if (!ok) continue;
    out[d.id] = Object.fromEntries(FIELDS.map((k) => [k, d[k].trim()]));
  }
}

const missing = [...expected].filter((id) => !out[id]);
writeFileSync(join(__dirname, "vendor", "details.json"), JSON.stringify(out, null, 0));

console.log("=== merge-details report ===");
console.log("expected ids:", expected.size);
console.log("merged ids:  ", Object.keys(out).length);
console.log("coverage:    ", ((Object.keys(out).length / expected.size) * 100).toFixed(1) + "%");
if (badBatches.length) {
  console.log("BAD BATCHES (invalid JSON / shape):");
  for (const b of badBatches) console.log("  ", b);
}
if (missing.length) {
  console.log(`MISSING ${missing.length} ids:`, missing.slice(0, 40).join(", ") + (missing.length > 40 ? " …" : ""));
} else {
  console.log("missing ids: none ✓");
}
