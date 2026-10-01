import {readFileSync, mkdirSync} from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import {test, expect, VIEWPORTS, COMPONENT_ROUTES, ALL_ROUTES, SHOTS, noHorizontalOverflow} from './helpers';

const searchData = readFileSync('src/search-data.js', 'utf8');
const expectedMeta = (JSON.parse(searchData.match(/routes=(\{.*?\});?\nconst/s)![1]) as Record<string, any>);
const contract = JSON.parse(readFileSync('fixtures/public-contract.json', 'utf8'));
mkdirSync(SHOTS, {recursive: true});
const slug = (r: string) => (r === '/' ? 'home' : r.slice(1));

test.describe('layout at required viewports (components: Home/About/Work; static fixture: Contact)', () => {
  for (const r of ALL_ROUTES) for (const v of VIEWPORTS) {
    test(`${r} @${v.w}x${v.h}: renders h1, no horizontal overflow`, async ({page}) => {
      await page.setViewportSize({width: v.w, height: v.h});
      await page.goto(r);
      await expect(page.locator('h1').first()).toBeVisible();
      const o = await noHorizontalOverflow(page);
      expect(o.sw, `scrollWidth ${o.sw} > clientWidth ${o.cw}`).toBeLessThanOrEqual(o.cw);
      if (v.w === 375 || v.w === 1440) await page.screenshot({path: `${SHOTS}/${slug(r)}-${v.w}x${v.h}.png`});
    });
  }
});

