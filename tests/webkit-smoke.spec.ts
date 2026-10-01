import {test, expect, ALL_ROUTES} from './helpers';
test.describe('WebKit smoke (runs only where WebKit is installed)', () => {
  for (const r of ALL_ROUTES) test(`${r} renders at 390x844, no overflow, title set`, async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto(r); await expect(page.locator('h1').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect((await page.title()).length).toBeGreaterThan(5);
  });
  test('menu and handoff', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844}); await page.goto('/');
    await expect(page.locator('#root h1')).toBeVisible();
    await page.locator('.adapter-mobile summary').click();
    await expect(page.locator('.adapter-mobile')).toHaveAttribute('open', '');
  });
});
