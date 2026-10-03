import * as React from 'react';
import {Link} from './router';
import {Arrow, CvAction, Eyebrow, Portrait, Section, TextLink} from './ui';
import {
  answers, career, contact, credentials, identity, operatingModel, practice, professionalSkillGroups,
  publicFeatured, publicRemaining, recommendationCompany, recommendationDate, recommendationsUrl, routes,
  skillsUrl, observedOn, trainingExposure, type Recommendation,
} from './content';

const pad = (i: number) => String(i + 1).padStart(2, '0');

function Facts() {
  return <dl className="facts" data-reveal>
    <div><dt>Current role</dt><dd>{identity.role}<span>{identity.employer} · since {identity.since}</span></dd></div>
    <div><dt>Experience</dt><dd>Engineering since May 2018<span>Quality roles since 2020</span></dd></div>
    <div><dt>Base</dt><dd>Riyadh<span>Open to Dammam and Jeddah</span></dd></div>
    <div><dt>Availability</dt><dd>{identity.notice}</dd></div>
  </dl>;
}

function CareerRows({detailed = false}: {detailed?: boolean}) {
  return <ol className="career">
    {career.map((c, i) => <li key={c.company} className="career-row" data-reveal>
      <p className="career-period">{c.period}</p>
      <div className="career-main">
        <h3>{c.company}</h3>
        <p className="career-role">{c.role}</p>
        {detailed && <p>{c.summary}</p>}
      </div>
      <div className="career-side">
        <p className="career-scope">{c.scope}</p>
        {detailed && <ul className="ticks">{c.capabilities.map(t => <li key={t}>{t}</li>)}</ul>}
        {!detailed && <p className="career-summary">{c.summary}</p>}
      </div>
    </li>)}
    <li className="career-row career-practice" data-reveal>
      <p className="career-period">Separate practice</p>
      <div className="career-main"><h3>{practice.company}</h3><p className="career-role">{practice.role}</p>{detailed && <p>{practice.summary}</p>}</div>
      <div className="career-side">
        <p className="career-scope">Presented as a separate body of work</p>
        {detailed ? <ul className="ticks">{practice.capabilities.map(t => <li key={t}>{t}</li>)}</ul> : <p className="career-summary">{practice.summary}</p>}
      </div>
    </li>
  </ol>;
}

function Quote({item}: {item: Recommendation}) {
  return <figure className="quote">
    <p className="quote-context">{recommendationCompany(item.company)}</p>
    <blockquote cite={recommendationsUrl} dir="auto"><p>{item.quote}</p></blockquote>
    <figcaption>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="quote-author">{item.name}<Arrow dir="up-right"/></a>
      <span>{item.relationship} · <time dateTime={item.date}>{recommendationDate(item.date)}</time></span>
    </figcaption>
  </figure>;
}

function Disclosure({summary, children, className = ''}: {summary: React.ReactNode; children: React.ReactNode; className?: string}) {
  return <details className={'disclosure ' + className}>
    <summary><span>{summary}</span><span className="disclosure-icon" aria-hidden="true"/></summary>
    <div className="disclosure-body"><div>{children}</div></div>
  </details>;
}

function Closing() {
  return <section className="closing" aria-labelledby="closing-title">
    <div className="wrap closing-inner">
      <div>
        <Eyebrow>Continue the review</Eyebrow>
        <h2 id="closing-title">Start with the role.<br/>Explore the relevant evidence.</h2>
        <p>A private room can focus on the work that matters to your hiring decision.</p>
      </div>
      <div className="closing-actions">
        <Link to="/contact" className="btn btn-light">Request a tailored review <Arrow/></Link>
        <p className="placeholder-note">Private review rooms are outside this public prototype.</p>
      </div>
    </div>
  </section>;
}

