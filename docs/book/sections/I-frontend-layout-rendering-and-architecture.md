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
