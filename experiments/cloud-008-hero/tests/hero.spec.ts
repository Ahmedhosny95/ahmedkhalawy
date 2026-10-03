// cloud-008 hero acceptance tests (local headless Chromium, loopback only, every context guarded).
import {mkdirSync, renameSync, writeFileSync} from 'node:fs';
import {test, expect} from '../../../tests/helpers';
import type {Page} from '@playwright/test';

const EV = process.env.C008_EVIDENCE!; mkdirSync(`${EV}/screens`, {recursive: true});
const data: Record<string, unknown> = {};
const shot = async (page: Page, name: string, full = false) => {await page.screenshot({path: `${EV}/screens/${name}.png`, fullPage: full});};
const running = (page: Page) => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length);
async function instrument(page: Page) {
  const errors: string[] = [];
  page.on('console', m => {if (m.type() === 'error' || /hydrat/i.test(m.text())) errors.push(m.text());}); page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(() => {
    const w = window as any; w.__removed = 0; w.__cls = 0;
    new MutationObserver(l => {for (const m of l) for (const n of m.removedNodes) if (n.nodeType === 1) w.__removed++;}).observe(document, {childList: true, subtree: true});
    new PerformanceObserver(l => {for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) w.__cls += e.value;}).observe({type: 'layout-shift', buffered: true});
  });
  return errors;
}
const hydrated = (page: Page) => page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');

test('no JavaScript: hero text, actions and section navigation all work', async ({newContext, baseURL}) => {
  const ctx = await newContext({javaScriptEnabled: false, viewport: {width: 390, height: 844}}); const page = await ctx.newPage();
  await page.goto(baseURL + '/');
  await expect(page.locator('h1')).toContainText('Quality leadership');
  await expect(page.locator('.hero-lead')).toContainText('quality assurance (QA)');
  await expect(page.locator('.hero-motion')).toBeHidden();
  await page.waitForTimeout(1500);
  const minOpacity = await page.evaluate(() => Math.min(...[...document.querySelectorAll('.hero-copy > *')].map(e => +getComputedStyle(e).opacity)));
  expect(minOpacity).toBe(1);
  await page.locator('.hero-nav-links a[href="#work"]').click(); await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('#work h2')).toBeInViewport();
  await page.goto(baseURL + '/'); await page.locator('a.hero-btn-quiet').click();
  await expect(page).toHaveURL(/#cv-note$/); await expect(page.locator('#cv-note')).toBeInViewport();
  await expect(page.locator('#cv-note')).toContainText('does not include the CV file');
  await shot(page, 'nojs-390-cv-note');
});

test('keyboard: every hero action is reachable, visibly focused and inside the viewport', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900}); await page.goto('/'); await hydrated(page);
  const order: string[] = [];
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {const el = document.activeElement as HTMLElement; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return {label: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30), outline: parseFloat(cs.outlineWidth), visible: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth};});
    order.push(f.label);
    if (i > 0) {expect(f.outline, f.label).toBeGreaterThanOrEqual(2); expect(f.visible, f.label).toBe(true);}
  }
  expect(order.slice(0, 9)).toEqual(['Skip to content', 'Ahmed Khalawy', 'Work', 'Career', 'Contact', 'See the work ↓', 'CV demo · file not includeddem', 'Scroll to career', 'Motion: on']); // labels truncated to 30 chars
  await page.locator('.hero-btn-primary').focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#work$/);
  data['tab-order'] = order;
});

