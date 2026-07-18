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
