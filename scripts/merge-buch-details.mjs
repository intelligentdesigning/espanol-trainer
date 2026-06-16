// Merge per-batch outputs of the buch-enrich workflow into one committed file:
// scripts/vendor/buch-details.json  (keyed by accent-stripped es = "key").
//
// Run: node scripts/merge-buch-details.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "vendor", "buchdetails");
const FIELDS = ["defEs", "defDe", "defEn", "exEs", "exDe", "exEn"];

const expected = new Set();
for (const f of readdirSync(DIR).filter((f) => /^_in-\d+\.json$/.test(f))) {
  for (const w of JSON.parse(readFileSync(join(DIR, f), "utf8"))) expected.add(w.key);
}

const out = {};
const bad = [];
for (const f of readdirSync(DIR).filter((f) => /^_out-\d+\.json$/.test(f)).sort()) {
  let arr;
  try {
    arr = JSON.parse(readFileSync(join(DIR, f), "utf8"));
    if (!Array.isArray(arr)) throw new Error("not an array");
  } catch (e) {
    bad.push(`${f}: ${e.message}`);
    continue;
  }
  for (const d of arr) {
    if (!d || !d.key) continue;
    if (!FIELDS.every((k) => typeof d[k] === "string" && d[k].trim())) continue;
    out[d.key] = Object.fromEntries(FIELDS.map((k) => [k, d[k].trim()]));
  }
}

const missing = [...expected].filter((k) => !out[k]);
writeFileSync(join(__dirname, "vendor", "buch-details.json"), JSON.stringify(out));

console.log("=== merge-buch-details report ===");
console.log("expected keys:", expected.size);
console.log("merged keys:  ", Object.keys(out).length);
console.log("coverage:     ", ((Object.keys(out).length / expected.size) * 100).toFixed(1) + "%");
if (bad.length) { console.log("BAD BATCHES:"); for (const b of bad) console.log("  ", b); }
console.log(missing.length ? `MISSING ${missing.length}: ${missing.slice(0, 40).join(", ")}` : "missing: none ✓");
