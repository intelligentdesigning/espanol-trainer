// Build public/data/themes.json from the generated theme word lists.
// Run: node scripts/build-themes.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "scripts", "vendor", "themesout");
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const VALIDC = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const cefr = existsSync(join(ROOT, "scripts", "vendor", "cefr.json"))
  ? JSON.parse(readFileSync(join(ROOT, "scripts", "vendor", "cefr.json"), "utf8")) : {};

// order + bilingual names + icon key for each theme
const THEMES = [
  ["vida-cotidiana", "Alltag", "Everyday life", "IconCards"],
  ["casa-hogar", "Haushalt & Zuhause", "Home & household", "IconShapes"],
  ["colores", "Farben", "Colours", "IconLetters"],
  ["comida-bebida", "Essen & Trinken", "Food & drink", "IconBookOpen"],
  ["restaurante", "Restaurant", "Restaurant", "IconBookOpen"],
  ["familia", "Familie", "Family", "IconNotebook"],
  ["cuerpo-salud", "Körper & Gesundheit", "Body & health", "IconShapes"],
  ["ropa", "Kleidung", "Clothing", "IconLetters"],
  ["deportes", "Sport", "Sports", "IconConjugate"],
  ["viajes-transporte", "Reisen & Verkehr", "Travel & transport", "IconArrowRight"],
  ["tiempo-clima", "Wetter & Zeit", "Weather & time", "IconCards"],
  ["trabajo-profesiones", "Arbeit & Berufe", "Work & professions", "IconConjugate"],
  ["ciudad", "Stadt & Orte", "City & places", "IconShapes"],
  ["naturaleza-animales", "Natur & Tiere", "Nature & animals", "IconBook"],
  ["compras", "Einkaufen", "Shopping", "IconCards"],
  ["tecnologia", "Technik & Medien", "Technology & media", "IconConjugate"],
  ["escuela-educacion", "Schule & Bildung", "School & education", "IconBook"],
  ["emociones", "Gefühle & Charakter", "Feelings & character", "IconLetters"],
  ["hobbys-ocio", "Hobbys & Freizeit", "Hobbies & leisure", "IconNotebook"],
  ["fiestas", "Feste & Feiern", "Festivities", "IconCards"],
  ["describir-personas", "Personen beschreiben", "Describing people", "IconLetters"],
  ["direcciones", "Wegbeschreibung", "Directions", "IconArrowRight"],
];

const POS = new Set(["verb", "noun", "adj", "adv", "pron", "prep", "conj", "art", "num", "interj", "phrase", "name", "other"]);
const clean = (e) => {
  if (!e || typeof e.es !== "string" || typeof e.de !== "string") return null;
  const es = e.es.trim(), de = e.de.trim();
  if (!es || !de) return null;
  const out = { es, de, en: (e.en || "").trim() };
  if (POS.has(e.pos)) out.pos = e.pos;
  out.gender = e.gender === "m" || e.gender === "f" ? e.gender : null;
  const c = VALIDC.has(e.cefr) ? e.cefr : cefr[norm(es)];
  if (VALIDC.has(c)) out.cefr = c;
  return out;
};

const meta = [], byTheme = {};
for (const [id, de, en, icon] of THEMES) {
  const p = join(DIR, `${id}.json`);
  if (!existsSync(p)) { console.log("FEHLT:", id); continue; }
  let arr;
  try { arr = JSON.parse(readFileSync(p, "utf8")); } catch { console.log("BAD:", id); continue; }
  const seen = new Set();
  const entries = arr.map(clean).filter((e) => e && !seen.has(norm(e.es)) && seen.add(norm(e.es)));
  if (!entries.length) { console.log("LEER:", id); continue; }
  byTheme[id] = entries;
  meta.push({ id, name: { de, en }, count: entries.length, icon });
}

writeFileSync(join(ROOT, "public", "data", "themes.json"), JSON.stringify({ themes: meta, byTheme }));
console.log(`themes.json: ${meta.length} Themen, ${meta.reduce((a, m) => a + m.count, 0)} Wörter`);
