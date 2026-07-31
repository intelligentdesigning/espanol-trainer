// Merge the generated per-theme definition/example files into the two lookup
// files the trainer fetches:
//   public/data/theme-details.json     (Spanish topics, keyed by accent-stripped word)
//   public/data/de/theme-details.json  (German topics, keyed by the German word)
// Run: node scripts/build-theme-details.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "scripts", "vendor", "themedetails");
mkdirSync(join(ROOT, "public", "data", "de"), { recursive: true });

const key = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const need = ["defEs", "defDe", "defEn", "exEs", "exDe", "exEn"];

const out = { es: {}, de: {} };
let files = 0, entries = 0, skipped = 0;

if (existsSync(SRC)) {
  for (const f of readdirSync(SRC).filter((f) => /^(es|de)-.+\.json$/.test(f))) {
    const lang = f.slice(0, 2);
    let obj;
    try { obj = JSON.parse(readFileSync(join(SRC, f), "utf8")); } catch { console.log("BAD:", f); continue; }
    files++;
    for (const [word, d] of Object.entries(obj)) {
      if (!d || need.some((k) => typeof d[k] !== "string" || !d[k].trim())) { skipped++; continue; }
      out[lang][key(word)] = {
        defEs: d.defEs.trim(), defDe: d.defDe.trim(), defEn: d.defEn.trim(),
        exEs: d.exEs.trim(), exDe: d.exDe.trim(), exEn: d.exEn.trim(),
      };
      entries++;
    }
  }
}

writeFileSync(join(ROOT, "public", "data", "theme-details.json"), JSON.stringify(out.es));
writeFileSync(join(ROOT, "public", "data", "de", "theme-details.json"), JSON.stringify(out.de));
console.log(`theme-details: ${files} Dateien | ES ${Object.keys(out.es).length} · DE ${Object.keys(out.de).length} Einträge` + (skipped ? ` | unvollständig übersprungen: ${skipped}` : ""));
