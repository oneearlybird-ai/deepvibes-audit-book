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

## K:26 — A per-row action's pending state stored hook-wide

**Statement.** A list renders an action per row and the hook backing it keeps one pending flag. The
first click puts every row's control into its pending state: the whole list appears to be working,
several controls look disabled at once, and the user cannot tell which action is actually running.
If two rows are clicked in sequence the flag also clears on the first completion, releasing controls
whose work is still in flight.

**Detect.** Key pending state by the row identity the action targets and read it as
pending === id. In review, any list-level action whose loading state is a bare boolean is the
defect. Test by rendering two rows and asserting the sibling's control is unaffected.

**False positives.** Genuinely list-wide operations (refresh all, bulk apply).

## K:27 — One input object serves both create and update, so the update call ships create-only immutable fields the server rejects outright

**Statement.** A form, drawer, or hook builds a single input object and both branches send it: create
POSTs it, update forwards it wholesale to the update endpoint. But the two server contracts are not
the same shape — the create contract accepts fields that fix an entity's identity or kind (a type
discriminator, an owner, a parent, a locale anchor), and the update contract rejects those same
fields as immutable-after-create. Every edit of an existing record therefore fails validation at the
server while every create succeeds, so the feature reads as "works when I add one, silently refuses
when I change one." The failure compounds when the update is the FIRST call in a chain: any
subsequent write the handler performs after it — a nested resource save, a schedule, a child
collection — never runs at all, so the user's most visible edit is the one that appears to do
nothing. Static typing does not catch it in structurally-typed languages: spreading or passing a
create-shaped object where an update-shaped parameter is expected satisfies the parameter's required
members, and excess-property checking is suppressed for anything that is not a fresh object literal —
so the extra immutable field is invisible to the compiler precisely in the idiom people use.

**Detect.** For every entity with distinct create and update endpoints, diff the two server-side
accepted-field sets and list the create-only fields. Then find the client's input builder and trace
which branches send it: any update path forwarding an object built for create is a confirmed hit
unless it explicitly strips that set. Check the wire type too — a shared `Input` type used by both
calls, or an update type that merely extends the create type, is the structural form of the bug.
Corroborate against the server's own rejection: a validator message naming a field as immutable is
the exact string to grep the client for. Test by editing an existing record end to end, not by
creating one.

**False positives.** Endpoints that accept and ignore immutable fields idempotently (verify the
server discards rather than rejects); update paths that send the shared object through an explicit
allow-list or a generated update type derived by omission; entities where the field is genuinely
mutable and the rejection came from a different rule.

## K:28 — The view paints a default the store does not hold, and a partial write persists only the edited subset, so saving one field erases everything the user could see

**Statement.** A record can exist with an empty or absent collection — hours, preferences,
allocations, tags — and the UI renders a friendly default in that case so the surface never looks
broken. The default lives in the rendering layer only; the store still holds nothing. Then an editor
that changes ONE member of that collection seeds its write from the STORED value (empty) rather than
from the value on screen, applies its single change, and persists the result. Everything the user was
looking at — and reasonably believed was saved — is now explicitly absent, and because the view falls
back to the same default for *some* shapes but not the newly-written partial one, the surface flips
from "a full week of hours" to "one day set, the rest off" after an edit the user understood as
additive. Two separate defaults are the root: a display default and a write default that disagree,
with no single definition either can be derived from. It survives review because each half is
individually reasonable — showing a sensible placeholder is good UX, and seeding a write from stored
state is good practice — and the destruction only appears when they meet on a record that has never
been written.

**Detect.** For every collection the UI renders with a fallback, ask what the store holds when the
fallback is showing, then find every writer that persists a subset of that collection and read what
it seeds from. A writer seeding from the raw stored value while the view seeds from a fallback is the
confirmed hit. Grep for more than one literal definition of the same default shape — duplicated
default objects across a display component and a save handler is the structural signature. Test the
never-written record specifically: load it, change exactly one member, reload, and assert the other
members survived; a record that already has a complete stored value will pass and prove nothing.

**False positives.** Surfaces where the fallback is visibly marked as unsaved or suggested (ghosted
text, an explicit "not set" affordance) so the user is not led to believe it is stored; writers that
send a true partial patch the server merges into stored state rather than replacing the collection.

## K:29 — Hand-built URLs escape values with a component-scoped allowed-set, so the query’s own delimiters pass through free text and silently mis-filter

**Statement.** A client assembles request URLs by string interpolation and escapes user-supplied
values with an allowed-set scoped to the whole URL component rather than to a single value — the
"query-allowed" character sets of most platform libraries deliberately permit the query component's
own delimiters ('&', '=', '+', ';'). A free-text value containing one of them then splits into
phantom parameters, truncates at the delimiter, or decodes to different bytes server-side. Nothing
rejects the request: the server parses a syntactically valid query, applies a silently different
filter or search term, and returns plausible results. The defect never surfaces as an error —
only as wrong results for exactly the inputs that contain the delimiter — so it survives every
happy-path test. Sites using the platform's structured query builder are correct beside the
defective interpolation sites, which is what keeps review from noticing.

