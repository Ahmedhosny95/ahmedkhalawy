import {defineConfig, devices} from '@playwright/test';
import {existsSync, mkdirSync, readdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
// @ts-ignore plain-JS module shared with the root harness
import {BROWSER_ARGS} from '../../scripts/guard.mjs';
const PORT = 4318;
// Fresh, collision-checked evidence directory per run (random suffix); refuses existing/non-empty directories.
if (process.env.C008_EVIDENCE_CHECKED !== '1') {
  if (!process.env.C008_EVIDENCE) {
    const dir = `evidence/run-${new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '')}-${randomBytes(4).toString('hex')}`;
    if (existsSync(dir)) throw new Error('evidence directory collision: ' + dir);
    mkdirSync(dir); process.env.C008_EVIDENCE = dir;
  } else if (!existsSync(process.env.C008_EVIDENCE) || readdirSync(process.env.C008_EVIDENCE).length) {
    throw new Error('C008_EVIDENCE must name an existing EMPTY directory; refusing to overwrite evidence');
  }
  process.env.C008_EVIDENCE_CHECKED = '1';
}
const EV = process.env.C008_EVIDENCE;
export default defineConfig({
  testDir: 'tests', timeout: 60_000, retries: 0, workers: 1,
  reporter: [['list'], ['json', {outputFile: `${EV}/results.json`}]],
  outputDir: '../../test-results/cloud-008',
  use: {baseURL: `http://127.0.0.1:${PORT}`, serviceWorkers: 'block', trace: 'off'},
  webServer: {command: 'node scripts/serve.mjs', env: {PORT: String(PORT)}, url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: false, timeout: 20_000},
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome'], launchOptions: {args: BROWSER_ARGS}}}],
});
