// Shared route metadata for SSR and client navigation (single source: the public seed's search-data).
// @ts-ignore plain JS seed module
import {routes as seo, schema} from '../../../src/search-data.js';
export type RouteMeta = {title: string; description: string; url: string; schema: unknown};
export function metaFor(path: string): RouteMeta {
  const d = (seo as Record<string, {title: string; description: string; url: string}>)[path] ?? seo['/'];
  return {title: d.title, description: d.description, url: d.url, schema: schema(path in seo ? path : '/')};
}
/** Client: update the single title/description/canonical/JSON-LD tags in place (never appends duplicates). */
export function applyMeta(path: string, doc: Document = document) {
  const m = metaFor(path);
  doc.title = m.title;
  const one = <T extends Element>(sel: string, make: () => T): T => {
    const all = doc.head.querySelectorAll<T>(sel);
    all.forEach((n, i) => {if (i > 0) n.remove();});
    return all[0] ?? doc.head.appendChild(make());
  };
  one<HTMLMetaElement>('meta[name="description"]', () => Object.assign(doc.createElement('meta'), {name: 'description'})).content = m.description;
  one<HTMLLinkElement>('link[rel="canonical"]', () => Object.assign(doc.createElement('link'), {rel: 'canonical'})).href = m.url;
  one<HTMLScriptElement>('script[type="application/ld+json"]', () => Object.assign(doc.createElement('script'), {type: 'application/ld+json'})).textContent = JSON.stringify(m.schema);
}
