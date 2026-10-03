import {defineConfig, devices} from '@playwright/test';
// @ts-ignore plain-JS module shared with the root harness
import {BROWSER_ARGS} from '../../scripts/guard.mjs';
const PORT = 4316;
// Every run writes to its own new evidence directory, so partial reruns can never mix with earlier results.
process.env.C006_EVIDENCE ??= `evidence/cloud-006b-${new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '')}`;
const EV = process.env.C006_EVIDENCE;
export default defineConfig({
  testDir: 'tests', timeout: 60_000, retries: 0, workers: 1,
  reporter: [['list'], ['json', {outputFile: `${EV}/results.json`}]],
  outputDir: '../../test-results/cloud-006',
  use: {baseURL: `http://127.0.0.1:${PORT}`, serviceWorkers: 'block', trace: 'off'},
  webServer: {command: 'node scripts/serve.mjs', env: {PORT: String(PORT)}, url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: false, timeout: 20_000},
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome'], launchOptions: {args: BROWSER_ARGS}}}],
});
