// Build the German-mode data files from the generated word/lesson sets:
//   public/data/de/themes.json   (thematic A1 vocabulary, DE↔EN)
//   public/data/de/articles.json (der/die/das trainer, derived from the nouns)
//   public/data/de/grammar.json  (A1 lessons: rules + practice)
// Run: node scripts/build-de.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "scripts", "vendor", "de");
const OUT = join(ROOT, "public", "data", "de");
mkdirSync(OUT, { recursive: true });

const POS = new Set(["noun", "verb", "adj", "adv", "phrase", "other"]);
const CEFR = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const norm = (s) => s.toLowerCase().replace(/^(der|die|das)\s+/, "").trim();

// theme order + bilingual names (ids must match the generated file names)
const THEMES = [
  ["begruessung", "Begrüßung & Vorstellen", "Greetings & introductions"],
  ["familie", "Familie", "Family"],
  ["zahlen-zeit", "Zeit & Datum", "Time & date"],
  ["farben", "Farben", "Colours"],
  ["essen-trinken", "Essen & Trinken", "Food & drink"],
  ["restaurant", "Restaurant", "Restaurant"],
  ["wohnen", "Wohnen & Haushalt", "Home & household"],
  ["koerper-gesundheit", "Körper & Gesundheit", "Body & health"],
  ["kleidung", "Kleidung", "Clothing"],
  ["einkaufen", "Einkaufen", "Shopping"],
  ["stadt-wege", "Stadt & Wegbeschreibung", "City & directions"],
  ["verkehr-reisen", "Verkehr & Reisen", "Transport & travel"],
  ["arbeit-berufe", "Arbeit & Berufe", "Work & professions"],
  ["schule-lernen", "Schule & Lernen", "School & learning"],
  ["freizeit-hobbys", "Freizeit & Hobbys", "Leisure & hobbies"],
  ["wetter-natur", "Wetter & Natur", "Weather & nature"],
  ["alltag-tagesablauf", "Alltag & Tagesablauf", "Everyday routine"],
  ["gefuehle-charakter", "Gefühle & Charakter", "Feelings & character"],
  ["technik-medien", "Technik & Medien", "Technology & media"],
  ["zahlen-mengen", "Zahlen & Mengen", "Numbers & quantities"],
];

// ---------- themes ----------
const cleanWord = (w) => {
  if (!w || typeof w.de !== "string" || typeof w.en !== "string") return null;
  const de = w.de.trim(), en = w.en.trim();
  if (!de || !en) return null;
  const out = { es: de, de: en, en };           // reuse the shared trainer shape: es = prompt word
  if (POS.has(w.pos)) out.pos = w.pos;
  out.gender = ["m", "f", "n"].includes(w.gender) ? w.gender : null;
  if (typeof w.plural === "string" && w.plural.trim()) out.plural = w.plural.trim();
  out.cefr = CEFR.has(w.cefr) ? w.cefr : "A1";
  return out;
};

const meta = [], byTheme = {}, nouns = [];
for (const [id, de, en] of THEMES) {
  const p = join(SRC, "themes", `${id}.json`);
  if (!existsSync(p)) { console.log("FEHLT Thema:", id); continue; }
  let arr;
  try { arr = JSON.parse(readFileSync(p, "utf8")); } catch { console.log("BAD Thema:", id); continue; }
  const seen = new Set();
  const entries = arr.map(cleanWord).filter((e) => e && !seen.has(norm(e.es)) && seen.add(norm(e.es)));
  if (!entries.length) continue;
  byTheme[id] = entries;
  meta.push({ id, name: { de, en }, count: entries.length });
  for (const e of entries) if (e.pos === "noun" && e.gender) nouns.push(e);
}
writeFileSync(join(OUT, "themes.json"), JSON.stringify({ themes: meta, byTheme }));

// ---------- articles (der/die/das) derived from the nouns ----------
const ART = { m: "der", f: "die", n: "das" };
const seenNoun = new Set();
const articles = [];
for (const n of nouns) {
  const bare = n.es.replace(/^(der|die|das)\s+/i, "").trim();
  const key = norm(bare);
  if (!bare || seenNoun.has(key)) continue;
  seenNoun.add(key);
  articles.push({ es: bare, article: ART[n.gender], irregular: false, en: n.en, cefr: n.cefr });
}
writeFileSync(join(OUT, "articles.json"), JSON.stringify(articles));

// ---------- grammar lessons ----------
const lessons = [];
const gdir = join(SRC, "grammar");
if (existsSync(gdir)) {
  for (const f of readdirSync(gdir).filter((f) => /\.json$/.test(f))) {
    let o;
    try { o = JSON.parse(readFileSync(join(gdir, f), "utf8")); } catch { console.log("BAD Lektion:", f); continue; }
    if (!o || !o.id || !Array.isArray(o.rules)) { console.log("SKIP Lektion:", f); continue; }
    // normalise practice items to the shared PracticeItem shape
    const practice = (o.practice || []).filter((it) => {
      if (!it || (it.kind !== "choice" && it.kind !== "fill")) return false;
      if (typeof it.prompt !== "string" || !/_{2,}/.test(it.prompt)) return false;
      if (typeof it.answer !== "string" || !it.answer.trim()) return false;
      if (!it.explain || !it.explain.de || !it.explain.en) return false;
      if (it.kind === "choice") {
        if (!Array.isArray(it.options) || it.options.length < 2) return false;
        if (!it.options.includes(it.answer)) return false;
      }
      return true;
    });
    lessons.push({ ...o, cefr: CEFR.has(o.cefr) ? o.cefr : "A1", practice });
  }
}
// keep a sensible teaching order
const ORDER = ["artikel", "nomen-plural", "personalpronomen", "praesens-regelmaessig", "sein-haben",
  "praesens-unregelmaessig", "modalverben", "wortstellung", "w-fragen", "negation",
  "akkusativ", "dativ", "possessivartikel", "trennbare-verben", "perfekt"];
lessons.sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99));
writeFileSync(join(OUT, "grammar.json"), JSON.stringify(lessons));

console.log(`de/themes.json:   ${meta.length} Themen, ${meta.reduce((a, m) => a + m.count, 0)} Wörter`);
console.log(`de/articles.json: ${articles.length} Nomen (der/die/das)`);
console.log(`de/grammar.json:  ${lessons.length} Lektionen, ${lessons.reduce((a, l) => a + l.practice.length, 0)} Testfragen`);
