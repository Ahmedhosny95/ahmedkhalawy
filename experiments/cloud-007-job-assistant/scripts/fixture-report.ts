// Writes a machine-readable per-fixture summary (synthetic JDs × synthetic portfolio). Usage: see README.
import {writeFileSync} from 'node:fs';
import {analyze, parseLocal} from '../src/core';
import {JDS} from '../fixtures/synthetic-jds';
import {CASE_ORDER, EVIDENCE} from '../fixtures/synthetic-portfolio';
const out = process.argv[2];
const rows = JDS.map(jd => {
  const a = analyze(parseLocal(jd.text), EVIDENCE, CASE_ORDER);
  return {id: jd.id, title: jd.title, lang: a.parse.lang, requirements: a.parse.requirements.length, excluded: a.parse.excluded.map(x => x.reason),
    truncated: a.parse.truncated, counts: a.counts, route: a.route.map(r => r.caseId),
    levels: a.matches.map(m => ({text: m.requirement.text.slice(0, 80), category: m.requirement.category, status: m.requirement.status, level: m.level, note: m.note}))};
});
writeFileSync(out, JSON.stringify({note: 'Synthetic fixtures only; not real postings or production results.', rows}, null, 1));
console.log('fixtures', rows.length);
