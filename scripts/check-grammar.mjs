// Sanity-check the merged grammar tests in content/topics.json + content/tenses.json.
// Flags: jargon/German in the Spanish prompt, missing blank, item count out of 15-20,
// choice answer not in options, missing bilingual explain/gloss.
//
// Run AFTER merge: node scripts/check-grammar.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const topics = JSON.parse(readFileSync(join(ROOT, "content", "topics.json"), "utf8"));
const tenses = JSON.parse(readFileSync(join(ROOT, "content", "tenses.json"), "utf8"));

// German grammar jargon / German-only letters that must NOT appear in a Spanish prompt
const JARGON = /Komparativ|Superlativ|Adverb|Adjektiv|Bedingung|Reflexiv|Pronomen|Anrede|Akzent|Indikativ|Konjunktiv|Imperativ|Partizip|Genus|Numerus|direkte Frage|Befehl|Verneinung|Vergangenheit|Gegenwart|Zukunft|mit Tilde|ohne Tilde|[äößÄÖ]/;

let lessons = 0, items = 0, problems = 0;
const warn = (where, msg) => { problems++; console.log(`  ⚠ ${where}: ${msg}`); };

function checkLesson(kind, id, practice) {
  lessons++;
  const n = (practice || []).length;
  items += n;
  if (n < 15 || n > 20) console.log(`  • ${kind}-${id}: ${n} items (außerhalb 15-20)`);
  (practice || []).forEach((it, i) => {
    const at = `${kind}-${id}#${i}`;
    if (!/_{2,}/.test(it.prompt || "")) warn(at, `keine Lücke ___ im prompt: "${it.prompt}"`);
    if (JARGON.test(it.prompt || "")) warn(at, `Jargon/Deutsch im prompt: "${it.prompt}"`);
    if (!(it.explain && it.explain.de && it.explain.en)) warn(at, "explain.de/en fehlt");
    if (!(it.promptGloss && it.promptGloss.de && it.promptGloss.en)) warn(at, "promptGloss.de/en fehlt");
    if (it.kind === "choice") {
      // exact membership: choice is compared byte-for-byte at runtime
      if (!(it.options || []).includes(it.answer)) warn(at, `answer "${it.answer}" nicht EXAKT in options`);
      // for case/accent questions: distractor differing only by case is the point — fine.
    }
  });
}

console.log("=== grammar test check ===");
for (const t of topics) checkLesson("topic", t.id, t.practice);
for (const z of tenses) checkLesson("tense", z.id, z.practice);
console.log(`\nLektionen: ${lessons} | Fragen: ${items} | Probleme: ${problems}`);
process.exit(problems ? 1 : 0);
