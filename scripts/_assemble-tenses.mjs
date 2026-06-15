// Assembles content/tenses.json from:
//  - scripts/_tense-content.json  (workflow prose output: [{id, summary, rules, examples}])
//  - scripts/tense-ref.json       (validated endings tables)
//  - metadata below (names, moods, order, which are six-person/practiceable)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const ref = JSON.parse(readFileSync(join(dir, "tense-ref.json"), "utf8"));
const prose = JSON.parse(readFileSync(join(dir, "_tense-content.json"), "utf8"));
const byId = Object.fromEntries(prose.map((p) => [p.id, p]));

const META = {
  "presente": { de: "Präsens (presente)", en: "Present (presente)", sde: "Präsens", sen: "Present", mde: "Indikativ", men: "Indicative" },
  "preterito-imperfecto": { de: "Imperfekt (pretérito imperfecto)", en: "Imperfect (pretérito imperfecto)", sde: "Imperfekt", sen: "Imperfect", mde: "Indikativ", men: "Indicative" },
  "preterito-indefinido": { de: "Indefinido (pretérito indefinido)", en: "Preterite (pretérito indefinido)", sde: "Indefinido", sen: "Preterite", mde: "Indikativ", men: "Indicative" },
  "preterito-perfecto": { de: "Perfekt (pretérito perfecto)", en: "Present perfect (pretérito perfecto)", sde: "Perfekt", sen: "Present perfect", mde: "Indikativ", men: "Indicative" },
  "pluscuamperfecto": { de: "Plusquamperfekt (pluscuamperfecto)", en: "Past perfect (pluscuamperfecto)", sde: "Plusquamperfekt", sen: "Past perfect", mde: "Indikativ", men: "Indicative" },
  "futuro": { de: "Futur (futuro simple)", en: "Future (futuro simple)", sde: "Futur", sen: "Future", mde: "Indikativ", men: "Indicative" },
  "futuro-perfecto": { de: "Futur II (futuro perfecto)", en: "Future perfect (futuro perfecto)", sde: "Futur II", sen: "Future perfect", mde: "Indikativ", men: "Indicative" },
  "condicional": { de: "Konditional (condicional)", en: "Conditional (condicional)", sde: "Konditional", sen: "Conditional", mde: "Indikativ", men: "Indicative" },
  "condicional-perfecto": { de: "Konditional II (condicional perfecto)", en: "Conditional perfect (condicional perfecto)", sde: "Konditional II", sen: "Conditional perfect", mde: "Indikativ", men: "Indicative" },
  "subjuntivo-presente": { de: "Subjuntivo Präsens", en: "Present subjunctive", sde: "Subj. Präsens", sen: "Pres. subjunctive", mde: "Subjuntivo", men: "Subjunctive" },
  "subjuntivo-imperfecto": { de: "Subjuntivo Imperfekt", en: "Imperfect subjunctive", sde: "Subj. Imperfekt", sen: "Imp. subjunctive", mde: "Subjuntivo", men: "Subjunctive" },
  "subjuntivo-perfecto": { de: "Subjuntivo Perfekt", en: "Present perfect subjunctive", sde: "Subj. Perfekt", sen: "Perf. subjunctive", mde: "Subjuntivo", men: "Subjunctive" },
  "subjuntivo-pluscuamperfecto": { de: "Subjuntivo Plusquamperfekt", en: "Pluperfect subjunctive", sde: "Subj. Plusqu.", sen: "Pluperf. subjunctive", mde: "Subjuntivo", men: "Subjunctive" },
  "imperativo": { de: "Imperativ (imperativo)", en: "Imperative (imperativo)", sde: "Imperativ", sen: "Imperative", mde: "Imperativ", men: "Imperative" },
  "gerundio": { de: "Gerundium (gerundio)", en: "Gerund (gerundio)", sde: "Gerundium", sen: "Gerund", mde: "Infinite Form", men: "Non-finite" },
  "participio": { de: "Partizip (participio)", en: "Past participle (participio)", sde: "Partizip", sen: "Participle", mde: "Infinite Form", men: "Non-finite" },
};

const ORDER = Object.keys(META);
const NON_SIX = new Set(["imperativo", "gerundio", "participio"]);

const out = [];
const missing = [];
for (const id of ORDER) {
  const m = META[id];
  const p = byId[id];
  if (!p) { missing.push(id); continue; }
  const topic = {
    id,
    name: { de: m.de, en: m.en },
    shortName: { de: m.sde, en: m.sen },
    mood: { de: m.mde, en: m.men },
    summary: p.summary,
    rules: p.rules,
    examples: p.examples,
    available: true,
  };
  const endings = ref[id]?.endings;
  if (endings) {
    topic.endings = { label: { de: "Regelmäßige Endungen", en: "Regular endings" }, ar: endings.ar, er: endings.er, ir: endings.ir };
  }
  if (!NON_SIX.has(id)) topic.practiceTenseKey = id;
  out.push(topic);
}

writeFileSync(join(dir, "..", "content", "tenses.json"), JSON.stringify(out, null, 1));
console.log(`assembled ${out.length}/${ORDER.length} tenses -> content/tenses.json`);
if (missing.length) console.log("MISSING prose for:", missing.join(", "));
// quick validation: every rule has examples; every LocalizedText has de+en
let probs = 0;
for (const t of out) {
  const lts = [t.name, t.shortName, t.mood, t.summary, ...t.rules.flatMap((r) => [r.title, r.body])];
  for (const lt of lts) if (!lt?.de || !lt?.en) { probs++; }
  for (const r of t.rules) if (!r.examples?.length) probs++;
}
console.log(probs ? `WARN ${probs} content issues` : "content shape OK");
