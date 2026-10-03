import * as React from 'react';
// Original decorative scene (CSS/SVG only): a perspective drafting floor, gauge rings and luminous "process" paths.
// It illustrates nothing factual and is not company evidence. aria-hidden throughout.
const PATHS = [
  'M 600 1060 C 760 880 900 760 1080 640 S 1400 360 1700 300',
  'M 760 1070 C 900 930 1100 860 1260 700 S 1500 520 1700 520',
  'M 820 1050 C 960 960 1120 900 1300 860 S 1560 820 1700 860',
];
export function SceneBack() {
  const floor: React.ReactElement[] = [];
  for (let i = -12; i <= 12; i++) floor.push(<line key={'v' + i} x1={800 + i * 26} y1={620} x2={800 + i * 210} y2={1000}/>);
  for (let j = 0; j < 9; j++) {const y = 620 + Math.pow(j / 8, 1.8) * 380; floor.push(<line key={'h' + j} x1={-100} y1={y} x2={1700} y2={y}/>);}
  return <svg className="scene scene-back" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="h-glow" cx="68%" cy="42%" r="60%"><stop offset="0" stopColor="var(--hero-bg-2)"/><stop offset=".55" stopColor="var(--hero-bg-1)"/><stop offset="1" stopColor="var(--hero-bg-0)"/></radialGradient>
      <linearGradient id="h-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#fff" stopOpacity=".9"/></linearGradient>
      <mask id="h-floor-mask"><rect x="-100" y="600" width="1800" height="400" fill="url(#h-floor)"/></mask>
      <linearGradient id="h-path" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="var(--hero-glow-2)" stopOpacity="0"/><stop offset=".35" stopColor="var(--hero-glow-2)"/><stop offset="1" stopColor="var(--hero-glow-1)" stopOpacity=".2"/></linearGradient>
      <filter id="h-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <rect width="1600" height="1000" fill="url(#h-glow)"/>
    <g className="floor" mask="url(#h-floor-mask)">{floor}</g>
    <g className="rings">{[120, 210, 300, 390].map((r, i) => <circle key={r} cx="1120" cy="430" r={r} style={{'--i': i} as React.CSSProperties}/>)}
      <path d="M 1120 40 V 820 M 730 430 H 1510"/></g>
    <g className="paths">{PATHS.slice(0, 2).map((d, i) => <g key={i}><path className="path-glow" d={d} filter="url(#h-blur)"/><path className="path-line" d={d}/>
      <path className="path-pulse" d={d} pathLength={1000} style={{'--i': i} as React.CSSProperties}/></g>)}</g>
  </svg>;
}
export function SceneFront() {
  return <svg className="scene scene-front" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <g className="paths"><path className="path-glow" d={PATHS[2]} filter="url(#h-blur)"/><path className="path-line" d={PATHS[2]}/>
      <path className="path-pulse" d={PATHS[2]} pathLength={1000} style={{'--i': 2} as React.CSSProperties}/></g>
    <g className="nodes">{[[1080, 640], [1260, 700], [1300, 860], [1442, 430]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`} style={{'--i': i} as React.CSSProperties}>
      <circle r="14" className="node-halo"/><circle r="3.5" className="node-dot"/></g>)}</g>
  </svg>;
}
