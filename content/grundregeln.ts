import type { GrammarSection } from "@/lib/types";

export const grundregeln: GrammarSection = {
  id: "grundregeln",
  title: { de: "Grundregeln", en: "Foundations" },
  intro: {
    de: "Aussprache, Betonung und Schreibregeln – die Basis. Jede Regel mit Beispiel.",
    en: "Pronunciation, stress and spelling – the basics. Every rule with an example.",
  },
  rules: [
    {
      id: "vokale",
      title: { de: "Die 5 Vokale", en: "The 5 vowels" },
      body: {
        de: "Spanisch hat 5 reine, immer gleich klingende Vokale: a, e, i, o, u. Sie werden kurz und klar gesprochen – keine Diphthong-Verschleifung wie im Deutschen/Englischen.",
        en: "Spanish has 5 pure vowels that always sound the same: a, e, i, o, u. Short and clear – no gliding like in English.",
      },
      examples: [
        { es: "casa", gloss: { de: "Haus", en: "house" }, note: { de: "a wie in „Vater“", en: "a as in “father”" } },
        { es: "mesa", gloss: { de: "Tisch", en: "table" } },
        { es: "uno", gloss: { de: "eins", en: "one" } },
      ],
    },
    {
      id: "c-z",
      title: { de: "c und z", en: "c and z" },
      body: {
        de: "c vor e/i und z klingen wie stimmloses „s“ (in Spanien wie englisches „th“). c vor a/o/u klingt wie „k“.",
        en: "c before e/i and z sound like a soft “s” (in Spain like English “th”). c before a/o/u sounds like “k”.",
      },
      examples: [
        { es: "cinco", gloss: { de: "fünf", en: "five" }, note: { de: "ci = „si/thi“", en: "ci = “si/thi”" } },
        { es: "zapato", gloss: { de: "Schuh", en: "shoe" } },
        { es: "casa", gloss: { de: "Haus", en: "house" }, note: { de: "ca = „ka“", en: "ca = “ka”" } },
      ],
    },
    {
      id: "g-j",
      title: { de: "g, j und gu/gü", en: "g, j and gu/gü" },
      body: {
        de: "g vor e/i und j klingen rau (wie deutsches „ch“ in „Bach“). Für hartes „g“ vor e/i schreibt man gu (das u ist stumm); soll das u klingen, schreibt man ü: güe/güi.",
        en: "g before e/i and j sound harsh (like the “ch” in Scottish “loch”). For a hard “g” before e/i write gu (silent u); to pronounce the u, write ü: güe/güi.",
      },
      examples: [
        { es: "gente", gloss: { de: "Leute", en: "people" }, note: { de: "ge = raues „che“", en: "ge = harsh “he”" } },
        { es: "guitarra", gloss: { de: "Gitarre", en: "guitar" }, note: { de: "gu = hartes „gi“, u stumm", en: "gu = hard “gi”, silent u" } },
        { es: "pingüino", gloss: { de: "Pinguin", en: "penguin" }, note: { de: "ü wird gesprochen", en: "the ü is pronounced" } },
      ],
    },
    {
      id: "h-muda",
      title: { de: "Das stumme h", en: "The silent h" },
      body: {
        de: "Das h wird nie gesprochen. Die Kombination ch dagegen klingt wie „tsch“.",
        en: "The letter h is always silent. But the combination ch sounds like English “ch”.",
      },
      examples: [
        { es: "hola", gloss: { de: "hallo", en: "hello" }, note: { de: "klingt „ola“", en: "sounds like “ola”" } },
        { es: "hombre", gloss: { de: "Mann", en: "man" } },
        { es: "muchacho", gloss: { de: "Junge", en: "boy" }, note: { de: "ch = „tsch“", en: "ch = “ch”" } },
      ],
    },
    {
      id: "ll-n-rr",
      title: { de: "ll, ñ und rr", en: "ll, ñ and rr" },
      body: {
        de: "ll klingt wie „j“ (in „ja“). ñ ist ein „nj“ (wie in „Champignon“). rr ist ein gerolltes, kräftiges r.",
        en: "ll sounds like “y” (as in “yes”). ñ is “ny” (as in “canyon”). rr is a strongly rolled r.",
      },
      examples: [
        { es: "llave", gloss: { de: "Schlüssel", en: "key" }, note: { de: "ll = „j“", en: "ll = “y”" } },
        { es: "niño", gloss: { de: "Kind/Junge", en: "child/boy" } },
        { es: "perro", gloss: { de: "Hund", en: "dog" }, note: { de: "rr gerollt – perro ≠ pero", en: "rolled rr – perro ≠ pero" } },
      ],
    },
    {
      id: "b-v",
      title: { de: "b und v klingen gleich", en: "b and v sound the same" },
      body: {
        de: "b und v werden identisch ausgesprochen (beide wie ein weiches „b“). Die Schreibweise muss man sich merken.",
        en: "b and v are pronounced identically (both like a soft “b”). You simply have to memorize the spelling.",
      },
      examples: [
        { es: "vivir", gloss: { de: "leben", en: "to live" }, note: { de: "klingt „bibir“", en: "sounds like “bibir”" } },
        { es: "bueno", gloss: { de: "gut", en: "good" } },
      ],
    },
    {
      id: "betonung",
      title: { de: "Betonungsregeln (agudas/llanas/esdrújulas)", en: "Stress rules" },
      body: {
        de: "Ohne Akzent gilt: Wörter auf Vokal, -n oder -s werden auf der VORLETZTEN Silbe betont (llanas); alle anderen auf der LETZTEN Silbe (agudas). Weicht die Betonung davon ab, steht ein Akzent (tilde). Wörter mit Betonung auf der drittletzten Silbe (esdrújulas) tragen IMMER einen Akzent.",
        en: "Without an accent: words ending in a vowel, -n or -s are stressed on the SECOND-TO-LAST syllable (llanas); all others on the LAST syllable (agudas). If the stress differs, a written accent (tilde) appears. Words stressed on the third-to-last syllable (esdrújulas) ALWAYS carry an accent.",
      },
      examples: [
        { es: "casa", gloss: { de: "Haus", en: "house" }, note: { de: "endet auf Vokal → llana, kein Akzent (CA-sa)", en: "ends in a vowel → llana, no accent (CA-sa)" } },
        { es: "hablar", gloss: { de: "sprechen", en: "to speak" }, note: { de: "endet auf -r → aguda (ha-BLAR)", en: "ends in -r → aguda (ha-BLAR)" } },
        { es: "canción", gloss: { de: "Lied", en: "song" }, note: { de: "endet auf -n, aber letzte Silbe betont → Akzent nötig", en: "ends in -n but stressed on the last syllable → accent needed" } },
        { es: "música", gloss: { de: "Musik", en: "music" }, note: { de: "esdrújula → immer Akzent (MÚ-si-ca)", en: "esdrújula → always an accent (MÚ-si-ca)" } },
      ],
    },
    {
      id: "diakritisch",
      title: { de: "Diakritische Akzente", en: "Diacritical accents" },
      body: {
        de: "Manche kurzen Wörter werden nur durch den Akzent unterschieden – die Bedeutung ändert sich, nicht die Aussprache.",
        en: "Some short words are distinguished only by the accent – it changes the meaning, not the pronunciation.",
      },
      examples: [
        { es: "tú / tu", gloss: { de: "du / dein", en: "you / your" } },
        { es: "él / el", gloss: { de: "er / der (Artikel)", en: "he / the" } },
        { es: "sí / si", gloss: { de: "ja / wenn", en: "yes / if" } },
        { es: "más / mas", gloss: { de: "mehr / aber", en: "more / but" } },
        { es: "qué / que", gloss: { de: "was? / dass", en: "what? / that" } },
      ],
    },
    {
      id: "diphthong",
      title: { de: "Diphthonge und Hiat", en: "Diphthongs and hiatus" },
      body: {
        de: "Schwache Vokale (i, u) bilden mit starken (a, e, o) einen Diphthong = eine Silbe. Ein Akzent auf dem schwachen Vokal trennt die Silben (Hiat).",
        en: "Weak vowels (i, u) combine with strong ones (a, e, o) into a diphthong = one syllable. An accent on the weak vowel splits the syllables (hiatus).",
      },
      examples: [
        { es: "bien", gloss: { de: "gut", en: "well" }, note: { de: "ie = ein Diphthong, eine Silbe", en: "ie = one diphthong, one syllable" } },
        { es: "día", gloss: { de: "Tag", en: "day" }, note: { de: "í trennt: dí-a (zwei Silben)", en: "í splits: dí-a (two syllables)" } },
      ],
    },
    {
      id: "satzzeichen",
      title: { de: "¿ ¡ und Klein­schreibung", en: "¿ ¡ and lowercase" },
      body: {
        de: "Fragen und Ausrufe stehen zwischen umgedrehten und normalen Zeichen: ¿…? ¡…! Wochentage, Monate, Sprachen und Nationalitäten schreibt man klein.",
        en: "Questions and exclamations are framed by inverted and normal marks: ¿…? ¡…! Weekdays, months, languages and nationalities are lowercase.",
      },
      examples: [
        { es: "¿Cómo estás?", gloss: { de: "Wie geht's?", en: "How are you?" } },
        { es: "¡Hola!", gloss: { de: "Hallo!", en: "Hello!" } },
        { es: "lunes, enero, español", gloss: { de: "Montag, Januar, Spanisch – alles klein", en: "Monday, January, Spanish – all lowercase" } },
      ],
    },
  ],
};
