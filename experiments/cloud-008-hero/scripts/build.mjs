// Isolated build: SSR first HTML + hydrating client bundle -> experiments/cloud-008-hero/dist (gitignored).
import {build} from 'esbuild';
import {cpSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = resolve(dirname(fileURLToPath(import.meta.url)), '..'); const repo = resolve(here, '../..'); const out = join(here, 'dist');
rmSync(out, {recursive: true, force: true}); mkdirSync(join(out, 'fonts'), {recursive: true});
const common = {bundle: true, target: 'es2022', jsx: 'automatic', logLevel: 'warning', absWorkingDir: here, define: {'process.env.NODE_ENV': '"production"'}};
await build({...common, minify: true, entryPoints: ['src/client.tsx'], outfile: join(out, 'app.js'), format: 'esm'});
const css = ['tokens.css', 'hero.css', 'page.css'].map(f => readFileSync(join(here, 'src', f), 'utf8')).join('\n');
const cssName = `hero.${createHash('sha256').update(css).digest('hex').slice(0, 10)}.css`; writeFileSync(join(out, cssName), css);
const ssr = join(out, '.ssr.mjs');
await build({...common, entryPoints: ['src/render.tsx'], outfile: ssr, format: 'esm', platform: 'node', banner: {js: "import {createRequire} from 'module';const require=createRequire(import.meta.url);"}});
const {renderPage} = await import(pathToFileURL(ssr).href); writeFileSync(join(out, 'index.html'), renderPage(cssName)); rmSync(ssr);
cpSync(join(repo, 'public/assets/ahmed-portraits-20261001/ahmed-hero.webp'), join(out, 'assets/ahmed-portraits-20261001/ahmed-hero.webp'));
cpSync(join(repo, 'public/mark.svg'), join(out, 'mark.svg'));
for (const f of ['manrope-latin-variable.woff2', 'lora-latin-variable.woff2', 'Manrope-OFL.txt', 'Lora-OFL.txt']) cpSync(join(repo, 'public/styles', f), join(out, 'fonts', f));
console.log('built', out.replace(repo + '/', ''));