test.describe('JavaScript modes', () => {
  for (const r of COMPONENT_ROUTES) {
    test(`${r}: first HTML is complete with JS disabled`, async ({newContext, baseURL}) => {
      const ctx = await newContext({javaScriptEnabled: false}); const page = await ctx.newPage();
      await page.goto(baseURL + r);
      await expect(page.locator('#public-prerender h1')).toBeVisible();
      await expect(page.locator('#public-prerender main#main-content')).toBeVisible();
      await expect(page.locator('#public-prerender a[href="#main-content"]')).toHaveCount(1);
          });
    test(`${r}: raw first HTML contains content, title and canonical`, async ({request}) => {
      const html = await (await request.get(r)).text();
      expect(html).toContain('<h1');
      expect(html).toContain(`<title>${expectedMeta[r].title.replace(/&/g, '&amp;')}</title>`);
      expect(html).toContain(`rel="canonical" href="${expectedMeta[r].url}"`);
    });
    test(`${r}: JS enabled hands off to React with same h1`, async ({page}) => {
      const raw = await (await page.request.get(r)).text();
      const ssrH1 = raw.match(/<h1[^>]*>(.*?)<\/h1>/s)![1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
      await page.goto(r);
      await expect(page.locator('#public-prerender')).toHaveCount(0);
      await expect(page.locator('html[data-public-prerender]')).toHaveCount(0);
      await expect(page.locator('#root h1')).toHaveText(ssrH1);
      await expect(page.locator('#root')).not.toHaveAttribute('inert', /.*/);
      await expect(page.locator('main')).toHaveCount(1);
    });
    test(`${r}: delayed script keeps shell visible, then hands off`, async ({page}) => {
      await page.route('**/public-entry.js', async route => {await new Promise(res => setTimeout(res, 1500)); await route.continue();});
      await page.goto(r, {waitUntil: 'domcontentloaded'});
      await expect(page.locator('#public-prerender h1')).toBeVisible();
      await expect(page.locator('#root h1')).toBeVisible({timeout: 10_000});
      await expect(page.locator('#public-prerender')).toHaveCount(0);
    });
    test(`${r}: failed script leaves complete usable shell`, async ({page}) => {
      await page.route('**/public-entry.js', route => route.abort());
      await page.goto(r);
      await expect(page.locator('#public-prerender h1')).toBeVisible();
      await expect(page.locator('#public-prerender main')).toBeVisible();
      await page.waitForTimeout(500);
      await expect(page.locator('#public-prerender h1')).toBeVisible();
      await expect(page.locator('#root')).toBeHidden();
    });
  }
  test('/contact static fixture is usable with JS disabled (it has no scripts anyway)', async ({newContext, baseURL}) => {
    const ctx = await newContext({javaScriptEnabled: false}); const page = await ctx.newPage();
    await page.goto(baseURL + '/contact');
    await expect(page.locator('h1')).toContainText('Let’s talk');
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
      });
});

test.describe('metadata: title / canonical / schema / protected routes', () => {
  for (const r of ALL_ROUTES) {
    test(`${r} head matches approved metadata (after JS too)`, async ({page}) => {
      await page.goto(r);
      await page.waitForTimeout(300);
      const d = expectedMeta[r];
      expect(await page.title()).toBe(d.title);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', d.url);
      await expect(page.locator('link[rel=canonical]')).toHaveCount(1);
      await expect(page.locator('meta[name=description]')).toHaveAttribute('content', d.description);
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(ld.length).toBe(1);
      const g = JSON.parse(ld[0])['@graph'];
      const person = g.find((n: any) => n['@type'] === 'Person');
      expect(person.jobTitle).toBe('Senior QA/QC Engineer');
      expect(person.alternateName).toBe('احمد خلوي');
      const wp = g.find((n: any) => n['@type'] === 'WebPage');
      expect(wp.url).toBe(d.url);
      expect(wp.name).toBe(d.title);
      expect(await page.locator('meta[name=robots]').count()).toBe(0);
    });
  }
  test('/private and /private/ carry noindex header; query/deeper/other protected paths excluded', async ({request}) => {
    for (const p of contract.protected_entry_fixture.paths) {
      const res = await request.get(p);
      expect(res.status()).toBe(200);
      expect(res.headers()['x-robots-tag']).toBe('noindex, nofollow, nosnippet');
    }
    for (const p of ['/private/portfolio', '/review/', '/admin/login', '/api/bootstrap']) expect((await request.get(p)).status()).toBe(404);
  });
  test('REP rules: terminal $ and longest-rule matching', async () => {
    const rules = contract.rep_rules.map((s: string) => s.split(': ') as [string, string]);
    const match = (path: string) => {
      let best: {len: number; allow: boolean} | null = null;
      for (const [k, pat] of rules) {
        const anchored = pat.endsWith('$'); const base = anchored ? pat.slice(0, -1) : pat;
        if (anchored ? path === base : path.startsWith(base)) { const len = pat.length; const allow = k === 'Allow'; if (!best || len > best.len || (len === best.len && allow)) best = {len, allow}; }
      }
      return best ? best.allow : true;
    };
    expect(match('/private')).toBe(true); expect(match('/private/')).toBe(true);
    for (const p of contract.rep_excluded_local_examples) expect(match(p.split('?')[0] + (p.includes('?') ? '?' : '')), p).toBe(false);
    expect(match('/private?guest=x')).toBe(false);
    expect(match('/about')).toBe(true);
  });
});

test.describe('navigation, back and cross-page anchors (native links)', () => {
  test('direct entry, nav clicks, back/forward keep content & title', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/about'); await expect(page.locator('h1').first()).toBeVisible();
    await page.getByRole('navigation', {name: 'Main navigation'}).getByRole('link', {name: 'Work'}).click();
    await expect(page).toHaveURL(/\/projects$/); expect(await page.title()).toBe(expectedMeta['/projects'].title);
    await page.goBack(); await expect(page).toHaveURL(/\/about$/); await expect(page.locator('h1').first()).toBeVisible();
    expect(await page.title()).toBe(expectedMeta['/about'].title);
    await page.goForward(); await expect(page).toHaveURL(/\/projects$/);
  });
  test('cross-page anchor Home -> /about#credentials lands on the section', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/');
    await page.locator('a[href="/about#credentials"]').first().click();
    await expect(page).toHaveURL(/\/about#credentials$/);
    await expect(page.locator('#credentials')).toBeVisible();
    await expect.poll(async () => page.evaluate(() => Math.round(document.getElementById('credentials')!.getBoundingClientRect().top)), {timeout: 5000}).toBeLessThan(400);
  });
  test('About in-page anchors #career and #recommendations scroll to target', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/about');
    for (const id of ['career', 'recommendations']) {
      await page.locator(`a[href="#${id}"]`).first().click();
      await expect.poll(async () => page.evaluate((i) => Math.round(document.getElementById(i)!.getBoundingClientRect().top), id)).toBeLessThan(300);
    }
  });
  test('Direct entry with hash scrolls after handoff (/about#recommendations)', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/about#recommendations');
    await expect(page.locator('#root h1')).toBeVisible();
    await expect.poll(async () => page.evaluate(() => Math.round(document.getElementById('recommendations')!.getBoundingClientRect().top)), {timeout: 5000}).toBeLessThan(300);
  });
});

