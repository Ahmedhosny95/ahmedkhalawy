// Deterministic local parser + async adapter wrapper. Pasted text is treated strictly as data:
// nothing in it is executed, followed or fetched; links and instruction-like lines are excluded.
import {CATEGORIES, STATUSES, type Category, type Excluded, type ParseAdapter, type ParseResult, type ReqStatus, type Requirement} from './types';
import {conceptsIn, conceptById} from './lexicon';

export const MAX_CHARS = 12_000;
export const MAX_REQUIREMENTS = 24;

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toAsciiDigits = (s: string) => s.replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d)));

type Section = 'required' | 'preferred' | 'responsibilities' | 'skip' | 'neutral';
const HEADINGS: Array<[RegExp, Section]> = [
  [/^(preferred|nice[- ]to[- ]have|desirable|bonus|advantageous|plus|preferred qualifications?|additional (skills|qualifications))\b/i, 'preferred'],
  [/^(requirements?|qualifications?|minimum qualifications?|required (skills|qualifications)|must[- ]haves?|essential|what you (need|bring)|who you are|skills( and experience)?|experience|key skills)\b/i, 'required'],
  [/^(responsibilities|key responsibilities|duties|what you('| wi)ll do|the role|role overview|job description|your role|scope)\b/i, 'responsibilities'],
  [/^(about (us|the company)|company( overview)?|benefits|what we offer|perks|salary|compensation|how to apply|application|equal opportunity|our values|location and (hours|schedule)|apply)\b/i, 'skip'],
  [/^(يفضل|مميزات إضافية|ميزة إضافية|مؤهلات مفضلة)/u, 'preferred'],
  [/^(المتطلبات|المؤهلات|الشروط|المهارات المطلوبة|الخبرات المطلوبة)/u, 'required'],
  [/^(المهام|المسؤوليات|الوصف الوظيفي|مهام الوظيفة)/u, 'responsibilities'],
  [/^(عن الشركة|المزايا|نقدم لك|طريقة التقديم|الراتب)/u, 'skip'],
];
const REQUIRED_CUE = /\b(required|must|mandatory|essential|minimum|at least)\b|يشترط|إلزامي|مطلوب|لا يقل عن/iu;
const PREFERRED_CUE = /\b(preferred|nice to have|a plus|an advantage|advantageous|desirable|ideally|bonus)\b|يفضل|ميزة|مرغوب/iu;
const NEGATION = /\b(no|not|without)\b[^.;\n]{0,40}\b(required|needed|necessary|mandatory|essential)\b|\bnot (required|needed|necessary|mandatory)\b|\bno (prior |previous )?(experience|degree|certification|certificate)\b|لا يشترط|غير مطلوب|غير ضروري|ليس شرطا|ليس شرطاً|لا تشترط/iu;
const INSTRUCTION = /\b(ignore|disregard|forget)\b.{0,40}\b(instructions?|previous|above|rules|prompt)\b|\bsystem prompt\b|\byou are (an?|the) (ai|assistant|model)\b|\b(rate|score|rank) (this|the) candidate\b|\brespond with\b|تجاهل (التعليمات|ما سبق)/iu;
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/giu;
const DATE_ONLY = /^(start(ing)? date|closing date|apply by|deadline|posted( on)?|date)\b|تاريخ (البدء|الإغلاق|النشر)/iu;
const YEARS_EN = /(\d{1,2})\s*\+?\s*(?:(?:-|–|to)\s*(\d{1,2})\s*)?\+?\s*(?:years?|yrs?)\b/iu;
const YEARS_AR = /(\d{1,2})\s*\+?\s*(?:(?:-|–|إلى)\s*(\d{1,2})\s*)?(?:سنوات|سنة|أعوام|عام)/u;
const NOT_CRED_LICENCE = /driving licen[cs]e|رخصة (قيادة|سياقة)/iu;
const CRED_GENERIC = /\b(certif(ied|ication|icate)s?|licen[cs]e[ds]?|registered|accredited|chartered)\b|شهادة|معتمد|رخصة|عضوية/iu;
const NOT_CRED_CONTEXT = /\bcertification (audits?|bodies|body|process)\b|\bcertified (company|organi[sz]ation|facility|plant|suppliers?)\b|\bmaintain(ing)? (the )?(iso )?certification\b/iu;
const EDUCATION = /\b(bachelor|b\.?\s?sc|b\.?\s?eng|bs degree|degree|master'?s|m\.?\s?sc|diploma|graduate)\b|بكالوريوس|درجة جامعية|شهادة جامعية|دبلوم|ماجستير/iu;
const LANGUAGE = /\b(english|arabic|french|bilingual|fluent|fluency)\b|اللغة (الإنجليزية|العربية)|إجادة/iu;
const LOCATION = /\b(based in|relocat\w*|on-?site|onsite|travel|riyadh|jeddah|dammam|ksa|saudi arabia|residency|iqama|transferable|nationality|visa|work permit|driving licen[cs]e)\b|الرياض|جدة|الدمام|إقامة|نقل كفالة|الجنسية/iu;

function sectionOf(line: string): Section | null {
  if (/[:：]\s*\S/u.test(line)) return null; // "Heading: content" is handled as an inline heading
  const t = line.replace(/^[#*\s]+/, '').replace(/[:：\s]+$/u, '').trim();
  if (!t || t.length > 60) return null;
  for (const [re, s] of HEADINGS) if (re.test(t)) {
    // a heading is short and has no other sentence content after the keyword
    if (/[:：]\s*$/u.test(line.trim()) || t.split(/\s+/).length <= 5) return s;
  }
  return null;
}
const BULLET = /^[\s‏‎]*(?:[-*•·●▪◦‣–—]|\d{1,2}[.)]|[a-z][.)]|[٠-٩]{1,2}[.)-])\s+/u;

/** Split bounded text into candidate segments with exact offsets (lines, then sentences within long lines). */
function segments(text: string): Array<{start: number; end: number; line: string}> {
  const out: Array<{start: number; end: number; line: string}> = [];
  let pos = 0;
  for (const raw of text.split(/\n/)) {
    const lineStart = pos; pos += raw.length + 1;
    const line = raw;
    // split on "; " and on ". " followed by an uppercase/Arabic letter — keeps "e.g." and "ISO 9001." intact
    const parts: Array<[number, number]> = [];
    let s = 0;
    const re = /;\s+|\.\s+(?=[A-Z0-9\u0600-\u06FF\u0660-\u0669])/gu; let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {parts.push([s, m.index + (m[0][0] === '.' ? 1 : 0)]); s = m.index + m[0].length;}
    parts.push([s, line.length]);
    for (const [a, b] of parts) out.push({start: lineStart + a, end: lineStart + b, line});
  }
  return out;
}
/** Trim a span to its content: strip bullet markers, whitespace and trailing punctuation, keeping exact offsets. */
function trimSpan(text: string, a: number, b: number): [number, number, boolean] {
  const bm = BULLET.exec(text.slice(a, b)); if (bm) a += bm[0].length;
  while (a < b && /[\s‏‎]/u.test(text[a])) a++;
  while (b > a && /[\s.,;:‏‎]/u.test(text[b - 1])) b--;
  return [a, b, !!bm];
}
export function detectLang(text: string): 'ar' | 'en' | 'mixed' {
  const ar = (text.match(/[؀-ۿ]/g) || []).length, la = (text.match(/[A-Za-z]/g) || []).length;
  if (ar > la * 3) return 'ar'; if (la > ar * 3) return 'en'; return 'mixed';
}
export function bound(input: string): {text: string; truncated: boolean; originalLength: number} {
  const norm = input.replace(/\r\n?/g, '\n');
  if (norm.length <= MAX_CHARS) return {text: norm, truncated: false, originalLength: norm.length};
  const cut = norm.lastIndexOf('\n', MAX_CHARS);
  return {text: norm.slice(0, cut > MAX_CHARS * 0.8 ? cut : MAX_CHARS), truncated: true, originalLength: norm.length};
}

export function classify(span: string, section: Section): {category: Category; status: ReqStatus; concepts: string[]; years?: number; credential: boolean} {
  const concepts = conceptsIn(span);
  const ascii = toAsciiDigits(span);
  const ym = YEARS_EN.exec(ascii) || YEARS_AR.exec(ascii);
  const years = ym ? Number(ym[1]) : undefined;
  const credConcept = concepts.some(c => conceptById.get(c)?.cred);
  const credential = credConcept || (CRED_GENERIC.test(span) && !NOT_CRED_CONTEXT.test(span) && !EDUCATION.test(span) && !NOT_CRED_LICENCE.test(span));
  let category: Category;
  if (credential) category = 'certification';
  else if (years !== undefined) category = 'experience';
  else if (EDUCATION.test(span)) category = 'education';
  else if (LANGUAGE.test(span)) category = 'language';
  else if (LOCATION.test(span)) category = 'location';
  else if (section === 'responsibilities') category = 'responsibility';
  else category = concepts.length ? 'skill' : 'other';
  let status: ReqStatus = section === 'required' ? 'required' : section === 'preferred' ? 'preferred' : 'unspecified';
  if (PREFERRED_CUE.test(span)) status = 'preferred';
  else if (REQUIRED_CUE.test(span)) status = 'required';
  return {category, status, concepts: concepts.filter(c => !(credential ? false : conceptById.get(c)?.cred)), years, credential};
}

/** Deterministic local parse. Never throws for string input. */
export function parseLocal(input: string): ParseResult {
  const {text, truncated, originalLength} = bound(String(input ?? ''));
  const reqs: Requirement[] = []; const excluded: Excluded[] = [];
  let section: Section = 'neutral'; let dropped = 0;
  let lastLine = ''; let seenContent = false;
  for (const seg of segments(text)) {
    let segStart = seg.start;
    if (seg.line !== lastLine) {
      lastLine = seg.line; const s = sectionOf(seg.line); if (s) {section = s; continue;}
      const inline = /^([^:：\n]{2,40})[:：]\s*(?=\S)/u.exec(text.slice(seg.start, seg.end));
      if (inline) {const h = sectionOf(inline[1] + ':'); if (h) {section = h; segStart = seg.start + inline[0].length;}}
    }
    if (section === 'skip') continue;
    const [a, b, isBullet] = trimSpan(text, segStart, seg.end);
    if (b - a < 3) continue;
    const span = text.slice(a, b);
    // the first short, non-bullet line is normally the job title, not a requirement
    if (!seenContent) {seenContent = true; if (!isBullet && seg.start === segStart && span.split(/\s+/).length <= 8 && !/[.:]/.test(span)) continue;}
    if (INSTRUCTION.test(span)) {excluded.push({text: span, start: a, end: b, reason: 'instruction-like'}); continue;}
    const withoutLinks = span.replace(URL_RE, '').trim();
    if (!withoutLinks || withoutLinks.length < 3) {excluded.push({text: span, start: a, end: b, reason: 'link-only'}); continue;}
    if (DATE_ONLY.test(span)) continue;
    const c = classify(span, section);
    const cue = REQUIRED_CUE.test(span) || PREFERRED_CUE.test(span);
    const relevant = section === 'required' || section === 'preferred' || section === 'responsibilities' || isBullet || cue ||
      c.concepts.length > 0 || c.years !== undefined || c.credential || ['education', 'language', 'location'].includes(c.category);
    if (!relevant) continue;
    if (NEGATION.test(span)) {excluded.push({text: span, start: a, end: b, reason: 'negated'}); continue;}
    // unclassifiable prose outside requirement sections (not a bullet, no cue) is description, not a requirement
    if (c.category === 'other' && section === 'neutral' && !isBullet && !cue) continue;
    if (reqs.length >= MAX_REQUIREMENTS) {dropped++; continue;}
    reqs.push({id: 'r' + (reqs.length + 1), text: span, start: a, end: b, ...c});
  }
  return {text, lang: detectLang(text), requirements: reqs, excluded,
    truncated: {chars: truncated, originalLength, requirementsDropped: dropped}, source: 'local'};
}

/** Validate untrusted adapter output against the source; keep only exact, well-formed spans. */
export function validateAdapterOutput(text: string, out: unknown): Requirement[] | null {
  const list = (out as {requirements?: unknown})?.requirements;
  if (!Array.isArray(list)) return null;
  const reqs: Requirement[] = []; let lastEnd = -1;
  const sorted = list.filter(x => x && typeof x === 'object').map(x => x as Record<string, unknown>)
    .filter(x => Number.isInteger(x.start) && Number.isInteger(x.end))
    .sort((p, q) => (p.start as number) - (q.start as number));
  for (const x of sorted) {
    const start = x.start as number, end = x.end as number;
    if (start < 0 || end > text.length || end - start < 3 || start < lastEnd) continue;
    const span = text.slice(start, end);
    if (span !== span.trim() || /\n/.test(span)) continue;
    if (!CATEGORIES.includes(x.category as Category) || !STATUSES.includes(x.status as ReqStatus)) continue;
    if (INSTRUCTION.test(span) || NEGATION.test(span)) continue; // local safety net overrides the adapter
    const local = classify(span, 'neutral');
    // credentials are decided locally from the span itself, never from adapter labels alone
    const category = local.credential ? 'certification' : (x.category as Category) === 'certification' ? local.category : x.category as Category;
    reqs.push({id: 'r' + (reqs.length + 1), text: span, start, end, category, status: x.status as ReqStatus,
      concepts: local.concepts, years: local.years, credential: local.credential});
    lastEnd = end;
    if (reqs.length >= MAX_REQUIREMENTS) break;
  }
  return reqs.length ? reqs : null;
}

/** Async parser with an injectable adapter, timeout, abort and deterministic local fallback. */
export function createJobParser({adapter, timeoutMs = 8000}: {adapter?: ParseAdapter; timeoutMs?: number} = {}) {
  return async function parse(input: string, {signal}: {signal?: AbortSignal} = {}): Promise<ParseResult> {
    const local = parseLocal(input);
    if (!adapter) return local;
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    signal?.addEventListener('abort', onAbort);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const out = await Promise.race([
        adapter({text: local.text, maxRequirements: MAX_REQUIREMENTS}, {signal: ctrl.signal}),
        new Promise<never>((_, rej) => {timer = setTimeout(() => {ctrl.abort(); rej(new Error('timeout'));}, timeoutMs);}),
      ]);
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const reqs = validateAdapterOutput(local.text, out);
      if (!reqs) return {...local, fallbackReason: 'invalid-adapter-output'};
      return {...local, requirements: reqs, source: 'adapter'};
    } catch (e) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return {...local, fallbackReason: (e as Error)?.message === 'timeout' ? 'timeout' : 'adapter-error'};
    } finally {clearTimeout(timer); signal?.removeEventListener('abort', onAbort);}
  };
}
