# cloud-003: validation evidence correction

## Why
The reporter file `evidence/cloud-002/playwright-results.json` is a **stale focused-run artifact**: stats expected=8, unexpected=1, skipped=0, started 2026-10-01T14:20:24.956Z, covering only guard/handoff/serve-cli (its one failure was the old source scan matching its own file, fixed afterwards). It does **not** support the "81 passed" statement in `docs/cloud-002.md`, `evidence/cloud-002/summary.json` and `evidence/cloud-002/logs/test-browser.txt`. Those files are kept unmodified as historical record; the 81-test claim is established only by this cloud-003 run. Cloud-001 files are likewise unchanged.

## Tested source
- **Tested source commit: `f1ee8b3c8419e0403723e36324723442628a8301`** (clean tree; `git status` showed nothing outside `evidence/cloud-003/`). The commit that adds this document and the evidence is a report-only commit on top and is **not** the tested source; it contains no source/test changes.
- Environment: Linux, Node v22.22.0, Playwright 1.56.1, Chromium only. WebKit not run (download blocked, not retried). Windows not run in this environment (owner verified the serve CLI separately).

## Commands and results
```
npm run build                      # exit 0  -> evidence/cloud-003/build-console.txt
npx tsc --noEmit -p .              # exit 0  -> evidence/cloud-003/typecheck-console.txt (empty)
PW_JSON=evidence/cloud-003/playwright-results.json SHOTS_DIR=evidence/cloud-003/screenshots npx playwright test
                                   # exit 0  -> evidence/cloud-003/test-console.txt, test-exit-status.txt
node scripts/verify-report.mjs evidence/cloud-003/playwright-results.json evidence/cloud-003/test-console.txt
                                   # exit 0  -> evidence/cloud-003/report-verification.json
```
Disclosure: a first attempt of the full run used `--reporter=list`, which overrode the config and wrote no JSON; its console output was discarded and the full suite was run again once with the config reporters. Only the second run's artifacts are kept (passed both times).

Counts come from the reporter JSON (not hand-written): expected 81, unexpected 0, skipped 0, flaky 0. Per file: defects 3, guard 3, handoff 6, harness 67, serve-cli 2 (webkit-smoke excluded because WebKit is not installed). The JSON test count (81), `playwright test --list` (81) and the console summary (81 passed) agree (`report-verification.json`, `"agree": true`).

## Artifact SHA-256
```
2106e4f8091e2e54460a43c61acc4d0b0cc24335474ed2388d8de94e916ec754  evidence/cloud-003/playwright-results.json
d68ed450f06245ccce0e76398b62b799ca859d697b7266bcd5abc06464391ca0  evidence/cloud-003/test-console.txt
19eaf43821a7660ec323a87c8457bf74823beb296c39f5e01aa8a683aa50f061  evidence/cloud-003/test-exit-status.txt
d168142971d800f23dc194768cc060987eadf347470c80c79f01e63f001b0886  evidence/cloud-003/build-console.txt
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  evidence/cloud-003/typecheck-console.txt
1c80d5242ad513a1cbbfc5cbec70480563fba86f317830e711edc1606e48793f  evidence/cloud-003/report-verification.json
c43862c16c398acdc34f4f9785f4c5a88c724a3cb3322a35d17270e9ebd12523  scripts/verify-report.mjs
```

## Continuing limits
Chromium-only emulation of an adapter harness: no WebKit/Safari, no real browser zoom (reflow/high-DPI proxy only), no physical devices or screen readers, no production shell/routing, no real Contact/CV delivery, no field performance. Launch-argument network layers remain untested by design. Perf figures were not re-run here.
