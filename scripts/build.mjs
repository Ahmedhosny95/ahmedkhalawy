// Build: bundle client entry + handoff, SSR three routes, copy public/ and the static Contact fixture, make a TEST FIXTURE PDF.
import {build} from 'esbuild';
import {cpSync, mkdirSync, rmSync, writeFileSync, readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const out = 'dist/public', tmp = 'dist/.ssr.mjs';
rmSync('dist', {recursive: true, force: true});
cpSync('public', out, {recursive: true});
const common = {bundle: true, minify: true, target: 'es2022', logLevel: 'warning', jsx: 'automatic', define: {'process.env.NODE_ENV': '"production"'}};
await build({...common, entryPoints: {'public-entry': 'src/public-entry.tsx'}, outdir: out, format: 'esm', sourcemap: false});
await build({...common, entryPoints: {'prerender-handoff': 'src/prerender-handoff.js'}, outdir: out, format: 'esm', external: ['./public-entry.js']});
// Test-only module exposing metadata-runtime for the unit-level cleanup test.
await build({...common, entryPoints: {'metadata-runtime.test-entry': 'src/metadata-runtime.js'}, outdir: out, format: 'esm'});
await build({...common, minify: false, entryPoints: ['src/render-routes.tsx'], outfile: tmp, format: 'esm', platform: 'node', banner: {js: "import {createRequire} from 'module';const require=createRequire(import.meta.url);"}});
const {renderRoute} = await import(pathToFileURL(tmp).href);
for (const [route, file] of [['/', 'index.html'], ['/about', 'about/index.html'], ['/projects', 'projects/index.html']]) {
  const dest = `${out}/${file}`; mkdirSync(dest.replace(/\/[^/]*$/, ''), {recursive: true}); writeFileSync(dest, renderRoute(route));
}
rmSync(tmp);
// Static Contact fixture: content/metadata contract only (old utility-class shell, no executable scripts).
mkdirSync(`${out}/contact`, {recursive: true});
writeFileSync(`${out}/contact/index.html`, readFileSync('fixtures/public-html/contact.html'));
// Inert private entry fixture (REP/noindex contract only; no access control).
mkdirSync(`${out}/private`, {recursive: true});
writeFileSync(`${out}/private/index.html`, '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Private entry (test fixture)</title><meta name="robots" content="noindex, nofollow, nosnippet"></head><body><p>TEST FIXTURE: inert private-entry placeholder.</p></body></html>');
// Tiny clearly labelled PDF; NOT the real CV.
const objs = ['<</Type/Catalog/Pages 2 0 R>>', '<</Type/Pages/Kids[3 0 R]/Count 1>>', '<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>', null, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>'];
const stream = 'BT /F1 18 Tf 20 50 Td (TEST FIXTURE - not the real CV) Tj ET';
objs[3] = `<</Length ${stream.length}>>\nstream\n${stream}\nendstream`;
let pdf = '%PDF-1.4\n'; const offs = [];
objs.forEach((o, i) => {offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;});
const xref = pdf.length; pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
mkdirSync(`${out}/documents`, {recursive: true}); writeFileSync(`${out}/documents/ahmed-khalawy-cv.pdf`, pdf);
console.log('built', out);
