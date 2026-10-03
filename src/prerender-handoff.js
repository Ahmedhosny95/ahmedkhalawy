// Same visible public HTML for people and crawlers. No user-agent branching.
export function attachHandoff(doc, location, Observer, schedule, cancel) {
  const shell = doc.getElementById('public-prerender');
  const root = doc.getElementById('root');
  if (!shell || !root || location.pathname.replace(/\/$/, '') !== shell.dataset.route.replace(/\/$/, '')) return null;
  let timer;
  const expected = shell.querySelector('h1')?.textContent;
  const observer = new Observer(ready);
  function ready() {
    if (root.querySelector('h1')?.textContent !== expected || !root.querySelector('main')) return false;
    observer.disconnect();
    cancel(timer);
    const carry = captureState(shell);
    shell.remove();
    doc.documentElement.removeAttribute('data-public-prerender');
    root.removeAttribute('inert');
    root.removeAttribute('aria-hidden');
    restoreState(root, carry);
    return true;
  }
  observer.observe(root, { childList: true, subtree: true });
  // A failed app load leaves the complete public document usable.
  timer = schedule(() => observer.disconnect(), 60000);
  return { ready, disconnect: () => { observer.disconnect(); cancel(timer); } };
}
// Keep in-progress interaction (<details> open/closed, keyboard focus) when React replaces the first HTML.
// Elements are matched by a stable semantic identity (never by position). A target that is missing or
// ambiguous (identity not unique) on either side is left untouched: we never guess.
const FOCUSABLE = 'a[href],button,summary,input,select,textarea,[tabindex]';
const clean = t => (t || '').replace(/\s+/g, ' ').trim().slice(0, 100);
const summaryText = d => clean(d.querySelector(':scope > summary')?.textContent);
function scopeOf(el) {
  const parts = [];
  for (let n = el.parentElement; n; n = n.parentElement) {
    if (n.id === 'public-prerender' || n.id === 'root') break;
    if (n.tagName === 'DETAILS') parts.push('details:' + summaryText(n));
    else if (n.tagName === 'NAV' || n.tagName === 'SECTION' || n.tagName === 'FORM') parts.push(n.tagName.toLowerCase() + ':' + (n.getAttribute('aria-label') || n.getAttribute('aria-labelledby') || n.id || ''));
    else if (/^(HEADER|FOOTER|MAIN|ASIDE)$/.test(n.tagName)) parts.push(n.tagName.toLowerCase());
  }
  return parts.reverse().join('>');
}
const detailsKey = d => 'details|' + scopeOf(d) + '|' + summaryText(d);
const focusKey = el => ['focus', el.tagName, el.getAttribute('href') || '', el.getAttribute('name') || '', el.getAttribute('aria-label') || '', clean(el.textContent), scopeOf(el)].join('|');
function indexUnique(nodes, keyFn) {
  const map = new Map();
  for (const n of nodes) { const k = keyFn(n); map.set(k, map.has(k) ? null : n); }
  return map; // value null = ambiguous
}
export function captureState(shell) {
  const doc = shell.ownerDocument;
  const details = new Map();
  for (const [k, d] of indexUnique(shell.querySelectorAll('details'), detailsKey)) if (d) details.set(k, d.open);
  let focus = null;
  const active = doc.activeElement;
  if (active && shell.contains(active) && active.matches(FOCUSABLE)) {
    const k = focusKey(active);
    if (indexUnique(shell.querySelectorAll(FOCUSABLE), focusKey).get(k) === active) focus = k;
  }
  return { details, focus };
}
export function restoreState(root, { details, focus }) {
  for (const [k, d] of indexUnique(root.querySelectorAll('details'), detailsKey)) if (d && details.has(k)) d.open = details.get(k);
  if (focus) indexUnique(root.querySelectorAll(FOCUSABLE), focusKey).get(focus)?.focus({ preventScroll: true });
}
if (typeof document !== 'undefined') {
  const handoff = attachHandoff(document, window.location, MutationObserver, setTimeout, clearTimeout);
  if (handoff) import('./public-entry.js').catch(() => handoff.disconnect());
}
