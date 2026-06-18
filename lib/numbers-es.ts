// Spanish cardinal numbers — spell a number in words ("mil doscientos treinta
// y cuatro") and check typed answers. Long scale (billón = 10^12). Used by the
// numbers trainer; pure + unit-testable.

const UNITS = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const TENS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const HUNDREDS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

// "uno" apocopates to "un" before a noun (un millón, veintiún mil).
const apoc = (w: string) => (w === "uno" ? "un" : w === "veintiuno" ? "veintiún" : w);

function spell2(n: number, apo: boolean): string {
  if (n === 0) return "";
  if (n < 30) return apo ? apoc(UNITS[n]) : UNITS[n];
  const t = Math.floor(n / 10), u = n % 10;
  if (u === 0) return TENS[t];
  return `${TENS[t]} y ${u === 1 ? (apo ? "un" : "uno") : UNITS[u]}`;
}

function spell3(n: number, apo: boolean): string {
  if (n === 0) return "";
  const h = Math.floor(n / 100), r = n % 100;
  if (h === 0) return spell2(r, apo);
  const hw = h === 1 ? (r === 0 ? "cien" : "ciento") : HUNDREDS[h];
  const rw = spell2(r, apo);
  return rw ? `${hw} ${rw}` : hw;
}

function spell6(n: number, apo: boolean): string {
  if (n === 0) return "";
  const th = Math.floor(n / 1000), u = n % 1000;
  const thStr = th === 0 ? "" : th === 1 ? "mil" : `${spell3(th, true)} mil`;
  const uStr = spell3(u, apo);
  return thStr ? (uStr ? `${thStr} ${uStr}` : thStr) : uStr;
}

/** Spell a non-negative integer in Spanish (up to ~10^24). */
export function spellSpanish(n: bigint): string {
  if (n === BigInt(0)) return "cero";
  if (n < BigInt(0)) return `menos ${spellSpanish(-n)}`;
  const M = BigInt(1000000);
  const units = Number(n % M);
  const millones = Number((n / M) % M);
  const billones = Number((n / (M * M)) % M);
  const trillones = Number((n / (M * M * M)) % M);
  const parts: string[] = [];
  if (trillones > 0) parts.push(`${spell6(trillones, true)} ${trillones === 1 ? "trillón" : "trillones"}`);
  if (billones > 0) parts.push(`${spell6(billones, true)} ${billones === 1 ? "billón" : "billones"}`);
  if (millones > 0) parts.push(`${spell6(millones, true)} ${millones === 1 ? "millón" : "millones"}`);
  if (units > 0) parts.push(spell6(units, false));
  return parts.join(" ");
}

const normWords = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Accept the spelled-out answer (accent-insensitive, tolerant of un/uno + spacing). */
export function checkNumberWords(input: string, n: bigint): boolean {
  const canon = normWords(spellSpanish(n));
  const got = normWords(input);
  if (!got) return false;
  if (got === canon) return true;
  // tolerate the un/uno apocope either way (e.g. "veintiun" vs "veintiuno")
  const loosen = (s: string) => s.replace(/\buno\b/g, "un").replace(/\bveintiuno\b/g, "veintiun");
  return loosen(got) === loosen(canon);
}

/** Parse typed digits (ignoring . , and spaces) into a BigInt, or null. */
export function parseDigits(input: string): bigint | null {
  const cleaned = input.replace(/[.,\s]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  try {
    return BigInt(cleaned);
  } catch {
    return null;
  }
}

/** Group digits with thousands separators for display: 1234567 → "1.234.567". */
export function groupDigits(n: bigint): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
