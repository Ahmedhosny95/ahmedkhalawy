// Harness entry (new, not production source). Mounts the matching native-link page into #root;
// src/prerender-handoff.js removes the SSR shell once the matching <h1> and <main> exist.
import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {PublicLayout} from './public-adapter';
import {pages} from './public-routes';

const path = window.location.pathname.replace(/\/$/, '') || '/';
const Page = pages[path];
const root = document.getElementById('root');
if (Page && root) createRoot(root).render(<PublicLayout><Page/></PublicLayout>);
