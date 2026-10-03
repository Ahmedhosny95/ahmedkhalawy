import {defineConfig, devices} from '@playwright/test';
import {existsSync} from 'node:fs';
import {chromium, webkit} from '@playwright/test';
const PORT = 4173;
const hasWebkit = existsSync(webkit.executablePath());
// Outbound is blocked in layers (see scripts/guard.mjs): per-context interception + DNS rule + dead local proxy for IP literals.
import {BROWSER_ARGS as chromiumArgs} from './scripts/guard.mjs';
export default defineConfig({
  testDir: 'tests', timeout: 60_000, retries: 0, workers: 2, reporter: [['list'], ['json', {outputFile: process.env.PW_JSON || 'evidence/cloud-002/playwright-results.json'}]],
  outputDir: 'test-results',
  use: {baseURL: `http://127.0.0.1:${PORT}`, serviceWorkers: 'block', trace: 'off'},
  webServer: {command: 'node scripts/serve.mjs', env: {PORT: String(PORT)}, url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: false, timeout: 20_000},
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome'], launchOptions: {executablePath: existsSync(chromium.executablePath()) ? chromium.executablePath() : undefined, args: chromiumArgs}}, testIgnore: /webkit-smoke/},
    // WebKit browser binaries could not be downloaded in the cloud environment (host blocked); project runs only when installed.
    ...(hasWebkit ? [{name: 'webkit', use: {...devices['Desktop Safari']}, testMatch: /webkit-smoke/}] : []),
  ],
});
