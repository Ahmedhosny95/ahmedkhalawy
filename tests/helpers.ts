import {test as base, expect, type Browser, type BrowserContext, type BrowserContextOptions, type Page} from '@playwright/test';
// @ts-ignore plain-JS module shared with scripts/perf.mjs
import {installGuard} from '../scripts/guard.mjs';
export const VIEWPORTS = [{w: 375, h: 812}, {w: 390, h: 844}, {w: 768, h: 1024}, {w: 1440, h: 900}];
export const COMPONENT_ROUTES = ['/', '/about', '/projects'];
export const ALL_ROUTES = [...COMPONENT_ROUTES, '/contact'];
export const SHOTS = 'evidence/cloud-002/screenshots';
type Fixtures = {blocked: string[]; newContext: (o?: BrowserContextOptions) => Promise<BrowserContext>};
/** Default `context`/`page` are guarded; any extra context MUST come from `newContext` (also guarded, same list). */
export const test = base.extend<Fixtures>({
  blocked: async ({}, use) => {const b: string[] = []; await use(b); expect(b, 'no outbound or mutating requests attempted').toEqual([]);},
  context: async ({context, blocked}, use) => {await installGuard(context, blocked); await use(context);},
  newContext: async ({browser, blocked}, use) => {
    const made: BrowserContext[] = [];
    await use(async (o = {}) => {const c = await browser.newContext(o); await installGuard(c, blocked); made.push(c); return c;});
    for (const c of made) await c.close();
  },
});
export {expect};
export async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => ({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth}));
}
export type {Browser};
