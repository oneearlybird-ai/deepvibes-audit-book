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

## J:12 — A layout-level scroll or focus reset runs unconditionally on mount and defeats the browser's own fragment navigation

**Statement.** A shared layout runs a "start at the top on every load" side effect — `window.scrollTo(0, 0)`, a focus reset, a scroll-restoration override — in a mount effect, with no check for an incoming URL fragment. The browser has already begun scrolling to the `#anchor` target; the effect runs after hydration and wins. Every deep link into a section of the page silently lands at the top instead, including the site's own in-page navigation, table-of-contents links, and any externally shared anchor URL. Nothing errors and the target element exists, so link-checkers and route verifiers pass; the defect is only visible by watching where the viewport ends up.

**Detect.** Grep shared layouts and app-shell components for mount-time `scrollTo`, `scrollIntoView`, `scrollRestoration` assignment, or programmatic focus, and check each for a `location.hash` (or router-hash) guard. Then load each documented deep link and assert final `scrollY` is non-zero and the target is in view — asserting only that the element exists is what lets this ship. Smooth-scroll CSS widens the race and makes it intermittent, so test with scroll-behavior forced to auto.

**False positives.** Resets that explicitly early-return on a hash; single-page route transitions where scrolling to top is the intended behavior and no fragment is present; layouts that defer to the framework's own scroll restoration rather than overriding it.

## J:13 — The route-protection allowlist is hand-maintained with no mechanical cross-check against the route set

**Statement.** Edge middleware (or an equivalent gate) decides which paths require a session by testing them against a hand-typed list of path patterns, and nothing in CI compares that list to the routes that actually exist. The list drifts in both directions, and each direction hides the other: patterns survive for routes deleted long ago — making the list read as comprehensive and well-tended — while newly added routes ship unlisted and default to public. The unlisted route often carries its own comment declaring it an authenticated surface, because its author assumed classification happens somewhere else. Everything renders, nothing errors, and every listed route is correctly gated, so spot-checks pass; the exposure is only visible by enumerating the full route set and asking, for each route, which side of the gate it landed on. Dead helper functions that build paths to the deleted routes compound the illusion of coverage.

**Detect.** Enumerate every routable page from the filesystem or route manifest, strip framework grouping syntax, and classify each against the middleware's protection patterns. Three assertions, all mechanical: every route matches a protection pattern or an explicit, justified public list; every protection pattern matches at least one existing route; every public-list entry names an existing route. Wire the check into lint/CI so an unclassified new route fails the build. Flag path-helper functions whose return values match no route.

**False positives.** Deliberately public routes that merely look sensitive (marketing pages about security, token-gated pages like invite-accept whose credential arrives in the URL by design, OAuth return legs that must complete without a session); frameworks where protection is declared per-route in the page itself AND a verifier proves every page declares one.

## J:14 — One feature's sibling routes guard inconsistently — the unguarded sibling serves the feature with its backing absent

**Statement.** A feature exposes several routes (a content route, an editor/canvas host, a webhook, a preview endpoint) that should all be gated by the same "is this feature configured/enabled" check, but the check exists on only some of them. When the feature's backing config is absent, the guarded siblings correctly 404 while the orphan still mounts — serving the feature's shell, component registry, or editor canvas to anyone who requests it. The asymmetry usually dates from the routes being added at different times, and often survives because the orphan's comment defers to a compensating control ("middleware blocks framing for this path") that was never actually implemented — reading the comment substitutes for reading the gate. Testing the feature end-to-end never catches it, because end-to-end tests run with the feature configured.

**Detect.** For each optional/config-gated feature, enumerate EVERY route that belongs to it and diff their guard conditions — the set must be identical or each divergence justified in place. Exercise the routes with the feature's config absent and assert they all fail closed. Where a comment cites a compensating control, verify the control exists in live wiring (see OO:1) rather than accepting the citation.

**False positives.** Siblings with genuinely different gating needs (a public status endpoint beside private admin routes) where the divergence is documented; hosts that render a harmless static explainer with zero feature internals when unconfigured.

## J:15 — Curated navigation registries carry route strings with no existence cross-check, so retired routes rot into guided dead ends

**Statement.** Guided tours, onboarding checklists, command palettes, help menus, and similar
curated registries store navigation targets as string data — hrefs, often with query or tab
parameters encoding sub-surface state. Routes and their parameter vocabularies evolve under
refactors: a tab is retired, a surface moves to another path or host, a param is renamed. The
registry's strings keep pointing at the old shape, and nothing errors — the navigation "succeeds"
onto a default tab, a redirect, or a soft 404 — so the product's own guidance walks users into dead
ends. A registry verifier that validates a DIFFERENT axis (anchor presence, schema shape) deepens
the illusion: the check is green while the hrefs rot.

**Detect.** Enumerate every href/route/param string in each curated registry and resolve it against
the live route tree AND the live parameter vocabulary (does `?tab=x` still select an existing tab?).
If the registry has a mechanical verifier, confirm it validates every reference type the registry
actually carries — hrefs and params, not just anchors or shape. Route-retirement sweeps must treat
navigation registries as consumers of the route contract (the blast-radius rule).

**False positives.** Registries whose targets resolve through a typed routes module the compiler
checks; deliberately retained legacy deep links whose targets perform a sanctioned redirect to the
successor surface.