export function HomePage() {
  return <>
    <header className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="identity">{identity.name} <span aria-hidden="true">·</span> <bdi lang="ar" dir="rtl">{identity.nameAr}</bdi></p>
          <h1 tabIndex={-1}>Quality leadership, <em>made operational.</em></h1>
          <p className="hero-role">{identity.role} <span>— {identity.employer}, Riyadh</span></p>
          <p className="lead">I work across quality assurance (QA), quality control (QC) and quality management in manufacturing and construction. I turn product and project requirements into practical inspection systems, capable teams and decisions backed by evidence.</p>
          <div className="actions">
            <Link to="/projects" className="btn btn-primary">See the work <Arrow/></Link>
            <Link to="/about" className="btn btn-ghost">Experience &amp; credentials</Link>
            <CvAction/>
          </div>
        </div>
        <Portrait variant="hero" caption="Quality leadership & operational excellence"/>
      </div>
      <div className="wrap"><Facts/></div>
    </header>

    <Section className="section-routes" label="routes-title">
      <div className="section-head">
        <Eyebrow n="01">Find your starting point</Eyebrow>
        <h2 id="routes-title">Hiring for one of these?<br/>Go straight to the relevant work.</h2>
      </div>
      <ol className="index-list">
        {routes.map((r, i) => <li key={r.id} data-reveal>
          <Link to={'/projects#' + r.id} className="index-row">
            <span className="index-n">{pad(i)}</span>
            <span className="index-title"><b>{r.title}</b><span>{r.label}</span></span>
            <span className="index-sum">{r.summary}</span>
            <span className="index-go"><Arrow/></span>
          </Link>
        </li>)}
      </ol>
    </Section>

    <Section className="section-model" label="model-title">
      <div className="section-head">
        <Eyebrow n="02">The operating model</Eyebrow>
        <h2 id="model-title">Factory depth. Project context.<br/>Digital discipline.</h2>
      </div>
      <ol className="model">
        {operatingModel.map(([t, d], i) => <li key={t} data-reveal><span className="model-n">{pad(i)}</span><h3>{t}</h3><p>{d}</p></li>)}
      </ol>
    </Section>

    <Section className="section-tint" label="career-title">
      <div className="section-head section-head-split">
        <div><Eyebrow n="03">Career context</Eyebrow><h2 id="career-title">Know where the work happened.</h2></div>
        <p>Each company retains its own responsibilities and evidence. Results are never transferred between companies.</p>
      </div>
      <CareerRows/>
      <TextLink to="/about#career">Full experience and capabilities</TextLink>
    </Section>

    <Section label="voices-title">
      <div className="section-head section-head-split">
        <div><Eyebrow n="04">Colleagues’ perspectives</Eyebrow><h2 id="voices-title">The experience of working together.</h2></div>
        <p>Short, verbatim excerpts from 22 recommendations received on LinkedIn. Personal recommendations, not official employer endorsements.</p>
      </div>
      <div className="quotes">{publicFeatured.slice(0, 2).map(q => <Quote key={q.url} item={q}/>)}</div>
      <TextLink to="/about#recommendations">Read all 22 recommendations</TextLink>
    </Section>
    <Closing/>
  </>;
}

export function AboutPage() {
  return <>
    <header className="page-head page-head-portrait">
      <div className="wrap page-head-grid">
        <div>
          <Eyebrow>Experience &amp; perspective</Eyebrow>
          <h1 tabIndex={-1}>Systems thinking. <em>Shop-floor detail.</em></h1>
          <p className="lead">My engineering experience spans 8+ years since graduating in May 2018, including freelance mechanical engineering, with quality roles since 2020. I connect quality-system design with what teams inspect, measure, record and improve every day.</p>
          <nav className="jump" aria-label="On this page">
            <a href="#career">Career</a><a href="#capabilities">Capabilities</a><a href="#skills">Skills</a>
            <a href="#credentials">Training</a><a href="#recommendations">Recommendations</a><a href="#answers">Answers</a>
          </nav>
          <div className="actions"><CvAction/></div>
          <p className="small">{identity.base} · {identity.education}</p>
        </div>
        <Portrait variant="profile" caption="Mechanical engineer · Riyadh, Saudi Arabia"/>
      </div>
    </header>

    <Section id="career" className="section-tint" label="about-career">
      <div className="section-head"><Eyebrow n="01">Company by company</Eyebrow><h2 id="about-career">A career built around practical control.</h2></div>
      <CareerRows detailed/>
    </Section>

    <Section id="capabilities" label="about-cap">
      <div className="section-head"><Eyebrow n="02">How I contribute</Eyebrow><h2 id="about-cap">Leadership with technical depth.</h2></div>
      <div className="cap-grid">{routes.map((r, i) => <article key={r.id} className="cap" data-reveal>
        <span className="index-n">{pad(i)}</span><h3>{r.title}</h3><p>{r.summary}</p>
        <p className="tools">{r.tools.join(' · ')}</p>
      </article>)}</div>
    </Section>

    <Section id="skills" className="section-tint" label="about-skills">
      <div className="section-head section-head-split">
        <div><Eyebrow n="03">Professional capabilities</Eyebrow><h2 id="about-skills">Tools, methods. And how I use them.</h2></div>
        <p>Selected LinkedIn skills, grouped by theme. Self-listed skills and endorsements are not independent proof of proficiency or certification.</p>
      </div>
      <div className="skills">{professionalSkillGroups.map(g => <div key={g.title} className="skill-group" data-reveal>
        <h3>{g.title}</h3><p>{g.context}</p>
        <ul>{g.skills.map(s => <li key={s}>{s}</li>)}</ul>
      </div>)}</div>
      <Disclosure summary="Additional learning & engineering exposure">
        <p>These profile entries are associated with training courses. They describe learning exposure, separate from the applied work above.</p>
        <ul className="inline-list">{trainingExposure.map(s => <li key={s}>{s}</li>)}</ul>
      </Disclosure>
      <p className="small">Based on the <a href={skillsUrl} target="_blank" rel="noopener noreferrer">LinkedIn skills profile</a>, reviewed <time dateTime={observedOn}>{recommendationDate(observedOn)}</time>.</p>
    </Section>

    <Section id="credentials" label="about-cred">
      <div className="section-head"><Eyebrow n="04">Selected credentials</Eyebrow><h2 id="about-cred">Training, stated precisely.</h2></div>
      <table className="cred">
        <thead><tr><th scope="col">Training</th><th scope="col">Provider · date</th><th scope="col">What it is — and is not</th></tr></thead>
        <tbody>{credentials.map(c => <tr key={c.title}><th scope="row">{c.title}</th><td>{c.issuer}</td><td>{c.detail}</td></tr>)}</tbody>
      </table>
      <p className="small">Supporting certificates are provided in the authorized private review pack. PMP exam preparation is professional development, not a claim of PMP certification.</p>
    </Section>

    <Section id="recommendations" className="section-tint" label="about-rec">
      <div className="section-head section-head-split">
        <div><Eyebrow n="05">Colleagues’ perspectives</Eyebrow><h2 id="about-rec">The experience of working together.</h2></div>
        <p>22 recommendations received on LinkedIn, in each author’s own words. These are personal recommendations, not official employer endorsements.</p>
      </div>
      <div className="quotes">{publicFeatured.map(q => <Quote key={q.url} item={q}/>)}</div>
      <Disclosure summary={`Read ${publicRemaining.length} more recommendations`} className="disclosure-quotes">
        <div className="quotes">{publicRemaining.map(q => <Quote key={q.url} item={q}/>)}</div>
      </Disclosure>
      <p className="small">Short, verbatim excerpts from <a href={recommendationsUrl} target="_blank" rel="noopener noreferrer">received LinkedIn recommendations</a>, reviewed <time dateTime={observedOn}>{recommendationDate(observedOn)}</time>. Company context appears only where the source explicitly supports it.</p>
    </Section>

    <Section id="answers" label="about-faq">
      <div className="section-head"><Eyebrow n="06">A few useful answers</Eyebrow><h2 id="about-faq">Quality engineering, in context.</h2></div>
      <div className="faq">{answers.map(([q, a]) => <Disclosure key={q} summary={q}><p>{a}</p></Disclosure>)}</div>
    </Section>
    <Closing/>
  </>;
}

