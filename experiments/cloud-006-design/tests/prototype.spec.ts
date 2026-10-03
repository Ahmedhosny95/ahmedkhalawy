// cloud-006 prototype tests. Local loopback only; every context is guarded by the root harness guard (tests/helpers.ts).
import {execFileSync} from 'node:child_process';
import {mkdirSync, renameSync, writeFileSync} from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import {test, expect} from '../../../tests/helpers';
import type {Page} from '@playwright/test';

const EV = process.env.C006_EVIDENCE!; // set by playwright.config.ts: a new evidence/cloud-006b-<run>/ per run
if (!EV || !/evidence\/cloud-006b-/.test(EV)) throw new Error('C006_EVIDENCE must point to a new evidence/cloud-006b-<run> directory');
mkdirSync(EV, {recursive: true});
const ROUTES = ['/', '/about', '/projects', '/contact'];
const WIDTHS = [375, 390, 768, 1440];
const slug = (r: string) => (r === '/' ? 'home' : r.slice(1));
// @ts-ignore plain JS seed module
import {routes as seo} from '../../../src/search-data.js';
const timelines: Record<string, unknown> = {};

/** Records console errors/page errors and, before any script runs, node removals + entrance animations around hydration. */
async function instrument(page: Page) {
  const errors: string[] = [];
  page.on('console', m => {if (m.type() === 'error' || /hydrat/i.test(m.text())) errors.push(m.text());});
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(() => {
    // Installed at document creation, before any page script: observes parsing, the module script, hydrateRoot and after.
    const w = window as any; w.__removed = []; w.__marked = 0; w.__markedAtHydration = -1;
    new MutationObserver(list => {
      for (const m of list) {
        for (const n of m.removedNodes) if (n.nodeType === 1) w.__removed.push((n as Element).tagName + '.' + ((n as Element).className || ''));
        for (const n of m.addedNodes) if (n.nodeType === 1) for (const el of [n as Element, ...(n as Element).querySelectorAll('img, h1')]) if (/^(IMG|H1)$/.test(el.tagName) && !(el as any).__ssr) {(el as any).__ssr = true; w.__marked++;}
        if (m.type === 'attributes' && m.attributeName === 'data-hydrated' && w.__markedAtHydration < 0) w.__markedAtHydration = w.__marked;
      }
    }).observe(document, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-hydrated']});
  });
  return errors;
}
const hydrated = (page: Page) => page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');

/** Samples a computed style every animation frame, in real time (no seeking), until `ms` elapsed. */
async function sample(page: Page, selector: string, ms: number, prop: 'opacity' | 'transform' = 'opacity') {
  return page.evaluate(({selector, ms, prop}) => new Promise<{t: number; v: string}[]>(resolve => {
    const out: {t: number; v: string}[] = []; const t0 = performance.now();
    const tick = (now: number) => {
      const el = document.querySelector(selector);
      out.push({t: Math.round(now - t0), v: el ? getComputedStyle(el)[prop] : 'missing'});
      if (now - t0 < ms) requestAnimationFrame(tick); else resolve(out);
    };
    requestAnimationFrame(tick);
  }), {selector, ms, prop});
}

test.describe('layout: widths, overflow, CV action not clipped', () => {
  for (const r of ROUTES) for (const w of WIDTHS) {
    test(`${r} @${w}`, async ({page}) => {
      const errors = await instrument(page);
      await page.setViewportSize({width: w, height: w < 500 ? 844 : w < 1000 ? 1024 : 900});
      await page.goto(r); await hydrated(page);
      const o = await page.evaluate(() => ({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth}));
      expect(o.sw, 'no horizontal page overflow').toBeLessThanOrEqual(o.cw);
      const cv = page.locator('main .cv-btn').first();
      await expect(cv).toBeVisible();
      const box = (await cv.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(w);
      expect(await cv.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      expect(errors).toEqual([]);
      if (w === 1440 || w === 390) await page.screenshot({path: `${EV}/${slug(r)}-${w}.png`});
      if (w === 1440) {
        // full-page capture only: settle any below-fold reveals first so the image shows final states
        await page.evaluate(() => document.querySelectorAll('[data-reveal=pending]').forEach(e => ((e as HTMLElement).dataset.reveal = 'in')));
        await page.waitForTimeout(650);
        await page.screenshot({path: `${EV}/${slug(r)}-${w}-full.png`, fullPage: true});
      }
    });
  }
});

test.describe('hydration: first HTML is final, no second entrance', () => {
  for (const r of ROUTES) test(`${r}: 3 consecutive loads`, async ({page}) => {
    const errors = await instrument(page);
    await page.setViewportSize({width: 1440, height: 900});
    const runs = [];
    for (let i = 0; i < 3; i++) {
      await page.goto(r); await hydrated(page); await page.waitForTimeout(400);
      runs.push(await page.evaluate(() => {
        const w = window as any;
        return {removed: w.__removed.length, marked: w.__marked, markedBeforeHydration: w.__markedAtHydration,
          ssrNodesKept: [...document.querySelectorAll('img, h1')].every(el => (el as any).__ssr === true),
          runningAnimations: document.getAnimations().length,
          pendingAboveFold: [...document.querySelectorAll('[data-reveal=pending]')].filter(el => el.getBoundingClientRect().top < innerHeight).length};
      }));
    }
    for (const x of runs) {expect(x.removed).toBe(0); expect(x.ssrNodesKept).toBe(true); expect(x.runningAnimations).toBe(0); expect(x.pendingAboveFold).toBe(0); expect(x.marked).toBeGreaterThan(0); expect(x.markedBeforeHydration).toBe(x.marked);}
    expect(errors).toEqual([]);
    timelines[`hydration ${r}`] = runs;
  });
});

test('CV action is an honest unavailable state (no download, no navigation)', async ({page}) => {
  await page.goto('/'); await hydrated(page);
  let downloads = 0; page.on('download', () => downloads++);
  const btn = page.locator('main .cv-btn').first();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('main .cv-note').first()).toContainText('nothing is downloaded');
  await page.waitForTimeout(300);
  expect(downloads).toBe(0); expect(page.url()).toMatch(/\/$/);
  await page.locator('main .cv-note a').first().click();
  await expect(page).toHaveURL(/\/cv-specimen\/$/);
});

test.describe('keyboard, menu, focus', () => {
  test('skip link first, then into main', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/'); await hydrated(page);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Skip to content');
    await expect.poll(() => page.evaluate(() => document.activeElement!.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('main');
  });
  test('hydrated mobile menu: Enter opens, focus moves in, Escape closes and returns focus, closed panel not tabbable', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/'); await hydrated(page);
    const menu = page.locator('details.menu'); const btn = menu.locator('summary');
    await expect(page.locator('.nav-desktop')).toBeHidden();
    await btn.focus(); await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('open', '');
    await expect(page.locator(':focus')).toHaveAttribute('href', '/projects');
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(btn).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#mobile-menu'))).toBe(false);
  });
  test('menu link navigates and closes the menu; focus lands on the new h1', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/'); await hydrated(page);
    await page.locator('details.menu summary').click();
    await page.locator('#mobile-menu a[href="/about"]').click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('details.menu')).not.toHaveAttribute('open', '');
    await expect(page.locator('main h1')).toBeFocused();
  });
  test('disclosure opens/closes from keyboard (About recommendations)', async ({page}) => {
    await page.goto('/about'); await hydrated(page);
    const d = page.locator('details.disclosure-quotes');
    await d.locator('summary').focus(); await page.keyboard.press('Enter');
    await expect(d).toHaveAttribute('open', '');
    await expect(page.locator('.quote blockquote')).toHaveCount(22);
    await page.keyboard.press('Enter');
    await expect(d).not.toHaveAttribute('open', '');
  });
});

