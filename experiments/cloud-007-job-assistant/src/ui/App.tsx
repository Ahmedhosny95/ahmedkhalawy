import * as React from 'react';
import {analyze, conceptById, createJobParser, MAX_CHARS, MAX_REQUIREMENTS, parseLocal, summarize,
  type Analysis, type ParseAdapter, type RequirementMatch} from '../core';
import {CASE_BODY, CASE_ORDER, CASES, EVIDENCE, PERSONA} from '../../fixtures/synthetic-portfolio';
import {JDS} from '../../fixtures/synthetic-jds';
import {DICT, type Lang} from './i18n';

type Mode = 'local' | 'mock' | 'fail' | 'error';
type Phase = 'empty' | 'loading' | 'done' | 'error';
type View = {kind: 'list'} | {kind: 'case'; id: string; from: 'assistant' | 'list'; returnKey: string};

/** Mock adapter for the demo: async, abortable, returns spans only (as a server parser would). No network. */
const mockAdapter: ParseAdapter = (input, {signal}) => new Promise((resolve, reject) => {
  const t = setTimeout(() => resolve({requirements: parseLocal(input.text).requirements.map(r => ({start: r.start, end: r.end, category: r.category, status: r.status}))}), 650);
  signal.addEventListener('abort', () => {clearTimeout(t); reject(new Error('aborted'));});
});
const failingAdapter: ParseAdapter = () => new Promise((_, reject) => setTimeout(() => reject(new Error('mock adapter failure')), 450));
const caseById = new Map(CASES.map(c => [c.id, c]));

