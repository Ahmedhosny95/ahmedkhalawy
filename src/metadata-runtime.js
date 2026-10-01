// Only the four approved public routes receive Person/WebSite structured data.
import { routes, schema } from './search-data.js';
export function syncSearchMetadata(path, doc = document) {
  const normalized = path === '/' ? '/' : path.replace(/\/$/, '');
  const data = routes[normalized];
  const clear = () => doc.querySelectorAll('[data-public-search]').forEach(node => node.remove());
  clear();
  if (!data) {
    // Remove the public shell's metadata during SPA navigation out of the allowlist.
    doc.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"]').forEach(node => node.remove());
    if (/^\/(admin|private|review|api)(\/|$)/.test(normalized)) add('meta', { name: 'robots', content: 'noindex, nofollow, nosnippet' });
    return;
  }
  doc.title = data.title;
  let description = doc.querySelector('meta[name="description"]');
  if (!description) { description = doc.createElement('meta'); description.name = 'description'; doc.head.append(description); }
  description.content = data.description;
  doc.querySelectorAll('link[rel="canonical"],meta[property^="og:"],meta[name^="twitter:"],meta[name="robots"]').forEach(node => node.remove());
  add('link', { rel: 'canonical', href: data.url });
  for (const [property, content] of Object.entries({ 'og:type': 'website', 'og:title': data.title, 'og:description': data.description, 'og:url': data.url, 'og:image': data.image })) add('meta', { property, content });
  add('meta', { name: 'twitter:card', content: 'summary_large_image' });
  add('script', { type: 'application/ld+json' }, JSON.stringify(schema(normalized)));
  function add(tag, attrs, value) { const node = doc.createElement(tag); node.setAttribute('data-public-search', ''); for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, val); if (value) node.textContent = value; doc.head.append(node); return node; }
}
