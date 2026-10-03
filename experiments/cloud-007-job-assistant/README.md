# cloud-007 — recruiter job-description assistant (synthetic prototype)

Optional side assistant for a portfolio: the recruiter pastes one job post; the assistant extracts requirements as exact
source spans, maps each to caller-supplied evidence, writes an evidence-conditional summary and suggests a short route through
relevant cases — without reordering the portfolio. **All persona, case, evidence and job-description data are synthetic.**

## Core module (`src/core`, pure TypeScript, no DOM/network)
```ts
import {createJobParser, analyze, summarize} from './src/core';
const parse = createJobParser({adapter /* optional ParseAdapter */, timeoutMs: 8000});
const parsed = await parse(pastedText, {signal});          // adapter receives ONLY {text, maxRequirements}
const analysis = analyze(parsed, scopedEvidence, caseOrder); // local; inputs never mutated
const lines = summarize(analysis, 'en' | 'ar');
```
- `ParseAdapter = ({text, maxRequirements}, {signal}) => Promise<{requirements: {start, end, category, status}[]}>`.
  Output is validated: exact in-bounds single-line spans, known enums, no overlap, ≤24; negated/instruction-like spans are
  rejected and credentials are re-derived locally from the span. Invalid output, errors and timeouts fall back to `parseLocal`.
- Requirement: `{id, text, start, end, category, status, concepts, years?, credential}` with `text === boundedText.slice(start, end)`.
- Bounds: 12,000 characters (cut at a line break when possible) and 24 requirements, both reported in `truncated`.
- Credentials are only satisfied by evidence of kind `credential` with the same credential concept; training, practice and
  `challenge` (problem-description) evidence never prove possession. Years/education/language/location need explicit evidence.
- Stable ordering: evidence and route ties keep the caller's original order; the portfolio order is never changed.

## Commands (from the repository root; installed dependencies only)
```
node experiments/cloud-007-job-assistant/scripts/build.mjs
npx tsc -p experiments/cloud-007-job-assistant/tsconfig.json
node experiments/cloud-007-job-assistant/scripts/serve.mjs        # http://127.0.0.1:4317 (loopback)
cd experiments/cloud-007-job-assistant && npx playwright test -c playwright.config.ts   # unit + browser
```
Each test run creates a NEW `evidence/run-<UTC>-<random hex>/` and refuses an existing or non-empty directory
(`C007_EVIDENCE=<existing empty dir>` to choose it yourself). The fixture report: bundle `scripts/fixture-report.ts` with
esbuild and run it with an output path (see HANDOFF.ar.md).
