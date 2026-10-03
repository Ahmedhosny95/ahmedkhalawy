// Isolated build for the cloud-006 prototype. Reads seed facts/assets read-only; writes only experiments/cloud-006-design/dist.
import {build} from 'esbuild';
import {cpSync, mkdirSync, rmSync, writeFileSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(here, '../..');
const out = join(here, 'dist');
rmSync(out, {recursive: true, force: true}); mkdirSync(out, {recursive: true});
const common = {bundle: true, target: 'es2022', jsx: 'automatic', logLevel: 'warning', absWorkingDir: here, define: {'process.env.NODE_ENV': '"production"'}};
await build({...common, minify: true, entryPoints: ['src/client.tsx'], outfile: join(out, 'app.js'), format: 'esm'});
const css = readFileSync(join(here, 'src/styles.css'));
const cssName = `styles.${createHash('sha256').update(css).digest('hex').slice(0, 10)}.css`;
writeFileSync(join(out, cssName), css);
const ssr = join(here, 'dist/.ssr.mjs');
await build({...common, entryPoints: ['src/render.tsx'], outfile: ssr, format: 'esm', platform: 'node',
  banner: {js: "import {createRequire} from 'module';const require=createRequire(import.meta.url);"}});
const {renderPage} = await import(pathToFileURL(ssr).href);
for (const [route, file] of [['/', 'index.html'], ['/about', 'about/index.html'], ['/projects', 'projects/index.html'], ['/contact', 'contact/index.html']]) {
  const dest = join(out, file); mkdirSync(dirname(dest), {recursive: true}); writeFileSync(dest, renderPage(route, cssName));
}
rmSync(ssr);
// Public assets only (copied, never modified): portraits, mark, three font faces + their OFL licences.
cpSync(join(repo, 'public/assets/ahmed-portraits-20261001'), join(out, 'assets/ahmed-portraits-20261001'), {recursive: true});
cpSync(join(repo, 'public/mark.svg'), join(out, 'mark.svg'));
mkdirSync(join(out, 'fonts'));
for (const f of ['manrope-latin-variable.woff2', 'lora-latin-variable.woff2', 'lora-latin-italic-variable.woff2', 'Lora-OFL.txt', 'Manrope-OFL.txt']) cpSync(join(repo, 'public/styles', f), join(out, 'fonts', f));
cpSync(join(here, 'cv-specimen'), join(out, 'cv-specimen'), {recursive: true});
console.log('built', out);
