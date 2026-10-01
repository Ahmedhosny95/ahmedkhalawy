// Reproduction tests for the bounded defect fixes (see docs/cloud-001.md). Each failed before its fix.
import AxeBuilder from '@axe-core/playwright';
import {test, expect} from './helpers';

test('D1 contrast: Home/About small labels meet WCAG AA 4.5:1 (axe color-contrast)', async ({page}) => {
  for (const r of ['/', '/about']) {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto(r); await expect(page.locator('#root h1')).toBeVisible();
    const res = await new AxeBuilder({page}).withRules(['color-contrast']).analyze();
    expect(res.violations.map(v => `${r} ${v.id} ${v.nodes.length}`)).toEqual([]);
  }
});

test.describe('D2 handoff preserves in-progress user state when React replaces the first HTML', () => {
  test('open mobile menu and disclosure survive handoff', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    let release!: () => void; const gate = new Promise<void>(r => (release = r));
    await page.route('**/public-entry.js', async route => {await gate; await route.continue();});
    await page.goto('/about', {waitUntil: 'domcontentloaded'});
    await page.locator('#public-prerender .adapter-mobile summary').click();
    await page.locator('#public-prerender details.op-profile-details > summary', {hasText: 'more recommendations'}).click();
    await expect(page.locator('#public-prerender .adapter-mobile')).toHaveAttribute('open', '');
    release();
    await expect(page.locator('#root h1')).toBeVisible({timeout: 10_000});
    await expect(page.locator('#root .adapter-mobile')).toHaveAttribute('open', '');
    await expect(page.locator('#root details.op-profile-details').nth(1)).toHaveAttribute('open', '');
  });
});

test.describe('D3 handoff preserves keyboard focus', () => {
  test('focused skip link/nav link is not lost to <body> when handoff replaces DOM', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    let release!: () => void; const gate = new Promise<void>(r => (release = r));
    await page.route('**/public-entry.js', async route => {await gate; await route.continue();});
    await page.goto('/about', {waitUntil: 'domcontentloaded'});
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    const before = await page.evaluate(() => document.activeElement?.getAttribute('href'));
    expect(before).toBeTruthy();
    release();
    await expect(page.locator('#root h1')).toBeVisible({timeout: 10_000});
    const after = await page.evaluate(() => ({tag: document.activeElement?.tagName, href: document.activeElement?.getAttribute('href'), inRoot: !!document.activeElement?.closest('#root')}));
    expect(after.href).toBe(before); expect(after.inRoot).toBe(true);
  });
});
