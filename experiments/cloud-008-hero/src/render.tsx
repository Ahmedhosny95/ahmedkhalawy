import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {Page} from './Page';
export const renderPage = (css: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Hero prototype — Ahmed Khalawy (cloud-008)</title><meta name="theme-color" content="#0a1a17">
<link rel="icon" href="/mark.svg" type="image/svg+xml">
<link rel="preload" as="image" href="/assets/ahmed-portraits-20261001/ahmed-hero.webp" fetchpriority="high">
<link rel="preload" as="font" type="font/woff2" href="/fonts/manrope-latin-variable.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/lora-latin-variable.woff2" crossorigin>
<link rel="stylesheet" href="/${css}">
</head><body><div id="app">${renderToString(<Page/>)}</div><script type="module" src="/app.js"></script></body></html>
`;
