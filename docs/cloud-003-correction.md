# cloud-003 correction (verifier repair)

Base: `d5c91a10009a1627f5130bc4c2f12df077648bba`. No browser-suite or performance rerun; the cloud-003 raw artifacts (`evidence/cloud-003/*`, tested source `f1ee8b3…`) are untouched.

1. **Correction to cloud-003's preservation claim.** The first verifier ran `playwright test --list` with the configured JSON reporter, which overwrote `evidence/cloud-002/playwright-results.json` with a listing-only report (expected 0, skipped 81) in `d5c91a1`. So the statement that the cloud-002 file was preserved was **false at `d5c91a1`**. This commit restores that file byte-for-byte from `62af8eed102c96dba3585d191fb036cde7254bf3` (verified with `cmp`). It remains the stale focused run (expected 8, unexpected 1) described in `docs/cloud-003.md`; the history is not rewritten.
2. **Verifier repair (`scripts/verify-report.mjs`).** It now runs `process.execPath` on the locally resolved `@playwright/test/cli` (no npx, shell or network), with `--list --project=chromium --reporter=list`: a non-writing reporter, and Chromium only so an optional WebKit install cannot change the count. The previous Windows failure was `spawnSync npx ENOENT`; this was **not** run on Windows by me, Codex will check it there.
3. **Verification of the verifier only** (Linux, Node v22.22.0) against the existing cloud-003 JSON and log: exit 0, reportTests 81, listedByCommand 81, consolePassed 81, agree true (`evidence/cloud-003-correction/report-verification-rerun.json`, `verifier-exit-status.txt`). All 51 tracked files under `evidence/` and `docs/` were hashed before and after the listing: identical (`tracked-evidence-docs-sha256-before-and-after-listing.txt`, taken after the restore).

Note: the SHA-256 of `scripts/verify-report.mjs` recorded in `docs/cloud-003.md` is for the earlier version that produced the cloud-003 verification file. The repaired version is `dbdb102bdd0af71b8c3e74b4ff40900f19646e4a4df46647488654ca537a6199`. The cloud-003 test run itself is unchanged.

Limits as before: Chromium only, no WebKit, Windows not run here, no real browser zoom, devices, screen readers, production shell or field performance.
