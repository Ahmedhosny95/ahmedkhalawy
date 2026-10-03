// Local evidence mapping over a caller-supplied, already-scoped evidence array. Pure; never mutates inputs.
import type {Analysis, EvidenceItem, MatchLevel, ParseResult, Requirement, RequirementMatch, RouteStep} from './types';
import {conceptById} from './lexicon';

const WEIGHT = {required: 3, preferred: 2, unspecified: 1} as const;
/** Broad concepts alone do not prove a specific requirement (e.g. generic inspection ≠ LV switchgear inspection). */
const BROAD = new Set(['manufacturing', 'inspection', 'testing', 'documentation', 'data']);

/** Which evidence kinds can support a requirement category. Credentials need credential evidence — never practice/training/challenge. */
function supports(req: Requirement, ev: EvidenceItem): number {
  if (ev.kind === 'challenge') return 0; // a problem description is context, not capability or possession
  const shared = req.concepts.filter(c => ev.concepts.includes(c));
  switch (req.category) {
    case 'certification': {
      const credConcepts = req.concepts.filter(c => conceptById.get(c)?.cred);
      if (ev.kind !== 'credential') return 0;
      if (!credConcepts.length) return 0; // generic "certified/licensed" wording: never inferred from evidence
      return credConcepts.filter(c => ev.concepts.includes(c)).length * 10;
    }
    case 'experience':
      return ev.kind === 'experience-years' && req.years !== undefined && (ev.years ?? 0) >= req.years && shared.length ? 10 : 0;
    case 'education': return ev.kind === 'education' && shared.length ? 10 : 0;
    case 'language': return ev.kind === 'language' && shared.length ? 10 : 0;
    case 'location': return ev.kind === 'location' && shared.length ? 10 : 0;
    default:
      if (ev.kind !== 'practice' && ev.kind !== 'training') return 0;
      return shared.filter(c => !conceptById.get(c)?.cred).length * (ev.kind === 'training' ? 1 : 3);
  }
}
/** Related (not supporting) practice for credential/experience requirements: shown as context only. */
function relatedOnly(req: Requirement, ev: EvidenceItem): number {
  if ((ev.kind !== 'practice' && ev.kind !== 'training') || !['certification', 'experience'].includes(req.category)) return 0;
  return req.concepts.filter(c => !conceptById.get(c)?.cred && ev.concepts.includes(c)).length;
}

export function matchRequirement(req: Requirement, evidence: readonly EvidenceItem[]): RequirementMatch {
  const scored = evidence.map((ev, i) => ({ev, i, s: supports(req, ev)})).filter(x => x.s > 0);
  // stable: higher score first, ties keep caller (original) order
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  const specific = req.concepts.filter(c => !BROAD.has(c) && !conceptById.get(c)?.cred);
  const coversSpecific = (ev: EvidenceItem) => !specific.length || specific.some(c => ev.concepts.includes(c)) || req.category !== 'skill' && req.category !== 'responsibility';
  const verified = scored.filter(x => !x.ev.draft && x.ev.kind !== 'training' && coversSpecific(x.ev));
  const broadOnly = scored.filter(x => !x.ev.draft && x.ev.kind !== 'training' && !coversSpecific(x.ev));
  const training = scored.filter(x => !x.ev.draft && x.ev.kind === 'training');
  const drafts = scored.filter(x => x.ev.draft);
  if (verified.length) return {requirement: req, level: 'evidenced', evidence: verified.slice(0, 3).map(x => x.ev), note: 'direct'};
  if (training.length) return {requirement: req, level: 'related', evidence: training.slice(0, 2).map(x => x.ev), note: 'only-related'};
  if (drafts.length) return {requirement: req, level: 'draft', evidence: [...drafts.slice(0, 2), ...broadOnly.slice(0, 1)].map(x => x.ev), note: 'only-draft'};
  if (broadOnly.length) return {requirement: req, level: 'related', evidence: broadOnly.slice(0, 2).map(x => x.ev), note: 'only-related'};
  const rel = evidence.map((ev, i) => ({ev, i, s: relatedOnly(req, ev)})).filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i);
  const note = req.category === 'certification' ? 'credential-not-shown' : req.category === 'experience' ? 'years-not-shown'
    : ['education', 'language', 'location'].includes(req.category) ? 'attribute-not-shown' : 'none';
  return {requirement: req, level: rel.length ? 'related' : 'discussion', evidence: rel.slice(0, 2).map(x => x.ev), note: rel.length ? note : note};
}

export function analyze(parse: ParseResult, evidence: readonly EvidenceItem[], caseOrder: readonly string[]): Analysis {
  const matches = parse.requirements.map(r => matchRequirement(r, evidence));
  // Route: per case, sum requirement weights it helps with; ties keep the portfolio's chronological order.
  const byCase = new Map<string, RouteStep>();
  for (const m of matches) {
    if (m.level === 'discussion') continue;
    const w = WEIGHT[m.requirement.status] * (m.level === 'evidenced' ? 2 : 1);
    for (const ev of m.evidence) {
      const step = byCase.get(ev.caseId) ?? {caseId: ev.caseId, score: 0, requirementIds: [], concepts: []};
      if (!step.requirementIds.includes(m.requirement.id)) {step.requirementIds.push(m.requirement.id); step.score += w;}
      for (const c of m.requirement.concepts) if (ev.concepts.includes(c) && !step.concepts.includes(c)) step.concepts.push(c);
      byCase.set(ev.caseId, step);
    }
  }
  const order = (id: string) => {const i = caseOrder.indexOf(id); return i < 0 ? Number.MAX_SAFE_INTEGER : i;};
  const route = [...byCase.values()].sort((a, b) => b.score - a.score || order(a.caseId) - order(b.caseId)).slice(0, 4);
  const required = matches.filter(m => m.requirement.status === 'required');
  const count = (l: MatchLevel) => matches.filter(m => m.level === l).length;
  return {
    parse, matches, route,
    counts: {required: required.length, evidencedRequired: required.filter(m => m.level === 'evidenced').length,
      evidenced: count('evidenced'), related: count('related') + count('draft'), discussion: count('discussion')},
    hasRelatedEvidence: matches.some(m => m.level !== 'discussion'),
  };
}
