// Splice the Georgian UI strings (/tmp/ka-strings.json) into lib/i18n/strings.ts
// as a third `ka: { … }` block, keyed exactly like the English one.
// Run: node scripts/add-ka-strings.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "lib", "i18n", "strings.ts");

const ka = JSON.parse(readFileSync("/tmp/ka-strings.json", "utf8"));
let src = readFileSync(FILE, "utf8");

if (/^\s{2}ka:\s*\{/m.test(src)) {
  console.log("ka-Block existiert bereits — wird ersetzt.");
  src = src.replace(/\n {2}ka: \{[\s\S]*?\n {2}\},(?=\n\} satisfies)/, "");
}

// the English block defines the canonical key set + order
const enStart = src.indexOf("\n  en: {");
const enEnd = src.indexOf("\n  },", enStart);
const enBlock = src.slice(enStart, enEnd);
const keys = [...enBlock.matchAll(/^\s{4}"([^"]+)":/gm)].map((m) => m[1]);

const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
let missing = 0;
const lines = keys.map((k) => {
  const v = ka[k];
  if (v == null || String(v).trim() === "") { missing++; return `    "${k}": ${JSON.stringify(String(ka[k] ?? ""))},`; }
  return `    "${k}": "${esc(v)}",`;
});

const block = `\n  ka: {\n${lines.join("\n")}\n  },`;
src = src.replace(/\n\} satisfies Record<Locale, Record<string, string>>;/, `${block}\n} satisfies Record<Locale, Record<string, string>>;`);
writeFileSync(FILE, src);

const extra = Object.keys(ka).filter((k) => !keys.includes(k));
console.log(`ka-Block eingefügt: ${keys.length} Keys` + (missing ? ` | LEER: ${missing}` : "") + (extra.length ? ` | unbekannte Keys ignoriert: ${extra.length}` : ""));
