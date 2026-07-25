// Merge the per-word CEFR batches into one map (normalised es → level).
// Run: node scripts/merge-cefr.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "scripts", "vendor", "cefrout");
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const VALID = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);

const map = {};
let n = 0, bad = 0;
for (const f of readdirSync(DIR).filter((f) => /\.json$/.test(f))) {
  let arr;
  try { arr = JSON.parse(readFileSync(join(DIR, f), "utf8")); } catch { console.log("BAD", f); continue; }
  for (const o of arr) {
    if (!o || !o.es || !VALID.has(o.cefr)) { bad++; continue; }
    map[norm(o.es)] = o.cefr;
    n++;
  }
}
writeFileSync(join(ROOT, "scripts", "vendor", "cefr.json"), JSON.stringify(map));
const dist = {};
for (const k in map) dist[map[k]] = (dist[map[k]] || 0) + 1;
console.log(`merged ${n} tags (${Object.keys(map).length} unique) | invalid ${bad}`);
console.log("Verteilung:", dist);
