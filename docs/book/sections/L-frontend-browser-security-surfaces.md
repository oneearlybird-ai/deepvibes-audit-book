---
section: L
title: "Frontend: Browser Security Surfaces"
group: frontend
---

# [L] Frontend: Browser Security Surfaces

## L:1 — XSS: Rendering user-generated content via dangerouslySetInnerHTML without passing it thr…

XSS: Rendering user-generated content via dangerouslySetInnerHTML without passing it through strict sanitization libraries (e.g., DOMPurify).

## L:2 — CSP: Missing Content Security Policy headers, or overly permissive directives (allowing…

CSP: Missing Content Security Policy headers, or overly permissive directives (allowing unsafe-inline or unsafe-eval).

## L:3 — Cookies: Authentication session cookies lacking HttpOnly, Secure, and SameSite=Strict at…

Cookies: Authentication session cookies lacking HttpOnly, Secure, and SameSite=Strict attributes.

## L:4 — CSRF: Missing Anti-CSRF tokens on state-mutating requests when relying on cookie-based s…

CSRF: Missing Anti-CSRF tokens on state-mutating requests when relying on cookie-based sessions.

## L:5 — Injection: Frontend passing unsanitized user query strings directly into eval() or unesc…

Injection: Frontend passing unsanitized user query strings directly into eval() or unescaped JS functions.

## L:6 — XSS: Passing Raw Location Hashes (window.location.hash) Direct to DOM Elements

XSS: Passing Raw Location Hashes (window.location.hash) Direct to DOM Elements. Injecting unvalidated browser navigation coordinates or hash string data directly into target source views, creating clear DOM-based Cross-Site Scripting entry paths.

## L:7 — CORS: Configuring Wildcard Access Access-Control-Allow-Origin Headers

CORS: Configuring Wildcard Access Access-Control-Allow-Origin Headers. Returning * origins on API endpoints that simultaneously authenticate users via session cookies or custom authorization parameters, allowing external scripts to read personal cross-origin server payloads.

## L:8 — postMessage: Message handlers without strict event.origin validation — any embedding pag…

postMessage: Message handlers without strict event.origin validation — any embedding page can drive the app.

## L:9 — SRI: Third-party CDN scripts loaded without Subresource Integrity hashes

SRI: Third-party CDN scripts loaded without Subresource Integrity hashes.

## L:10 — Clickjacking: Missing frame-ancestors CSP / X-Frame-Options on authenticated pages

Clickjacking: Missing frame-ancestors CSP / X-Frame-Options on authenticated pages.

## L:11 — Tabnabbing: target="_blank" links without rel="noopener noreferrer"

Tabnabbing: target="_blank" links without rel="noopener noreferrer".

## L:12 — Token Exposure: OAuth tokens/reset codes in URL query/fragment persisted to history, ana…

Token Exposure: OAuth tokens/reset codes in URL query/fragment persisted to history, analytics, and Referer headers.

## L:13 — Trusted Types: Not enforced where supported, leaving DOM-XSS sinks (innerHTML, document.…

Trusted Types: Not enforced where supported, leaving DOM-XSS sinks (innerHTML, document.write) unguarded.

## L:14 — Source Maps: Production source maps publicly served, exposing original source and intern…

Source Maps: Production source maps publicly served, exposing original source and internal comments.

## L:15 — Error Reporting: Sentry/replay tooling capturing PII (inputs, cookies, request bodies) i…

Error Reporting: Sentry/replay tooling capturing PII (inputs, cookies, request bodies) in breadcrumbs by default.

## L:16 — Prototype Pollution: Client-side deep-merge of untrusted JSON into config objects (__pro…

Prototype Pollution: Client-side deep-merge of untrusted JSON into config objects (__proto__ keys unfiltered).
## L:17 - Masking: sensitive values visually obscured in the client while the plaintext remains in the DOM

**Statement.** A field the product presents as protected is delivered to the client in full and
"redacted" by a presentation-layer transform - glyph substitution that builds a masked string from
the real value, a CSS blur/filter over the true text, a non-selectable span, a truncated preview, or
an overlay element - so the plaintext is present in the document and reachable by anyone who can read
the page: devtools, view-source, the accessibility tree, textContent, a saved page, a screen reader,
or a browser extension. The control is a picture of a control; the data left the server unprotected
and no client-side transform can put it back.

