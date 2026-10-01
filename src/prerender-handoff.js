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
// Keep in-progress interaction (open <details>, keyboard focus) when React replaces the first HTML.
const FOCUSABLE = 'a[href],button,summary,input,select,textarea,[tabindex]';
function captureState(shell) {
  const doc = shell.ownerDocument;
  const open = [...shell.querySelectorAll('details')].map(d => d.open);
  const focus = shell.contains(doc.activeElement) ? [...shell.querySelectorAll(FOCUSABLE)].indexOf(doc.activeElement) : -1;
  return { open, focus };
}
function restoreState(root, { open, focus }) {
  root.querySelectorAll('details').forEach((d, i) => { if (open[i]) d.open = true; });
  if (focus >= 0) root.querySelectorAll(FOCUSABLE)[focus]?.focus({ preventScroll: true });
}
if (typeof document !== 'undefined') {
  const handoff = attachHandoff(document, window.location, MutationObserver, setTimeout, clearTimeout);
  if (handoff) import('./public-entry.js').catch(() => handoff.disconnect());
}
