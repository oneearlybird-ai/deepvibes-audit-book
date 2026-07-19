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

## K:14 — Data Flow: Boundary-captured fields dropped by an intermediate carrier — downstream state documents values that can never arrive

**Statement.** The transport/decode layer captures a field from the wire, but an intermediate
carrier on the path to UI state — a typed error enum, a narrowed DTO, a mapper — has no slot for
it, so the assembling code hard-codes the field's resting value (nil / empty / default). The
downstream struct still declares and documents the field as live data; the UI branch or copy that
would render it can never trigger. The type system reports a working data flow that structurally
does not exist, and later consumers build on the documented lie instead of fixing the drop.

**Detect.** For each field in view-facing state, walk the provenance chain back to the boundary
that captures it. A constructor call passing a literal (nil, "", 0) into a field whose name/doc
promises wire data is the tell. Enum-tunneled flows (throw typed error → catch → rebuild state)
are the usual drop point: diff the enum case's associated values against what the thrower had in
hand at the throw site.

**False positives.** Fields deliberately deferred with the deferral stated at the drop site (not
only in the field's doc); privacy-motivated redaction where the omission is the point; fields
whose consumer is dead code being deleted in the same change.
