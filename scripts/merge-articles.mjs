// Merge noun-gender batches (scripts/vendor/articles-out/*.json) into the
// committed scripts/vendor/articles.json. Validates article ∈ {el,la}.
// Run: node scripts/merge-articles.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "vendor", "articles-out");

const out = [];
const seen = new Set();
let dropped = 0;
for (const f of readdirSync(DIR).filter((f) => /\.json$/.test(f)).sort()) {
  let arr;
  try { arr = JSON.parse(readFileSync(join(DIR, f), "utf8")); } catch (e) { console.log("bad", f, e.message); continue; }
  if (!Array.isArray(arr)) continue;
  for (const a of arr) {
    if (!a || typeof a.es !== "string" || (a.article !== "el" && a.article !== "la")) { dropped++; continue; }
    if (seen.has(a.es)) continue;
    seen.add(a.es);
    const rec = { es: a.es, article: a.article, irregular: !!a.irregular };
    if (a.irregular && a.note && a.note.de && a.note.en) rec.note = { de: a.note.de, en: a.note.en };
    out.push(rec);
  }
}

writeFileSync(join(__dirname, "vendor", "articles.json"), JSON.stringify(out));
const irr = out.filter((a) => a.irregular).length;
console.log("=== merge-articles report ===");
console.log(`nouns: ${out.length} (el ${out.filter((a) => a.article === "el").length} / la ${out.filter((a) => a.article === "la").length}), irregular: ${irr}, dropped: ${dropped}`);
