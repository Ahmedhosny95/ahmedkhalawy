import * as React from 'react';
import {hydrateRoot} from 'react-dom/client';
import {Page} from './Page';
hydrateRoot(document.getElementById('app')!, <Page/>, {onRecoverableError: e => console.error('hydration-recoverable-error', e)});
document.documentElement.dataset.hydrated = 'true';
