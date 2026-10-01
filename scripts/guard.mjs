// Single outbound/mutation guard for EVERY browser context (tests and perf). Interception only: blocked requests are
// aborted inside the browser before any network I/O, and recorded. Never contacts external targets.
export const BROWSER_ARGS = [
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', // hostnames cannot resolve
  '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1', // IP literals other than loopback go to a dead local proxy
];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export function classify(rawUrl, method = 'GET') {
  let u; try {u = new URL(rawUrl);} catch {return 'unparseable URL';}
  if (u.protocol === 'data:' || u.protocol === 'blob:' || u.protocol === 'about:') return null;
  if (u.hostname !== '127.0.0.1') return 'non-loopback host ' + u.hostname;
  if (!SAFE_METHODS.has(method.toUpperCase())) return 'mutation method ' + method;
  return null;
}
/** Installs the guard on a context; returns the live list of blocked entries. */
export async function installGuard(context, blocked = []) {
  await context.route('**/*', route => {
    const r = route.request(); const why = classify(r.url(), r.method());
    if (why) {blocked.push(`${r.method()} ${r.url()} (${why})`); return route.abort('blockedbyclient');}
    return route.continue();
  });
  await context.routeWebSocket(/.*/, ws => {blocked.push('WS ' + ws.url()); ws.close();});
  return blocked;
}
/**
 * Passive variant for performance runs. Playwright request interception (context.route) disables the HTTP cache, which would make
 * "repeat" loads meaningless, so perf relies on BROWSER_ARGS to block and only OBSERVES every attempted request here.
 */
export function observeGuard(context, blocked = []) {
  context.on('request', r => {const why = classify(r.url(), r.method()); if (why) blocked.push(`${r.method()} ${r.url()} (${why})`);});
  return blocked;
}
