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

## K:15 — Ranges: One labeled time-range selector, multiple data lanes with different window vocabularies — the narrower lane silently coerces

**Statement.** A view offers a single range selector (24H/7D/30D/12M…) feeding multiple data
lanes (different hooks, endpoints, or query languages). One lane supports the full vocabulary;
another supports a subset, and the mapping table silently coerces the unsupported range to the
nearest supported window. The view then renders mixed windows under one label: some tiles show
the selected range, others show the coerced one, and nothing on screen discloses the difference.
Users read cross-lane comparisons (a 12-month health score against a 30-day call volume) as if
they shared a denominator.

**Detect.** Find the range-to-parameter mapping for EVERY data lane a ranged view consumes; any
many-to-one entry in one lane's map while a sibling lane passes the range through is the defect.
Trace each lane to its backend to confirm the actual supported vocabulary — the client type
often already admits the truth (`type Window = "day" | "week" | "month"` behind a 12M button).

**False positives.** Coercions disclosed in the UI at the point of display ("showing last 30
days"); lanes whose data genuinely has no longer history AND whose tiles say so; selectors that
disable/hide ranges a lane cannot honor.

## K:16 — Event Bus: in-process posts with zero live subscribers presented as a working routing contract

**Statement.** In-process event-bus posts (NotificationCenter, EventEmitter, custom pub/sub) that no live code subscribes to. The posting side reads as a working routing contract (navigate, refresh, invalidate) and reviews certify it as "the live path" because the publisher exists — but every post terminates in the void, so the claimed behavior (push-tap navigation, refresh fan-out) never happens.

**Detect.** For each posted event name/topic, grep for at least one subscriber (addObserver/onReceive/publisher(for:)/on(...)) outside the posting file. Zero subscribers on a name whose call sites claim behavior is a hit. Prioritize names blessed in recent dead-code-deletion or consolidation commits — the enshrined survivor is often as dead as what was deleted.

**False positives.** Names consumed via reflection or stringly-typed lookup tables the grep misses (verify the table); extension points intentionally published for plugins/tests with that contract documented at the post site.

## K:17 — Placeholders: keep-previous-data bridging across scope-carrying query-key changes

**Statement.** Queries embed a scope id (tenant, profile, business unit) in their key and use keep-previous-data placeholders for smooth in-scope transitions. When the scope id itself can change without a cache teardown or document unload, the placeholder bridges ACROSS scopes: the old scope's rows render under the new scope's label until the refetch lands. Comments asserting "switches always unmount/wipe" rot as new in-place re-scope lanes (background refresh, cross-tab sync, resume-after-reauth) are added.

**Detect.** For every query using keepPreviousData/placeholderData whose key contains a scope id, enumerate ALL code paths that can change that id at runtime — not just the blessed switch flow. Each path must either tear down the scoped cache entries (removeQueries/clear/reload) or the placeholder must be gated to same-scope key changes only.

**False positives.** Scope ids that provably cannot change without a full document navigation; placeholder functions returning undefined when the scope segment differs; data identical across scopes by construction.

## K:18 — Filters: UI presents conjunction, API honors one parameter via else-if

**Statement.** Multi-parameter filter contracts where the UI renders composable controls (status AND date, search AND category) but the server honors exactly one parameter via if/else-if branching. The losing control stays interactive, refetches under a new cache key, and silently returns data that ignores it — users read conjunction semantics into disjunction results, and client-side stats recompute from the mis-filtered list.

**Detect.** For each list endpoint accepting multiple filter params, read the handler's branch structure: any else-if between params the client can send together is the defect. Cross-check every UI rendering both controls simultaneously; a query key including the ignored param is the tell that the client believes in the conjunction.

**False positives.** Controls mutually exclusive in the UI (selecting one visibly resets/disables the other); servers that reject the combination with a 400 the client surfaces.

## K:19 — Aggregates: client-computed totals over a server-truncated page presented as period totals

**Statement.** Client-side aggregates (counts, sums, "today's totals") computed over a server-truncated window (Limit N with no pagination cursor surfaced) and presented as complete period totals. Once real volume exceeds the page size the number silently caps/understates, and nothing in the UI or API response discloses truncation; a server "count" field mirroring the page count deepens the illusion.

**Detect.** For each reduce/filter-count over a fetched list rendered as a period total, trace the endpoint for a Limit without LastEvaluatedKey/cursor handling. Any aggregate whose denominator is one page is a finding; check whether the response's count field is the page count masquerading as the total.

**False positives.** Aggregates the server computes over the full partition and returns alongside the page; explicitly windowed UI ("last 100 orders") where the cap is the product; volumes structurally bounded below the cap upstream.

## K:20 — Progress steps whose completion is a tautology of other steps

**Statement.** A setup checklist / progress meter includes a step whose "complete" state is computed purely as a function of OTHER steps' signals — the work the step names (configure the agent, review settings, verify the domain) has no signal of its own and may never have happened. The meter reaches 100% and fires completion celebrations while the named work is untouched; users trust the checklist and skip the work.

**Detect.** For each checklist step, trace the completion predicate to its inputs. Any step whose predicate references only sibling steps' inputs (a conjunction/disjunction of their signals with no independent source) is the finding. Cross-check the step's label against a real state signal that COULD have been used (config rows, review timestamps): its existence proves the tautology was a shortcut; its absence proves the step is unverifiable as designed.

**False positives.** Explicit summary/rollup rows visually distinct from actionable steps; steps whose named work is genuinely implied by the conjunction (the label merely restates the combination).

## K:21 — Cross-device user-journey state persisted device-locally

**Statement.** Per-user journey state that must survive device and platform changes — first-run/welcome seen, tour progress, setup-checklist dismissals, one-shot celebration flags — is persisted only in device-local storage (localStorage/UserDefaults). Every new device, browser, or platform re-presents dismissed onboarding to a user who already completed it; partial server flags covering only one surface make the behavior inconsistent across surfaces of the same product.

**Detect.** Inventory every first-run/dismissal/progress flag; for each, name the persistence layer and whether an authenticated server-side read/write exists. Device-local-only flags on cross-device products are the finding; flag surface-inconsistent coverage (server flag for surface A, local-only for surfaces B/C) explicitly.

**False positives.** Genuinely device-scoped preferences (this-device notification prompts, install banners); anonymous/pre-auth surfaces with no user identity to key on; local caches that write through to a server record.

## K:22 — Server-substituted resources never reconciled in the confirmation UI

**Statement.** A flow lets the user select a specific external resource (phone number, handle, slot), the backend substitutes a different one when the selection is unavailable (a documented race), and the confirmation UI never reconciles: it shows the requested value or nothing, auto-advances on success, and the user learns the truth later — after printing the number, sharing the handle, or missing the slot.

**Detect.** For each selection flow, find backend substitution/fallback paths (search the fulfillment path for substituted/fallback flags). Then trace the client's success rendering: does it display the AUTHORITATIVE granted value from the post-fulfillment record, and does it call out requested≠granted? Auto-navigation on success without rendering the granted value is the tell.

**False positives.** Flows that re-fetch and prominently display the granted resource on success (even without an explicit "changed" callout, if the value is unmissable before proceeding); substitutions requiring user confirmation before commit.

## K:23 — Identity teardown clears a hand-maintained list of persisted keys, so every key introduced later survives sign-out by default

**Statement.** Sign-out, and usually tenant or profile switch alongside it, clears client-side persistence by iterating a hand-maintained constant that names the keys to remove. The in-memory cache beside it is typically cleared wholesale — one call, no enumeration — which makes the teardown read as total in review, while the durable half is only as complete as the last person who remembered to extend the list. Every feature that later persists per-user state under a new key is therefore un-enrolled by default: nothing in the type system, the build, or the suite connects a key's definition site to the teardown, and the omission raises no error, only a first paint on the next session seeded from the previous user's record. Where the surviving state is journey or guidance state, the next person to use a shared browser is shown a surface calibrated for someone else — dismissed prompts stay dismissed, a completed checklist stays hidden from a user who has never seen it, a one-time introduction never fires. The mistake is self-healing on success only: the authoritative fetch that would overwrite the cache is deliberately best-effort, so an offline session or a failed read leaves the previous user's state standing for its entire duration. Three things keep this under-weighted. The teardown routine almost always carries a comment promising that nothing of the prior user remains, and reviewers read the promise instead of re-deriving the list. The same constant is reused at the tenant-switch boundary, so one missing entry leaks across two different identity boundaries. And the omission is most likely precisely when a subsystem is *replaced* — the new implementation coins a new key, and enrollment by literal name does not transfer from the keys it retired.

**Detect.** Enumerate every write to durable client storage across the application — not the teardown list — and diff that set against the keys the teardown removes; anything written but never removed is the finding, and the size of the difference measures how long the list has been drifting. Prefer the structural question to the diff: are keys defined as free string literals at their point of use (drift is then guaranteed) or through a single registry the teardown consumes (drift is then impossible)? Read the teardown's own comment and compare its promise against its implementation, since the gap between them is what defeated the last review. Check every other identity boundary that reuses the same list. Finally, establish whether the corrective authoritative read is mandatory or best-effort — a best-effort read means the stale state has no bounded lifetime, which is the difference between a flash and a session.

**False positives.** Keys holding no per-identity information — theme, locale, layout width, this-device install prompts — which are correctly preserved across sign-out; storage partitioned per identity by construction, where the key embeds the subject identifier or the whole area is scoped and dropped as a unit; teardowns that clear the entire storage area and enumerate only an explicit keep-list, which drift in the safe direction.

## K:24 — Failure with no rendering: failed loads read as empty, failed actions read as success

**Statement.** A surface consumes fetched data as `value ?? []` — or reads only the data field of a
load state — so a failed request paints the same screen as a genuinely empty result. The user is told
there is nothing, rather than that nothing could be fetched. The write-side twin discards the error
from a mutation (`try?`, an empty catch, an unchecked result), leaving the prior or optimistic UI
standing so a failed save, delete, or toggle reads as success. Both are silent: no error surface, no
retry affordance, and nothing an operator can see afterward.

**Detect.** For each list or detail surface, trace whether the render branches on the load state's
error case at all — not merely on emptiness. A view that never references the error case cannot display
one. Grep coalescing at render sites (`?? []`, `?? 0`, `.data ?? default`) and error-swallowing at
action sites (`try?`, `catch {}`, discarded results). Sweep siblings in the same change: this defect
arrives per screen, so one platform or tab is usually already correct while the rest are not.

**False positives.** Surfaces deliberately showing cached last-known-good data behind a staleness
indicator; fire-and-forget telemetry whose failure has no user consequence — confirm it is metered
somewhere.

## K:25 — A shared entity's surface renders from a member's perspective-scoped response, going blind when no member participates

**Statement.** A surface that displays a SHARED entity (a pooled wallet, a team quota, a common
inbox) derives its numbers from a MEMBER-scoped API response that includes the shared entity's
state only when that member currently participates in it. The shared entity's surface therefore
has no read of its own: the moment the last member disengages (switches mode, leaves the group,
disables the link) every response the surface can obtain omits the shared state, and the surface
renders empty/zero while the entity's real state persists server-side. The defect hides during
development because test flows always have at least one participating member; it surfaces exactly
when a user round-trips membership (join then leave) and then looks at the shared surface to find
their assets.

**Detect.** For every surface that displays a shared/parent entity, trace its data source to the
API call and confirm the call is scoped to the ENTITY, not to a member's view of it. Suspect any
derivation of shape `sharedThing = memberResponse.sharedField` where the API conditions
`sharedField` on the member's participation. Exercise the zero-participant state explicitly: if
the entity can exist with no members, the surface must still render its true state.

**False positives.** Fields that genuinely mean "the shared resource AS AVAILABLE TO this member"
(a draw-eligibility figure) rendered on the MEMBER's surface — that scoping is correct; the defect
is only borrowing that member-scoped figure for the shared entity's own display. Surfaces
deliberately hidden when no membership exists (prove the hiding is designed, not a null fallback).
