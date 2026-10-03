import * as React from 'react';
import {Hero} from './Hero';
import {career, practice, routes} from './content';
import {identity} from './content';
const pad = (i: number) => String(i + 1).padStart(2, '0');
export function Page() {
  return <>
    <a className="skip" href="#career">Skip to content</a>
    <Hero/>
    <main>
      <div className="seam" aria-hidden="true"><svg viewBox="0 0 1600 120" preserveAspectRatio="none"><path d="M0 0 H1600 V40 C 1200 120 400 0 0 90 Z"/><path className="seam-line" d="M0 90 C 400 0 1200 120 1600 40"/></svg></div>
      <section id="career" className="sec" aria-labelledby="career-title">
        <div className="wrap">
          <p className="eyebrow"><span>01</span>Career context</p>
          <h2 id="career-title">Know where the work happened.</h2>
          <ol className="career">{career.map(c => <li key={c.company}>
            <p className="career-period">{c.period}</p>
            <div><h3>{c.company}</h3><p className="career-role">{c.role}</p></div>
            <p className="career-sum">{c.summary}</p>
          </li>)}
            <li className="career-practice"><p className="career-period">Separate practice</p><div><h3>{practice.company}</h3><p className="career-role">{practice.role}</p></div><p className="career-sum">{practice.summary}</p></li>
          </ol>
        </div>
      </section>
      <section id="work" className="sec sec-tint" aria-labelledby="work-title">
        <div className="wrap">
          <p className="eyebrow"><span>02</span>Find your starting point</p>
          <h2 id="work-title">Go straight to the relevant work.</h2>
          <ol className="index">{routes.map((r, i) => <li key={r.id}><span className="index-n">{pad(i)}</span><div><h3>{r.title}</h3><p>{r.summary}</p></div></li>)}</ol>
        </div>
      </section>
      <section id="contact" className="sec" aria-labelledby="contact-title">
        <div className="wrap">
          <p className="eyebrow"><span>03</span>Contact &amp; CV</p>
          <h2 id="contact-title">Start with the role.</h2>
          <p><a href={identity.linkedin} rel="noopener noreferrer" target="_blank">LinkedIn profile ↗</a></p>
          <p id="cv-note" className="note" tabIndex={-1}><strong>CV — demo action.</strong> This design prototype does not include the CV file and links to no private location. The approved public CV link is added during local integration.</p>
        </div>
      </section>
    </main>
    <footer className="foot"><div className="wrap"><p>Design prototype (cloud-008). Public seed content only; the scene is an original decorative illustration, not company evidence. Not the production site.</p></div></footer>
  </>;
}
