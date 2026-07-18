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
