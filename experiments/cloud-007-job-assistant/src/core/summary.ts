// Conditional, evidence-bound summary sentences. Nothing is claimed that the mapping did not find.
import type {Analysis} from './types';
import {conceptById} from './lexicon';

export type Lang = 'en' | 'ar';
export function topThemes(a: Analysis, lang: Lang, n = 3): string[] {
  const freq = new Map<string, number>();
  for (const m of a.matches) if (m.level === 'evidenced') for (const c of m.requirement.concepts) {
    if (m.evidence.some(e => e.concepts.includes(c)) && !conceptById.get(c)?.cred && !/^(lang-|edu-)/.test(c)) freq.set(c, (freq.get(c) ?? 0) + 1);
  }
  return [...freq.entries()].sort((x, y) => y[1] - x[1]).slice(0, n).map(([c]) => conceptById.get(c)![lang]);
}
const list = (xs: string[], lang: Lang) => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(lang === 'ar' ? '، ' : ', ') + (lang === 'ar' ? ' و' : ' and ') + xs[xs.length - 1];

export function summarize(a: Analysis, lang: Lang): string[] {
  const out: string[] = [];
  const {counts} = a; const themes = topThemes(a, lang);
  if (!a.parse.requirements.length) return out;
  if (counts.evidenced > 0) {
    out.push(lang === 'ar'
      ? `تُظهر الحالات أدلة مباشرة على ${counts.evidenced} من ${a.parse.requirements.length} متطلباً مستخرجاً${counts.required ? `، منها ${counts.evidencedRequired} من ${counts.required} متطلبات إلزامية` : ''}.`
      : `The cases show direct evidence for ${counts.evidenced} of ${a.parse.requirements.length} extracted requirements${counts.required ? `, including ${counts.evidencedRequired} of ${counts.required} marked required` : ''}.`);
    if (themes.length) out.push(lang === 'ar' ? `أوضح نقاط المساهمة: ${list(themes, lang)}.` : `The clearest contribution areas are ${list(themes, lang)}.`);
  } else if (counts.related > 0) {
    out.push(lang === 'ar' ? 'لا يوجد دليل مباشر بعد، لكن هناك ممارسة ذات صلة تستحق النقاش.' : 'No direct evidence yet, but related practice is worth discussing.');
  }
  if (counts.discussion > 0) out.push(lang === 'ar'
    ? `${counts.discussion} من المتطلبات لا تظهر في الحالات؛ وهي مواضيع مناسبة للمقابلة وليست استنتاجات سلبية.`
    : `${counts.discussion} requirement${counts.discussion > 1 ? 's are' : ' is'} not shown in the cases — good topics for a conversation rather than conclusions.`);
  return out;
}