export function App() {
  const [lang, setLang] = React.useState<Lang>('en');
  const t = DICT[lang];
  const [view, setView] = React.useState<View>({kind: 'list'});
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [analyzedText, setAnalyzedText] = React.useState<string | null>(null);
  const [phase, setPhase] = React.useState<Phase>('empty');
  const [result, setResult] = React.useState<Analysis | null>(null);
  const [mode, setMode] = React.useState<Mode>('local');
  const ctrl = React.useRef<AbortController | null>(null);
  const launcher = React.useRef<HTMLButtonElement>(null);
  const panelBody = React.useRef<HTMLDivElement>(null);
  const pendingFocus = React.useRef<{key: string; panelScroll?: number; pageScroll?: number} | null>(null);
  const listScroll = React.useRef(0);

  React.useEffect(() => {document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';}, [lang]);
  React.useEffect(() => {document.documentElement.toggleAttribute('data-panel-open', open);}, [open]);

  const run = async () => {
    if (!text.trim()) return;
    ctrl.current?.abort(); const c = new AbortController(); ctrl.current = c;
    setPhase('loading');
    try {
      if (mode === 'error') {await new Promise(r => setTimeout(r, 350)); throw new Error('simulated total failure');}
      const parse = createJobParser({adapter: mode === 'mock' ? mockAdapter : mode === 'fail' ? failingAdapter : undefined});
      const p = await parse(text, {signal: c.signal});
      if (c.signal.aborted) return;
      setResult(analyze(p, EVIDENCE, CASE_ORDER)); setAnalyzedText(text); setPhase('done');
      requestAnimationFrame(() => document.getElementById('ja-results-title')?.focus());
    } catch (e) {
      if ((e as Error)?.name === 'AbortError' || c.signal.aborted) return;
      setPhase('error');
      requestAnimationFrame(() => document.getElementById('ja-error-title')?.focus());
    }
  };
  const cancel = () => {ctrl.current?.abort(); setPhase(result ? 'done' : 'empty');};
  const clear = () => {ctrl.current?.abort(); setText(''); setResult(null); setAnalyzedText(null); setPhase('empty'); requestAnimationFrame(() => document.getElementById('ja-text')?.focus());};
  const openPanel = () => {setOpen(true); requestAnimationFrame(() => (result ? document.getElementById('ja-results-title') : document.getElementById('ja-text'))?.focus());};
  const closePanel = () => {setOpen(false); requestAnimationFrame(() => launcher.current?.focus());};

  // Opening a case (from the list or from the assistant) and returning restores scroll and focus.
  const openCase = (id: string, from: 'assistant' | 'list', returnKey: string) => {
    if (from === 'assistant') pendingFocus.current = {key: returnKey, panelScroll: panelBody.current?.scrollTop};
    else listScroll.current = window.scrollY;
    history.pushState({ja: 'case', id}, '');
    setView({kind: 'case', id, from, returnKey});
    if (from === 'assistant') setOpen(false);
    requestAnimationFrame(() => {window.scrollTo(0, 0); document.getElementById('case-title')?.focus();});
  };
  const backFromCase = React.useCallback((v: View) => {
    if (v.kind !== 'case') return;
    setView({kind: 'list'});
    if (v.from === 'assistant') {
      setOpen(true);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (panelBody.current && pendingFocus.current?.panelScroll !== undefined) panelBody.current.scrollTop = pendingFocus.current.panelScroll;
        document.querySelector<HTMLElement>(`[data-return-key="${CSS.escape(v.returnKey)}"]`)?.focus({preventScroll: true});
      }));
    } else {
      requestAnimationFrame(() => {window.scrollTo(0, listScroll.current); document.querySelector<HTMLElement>(`[data-return-key="${CSS.escape(v.returnKey)}"]`)?.focus({preventScroll: true});});
    }
  }, []);
  const viewRef = React.useRef(view); viewRef.current = view;
  React.useEffect(() => {
    const onPop = () => backFromCase(viewRef.current);
    addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop);
  }, [backFromCase]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {if (e.key === 'Escape') {e.preventDefault(); closePanel();}};
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, [open]);

  const stale = phase === 'done' && analyzedText !== null && text !== analyzedText;
  const isMobile = useMedia('(max-width: 699px)');

  return <>
    <a className="skip" href="#portfolio">{lang === 'ar' ? 'تخطَّ إلى الحالات' : 'Skip to cases'}</a>
    <header className="top" inert={open && isMobile || undefined}>
      <div className="wrap top-in">
        <div><p className="persona">{lang === 'ar' ? PERSONA.nameAr : PERSONA.name}</p><p className="synthetic" role="note">{t.synthetic}</p></div>
        <button type="button" className="btn btn-quiet" onClick={() => setLang(l => (l === 'en' ? 'ar' : 'en'))} lang={lang === 'en' ? 'ar' : 'en'}>{t.langToggle}</button>
      </div>
    </header>
    <main id="portfolio" className="wrap" inert={open && isMobile || undefined}>
      {view.kind === 'list' ? <Portfolio t={t} onOpen={(id) => openCase(id, 'list', 'list-' + id)}/> :
        <CaseDetail t={t} id={view.id} from={view.from} onBack={() => history.back()}/>}
    </main>
    <button ref={launcher} type="button" className="launcher" aria-expanded={open} aria-controls="ja-panel" onClick={() => (open ? closePanel() : openPanel())}
      data-has-result={result ? '' : undefined} hidden={open && isMobile}>
      <span className="launcher-dot" aria-hidden="true"/>{result && !open ? t.launcherKept : t.launcher}
    </button>
    <aside id="ja-panel" className="panel" data-open={open || undefined} aria-labelledby="ja-title" hidden={!open}>
      <div className="panel-head">
        <h2 id="ja-title">{t.panelTitle}</h2>
        <button type="button" className="btn btn-quiet" onClick={closePanel}>{t.close} <span aria-hidden="true">×</span></button>
      </div>
      <div className="panel-body" ref={panelBody}>
        <p className="muted small">{t.optional}</p>
        <Input t={t} lang={lang} text={text} setText={setText} phase={phase} onRun={run} onCancel={cancel} onClear={clear} stale={stale} hasResult={!!result}/>
        <details className="demo"><summary>{t.demo}</summary>
          <label className="field-inline">{t.mode}{' '}
            <select value={mode} onChange={e => setMode(e.target.value as Mode)}>
              {(Object.keys(t.modes) as Mode[]).map(m => <option key={m} value={m}>{t.modes[m]}</option>)}
            </select>
          </label>
          <label className="field-inline">{t.samples}{' '}
            <select value="" onChange={e => {const jd = JDS.find(j => j.id === e.target.value); if (jd) setText(jd.text);}}>
              <option value="">{t.sample}</option>
              {JDS.filter(j => j.text.length < 3000).map(j => <option key={j.id} value={j.id}>{j.id} · {j.title}</option>)}
            </select>
          </label>
        </details>
        <div aria-live="polite" className="sr-live">{phase === 'loading' ? t.loading : ''}</div>
        {phase === 'error' && <div className="state state-error" role="alert">
          <h3 id="ja-error-title" tabIndex={-1}>{t.errorTitle}</h3><p>{t.errorBody}</p>
          <button type="button" className="btn" onClick={run}>{t.retry}</button>
        </div>}
        {phase === 'empty' && !result && <p className="state state-empty">{t.emptyHint}</p>}
        {result && phase !== 'error' && <Results t={t} lang={lang} a={result} stale={stale} dim={phase === 'loading' || stale} onOpenCase={(id, key) => openCase(id, 'assistant', key)} onRerun={run}/>}
      </div>
    </aside>
  </>;
}

