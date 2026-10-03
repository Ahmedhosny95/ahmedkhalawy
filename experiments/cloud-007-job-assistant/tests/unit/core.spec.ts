// Unit tests for the parser/mapping core over 30 synthetic JD fixtures + adapter contract tests (mock adapter only).
import {test, expect} from '@playwright/test';
import {analyze, createJobParser, parseLocal, summarize, MAX_CHARS, MAX_REQUIREMENTS, conceptById, type ParseAdapter} from '../../src/core';
import {JDS} from '../../fixtures/synthetic-jds';
import {CASE_ORDER, EVIDENCE} from '../../fixtures/synthetic-portfolio';

const deepFreeze = <T>(o: T): T => {Object.freeze(o); for (const v of Object.values(o as object)) if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v); return o;};
const FROZEN = deepFreeze(structuredClone(EVIDENCE));
const SNAP = JSON.stringify(EVIDENCE);

for (const jd of JDS) {
  test(`${jd.id} ${jd.title}`, () => {
    const p = parseLocal(jd.text);
    const a = analyze(p, FROZEN, CASE_ORDER);
    const e = jd.expect;
    // universal invariants
    let last = -1;
    for (const r of p.requirements) {
      expect(p.text.slice(r.start, r.end), 'exact span').toBe(r.text);
      expect(r.start).toBeGreaterThan(last); last = r.end;
      expect(r.text).not.toMatch(/https?:\/\/|www\./);
    }
    expect(p.requirements.length).toBeLessThanOrEqual(MAX_REQUIREMENTS);
    expect(p.text.length).toBeLessThanOrEqual(MAX_CHARS);
    for (const m of a.matches) if (m.requirement.category === 'certification' && m.level === 'evidenced')
      expect(m.evidence.every(ev => ev.kind === 'credential'), 'credentials only from credential evidence').toBe(true);
    for (const m of a.matches) expect(m.evidence.some(ev => ev.kind === 'challenge')).toBe(false);
    expect(JSON.stringify(EVIDENCE)).toBe(SNAP);
    // hand-labelled expectations
    if (e.reqCount) {expect(p.requirements.length).toBeGreaterThanOrEqual(e.reqCount[0]); expect(p.requirements.length).toBeLessThanOrEqual(e.reqCount[1]);}
    if (e.lang) expect(p.lang).toBe(e.lang);
    for (const h of e.has ?? []) {
      const m = a.matches.find(x => x.requirement.text.includes(h.includes));
      expect(m, `requirement containing "${h.includes}"; got ${JSON.stringify(p.requirements.map(r => r.text))}`).toBeTruthy();
      if (h.category) expect(m!.requirement.category, h.includes).toBe(h.category);
      if (h.status) expect(m!.requirement.status, h.includes).toBe(h.status);
      if (h.level) expect(m!.level, h.includes).toBe(h.level);
      if (h.years !== undefined) expect(m!.requirement.years, h.includes).toBe(h.years);
    }
    for (const x of e.excluded ?? []) expect(p.excluded.some(z => z.text.includes(x.includes) && z.reason === x.reason), `excluded ${x.includes}`).toBe(true);
    for (const s of e.absent ?? []) expect(p.requirements.some(r => r.text.includes(s)), `absent ${s}`).toBe(false);
    if (e.noYearsMisread) for (const r of p.requirements) if (/8D|5S|20\d\d/.test(r.text) && !/years?|سنوات|سنة/.test(r.text)) expect(r.years, r.text).toBeUndefined();
    if (e.noRelatedEvidence) {expect(a.hasRelatedEvidence).toBe(false); expect(a.route).toEqual([]); expect(summarize(a, 'en').some(s => /direct evidence/.test(s))).toBe(false);}
    if (e.truncatedChars) expect(p.truncated.chars).toBe(true);
    if (e.requirementsDropped) expect(p.truncated.requirementsDropped).toBeGreaterThan(0);
  });
}