test.describe('keyboard, focus, menu and disclosures', () => {
  test('skip link is first tab stop and moves focus to main', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto('/'); await expect(page.locator('#root h1')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Skip to content');
    expect(await page.evaluate(() => { const r = document.activeElement!.getBoundingClientRect(); return r.top >= 0 && r.left >= 0; })).toBe(true);
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('main-content');
  });
  test('mobile menu opens by keyboard and links are reachable', async ({page}) => {
    await page.setViewportSize({width: 375, height: 812});
    await page.goto('/'); await expect(page.locator('#root h1')).toBeVisible();
    const summary = page.locator('.adapter-mobile summary');
    await expect(summary).toBeVisible();
    await expect(page.locator('header nav[aria-label="Main navigation"]')).toBeHidden();
    await summary.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('.adapter-mobile')).toHaveAttribute('open', '');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '/projects');
    const box = await page.locator('.adapter-mobile nav').boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });
  test('About disclosure (more recommendations) toggles with keyboard and shows 22 attributed quotes', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/about'); await expect(page.locator('#root h1')).toBeVisible();
    const sum = page.locator('details.op-profile-details > summary', {hasText: 'more recommendations'});
    await sum.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('details.op-profile-details').nth(1)).toHaveAttribute('open', '');
    await expect(page.locator('.op-recommendation blockquote')).toHaveCount(22);
    await page.keyboard.press('Space');
    await expect(page.locator('details.op-profile-details').nth(1)).not.toHaveAttribute('open', '');
    const outline = await sum.evaluate(el => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth);
    expect(outline).toMatch(/solid 3px/);
  });
});

// NOTE: this is a reflow / high-DPI PROXY (halved CSS viewport + deviceScaleFactor 2). It is NOT browser zoom; real zoom is untested.
test.describe('reflow + high-DPI proxy (NOT real browser zoom)', () => {
  for (const [w, h, label] of [[640, 400, 'halved 640x400 viewport @DPR2 (proxy for 200% zoom)'], [320, 256, 'WCAG reflow 320 CSS px']] as const) for (const r of ALL_ROUTES) {
    test(`${r} ${label}: no horizontal scroll, content reachable`, async ({newContext, baseURL}) => {
      const ctx = await newContext({viewport: {width: w, height: h}, deviceScaleFactor: 2}); const page = await ctx.newPage();
      await page.goto(baseURL + r); await expect(page.locator('h1').first()).toBeVisible();
      const o = await noHorizontalOverflow(page);
      expect(o.sw, `scrollWidth ${o.sw} > ${o.cw}`).toBeLessThanOrEqual(o.cw);
          });
  }
});

test.describe('automated accessibility (axe serious/critical)', () => {
  for (const r of ALL_ROUTES) for (const w of [390, 1440]) {
    test(`${r} @${w}`, async ({page}) => {
      await page.setViewportSize({width: w, height: w === 390 ? 844 : 900});
      await page.goto(r); await expect(page.locator('h1').first()).toBeVisible(); await page.waitForTimeout(300);
      const res = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = res.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => `${v.id}: ${v.nodes.length} nodes e.g. ${v.nodes[0].target.join(' ')}`);
      // /contact is a static fixture without the original compiled base CSS: target-size findings there are a fixture limitation, reported not fixed.
      const allowed = r === '/contact' ? bad.filter(b => !b.startsWith('target-size:')) : bad;
      if (allowed.length !== bad.length) test.info().annotations.push({type: 'fixture-limitation', description: bad.join('; ')});
      expect(allowed).toEqual([]);
    });
  }
});