function useMedia(q: string) {
  const [m, setM] = React.useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
  React.useEffect(() => {const mq = matchMedia(q); const on = () => setM(mq.matches); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on);}, [q]);
  return m;
}

type T = typeof DICT['en'];
function Portfolio({t, onOpen}: {t: T; onOpen: (id: string) => void}) {
  return <section aria-labelledby="pf-title">
    <h1 id="pf-title">{t.portfolioTitle}</h1>
    <p className="muted">{t.portfolioNote}</p>
    <ol className="cases">{CASES.map((c, i) => <li key={c.id} className="case-row">
      <span className="case-n">{String(i + 1).padStart(2, '0')}</span>
      <div><p className="case-period">{c.period}</p><h3>{c.title}</h3><p className="muted">{CASE_BODY[c.id].replace('Synthetic case. ', '')}</p></div>
      <button type="button" className="btn btn-ghost" data-return-key={'list-' + c.id} onClick={() => onOpen(c.id)}>{t.openCase}<span className="sr-only">: {c.title}</span></button>
    </li>)}</ol>
  </section>;
}
function CaseDetail({t, id, from, onBack}: {t: T; id: string; from: 'assistant' | 'list'; onBack: () => void}) {
  const c = caseById.get(id)!; const i = CASE_ORDER.indexOf(id);
  return <article className="case-detail" aria-labelledby="case-title">
    <button type="button" className="btn btn-ghost" onClick={onBack}>← {from === 'assistant' ? t.backToResults : t.backToCases}</button>
    <p className="case-period">{t.caseOf(i + 1, CASES.length)} · {c.period}</p>
    <h1 id="case-title" tabIndex={-1}>{c.title}</h1>
    <p className="lead">{CASE_BODY[id]}</p>
    <ul className="ev-list">{EVIDENCE.filter(e => e.caseId === id).map(e => <li key={e.id}>{e.text}{e.draft && <span className="chip chip-draft">{t.level.draft}</span>}{e.kind === 'challenge' && <span className="chip">context</span>}</li>)}</ul>
  </article>;
}

function Input({t, lang, text, setText, phase, onRun, onCancel, onClear, stale, hasResult}: {t: T; lang: Lang; text: string; setText: (s: string) => void; phase: Phase; onRun: () => void; onCancel: () => void; onClear: () => void; stale: boolean; hasResult: boolean}) {
  const n = text.length; const over = n > MAX_CHARS;
  return <form className="input" onSubmit={e => {e.preventDefault(); onRun();}}>
    <label htmlFor="ja-text">{t.label}</label>
    <textarea id="ja-text" dir="auto" value={text} onChange={e => setText(e.target.value)} placeholder={t.placeholder} rows={8} spellCheck={false}
      aria-describedby="ja-count ja-privacy" disabled={phase === 'loading'}/>
    <p id="ja-count" className={'small ' + (over ? 'warn' : 'muted')}>{t.chars(n, MAX_CHARS)}{over ? ' — ' + t.overLimit(MAX_CHARS) : ''}</p>
    <p id="ja-privacy" className="small muted">{t.privacy}</p>
    <div className="row">
      {phase === 'loading'
        ? <><span className="spinner" aria-hidden="true"/><span className="small">{t.loading}</span><button type="button" className="btn btn-ghost" onClick={onCancel}>{t.cancel}</button></>
        : <><button type="submit" className="btn" disabled={!text.trim()}>{stale ? t.rerun : t.analyze}</button>
          <button type="button" className="btn btn-ghost" onClick={onClear} disabled={!text && !hasResult}>{t.clear}</button></>}
    </div>
    {void lang}
  </form>;
}

