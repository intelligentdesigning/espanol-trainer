// Apply the merged CEFR map onto vocab.json + buch.json (frequency-rank fallback).
// Run: node scripts/apply-cefr.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const map = JSON.parse(readFileSync(join(ROOT, "scripts", "vendor", "cefr.json"), "utf8"));

const fromRank = (r) => (r == null ? undefined : r <= 300 ? "A1" : r <= 750 ? "A2" : r <= 1400 ? "B1" : r <= 2200 ? "B2" : r <= 3200 ? "C1" : "C2");

// vocab.json (has frequency rank → fallback)
const vp = join(ROOT, "public", "data", "vocab.json");
const v = JSON.parse(readFileSync(vp, "utf8"));
const va = Array.isArray(v) ? v : v.items;
let vh = 0, vf = 0;
for (const it of va) { const c = map[norm(it.es)] || fromRank(it.rank); if (c) { it.cefr = c; c === map[norm(it.es)] ? vh++ : vf++; } }
writeFileSync(vp, JSON.stringify(v));

// buch.json (no rank → only map hits get a level)
const bp = join(ROOT, "public", "data", "buch.json");
const b = JSON.parse(readFileSync(bp, "utf8"));
let bh = 0, bm = 0;
for (const e of b.entries) { const c = map[norm(e.es)]; if (c) { e.cefr = c; bh++; } else bm++; }
writeFileSync(bp, JSON.stringify(b));

console.log(`vocab.json: ${vh} aus Map + ${vf} aus Rang | buch.json: ${bh} aus Map, ${bm} ohne`);
