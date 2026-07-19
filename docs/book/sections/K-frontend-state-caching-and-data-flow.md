---
section: K
title: "Frontend: State, Caching & Data Flow"
group: frontend
---

# [K] Frontend: State, Caching & Data Flow

## K:1 — Caching: Aggressive client-side caching (TanStack Query / SWR) held without proper inval…

Caching: Aggressive client-side caching (TanStack Query / SWR) held without proper invalidation hooks post-mutation, serving stale data to the user.

## K:2 — State Bloat: Dumping massive API payloads into global state managers (Redux/Zustand) ins…

State Bloat: Dumping massive API payloads into global state managers (Redux/Zustand) instead of utilizing local component caching and pagination.

## K:3 — Storage: Persisting sensitive user PII or JWT access tokens in plain localStorage or ses…

Storage: Persisting sensitive user PII or JWT access tokens in plain localStorage or sessionStorage instead of memory or HttpOnly cookies.

## K:4 — Caching: Missing Key Mutation Invalidations across Deduplicated Queries

Caching: Missing Key Mutation Invalidations across Deduplicated Queries. Mutating an entity on the backend while leaving alternative query structures (e.g., paginated lists vs individual detail items) unchanged in local memory, causing conflicting, asynchronous data states across application views.

## K:5 — State: Blind Component Prop-Drilling of Fragile Object Instances

State: Blind Component Prop-Drilling of Fragile Object Instances. Passing full server-side database rows down through multiple layers of presentation components instead of scoping small, specific primitive types, forcing massive child re-render trees on minor data updates.

## K:6 — Optimistic Updates: UI mutated optimistically with no rollback on mutation failure — pha…

Optimistic Updates: UI mutated optimistically with no rollback on mutation failure — phantom success states.

## K:7 — Identity Switch: Login/logout/tenant-switch without a full query-cache reset — the previ…

Identity Switch: Login/logout/tenant-switch without a full query-cache reset — the previous user's data flashes to the next user.

## K:8 — Polling: Fixed-interval refetch loops where event-driven invalidation belongs, hammering…

Polling: Fixed-interval refetch loops where event-driven invalidation belongs, hammering APIs and draining batteries.

## K:9 — Races: Out-of-order responses overwriting newer state — no AbortController or request-ve…

Races: Out-of-order responses overwriting newer state — no AbortController or request-versioning on rapid-fire queries.

## K:10 — WebSockets: Reconnect logic that doesn't resubscribe or resync missed events — silently…

WebSockets: Reconnect logic that doesn't resubscribe or resync missed events — silently stale live views.

## K:11 — Derived State: Computable values stored in state alongside their sources, inevitably div…

Derived State: Computable values stored in state alongside their sources, inevitably diverging.

## K:12 — Forms: Dirty-state navigation without guards — users silently lose long-form input

Forms: Dirty-state navigation without guards — users silently lose long-form input.

## K:13 — Staged Actions: Submit payloads re-derived from an evictable cache instead of the captured selection

**Statement.** The UI stages items for a deferred action (a queue, cart, tray, or multi-select) but
at submit time rebuilds the payload by looking the staged ids up in a live windowed/paginated/
evictable cache (`cache.filter(staged.has(id))`). Any item evicted between staging and submit —
window recentering, pagination, cache GC, refetch narrowing — silently drops out of the request.
Worse, phase bookkeeping keyed to the staged list then marks the never-sent items as in-flight or
succeeded, because the "mark processed" pass iterates the staged set rather than the acknowledged
response. The user believes the action covered everything they queued; part of it never happened.

**Detect.** Find submit handlers that intersect a staged-id set with a live query cache or windowed
list to build the request body. Ask: can the cache evict or re-window while staging persists
(navigation-recentered fetch windows, page changes, tenant/profile switches)? Then check the
post-submit bookkeeping: is "sent/succeeded" derived from the server's acknowledgment
(started/skipped lists) or from the staged set? A staged snapshot that already carries everything
the request needs (ids, display fields) makes the cache lookup pure display — that is the fix.

**False positives.** Caches that are append-only for the staging session (nothing evicts while the
tray lives); staging that stores the full payload and uses the cache only for cosmetic refresh;
submit paths that reconcile against the server response and explicitly surface unmatched staged
items as failures.
