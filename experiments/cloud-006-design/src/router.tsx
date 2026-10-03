// Minimal History-API router for the prototype: same-origin links, Back/Forward, hash targets,
// per-entry scroll restoration and focus management after client navigation.
import * as React from 'react';

type Nav = {path: string; hash: string; kind: 'initial' | 'push' | 'pop'; key: number};
const Ctx = React.createContext<{nav: Nav; go: (to: string) => void}>(null as any);
export const ROUTES = ['/', '/about', '/projects', '/contact'] as const;
export const normalize = (p: string) => (p.replace(/\/+$/, '') || '/');

export function Router({initialPath, children}: {initialPath: string; children: React.ReactNode}) {
  const [nav, setNav] = React.useState<Nav>({path: normalize(initialPath), hash: '', kind: 'initial', key: 0});
  const go = React.useCallback((to: string) => {
    const url = new URL(to, window.location.href);
    const path = normalize(url.pathname);
    if (path === normalize(window.location.pathname) && url.hash) { // same-page anchor: native jump, keep history
      history.pushState({y: 0}, '', url.hash);
      scrollToHash(url.hash);
      return;
    }
    history.replaceState({...(history.state || {}), y: window.scrollY}, '');
    history.pushState({y: 0}, '', url.pathname + url.hash);
    setNav(n => ({path, hash: url.hash, kind: 'push', key: n.key + 1}));
  }, []);
  React.useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const onPop = () => setNav(n => ({path: normalize(location.pathname), hash: location.hash, kind: 'pop', key: n.key + 1}));
    const onScroll = () => {try {history.replaceState({...(history.state || {}), y: window.scrollY}, '');} catch {/* rate-limited */}};
    let t: number | undefined;
    const debounced = () => {clearTimeout(t); t = window.setTimeout(onScroll, 120);};
    addEventListener('popstate', onPop); addEventListener('scroll', debounced, {passive: true});
    return () => {removeEventListener('popstate', onPop); removeEventListener('scroll', debounced);};
  }, []);
  // After a client navigation: restore scroll (Back/Forward) or go to hash/top, then move focus to the page heading.
  React.useLayoutEffect(() => {
    if (nav.kind === 'initial') return;
    if (nav.kind === 'pop') window.scrollTo(0, (history.state && history.state.y) || 0);
    else if (nav.hash) scrollToHash(nav.hash);
    else window.scrollTo(0, 0);
    const h = document.querySelector<HTMLElement>('main h1');
    if (h && nav.kind === 'push' && !nav.hash) h.focus({preventScroll: true});
  }, [nav]);
  return <Ctx.Provider value={{nav, go}}>{children}</Ctx.Provider>;
}
function scrollToHash(hash: string) {
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (el) {el.scrollIntoView({block: 'start'}); if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({preventScroll: true});}
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