test.describe('client routing: Back/Forward, titles, anchors', () => {
  test('nav, Back, Forward with titles and scroll restoration', async ({page}) => {
    const errors = await instrument(page);
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/'); await hydrated(page);
    await page.mouse.wheel(0, 1400); await page.waitForTimeout(400);
    const y0 = await page.evaluate(() => scrollY);
    // dispatchEvent: Playwright's actionability scroll on a sticky header would otherwise move the page before the click
    await page.locator('.nav-desktop a[href="/projects"]').dispatchEvent('click');
    await expect(page).toHaveURL(/\/projects$/); expect(await page.title()).toBe(seo['/projects'].title);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('main h1')).toBeFocused();
    await page.goBack(); await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
    expect(await page.title()).toBe(seo['/'].title);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y0 - 40);
    await page.goForward(); await expect(page).toHaveURL(/\/projects$/);
    const removedDocs = await page.evaluate(() => performance.getEntriesByType('navigation').length);
    expect(removedDocs).toBe(1); // still the first document: client-side routing, no full reload
    expect(errors).toEqual([]);
  });
  test('cross-page anchor Home → /projects#inspection lands on the section', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/'); await hydrated(page);
    await page.locator('a.index-row[href="/projects#inspection"]').click();
    await expect(page).toHaveURL(/\/projects#inspection$/);
    // the section heading must sit below the sticky header + sticky jump nav, and near the top of the viewport
    await expect.poll(() => page.evaluate(() => {
      const h = document.getElementById('inspection-t')!.getBoundingClientRect().top;
      const sec = document.getElementById('inspection')!.getBoundingClientRect().top;
      const nav = document.querySelector('.jump-bar')!.getBoundingClientRect().bottom;
      return sec >= nav - 2 && h > nav && h < innerHeight * 0.65;
    })).toBe(true);
  });
  test('direct entry with hash works without JS help (/about#recommendations)', async ({page}) => {
    await page.goto('/about#recommendations'); await hydrated(page);
    await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('recommendations')!.getBoundingClientRect().top))).toBeLessThan(200);
  });
});

