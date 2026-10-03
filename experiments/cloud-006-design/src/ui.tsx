import * as React from 'react';
import {Link} from './router';
import {identity} from './content';

export const Arrow = ({dir = 'right'}: {dir?: 'right' | 'down' | 'up-right'}) =>
  <span className={'arrow arrow-' + dir} aria-hidden="true">{dir === 'down' ? '↓' : dir === 'up-right' ? '↗' : '→'}</span>;

export function Eyebrow({n, children}: {n?: string; children: React.ReactNode}) {
  return <p className="eyebrow">{n && <span className="eyebrow-n">{n}</span>}{children}</p>;
}

/** Editorial portrait with an engineering "title block" caption. No entrance animation (avoids a double entrance at hydration). */
export function Portrait({variant, caption}: {variant: 'hero' | 'profile'; caption: string}) {
  return <figure className={'portrait portrait-' + variant}>
    <div className="portrait-frame">
      <img src={`/assets/ahmed-portraits-20261001/ahmed-${variant}.webp`} alt="Portrait of Ahmed Khalawy" width={960} height={1200}
        loading="eager" decoding="async" fetchPriority={variant === 'hero' ? 'high' : 'auto'}/>
    </div>
    <figcaption className="titleblock">
      <span><b>{identity.name}</b><bdi lang="ar" dir="rtl">{identity.nameAr}</bdi></span>
      <span>{caption}</span>
    </figcaption>
  </figure>;
}

/** The public CV file is not part of this prototype: show an honest unavailable state, never a fake download. */
export function CvAction({compact = false}: {compact?: boolean}) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  return <div className={'cv-action' + (compact ? ' cv-compact' : '')}>
    <button type="button" className="btn btn-ghost cv-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}>
      <span className="cv-btn-label">CV <span className="cv-meta">PDF</span></span>
      <span className="cv-status">Not in prototype</span>
    </button>
    <div id={id} className="cv-note" role="status" data-open={open || undefined}>
      {open && <p>The public CV file is not bundled with this design prototype, so nothing is downloaded. Review the <a href="/cv-specimen/">four-page CV layout specimen</a> instead.</p>}
    </div>
  </div>;
}

export function Section({id, className = '', children, label}: {id?: string; className?: string; children: React.ReactNode; label?: string}) {
  return <section id={id} className={'section ' + className} aria-labelledby={label}><div className="wrap">{children}</div></section>;
}

export function TextLink({to, children, className = ''}: {to: string; children: React.ReactNode; className?: string}) {
  return <Link to={to} className={'tlink ' + className}>{children}<Arrow/></Link>;
}
