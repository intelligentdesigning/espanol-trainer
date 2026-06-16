// Build the app's committed data files from data/master.tsv.
// Run: npm run build:data   (also runs automatically before `next build`)
//
// Output (public/data/): vocab.json, verbs.json, vocab.index.json
// Ports the dedup + frequency priority-anchoring from spanish-quiz-jetpunk/build.py
// and reuses lib/conjugation/engine.js for verb forms + difficulty.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { analyze, difficultyTier } from "../lib/conjugation/engine.mjs";
import pkg from "@jirimracek/conjugate-esp";

const { Conjugator } = pkg;
const conjugator = new Conjugator();

// Map our content tense-ids -> the library's mood/tense fields (all 6-person).
const TENSE_MAP = {
  "presente": (c) => c.Indicativo.Presente,
  "preterito-imperfecto": (c) => c.Indicativo.PreteritoImperfecto,
  "preterito-indefinido": (c) => c.Indicativo.PreteritoIndefinido,
  "futuro": (c) => c.Indicativo.FuturoImperfecto,
  "condicional": (c) => c.Indicativo.CondicionalSimple,
  "preterito-perfecto": (c) => c.Indicativo.PreteritoPerfecto,
  "pluscuamperfecto": (c) => c.Indicativo.PreteritoPluscuamperfecto,
  "futuro-perfecto": (c) => c.Indicativo.FuturoPerfecto,
  "condicional-perfecto": (c) => c.Indicativo.CondicionalCompuesto,
  "subjuntivo-presente": (c) => c.Subjuntivo.Presente,
  "subjuntivo-imperfecto": (c) => c.Subjuntivo.PreteritoImperfectoRa,
  "subjuntivo-perfecto": (c) => c.Subjuntivo.PreteritoPerfecto,
  "subjuntivo-pluscuamperfecto": (c) => c.Subjuntivo.PreteritoPluscuamperfectoRa,
};