**Detect.** For each field the UI marks as sensitive/redacted/hidden, read the component and answer
one question: does the real value reach the browser? If the masking function takes the true value as
input (mask(value), value.slice, a blur applied to an element whose text is the value), the plaintext
is in the DOM regardless of what renders. Confirm against the API response the component consumes -
inspect the server projection, not the component's props type. A reveal/unmask toggle implemented as
local component state, with no accompanying request, is proof the data was already present.

**False positives.** Values the server already truncated or tokenized before transport (last-four
digits, a display hint) where the full value never leaves the datastore; masking used purely as
shoulder-surfing ergonomics over data the viewer is authorized to see and could request anyway, and
which the product does not claim is access-controlled.

## L:18 - Reporting: violation-report channel declared with an endpoint group name nothing defines

**Statement.** A browser reporting pipeline (policy violations, deprecations, crashes, network
errors) is wired with a report-group reference that does not match any group the response actually
declares - a directive naming one group while the endpoint header defines another, a header the
policy expects that is never emitted, or an endpoint declaration on a different response than the
policy. The browser has nowhere to deliver reports, so it drops them silently. Both ends look
configured in review, the receiving collector is deployed and healthy, and its zero traffic reads as
"no violations" rather than "no delivery" - the failure mode is a monitoring channel that cannot
report its own absence.

**Detect.** Read the emitted response headers together, from a live response rather than the config
that is supposed to produce them, and match every group reference to a declared group by exact
string. Check the collector's actual receipt count over a period where violations were certain to
occur (a known-blocked inline script, a deliberate test violation); a deployed collector with
lifetime-zero receipts is the tell. Verify the policy and endpoint declarations ship on the same
responses - a header set on one route family and a policy on another never join up.

**False positives.** Channels intentionally report-only in a staging posture with the collector not
yet deployed (documented); user agents in the support matrix that implement only the older reporting
mechanism, where the modern group declaration is correctly inert alongside a working legacy
directive.

## L:19 - HSTS: transport pinning scoped to the apex while session cookies are parent-domain scoped

**Statement.** Strict transport security is asserted without includeSubDomains while the
authentication cookie is issued with a parent-domain Domain attribute, so every subdomain of the
cookie's scope - including hosts that do not exist, are parked, or are operated by another team -
remains reachable over plaintext on first contact. Cookie scope is broader than transport
protection: an attacker who can answer for any name under the cookie's domain over cleartext can set
or overwrite cookies for the parent domain (cookies ignore port and scheme for scoping), which turns
a subdomain-level network position into session fixation or forced logout against the protected
apex. The apex being perfectly pinned is irrelevant to the attack path.

**Detect.** Compare the Domain attribute at the session cookie's mint site against the HSTS
directive on the live response. If the cookie domain covers subdomains and the HSTS header lacks
includeSubDomains, flag. Enumerate the wildcard DNS and every delegated subdomain under that scope -
the exposure is the union of names the cookie covers, not the names the app serves. Check
preload-list membership separately: preload without includeSubDomains is not accepted, so a
preloaded apex is corroborating evidence the directive is present.

**False positives.** Host-only cookies (no Domain attribute) where subdomain plaintext cannot affect
the apex's cookie jar; domains whose subdomains are provably all under the same HSTS-asserting edge
with no delegation and no wildcard record; a documented, dated rollout where includeSubDomains is
deliberately staged behind an inventory of subdomains that must be migrated to TLS first.

## L:20 — A route-class-keyed CSP branch hands the per-request-nonce policy to a statically prerendered page, which then never hydrates