function Results({t, lang, a, stale, dim, onOpenCase, onRerun}: {t: T; lang: Lang; a: Analysis; stale: boolean; dim: boolean; onOpenCase: (id: string, key: string) => void; onRerun: () => void}) {
  const p = a.parse; const sum = summarize(a, lang);
  const excludedNoise = p.excluded.filter(x => x.reason !== 'negated');
  const negated = p.excluded.filter(x => x.reason === 'negated');
  const short = (s: string) => (s.length > 70 ? s.slice(0, 68) + '…' : s);
  return <section className="results" data-dim={dim || undefined} aria-labelledby="ja-results-title">
    {stale && <div className="state state-stale" role="status"><p>{t.stale}</p><button type="button" className="btn btn-ghost" onClick={onRerun}>{t.rerun}</button></div>}
    <h3 id="ja-results-title" tabIndex={-1}>{t.summary}</h3>
    <p className="small muted">{p.fallbackReason ? t.parsedBy[p.fallbackReason as keyof T['parsedBy']] : t.parsedBy[p.source]}</p>
    {p.truncated.chars && <p className="notice">{t.truncatedChars(p.truncated.originalLength, MAX_CHARS)}</p>}
    {p.truncated.requirementsDropped > 0 && <p className="notice">{t.truncatedReqs(p.truncated.requirementsDropped, MAX_REQUIREMENTS)}</p>}
    {excludedNoise.length > 0 && <p className="notice">{t.excludedInstr(excludedNoise.length)}</p>}
    {!p.requirements.length ? <p className="state state-none">{t.noReqs}</p>
      : !a.hasRelatedEvidence ? <div className="state state-none"><h4>{t.noneTitle}</h4><p>{t.noneBody}</p></div>
      : <div className="summary">{sum.map((s, i) => <p key={i}>{s}</p>)}</div>}
    {a.route.length > 0 && <>
      <h3>{t.route}</h3><p className="small muted">{t.routeNote}</p>
      <ol className="route">{a.route.map((s, i) => {
        const c = caseById.get(s.caseId)!;
        const reqs = a.matches.filter(m => s.requirementIds.includes(m.requirement.id));
        return <li key={s.caseId} style={{'--i': i} as React.CSSProperties}>
          <div><p className="case-period">{c.period}</p><p className="route-title">{c.title}</p>
            <p className="small">{t.routeReason(reqs.length)} {s.concepts.map(x => conceptById.get(x)?.[lang]).filter(Boolean).slice(0, 3).join(' · ')}</p>
            <p className="small muted" dir="auto">“{short(reqs[0].requirement.text)}”</p></div>
          <button type="button" className="btn btn-ghost" data-return-key={'route-' + s.caseId} onClick={() => onOpenCase(s.caseId, 'route-' + s.caseId)}>{t.openCase}<span className="sr-only">: {c.title}</span></button>
        </li>;
      })}</ol></>}
    {p.requirements.length > 0 && <>
      <h3>{t.reqs}</h3><p className="small muted">{t.reqsNote}</p>
      <ol className="reqs">{a.matches.map(m => <Req key={m.requirement.id} t={t} m={m} onOpenCase={onOpenCase}/>)}</ol></>}
    {negated.length > 0 && <div className="small muted"><p>{t.notRequired}</p><ul>{negated.map(x => <li key={x.start} dir="auto">{x.text}</li>)}</ul></div>}
  </section>;
}
function Req({t, m, onOpenCase}: {t: T; m: RequirementMatch; onOpenCase: (id: string, key: string) => void}) {
  const r = m.requirement;
  const lead = m.level === 'evidenced' ? t.explain.direct : m.level === 'draft' ? t.explain['only-draft']
    : m.note === 'only-related' ? t.explain['only-related'] : t.explain[m.note as keyof T['explain']] ?? t.explain.none;
  return <li className={'req req-' + m.level}>
    <p className="req-text" dir="auto">{r.text}</p>
    <p className="chips"><span className={'chip chip-' + m.level}>{t.level[m.level]}</span><span className="chip">{t.status[r.status]}</span><span className="chip">{t.category[r.category]}</span></p>
    <p className="small">{lead}</p>
    {m.level === 'related' && m.note !== 'only-related' && m.evidence.length > 0 && <p className="small muted">{t.relatedContext}</p>}
    {m.evidence.length > 0 && <ul className="snips">{m.evidence.map(ev => {const c = caseById.get(ev.caseId)!; const key = `req-${r.id}-${ev.id}`;
      return <li key={ev.id}><blockquote>{ev.text}</blockquote><p className="small"><span className="muted">{c.title}{ev.draft ? ' · ' + t.level.draft : ''}</span>{' '}
        <button type="button" className="link" data-return-key={key} onClick={() => onOpenCase(ev.caseId, key)}>{t.openCase}<span className="sr-only">: {c.title}</span></button></p></li>;})}</ul>}
  </li>;
}
