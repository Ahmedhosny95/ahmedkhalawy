// Loopback-only static server for the prototype (reuses the root harness server unchanged).
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {start} from '../../../scripts/serve.mjs';
const s = await start(Number(process.env.PORT || 4317), join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'dist'));
console.log('http://127.0.0.1:' + s.address().port);
