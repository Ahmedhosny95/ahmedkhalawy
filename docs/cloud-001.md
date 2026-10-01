# cloud-001 checkpoint: public-only harness

Base `88bca46`. Scope is the public seed only; no production shell, backend, real CV, or credentials. Emulation/adapter results here are **not** physical-phone, screen-reader, production-shell or field-performance acceptance, and no overall score is given.

## Commands
```
npm ci
npm run build          # esbuild bundle + SSR first HTML for /, /about, /projects -> dist/public
npm run typecheck      # tsc --noEmit
npm run test:browser   # build + Playwright (Chromium); serves 127.0.0.1:4173 only
npm run test:webkit    # WebKit smoke, only if WebKit is installed
npm run perf           # 3 cold + 3 repeat Home/About -> evidence/perf-baseline.json
```
Results: `npm ci` (clean) pass; build pass; typecheck pass; Chromium **70 passed, 0 failed**; WebKit **not run** (see gaps).

## What is what
- **Source components** (tested via the adapter): Home, About, Work pages, recommendations/skills, portrait, public CSS, `metadata-runtime`, `prerender-handoff`.
- **Adapter-only** (new, approximates the production shell): `PublicLayout`/`Link` (native anchors, `<details>` menu), `public-adapter.css`, `public-entry.tsx`, `public-routes.tsx`, `render-routes.tsx`, `scripts/`. No client router: navigation is full-document.
- **Static fixtures**: `/contact` (old utility-class snapshot, no scripts, disabled submit, no backend), `/private` inert noindex page, `/documents/ahmed-khalawy-cv.pdf` generated PDF labelled TEST FIXTURE (its size differs from the "85 KB" label in source; delivery of the real CV is unproven).

## Harness design
First HTML is React-SSR'd at build time into `#public-prerender`; `#root` is `inert` until `prerender-handoff.js` swaps it. Server binds `127.0.0.1`, refuses POST, 404s `/admin /review /api` and deeper `/private`. Tests abort any non-loopback request or POST (and Chromium resolves only 127.0.0.1) and fail if one is attempted.

## Coverage (Chromium)
Home/About/Work + Contact at 375x812, 390x844, 768x1024, 1440x900 (no horizontal overflow, h1 visible); JS enabled / disabled / delayed / failed; raw first-HTML content; title, canonical, description, JSON-LD (jobTitle, Arabic alternateName) vs approved metadata; `/private` noindex header and REP matching (terminal `$`, longest rule); metadata cleanup outside allowlist; direct entry, nav, back/forward, `#credentials`/`#career`/`#recommendations` anchors incl. direct hash entry; skip link, mobile menu, disclosure by keyboard, focus outline; 640x400@2x (200% of 1280) and 320px reflow; axe wcag2a/2aa/21/22aa serious+critical; factual guardrails (Arabic name, Yuksel Saudia Mar 2025–Present, Eibla ending Mar 2025, ProDigi separate, manager roles as opportunities sought, training vs registration, 22 attributed recommendations, "not official employer endorsements"); CV link contract + fixture download; reduced motion (0 running animations); Contact contract (email/phone/LinkedIn present, submit disabled, no form action, no scripts).

## Defects fixed (3, each failing before / passing after: `tests/defects.spec.ts`, `evidence/logs/defects-*.txt`)
1. **D1 contrast** – `.op-system-row>span` (#73806d on #e7ebdf = 3.44:1) and `.op-index` (#8b7958; 3.67–4.15:1) failed AA. Colours changed to #5a675f / #74603a (≥4.9:1). `public/styles/public-optimization.css` (colour only).
2. **D2 state loss** – a menu/disclosure opened before JS finished was closed when React replaced the shell. `src/prerender-handoff.js` now carries `details` open state.
3. **D3 focus loss** – focus fell to `<body>` at handoff. Handoff now restores focus to the equivalent element.
No copy, facts, layout or design changed.

## Lab baseline (Chromium (Playwright build 1194), 390x844 @2x, 1.6 Mbps/150 ms RTT, 4x CPU, loopback, 3 runs, medians; uncompressed transfer)
| Route | Load | LCP ms | CLS | Bytes | Long tasks (count / ms) |
|---|---|---|---|---|---|
| Home | cold | 892 | 0 | 440,521 | 2 / 289 |
| Home | repeat | 584 | 0 | 297,930 | 2 / 256 |
| About | cold | 864 | 0 | 482,151 | 4 / 491 |
| About | repeat | 612 | 0 | 321,580 | 4 / 492 |

Fonts (local, `font-display: optional`): on **cold** loads the first paint (and LCP) uses system fallback (Liberation Serif/Sans) although the three woff2 files finish loading; on **repeat** loads Lora (headings) and Manrope (body) are used. Repeat bytes stay high because the harness server sends no ETag/compression and the 265 KB uncompressed React bundle is re-fetched. `prefers-reduced-motion`: no running animations. Not changed: no evidence it is a defect in production; flagged for owner review. Runs are in `evidence/perf-baseline.json`.

## Evidence
`evidence/summary.json`, `evidence/perf-baseline.json`, `evidence/playwright-results.json`, `evidence/logs/`, `evidence/screenshots/` (Home/About/Work/Contact at 375 and 1440).

## Remaining acceptance gaps
- **WebKit smoke not run**: browser download blocked (HTTP 403 on both Playwright hosts, 2 attempts). `tests/webkit-smoke.spec.ts` is ready; no Safari evidence exists.
- No physical devices, screen readers (axe is automated only), real keyboard/zoom on production browsers, or field/CrUX data.
- Production shell, client routing, real Contact form/challenge, real CV delivery and server headers/robots are unverified; Contact visuals are not production-faithful and its axe `target-size` findings are a fixture limitation.
- Perf is adapter-only lab data: no compression/CDN, one machine, one throttling profile; handoff re-renders the whole page (2–4 long tasks, 0.26–0.49 s at 4x CPU) and cold loads show fallback fonts.
- Cost: provider spend not exposed to this session — unknown.
