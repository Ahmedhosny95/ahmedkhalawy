// Focused browser flows for the synthetic recruiter assistant (local Chromium, loopback only, guarded contexts).
import {mkdirSync, renameSync, writeFileSync} from 'node:fs';
import {test, expect} from '../../../../tests/helpers';
import type {Page} from '@playwright/test';
import {JDS} from '../../fixtures/synthetic-jds';
import {CASES} from '../../fixtures/synthetic-portfolio';

const EV = process.env.C007_EVIDENCE!; mkdirSync(`${EV}/screens`, {recursive: true});
const jd = (id: string) => JDS.find(j => j.id === id)!.text;
const shot = async (page: Page, name: string) => {await page.waitForTimeout(450); await page.screenshot({path: `${EV}/screens/${name}.png`});}; // let entrance motion settle
const timelines: Record<string, unknown> = {};
async function boot(page: Page, w = 1440) {
  const logs: string[] = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text())); page.on('pageerror', e => logs.push('pageerror: ' + e));
  await page.setViewportSize({width: w, height: w < 700 ? (w === 375 ? 812 : 844) : 900});
  await page.goto('/');
  return logs;
}
const openPanel = (page: Page) => page.locator('button.launcher').click();
async function analyse(page: Page, text: string) {
  await page.locator('#ja-text').fill(text);
  await page.locator('form.input button[type=submit]').click();
  await expect(page.locator('#ja-results-title')).toBeFocused();
}
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('empty state, focus into textarea, Analyse disabled until text', async ({page}) => {
  const logs = await boot(page);
  await shot(page, 'desktop-1440-portfolio');
  await openPanel(page);
  await expect(page.locator('#ja-text')).toBeFocused();
  await expect(page.getByRole('button', {name: 'Analyse'})).toBeDisabled();
  await expect(page.locator('.state-empty')).toBeVisible();
  await shot(page, 'desktop-1440-empty');
  expect(logs.filter(l => /^(error|pageerror)/.test(l))).toEqual([]);
});

test('success: summary, route with reasons, requirement mapping with exact spans; portfolio order unchanged', async ({page}) => {
  const logs = await boot(page);
  const before = await page.locator('.case-row h3').allTextContents();
  await openPanel(page); await analyse(page, jd('jd01'));
  await expect(page.locator('.summary p').first()).toContainText('direct evidence');
  const routeItems = page.locator('.route li');
  expect(await routeItems.count()).toBeGreaterThan(0); expect(await routeItems.count()).toBeLessThanOrEqual(4);
  for (const li of await routeItems.all()) await expect(li.locator('.small').first()).toContainText('Relevant to');
  const reqTexts = await page.locator('.req-text').allTextContents();
  for (const r of reqTexts) expect(jd('jd01')).toContain(r);
  await expect(page.locator('.req', {hasText: '5+ years'}).locator('.chip-related')).toBeVisible();
  await expect(page.locator('.req', {hasText: 'Green Belt'})).toContainText('does not show this credential');
  await expect(page.locator('.req', {hasText: 'Green Belt'})).toContainText('Related practice for context');
  await expect(page.locator('.req', {hasText: 'Green Belt'}).locator('.chip-evidenced')).toHaveCount(0);
  expect(await page.locator('.case-row h3').allTextContents()).toEqual(before);
  expect(before).toEqual(CASES.map(c => c.title));
  await shot(page, 'desktop-1440-success');
  await page.locator('.panel-body').evaluate(el => el.scrollTo(0, el.scrollHeight / 2)); await shot(page, 'desktop-1440-success-requirements');
  expect(logs.filter(l => /^(error|pageerror)/.test(l))).toEqual([]);
});

test('no-related-evidence state for an unrelated role', async ({page}) => {
  await boot(page); await openPanel(page); await analyse(page, jd('jd26'));
  await expect(page.locator('.state-none h4')).toHaveText('No related evidence in this portfolio');
  await expect(page.locator('.route li')).toHaveCount(0);
  await shot(page, 'desktop-1440-no-related');
});

test('error state (simulated total failure) with retry; adapter failure falls back with an honest notice', async ({page}) => {
  await boot(page); await openPanel(page);
  await page.locator('.demo summary').click();
  await page.locator('.demo select').first().selectOption('error');
  await page.locator('#ja-text').fill(jd('jd03')); await page.getByRole('button', {name: 'Analyse'}).click();
  await expect(page.locator('#ja-error-title')).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('Nothing was sent or saved');
  await shot(page, 'desktop-1440-error');
  await page.locator('.demo select').first().selectOption('fail');
  await page.getByRole('button', {name: 'Try again'}).click();
  await expect(page.locator('#ja-results-title')).toBeFocused({timeout: 5000});
  await expect(page.locator('.results')).toContainText('The adapter failed; the built-in local parser was used instead.');
});

