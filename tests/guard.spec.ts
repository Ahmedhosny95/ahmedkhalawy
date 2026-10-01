// Negative tests for the shared guard. Interception only: nothing is sent; targets are reserved/invalid addresses.
import {readFileSync, readdirSync} from 'node:fs';
import {test, expect} from './helpers';
// @ts-ignore
import {observeGuard} from '../scripts/guard.mjs';

test('external host, external IP (v4/v6) and mutation requests are blocked, including in extra contexts', async ({page, newContext, blocked}) => {
  const extra = await (await newContext({javaScriptEnabled: true})).newPage();
  for (const p of [page, extra]) {
    await p.goto('/private/');
    const results = await p.evaluate(async () => {
      const t = (u: string, init?: RequestInit) => fetch(u, init).then(() => 'sent', () => 'blocked');
      return [
        await t('https://example.invalid/x'),               // external hostname (reserved .invalid TLD)
        await t('http://203.0.113.9/x'),                    // external IPv4 literal (TEST-NET-3)
        await t('http://[2001:db8::1]/x'),                  // external IPv6 literal (documentation prefix)
        await t('/api/contact', {method: 'POST', body: 'x'}),   // local mutation
        await t('/x', {method: 'PUT'}), await t('/x', {method: 'DELETE'}), await t('/x', {method: 'PATCH'}),
      ];
    });
    expect(results).toEqual(Array(7).fill('blocked'));
  }
  expect(blocked.length).toBe(14);
  expect(blocked.some(b => b.includes('203.0.113.9'))).toBe(true);
  expect(blocked.some(b => b.includes('2001:db8'))).toBe(true);
  expect(blocked.some(b => b.startsWith('POST'))).toBe(true);
  blocked.length = 0; // expected here; the fixture's own "nothing blocked" assertion then passes
});

test('passive observer (used by perf) records external attempts; the request is aborted locally, never sent', async ({newContext, blocked}) => {
  const ctx = await newContext(); // guarded: aborts before network I/O
  const seen = observeGuard(ctx, []);
  const p = await ctx.newPage(); await p.goto('/private/');
  await p.evaluate(() => fetch('http://203.0.113.9/x').catch(() => 0));
  expect(seen.some(b => b.includes('203.0.113.9'))).toBe(true);
  expect(blocked.some(b => b.includes('203.0.113.9'))).toBe(true); blocked.length = 0;
});

test('no unguarded browser.newContext / launch in tests or perf', async () => {
  for (const f of readdirSync('tests').filter(f => f.endsWith('.ts') && f !== 'helpers.ts' && f !== 'guard.spec.ts')) expect(readFileSync('tests/' + f, 'utf8'), f).not.toMatch(/browser\.newContext|browser\.newPage|chromium\.launch/);
  const perf = readFileSync('scripts/perf.mjs', 'utf8');
  expect(perf).toContain('observeGuard(ctx');
  expect(perf).not.toMatch(/browser\.newPage/);
});
