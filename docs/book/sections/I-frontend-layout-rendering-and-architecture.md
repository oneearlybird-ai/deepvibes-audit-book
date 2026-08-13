---
section: I
title: "Frontend: Layout, Rendering & Architecture"
group: frontend
---

# [I] Frontend: Layout, Rendering & Architecture

## I:1 — SSR: Synchronous blocking database/API operations inside Server Components severely infl…

SSR: Synchronous blocking database/API operations inside Server Components severely inflating Time to First Byte (TTFB).

## I:2 — CSR/Hydration: Mismatches between server HTML and client initial state (e.g., using type…

CSR/Hydration: Mismatches between server HTML and client initial state (e.g., using typeof window !== 'undefined'), forcing full DOM tree re-renders.

## I:3 — RSC: React Server Components unintentionally leaking backend secrets/DB instances into t…

RSC: React Server Components unintentionally leaking backend secrets/DB instances into the client bundle due to missing "use server" boundaries.

## I:4 — Code Splitting: Monolithic JavaScript bundles sent on initial load instead of utilizing…

Code Splitting: Monolithic JavaScript bundles sent on initial load instead of utilizing dynamic imports / route-based lazy loading.

## I:5 — RSC: Unoptimized Waterfall Chains in Nested Layout Components

RSC: Unoptimized Waterfall Chains in Nested Layout Components. Arranging a series of nested React Server Components where each sequential layer independently awaits a unique asynchronous network call, causing additive render blocks and delaying user interaction.

## I:6 — SSR: Monolithic Static Regeneration Blocks on Large Dynamic Catalogs

SSR: Monolithic Static Regeneration Blocks on Large Dynamic Catalogs. Configuring long-lived Static Site Generation (SSG) with ISR without fallback mechanisms, forcing the engine to compile massive dynamic payload lists during builds and stalling deployment pipelines.

## I:7 — Architecture: Lack of Multi-Zone Hydration Error Boundaries

Architecture: Lack of Multi-Zone Hydration Error Boundaries. Failing to isolate unreliable components with dedicated client-side React Error Boundaries, allowing a single localized server-client rendering mismatch to crash the entire application viewport.

## I:8 — Next.js: Fetch/route caching semantics (force-cache vs no-store, revalidate) misapplied…

Next.js: Fetch/route caching semantics (force-cache vs no-store, revalidate) misapplied — authenticated data served stale or cross-user.

## I:9 — Streaming SSR: Missing Suspense boundaries — the slowest data dependency blocks first pa…

Streaming SSR: Missing Suspense boundaries — the slowest data dependency blocks first paint of the entire shell.

## I:10 — Fonts: Render-blocking webfonts loaded without next/font or font-display: swap, stalling…

Fonts: Render-blocking webfonts loaded without next/font or font-display: swap, stalling text paint.

## I:11 — Images: Full-resolution origin images bypassing next/image or CDN resizing — multi-MB LC…

Images: Full-resolution origin images bypassing next/image or CDN resizing — multi-MB LCP elements.

## I:12 — Bundles: Duplicate dependency versions (two Reacts, two date libraries) silently doublin…

Bundles: Duplicate dependency versions (two Reacts, two date libraries) silently doubling bundle weight.

## I:13 — Polyfills: Legacy-browser polyfills shipped to all users instead of differential loading

Polyfills: Legacy-browser polyfills shipped to all users instead of differential loading.

## I:14 — Scripts: Third-party analytics/chat widgets loaded synchronously in <head> instead of de…

Scripts: Third-party analytics/chat widgets loaded synchronously in <head> instead of deferred/lazy strategies.

## I:15 — i18n: Locale negotiation done client-side post-hydration, flashing wrong-language conten…

i18n: Locale negotiation done client-side post-hydration, flashing wrong-language content and shifting layout.

## I:16 — Fabricated live telemetry: ticking clocks, synthetic log lines, and "live" badges with no backing stream

