import * as React from 'react';
import {Link} from './public-adapter';
import { career, practice } from './public-content';
import { publicCv } from './public-cv';
export { React, Link };
export function Intro({eyebrow,title,children}:any){return <header className="op-intro"><p className="op-eyebrow">{eyebrow}</p><h1>{title}</h1><div className="op-lead">{children}</div></header>}
export function Career(){return <div className="op-career">{career.map((c,i)=><article key={c.company}><div className="op-career-side"><span className="op-index">0{i+1}</span><p>{c.period}</p><h3>{c.company}</h3><span>{c.scope}</span></div><div><h4>{c.role}</h4><p>{c.summary}</p><ul>{c.capabilities.map(t=><li key={t}>{t}</li>)}</ul></div></article>)}<article className="op-practice"><div className="op-career-side"><span className="op-eyebrow">Separate practice</span><h3>{practice.company}</h3></div><div><h4>{practice.role}</h4><p>{practice.summary}</p><ul>{practice.capabilities.map(t=><li key={t}>{t}</li>)}</ul></div></article></div>}
export function NextStep(){return <section className="op-next"><div><p className="op-eyebrow">Continue the review</p><h2>Start with the role.<br/>Explore the relevant evidence.</h2><p>A private room can focus on the work that matters to your hiring decision.</p></div><div className="op-actions"><Link className="op-button op-button-light" to="/private">Open your invitation <span aria-hidden="true">↗</span></Link><Link className="op-link" to="/contact">Request a tailored review</Link></div></section>}

export function PublicCvLink(){return <a className="op-cv-download op-link" href={'/documents/ahmed-khalawy-cv.pdf?v='+publicCv.revision} download="Ahmed-Khalawy-Public-CV.pdf">Download CV <span>PDF · {publicCv.pages} pages · {Math.ceil(publicCv.bytes/1024)} KB</span><span aria-hidden="true">↓</span></a>}