for (const [w, h] of [[375, 812], [390, 844], [1440, 900]] as const) test(`layout ${w}×${h}: no overflow, headline unclipped, primary action in first viewport`, async ({page}) => {
  const errors = await instrument(page);
  await page.setViewportSize({width: w, height: h}); await page.goto('/'); await hydrated(page); await page.waitForTimeout(1600);
  const m = await page.evaluate(() => {
    const h1 = document.querySelector('h1')!.getBoundingClientRect(); const cta = document.querySelector('.hero-btn-primary')!.getBoundingClientRect();
    const img = document.querySelector('.hero-portrait img') as HTMLImageElement;
    return {sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h1L: h1.left, h1R: h1.right, ctaBottom: cta.bottom, ctaRight: cta.right,
      imgReady: img.complete && img.naturalWidth === 960, cls: (window as any).__cls};
  });
  expect(m.sw).toBeLessThanOrEqual(m.cw); expect(m.h1L).toBeGreaterThanOrEqual(0); expect(m.h1R).toBeLessThanOrEqual(w);
  expect(m.ctaBottom).toBeLessThanOrEqual(h); expect(m.ctaRight).toBeLessThanOrEqual(w);
  expect(m.imgReady).toBe(true); expect(m.cls).toBeLessThan(0.01);
  expect(errors).toEqual([]);
  await shot(page, `hero-${w}`); if (w !== 375) await shot(page, `page-${w}-full`, true);
  data[`layout-${w}`] = m;
});

test('delayed hydration: first HTML is final, entrance plays once, nothing remounts or shifts', async ({page}) => {
  const errors = await instrument(page);
  await page.setViewportSize({width: 1440, height: 900});
  await page.route('**/app.js', async r => {await new Promise(res => setTimeout(res, 2000)); await r.continue();});
  // module scripts delay DOMContentLoaded, so observe from first commit: the server HTML is painted and animating before app.js arrives
  await page.goto('/', {waitUntil: 'commit'});
  await page.waitForFunction(() => document.getAnimations().filter(a => (a as CSSAnimation).animationName === 'hero-rise').length === 6);
  expect(await page.evaluate(() => document.documentElement.dataset.hydrated)).toBeUndefined();
  const before = await page.evaluate(() => {
    (document.querySelector('h1') as any).__ssr = true; (document.querySelector('.hero-portrait img') as any).__ssr = true;
    const an = document.getAnimations().filter(a => (a as CSSAnimation).animationName === 'hero-rise');
    (window as any).__an = an; return {entrance: an.length, heroH: document.querySelector('.hero')!.getBoundingClientRect().height, toggleHidden: (document.querySelector('.hero-motion') as HTMLElement).hidden};
  });
  await hydrated(page); await page.waitForTimeout(400);
  const after = await page.evaluate(() => {
    const an = document.getAnimations().filter(a => (a as CSSAnimation).animationName === 'hero-rise');
    return {entranceTotalSinceLoad: an.length, sameAnimationObjects: an.every(a => (window as any).__an.includes(a)), removed: (window as any).__removed,
      h1Kept: !!(document.querySelector('h1') as any).__ssr, imgKept: !!(document.querySelector('.hero-portrait img') as any).__ssr,
      heroH: document.querySelector('.hero')!.getBoundingClientRect().height, cls: (window as any).__cls, toggleHidden: (document.querySelector('.hero-motion') as HTMLElement).hidden};
  });
  expect(before.toggleHidden).toBe(true); expect(after.toggleHidden).toBe(false);
  expect(after.removed).toBe(0); expect(after.h1Kept).toBe(true); expect(after.imgKept).toBe(true);
  expect(after.sameAnimationObjects).toBe(true);
  expect(after.heroH).toBe(before.heroH); expect(after.cls).toBeLessThan(0.01);
  expect(errors).toEqual([]);
  data['delayed-hydration'] = {before, after};
});

test('app bundle fails: the static page remains complete and readable', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.route('**/app.js', r => r.abort()); await page.goto('/'); await page.waitForTimeout(1300);
  await expect(page.locator('h1')).toBeVisible(); await expect(page.locator('.hero-btn-primary')).toBeVisible();
  await expect(page.locator('.hero-motion')).toBeHidden();
  await page.locator('.hero-btn-primary').click(); await expect(page.locator('#work h2')).toBeInViewport();
});

