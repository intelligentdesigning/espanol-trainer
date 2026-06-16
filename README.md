# Español Trainer

A bilingual (DE/EN) Spanish learning web app — vocabulary quizzes, a conjugation trainer,
and a full grammar reference. Built with Next.js (static export), TypeScript and Tailwind CSS.
Progress is stored locally in the browser (IndexedDB) — no account, no backend.

## Features
- **Vokabular** — typed quizzes by category (most common words, verbs, nouns, adjectives),
  with direction (type Spanish / type English) and difficulty. Each word shows a Spanish
  definition + example sentence (with translation) after you answer.
- **Konjugationstrainer** — every tense, with difficulty tiers and per-answer explanations.
- **Grammatik** — all tenses and 23 topics with rules, examples and solvable practice.
- **Buch-Trainer** — vocabulary from a coursebook glossary, by unit.
- **Vokabelheft** — your own word list with an accent helper.

## Develop
```bash
npm install
npm run dev      # http://localhost:3000
```

## Build (static export)
```bash
npm run build    # runs the data pipeline + next build → ./out
```

## Deploy (Netlify)
Build command `npm run build`, publish directory `out` (see `netlify.toml`).
Connected to GitHub → every push auto-deploys.
