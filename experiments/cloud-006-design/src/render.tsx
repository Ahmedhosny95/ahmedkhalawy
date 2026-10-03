import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {App, titleFor} from './App';
// @ts-ignore plain JS seed module
import {routes as seo, schema} from '../../../src/search-data.js';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export function renderPage(path: string, css: string) {
  const d = seo[path];
  const ld = JSON.stringify(schema(path)).replace(/</g, '\\u003c');
  const preload = path === '/' ? '<link rel="preload" as="image" href="/assets/ahmed-portraits-20261001/ahmed-hero.webp" fetchpriority="high">'
    : path === '/about' ? '<link rel="preload" as="image" href="/assets/ahmed-portraits-20261001/ahmed-profile.webp">' : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titleFor(path))}</title><meta name="description" content="${esc(d.description)}">
<meta name="robots" content="noindex, nofollow"><!-- prototype: never index -->
<link rel="canonical" href="${d.url}"><meta name="theme-color" content="#10302a"><link rel="icon" href="/mark.svg" type="image/svg+xml">
<script type="application/ld+json">${ld}</script>
<link rel="preload" as="font" type="font/woff2" href="/fonts/manrope-latin-variable.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/lora-latin-variable.woff2" crossorigin>${preload}
<link rel="stylesheet" href="/${css}">
</head><body><div id="app">${renderToString(<App initialPath={path}/>)}</div>
<script type="module" src="/app.js"></script></body></html>
`;
}