test.describe('motion: natural-time playback (rAF sampling, no seeking)', () => {
  test('menu panel opens over ~220–320 ms, monotonic, ends fully visible', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/'); await hydrated(page);
    const [, tl] = await Promise.all([page.locator('details.menu summary').click(), sample(page, '#mobile-menu', 450)]);
    const v = tl.map(s => +s.v);
    expect(v[v.length - 1]).toBe(1);
    const firstFull = tl.find(s => +s.v === 1)!.t;
    expect(firstFull).toBeGreaterThan(120); expect(firstFull).toBeLessThan(450);
    for (let i = 1; i < v.length; i++) expect(v[i]).toBeGreaterThanOrEqual(v[i - 1] - 1e-6);
    expect(new Set(v).size).toBeGreaterThan(4); // intermediate frames actually rendered
    timelines['menu-open opacity'] = tl;
  });
  test('route enter: main fades/rises once after client navigation; none on first load', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/'); await hydrated(page);
    expect(await page.evaluate(() => document.querySelector('main')!.getAnimations().length)).toBe(0);
    const [, tl] = await Promise.all([page.locator('.nav-desktop a[href="/about"]').click(), sample(page, 'main', 500)]);
    const v = tl.map(s => +s.v).filter(n => !Number.isNaN(n));
    expect(Math.min(...v)).toBeGreaterThanOrEqual(0.39); // content never invisible: starts at 0.4 opacity
    expect(v[v.length - 1]).toBe(1);
    expect(new Set(v).size).toBeGreaterThan(4);
    timelines['route-enter opacity'] = tl;
  });
  test('below-fold reveal plays when scrolled into view; above-fold content never hidden', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/about'); await hydrated(page);
    const target = '.cred, #skills .skill-group';
    const pending = await page.evaluate(() => document.querySelectorAll('[data-reveal=pending]').length);
    expect(pending).toBeGreaterThan(0);
    const sel = '#skills .skill-group';
    expect(await page.locator(sel).first().getAttribute('data-reveal')).toBe('pending');
    const [, tl] = await Promise.all([page.locator(sel).first().evaluate(el => el.scrollIntoView({block: 'center'})), sample(page, sel, 800)]);
    const v = tl.map(s => +s.v);
    expect(v[v.length - 1]).toBe(1); expect(new Set(v).size).toBeGreaterThan(4);
    timelines['reveal opacity'] = tl; void target;
  });
});

