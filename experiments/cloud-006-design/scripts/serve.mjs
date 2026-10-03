// Loopback-only server for the prototype, reusing the harness server (scripts/serve.mjs) unchanged.
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {start} from '../../../scripts/serve.mjs';
const root = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'dist');
const s = await start(Number(process.env.PORT || 4316), root);
console.log('http://127.0.0.1:' + s.address().port);
