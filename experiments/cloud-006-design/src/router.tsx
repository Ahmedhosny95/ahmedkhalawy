// Minimal History-API router for the prototype.
// - Path changes remount the route (with the enter transition); same-path hash traversal (native or via Link) never remounts,
//   so disclosure state and DOM survive Back/Forward.
// - Every history entry stores {y, focus, open}: scroll position, a stable description of the focused control and the
//   summaries of open <details>; Back/Forward restore all three.
import * as React from 'react';

type Nav = {path: string; hash: string; kind: 'initial' | 'push' | 'pop'; routeKey: number; seq: number};
type Entry = {y?: number; focus?: string | null; open?: string[]};
const Ctx = React.createContext<{nav: Nav; go: (to: string) => void}>(null as any);
export const ROUTES = ['/', '/about', '/projects', '/contact'] as const;
export const normalize = (p: string) => (p.replace(/\/+$/, '') || '/');

const summaryText = (d: Element) => (d.querySelector(':scope > summary')?.textContent || '').replace(/\s+/g, ' ').trim();
function describeFocus(el: Element | null): string | null {
  if (!el || el === document.body || !document.getElementById('main')?.parentElement?.contains(el)) return null;
  if (el.id) return '#' + CSS.escape(el.id);
  const scope = el.closest('[id]');
  const href = el.getAttribute('href');
  if (href) return `${scope ? '#' + CSS.escape(scope.id) + ' ' : ''}a[href="${CSS.escape(href)}"]`;
  if (el.tagName === 'SUMMARY') return `summary@${summaryText(el.parentElement!)}`;
  return null;
}
function findFocus(desc: string | null | undefined): HTMLElement | null {
  if (!desc) return null;
  if (desc.startsWith('summary@')) return [...document.querySelectorAll<HTMLElement>('main details > summary')].find(s => summaryText(s.parentElement!) === desc.slice(8)) ?? null;
  const all = document.querySelectorAll<HTMLElement>(desc);
  return all.length === 1 ? all[0] : null; // never guess between duplicates
}
const snapshot = (): Entry => ({
  y: window.scrollY,
  focus: describeFocus(document.activeElement),
  open: [...document.querySelectorAll('main details[open]')].map(summaryText),
});
const save = (extra: Entry = {}) => {try {history.replaceState({...(history.state || {}), ...snapshot(), ...extra}, '');} catch {/* ignore */}};

export function Router({initialPath, children}: {initialPath: string; children: React.ReactNode}) {
  const [nav, setNav] = React.useState<Nav>({path: normalize(initialPath), hash: '', kind: 'initial', routeKey: 0, seq: 0});
  const pathRef = React.useRef(nav.path);
  pathRef.current = nav.path;
  const go = React.useCallback((to: string) => {
    const url = new URL(to, window.location.href);
    const path = normalize(url.pathname);
    save();
    if (path === pathRef.current) { // same-page anchor: no remount
      history.pushState({}, '', url.hash || url.pathname);
      jumpTo(url.hash); save();
      return;
    }
    history.pushState({}, '', url.pathname + url.hash);
    setNav(n => ({path, hash: url.hash, kind: 'push', routeKey: n.routeKey + 1, seq: n.seq + 1}));
  }, []);
  React.useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // Native same-page hash links: record where we were (scroll + focus + open disclosures) before the browser jumps.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href^="#"]');
      if (a && !e.defaultPrevented && e.button === 0) save();
    };
    let popping = false;
    const onHash = () => {
      if (popping) return; // Back/Forward: restore() already handled scroll/focus
      const el = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) {if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({preventScroll: true});}
      save();
    };
    const onPop = () => {
      popping = true; setTimeout(() => (popping = false), 0);
      const path = normalize(location.pathname);
      if (path === pathRef.current) {restore(history.state, location.hash); return;} // same route: keep DOM
      setNav(n => ({path, hash: location.hash, kind: 'pop', routeKey: n.routeKey + 1, seq: n.seq + 1}));
    };
    let t: number | undefined;
    const onScroll = () => {clearTimeout(t); t = window.setTimeout(() => save({focus: (history.state || {}).focus ?? null}), 150);};
    document.addEventListener('click', onClick, true);
    addEventListener('hashchange', onHash); addEventListener('popstate', onPop); addEventListener('scroll', onScroll, {passive: true});
    return () => {document.removeEventListener('click', onClick, true); removeEventListener('hashchange', onHash); removeEventListener('popstate', onPop); removeEventListener('scroll', onScroll);};
  }, []);
  React.useLayoutEffect(() => {
    if (nav.kind === 'initial') return;
    if (nav.kind === 'pop') {
      restore(history.state, nav.hash);
      if (document.activeElement === document.body) document.querySelector<HTMLElement>('main h1')?.focus({preventScroll: true});
      return;
    }
    if (nav.hash) jumpTo(nav.hash);
    else {window.scrollTo(0, 0); document.querySelector<HTMLElement>('main h1')?.focus({preventScroll: true});}
    save();
  }, [nav.seq]);
  return <Ctx.Provider value={{nav, go}}>{children}</Ctx.Provider>;
}
function jumpTo(hash: string) {
  const el = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!el) {window.scrollTo(0, 0); return;}
  el.scrollIntoView({block: 'start'});
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({preventScroll: true});
}
function restore(state: Entry | null, hash: string) {
  const s = state || {};
  if (s.open) for (const d of document.querySelectorAll<HTMLDetailsElement>('main details')) d.open = s.open.includes(summaryText(d));
  if (typeof s.y === 'number') window.scrollTo(0, s.y); else if (hash) jumpTo(hash); else window.scrollTo(0, 0);
  const f = findFocus(s.focus) ?? (hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null);
  if (f) {if (!f.matches('a,button,summary,input,[tabindex]')) f.setAttribute('tabindex', '-1'); f.focus({preventScroll: true});}
}
export const useNav = () => React.useContext(Ctx);

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {to: string};
export function Link({to, onClick, ...rest}: LinkProps) {
  const {go} = useNav();
  return <a {...rest} href={to} onClick={e => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const u = new URL(to, location.href);
    if (u.origin !== location.origin || !(ROUTES as readonly string[]).includes(normalize(u.pathname))) return;
    e.preventDefault(); go(to);
  }}/>;
}
