// Prints the CV layout specimen to PDF with the local browser (loopback, guarded) and checks per-page overflow.
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {start} from '../../../scripts/serve.mjs';
import {BROWSER_ARGS, installGuard} from '../../../scripts/guard.mjs';
const here = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(here, 'evidence/prototype-cv-specimen.pdf');
const s = await start(0, join(here, 'dist')); const port = s.address().port;
const b = await chromium.launch({args: BROWSER_ARGS});
const ctx = await b.newContext(); const blocked = await installGuard(ctx, []);
const p = await ctx.newPage(); const errors = [];
p.on('pageerror', e => errors.push(String(e))); p.on('console', m => m.type() === 'error' && errors.push(m.text()));
await p.goto(`http://127.0.0.1:${port}/cv-specimen/`); await p.evaluate(() => document.fonts.ready);
await p.emulateMedia({media: 'print'});
const pages = await p.evaluate(() => [...document.querySelectorAll('.page')].map((pg, i) => {
  const box = pg.getBoundingClientRect(); const foot = pg.querySelector('.pf').getBoundingClientRect();
  const kids = [...pg.children].filter(c => !c.classList.contains('pf'));
  const lastBottom = Math.max(...kids.map(c => c.getBoundingClientRect().bottom));
  const minFont = Math.min(...[...pg.querySelectorAll('*')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => parseFloat(getComputedStyle(e).fontSize)));
  return {page: i + 1, heightPx: Math.round(box.height), contentBottomPx: Math.round(lastBottom - box.top), footerTopPx: Math.round(foot.top - box.top),
    clearanceToFooterPx: Math.round(foot.top - lastBottom), overflow: pg.scrollHeight > pg.clientHeight, minFontPx: minFont, minFontPt: +(minFont * 0.75).toFixed(2)};
}));
await p.pdf({path: out, format: 'A4', printBackground: true, preferCSSPageSize: true});
const result = {pdf: out.replace(here + '/', ''), pages, errors, blocked};
console.log(JSON.stringify(result, null, 1));
writeFileSync(out.replace(/\.pdf$/, '.json'), JSON.stringify(result, null, 2));
await b.close(); s.close();
