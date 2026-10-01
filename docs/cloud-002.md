# cloud-002: review fixes (R1–R4)

Follows Codex review of `413e06b`. Historical cloud-001 docs/evidence (`docs/cloud-001.md`, `evidence/*`, `evidence/screenshots`, `evidence/logs`) are **unchanged** apart from a pointer note. All new results are under `evidence/cloud-002/` and are **fresh reruns** of the full suite, not relabelled old results. Same branch/PR; public-only boundary kept; nothing deployed or merged; WebKit download not retried.

## Results (Linux, Chromium only)
`npm run typecheck` ok · `npm run build` ok · `npm run test:browser` **81 passed, 0 failed** (cloud-001 had 70; +11 new) · `npm run perf` completed with 0 observed external requests. Logs: `evidence/cloud-002/logs/`, JSON: `evidence/cloud-002/playwright-results.json`, `perf-baseline.json`.

## R1 — serve.mjs Windows entry check
- Cause: `import.meta.url === \`file://${process.argv[1]}\`` is false for Windows drive paths and any path needing URL-encoding, so the CLI exited 0 without listening.
- Fix: compare `realpathSync(argv[1])` with `realpathSync(fileURLToPath(import.meta.url))`.
- Same-class path handling also fixed: request paths are now normalised with `path.posix` (the OS `normalize` would have turned `/private` into `\private` on Windows and bypassed the protected-route 404s), joined from segments, and confined to the root (`..%5c` traversal → 404); `build.mjs` uses `dirname` instead of a `/` regex.
- Test `tests/serve-cli.spec.ts`: spawns its own server (`PORT=0`), checks 200 on loopback, 404s (traversal, `/api`, `/private/x`), 405 on POST, noindex header, kills only that child. Second test runs the CLI from a path containing spaces and `#` (a Linux proxy for the Windows failure).
- Failing-before: old `serve.mjs` → spaces/# test fails with "exited early with code 0" (`logs/R1-before-old-entry-check.txt`); after: passes (`R1-after.txt`). The plain-path CLI test passes on Linux with the old code too, so it does not reproduce on Linux by itself.
- **Windows not executed here**; Codex to verify on Node 24 / Windows.

## R2 — outbound guard on every context
- New `scripts/guard.mjs`: `BROWSER_ARGS` (DNS rule + dead local proxy `127.0.0.1:9` for IP literals), `installGuard` (route interception: any non-`127.0.0.1` host, and any method other than GET/HEAD/OPTIONS, aborted before network I/O and recorded; WebSockets closed), and `observeGuard`.
- Tests: the default `context` fixture is guarded; extra contexts must come from the `newContext` fixture (JS-disabled, reflow, reduced-motion converted). `tests/guard.spec.ts` proves, interception-only, that an external hostname (`.invalid`), IPv4 `203.0.113.9`, IPv6 `2001:db8::1`, POST/PUT/DELETE/PATCH are all blocked in both the default and an extra context, and a source scan fails if tests use `browser.newContext/newPage` or perf drops its guard.
- Perf: Playwright interception disables the HTTP cache (repeat loads became identical to cold in a first attempt), so perf uses **passive observation** plus the launch-args layer and exits non-zero if any non-loopback request is observed (0 observed). The observer is tested against a locally aborted request.
- Not proven: the launch-args layer (DNS rule, dead proxy) was not independently tested because that would mean sending a real request; only interception and observation are tested. `request`-fixture API calls are loopback-only by `baseURL`, not routed through the guard. Failing-before for R2 is by inspection of the old code (unguarded `browser.newContext` in 4 tests and `perf.mjs`), not a runnable test.

## R3 — handoff restoration by identity
- `src/prerender-handoff.js`: `<details>` keyed by scope (ancestor nav/section/details labels) + summary text; focus keyed by tag, href, name, aria-label, text and scope. Stored open **and closed** state; restored only when the key is **unique** in both shell and client; otherwise nothing is changed (no guess). `captureState/restoreState` exported; first-HTML failure fallback untouched (shell stays if client not ready/failed).
- `tests/handoff.spec.ts` (adapter/source tests, not production shell): reorder+insert, closed state with client default open, missing target, ambiguous duplicate, focus after insertion with same-text links in different navs, and fallback.
- Failing-before: against the cloud-001 positional implementation 5 of 6 fail (`logs/R3-before-positional-handoff.txt`); all pass now. Cloud-001 D2/D3 e2e tests still pass.

## R4 — zoom relabel
Tests/titles/comments now say **reflow + high-DPI proxy (NOT real browser zoom)** (640x400 @DPR2 and 320 px). **Actual browser zoom (Ctrl +/- or OS zoom) remains untested.** DPR and viewport halving are not equivalent to browser zoom.

## Remaining gaps
- Windows execution unverified; WebKit not run (blocked download, unchanged); real zoom, physical devices, screen readers, production shell/client routing, real Contact/CV delivery, field performance: all untested.
- cloud-001 perf/test numbers remain as originally recorded; cloud-002 perf rerun (same profile; medians Home cold LCP 892 ms, repeat 588 ms; About 876/600) agrees but is a single new run on one machine.
- Cost: UI-reported ~$2 used of $100 per the reviewer; not visible to this session.