test.describe('reduced motion', () => {
  test('nothing held, no route animation, menu instant, all content visible', async ({newContext, baseURL}) => {
    const ctx = await newContext({reducedMotion: 'reduce', viewport: {width: 390, height: 844}});
    const page = await ctx.newPage(); const errors = await instrument(page);
    await page.goto(baseURL + '/about'); await hydrated(page);
    await page.mouse.wheel(0, 6000); await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.querySelectorAll('[data-reveal=pending]').length)).toBe(0);
    const hidden = await page.evaluate(() => [...document.querySelectorAll('main h2, main h3, main p, main li')].filter(e => +getComputedStyle(e).opacity < 1).length);
    expect(hidden).toBe(0);
    await page.evaluate(() => scrollTo(0, 0));
    const [, tl] = await Promise.all([page.locator('details.menu summary').click(), sample(page, '#mobile-menu', 120)]);
    expect(+tl[tl.length - 1].v).toBe(1);
    expect(tl.filter(s => +s.v > 0 && +s.v < 1).length).toBe(0); // no intermediate frames
    await page.locator('#mobile-menu a[href="/projects"]').click();
    await expect(page).toHaveURL(/\/projects$/);
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
    expect(errors).toEqual([]);
    timelines['reduced-motion menu opacity'] = tl;
  });
});

test.describe('accessibility (axe serious/critical, automated only)', () => {
  for (const r of ROUTES) for (const w of [390, 1440]) test(`${r} @${w}`, async ({page}) => {
    await page.setViewportSize({width: w, height: 900});
    await page.goto(r); await hydrated(page);
    await page.evaluate(() => document.querySelectorAll('[data-reveal=pending]').forEach(e => ((e as HTMLElement).dataset.reveal = 'in')));
    await page.locator('details').evaluateAll(ds => ds.forEach(d => ((d as HTMLDetailsElement).open = true)));
    await page.waitForTimeout(700);
    const res = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const bad = res.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => `${v.id}: ${v.nodes.length} e.g. ${v.nodes[0].target.join(' ')}`);
    expect(bad).toEqual([]);
  });
});

test('CLOUD006B CV specimen prints to exactly 4 A4 pages without overflow; min type ≥ 9 pt', async ({page}) => {
  await page.goto('/cv-specimen/'); await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({media: 'print'});
  const pages = await page.evaluate(() => [...document.querySelectorAll('.page')].map(pg => {
    const foot = pg.querySelector('.pf')!.getBoundingClientRect();
    const last = Math.max(...[...pg.children].filter(c => !c.classList.contains('pf')).map(c => c.getBoundingClientRect().bottom));
    const fonts = [...pg.querySelectorAll('*')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent!.trim())).map(e => parseFloat(getComputedStyle(e).fontSize));
    return {overflow: pg.scrollHeight > pg.clientHeight, clearancePx: Math.round(foot.top - last), minFontPt: +(Math.min(...fonts) * 0.75).toFixed(2), fillPct: Math.round(100 * (last - pg.getBoundingClientRect().top) / pg.getBoundingClientRect().height)};
  }));
  expect(pages.length).toBe(4);
  for (const p of pages) {expect(p.overflow).toBe(false); expect(p.clearancePx).toBeGreaterThan(0); expect(p.minFontPt).toBeGreaterThanOrEqual(9);}
  const pdf = `${EV}/cv-specimen.pdf`;
  await page.pdf({path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true});
  const info = execFileSync('pdfinfo', [pdf], {encoding: 'utf8'});
  expect(info).toMatch(/Pages:\s+4\n/); expect(info).toMatch(/Page size:\s+59[45]\.\d+ x 841\.\d+ pts \(A4\)/);
  execFileSync('pdftoppm', ['-r', '70', '-png', pdf, `${EV}/cv-specimen-page`]);
  timelines['cv-specimen pages'] = pages;
});

