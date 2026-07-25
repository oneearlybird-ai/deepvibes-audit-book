---
section: J
title: "Frontend: Routing & Execution Boundary"
group: frontend
---

# [J] Frontend: Routing & Execution Boundary

## J:1 — Route Guards: Protected routes evaluating session state purely on the client-side UI, al…

Route Guards: Protected routes evaluating session state purely on the client-side UI, allowing a brief flash of protected content before redirecting.

## J:2 — Dynamic Routes: Unsanitized dynamic route parameters ([id]) utilized directly in API fet…

Dynamic Routes: Unsanitized dynamic route parameters ([id]) utilized directly in API fetches without validation (NoSQL / SSRF injection vectors).

## J:3 — Middleware: Performing heavy cryptography or synchronous operations in Edge Middleware,…

Middleware: Performing heavy cryptography or synchronous operations in Edge Middleware, breaching tight execution timeout limits.

## J:4 — Middleware: Unbounded URL Matching in Global Edge Functions

Middleware: Unbounded URL Matching in Global Edge Functions. Running heavy verification regex routines against every asset file (including static .png, .css, and .js modules) rather than excluding static directories, inflating Edge compute costs and introducing core routing latency.

## J:5 — Routing: Client-Side State Injection via History API Spoofing

Routing: Client-Side State Injection via History API Spoofing. Depending entirely on the unvalidated state values of the browser history stack (window.history.state) to determine application UI authorization status, allowing local script injection to unlock administrative layouts.

## J:6 — Open Redirects: redirect/returnTo/next params consumed unvalidated — phishing-grade redi…

Open Redirects: redirect/returnTo/next params consumed unvalidated — phishing-grade redirect chains off your own domain.

## J:7 — Server Actions: Next.js server actions missing internal auth/authz checks — protected on…

Server Actions: Next.js server actions missing internal auth/authz checks — protected only by which UI happens to render the form.

## J:8 — Layouts: Auth enforced in page components but not layouts/templates/route handlers — par…

Layouts: Auth enforced in page components but not layouts/templates/route handlers — partial rendering and prefetch leak protected data.

## J:9 — API Routes: Handlers not enforcing HTTP method — state mutations reachable via GET (CSRF…

API Routes: Handlers not enforcing HTTP method — state mutations reachable via GET (CSRF-able, prefetchable, cacheable).

## J:10 — Deep Links: Post-login redirect handling leaking query params/tokens to third-party dest…

Deep Links: Post-login redirect handling leaking query params/tokens to third-party destinations or losing CSRF context.

## J:11 - Framework special pages placed outside any root layout in a multi-root-layout app, so the error surface is itself an error

**Statement.** Frameworks that allow several sibling route groups to each own a root document have no
top-level layout, and their reserved special pages - not-found, error, global boundaries - then sit at
a path with no root layout to render into. Authors compensate by giving the special page its own
document element, which the framework rejects: the page fails to build or hard-errors on first
compile. The consequences are asymmetric and easy to under-rate. In production the intended surface
simply never renders, so every unmatched URL falls through to a bare framework default and the
application appears to have no handling for the case at all. In development the failure is worse than
the missing page: compiling the special route can poison the running server so that *every* route
returns a server error until restart, which reads as an unrelated environment problem. Because the
broken artefact is the error path, normal navigation and every functional test pass - the defect is
only reachable by doing the thing nobody scripts, which is requesting something that does not exist.

**Detect.** Establish the root-layout topology first: if there is no top-level layout and multiple
route groups each declare their own document, every reserved special file must live inside one of
those groups, with a catch-all in the group that owns unmatched paths. Then exercise it rather than
reading it - request a URL that matches nothing and assert the intended surface renders with the
correct status, in both a production build and a dev server, and include that request in the smoke
suite. Treat any special page that declares its own document element in a multi-root app as broken
until proven otherwise.

**False positives.** Apps with a genuine single top-level layout, where the root special page is
correct exactly as written; frameworks that synthesize a root document for special pages; deliberate
delegation of unmatched paths to an upstream proxy or CDN error page, verified end to end.
