// German cardinal numbers — spell a number in words ("eintausendzweihundert-
// vierunddreißig") and check typed answers. Pure + unit-testable; mirrors the
// Spanish speller in lib/numbers-es.ts.

const ONES = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun",
  "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

/** 1..999 as one German word. A final 1 is "eins" (101 → einhunderteins) — except
 *  right before a scale word ("eintausend"), which is what `beforeScale` marks. */
function under1000(n: number, beforeScale: boolean): string {
  let out = "";
  const h = Math.floor(n / 100), r = n % 100;
  if (h > 0) out += (h === 1 ? "ein" : ONES[h]) + "hundert";
  if (r === 0) return out;
  if (r < 20) {
    out += r === 1 ? (beforeScale ? "ein" : "eins") : ONES[r];
    return out;
  }
  const t = Math.floor(r / 10), u = r % 10;
  if (u === 0) return out + TENS[t];
  // 21 → einundzwanzig (units first, joined by "und")
  return out + (u === 1 ? "ein" : ONES[u]) + "und" + TENS[t];
}

const SCALES: { value: bigint; sg: string; pl: string }[] = [
  { value: BigInt("1000000000000000000"), sg: "eine Trillion", pl: "Trillionen" },
  { value: BigInt("1000000000000000"), sg: "eine Billiarde", pl: "Billiarden" },
  { value: BigInt("1000000000000"), sg: "eine Billion", pl: "Billionen" },
  { value: BigInt("1000000000"), sg: "eine Milliarde", pl: "Milliarden" },
  { value: BigInt(1000000), sg: "eine Million", pl: "Millionen" },
];

/** Spell a non-negative integer in German. */
export function spellGerman(n: bigint): string {
  if (n === BigInt(0)) return "null";
  if (n < BigInt(0)) return `minus ${spellGerman(-n)}`;

  const parts: string[] = [];
  let rest = n;
  for (const s of SCALES) {
    if (rest >= s.value) {
      const cnt = rest / s.value;
      rest = rest % s.value;
      parts.push(cnt === BigInt(1) ? s.sg : `${spellGerman(cnt)} ${s.pl}`);
    }
  }
  // below a million everything is written as ONE word
  let small = "";
  const r = Number(rest);
  if (r >= 1000) {
    const th = Math.floor(r / 1000);
    small += (th === 1 ? "ein" : under1000(th, true)) + "tausend";
    const u = r % 1000;
    if (u > 0) small += under1000(u, false);
  } else if (r > 0) {
    small = under1000(r, false);
  }
  if (small) parts.push(small);
  return parts.join(" ");
}

const normWords = (s: string) =>
  s.toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/[\s-]+/g, "")   // spelling as one word or with spaces/hyphens both fine
    .trim();

/** Accept the spelled-out answer (umlaut/ß-tolerant, spacing-insensitive). */
export function checkGermanWords(input: string, n: bigint): boolean {
  const got = normWords(input);
  if (!got) return false;
  const canon = normWords(spellGerman(n));
  if (got === canon) return true;
  // "eins" vs "ein" at the very end (einundzwanzig stays untouched)
  return got.replace(/eins$/, "ein") === canon.replace(/eins$/, "ein");
}

/** Parse typed digits (ignoring . , and spaces) into a BigInt, or null. */
export function parseDigitsDe(input: string): bigint | null {
  const cleaned = input.replace(/[.,\s]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  try { return BigInt(cleaned); } catch { return null; }
}
