// SYNTHETIC demo portfolio. "Sample Candidate" is a fictional persona; every case and evidence line is invented
// for testing the assistant. None of this describes Ahmed Khalawy or any real person or company.
import type {CaseRef, EvidenceItem} from '../src/core/types';

export const PERSONA = {name: 'Sample Candidate (synthetic)', nameAr: 'مرشح تجريبي (بيانات اصطناعية)'};
/** Natural chronological order of the portfolio — the assistant never reorders this list. */
export const CASES: CaseRef[] = [
  {id: 'c1', title: 'Incoming inspection plan for a sheet-metal line', period: 'Synthetic · 2019'},
  {id: 'c2', title: 'Calibration register and gauge R&R study', period: 'Synthetic · 2020'},
  {id: 'c3', title: '8D investigation of a coating defect', period: 'Synthetic · 2021'},
  {id: 'c4', title: 'Supplier approval visits and corrective actions', period: 'Synthetic · 2021'},
  {id: 'c5', title: 'LV panel final-testing checklist', period: 'Synthetic · 2022'},
  {id: 'c6', title: 'QMS documentation for ISO 9001 readiness', period: 'Synthetic · 2023'},
  {id: 'c7', title: 'Quality KPI dashboard in Power BI', period: 'Synthetic · 2024'},
  {id: 'c8', title: 'Inspector skills matrix and coaching', period: 'Synthetic · 2025'},
];
export const CASE_BODY: Record<string, string> = {
  c1: 'Synthetic case. Defined incoming inspection points, sampling and acceptance criteria for purchased sheet-metal parts, and an inspection and test plan (ITP) linking each check to a record.',
  c2: 'Synthetic case. Built a calibration register for gauges and ran a gauge R&R study with SPC charts to decide which measurements were fit for release decisions.',
  c3: 'Synthetic case. Led an 8D for a recurring coating defect: containment, root-cause analysis with 5 whys, corrective action and verification of effectiveness.',
  c4: 'Synthetic case. Ran supplier approval visits and audits, issued corrective action requests and tracked closure with the supplier.',
  c5: 'Synthetic case. Drafted a final testing checklist for LV electrical panel assembly covering continuity and insulation testing before release.',
  c6: 'Synthetic case. Wrote QMS procedures and document control for ISO 9001 readiness and prepared internal audit evidence.',
  c7: 'Synthetic case. Built a Power BI dashboard of quality KPIs (defects, NCR ageing) for the monthly management review.',
  c8: 'Synthetic case. Created a skills matrix for inspectors, coached the team and introduced 5S on the inspection bench.',
};
export const EVIDENCE: EvidenceItem[] = [
  {id: 'e1', caseId: 'c1', kind: 'practice', concepts: ['inspection', 'itp', 'manufacturing'], text: 'Defined incoming inspection points and an ITP linking each check to a record.'},
  {id: 'e2', caseId: 'c1', kind: 'practice', concepts: ['welding', 'manufacturing'], text: 'Set acceptance criteria for fabricated sheet-metal parts.'},
  {id: 'e3', caseId: 'c2', kind: 'practice', concepts: ['calibration', 'msa'], text: 'Built a calibration register and ran a gauge R&R study.'},
  {id: 'e4', caseId: 'c2', kind: 'practice', concepts: ['spc', 'data'], text: 'Used SPC charts to decide which measurements were fit for release.'},
  {id: 'e5', caseId: 'c3', kind: 'practice', concepts: ['8d', 'rca', 'capa', 'coating'], text: 'Led an 8D with 5-whys root-cause analysis and verified corrective action.'},
  {id: 'e6', caseId: 'c3', kind: 'challenge', concepts: ['complaints', 'coating'], text: 'Problem context: recurring coating complaints from a customer.'},
  {id: 'e7', caseId: 'c4', kind: 'practice', concepts: ['supplier', 'audit', 'capa'], text: 'Ran supplier approval audits and tracked corrective action requests to closure.'},
  {id: 'e8', caseId: 'c5', kind: 'practice', concepts: ['electrical', 'testing', 'inspection'], text: 'Drafted a final testing checklist for LV panel assembly.', draft: true},
  {id: 'e9', caseId: 'c6', kind: 'practice', concepts: ['qms', 'iso9001', 'documentation', 'audit'], text: 'Wrote QMS procedures and document control for ISO 9001 readiness.'},
  {id: 'e10', caseId: 'c6', kind: 'training', concepts: ['audit', 'iso9001'], text: 'Completed an ISO 9001 lead auditor training course (training — not auditor registration).'},
  {id: 'e11', caseId: 'c7', kind: 'practice', concepts: ['data'], text: 'Built a Power BI dashboard of quality KPIs for management review.'},
  {id: 'e12', caseId: 'c8', kind: 'practice', concepts: ['leadership', 'training'], text: 'Created an inspector skills matrix and coached the team.'},
  {id: 'e13', caseId: 'c8', kind: 'practice', concepts: ['5s', 'lean'], text: 'Introduced 5S on the inspection bench.'},
  {id: 'e14', caseId: 'c3', kind: 'training', concepts: ['six-sigma'], text: 'Completed a Six Sigma Green Belt course (course completion — not a certification claim).'},
  {id: 'e15', caseId: 'c6', kind: 'language', concepts: ['lang-en', 'lang-ar'], text: 'Synthetic persona works in English and Arabic.'},
  {id: 'e16', caseId: 'c1', kind: 'education', concepts: ['edu-engineering'], text: 'Synthetic persona holds an engineering degree.'},
];
export const CASE_ORDER = CASES.map(c => c.id);
