import * as React from 'react';
import {SceneBack, SceneFront} from './Scene';
import {identity} from './content';

/** Reusable hero. Everything readable is in the server HTML; JS only adds the motion toggle and off-screen pausing. */
export function Hero() {
  const ref = React.useRef<HTMLElement>(null);
  const [motion, setMotion] = React.useState<'on' | 'off' | null>(null); // null = not hydrated yet (toggle hidden)
  React.useEffect(() => {
    setMotion(matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'on');
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-offscreen', !e.isIntersecting));
    io.observe(el); return () => io.disconnect();
  }, []);
  React.useEffect(() => {if (motion) document.documentElement.dataset.motion = motion;}, [motion]);
  return <header ref={ref} className="hero" aria-labelledby="hero-title">
    <div className="hero-stage" aria-hidden="true">
      <SceneBack/>
      <div className="hero-portrait">
        <img src="/assets/ahmed-portraits-20261001/ahmed-hero.webp" alt="" width={960} height={1200} fetchPriority="high" decoding="async"/>
      </div>
      <SceneFront/>
    </div>
    <nav className="hero-nav" aria-label="Main navigation">
      <a className="hero-brand" href="#top"><img src="/mark.svg" alt="" width={32} height={32}/><span>{identity.name}</span></a>
      <span className="hero-nav-links"><a href="#work">Work</a><a href="#career">Career</a><a href="#contact">Contact</a></span>
    </nav>
    <div className="hero-copy" id="top">
      <p className="hero-eyebrow">{identity.name} <span aria-hidden="true">·</span> <bdi lang="ar" dir="rtl">{identity.nameAr}</bdi></p>
      <h1 id="hero-title">Quality leadership,<br/><span>made operational.</span></h1>
      <p className="hero-role"><strong>{identity.role}</strong> — {identity.employer}, {identity.base}</p>
      <p className="hero-lead">{identity.lead} {identity.experience}</p>
      <div className="hero-actions">
        <a className="hero-btn hero-btn-primary" href="#work">See the work <span aria-hidden="true">↓</span></a>
        <a className="hero-btn hero-btn-quiet" href="#cv-note" aria-describedby="cv-demo-label">CV <span id="cv-demo-label" className="hero-tag"><span className="tag-long">demo · file not included</span><span className="tag-short" aria-hidden="true">demo</span></span></a>
      </div>
      <p className="hero-availability">{identity.availability}</p>
    </div>
    <a className="hero-scroll" href="#career"><span className="hero-scroll-line" aria-hidden="true"/>Scroll to career</a>
    <button type="button" className="hero-motion" aria-pressed={motion === 'on'} hidden={motion === null}
      onClick={() => setMotion(m => (m === 'on' ? 'off' : 'on'))}>Motion: {motion === 'on' ? 'on' : 'off'}</button>
  </header>;
}