**Statement.** Middleware selects between two CSP script policies by route class: protected/dynamic routes get `'nonce-…' 'strict-dynamic'` (the nonce stamped per request), everything else gets the nonce-less fallback. The classification list and the framework's render mode are maintained independently, so a route can be BOTH protected (nonce branch) and statically prerendered — and a prerendered page's script tags carry no nonce, while `'strict-dynamic'` makes the browser ignore `'unsafe-inline'` and any host allowlist. Every script on the page is silently blocked: the HTML serves with a 200 and full server-rendered markup, but the page never hydrates — no event handlers, no polling, no redirects. Because the failure needs BOTH flags at once, it appears when either side changes alone (a route added to the protected list without forcing dynamic rendering, or a dynamic page becoming prerenderable after a refactor removes its request-time reads), and it evades tests that assert status codes or rendered text rather than executed script.

**Detect.** Cross the protection/classification list against the build's prerender manifest: any route in both is broken as shipped. Wire that intersection check into CI beside the route-policy check. At runtime, load each protected route with a valid session and assert an effect that only hydrated script can produce (a click handler firing, a poll request leaving). When adding a route to the protected list, require evidence of per-request rendering (`force-dynamic`, request-time cookie/header reads) in the same change.

**False positives.** Prerendered pages on the nonce-less branch (the fallback policy is designed for them); protected pages whose framework re-renders the document per request despite a static-looking source (verify via the build manifest, not the source); pages that genuinely ship zero scripts.

## L:21 — The OAuth popup's return URL is pinned to one origin while its opener lives on several, so the completion signal never delivers

**Statement.** A popup-based OAuth flow ends with the provider (or the backend callback) redirecting the popup to a fixed completion URL on ONE canonical origin, where a script posts the outcome to `window.opener` — targeting `location.origin` — and the opener filters incoming messages by `event.origin`. But the dashboard that opens the popup is served from several origins (per-tenant hosts, an admin subdomain), and the popup was opened with a RELATIVE path, so opener and completion page end up on different origins whenever the flow starts anywhere but the canonical host. Both ends then correctly drop the message — the postMessage targetOrigin check and the opener's origin filter each reject it — and the failure is invisible on the server: the token exchange succeeded, the integration row was written, only the UI signal died. The user sees a spinner that never clears next to a connection that actually exists, and single-origin dev/test setups can never reproduce it because every host collapses to one origin locally.

**Detect.** Enumerate every origin that can open the popup (host-based shells, admin consoles, per-tenant domains) and trace the completion redirect's target origin for each — any mismatch between opener origin and completion origin is a dropped signal. Check whether the return URL is a server-side constant while the opener host is request-dependent. Test the full flow from a non-canonical origin and assert the opener receives the completion event, not just that the server persisted the connection.

**False positives.** Flows that intentionally complete via a full-page redirect (no opener messaging); completion pages that derive the postMessage target from a server-carried, allowlist-validated opener origin; single-origin products where every opener genuinely shares the completion page's origin.

## L:22 — The credentialed API's CORS allowlist admits only production origins while the sanctioned dev/preview config points browsers at that same API

**Statement.** The API edge enforces an explicit CORS origin allowlist (correctly — no wildcard
with credentials), but the list names only the production web origins. The frontend's committed
development configuration (`.env.example`, preview defaults) points the BROWSER at that same
production API base, so every credentialed fetch from a dev or preview origin — localhost, CI
preview deployments — dies at preflight. Server-side rendering masks the breakage: SSR fetches are
server-to-server and bypass CORS entirely, so pages hydrate with server-fetched data and the
failure surfaces only in client-side actions — writes, mutations, interactive refetches — which
fail silently or degrade, and are then misdiagnosed as application bugs ("the toggle is broken")
rather than as the environment's origin being unsanctioned.

**Detect.** Diff the API's CORS allowlist against every origin the committed frontend
configurations can serve from (local dev hosts and ports, preview URL patterns). For each origin
not in the list, decide and DOCUMENT: either the origin is sanctioned (add it, or point that
environment at a non-production API base) or browser-side dev against the production API is
unsupported (state it where the env template lives). A live preflight probe per origin class beats
reading config: send OPTIONS with each Origin and assert the allow/deny matches the documented
posture.

**False positives.** Deliberate deny postures that are documented next to the dev setup
instructions AND paired with a working alternative (dev API stage, same-origin proxy); preview
environments that inject their own API base pointing at a preview API.
