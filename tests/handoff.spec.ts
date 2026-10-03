// Adapter/source-level regression tests for prerender-handoff state carry-over (NOT production-shell proof).
import {test, expect} from './helpers';

type Case = {shell: string; client: string; focusSelector?: string; openBefore?: string[]};
async function run(page: any, c: Case) {
  await page.goto('/private/'); // inert loopback page with no shell, so the module's own side effect is a no-op
  return page.evaluate(async (c: Case) => {
    const m: any = await import('/handoff.test-entry.js');
    document.body.innerHTML = `<div id="public-prerender" data-route="/private">${c.shell}</div><div id="root" inert aria-hidden="true"></div>`;
    document.documentElement.setAttribute('data-public-prerender', '');
    const shell = document.getElementById('public-prerender')!;
    for (const t of c.openBefore ?? []) [...shell.querySelectorAll('summary')].find(s => s.textContent!.trim() === t)!.parentElement!.setAttribute('open', '');
    if (c.focusSelector) (shell.querySelector(c.focusSelector) as HTMLElement).focus();
    const focusedBefore = c.focusSelector ? document.activeElement?.textContent?.trim() : null;
    const handoff = m.attachHandoff(document, {pathname: '/private'}, class {observe() {} disconnect() {}}, () => 0, () => {});
    document.getElementById('root')!.innerHTML = c.client;
    const ok = handoff.ready();
    const root = document.getElementById('root')!;
    return {
      ok, shellGone: !document.getElementById('public-prerender'),
      open: Object.fromEntries([...root.querySelectorAll('details')].map((d, i) => [(d.querySelector('summary')!.textContent!.trim()) + '#' + i, (d as HTMLDetailsElement).open])),
      focus: document.activeElement === document.body ? 'BODY' : (document.activeElement!.closest('#root') ? 'root:' : 'other:') + document.activeElement!.textContent!.trim(),
      focusedBefore,
    };
  }, c);
}
const h = '<h1>T</h1>';
const det = (t: string, open = false) => `<details${open ? ' open' : ''}><summary>${t}</summary><p>x</p></details>`;

test('reordering and insertion: state maps by identity, not index', async ({page}) => {
  const r = await run(page, {
    shell: `<main>${h}${det('A')}${det('B')}${det('C')}</main>`, openBefore: ['B'],
    client: `<main>${h}${det('NEW')}${det('C')}${det('B')}${det('A')}</main>`,
  });
  expect(r.ok).toBe(true); expect(r.shellGone).toBe(true);
  expect(r.open).toEqual({'NEW#0': false, 'C#1': false, 'B#2': true, 'A#3': false});
});
test('closed state is preserved (client default open, user had it closed)', async ({page}) => {
  const r = await run(page, {shell: `<main>${h}${det('A')}${det('B', true)}</main>`, client: `<main>${h}${det('A', true)}${det('B', true)}</main>`});
  expect(r.open).toEqual({'A#0': false, 'B#1': true});
});
test('missing target: no guessing for details or focus', async ({page}) => {
  const r = await run(page, {
    shell: `<main>${h}${det('Gone')}<a href="/gone">Gone link</a></main>`, openBefore: ['Gone'], focusSelector: 'a[href="/gone"]',
    client: `<main>${h}${det('Other')}<a href="/other">Other link</a></main>`,
  });
  expect(r.open).toEqual({'Other#0': false}); expect(r.focus).toBe('BODY');
});
test('ambiguous target (duplicate identity in client) is left untouched', async ({page}) => {
  const r = await run(page, {shell: `<main>${h}${det('Dup')}</main>`, openBefore: ['Dup'], client: `<main>${h}${det('Dup')}${det('Dup')}</main>`});
  expect(r.open).toEqual({'Dup#0': false, 'Dup#1': false});
});
test('focus follows the same link after insertion, and nav scopes disambiguate same-text links', async ({page}) => {
  const nav = (extra: string) => `<header>${extra}<nav aria-label="Main navigation"><a href="/p">Work</a></nav><details><summary>Menu</summary><nav aria-label="Mobile navigation"><a href="/p">Work</a></nav></details></header>`;
  const r = await run(page, {
    shell: `${nav('')}<main>${h}</main>`, openBefore: ['Menu'], focusSelector: 'nav[aria-label="Mobile navigation"] a',
    client: `${nav('<a href="/skip">Skip</a><a href="/zzz">Z</a>')}<main>${h}</main>`,
  });
  expect(r.focus).toBe('root:Work');
  expect(r.open['Menu#0']).toBe(true);
  const inMobile = await page.evaluate(() => !!document.activeElement!.closest('nav[aria-label="Mobile navigation"]'));
  expect(inMobile).toBe(true);
});
test('first-HTML fallback preserved: shell stays when client content is not ready', async ({page}) => {
  const r = await run(page, {shell: `<main>${h}${det('A')}</main>`, openBefore: ['A'], client: `<div>no main yet</div>`});
  expect(r.ok).toBe(false); expect(r.shellGone).toBe(false);
});
