// Merge authored grammar test questions (scripts/vendor/gramout/*.json) into the
// committed content: content/topics.json (replace each topic's `practice`) and
// content/tenses.json (add a `practice` field per tense). Validates every item.
//
// Run: node scripts/merge-grammar.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "scripts", "vendor", "gramout");

const isText = (x) => typeof x === "string" && x.trim().length > 0;
const isLoc = (x) => x && isText(x.de) && isText(x.en);

/** Validate + normalize one PracticeItem; return null if unusable. */
function clean(it) {
  if (!it || (it.kind !== "choice" && it.kind !== "fill")) return null;
  if (!isText(it.prompt) || !isText(it.answer) || !isLoc(it.explain)) return null;
  const out = { kind: it.kind, prompt: it.prompt.trim(), answer: it.answer.trim(), explain: { de: it.explain.de.trim(), en: it.explain.en.trim() } };
  if (isLoc(it.promptGloss)) out.promptGloss = { de: it.promptGloss.de.trim(), en: it.promptGloss.en.trim() };
  if (it.kind === "choice") {
    if (!Array.isArray(it.options) || it.options.length < 2) return null;
    const opts = it.options.map((o) => String(o).trim()).filter(Boolean);
    if (!opts.some((o) => o.toLowerCase() === out.answer.toLowerCase())) return null;
    out.options = opts;
  } else if (Array.isArray(it.altAnswers)) {
    const alts = it.altAnswers.map((a) => String(a).trim()).filter(Boolean);
    if (alts.length) out.altAnswers = alts;
  }
  return out;
}

function loadItems(name) {
  const arr = JSON.parse(readFileSync(join(OUT, `${name}.json`), "utf8"));
  if (!Array.isArray(arr)) throw new Error("not an array");
  const items = arr.map(clean).filter(Boolean);
  return { items, raw: arr.length };
}

const files = readdirSync(OUT).filter((f) => /\.json$/.test(f)).map((f) => f.replace(/\.json$/, ""));
const topics = JSON.parse(readFileSync(join(ROOT, "content", "topics.json"), "utf8"));
const tenses = JSON.parse(readFileSync(join(ROOT, "content", "tenses.json"), "utf8"));

const report = [];
let missing = [];

for (const t of topics) {
  const name = `topic-${t.id}`;
  if (!files.includes(name)) { missing.push(name); continue; }
  const { items, raw } = loadItems(name);
  if (items.length) { t.practice = items; report.push(`${name}: ${items.length}/${raw}`); }
  else missing.push(name + " (0 valid)");
}
for (const z of tenses) {
  const name = `tense-${z.id}`;
  if (!files.includes(name)) { missing.push(name); continue; }
  const { items, raw } = loadItems(name);
  if (items.length) { z.practice = items; report.push(`${name}: ${items.length}/${raw}`); }
  else missing.push(name + " (0 valid)");
}

writeFileSync(join(ROOT, "content", "topics.json"), JSON.stringify(topics, null, 1));
writeFileSync(join(ROOT, "content", "tenses.json"), JSON.stringify(tenses, null, 1));

const totalQ = report.reduce((a, r) => a + Number(r.split(": ")[1].split("/")[0]), 0);
console.log("=== merge-grammar report ===");
console.log(`lessons merged: ${report.length}/${topics.length + tenses.length}`);
console.log(`total questions: ${totalQ}`);
if (missing.length) console.log("MISSING/EMPTY:", missing.join(", "));
else console.log("all lessons covered ✓");
