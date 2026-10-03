import * as React from 'react';
import {Link, Router, useNav, normalize} from './router';
import {AboutPage, ContactPage, HomePage, ProjectsPage} from './pages';
import {identity} from './content';
import {applyMeta, metaFor} from './meta';

const PAGES: Record<string, () => React.ReactElement> = {'/': HomePage, '/about': AboutPage, '/projects': ProjectsPage, '/contact': ContactPage};
const NAV = [['/projects', 'Work'], ['/about', 'Profile'], ['/contact', 'Contact']] as const;
export const titleFor = (path: string) => metaFor(path).title;

export function App({initialPath}: {initialPath: string}) {
  return <Router initialPath={initialPath}><Shell/></Router>;
}

function Shell() {
  const {nav} = useNav();
  const Page = PAGES[nav.path] ?? HomePage;
  React.useEffect(() => {if (nav.kind !== 'initial') applyMeta(nav.path);}, [nav.path, nav.kind]);
  useReveals(nav.routeKey);
  return <>
    <a className="skip" href="#main">Skip to content</a>
    <SiteHeader/>
    <main id="main" tabIndex={-1} key={nav.routeKey} className={nav.kind === 'initial' ? 'route' : 'route route-enter'}>
      <Page/>
    </main>
    <footer className="footer">
      <div className="wrap footer-grid">
        <p className="footer-mark">Quality has a point of view.</p>
        <p>Clear systems. Visible evidence. Better decisions.</p>
        <a href={identity.linkedin} target="_blank" rel="noopener noreferrer">Connect on LinkedIn ↗</a>
        <p className="placeholder-note">Design prototype (cloud-006) built from approved public content. Not the production site.</p>
      </div>
    </footer>
  </>;
}

function SiteHeader() {
  const {nav} = useNav();
  const [scrolled, setScrolled] = React.useState(false);
  const menu = React.useRef<HTMLDetailsElement>(null);
  // While the exit fade plays the links stay rendered, so they are made inert immediately on close.
  const close = (refocus = false) => {const d = menu.current; if (d?.open) {d.querySelector('.menu-panel')?.setAttribute('inert', ''); d.open = false; if (refocus) d.querySelector('summary')?.focus();}};
  React.useEffect(() => close(), [nav.routeKey]);
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); addEventListener('scroll', on, {passive: true});
    const onKey = (e: KeyboardEvent) => {if (e.key === 'Escape' && menu.current?.open) {e.preventDefault(); close(true);}};
    const onDown = (e: PointerEvent) => {if (menu.current?.open && !menu.current.contains(e.target as Node)) close();};
    addEventListener('keydown', onKey); addEventListener('pointerdown', onDown);
    return () => {removeEventListener('scroll', on); removeEventListener('keydown', onKey); removeEventListener('pointerdown', onDown);};
  }, []);
  const current = (p: string) => (normalize(nav.path) === p ? 'page' : undefined);
  // Mobile menu is a native <details>: it opens and its links navigate with no app JavaScript at all.
  // After hydration React adds focus management, Escape, outside-click and close-on-navigate.
  React.useEffect(() => {
    const d = menu.current!;
    const onToggle = () => {
      const panel = d.querySelector('.menu-panel')!;
      if (!d.open) {panel.setAttribute('inert', ''); return;}
      panel.removeAttribute('inert');
      requestAnimationFrame(() => d.querySelector<HTMLElement>('.menu-panel a')?.focus({preventScroll: true}));
    };
    d.addEventListener('toggle', onToggle);
    return () => d.removeEventListener('toggle', onToggle);
  }, []);
  return <header className="site-header" data-scrolled={scrolled || undefined}>
    <div className="wrap header-inner">
      <Link to="/" className="brand" aria-label="Ahmed Khalawy — home">
        <img src="/mark.svg" alt="" width={36} height={36}/><span><b>Ahmed Khalawy</b><small>Senior QA/QC Engineer</small></span>
      </Link>
      <nav aria-label="Main navigation" className="nav-desktop">
        {NAV.map(([to, label]) => <Link key={to} to={to} aria-current={current(to)}>{label}</Link>)}
      </nav>
      <details ref={menu} className="menu">
        <summary className="menu-btn">
          <span className="menu-icon" aria-hidden="true"><i/><i/></span><span className="menu-label"><span className="when-closed">Menu</span><span className="when-open">Close</span></span>
        </summary>
        <div id="mobile-menu" className="menu-panel">
          <nav aria-label="Mobile navigation" className="wrap">
            {NAV.map(([to, label], i) => <Link key={to} to={to} aria-current={current(to)} style={{'--i': i} as React.CSSProperties}>{label}<span aria-hidden="true">→</span></Link>)}
          </nav>
        </div>
      </details>
    </div>
  </header>;
}

/**
 * Restrained reveals: only elements BELOW the fold at mount time are held and revealed on intersection.
 * Content already in view (including everything in the server HTML first paint) is never hidden or re-animated,
 * so hydration produces no second entrance. Reduced motion: nothing is held.
 */
function useReveals(key: number) {
  React.useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) {(e.target as HTMLElement).dataset.reveal = 'in'; io.unobserve(e.target);}
    }, {rootMargin: '0px 0px -8% 0px'});
    for (const el of document.querySelectorAll<HTMLElement>('[data-reveal="true"]')) {
      if (el.getBoundingClientRect().top > innerHeight) {el.dataset.reveal = 'pending'; io.observe(el);}
    }
    return () => io.disconnect();
  }, [key]);
}
