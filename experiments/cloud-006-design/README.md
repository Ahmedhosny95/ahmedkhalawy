# cloud-006 design & motion prototype (public-only)

Isolated React prototype for Home, About, Projects (Work) and Contact, plus a four-page A4 CV **layout specimen**.
Facts come only from the approved public seed (`/src/*.ts`, `fixtures/public-html/contact.html`); interface copy and
clearly marked placeholders are new. Not the production site, not Ahmed's final CV. Arabic handoff: `HANDOFF.ar.md`.

## Commands (run from the repository root; uses already-installed dependencies, no root files changed)
```
node experiments/cloud-006-design/scripts/build.mjs          # SSR first HTML for 4 routes + client bundle -> experiments/cloud-006-design/dist
npx tsc -p experiments/cloud-006-design/tsconfig.json        # typecheck (strict)
node experiments/cloud-006-design/scripts/serve.mjs          # http://127.0.0.1:4316 (loopback only; reuses scripts/serve.mjs)
cd experiments/cloud-006-design && npx playwright test -c playwright.config.ts   # browser tests + evidence
```
Each run writes everything (reporter JSON, timelines, screenshots, PDF, video) to a NEW `evidence/cloud-006b-<UTC run id>/`
(override with `C006_EVIDENCE=evidence/cloud-006b-<name>`); earlier evidence is never overwritten or merged.
Original cloud-006 evidence (`evidence/prototype-*`) and `HANDOFF.ar.md` are kept as history; corrections: `HANDOFF-006b.ar.md`. The root harness, its config and its
historical JSON reports are untouched; do **not** run the root suite to regenerate this evidence.

## Structure
- `src/content.ts` — re-exports seed facts; prototype-only copy (no new facts).
- `src/router.tsx` — History-API routing, Back/Forward scroll restoration, focus to `h1` after navigation.
- `src/App.tsx` — shell, header, animated mobile menu, restrained reveals; `src/pages.tsx` — the four routes; `src/ui.tsx` — portrait, CV state, links.
- `src/styles.css` — tokens (colour, type, space, **motion**: `--dur-1..4`, `--ease-*`, reduced-motion overrides).
- `src/render.tsx` + `scripts/build.mjs` — build-time SSR; `src/client.tsx` hydrates (`hydrateRoot`), so first HTML is final.
- `cv-specimen/` — A4 print specimen (public facts + `[bracketed placeholders]`).
- `tests/prototype.spec.ts` — layout, hydration, keyboard, routing, motion timelines, reduced motion, axe, CV print, video.
- `evidence/` — all files prefixed `prototype-` are prototype evidence from the local Chromium.