**Statement.** The UI stages live-system evidence that no system produces: a pulsing "Live"
badge, a console of timestamped log lines whose timestamps come from a local `setInterval` and
whose content is static copy, a "syncing" indicator not wired to any connection state. Users
(and auditors, and support staff triaging with the customer's screen) trust telemetry that is
theater — and the ticker that animates it typically lives as root-level state, re-rendering the
entire heavy view at the tick frequency for a purely cosmetic readout.

**Detect.** For every live-implying affordance (pulse dots, "Live"/"Syncing" copy, streaming
consoles, ticking timestamps), trace the value to its source: a real transport (WebSocket/SSE
state, query `dataUpdatedAt`, server-sent events) or a local timer/hardcoded string. A
`setInterval(setState, 1000)` in a dashboard-scale component is both the fabrication tell and a
render-thrash defect in its own right. Honest equivalents: "last updated <real timestamp>",
connection badges bound to actual socket state.

**False positives.** Clocks that are the product (a world-clock widget); demo/preview modes
explicitly labeled as simulated; "live" indicators genuinely bound to transport state even when
the transport is currently idle.

## I:17 — Reachability: unmounted component trees receiving feature work, and deletions silently retiring capabilities

**Statement.** Component-reachability drift in two directions: (a) a UI subtree with zero renderers keeps receiving feature work — its defects "pass" review as if live and headline fixes ship dead on arrival; (b) deleting a surface's only renderer silently retires distinct capabilities that surface uniquely owned, while the change narrative claims full parity with a replacement that absorbed only part of the capability set.

**Detect.** For every component edited or deleted in a change, walk the import/render graph to a routed mount point (including dynamic-import strings). Edited-but-unreachable trees are findings. For deletions, diff the deleted component's outbound API calls/side effects against the claimed replacement's and require every uniquely-owned capability to be re-homed or explicitly retired. Barrel exports and passing typechecks are not reachability evidence.

**False positives.** Trees staged behind a feature flag or route landing in the same release train (the flag/route must exist in-repo); capabilities deliberately retired with the retirement stated in the change; component libraries published for external consumers.

## I:18 — Onboarding Copy: tours and help text promising affordances the anchored surface does not have

**Statement.** Guided-tour, onboarding, or help copy promises an affordance ("turn X on or off here", "drag to reorder", "click to upload") that does not exist on the anchored/spotlighted surface. Anchor-existence verifiers pass because the ELEMENT exists; the promised CONTROL does not — onboarding teaches an interaction the product cannot perform.

**Detect.** For each tour step/help string, extract the action verbs and map each to a concrete interactive element within the anchored container (switch, draggable, file input). The anchored subtree must contain a control matching the verb class. Also grep for affordance-implying props with no handler (cursor-pointer divs without onClick, "Click to …" copy with no input).

**False positives.** Copy naming an action one navigation hop away AND saying so; fallback variants written for when the surface is absent; marketing copy outside interactive guidance.

## I:19 — Verticals: industry-specific shell wholesale-transplants another vertical's control surface

**Statement.** A multi-vertical product ships an industry-specific shell (own domain, own data model, own agent/tool plane) whose settings/control surface is another vertical's panel transplanted wholesale — sometimes with only the headline renamed. The controls speak the foreign vertical's vocabulary (appointments, slots, patients) for concepts the vertical models differently (covers, table turns, orders), some knobs configure subsystems the vertical's runtime path never consults, and the vertical's OWN runtime parameters (jurisdictional rates, capacity policies, domain-specific after-hours semantics) have no control surface at all — often hardcoded server-side.

**Detect.** For each vertical shell, diff the control surface against the vertical's actual runtime consumers: (1) list every knob the panel writes and trace which runtime paths read it under THIS vertical's flow — unread knobs are transplant residue; (2) list every config value the vertical's runtime reads (grep its tools/handlers for constants and config lookups) and check each has a control — hardcoded constants that vary per business (tax rates, capacity, service windows) are the tell; (3) scan the panel's user-facing vocabulary against the vertical's domain terms.

**False positives.** Genuinely shared subsystems (voice selection, transfer rules, business hours) correctly reused across verticals; early-stage products with ONE live vertical where the generic panel is the only panel; controls whose vocabulary is vertical-neutral.

## I:20 — Spotlight overlays retain the previous target's geometry when the next target fails to resolve

**Statement.** A guided-tour/spotlight overlay resolves its target element per step and stores the highlight geometry, but the resolution path has no clearing branch: when the next step's target is absent (conditional tab not mounted, permission-gated panel, deleted element) or zero-sized, the overlay keeps the PREVIOUS step's rect — confidently highlighting an unrelated element while narrating the new step. Every registry/UI drift becomes user-visible mis-guidance instead of a graceful skip.

**Detect.** Read the overlay's target-resolution function: assert an explicit else-branch that clears/hides the highlight when the selector misses or the rect is zero-sized. Then enumerate registry targets that are conditionally rendered (behind tabs, permissions, feature flags, breakpoints) — each is a live reproduction path. A timeout-fallback that only swaps the TEXT while the stale rect persists still fails the check.

**False positives.** Engines that hide the spotlight and center the tooltip on unresolved targets; overlays that re-resolve on a raf/observer loop AND clear on miss.

## I:21 — Guided flows ignore viewer authorization

**Statement.** Product tours, setup guides, and checklists are authored as one fixed sequence with no capability model: steps anchor to surfaces (billing, team management, admin nav) that role-restricted or invited users cannot see, and the engine navigates to capability-gated tabs regardless of the viewer's grants. Restricted users get spotlights on missing elements, instructions for actions they cannot perform, and setup steps that are another role's job — the guide teaches them a product they don't have.

**Detect.** Diff the guide registry's step anchors/targets against the permission gates on those surfaces (route guards, policy/useCan checks, conditional nav). A registry schema with no capability/audience field on steps is structurally guilty; confirm with one restricted-role walkthrough. Check invited-user onboarding specifically: setup-type steps shown to non-admin invitees are the tell.

**False positives.** Registries whose steps all live within the product's universally-granted core; engines that filter steps through the same authorization snapshot the UI itself renders from.

## I:22 — Identity-dependent chrome resolved client-side on a statically-cached page, painting a status placeholder as the first frame

**Statement.** A page is statically prerendered (SSG/ISR/CDN-cached) — correct for its cacheability — so no server render can resolve who the viewer is. The identity-dependent chrome (header auth controls, "upgrade" banners, entitlement badges) is therefore left to a client provider that boots in a `loading` state, and the loading branch renders a *status message* — "Checking session…", "Loading account…", a spinner — as the first painted frame. Every visitor, signed in or not, reads a machine's internal state before reading the product, and because the placeholder's box differs from the resolved control set it also shifts layout. The tell that this is an oversight rather than a design is that the same codebase usually already solves it correctly on its authenticated shell, where a server-side gate resolves the session and hydrates the provider with it; the static tree simply never got wired to an equivalent.

**Detect.** For each statically-rendered route, find the auth/entitlement provider mounted above it and check whether the root passes it a server-resolved initial state. If it defaults to `loading`, read the consumer's loading branch: rendering copy that describes the system's own progress (rather than the product's default logged-out state, or a same-shaped reservation) is the finding. Confirm by loading the route and recording the header's text transitions and any layout-shift entries. Also count the auth requests a cookieless visitor triggers — a boot that always fetches, and retries on the guaranteed 401, bills every anonymous landing for round trips that cannot succeed.

**False positives.** Server-rendered or per-request-dynamic routes that genuinely resolve identity before first byte; skeletons that reserve the exact resolved geometry and carry no status copy; deliberately client-only surfaces (already behind an auth gate) where no unauthenticated first paint exists.

## I:23 — Post-hydration guard chains serialize independent bootstrap fetches the server could have resolved in parallel

**Statement.** A gated surface (admin console, per-tenant dashboard) boots as a chain of client-side guard components, each holding the entire subtree on a skeleton until its own fetch resolves: hydrate → permissions check → THEN the content mounts → THEN the content's data hooks fire — even though none of those requests depends on another's response, only on the session, which the server already validated while rendering the page. Each link costs a full browser↔API round trip on the LCP path, and the chain grows silently: every new guard or config-keyed query adds a serial hop (a fetched config value that re-keys date- or locale-scoped queries adds a refetch churn on top). The server, sitting same-region with the API and holding the same session cookie, could resolve the whole set concurrently during the render and hand the client a warm cache — turning N serial client round trips into one parallel server hop.

**Detect.** Record the gated surface's cold load and count serial request waves after HTML arrival; more than one wave of session-dependent-only requests is the smell. Trace each guard/hook: if its request needs nothing but the session (or another response already available server-side), it is a candidate for server-side parallel prefetch with cache dehydration — seeded through the SAME query keys and mapping functions the client hooks use (a hand-copied key or transform drifts and silently wastes the prefetch; keep one fetcher-injected implementation). Confirm seeded state actually suppresses the client fetch (stale-time honored, guard reads the seed).

**False positives.** Requests that genuinely depend on client-only state (viewport, device, user gesture); prefetches deliberately skipped to keep TTFB low on slow upstreams — valid only when the client path is the measured faster option; surfaces where the guard's answer changes what to fetch next (a real dependency, not a chain habit).

## I:24 — The dialog makes its whole card the scroll container, so dismiss and commit controls scroll out of reach on short viewports

**Statement.** A dialog is built as one bounded box — a maximum height plus overflow scrolling on the
card itself — with title, dismiss control, body, and action row as ordinary flow children. On a tall
viewport nothing looks wrong. On a short one — a handset in landscape, a laptop with a software
keyboard raised, any browser whose dynamic toolbars shrink the visual viewport — that single scroll
container carries EVERY child, so the dismiss control scrolls off the top and the primary and cancel
actions scroll off the bottom. The user is inside a modal with both the way out and the way forward
out of view; and because the backdrop typically dismisses only on an outside click that the enlarged
card now covers, the surface can become an actual trap rather than merely an awkward one. It stays
invisible in development because a desktop viewport is never short enough, and invisible to snapshot
suites, which capture at a fixed generous size. A companion defect almost always ships alongside:
the document behind the dialog is not scroll-locked, so a gesture that reaches the end of the card's
scroll continues on the page underneath and the dialog appears to drift over moving content.

**Detect.** For each dialog, identify which element owns the scroll and enumerate which children sit
inside it. The correct decomposition is three regions — a non-shrinking header, one scrolling body,
a non-shrinking action row — so that only the body ever moves. Test by reducing viewport HEIGHT,
not width; height is the axis that exposes this, and roughly 400 logical pixels or less is where it
appears. While there, confirm the background is scroll-locked for the dialog's lifetime and that
interactive targets meet the platform's minimum touch dimension, since the same layout pass that
produces a whole-card scroller usually also produces undersized controls.

**False positives.** Non-modal sheets and popovers intentionally scrolled with the page; dialogs
whose content provably cannot exceed the smallest supported viewport, where the extra structure buys
nothing; full-screen mobile presentations that deliberately scroll as a page and carry a persistent
platform-level dismiss affordance.

## I:25 — The client synthesizes the series the API never returned, so interpolation between two real endpoints is rendered as measurement

**Statement.** A chart needs a series and the endpoint behind it returns only coarse aggregates — a
month total, a current value, a pair of period sums. Rather than widen the endpoint, the client
manufactures the missing granularity: it divides a total evenly across days, interpolates between
two known points, applies a growth curve, or seeds a plausible shape from a single number. The
resulting chart is indistinguishable from a real one — axes, tooltips, hover readouts, sometimes a
trend annotation — and every point a viewer reads off it is a number no system ever recorded. This
is not a rendering shortcut; it is a truth defect at the presentation layer, and it is more damaging
than an empty chart because an empty chart prompts someone to fix the pipeline while a fabricated
one closes the question. It also survives review easily: the synthesis lives in a formatting or
adapter helper, reads as arithmetic, and the component that renders it is honest about nothing more
than the props it was given. The correct repair is upstream every time — return the series wide from
the source of truth, and the client's synthesis has nothing left to do and can be deleted.

**Detect.** Trace every chart's data from the rendering component back to the network response and
require that each plotted point correspond to a value present in the payload. Any arithmetic between
the fetch and the plot that INCREASES the number of points — dividing a total by a day count,
filling a range, generating labels with derived values, curve-fitting — is the defect. The clearest
signature is a component that receives one or two numbers and renders many points. Compare the
rendered series against the source records for the same range; divergence beyond rounding confirms
it. Check the endpoint's own shape as part of the finding: a narrow payload is the cause, and a fix
that only removes the client synthesis leaves an empty chart rather than a true one.

**False positives.** Deliberate visual smoothing between real datapoints where the underlying points
are still the plotted values and the interpolation is only the stroke geometry; explicitly labelled
projections or forecasts rendered in a distinct style with the projection stated in the interface;
placeholder or skeleton series shown while loading, provided they are visually marked as such and
never carry readable values; sparklines documented as illustrative and carrying no axis or readout.
