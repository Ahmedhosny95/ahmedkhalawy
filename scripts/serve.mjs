// Loopback-only static server for dist/public. Never binds a non-loopback address; POST is refused (no submissions).
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.json': 'application/json', '.txt': 'text/plain'};
export function start(port = Number(process.env.PORT || 4173), root = 'dist/public') {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method !== 'GET' && req.method !== 'HEAD') {res.writeHead(405, {allow: 'GET, HEAD'}); return res.end('Method not allowed (harness: no submissions)');}
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (/^\/(admin|review|api)(\/|$)/.test(p) || (p.startsWith('/private') && p !== '/private' && p !== '/private/')) {res.writeHead(404); return res.end('Not found');}
    let file = join(root, p);
    try {if ((await stat(file)).isDirectory()) file = join(file, 'index.html');} catch {if (!extname(file)) file = join(file, 'index.html');}
    try {
      const body = await readFile(file), h = {'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'public, max-age=0, must-revalidate'};
      if (p.startsWith('/private')) h['x-robots-tag'] = 'noindex, nofollow, nosnippet';
      if (extname(file) === '.pdf') h['content-disposition'] = 'attachment; filename="Ahmed-Khalawy-Public-CV.pdf"';
      if (/\.(woff2|webp|svg)$/.test(file)) h['cache-control'] = 'public, max-age=31536000, immutable';
      res.writeHead(200, h); res.end(req.method === 'HEAD' ? undefined : body);
    } catch {res.writeHead(404); res.end('Not found');}
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r(server)));
}
if (import.meta.url === `file://${process.argv[1]}`) {const s = await start(); console.log('http://127.0.0.1:' + s.address().port);}