test('motion toggle stops and resumes ambient motion; hero pauses off-screen', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900}); await page.goto('/'); await hydrated(page); await page.waitForTimeout(3000);
  expect(await running(page)).toBeGreaterThan(0);
  const btn = page.locator('.hero-motion');
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await btn.click(); await expect(btn).toHaveText('Motion: off'); await expect(btn).toHaveAttribute('aria-pressed', 'false');
  expect(await running(page)).toBe(0);
  await btn.click(); await page.waitForTimeout(200); expect(await running(page)).toBeGreaterThan(0);
  await page.locator('#contact').scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  expect(await page.locator('.hero').getAttribute('data-offscreen')).not.toBeNull();
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && (a as CSSAnimation).animationName?.startsWith('hero-')).length)).toBe(0);
});

test('reduced motion: no entrance, no ambient motion, text fully visible at once, toggle reports off', async ({newContext, baseURL}) => {
  const ctx = await newContext({reducedMotion: 'reduce', viewport: {width: 390, height: 844}}); const page = await ctx.newPage();
  await page.goto(baseURL + '/');
  expect(await page.evaluate(() => Math.min(...[...document.querySelectorAll('.hero-copy > *')].map(e => +getComputedStyle(e).opacity)))).toBe(1);
  await hydrated(page); await page.waitForTimeout(1500);
  expect(await running(page)).toBe(0);
  await expect(page.locator('.hero-motion')).toHaveText('Motion: off');
  await shot(page, 'reduced-motion-390');
});

test('motion sample: light pulse advances in real time (rAF samples, not display smoothness)', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900}); await page.goto('/'); await hydrated(page); await page.waitForTimeout(1500);
  const tl = await page.evaluate(() => new Promise<{t: number; offset: number; opacity: number}[]>(res => {
    const el = document.querySelector('.scene-back .path-pulse')!; const out: {t: number; offset: number; opacity: number}[] = []; const t0 = performance.now();
    const tick = (now: number) => {const cs = getComputedStyle(el); out.push({t: Math.round(now - t0), offset: parseFloat(cs.strokeDashoffset), opacity: +cs.opacity}); if (now - t0 < 1500) requestAnimationFrame(tick); else res(out);};
    requestAnimationFrame(tick);
  }));
  const offs = tl.map(s => s.offset);
  expect(new Set(offs).size).toBeGreaterThan(10);
  for (let i = 1; i < offs.length; i++) expect(offs[i]).toBeLessThanOrEqual(offs[i - 1] + 1e-6); // moves forward along the path (offset decreases)
  data['pulse-samples'] = {frames: tl.length, first: tl[0], last: tl[tl.length - 1]};
});

test('transferred assets (local, uncompressed loopback server)', async ({page}) => {
  const sizes: Record<string, number> = {};
  page.on('response', async r => {try {sizes[new URL(r.url()).pathname] = (await r.body()).length;} catch {/* ignore */}});
  await page.setViewportSize({width: 1440, height: 900}); await page.goto('/'); await hydrated(page); await page.waitForTimeout(800);
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  expect(Object.keys(sizes).every(p => !p.startsWith('http'))).toBe(true);
  data['transfer-bytes'] = {total, sizes, note: 'Body bytes from the local server (no compression/CDN). Not a performance score.'};
});

test('recording: real-time interaction at 1440 px (video)', async ({newContext, baseURL}) => {
  const ctx = await newContext({viewport: {width: 1440, height: 900}, recordVideo: {dir: '../../test-results/cloud-008/video', size: {width: 1280, height: 800}}});
  const page = await ctx.newPage(); await page.goto(baseURL + '/'); await page.waitForTimeout(3500);
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(400);
  await page.locator('.hero-btn-quiet').hover(); await page.waitForTimeout(600);
  await page.locator('.hero-motion').click(); await page.waitForTimeout(1200); await page.locator('.hero-motion').click(); await page.waitForTimeout(1500);
  await page.mouse.wheel(0, 700); await page.waitForTimeout(1200); await page.mouse.wheel(0, -700); await page.waitForTimeout(1500);
  const v = page.video()!; await ctx.close(); renameSync(await v.path(), `${EV}/interaction-1440.webm`);
});

test.afterAll(() => writeFileSync(`${EV}/measurements.json`, JSON.stringify({run: EV, note: 'Local headless Chromium only. rAF samples are not physical display smoothness; no Safari/real-phone/screen-reader testing.', ...data}, null, 1)));
