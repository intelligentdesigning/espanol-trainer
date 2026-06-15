// Generates ground-truth conjugation reference for content authoring.
// Output: scripts/tense-ref.json  (forms + correct endings tables, from the library)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pkg from "@jirimracek/conjugate-esp";

const { Conjugator } = pkg;
const c = new Conjugator();
const g = (v) => c.conjugateSync(v)[0].conjugation;

const SAMPLE = ["hablar", "comer", "vivir", "ser", "estar", "ir", "tener", "hacer", "poder", "decir", "querer", "dormir"];
const conj = Object.fromEntries(SAMPLE.map((v) => [v, g(v)]));

// six-person tense id -> library accessor
const SIX = {
  "presente": (x) => x.Indicativo.Presente,
  "preterito-imperfecto": (x) => x.Indicativo.PreteritoImperfecto,
  "preterito-indefinido": (x) => x.Indicativo.PreteritoIndefinido,
  "futuro": (x) => x.Indicativo.FuturoImperfecto,
  "condicional": (x) => x.Indicativo.CondicionalSimple,
  "preterito-perfecto": (x) => x.Indicativo.PreteritoPerfecto,
  "pluscuamperfecto": (x) => x.Indicativo.PreteritoPluscuamperfecto,
  "futuro-perfecto": (x) => x.Indicativo.FuturoPerfecto,
  "condicional-perfecto": (x) => x.Indicativo.CondicionalCompuesto,
  "subjuntivo-presente": (x) => x.Subjuntivo.Presente,
  "subjuntivo-imperfecto": (x) => x.Subjuntivo.PreteritoImperfectoRa,
  "subjuntivo-perfecto": (x) => x.Subjuntivo.PreteritoPerfecto,
  "subjuntivo-pluscuamperfecto": (x) => x.Subjuntivo.PreteritoPluscuamperfectoRa,
};
const COMPOUND = new Set(["preterito-perfecto", "pluscuamperfecto", "futuro-perfecto", "condicional-perfecto", "subjuntivo-perfecto", "subjuntivo-pluscuamperfecto"]);
const ATTACH_INF = new Set(["futuro", "condicional"]); // endings attach to the whole infinitive

function endingOf(form, inf, attachInf) {
  const base = attachInf ? inf : inf.slice(0, -2);
  return form.startsWith(base) ? form.slice(base.length) : form;
}

const ref = {};
for (const [id, acc] of Object.entries(SIX)) {
  const verbs = Object.fromEntries(SAMPLE.map((v) => [v, acc(conj[v])]));
  let endings = null;
  if (!COMPOUND.has(id)) {
    const attach = ATTACH_INF.has(id);
    endings = {
      ar: acc(conj.hablar).map((f) => "-" + endingOf(f, "hablar", attach)),
      er: acc(conj.comer).map((f) => "-" + endingOf(f, "comer", attach)),
      ir: acc(conj.vivir).map((f) => "-" + endingOf(f, "vivir", attach)),
    };
  }
  ref[id] = { kind: COMPOUND.has(id) ? "compound" : "simple", endings, verbs };
}

// non-finite + imperative
ref["gerundio"] = { kind: "gerundio", verbs: Object.fromEntries(SAMPLE.map((v) => [v, conj[v].Impersonal.Gerundio])) };
ref["participio"] = {
  kind: "participio",
  verbs: Object.fromEntries([...SAMPLE, "ver", "escribir", "abrir", "volver", "poner", "romper"].map((v) => [v, g(v).Impersonal.Participio])),
};
ref["imperativo"] = {
  kind: "imperative",
  verbs: Object.fromEntries(SAMPLE.map((v) => [v, { afirmativo: conj[v].Imperativo.Afirmativo, negativo: conj[v].Imperativo.Negativo }])),
};

const out = join(dirname(fileURLToPath(import.meta.url)), "tense-ref.json");
writeFileSync(out, JSON.stringify(ref, null, 1));
console.log("wrote", out, "tenses:", Object.keys(ref).length);
console.log("sample endings preterito-indefinido:", JSON.stringify(ref["preterito-indefinido"].endings));
console.log("sample futuro endings:", JSON.stringify(ref["futuro"].endings));
console.log("participio irregulars:", ref["participio"].verbs.hacer, ref["participio"].verbs.decir, ref["participio"].verbs.ver, ref["participio"].verbs.escribir, ref["participio"].verbs.volver);
