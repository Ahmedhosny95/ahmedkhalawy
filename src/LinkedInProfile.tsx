import {React} from './shared';
import {
  observedOn, professionalSkillGroups, publicFeatured, publicRemaining,
  recommendationCompany, recommendationDate, recommendationsUrl, skillsUrl,
  trainingExposure, type Recommendation,
} from './public-profile-content';

function RecommendationCard({item}: {item: Recommendation}) {
  return <figure className="op-recommendation">
    <p className="op-recommendation-context">{recommendationCompany(item.company)}</p>
    <blockquote cite={recommendationsUrl} dir="auto">{item.quote}</blockquote>
    <figcaption>
      <a className="op-recommendation-author" href={item.url} target="_blank" rel="noopener noreferrer">{item.name}<span aria-hidden="true"> ↗</span></a>
      <span>{item.relationship}</span>
      <time dateTime={item.date}>{recommendationDate(item.date)}</time>
      <a className="op-recommendation-source" href={recommendationsUrl} target="_blank" rel="noopener noreferrer">View LinkedIn source<span aria-hidden="true"> ↗</span></a>
    </figcaption>
  </figure>;
}

export function ProfessionalSkills() {
  return <section className="op-section op-soft" id="skills" aria-labelledby="op-skills-title">
    <div className="op-section-head"><div><p className="op-eyebrow">Professional capabilities</p><h2 id="op-skills-title">Tools, methods.<br/>And how I use them.</h2></div><p>Selected LinkedIn skills, grouped around the quality, engineering and leadership themes documented in this portfolio.</p></div>
    <div className="op-skills-grid">{professionalSkillGroups.map(group => <article className="op-skill-group" key={group.title}><h3>{group.title}</h3><p>{group.context}</p><ul className="op-tags">{group.skills.map(skill => <li key={skill}>{skill}</li>)}</ul></article>)}</div>
    <details className="op-profile-details op-training-exposure"><summary>Additional learning & engineering exposure<span aria-hidden="true">+</span></summary><div><p>These profile entries are associated with training courses. They describe learning exposure, separate from the applied work above.</p><ul className="op-tags">{trainingExposure.map(skill => <li key={skill}>{skill}</li>)}</ul></div></details>
    <p className="op-small">Based on the <a href={skillsUrl} target="_blank" rel="noopener noreferrer">LinkedIn skills profile</a>, reviewed <time dateTime={observedOn}>{recommendationDate(observedOn)}</time>. Self-listed skills and endorsements are not independent proof of proficiency or certification. Training credentials are stated separately below.</p>
  </section>;
}

export function ProfessionalRecommendations() {
  return <section className="op-section" id="recommendations" aria-labelledby="op-recommendations-title">
    <div className="op-section-head"><div><p className="op-eyebrow">Colleagues’ perspectives</p><h2 id="op-recommendations-title">The experience<br/>of working together.</h2></div><p>22 recommendations received on LinkedIn. Selected excerpts reflect leadership, analytical thinking and team development, in each author’s own words.</p></div>
    <div className="op-recommendation-grid">{publicFeatured.map(item => <RecommendationCard item={item} key={item.url}/>)}</div>
    <details className="op-profile-details"><summary>Read {publicRemaining.length} more recommendations<span aria-hidden="true">+</span></summary><div className="op-recommendation-grid">{publicRemaining.map(item => <RecommendationCard item={item} key={item.url}/>)}</div></details>
    <p className="op-small">Short, verbatim excerpts from <a href={recommendationsUrl} target="_blank" rel="noopener noreferrer">received LinkedIn recommendations</a>, reviewed <time dateTime={observedOn}>{recommendationDate(observedOn)}</time>. These are personal recommendations, not official employer endorsements. Company context appears only where the source explicitly supports it.</p>
  </section>;
}