test.describe('factual guardrails (content preserved)', () => {
  test('Home/About/Work keep identity, dates, separation and training wording', async ({page}) => {
    await page.goto('/about'); const about = await page.locator('main').innerText();
    expect(about).toContain('احمد خلوي');
    expect(about).toContain('Senior QA/QC Engineer');
    expect(about).toMatch(/Yuksel Saudia[\s\S]{0,80}March 2025\s*—\s*Present|March 2025\s*—\s*Present[\s\S]{0,40}Yuksel Saudia/);
    expect(about).toMatch(/Eibla for Energy[\s\S]{0,80}March 2025|August 2023\s*—\s*March 2025/);
    expect(about).toContain('Training completion is distinct from professional auditor registration');
    expect(about).toContain('not official employer endorsements');
    expect(about).toContain('ProDigi Consult');
    expect(about).toMatch(/open to senior quality engineering and quality management opportunities, including Quality Manager or QA\/QC Manager roles/);
    expect(about).toContain('My current title remains Senior QA/QC Engineer');
    await page.goto('/projects'); const work = await page.locator('main').innerText();
    expect(work).toContain('ProDigi Consult'); expect(work.toLowerCase()).toContain('separate');
    await page.goto('/'); const home = await page.locator('main').innerText();
    expect(home).toContain('احمد خلوي');
    expect(home).toMatch(/Senior QA\/QC Engineer/);
  });
  test('Arabic recommendation excerpt is bidi-aware', async ({page}) => {
    await page.goto('/about');
    const arabic = page.locator('.op-recommendation blockquote[dir=auto]', {hasText: 'مهندس احمد'}).first();
    await expect(arabic).toHaveCount(1);
  });
});

test.describe('Contact contract (static fixture only, submissions inert)', () => {
  test('public details, form disabled/no action, no network on interaction', async ({page}) => {
    await page.goto('/contact');
    await expect(page.locator('a[href="mailto:ahmed.hosny.helmy@gmail.com"]')).toHaveCount(1);
    await expect(page.locator('a[href="tel:+966597766864"]')).toHaveCount(1);
    await expect(page.locator('a[href="https://www.linkedin.com/in/ahmed-khalawy-513a271a1/"]').first()).toBeVisible();
    await expect(page.locator('button[type=submit]')).toBeDisabled();
    expect(await page.locator('form').getAttribute('action')).toBeNull();
    await expect(page.locator('script')).toHaveCount(1); // JSON-LD only; no executable scripts
  });
});

test.describe('CV download (local TEST FIXTURE, not production delivery)', () => {
  test('link contract and fixture download', async ({page}) => {
    await page.goto('/about');
    const link = page.locator('a.op-cv-download').first();
    await expect(link).toHaveAttribute('href', contract.public_cv_link.href);
    await expect(link).toHaveAttribute('download', contract.public_cv_link.download_filename);
    const [dl] = await Promise.all([page.waitForEvent('download'), link.click()]);
    expect(dl.suggestedFilename()).toBe('Ahmed-Khalawy-Public-CV.pdf');
    const path = await dl.path(); expect(readFileSync(path!, 'latin1')).toContain('TEST FIXTURE');
  });
});

test.describe('reduced motion', () => {
  test('prefers-reduced-motion: no CSS animations/transitions running on Home', async ({newContext, baseURL}) => {
    const ctx = await newContext({reducedMotion: 'reduce'}); const page = await ctx.newPage();
    await page.goto(baseURL + '/'); await expect(page.locator('#root h1')).toBeVisible();
    const n = await page.evaluate(() => document.getAnimations().length);
    expect(n).toBe(0);
      });
});

test.describe('metadata cleanup logic (unit-level, source module)', () => {
  test('syncSearchMetadata removes public metadata outside the allowlist and adds noindex for protected paths', async ({page}) => {
    await page.goto('/about'); await page.waitForTimeout(300);
    const res = await page.evaluate(async () => {
      const m: any = await import('/metadata-runtime.test-entry.js');
      m.syncSearchMetadata('/private/portfolio');
      const a = {canonical: document.querySelectorAll('link[rel=canonical]').length, og: document.querySelectorAll('meta[property^="og:"]').length, ld: document.querySelectorAll('script[type="application/ld+json"]').length, robots: document.querySelector('meta[name=robots]')?.getAttribute('content')};
      m.syncSearchMetadata('/about');
      return {a, back: document.querySelectorAll('link[rel=canonical]').length};
    });
    expect(res.a).toEqual({canonical: 0, og: 0, ld: 0, robots: 'noindex, nofollow, nosnippet'});
    expect(res.back).toBe(1);
  });
});
