import * as React from 'react';
import {Link, Router, useNav, normalize} from './router';
import {AboutPage, ContactPage, HomePage, ProjectsPage} from './pages';
import {identity, seo} from './content';

const PAGES: Record<string, () => React.ReactElement> = {'/': HomePage, '/about': AboutPage, '/projects': ProjectsPage, '/contact': ContactPage};
const NAV = [['/projects', 'Work'], ['/about', 'Profile'], ['/contact', 'Contact']] as const;
export const titleFor = (path: string) => (seo as Record<string, {title: string}>)[path]?.title ?? identity.name;

export function App({initialPath}: {initialPath: string}) {
  return <Router initialPath={initialPath}><Shell/></Router>;
}

function Shell() {
  const {nav} = useNav();
  const Page = PAGES[nav.path] ?? HomePage;
  React.useEffect(() => {document.title = titleFor(nav.path);}, [nav.path]);
  useReveals(nav.key);
  return <>
    <a className="skip" href="#main">Skip to content</a>
    <SiteHeader/>
    <main id="main" tabIndex={-1} key={nav.key} className={nav.kind === 'initial' ? 'route' : 'route route-enter'}>
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
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const btn = React.useRef<HTMLButtonElement>(null);
  const panel = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => setOpen(false), [nav.key]);
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); addEventListener('scroll', on, {passive: true});
    return () => removeEventListener('scroll', on);
  }, []);
  React.useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {if (e.key === 'Escape') {setOpen(false); btn.current?.focus();}};
    const onDown = (e: PointerEvent) => {if (!panel.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false);};
    addEventListener('keydown', onKey); addEventListener('pointerdown', onDown);
    return () => {removeEventListener('keydown', onKey); removeEventListener('pointerdown', onDown);};
  }, [open]);
  const current = (p: string) => (normalize(nav.path) === p ? 'page' : undefined);
  return <header className="site-header" data-scrolled={scrolled || undefined} data-menu={open || undefined}>
    <div className="wrap header-inner">
      <Link to="/" className="brand" aria-label="Ahmed Khalawy — home">
        <img src="/mark.svg" alt="" width={36} height={36}/><span><b>Ahmed Khalawy</b><small>Senior QA/QC Engineer</small></span>
      </Link>
      <nav aria-label="Main navigation" className="nav-desktop">
        {NAV.map(([to, label]) => <Link key={to} to={to} aria-current={current(to)}>{label}</Link>)}
      </nav>
      <button ref={btn} type="button" className="menu-btn" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(o => !o)}>
        <span className="menu-icon" aria-hidden="true"><i/><i/></span><span>{open ? 'Close' : 'Menu'}</span>
      </button>
    </div>
    <div id="mobile-menu" ref={panel} className="menu-panel" data-open={open || undefined} inert={!open || undefined}>
      <nav aria-label="Mobile navigation" className="wrap">
        {NAV.map(([to, label], i) => <Link key={to} to={to} aria-current={current(to)} style={{'--i': i} as React.CSSProperties}>{label}<span aria-hidden="true">→</span></Link>)}
      </nav>
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