test('route: stable ties keep original chronological order; never reorders the portfolio', () => {
  const p = parseLocal('Requirements:\n- Inspection\n- Calibration');
  const a = analyze(p, FROZEN, CASE_ORDER);
  const ids = a.route.map(s => s.caseId);
  for (let i = 1; i < a.route.length; i++) if (a.route[i].score === a.route[i - 1].score) expect(CASE_ORDER.indexOf(ids[i])).toBeGreaterThan(CASE_ORDER.indexOf(ids[i - 1]));
  expect(CASE_ORDER).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']);
});
test('matchRequirement evidence ordering is stable for equal scores', () => {
  const dup = [{id: 'x1', caseId: 'c7', kind: 'practice' as const, concepts: ['data'], text: 'a'}, {id: 'x2', caseId: 'c2', kind: 'practice' as const, concepts: ['data'], text: 'b'}];
  const a = analyze(parseLocal('Requirements:\n- Power BI dashboards'), dup, CASE_ORDER);
  expect(a.matches[0].evidence.map(e => e.id)).toEqual(['x1', 'x2']);
});
test('training never satisfies a credential; generic "certified" wording never inferred', () => {
  const a = analyze(parseLocal('Requirements:\n- Certified lead auditor required\n- Any relevant certification'), FROZEN, CASE_ORDER);
  expect(a.matches.every(m => m.level !== 'evidenced')).toBe(true);
  expect(a.matches[0].note).toBe('credential-not-shown');
});
test('summary is conditional and contains no fit percentages', () => {
  for (const jd of JDS) {
    const s = summarize(analyze(parseLocal(jd.text), FROZEN, CASE_ORDER), 'en').join(' ');
    expect(s).not.toMatch(/%|perfect|guarantee|ideal candidate|best fit/i);
  }
  expect(summarize(analyze(parseLocal(''), FROZEN, CASE_ORDER), 'en')).toEqual([]);
});
test('themes never list attributes (language/education) as contribution areas', () => {
  for (const jd of JDS) for (const th of (summarize(analyze(parseLocal(jd.text), FROZEN, CASE_ORDER), 'en'))) expect(th).not.toMatch(/Engineering degree|English|Arabic$/);
});
test('concept ids used by evidence exist in the lexicon', () => {
  for (const e of EVIDENCE) for (const c of e.concepts) expect(conceptById.has(c), c).toBe(true);
});

test.describe('adapter contract (mock only — no network)', () => {
  const text = 'Requirements:\n- SPC and MSA\n- 3 years in quality\n- Certified lead auditor';
  test('valid adapter spans are used; credentials are decided locally', async () => {
    const adapter: ParseAdapter = async ({text: t}) => {
      const s = t.indexOf('SPC and MSA'), y = t.indexOf('3 years in quality'), c = t.indexOf('Certified lead auditor');
      return {requirements: [{start: s, end: s + 11, category: 'skill', status: 'required'}, {start: y, end: y + 18, category: 'experience', status: 'required'},
        {start: c, end: c + 22, category: 'skill', status: 'preferred'}]};
    };
    const p = await createJobParser({adapter})(text);
    expect(p.source).toBe('adapter');
    expect(p.requirements.map(r => r.text)).toEqual(['SPC and MSA', '3 years in quality', 'Certified lead auditor']);
    expect(p.requirements[2].category).toBe('certification');
    expect(p.requirements[1].years).toBe(3);
  });
  test('adapter receives only the bounded job text', async () => {
    let seen: unknown;
    await createJobParser({adapter: async input => {seen = input; return {requirements: []};}})('x'.repeat(13000));
    expect(Object.keys(seen as object).sort()).toEqual(['maxRequirements', 'text']);
    expect((seen as {text: string}).text.length).toBeLessThanOrEqual(MAX_CHARS);
  });
  test('invalid spans, unknown categories and injected text are rejected → local fallback', async () => {
    const p = await createJobParser({adapter: async () => ({requirements: [{start: 0, end: 9999, category: 'skill', status: 'required'}, {start: 2, end: 6, category: 'hacker', status: 'required'}]})})(text);
    expect(p.source).toBe('local'); expect(p.fallbackReason).toBe('invalid-adapter-output');
  });
  test('adapter error and timeout fall back to the local parser', async () => {
    const err = await createJobParser({adapter: async () => {throw new Error('boom');}})(text);
    expect(err.source).toBe('local'); expect(err.fallbackReason).toBe('adapter-error'); expect(err.requirements.length).toBeGreaterThan(0);
    const slow = await createJobParser({adapter: () => new Promise(() => {}), timeoutMs: 50})(text);
    expect(slow.fallbackReason).toBe('timeout');
  });
  test('caller abort rejects with AbortError and aborts the adapter', async () => {
    const ctrl = new AbortController(); let adapterAborted = false;
    const run = createJobParser({adapter: (_i, {signal}) => new Promise((_r, rej) => signal.addEventListener('abort', () => {adapterAborted = true; rej(new Error('aborted'));}))})(text, {signal: ctrl.signal});
    ctrl.abort();
    await expect(run).rejects.toThrow(/Abort/);
    expect(adapterAborted).toBe(true);
  });
  test('adapter cannot smuggle a negated line in as a requirement', async () => {
    const t = 'Requirements:\n- A degree is not required';
    const s = t.indexOf('A degree');
    const p = await createJobParser({adapter: async () => ({requirements: [{start: s, end: t.length, category: 'education', status: 'required'}]})})(t);
    expect(p.requirements.some(r => r.text.includes('not required'))).toBe(false);
  });
});
