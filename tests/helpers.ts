import {test as base, expect, type Page} from '@playwright/test';
export const VIEWPORTS = [{w: 375, h: 812}, {w: 390, h: 844}, {w: 768, h: 1024}, {w: 1440, h: 900}];
export const COMPONENT_ROUTES = ['/', '/about', '/projects'];
export const ALL_ROUTES = [...COMPONENT_ROUTES, '/contact'];
export const LOOPBACK = /^http:\/\/127\.0\.0\.1:\d+\//;
/** Every test gets an outbound guard: non-loopback requests are aborted and recorded; POSTs are aborted. */
export const test = base.extend<{blocked: string[]}>({
  blocked: [async ({context}, use) => {
    const blocked: string[] = [];
    await context.route('**/*', route => {
      const r = route.request();
      if (!LOOPBACK.test(r.url()) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) {blocked.push(r.url()); return route.abort();}
      if (r.method() === 'POST') {blocked.push('POST ' + r.url()); return route.abort();}
      return route.continue();
    });
    await use(blocked);
    expect(blocked, 'no outbound or POST requests attempted').toEqual([]);
  }, {auto: true}],
});
export {expect};
export const sel = {h1: 'h1', main: 'main#main-content'};
export async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => ({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth}));
}
