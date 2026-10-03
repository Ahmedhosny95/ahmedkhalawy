// CLI smoke: `node scripts/serve.mjs` must actually start and answer on loopback (regression for the Windows entry-check bug).
import {spawn} from 'node:child_process';
import {mkdtempSync, mkdirSync, copyFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test, expect} from '@playwright/test';

// Linux proxy for the Windows failure: argv[1] != `file://`+import.meta.url whenever the path needs URL-encoding (spaces, drive letters, ...).
test('CLI entry check works from a path containing spaces/#', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'serve cli ')); const sub = join(dir, 'a b#c'); mkdirSync(sub);
  copyFileSync('scripts/serve.mjs', join(sub, 'serve.mjs'));
  const child = spawn(process.execPath, [join(sub, 'serve.mjs')], {env: {...process.env, PORT: '0'}, stdio: ['ignore', 'pipe', 'pipe']});
  try {
    const url: string = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('no URL printed')), 8000);
      child.stdout.on('data', d => {const m = String(d).match(/http:\/\/127\.0\.0\.1:\d+/); if (m) {clearTimeout(t); resolve(m[0]);}});
      child.on('exit', c => {clearTimeout(t); reject(new Error('exited early with code ' + c));});
    });
    expect((await fetch(url + '/')).status).toBe(200);
  } finally {child.kill(); rmSync(dir, {recursive: true, force: true});}
});

test('CLI starts its own loopback server, responds, and only that child is cleaned up', async () => {
  const child = spawn(process.execPath, ['scripts/serve.mjs'], {env: {...process.env, PORT: '0'}, stdio: ['ignore', 'pipe', 'pipe']});
  try {
    const url: string = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('server did not print URL (exit=' + child.exitCode + ')')), 8000);
      child.stdout.on('data', d => {const m = String(d).match(/http:\/\/127\.0\.0\.1:\d+/); if (m) {clearTimeout(t); resolve(m[0]);}});
      child.on('exit', c => {clearTimeout(t); reject(new Error('server exited early with code ' + c));});
    });
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    const ok = await fetch(url + '/about'); expect(ok.status).toBe(200); expect(await ok.text()).toContain('<h1');
    for (const bad of ['/..%5c..%5cpackage.json', '/%2e%2e/%2e%2e/package.json', '/api/x', '/private/x']) expect((await fetch(url + bad)).status, bad).toBe(404);
    expect((await fetch(url + '/', {method: 'POST', body: 'x'})).status).toBe(405);
    expect((await fetch(url + '/private')).headers.get('x-robots-tag')).toBe('noindex, nofollow, nosnippet');
  } finally {
    child.kill();
  }
  await new Promise(r => child.exitCode !== null || child.signalCode ? r(null) : child.on('exit', r));
});