test('loading state with cancel, then mock async adapter result', async ({page}) => {
  await boot(page); await openPanel(page);
  await page.locator('.demo summary').click(); await page.locator('.demo select').first().selectOption('mock');
  await page.locator('#ja-text').fill(jd('jd12'));
  await page.getByRole('button', {name: 'Analyse'}).click();
  await expect(page.locator('.spinner')).toBeVisible(); await expect(page.locator('#ja-text')).toBeDisabled();
  await shot(page, 'desktop-1440-loading');
  await page.getByRole('button', {name: 'Cancel'}).click();
  await expect(page.locator('.state-empty')).toBeVisible(); await expect(page.locator('#ja-text')).toBeEnabled();
  await page.getByRole('button', {name: 'Analyse'}).click();
  await expect(page.locator('#ja-results-title')).toBeFocused({timeout: 5000});
  await expect(page.locator('.results')).toContainText('injected async adapter');
});

test('edited-stale banner, update, clear', async ({page}) => {
  await boot(page); await openPanel(page); await analyse(page, jd('jd16'));
  await page.locator('#ja-text').press('End'); await page.locator('#ja-text').type('\n- Power BI dashboards');
  await expect(page.locator('.state-stale')).toBeVisible(); await expect(page.locator('.results[data-dim]')).toHaveCount(1);
  await shot(page, 'desktop-1440-stale');
  await page.locator('.state-stale button').click();
  await expect(page.locator('.state-stale')).toHaveCount(0);
  await expect(page.locator('.req-text', {hasText: 'Power BI dashboards'})).toBeVisible();
  await page.getByRole('button', {name: 'Clear'}).click();
  await expect(page.locator('#ja-text')).toHaveValue(''); await expect(page.locator('.results')).toHaveCount(0); await expect(page.locator('#ja-text')).toBeFocused();
});

test('close with Escape returns focus; reopen keeps results', async ({page}) => {
  await boot(page); await openPanel(page); await analyse(page, jd('jd01'));
  await page.keyboard.press('Escape');
  await expect(page.locator('#ja-panel')).toBeHidden();
  await expect(page.locator('button.launcher')).toBeFocused();
  await expect(page.locator('button.launcher')).toContainText('results kept');
  await shot(page, 'desktop-1440-closed-kept');
  await page.keyboard.press('Enter');
  await expect(page.locator('#ja-results-title')).toBeFocused();
});

test('open a case from the assistant and return: panel, scroll and focus restored (button and browser Back)', async ({page}) => {
  await boot(page); await openPanel(page); await analyse(page, jd('jd01'));
  const btn = page.locator('.reqs [data-return-key]').nth(3);
  const key = await btn.getAttribute('data-return-key');
  await btn.scrollIntoViewIfNeeded(); await btn.focus();
  const scroll0 = await page.locator('.panel-body').evaluate(el => el.scrollTop);
  await page.keyboard.press('Enter');
  await expect(page.locator('#case-title')).toBeFocused(); await expect(page.locator('#ja-panel')).toBeHidden();
  await shot(page, 'desktop-1440-case-from-assistant');
  await page.getByRole('button', {name: /Back to job-match results/}).click();
  await expect(page.locator(`[data-return-key="${key}"]`)).toBeFocused();
  expect(Math.abs(await page.locator('.panel-body').evaluate(el => el.scrollTop) - scroll0)).toBeLessThanOrEqual(4);
  await page.keyboard.press('Enter'); await expect(page.locator('#case-title')).toBeFocused();
  await page.goBack();
  await expect(page.locator(`[data-return-key="${key}"]`)).toBeFocused();
  timelines['return-focus'] = {key, scroll0};
});

test('open a case from the portfolio list and return restores page scroll and focus', async ({page}) => {
  await boot(page);
  const btn = page.locator('[data-return-key="list-c6"]'); await btn.scrollIntoViewIfNeeded();
  const y0 = await page.evaluate(() => scrollY);
  await btn.click(); await expect(page.locator('#case-title')).toHaveText(CASES[5].title);
  await page.getByRole('button', {name: /Back to all cases/}).click();
  await expect(btn).toBeFocused();
  expect(Math.abs(await page.evaluate(() => scrollY) - y0)).toBeLessThanOrEqual(4);
});

test('pasted HTML, scripts, links and instructions stay inert text; no storage, no logging of job text', async ({page}) => {
  const logs = await boot(page); await openPanel(page);
  await analyse(page, jd('jd30'));
  expect(await page.locator('#ja-panel script, #ja-panel img, #ja-panel b').count()).toBe(0);
  await expect(page.locator('.req-text', {hasText: '<b>SPC</b>'})).toBeVisible();
  await analyse(page, jd('jd06'));
  expect(await page.locator('#ja-panel a[href*="example.invalid"]').count()).toBe(0);
  await expect(page.locator('.notice', {hasText: 'treated as plain text'})).toBeVisible();
  await expect(page.locator('.req-text', {hasText: 'Ignore all previous'})).toHaveCount(0);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(logs.filter(l => /Ignore all previous|fishbone|SPC/.test(l))).toEqual([]);
  await shot(page, 'desktop-1440-injection-inert');
});

