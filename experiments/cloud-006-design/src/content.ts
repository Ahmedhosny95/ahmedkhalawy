// Single source of facts: everything factual is imported from the approved PUBLIC seed in /src.
// Only interface copy (labels, prototype notices) is defined here. No private data, no new metrics.
export {career, practice, routes, credentials} from '../../../src/public-content';
export {
  professionalSkillGroups, trainingExposure, publicFeatured, publicRemaining,
  recommendationCompany, recommendationDate, recommendationsUrl, skillsUrl, observedOn,
  type Recommendation,
} from '../../../src/public-profile-content';
// @ts-ignore plain JS seed module
export {routes as seo} from '../../../src/search-data.js';

export const identity = {
  name: 'Ahmed Khalawy',
  nameAr: 'احمد خلوي',
  role: 'Senior QA/QC Engineer',
  employer: 'Yuksel Saudia',
  since: 'March 2025',
  base: 'Riyadh, Saudi Arabia',
  openTo: 'Open to Riyadh, Dammam and Jeddah',
  notice: '60-day notice',
  experience: '8+ years of engineering experience since May 2018, quality roles since 2020',
  education: 'B.Sc. Mechanical Power Engineering, Menoufia University, 2018',
  linkedin: 'https://www.linkedin.com/in/ahmed-khalawy-513a271a1/',
};
// Public contact contract, copied from fixtures/public-html/contact.html (approved public fixture).
export const contact = {email: 'ahmed.hosny.helmy@gmail.com', phone: '+966597766864', phoneDisplay: '+966 59 776 6864'};
// Seed: Home "operating model".
export const operatingModel: [string, string][] = [
  ['Requirements', 'Define what acceptable means.'],
  ['Control', 'Build inspection into the process.'],
  ['Capability', 'Equip people to act with confidence.'],
  ['Evidence', 'Connect findings to decisions.'],
];
// Seed: About "A few useful answers" (verbatim).
export const answers: [string, string][] = [
  ['What quality engineering work do you do?', 'I work across quality assurance (QA), quality control (QC) and quality management in manufacturing and construction. My work includes inspection planning, calibration and measurement-system analysis, SPC, 8D/CAPA, controlled documentation, QMS/ITP coordination and Power BI reporting. El Araby provided factory depth and progression from Quality Control to Assistant Manager; Eibla added electrical and mechanical manufacturing leadership; Yuksel Saudia provides the current construction-governance context.'],
  ['Which roles and locations are you considering?', 'I am open to senior quality engineering and quality management opportunities, including Quality Manager or QA/QC Manager roles that combine systems, inspection and team leadership. My current title remains Senior QA/QC Engineer. I am based in Riyadh and open to relocation to Dammam or Jeddah, with a 60-day notice period.'],
  ['What is your ISO 9001 auditor qualification?', 'I passed the exam for SGS ISO 9001:2015 Auditor / Lead Auditor training in January 2026, through a CQI/IRCA-certified course. This is auditor training completion, distinct from professional auditor registration. My practical quality-system work includes controlled documentation, audit readiness and corrective-action methods.'],
];
