// Isolated build: bundles the UI to experiments/cloud-007-job-assistant/dist (gitignored). No root files are touched.
import {build} from 'esbuild';
import {cpSync, mkdirSync, rmSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here = resolve(dirname(fileURLToPath(import.meta.url)), '..'); const repo = resolve(here, '../..'); const out = join(here, 'dist');
rmSync(out, {recursive: true, force: true}); mkdirSync(join(out, 'fonts'), {recursive: true});
await build({entryPoints: [join(here, 'src/ui/main.tsx')], outfile: join(out, 'app.js'), bundle: true, minify: true, format: 'esm', target: 'es2022', jsx: 'automatic', logLevel: 'warning', define: {'process.env.NODE_ENV': '"production"'}});
cpSync(join(here, 'src/ui/styles.css'), join(out, 'styles.css'));
cpSync(join(here, 'index.html'), join(out, 'index.html'));
for (const f of ['manrope-latin-variable.woff2', 'lora-latin-variable.woff2', 'Manrope-OFL.txt', 'Lora-OFL.txt']) cpSync(join(repo, 'public/styles', f), join(out, 'fonts', f));
console.log('built', out.replace(repo + '/', ''));