test('truncation notices at 12,000 characters / 24 requirements', async ({page}) => {
  await boot(page); await openPanel(page);
  await page.locator('#ja-text').fill(jd('jd18'));
  await expect(page.locator('#ja-count')).toContainText('Only the first 12,000 characters');
  await page.getByRole('button', {name: 'Analyse'}).click();
  await expect(page.locator('.notice', {hasText: 'only the first 12,000 were analysed'})).toBeVisible();
  await expect(page.locator('.notice', {hasText: 'not analysed (limit 24)'})).toBeVisible();
  await expect(page.locator('.req')).toHaveCount(24);
});

for (const w of [375, 390]) test(`mobile ${w}: full-screen sheet, background inert, no overflow, Arabic RTL`, async ({page}) => {
  await boot(page, w);
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await shot(page, `mobile-${w}-portfolio`);
  await openPanel(page);
  await expect(page.locator('button.launcher')).toBeHidden();
  expect(await page.locator('main').getAttribute('inert')).not.toBeNull();
  const box = (await page.locator('#ja-panel').boundingBox())!; expect(box.width).toBe(w);
  await analyse(page, jd('jd01'));
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  expect(await page.locator('.panel-body').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
  await shot(page, `mobile-${w}-success`);
  if (w === 390) {
    await page.keyboard.press('Escape');
    await page.getByRole('button', {name: 'العربية'}).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.locator('button.launcher').click();
    await analyse(page, jd('jd04'));
    await expect(page.locator('#ja-results-title')).toHaveText('ما يمكن أن يضيفه المرشح');
    await expect(page.locator('.summary p').first()).toContainText('تُظهر الحالات');
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await shot(page, 'mobile-390-arabic-rtl');
  }
});

test.describe('motion (rAF samples in local headless Chromium; not display smoothness)', () => {
  const samplePanel = (page: Page, ms: number) => page.evaluate(ms => new Promise<{t: number; o: number; tx: string}[]>(res => {
    const out: {t: number; o: number; tx: string}[] = []; const t0 = performance.now();
    const tick = (now: number) => {const el = document.getElementById('ja-panel')!; const cs = getComputedStyle(el); out.push({t: Math.round(now - t0), o: +cs.opacity, tx: cs.transform}); if (now - t0 < ms) requestAnimationFrame(tick); else res(out);};
    requestAnimationFrame(tick);
  }), ms);
  test('panel entrance plays (normal motion)', async ({page}) => {
    await boot(page);
    const [, tl] = await Promise.all([openPanel(page), samplePanel(page, 400)]);
    const vals = tl.map(s => s.o);
    expect(vals.some(v => v > 0 && v < 1)).toBe(true); expect(vals[vals.length - 1]).toBe(1);
    timelines['panel-open'] = tl;
  });
  test('reduced motion: panel appears without intermediate frames, spinner static', async ({newContext, baseURL}) => {
    const ctx = await newContext({reducedMotion: 'reduce', viewport: {width: 390, height: 844}}); const page = await ctx.newPage();
    await page.goto(baseURL + '/');
    const [, tl] = await Promise.all([page.locator('button.launcher').click(), samplePanel(page, 200)]);
    expect(tl.filter(s => s.o > 0 && s.o < 1).length).toBe(0);
    await analyse(page, jd('jd01'));
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
    timelines['reduced-panel-open'] = tl;
  });
  test('recording: real-time interaction sample at 390 px', async ({newContext, baseURL}) => {
    const ctx = await newContext({viewport: {width: 390, height: 844}, recordVideo: {dir: '../../test-results/cloud-007/video', size: {width: 390, height: 844}}});
    const page = await ctx.newPage(); await page.goto(baseURL + '/'); await page.waitForTimeout(600);
    await page.locator('button.launcher').click(); await page.waitForTimeout(500);
    await page.locator('#ja-text').fill(jd('jd01')); await page.waitForTimeout(300);
    await page.getByRole('button', {name: 'Analyse'}).click(); await page.waitForTimeout(900);
    await page.locator('.panel-body').evaluate(el => el.scrollTo({top: 700, behavior: 'smooth'})); await page.waitForTimeout(900);
    await page.locator('.route [data-return-key]').first().click(); await page.waitForTimeout(800);
    await page.getByRole('button', {name: /Back to job-match results/}).click(); await page.waitForTimeout(800);
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
    const v = page.video()!; await ctx.close(); renameSync(await v.path(), `${EV}/interaction-390.webm`);
  });
});

test.afterAll(() => writeFileSync(`${EV}/motion-and-flow-samples.json`, JSON.stringify({run: EV, ...timelines}, null, 1)));