function conjugateAll(infinitive) {
  try {
    const res = conjugator.conjugateSync(infinitive);
    if (!res || !res.length) return null;
    return res[0].conjugation;
  } catch {
    return null;
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "data");

const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

// Accurate POS tags from the pos-tag-vocab workflow (es -> pos). Falls back to heuristics.
let posMap = {};
try {
  posMap = JSON.parse(readFileSync(join(__dirname, "vendor", "pos.json"), "utf8"));
} catch {}

// --- 1. parse + dedup -------------------------------------------------------
const raw = readFileSync(join(ROOT, "data", "master.tsv"), "utf8");
const rows = [];
for (const line of raw.split("\n")) {
  if (!line.trim()) continue;
  const parts = line.split("\t");
  if (parts.length !== 3) continue;
  const [es, clue, enAnswers] = parts.map((p) => p.trim());
  rows.push({ es, clue, enAnswers });
}
const byKey = new Map();
const order = [];
for (const r of rows) {
  const k = r.es.toLowerCase();
  if (byKey.has(k)) continue;
  byKey.set(k, r);
  order.push(k);
}

// --- 2. frequency priority anchoring (ported from build.py) -----------------
const PRIORITY = `
de que no a y ser en por con el lo para estar haber tener le el-art uno todo
pero mas hacer o poder decir este ir otro ese si me ya ver porque dar cuando
muy sin vez mucho saber sobre mi alguno mismo yo tu el-pron ella usted nosotros
vosotros ustedes ellos ellas tambien hasta ano dos querer entre asi primero
desde grande eso ni nos os te les llegar pasar tiempo si-yes dia bien poco
deber entonces poner cosa tanto hombre mujer parecer nuestro tan donde ahora
parte despues vida quedar siempre creer hablar llevar dejar nada cada seguir
menos nuevo encontrar algo solo hay mundo tres mujer sentir contar todavia
mientras forma caso gobierno empezar trabajo casa durante tipo buscar quien
gran agua mano problema escribir perder producir historia entrar hora servir
sacar necesitar mantener nombre noche real ejemplo nunca permitir aunque gente
palabra ciudad hijo gustar acabar salir pais joven estado fin entender pensar
aqui mayor caer cabeza guerra puerta verdad ahi empresa relacion calle fuerza
facil abrir tomar posible volver familia mejor politica luego viejo amigo campo
luz recibir conseguir mes accion presidente proceso voz producto cuerpo clase
esperar hecho seguro diferente ultimo crear papel sistema tierra numero explicar
nivel libro estudio mirar presentar escuela falta respuesta base situacion
programa comer junto ofrecer ganar realidad nacional senor modo imagen general
continuar acuerdo usar posicion sangre fuego plan animal ojo edad viento nadie
venir vivir pedir preguntar responder mostrar pagar comprar vender llamar
necesitar conocer aprender ensenar leer jugar correr caminar dormir despertar
cocinar nadar saltar volar cantar bailar reir llorar besar abrazar cerrar
terminar comenzar cambiar ayudar cuidar matar morir nacer crecer subir bajar
llegar entrar levantar sentar trabajar descansar viajar conducir mandar enviar
recordar olvidar imaginar sonar decidir elegir dudar amar odiar gritar
bueno malo alto bajo largo corto rapido lento caliente frio limpio sucio lleno
vacio rico pobre bonito feo claro oscuro duro blando suave seco mojado dulce
fuerte debil importante necesario imposible verdadero falso correcto raro normal
especial igual entero solo-adj feliz triste loco tranquilo amable simpatico
generoso honesto valiente listo inteligente tonto pequeno gordo delgado
arriba abajo adelante atras dentro fuera cerca lejos encima debajo delante
detras aqui-adv alli alla antes despues pronto tarde temprano hoy ayer manana
casi apenas quizas tambien tampoco ademas incluso solamente mal pues
como cuando-q donde-q quien-q cuanto cual porque-q
cero cuatro cinco seis siete ocho nueve diez once doce trece catorce quince
veinte treinta cuarenta cincuenta sesenta setenta ochenta noventa cien mil millon
lunes martes miercoles jueves viernes sabado domingo enero febrero marzo abril
mayo junio julio agosto septiembre octubre noviembre diciembre semana
rojo azul verde amarillo blanco negro gris naranja color
padre madre hermano hermana hijo hija abuelo abuela tio tia primo
nino nina chico chica bebe esposo esposa marido amigo
tú mí ti
idea razon opinion pensamiento sentimiento emocion mentira secreto esperanza
suerte paz miedo amor amistad felicidad alegria tristeza sueno duda pregunta
dinero precio comida bebida pan leche cafe fruta carne ropa zapato coche tren
avion barco bicicleta telefono musica pelicula juego deporte futbol equipo
partido fiesta persona medico hospital profesor estudiante universidad tienda
mercado oficina dinero salud enfermedad dolor medicina cielo sol luna estrella
mar rio montana playa arbol flor lluvia nieve calor frio comida ley derecho
guerra paz ejercito rey reina dios iglesia historia cuento noticia mensaje
carta foto color sonido ruido olor sabor lugar sitio espacio razon tema
problema solucion error exito verdad realidad futuro pasado presente momento
semana fin viaje camino puente parque
`.split(/\s+/).filter(Boolean);

const ALIASES = {
  "el-art": "el", "el-pron": "el", "si-yes": "si", "solo-adj": "solo",
  "aqui-adv": "aqui", "cuando-q": "cuando", "donde-q": "donde",
  "quien-q": "quien", "porque-q": "porque",
};

const normIdx = new Map();
for (const k of order) {
  const n = stripAccents(k);
  if (!normIdx.has(n)) normIdx.set(n, k);
}

const ranked = [];
const used = new Set();
for (const tok of PRIORITY) {
  const k = ALIASES[tok] ?? tok;
  const actual = byKey.has(k) ? k : normIdx.get(stripAccents(k));
  if (actual && !used.has(actual)) {
    ranked.push(actual);
    used.add(actual);
  }
}
for (const k of order) {
  if (!used.has(k)) {
    ranked.push(k);
    used.add(k);
  }
}

// --- 3. POS + gender heuristics --------------------------------------------
const ART = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas", "lo"]);
const PREP = new Set(["de", "a", "en", "con", "por", "para", "sin", "sobre", "entre", "hasta", "desde", "hacia", "según", "bajo", "ante", "tras", "contra", "durante", "mediante"]);
const PRON = new Set(["yo", "tú", "él", "ella", "nosotros", "vosotros", "ellos", "ellas", "usted", "ustedes", "me", "te", "se", "nos", "os", "le", "les", "mí", "ti", "esto", "eso", "aquello", "este", "ese", "aquel", "esta", "esa", "alguien", "nadie", "algo", "nada", "quien", "cuyo", "conmigo", "contigo", "mío", "tuyo", "suyo"]);
const CONJ = new Set(["y", "e", "o", "u", "ni", "pero", "sino", "porque", "aunque", "pues", "que", "si", "mientras"]);
const NUM = new Set(["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa", "cien", "mil", "millón"]);
const INTERJ = new Set(["sí", "no", "hola", "gracias", "adiós"]);

function isVerbEntry(r) {
  const en = `${r.clue} / ${r.enAnswers}`.toLowerCase();
  return /(^|\/ )\s*to /.test(en) && /(ar|er|ir)$/.test(r.es.toLowerCase());
}
function guessPos(r) {
  if (isVerbEntry(r)) return "verb";
  const w = r.es.toLowerCase();
  if (NUM.has(w)) return "num";
  if (ART.has(w)) return "art";
  if (PREP.has(w)) return "prep";
  if (PRON.has(w)) return "pron";
  if (CONJ.has(w)) return "conj";
  if (INTERJ.has(w)) return "interj";
  return "noun"; // best-effort default; refined in a later phase
}
function guessGender(es) {
  const w = es.toLowerCase();
  if (/(ción|sión|dad|tad|tud|umbre|ez|sis)$/.test(w)) return "f";
  if (/ma$/.test(w)) return "m";
  if (/a$/.test(w)) return "f";
  if (/(o|or|aje|én|ón|ente)$/.test(w)) return "m";
  return null;
}
function freqTier(rank) {
  return rank <= 200 ? 1 : rank <= 600 ? 2 : rank <= 1500 ? 3 : 4;
}
const slug = (es) => stripAccents(es.toLowerCase()).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// --- 4. assemble vocab + verbs ---------------------------------------------
const vocab = [];
const verbs = [];
const counts = {};
let verbForms = 0;
const unhandledVerbs = [];

ranked.forEach((k, i) => {
  const r = byKey.get(k);
  const rank = i + 1;
  const pos = posMap[r.es] ?? guessPos(r);
  counts[pos] = (counts[pos] || 0) + 1;
  const en = r.enAnswers.split(" / ").map((s) => s.trim()).filter(Boolean);

  let diff = freqTier(rank);
  if (pos === "verb") {
    const a = analyze(r.es);
    diff = difficultyTier(a.irregularityScore, rank);
    const conj = conjugateAll(r.es);
    if (conj) {
      verbForms++;
      const tenses = {};
      for (const [key, fn] of Object.entries(TENSE_MAP)) tenses[key] = fn(conj);
      verbs.push({
        inf: r.es,
        en: r.clue,
        rank,
        irr: a.irregularityScore,
        tier: diff,
        tenses,
        nonfinite: { gerundio: conj.Impersonal.Gerundio, participio: conj.Impersonal.Participio },
        imperative: { afirmativo: conj.Imperativo.Afirmativo, negativo: conj.Imperativo.Negativo },
      });
    } else {
      unhandledVerbs.push(r.es);
    }
  }

  vocab.push({
    id: slug(r.es),
    es: r.es,
    clue: r.clue,
    en,
    pos,
    gender: pos === "noun" ? guessGender(r.es) : null,
    rank,
    diff,
  });
});

// --- 5. write outputs -------------------------------------------------------
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "vocab.json"), JSON.stringify(vocab));
writeFileSync(join(OUT, "verbs.json"), JSON.stringify(verbs));
const index = {
  total: vocab.length,
  counts,
  verbCount: verbs.length,
  verbsByTier: [1, 2, 3, 4].map((t) => verbs.filter((v) => v.tier === t).length),
};
writeFileSync(join(OUT, "vocab.index.json"), JSON.stringify(index));

