// Fold vocab-audit corrections (scripts/vendor/audit/{v,b}-out-*.json) into the
// es-keyed fixes files. Hand-authored fixes already present are kept (audit only
// ADDS new es it didn't already cover). Run: node scripts/merge-audit.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUD = join(__dirname, "vendor", "audit");
const FIELDS = ["defEs", "defDe", "defEn", "exEs", "exDe", "exEn"];
const ok = (d) => d && typeof d.es === "string" && d.es.trim() && FIELDS.every((k) => typeof d[k] === "string" && d[k].trim());

function collect(prefix) {
  const out = [];
  for (const f of readdirSync(AUD).filter((f) => new RegExp(`^${prefix}-out-\\d+\\.json$`).test(f))) {
    try {
      const arr = JSON.parse(readFileSync(join(AUD, f), "utf8"));
      if (Array.isArray(arr)) out.push(...arr.filter(ok));
    } catch (e) { console.log("skip", f, e.message); }
  }
  return out;
}

function apply(fixPath, corrections) {
  const fixes = JSON.parse(readFileSync(fixPath, "utf8"));
  let added = 0, kept = 0;
  for (const c of corrections) {
    if (fixes[c.es]) { kept++; continue; } // keep hand-authored / earlier fix
    fixes[c.es] = Object.fromEntries(FIELDS.map((k) => [k, c[k].trim()]));
    added++;
  }
  writeFileSync(fixPath, JSON.stringify(fixes, null, 1));
  return { added, kept, total: Object.keys(fixes).length };
}

const v = collect("v");
const b = collect("b");
const vr = apply(join(__dirname, "vendor", "details-fixes.json"), v);
const br = apply(join(__dirname, "vendor", "buch-details-fixes.json"), b);

console.log("=== merge-audit report ===");
console.log(`vocab corrections found: ${v.length} → added ${vr.added}, kept ${vr.kept} existing (fixes total ${vr.total})`);
console.log(`buch  corrections found: ${b.length} → added ${br.added}, kept ${br.kept} existing (fixes total ${br.total})`);
console.log("Sample vocab fixes:", v.slice(0, 8).map((c) => c.es).join(", "));
console.log("Sample buch fixes: ", b.slice(0, 8).map((c) => c.es).join(", "));
