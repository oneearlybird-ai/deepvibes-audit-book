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