// --- 6. quality report ------------------------------------------------------
console.log("=== build-data report ===");
console.log("unique headwords:", vocab.length);
console.log("POS counts:", counts);
console.log("verbs with present-tense forms:", verbForms);
console.log("verbs by difficulty tier [1,2,3,4]:", index.verbsByTier);
if (unhandledVerbs.length) {
  console.log(`verbs excluded from trainer (low confidence): ${unhandledVerbs.length}`);
  console.log("  ", unhandledVerbs.slice(0, 30).join(", "));
}
console.log("\ntenses per verb:", Object.keys(TENSE_MAP).length, "(+ gerundio/participio + imperative)");
console.log("sample conjugations (eyeball check, yo/él/ellos):");
for (const inf of ["hablar", "tener", "ser", "ir", "hacer", "decir", "poder", "dormir", "leer"]) {
  const v = verbs.find((x) => x.inf === inf);
  if (!v) { console.log("  ", inf, "(not in set)"); continue; }
  const p = (t) => `${v.tenses[t][0]}/${v.tenses[t][2]}/${v.tenses[t][5]}`;
  console.log("  ", inf.padEnd(9), "indef:", p("preterito-indefinido").padEnd(26), "fut:", v.tenses.futuro[0].padEnd(10), "subjPres:", v.tenses["subjuntivo-presente"][0].padEnd(10), "part:", v.nonfinite.participio);
}
const MUST = "ser estar tener hacer ir ver dar bueno casa agua uno dos rojo lunes".split(" ");
const present = new Set(vocab.map((v) => v.es.toLowerCase()));
const missing = MUST.filter((w) => !present.has(w));
console.log("\nessential words present:", missing.length ? `MISSING ${missing}` : "OK");
console.log("top 15 by frequency:", vocab.slice(0, 15).map((v) => v.es).join(", "));