**Detect.** Inventory every hand-built URL (string concatenation or interpolation into a path with
'?'). For each interpolated value, ask two questions: is the escaping function scoped to a VALUE
(escapes '&', '=', '+') or to the whole component (does not)? And can the value carry those
characters — free-text search boxes, user-authored names/tags/categories, base64 cursors? Any
component-scoped escape (or no escape) on a user-controlled value is the finding. The repo's own
structured-builder call sites (URLComponents/URLSearchParams equivalents) prove the correct
pattern exists and measure the drift.

**False positives.** Values structurally incapable of carrying delimiters (server-minted opaque
ids with a known safe alphabet, enum raw values, integers); URLs whose interpolated value is
percent-encoded with a value-scoped set (alphanumerics plus unreserved only); transports that
carry the parameters in a request body or structured variables instead of the URL.

## K:30 — A staged one-shot handoff token is consumed and destroyed before its target data loads, so cold destinations silently drop the promised action

**Statement.** A cross-surface handoff is implemented as a staged one-shot token (a pending id or
flag in shared navigation/app state) that the destination surface consumes when it appears. The
consumer destroys the token unconditionally — clearing it before checking whether the data it
targets has loaded — and performs its lookup against a collection that is empty until an async
load completes. On any cold path (destination never yet mounted, cache empty, load in flight)
the token is consumed and discarded before its target exists: the promised action (open a detail,
scroll to a row, apply a filter) silently never happens, the user lands on the bare destination,
and nothing errors or retries. The defect hides in development because the destination is usually
warm there, and it recurs asymmetrically: one consumer in the codebase often implements the
correct arrival-gated form while a sibling consumer of the same staged-token pattern does not.

**Detect.** Inventory every staged one-shot handoff field (pending ids/flags in shared state
consumed by a different surface). For each consumer, answer two questions: is the token cleared
before or after the target lookup succeeds, and does any observer re-run consumption when the
target collection changes? A consumer that clears first and has no data-arrival re-trigger is the
finding whenever the target collection can be empty at appearance (lazy tab creation, on-appear
loads). Compare sibling consumers of the same pattern — divergence between them is both the tell
and the proof of the intended contract.

**False positives.** Tokens whose consumer explicitly distinguishes "target absent after load
completed" and clears only then (a deliberate out-of-window/miss policy); handoffs whose target
data is structurally present before the destination can appear (seeded synchronously or embedded
in the token itself); destinations that render an explicit not-found state instead of silence.

## K:31 — New-item indicators derived from length deltas of a windowed collection mint full-window badges on every reload and never fire at the window cap

**Statement.** A "new items" indicator — an unread badge, a dot, a since-you-left counter — is
maintained by observing the LENGTH of a client-side collection and incrementing by the delta
whenever it grows. The observed collection, however, is a windowed projection of server data (a
first page capped at N, an anchored date window) that loads, refreshes, resyncs, and identity or
scope switches replace wholesale. Length deltas are therefore not item events, and the indicator
fails in both directions at once: any idle-to-loaded transition — first load after sign-in, a
scope switch's reset-then-reload passing through zero, a reconnect resync touching a never-visited
store — mints a badge equal to the full window size, counting historical items as new; while a
collection already at its window cap absorbs genuinely new items with no length change, so the
badge never fires again for exactly the tenants with real volume. The defect is invisible in
development because small fixtures stay under the cap (where increment-per-delta happens to be
correct) and demos rarely re-run the sign-in or switch path with the observer mounted.

**Detect.** Find observers of collection length (`onChange` of `count`, watchers/selectors on
`list.length`) that feed "new/unread" state. For each, classify the observed collection: is it
windowed (fetch limit, date anchor) and is it ever replaced wholesale or reset to empty while the
observer is mounted (refresh-replace, teardown-then-reload at sign-in or tenant/profile switch,
reconnect resync)? Walk those paths explicitly: a sequence that passes through zero then loads a
page mints a full-page badge; a saturated window plus one genuinely new item produces no delta.
Either outcome confirms. The fix is to derive newness from item identity against a persisted
high-water mark (newest seen id/timestamp per scope) or from explicit item events, never from
length.

**False positives.** Collections that are complete and append-only for the observer's lifetime
(local logs, in-session queues) where length growth genuinely is an item event; indicators
explicitly presented as totals ("N calls") rather than new-item counts; counters recomputed from
identity on every render rather than incrementally maintained.

## K:32 — Post-save whole-document refetch clobbers sibling unsaved drafts and their dirty flags

