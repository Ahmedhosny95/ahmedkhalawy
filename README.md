# Public portfolio source seed

This is the approved public content and visual layer of Ahmed Khalawy's r13 portfolio, prepared for a reproducible public-only development harness. It is not the complete production application and is not ready to install/build yet. The first cloud assignment is to create that harness, dependency lockfile and checks. No production changes or external account access are part of this repository.

## Included scope

- Editable Home, About and Work components; the existing content, selected skills and 22 publicly displayed recommendation excerpts.
- Exact public CSS, two approved personal portraits, three local licensed font faces, OFL licences and official font provenance.
- Public metadata/schema and first-paint handoff logic, plus four inert public HTML fixtures. Contact is a static content/metadata contract only.
- A deliberately small native-anchor React/layout/SEO adapter. It is an approximation of the public shell, with no authentication, API, contact submission or challenge implementation.

The recommendation fixture contains only fields actually rendered publicly. It omits source-export metadata, unrendered profile fields and invitation-specific selection logic. Visible third-party quotes are attributed personal recommendations, not official employer endorsements. Do not alter their meaning or attribution.

## Gaps the first task must handle

There is no package.json, lockfile, app entry, build setup, server or browser-test harness yet. Install pinned development dependencies in the cloud environment, create a public-only entry and route renderer, and return repeatable commands. `src/prerender-handoff.js` expects a built sibling `public-entry.js`; supply that entry as part of the harness. Pages import the local `Seo` and native-link adapter instead of the unavailable production runtime.

Serve `public/` as the static root. Fonts are adjacent to `/styles/public-optimization.css`, so its original relative font URLs work. The inert snapshots in `fixtures/public-html/` preserve approved content and head metadata, but have no executable scripts. Their old utility-class shell has no original compiled base CSS here; treat those as content/metadata fixtures, not visually faithful shell screenshots. The separate `PublicLayout` is explicitly a new approximation. Improve its useful parity if needed, but report differences rather than presenting adapter tests as production-shell tests.

The real CV is not included. The visible link/filename/public metadata are contracts only. Make a small PDF labelled TEST FIXTURE or intercept the local download. Do not fetch a real CV or certificate. Successful fixture downloads cannot prove production CV delivery. No contact backend, challenge or access-control behavior is available: disable real submissions and test neutral contract states only. Protected paths are out of scope; do not rebuild a private application.

## First cloud assignment

1. Inventory the supplied scope and gaps, then create a reproducible public-only local app with pinned dependencies, a lockfile, `npm ci`, `npm run build`, `npm run typecheck` and one documented browser-test command. Bind test servers to loopback. Block outbound requests during tests except dependency installation; never send messages or submit forms.
2. Preserve visible first HTML and truthful content. Test all four public routes with JavaScript enabled, disabled, delayed and failed; direct links, cross-page anchors, navigation/back behavior, title/canonical/schema consistency and protected-route metadata cleanup. Distinguish component tests from static Contact fixtures.
3. Test 375×812, 390×844, 768×1024 and 1440×900, keyboard navigation/skip link/menu/disclosures/focus and 200% zoom. Use Chromium and a WebKit smoke run. Add axe or equivalent automated accessibility checks. Browser emulation is not a physical-device or screen-reader assessment.
4. Measure fixed-profile cold/repeat Home and About loads, three runs each, recording median LCP/CLS, bytes and long tasks. Report actual font use and reduced-motion behavior. Measurements describe this adapter harness, not production field performance.
5. Reproduce defects before fixing them. Fix at most three material public layout/accessibility/loading problems, each with failing-before/passing-after evidence. If none is reproduced, deliver the harness and limitations without cosmetic churn. No new runtime library, claims, redesign, hidden text or artificial keyword pages.
6. Return a small diff, commands/results, screenshots, a machine-readable baseline, lockfile and known limitations. No deployment, merge, push, search submission, credential request or external-account action. A later owner review decides whether and how changes enter the production release.

## Factual boundaries

Ahmed Khalawy's visible Arabic name is احمد خلوي. His current title is Senior QA/QC Engineer at Yuksel Saudia, since March 2025. Eibla for Energy is previous employment ending March 2025. Management titles describe opportunities sought; histories remain distinct and ProDigi Consult stays a separate body of work. ISO 9001 Auditor / Lead Auditor course completion is distinct from professional auditor registration. Preserve current role/location/training wording, recommendation attribution and existing public facts. Do not invent metrics, employer endorsements or certifications.

`fixtures/public-contract.json` documents only public routing/REP expectations. Terminal entrance exceptions allow `/private` and `/private/` to expose existing noindex; query/deeper paths remain excluded. Tests must understand terminal `$` and longest-rule matching. Do not add or modify actual robots, server configuration, sitemap or ownership-verification files. This fixture is not access control.

## Asset rights and publication boundary

Font licences apply only to their named fonts. Portraits, personal content and attributed quotes are supplied for this approved portfolio task; no blanket open-source licence is granted by this seed. Use the existing portraits only. Do not generate additional employer/project evidence.

No full application bundle, backend/admin/private code, actual PDF, certificate, credentials, session data, ownership key, server configuration, deployment script or unrelated source tree is included. Keep this repository within that boundary. The seed inventory and source-hash review are maintained separately by the owner.
