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
    shell.remove();
    doc.documentElement.removeAttribute('data-public-prerender');
    root.removeAttribute('inert');
    root.removeAttribute('aria-hidden');
    return true;
  }
  observer.observe(root, { childList: true, subtree: true });
  // A failed app load leaves the complete public document usable.
  timer = schedule(() => observer.disconnect(), 60000);
  return { ready, disconnect: () => { observer.disconnect(); cancel(timer); } };
}
if (typeof document !== 'undefined') {
  const handoff = attachHandoff(document, window.location, MutationObserver, setTimeout, clearTimeout);
  if (handoff) import('./public-entry.js').catch(() => handoff.disconnect());
}