**Statement.** An editor store keeps one editable draft per plane of a larger document (rules,
toggles, text fields), each with its own dirty flag and save routine, and every save routine ends
with a whole-document refetch whose repopulation step overwrites ALL drafts from the server and
resets ALL dirty flags — not just the plane that was saved. Any flow that touches two planes then
loses the second: a chained multi-plane save ("apply everything in this sheet") saves plane A,
reloads, finds plane B's dirty flag freshly cleared and its draft reverted, skips plane B's save,
and reports success; any single-plane save (or unrelated refetch trigger such as re-entering the
screen or an immediate-save control elsewhere on it) silently destroys drafts in-progress on every
other plane. The failure is deterministic yet survives testing because each plane saved ALONE
round-trips correctly — only the combined edit, which is usually the surface's headline flow,
drops data. A related face: a modal editor over the shared drafts whose Cancel merely dismisses,
leaving its abandoned edits dirty store-wide to be committed by a later save the user believes is
unrelated.

**Detect.** In each editor store, find the load/repopulate routine and list what it overwrites and
which dirty flags it resets; then find every save routine that invokes it and every UI chain that
saves multiple planes sequentially. A repopulation that resets flags for planes it did not save,
reachable between steps of a multi-plane chain, is the finding — confirm by tracing the chain's
second conditional against the flag state after the first save's reload. Also enumerate every
other refetch trigger (screen appear, immediate-save controls) and ask what happens to unsaved
sibling drafts. Check the modal Cancel path for a snapshot/revert.

**False positives.** Repopulation that explicitly preserves still-dirty drafts (merge-by-flag);
chains that collect all dirty planes into one request before any reload; stores whose refetch runs
only from an explicit user refresh with a dirty-state guard; single-plane editors where no sibling
draft exists.

## K:33 — Metric bound by display-label dispatch with a specific-metric catch-all renders a sibling’s number under the wrong title

**Statement.** A reusable stat tile / KPI card selects which metric to render by comparing its own
display label (or another cosmetic discriminator) against string literals, and the conditional's
catch-all else binds one SPECIFIC sibling metric rather than failing loudly. Every tile the chain
does not explicitly name — a newly added tile, a renamed label, a tile whose distinguishing
parameter was dropped in a refactor — silently renders the catch-all's metric under its own label.
The number is plausible in magnitude, the layout is correct, and the tile's secondary elements
(sparkline, subtext) often bind the RIGHT metric through a separate typed path, so the defect
ships as one confidently wrong headline that only a person cross-checking the figure against
another surface can catch. Renaming a label for copy reasons is enough to move a tile onto the
wrong branch.

**Detect.** Grep reusable tile/card components for conditionals on their own display strings
(`title ==`, `label ==`, switch over header text). Any such dispatch whose else/default returns a
specific metric (rather than an assertion, empty state, or the typed binding) is the finding.
Cross-check each instantiation site against the branch it actually lands in — especially tiles
relying on an optional parameter to route them, where no caller passes the parameter. The fix is
an explicit per-tile metric binding (closure or enum) supplied at the call site, with no
label-keyed routing.

**False positives.** Dispatch on a dedicated typed enum where every case is explicitly handled and
new cases fail compilation; catch-alls that render an explicit placeholder/error rather than a
sibling metric; display strings derived FROM the typed metric binding rather than routing to it.

## K:34 — Client-side gates enforced per-affordance, not per-destination — sibling affordances and alternate entries drift out of enrollment

**Statement.** A client enforces its authorization/visibility model (capability flags, role
read-only modes, tenant-vertical filtering) by decorating individual affordances — the menu rows
it filters, the buttons each screen remembers to disable — rather than by gating the destination
(the navigation state mutation, the action dispatch) once. Enrollment is therefore manual and
per-surface: every new screen must rediscover the read-only pattern, and every alternate entry
point to the same destination — keyboard shortcuts, deep links, restored state, programmatic
navigation — bypasses the filter applied to the menu. The drift is one-directional and silent:
the ungated surface renders enabled write controls that can only ever draw a server rejection
(surfaced as a generic request error instead of the platform's read-only language), and the
ungated entry navigates a user into a screen the filter says they should not see — often with the
menu showing no selected row, or content belonging to another mode. Because the server still
enforces the real boundary, nothing security-critical fails, which is exactly why the class
accumulates unnoticed.

**Detect.** Inventory how the client's gate is expressed: if it is a per-affordance decoration,
diff the set of gated surfaces against ALL surfaces reachable from the same navigation switch, and
diff the gated menu against every other writer of the navigation state (shortcut handlers, deep
link routers, state restoration, notification taps). Any destination render or action dispatch
reachable without passing the gate is the finding. Prefer the structural fix: apply the gate at
the destination (navigation-state setter validates; screens derive read-only from a shared
helper), so enrollment is by construction.

**False positives.** Entry points that genuinely re-validate at the destination (the screen itself
checks and renders the gated state); affordances deliberately shown-but-disabled as an upsell or
discovery pattern (must be styled as such, not as a live control); server-driven UI where the
client renders only what an authorized payload contains.
