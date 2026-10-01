import {React,Intro,Career,NextStep,PublicCvLink} from './shared';
import {S as Seo} from './Seo';
import {credentials,routes} from './public-content';
import {ProfessionalRecommendations,ProfessionalSkills} from './LinkedInProfile';
import {Portrait} from './Portrait';

export default function AboutPage(){
  return <div className="op-public">
    <Seo title="Experience & Credentials" description="Ahmed Khalawy’s engineering experience since May 2018, quality roles since 2020, professional capabilities and colleagues’ LinkedIn recommendations."/>
    <div className="op-about-header">
    <Intro eyebrow="Experience & perspective" title={<>Systems thinking.<br/><em>Shop-floor detail.</em></>}>
      <p className="op-identity">Ahmed Khalawy <span aria-hidden="true">·</span> <bdi lang="ar" dir="rtl">احمد خلوي</bdi> — Senior QA/QC Engineer, based in Riyadh.</p>
      <p>My engineering experience spans 8+ years since graduating in May 2018, including freelance mechanical engineering, with quality roles since 2020. I connect quality-system design with what teams inspect, measure, record and improve every day, bringing manufacturing depth, construction-governance experience and practical digital reporting.</p>
      <div className="op-actions"><PublicCvLink/><a className="op-link" href="#career">Review career history</a><a className="op-link" href="#recommendations">Read recommendations</a></div>
      <p className="op-small">Riyadh, Saudi Arabia · B.Sc. Mechanical Power Engineering, Menoufia University, 2018</p>
    </Intro>
    <Portrait variant="profile"/>
    </div>
    <section className="op-section op-soft" id="career"><p className="op-eyebrow">Company by company</p><h2 className="op-section-title">A career built around practical control.</h2><p className="op-career-context">I currently work at Yuksel Saudia as a Senior QA/QC Engineer in the head office, since March 2025. My previous Senior QA/QC Engineer role at Eibla for Energy ran from August 2023 to March 2025.</p><Career/></section>
    <section className="op-section"><div className="op-section-head"><div><p className="op-eyebrow">How I contribute</p><h2>Leadership with technical depth.</h2></div><p>I connect inspection and engineering detail with team development, controlled release and management decisions.</p></div><div className="op-route-grid">{routes.map(r=><article className="op-route-card" key={r.id}><h3>{r.title}</h3><p>{r.summary}</p><ul className="op-tags">{r.tools.map(t=><li key={t}>{t}</li>)}</ul></article>)}</div></section>
    <ProfessionalSkills/>
    <ProfessionalRecommendations/>
    <section className="op-section op-soft" id="credentials"><p className="op-eyebrow">Selected credentials</p><h2 className="op-section-title">Training, stated precisely.</h2><div className="op-credential-grid">{credentials.map(c=><article key={c.title}><p className="op-eyebrow">{c.issuer}</p><h3>{c.title}</h3><p>{c.detail}</p></article>)}</div><p className="op-small">Supporting certificates are provided in the authorized private review pack. PMP exam preparation is professional development, not a claim of PMP certification.</p></section>
    <section className="op-section" id="profile-questions"><p className="op-eyebrow">A few useful answers</p><h2 className="op-section-title">Quality engineering, in context.</h2><div className="op-profile-answers">
      <article><h3>What quality engineering work do you do?</h3><p>I work across quality assurance (QA), quality control (QC) and quality management in manufacturing and construction. My work includes inspection planning, calibration and measurement-system analysis, SPC, 8D/CAPA, controlled documentation, QMS/ITP coordination and Power BI reporting. El Araby provided factory depth and progression from Quality Control to Assistant Manager; Eibla added electrical and mechanical manufacturing leadership; Yuksel Saudia provides the current construction-governance context.</p></article>
      <article><h3>Which roles and locations are you considering?</h3><p>I am open to senior quality engineering and quality management opportunities, including Quality Manager or QA/QC Manager roles that combine systems, inspection and team leadership. My current title remains Senior QA/QC Engineer. I am based in Riyadh and open to relocation to Dammam or Jeddah, with a 60-day notice period.</p></article>
      <article><h3>What is your ISO 9001 auditor qualification?</h3><p>I passed the exam for SGS ISO 9001:2015 Auditor / Lead Auditor training in January 2026, through a CQI/IRCA-certified course. This is auditor training completion, distinct from professional auditor registration. My practical quality-system work includes controlled documentation, audit readiness and corrective-action methods.</p></article>
    </div></section>
    <NextStep/>
  </div>;
}
