// Export the TEACHING material of every grammar lesson into one input file per
// lesson, so the test-question generator can ground each question strictly in
// what that lesson actually teaches. Reads the current committed content.
//
// Run: node scripts/build-gramin.mjs   →   scripts/vendor/gramin2/{topic|tense}-<id>.json

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "scripts", "vendor", "gramin2");
mkdirSync(OUT, { recursive: true });

// start clean so a renamed/removed lesson never leaves a stale input behind
for (const f of readdirSync(OUT).filter((f) => /\.json$/.test(f))) unlinkSync(join(OUT, f));

const topics = JSON.parse(readFileSync(join(ROOT, "content", "topics.json"), "utf8"));
const tenses = JSON.parse(readFileSync(join(ROOT, "content", "tenses.json"), "utf8"));

// keep only the teaching fields (rules + examples); drop the old practice arrays
const rule = (r) => ({
  title: r.title,
  body: r.body,
  examples: (r.examples || []).map((e) => ({ es: e.es, gloss: e.gloss, ...(e.note ? { note: e.note } : {}) })),
});

let n = 0;
for (const t of topics) {
  const doc = {
    kind: "topic",
    id: t.id,
    name: t.name,
    summary: t.summary,
    rules: (t.rules || []).map(rule),
  };
  writeFileSync(join(OUT, `topic-${t.id}.json`), JSON.stringify(doc, null, 1));
  n++;
}
for (const z of tenses) {
  const doc = {
    kind: "tense",
    id: z.id,
    name: z.name,
    mood: z.mood,
    summary: z.summary,
    rules: (z.rules || []).map(rule),
    ...(z.endings ? { endings: z.endings } : {}),
    examples: (z.examples || []).map((e) => ({ es: e.es, gloss: e.gloss, ...(e.note ? { note: e.note } : {}) })),
  };
  writeFileSync(join(OUT, `tense-${z.id}.json`), JSON.stringify(doc, null, 1));
  n++;
}

console.log(`build-gramin: wrote ${n} lesson inputs to scripts/vendor/gramin2/ (${topics.length} topics + ${tenses.length} tenses)`);