// --- 7. Buch-Vokabeln (allango Estudiantes.ELE A1) -> buch.json -------------
try {
  const btsv = readFileSync(join(ROOT, "data", "buch-vokabeln.tsv"), "utf8");
  const bentries = [];
  for (const line of btsv.split("\n").slice(1)) {
    if (!line.trim()) continue;
    const [es, de, lektion] = line.split("\t").map((s) => (s || "").trim());
    if (es && de && lektion) bentries.push({ es, de, lektion });
  }
  const ORDER = ["Para empezar", "Unidad 1", "Unidad 2", "Unidad 3", "Unidad 4", "Unidad 5", "Unidad 6"];
  const present2 = new Set(bentries.map((e) => e.lektion));
  const lektionen = ORDER.filter((l) => present2.has(l)).map((name) => ({
    name,
    count: bentries.filter((e) => e.lektion === name).length,
  }));
  writeFileSync(join(OUT, "buch.json"), JSON.stringify({ lektionen, entries: bentries }));
  console.log("buch.json:", bentries.length, "entries,", lektionen.length, "lektionen");
} catch (e) {
  console.log("buch.json skipped:", e.message);
}

// --- 8. Definitions + example sentences (vocab-enrich workflow) -> details.json
try {
  const details = JSON.parse(readFileSync(join(__dirname, "vendor", "details.json"), "utf8"));
  // keep only ids that exist in the current vocab, drop empty entries
  const ids = new Set(vocab.map((v) => v.id));
  const out = {};
  let kept = 0;
  for (const [id, d] of Object.entries(details)) {
    if (!ids.has(id) || !d || !d.defEs || !d.exEs) continue;
    out[id] = { defEs: d.defEs, defDe: d.defDe, defEn: d.defEn, exEs: d.exEs, exDe: d.exDe, exEn: d.exEn };
    kept++;
  }
  writeFileSync(join(OUT, "details.json"), JSON.stringify(out));
  const coverage = ((kept / vocab.length) * 100).toFixed(1);
  console.log(`details.json: ${kept}/${vocab.length} words (${coverage}% coverage)`);
} catch (e) {
  console.log("details.json skipped:", e.message);
}

// --- 9. Coursebook definitions + examples (buch-enrich workflow) -> buch-details.json
try {
  const bdetails = JSON.parse(readFileSync(join(__dirname, "vendor", "buch-details.json"), "utf8"));
  const buch = JSON.parse(readFileSync(join(OUT, "buch.json"), "utf8"));
  const keys = new Set(buch.entries.map((e) => stripAccents(e.es).toLowerCase().trim()));
  const out = {};
  let kept = 0;
  for (const [k, d] of Object.entries(bdetails)) {
    if (!keys.has(k) || !d || !d.defEs || !d.exEs) continue;
    out[k] = { defEs: d.defEs, defDe: d.defDe, defEn: d.defEn, exEs: d.exEs, exDe: d.exDe, exEn: d.exEn };
    kept++;
  }
  writeFileSync(join(OUT, "buch-details.json"), JSON.stringify(out));
  console.log(`buch-details.json: ${kept}/${keys.size} unique words (${((kept / keys.size) * 100).toFixed(1)}% coverage)`);
} catch (e) {
  console.log("buch-details.json skipped:", e.message);
}
