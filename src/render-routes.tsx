// Build-time SSR (harness only): produces first HTML for the three component routes.
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {PublicLayout} from './public-adapter';
import {pages} from './public-routes';
import {routes, schema} from './search-data.js';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export function renderRoute(path: string): string {
  const Page = pages[path], data = routes[path];
  const body = renderToString(<PublicLayout><Page/></PublicLayout>);
  const ld = JSON.stringify(schema(path)).replace(/</g, '\\u003c');
  const hero = path === '/' ? '<link rel="preload" as="image" href="/assets/ahmed-portraits-20261001/ahmed-hero.webp" fetchpriority="high">' : '';
  return `<!doctype html>
<html lang="en" data-public-prerender><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(data.title)}</title><meta name="description" content="${esc(data.description)}"><meta name="theme-color" content="#0b1717">
<link rel="icon" href="/mark.svg" type="image/svg+xml"><link data-public-search rel="canonical" href="${data.url}">
<meta data-public-search property="og:type" content="website"><meta data-public-search property="og:title" content="${esc(data.title)}">
<meta data-public-search property="og:description" content="${esc(data.description)}"><meta data-public-search property="og:url" content="${data.url}">
<meta data-public-search property="og:image" content="${data.image}"><meta data-public-search name="twitter:card" content="summary_large_image">
<script data-public-search type="application/ld+json">${ld}</script>
<link rel="stylesheet" href="/public-adapter.css"><link rel="stylesheet" href="/styles/public-optimization.css"><link rel="stylesheet" href="/styles/search.css">
<link rel="preload" as="font" type="font/woff2" href="/styles/manrope-latin-variable.woff2" crossorigin><link rel="preload" as="font" type="font/woff2" href="/styles/lora-latin-variable.woff2" crossorigin>${hero}
</head><body>
<div id="public-prerender" data-route="${path}">${body}</div><div id="root" inert aria-hidden="true"></div>
<script type="module" src="/prerender-handoff.js"></script>
</body></html>
`;
}