test('recording: real-time local interaction at 390 px (video)', async ({newContext, baseURL}) => {
  const ctx = await newContext({viewport: {width: 390, height: 844}, recordVideo: {dir: '../../test-results/cloud-006b/video', size: {width: 390, height: 844}}});
  const page = await ctx.newPage(); await page.goto(baseURL + '/'); await hydrated(page);
  await page.waitForTimeout(700);
  await page.locator('details.menu summary').click(); await page.waitForTimeout(700);
  await page.locator('#mobile-menu a[href="/projects"]').click(); await page.waitForTimeout(900);
  await page.mouse.wheel(0, 900); await page.waitForTimeout(900);
  await page.goBack(); await page.waitForTimeout(900);
  await page.locator('main .cv-btn').first().click(); await page.waitForTimeout(900);
  await page.locator('details.menu summary').click(); await page.waitForTimeout(500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  const video = page.video()!; await ctx.close();
  renameSync(await video.path(), `${EV}/interaction-390.webm`);
});

test.afterAll(() => {
  // Fresh file inside this run's unique directory; never merged with earlier runs.
  writeFileSync(`${EV}/motion-timeline.json`, JSON.stringify({run: EV, ...timelines,
    note: 'requestAnimationFrame samples from the local headless Chromium (ms since sampling start). rAF cadence is not a measure of physical display smoothness.'}, null, 1));
});

// ---------------- CLOUD006B corrections ----------------
const TOL = 4; // px, two-sided scroll tolerance
// @ts-ignore plain JS seed module
import {schema as seedSchema} from '../../../src/search-data.js';

test.describe('CLOUD006B history', () => {
  test('same-route hash: open disclosure, Answers, Back, Forward — state, scroll and focus kept', async ({page}) => {
    const errors = await instrument(page);
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/about'); await hydrated(page);
    const d = page.locator('details.disclosure-quotes');
    await d.locator('summary').click(); await expect(d).toHaveAttribute('open', '');
    await page.evaluate(() => scrollTo(0, 180)); await page.waitForTimeout(300);
    const link = page.locator('.page-head .jump a[href="#answers"]');
    await link.focus();
    const y0 = await page.evaluate(() => scrollY);
    await page.keyboard.press('Enter'); // real native hash navigation
    await expect(page).toHaveURL(/\/about#answers$/);
    await page.waitForTimeout(300);
    const y1 = await page.evaluate(() => scrollY);
    expect(y1).toBeGreaterThan(y0 + 500);
    const mainBefore = await page.evaluate(() => {(document.querySelector('main') as any).__same = true; return true;});
    await page.goBack(); await expect(page).toHaveURL(/\/about$/); await page.waitForTimeout(250);
    const back = await page.evaluate(() => ({y: scrollY, open: (document.querySelector('details.disclosure-quotes') as HTMLDetailsElement).open,
      focus: document.activeElement?.getAttribute('href') ?? document.activeElement?.tagName, sameMain: !!(document.querySelector('main') as any).__same}));
    expect(back.open).toBe(true); expect(back.sameMain).toBe(true); expect(back.focus).toBe('#answers');
    expect(Math.abs(back.y - y0)).toBeLessThanOrEqual(TOL);
    await page.goForward(); await expect(page).toHaveURL(/\/about#answers$/); await page.waitForTimeout(250);
    const fwd = await page.evaluate(() => ({y: scrollY, open: (document.querySelector('details.disclosure-quotes') as HTMLDetailsElement).open, focus: document.activeElement?.id}));
    expect(fwd.open).toBe(true); expect(fwd.focus).toBe('answers');
    expect(Math.abs(fwd.y - y1)).toBeLessThanOrEqual(TOL);
    expect(errors).toEqual([]); void mainBefore;
    timelines['CLOUD006B same-route history'] = {y0, y1, back, fwd};
  });
  test('cross-route Back/Forward restores open disclosure and scroll (two-sided)', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/about'); await hydrated(page);
    const d = page.locator('details.disclosure-quotes');
    await d.locator('summary').click(); await page.waitForTimeout(300);
    const y0 = await page.evaluate(() => scrollY);
    await page.locator('.nav-desktop a[href="/projects"]').dispatchEvent('click');
    await expect(page).toHaveURL(/\/projects$/);
    await page.evaluate(() => scrollTo(0, 700)); await page.waitForTimeout(300);
    await page.goBack(); await expect(page).toHaveURL(/\/about$/); await page.waitForTimeout(250);
    const b = await page.evaluate(() => ({y: scrollY, open: (document.querySelector('details.disclosure-quotes') as HTMLDetailsElement).open, focus: document.activeElement?.tagName}));
    expect(b.open).toBe(true); expect(Math.abs(b.y - y0)).toBeLessThanOrEqual(TOL); expect(b.focus).not.toBe('BODY');
    await page.goForward(); await expect(page).toHaveURL(/\/projects$/); await page.waitForTimeout(250);
    expect(Math.abs(await page.evaluate(() => scrollY) - 700)).toBeLessThanOrEqual(TOL);
    timelines['CLOUD006B cross-route history'] = {y0, back: b};
  });
});

test('CLOUD006B head: title, description, canonical and JSON-LD follow client navigation, Back and Forward (single tags)', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto('/'); await hydrated(page);
  const head = () => page.evaluate(() => ({
    title: document.title,
    desc: [...document.querySelectorAll('meta[name="description"]')].map(m => (m as HTMLMetaElement).content),
    canon: [...document.querySelectorAll('link[rel="canonical"]')].map(l => l.getAttribute('href')),
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent!)),
    robots: [...document.querySelectorAll('meta[name="robots"]')].map(m => (m as HTMLMetaElement).content),
  }));
  const expectRoute = async (r: string) => {
    const h = await head();
    expect(h.title).toBe(seo[r].title);
    expect(h.desc).toEqual([seo[r].description]); expect(h.canon).toEqual([seo[r].url]);
    expect(h.ld).toEqual([seedSchema(r)]); expect(h.robots).toEqual(['noindex, nofollow']);
  };
  await expectRoute('/');
  await page.locator('.nav-desktop a[href="/about"]').dispatchEvent('click'); await expect(page).toHaveURL(/\/about$/); await expectRoute('/about');
  await page.locator('.nav-desktop a[href="/contact"]').dispatchEvent('click'); await expect(page).toHaveURL(/\/contact$/); await expectRoute('/contact');
  await page.goBack(); await expect(page).toHaveURL(/\/about$/); await expectRoute('/about');
  await page.goBack(); await expect(page).toHaveURL(/\/$/); await expectRoute('/');
  await page.goForward(); await expect(page).toHaveURL(/\/about$/); await expectRoute('/about');
  await page.locator('.nav-desktop a[href="/projects"]').dispatchEvent('click'); await expect(page).toHaveURL(/\/projects$/); await expectRoute('/projects');
});

test.describe('CLOUD006B mobile navigation without app JavaScript', () => {
  test('JS disabled in the browser context (390): native menu opens and a link navigates', async ({newContext, baseURL}) => {
    const ctx = await newContext({javaScriptEnabled: false, viewport: {width: 390, height: 844}});
    const page = await ctx.newPage();
    await page.goto(baseURL + '/');
    const menu = page.locator('details.menu');
    await expect(menu).not.toHaveAttribute('open', '');
    await menu.locator('summary').click();
    await expect(menu).toHaveAttribute('open', '');
    await expect(page.locator('#mobile-menu a[href="/about"]')).toBeVisible();
    await page.locator('#mobile-menu a[href="/about"]').click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('h1')).toContainText('Systems thinking');
    await page.screenshot({path: `${EV}/nojs-menu-after-navigation-390.png`});
  });
  test('app bundle blocked, JS enabled (390): native menu still works by keyboard', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.route('**/app.js', r => r.abort());
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.dataset.hydrated)).toBeUndefined();
    const menu = page.locator('details.menu');
    await menu.locator('summary').focus(); await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('open', '');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '/projects');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator('h1')).toContainText('Start with the capability');
  });
});
