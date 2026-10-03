// Public types for the recruiter job-description assistant core (pure, DOM-free, no network).
export type Category = 'experience' | 'skill' | 'certification' | 'education' | 'language' | 'location' | 'responsibility' | 'other';
export type ReqStatus = 'required' | 'preferred' | 'unspecified';
export const CATEGORIES: readonly Category[] = ['experience', 'skill', 'certification', 'education', 'language', 'location', 'responsibility', 'other'];
export const STATUSES: readonly ReqStatus[] = ['required', 'preferred', 'unspecified'];

/** A requirement is always an exact span of the (bounded) pasted text: text === source.slice(start, end). */
export interface Requirement {
  id: string; text: string; start: number; end: number;
  category: Category; status: ReqStatus;
  concepts: string[]; years?: number; credential: boolean;
}
export interface Excluded { text: string; start: number; end: number; reason: 'negated' | 'instruction-like' | 'link-only' }
export interface ParseResult {
  text: string;               // bounded text actually analysed
  lang: 'ar' | 'en' | 'mixed';
  requirements: Requirement[];
  excluded: Excluded[];
  truncated: {chars: boolean; originalLength: number; requirementsDropped: number};
  source: 'adapter' | 'local';
  fallbackReason?: string;
}
/** Caller-supplied, already-scoped evidence. The core never fetches anything. */
export interface EvidenceItem {
  id: string; caseId: string; text: string; concepts: string[];
  kind: 'practice' | 'credential' | 'training' | 'challenge' | 'education' | 'language' | 'location' | 'experience-years';
  draft?: boolean; years?: number;
}
export interface CaseRef { id: string; title: string; period: string }
export type MatchLevel = 'evidenced' | 'related' | 'draft' | 'discussion';
export interface RequirementMatch {
  requirement: Requirement; level: MatchLevel;
  evidence: EvidenceItem[];       // best first; ties keep caller order
  note: 'credential-not-shown' | 'years-not-shown' | 'attribute-not-shown' | 'only-draft' | 'only-related' | 'direct' | 'none';
}
export interface RouteStep { caseId: string; score: number; requirementIds: string[]; concepts: string[] }
export interface Analysis {
  parse: ParseResult; matches: RequirementMatch[]; route: RouteStep[];
  counts: {required: number; evidencedRequired: number; evidenced: number; related: number; discussion: number};
  hasRelatedEvidence: boolean;
}
/** Injectable async parser (e.g. a server-side model). Input is ONLY the pasted public job text. */
export type ParseAdapter = (input: {text: string; maxRequirements: number}, opts: {signal: AbortSignal}) =>
  Promise<{requirements: Array<{start: number; end: number; category: string; status: string}>}>;
