// Lab baseline (harness, loopback, emulated throttling). NOT field performance. 3 cold + 3 repeat runs for Home and About.
import {chromium} from '@playwright/test';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {start} from './serve.mjs';
const PORT = 4174, RUNS = 3;
const PROFILE = {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: false,
  network: {offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8}, cpuSlowdown: 4};
const median = a => {const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null;};
const server = await start(PORT);
const exe = chromium.executablePath();
const browser = await chromium.launch({executablePath: existsSync(exe) ? exe : undefined, args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']});
const init = () => {
  window.__m = {lcp: 0, lcpEl: '', cls: 0, long: []};
  new PerformanceObserver(l => {for (const e of l.getEntries()) {window.__m.lcp = e.startTime; window.__m.lcpEl = (e.element?.tagName || '') + (e.element?.className ? '.' + String(e.element.className).split(' ')[0] : '');}}).observe({type: 'largest-contentful-paint', buffered: true});
  new PerformanceObserver(l => {for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value;}).observe({type: 'layout-shift', buffered: true});
  new PerformanceObserver(l => {for (const e of l.getEntries()) window.__m.long.push(e.duration);}).observe({type: 'longtask', buffered: true});
};
async function load(ctx, route, label) {
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', PROFILE.network); await cdp.send('Emulation.setCPUThrottlingRate', {rate: PROFILE.cpuSlowdown});
  let bytes = 0, requests = 0; const sizes = {};
  const urls = new Map();
  cdp.on('Network.responseReceived', e => urls.set(e.requestId, e.response.url));
  cdp.on('Network.loadingFinished', e => {bytes += e.encodedDataLength; requests++; const u = new URL(urls.get(e.requestId) || 'http://x/?').pathname; sizes[u] = (sizes[u] || 0) + e.encodedDataLength;});
  await page.addInitScript(init);
  await page.goto(`http://127.0.0.1:${PORT}${route}`, {waitUntil: 'load'});
  await page.waitForTimeout(3000);
  const m = await page.evaluate(() => ({...window.__m, long: window.__m.long, fonts: [...document.fonts].map(f => `${f.family} ${f.style} ${f.status}`), handoff: !document.getElementById('public-prerender')}));
  const snap = {bytes, requests, sizes: {...sizes}};
  let platformFonts = [];
  try {
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); const {root} = await cdp.send('DOM.getDocument', {depth: 0});
    for (const sel of ['h1', 'body', 'p']) {
      const {nodeId} = await cdp.send('DOM.querySelector', {nodeId: root.nodeId, selector: sel === 'body' ? '.op-public' : '.op-public ' + sel});
      if (nodeId) platformFonts.push({selector: sel, fonts: (await cdp.send('CSS.getPlatformFontsForNode', {nodeId})).fonts.map(f => `${f.familyName} (${f.isCustomFont ? 'custom' : 'system'}) x${f.glyphCount}`)});
    }
  } catch (e) {platformFonts = [String(e.message)];}
  await page.close();
  return {lcpMs: Math.round(m.lcp), lcpElement: m.lcpEl, cls: +m.cls.toFixed(4), bytes: snap.bytes, requests: snap.requests, longTasks: m.long.length, longTaskMs: Math.round(m.long.reduce((a, b) => a + b, 0)), fonts: m.fonts, platformFonts, handoffComplete: m.handoff, sizes: snap.sizes};
}
const out = {profile: PROFILE, runs: RUNS, note: 'Lab/emulated adapter harness only; not field or production performance. Repeat = second load in the same context (HTTP cache warm).', browserVersion: browser.version(), results: {}};
for (const route of ['/', '/about']) {
  const cold = [], repeat = [];
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({viewport: PROFILE.viewport, deviceScaleFactor: PROFILE.deviceScaleFactor, reducedMotion: 'no-preference'});
    cold.push(await load(ctx, route, 'cold')); repeat.push(await load(ctx, route, 'repeat')); await ctx.close();
  }
  const sum = rs => ({median: {lcpMs: median(rs.map(r => r.lcpMs)), cls: median(rs.map(r => r.cls)), bytes: median(rs.map(r => r.bytes)), longTasks: median(rs.map(r => r.longTasks)), longTaskMs: median(rs.map(r => r.longTaskMs))}, runs: rs});
  out.results[route] = {cold: sum(cold), repeat: sum(repeat)};
}
mkdirSync('evidence', {recursive: true}); writeFileSync('evidence/perf-baseline.json', JSON.stringify(out, null, 2));
for (const [r, v] of Object.entries(out.results)) for (const k of ['cold', 'repeat']) console.log(r, k, JSON.stringify(v[k].median));
await browser.close(); server.close();
