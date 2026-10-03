// Dev helper: guarded local screenshots of the prototype (loopback only). Usage: node scripts/peek.mjs <outdir> <route> <width> [fullPage]
import {chromium} from '@playwright/test';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {start} from '../../../scripts/serve.mjs';
import {BROWSER_ARGS, installGuard} from '../../../scripts/guard.mjs';
const [outDir, route = '/', width = '1440', full = ''] = process.argv.slice(2);
const root = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'dist');
const s = await start(0, root); const port = s.address().port;
const b = await chromium.launch({args: BROWSER_ARGS});
const ctx = await b.newContext({viewport: {width: +width, height: +width < 500 ? 844 : 900}});
const blocked = await installGuard(ctx, []);
const p = await ctx.newPage(); const errors = [];
p.on('console', m => m.type() === 'error' && errors.push(m.text())); p.on('pageerror', e => errors.push(String(e)));
await p.goto(`http://127.0.0.1:${port}${route}`); await p.waitForTimeout(600);
const name = (route === '/' ? 'home' : route.replace(/\W+/g, '')) + '-' + width + (full ? '-full' : '') + '.png';
await p.screenshot({path: join(outDir, name), fullPage: !!full});
console.log(name, JSON.stringify({errors, blocked, sw: await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth])}));
await b.close(); s.close();