export function ProjectsPage() {
  return <>
    <header className="page-head">
      <div className="wrap">
        <Eyebrow>Work &amp; review areas</Eyebrow>
        <h1 tabIndex={-1}>Start with the capability. <em>Go deeper with evidence.</em></h1>
        <p className="lead">These are public summaries of my work. Detailed company cases, original records and supporting images remain in invitation-only review rooms.</p>
        <div className="actions"><CvAction/></div>
      </div>
    </header>
    <div className="jump-bar"><nav className="wrap jump" aria-label="Review areas">{routes.map((r, i) => <a key={r.id} href={'#' + r.id}><span>{pad(i)}</span>{r.title}</a>)}</nav></div>
    {routes.map((r, i) => <section key={r.id} id={r.id} className={'area' + (i % 2 ? ' section-tint' : '')} aria-labelledby={r.id + '-t'}>
      <div className="wrap area-grid">
        <div className="area-head" data-reveal>
          <span className="area-n">{pad(i)}</span>
          <p className="area-label">{r.label}</p>
          <h2 id={r.id + '-t'}>{r.title}</h2>
        </div>
        <div className="area-body" data-reveal>
          <p className="lead-sm">{r.summary}</p>
          <p>{r.example}</p>
          <p className="tools">{r.tools.join(' · ')}</p>
        </div>
        <aside className="area-evidence" data-reveal>
          <p className="eyebrow">Inside a relevant private review</p>
          <p>{r.evidence}</p>
          <TextLink to="/contact">Request relevant examples</TextLink>
        </aside>
      </div>
    </section>)}
    <Section label="ctx-title">
      <div className="section-head section-head-split">
        <div><Eyebrow>Sources stay distinct</Eyebrow><h2 id="ctx-title">Distinct contexts. Clearly separated.</h2></div>
        <p>Manufacturing, construction and digital work are presented with their own context, without transferring results between companies.</p>
      </div>
      <CareerRows/>
    </Section>
    <Closing/>
  </>;
}

export function ContactPage() {
  return <>
    <header className="page-head">
      <div className="wrap contact-grid">
        <div>
          <Eyebrow>Start with the real problem</Eyebrow>
          <h1 tabIndex={-1}>Let’s talk about what quality needs to change.</h1>
          <p className="lead">Senior roles, consulting engagements, system design, and meaningful QA/QC transformation are all welcome.</p>
          <div className="actions"><CvAction/></div>
        </div>
        <div className="contact-card">
          <p className="eyebrow">Direct details</p>
          <ul className="contact-list">
            <li><span>Email</span><a href={'mailto:' + contact.email}>{contact.email.split('@')[0]}<wbr/>@{contact.email.split('@')[1]}</a></li>
            <li><span>Phone</span><a href={'tel:' + contact.phone}>{contact.phoneDisplay}</a></li>
            <li><span>LinkedIn</span><a href={identity.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn profile <Arrow dir="up-right"/></a></li>
            <li><span>Based in</span><p>{identity.base}</p></li>
          </ul>
          <div className="placeholder-box">
            <p><b>Secure enquiry form — prototype placeholder.</b> The production form and its security check are not part of this prototype, so no message can be sent from here.</p>
          </div>
        </div>
      </div>
    </header>
  </>;
}
