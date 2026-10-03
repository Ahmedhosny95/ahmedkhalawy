# cloud-008 — portfolio hero prototype (public seed only)

Immersive, original CSS/SVG hero around Ahmed's approved public portrait (`public/assets/ahmed-portraits-20261001/ahmed-hero.webp`)
with truthful public seed copy, followed by the career chronology and work index to show continuity. No renderer library,
no third-party images, no remote fonts. The scene is decorative and is not company evidence.

## Files
- `src/tokens.css` — **adaptation surface**: scene colours, ink, display size/weight, motion durations/easing.
- `src/hero.css` — the hero component (layers, entrance, ambient motion, responsive cropping, fallbacks).
- `src/Hero.tsx` + `src/Scene.tsx` — reusable component; all readable text and actions are in server HTML.
- `src/Page.tsx`, `src/page.css` — following sections (career, work, contact/CV note).
- `scripts/build.mjs` — SSR first HTML + hydrating bundle to `dist/` (gitignored). `scripts/serve.mjs` — loopback server.

## Commands (from the repository root)
```
node experiments/cloud-008-hero/scripts/build.mjs
npx tsc -p experiments/cloud-008-hero/tsconfig.json
node experiments/cloud-008-hero/scripts/serve.mjs                 # http://127.0.0.1:4318
cd experiments/cloud-008-hero && npx playwright test -c playwright.config.ts
```
Every test run creates `evidence/run-<UTC>-<random hex>/` and refuses an existing or non-empty directory.
