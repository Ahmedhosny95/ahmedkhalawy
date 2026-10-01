import * as React from 'react';
type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {to:string};
// Native full-document links only. The cloud harness must implement/test client routing separately.
export function Link({to,children,...props}:LinkProps){return <a {...props} href={to}>{children}</a>;}
export function PublicLayout({children}:{children:React.ReactNode}){return <>
  <a className="adapter-skip" href="#main-content">Skip to content</a>
  <header className="adapter-header"><a href="/" className="adapter-brand"><img src="/mark.svg" alt="" width="40" height="40"/><span>Ahmed Khalawy</span></a>
    <nav aria-label="Main navigation"><a href="/projects">Work</a><a href="/about">Profile</a><a href="/contact">Contact</a></nav>
    <details className="adapter-mobile"><summary>Menu</summary><nav aria-label="Mobile navigation"><a href="/projects">Work</a><a href="/about">Profile</a><a href="/contact">Contact</a></nav></details>
  </header><main id="main-content" tabIndex={-1}>{children}</main>
  <footer className="adapter-footer"><p>Quality has a point of view.</p><p>Clear systems. Visible evidence. Better decisions.</p><a href="https://www.linkedin.com/in/ahmed-khalawy-513a271a1/">Connect on LinkedIn</a></footer>
</>;}
