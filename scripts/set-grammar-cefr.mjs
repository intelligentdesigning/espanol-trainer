// Assign an established CEFR level to each grammar lesson (topic + tense).
// Run: node scripts/set-grammar-cefr.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const TENSE = {
  presente: "A1",
  "preterito-perfecto": "A2", "preterito-indefinido": "A2", "preterito-imperfecto": "A2",
  imperativo: "A2", gerundio: "A2", participio: "A2",
  futuro: "B1", condicional: "B1", pluscuamperfecto: "B1", "subjuntivo-presente": "B1",
  "futuro-perfecto": "B2", "condicional-perfecto": "B2", "subjuntivo-imperfecto": "B2", "subjuntivo-perfecto": "B2",
  "subjuntivo-pluscuamperfecto": "C1",
};
const TOPIC = {
  grundregeln: "A1", articulos: "A1", "genero-numero": "A1", "pronombres-sujeto": "A1",
  "hay-estar": "A1", posesivos: "A1", demostrativos: "A1", interrogativos: "A1", negacion: "A1", adjetivos: "A1",
  "ser-estar": "A2", gustar: "A2", adverbios: "A2", comparativo: "A2", preposiciones: "A2",
  conjunciones: "A2", reflexivos: "A2", "saber-conocer": "A2", "a-personal": "A2",
  "pronombres-objeto": "B1", "por-para": "B1", perifrasis: "B1", relativos: "B1", diminutivos: "B1",
};

const patch = (file, map) => {
  const p = join(ROOT, "content", file);
  const arr = JSON.parse(readFileSync(p, "utf8"));
  let hit = 0, miss = [];
  for (const o of arr) { if (map[o.id]) { o.cefr = map[o.id]; hit++; } else miss.push(o.id); }
  writeFileSync(p, JSON.stringify(arr, null, 1));
  console.log(`${file}: ${hit}/${arr.length} eingestuft` + (miss.length ? ` | OHNE: ${miss.join(", ")}` : ""));
};

patch("tenses.json", TENSE);
patch("topics.json", TOPIC);
