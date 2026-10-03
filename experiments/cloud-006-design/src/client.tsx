import * as React from 'react';
import {hydrateRoot} from 'react-dom/client';
import {App} from './App';
const root = document.getElementById('app')!;
hydrateRoot(root, <App initialPath={location.pathname}/>, {
  onRecoverableError: (err) => console.error('hydration-recoverable-error', err),
});
document.documentElement.dataset.hydrated = 'true';
