---
section: JJ
title: "Domain Invariants & Business-Logic Integrity"
group: cross-cutting
---

# [JJ] Domain Invariants & Business-Logic Integrity

Bugs that are invisible to infrastructure checks: the system runs green while the business state goes
wrong. An invariant is a statement about data that must hold at every commit point (money conserved,
capacity never exceeded, state transitions legal). Related vendor-specific rules: P:15–P:16 (Stripe
amounts/proration). This chapter is the general family.

## JJ:1 — Balance mutations without a double-entry movement record

**Statement.** Account balances, wallets, or credit counters are mutated in place (`balance -= x`) with
no immutable movement/ledger row per change. The current number cannot be explained, audited, or
rebuilt; drift introduced by any bug is permanent and undetectable.

**Detect.** Find every write path that changes a stored balance-like number. Require a paired,
append-only movement record (amount, reason, operation id, resulting balance) written atomically with
the mutation — and a reconciliation job asserting `sum(movements) == balance`.

**False positives.** Pure display caches recomputed from an authoritative movement table; counters with
no financial or entitlement meaning (view counts).

## JJ:2 — Limits enforced at the edge but not at the final write

**Statement.** Quotas, balances, plan gates, and permissions are checked in the UI or API layer, but
the datastore write that consumes the resource carries no guard. Any second path to the write (another
endpoint, a worker, a race, a bug) bypasses the limit.

**Detect.** For each enforced limit, locate the write that consumes it and check the write itself is
conditional on the limit (conditional decrement that fails at zero, constraint, transaction re-check).
Edge checks are UX; the write-time guard is the enforcement.

**False positives.** Soft limits explicitly designed as advisory (overage billing absorbs the excess) —
verify the overage path actually meters and bills.

## JJ:3 — Availability computed and booked non-atomically (double-booking)

**Statement.** Reservation flows compute free capacity (slots, seats, inventory) in one step and create
the reservation in another. Two concurrent requests both see the slot free and both book it. This is
II:1 specialized to the highest-stakes business surface — worth its own check on every booking system.

**Detect.** Trace the booking path end to end. The reservation create must itself fail on conflict: a
uniqueness key on (resource, timeslot), a conditional decrement of remaining capacity, or a
single-writer per-resource lane. If conflict detection lives only in the availability query, flag.

**False positives.** Overbooking-tolerant domains (standby lists) where the product intentionally
accepts conflicts and resolves them downstream — must be documented product behavior, not an accident.

## JJ:4 — State machines without transition legality guards

**Statement.** Entity status fields are set unconditionally (`status = 'refunded'`) with no check that
the transition is legal from the current state. Refunding an unpaid order, cancelling a completed job,
shipping a cancelled order — illegal states enter the system through races, retries, stale UIs, and
webhook replays.

**Detect.** Inventory status-bearing entities and enumerate writers of the status field. Require each
write to be conditional on the expected prior state (compare-and-swap on status) and require an
explicit transition table somewhere in code. Test the illegal transitions.

**False positives.** Administrative force-set paths that are deliberately unconstrained — must be
audited (who/when/why recorded) and role-gated.

## JJ:5 — Incrementally maintained aggregates with no reconciliation

**Statement.** Counts, totals, and rollups are updated incrementally on each event (`total += x`) and
never recomputed from source. One missed/duplicated event skews them forever; nobody notices because
nothing compares the aggregate to its source of truth.

**Detect.** Find stored aggregates alongside their source rows. Check for a scheduled reconciliation
(recompute and compare, alert on drift) or event-sourced rebuild capability. If the aggregate drives
money or entitlements, reconciliation is mandatory, not nice-to-have.

**False positives.** Aggregates recomputed on read; approximate metrics documented as approximate
(dashboard trends) with no business decisions attached.

## JJ:6 — Mixed deletion semantics: soft-delete rows leaking into live queries

**Statement.** Some entities soft-delete (`deletedAt`), some hard-delete, and query paths disagree:
lists exclude deleted rows but lookups/exports/joins include them; uniqueness checks collide with
deleted rows; "deleted" data resurfaces in search, analytics, or billing.

**Detect.** Grep the schema for soft-delete markers, then audit every query path touching those
entities for the filter. Check uniqueness constraints account for deleted rows (partial indexes /
tombstone keys). Confirm deletion semantics per entity are written down and consistent.

**False positives.** Intentional inclusion in admin/audit views — verify these surfaces are gated and
labeled, not accidental.

## JJ:7 — Business time computed in server timezone

**Statement.** Billing cutoffs, "today's bookings", business-hours checks, and daily jobs computed with
server-local or UTC date math while the business entity lives in its own timezone. Evening records
shift a day, cutoffs bill the wrong period, DST doubles or skips windows.

**Detect.** Find date-boundary logic (`startOfDay`, date-string truncation, cron `0 0 * * *`) on
business data. Verify the timezone source is the entity's stored timezone (not the host), conversions
use a TZ-aware library, and DST transition days are tested.

**False positives.** Genuinely global UTC systems where all parties are contractually on UTC; internal
technical timestamps never surfaced as business days.

## JJ:8 — Price and entitlement resolved from the client or a stale cache at commit time

**Statement.** The amount charged or the entitlement granted at commit time comes from client-supplied
values or a cached copy taken at page-load, not re-resolved server-side at the moment of commit. Users
pay changed prices or receive changed plans; attackers pay chosen ones. Generalizes P:3 beyond Stripe.

**Detect.** Trace checkout/upgrade commit handlers backwards: where do amount/plan/scope come from?
Anything originating client-side must be an identifier (price id, plan id) re-resolved server-side at
commit. Check cache TTLs on catalog data used in commit paths.

**False positives.** Client-echoed values used only for a mismatch check ("price changed, please
review") with the server value winning.

## JJ:9 — Natural-key uniqueness enforced only by application checks

**Statement.** Business-unique identifiers (email, phone, slot, invoice number, external ref) are kept
unique by a look-before-insert in application code, with no datastore uniqueness mechanism. Races and
retries create duplicates that every downstream join then mishandles.

**Detect.** List natural keys the business assumes unique. For each, verify a real constraint:
conditional create on the key, unique index, or a dedicated uniqueness item/table written in the same
transaction. An application-level SELECT-then-INSERT alone is a finding.

**False positives.** Keys where duplicates are tolerated and merged by design (contact dedupe
pipelines) — confirm the merge pipeline exists and runs.

## JJ:10 — Multi-step business flows without designed compensation

**Statement.** Flows like charge→provision→notify or reserve→confirm→fulfill have no defined behavior
for mid-flight failure: money taken but nothing provisioned, resources reserved but never released.
Recovery is manual archaeology, discovered per-incident. This is II:3's business-flow face.

**Detect.** Map each multi-step flow's failure points. For each point, require one of: full
transactionality, an automatic compensation step (refund, release, rollback), or a durable
pending-state record swept by a reconciler with alerting. "We retry and hope" is a finding.

**False positives.** Flows where every step is idempotent and a durable retry driver (Step Functions,
queue with DLQ + runbook) demonstrably completes or surfaces them.

## JJ:11 — Consumable grants re-obtainable through delete/recreate cycles

**Statement.** Free tiers, trials, one-time credits, and welcome grants key off the existence of an
account/workspace. Deleting and recreating (or re-onboarding with a variant identifier) re-issues the
grant unboundedly — free-tier farming.

**Detect.** Find grant-issuing code paths. Check the consumption record survives entity deletion
(keyed on durable identity: verified email/phone/payment fingerprint, retained through offboarding).
Walk the delete→signup-again scenario explicitly.

**False positives.** Grants intentionally re-issuable (marketing decision) with abuse monitoring in
place; grants gated on identities the user cannot cheaply mint (verified payment instrument).

## JJ:12 — Splitting totals across parts without remainder allocation

**Statement.** A total is divided across line items, installments, or revenue shares with independent
rounding (`each = round(total/n)`), so the parts no longer sum to the total — cents appear or vanish,
reconciliation breaks downstream. Compounds with float math (see P:15).

**Detect.** Find division of money/quantities into parts. Require integer minor-unit math with explicit
remainder distribution (largest-remainder / last-line-absorbs) and an assertion `sum(parts) == total`
at the split site or in tests.

**False positives.** Display-only percentage breakdowns never written back or settled.

## JJ:13 — Readers depend on denormalized attributes no writer stamps

**Statement.** A read path filters or routes on denormalized item attributes (e.g. tenant/owner ids
copied onto rows) that no writer actually persists — the authoritative values live only in the key.
Results silently filter to empty: the code path "works" (no error) while always returning nothing,
and the gap survives because test fixtures hand-craft rows WITH the attributes real writers omit.

**Detect.** For each attribute a reader filters/projects, trace every producing writer and confirm the
attribute is written. Sample live rows for the attribute's presence. Fixtures that fabricate the
attribute are a tell, not a defense. Prefer deriving from the key (parse) over trusting denormalized
copies.

**False positives.** Attributes populated by a backfill or stream processor that verifiably ran;
sparse-by-design attributes where absence is the intended filter.

## JJ:14 — Status-vocabulary drift between writer eras leaves live rows invisible to lifecycle readers

**Statement.** A scheduled or lifecycle reader selects rows by status equality (status = 'active'),
but historical writer generations used a different vocabulary for the same live state (e.g. a mover
that stamped 'rescheduled' on the still-active row before a later fix). The stale-status rows remain
live business objects yet are permanently invisible to reminders, sweeps, exports, and escalations —
with no error anywhere.

**Detect.** Diff the status vocabulary each READER matches against the DISTINCT statuses present in
live data and every historical writer. Any live-state row whose status a lifecycle reader will never
match is a hit. After changing a writer's status semantics, require a one-time restamp of existing
rows in the same change.

**False positives.** Statuses that genuinely mean "no longer active" for that reader; readers that
match on a computed liveness predicate rather than status equality.

## JJ:15 — Rates: jurisdiction- or tenant-variable statutory parameters hardcoded platform-wide

**Statement.** A statutory or business-variable parameter — sales tax rate, regulatory fee, gratuity policy, currency rounding — is hardcoded as a platform-wide constant in the transaction path, silently applying one jurisdiction's value to every tenant. Totals presented to end customers (and persisted to records) are simply wrong for most tenants, and no configuration surface exists to correct them.

**Detect.** Grep transaction-path code for numeric constants applied to money (rates, percentages, fees) and trace whether they vary by tenant jurisdiction in reality. Any per-tenant-variable value read from a module constant instead of tenant config is a hit. Check the admin/settings surface for a corresponding control — its absence confirms the parameter was never designed as configuration.

**False positives.** True platform constants (payment-processor fixed fees the platform absorbs); defaults explicitly labeled as estimates in the UI with reconciliation downstream; sandbox/dev fixtures never reaching persisted records.

## JJ:16 — Activation completes while a hard runtime gate guarantees first use fails

**Statement.** A creation/activation flow marks the primary resource "active" (and presents success UI) while a hard runtime gate — funding/entitlement, required catalog data, quota, or a capability prerequisite — guarantees the user's inevitable first use of the core function fails. No step in any creation flow collects the prerequisite, or the step exists but is silently skippable (its validation unconditionally passes; skipping is the passive default rather than an informed choice). The first thing every new user does — exercising the thing they just created — hits the gate: dead line, disabled feature, or a degraded fallback contradicting the product's headline promise.

**Detect.** Enumerate the runtime admission gates on the core action (billing/entitlement checks, required-data lookups, capability flags) and walk every creation/onboarding flow: for each gate, name the flow step that satisfies it. A gate with no satisfying step — or a step whose validation returns unconditionally true / whose skip needs no acknowledgment — is the finding. Test the literal first-use scenario a new user performs (call the number, hit the endpoint, open the feature) against a freshly created resource.

**False positives.** Deliberate pay-first or approve-first products where the flow itself blocks completion until the gate is satisfied (the gate IS a flow step); sandbox/preview modes that explicitly exercise the core function pre-activation; enterprise flows where a named human approval step is the documented gate.

## JJ:17 — Client declares a value vocabulary the server never accepts, and no affordance for what it does emit

**Statement.** A client declares the status or enum set for a shared domain object independently of the
server's validated set, and the two diverge in both directions: the client can advance a record to a
value the validator rejects — the write fails at the boundary, usually as an opaque 4xx — and the
client has no state, filter, or action for values the server legitimately produces, leaving those
records unreachable or misrendered. Because each client re-declares the set, the same divergence
recurs independently in every client rather than being fixed once.

**Detect.** Diff each client's declared set against the server's authoritative validator — the
accepted-values list in the handler or schema, never the documentation. Check both directions: values
the client can emit that the validator rejects, and values the validator emits that no client branch
handles. When one client is corrected, immediately check every sibling client for the identical
divergence. Keep display labels separate from wire values, so renaming a label can never silently mint
a new wire value.

**False positives.** Deliberately narrowed client subsets that reject unknown values at the decode
boundary with a clear error; display-only labels mapped from an authoritative wire value.

## JJ:18 — Two write surfaces for one concept, where the store that governs behavior is not the one that governs what the system says

**Statement.** One user-facing concept is editable from two surfaces that persist to two different
stores, with nothing synchronizing them. One copy drives actual behavior — routing, availability,
enforcement, scheduling — while the other feeds only what the system *states*: generated prose, a
summary panel, an assistant's script. Editing the wrong surface makes the product assert one thing and
do another, and no layer errors: every write succeeds, each store is internally consistent, and only
someone comparing the promise against the outcome can detect it.

**Detect.** For each concept a user can edit, enumerate every write path and the store it lands in;
more than one store for one concept is the finding unless a synchronizer is named and tested. Then
classify the stores by consumer — which does the enforcement or decision path read, and which feeds
generated text or display? Divergent consumers with independent editors is the high-severity case.
Retire the redundant editor and point it at the governing store in the same change; do not add a sync
job to keep both alive.

**False positives.** A deliberate cache or projection with a tested, monitored synchronizer and a named
source of truth; stores holding genuinely different concepts that merely share a label in the UI.

## JJ:19 — A guard's query predicate is written against a key grammar the table never uses, so it always returns empty and the guard silently passes everything

**Statement.** A safety guard decides by QUERYING for the thing it must block — a pending order, an existing booking, a prior consent — and the query's key predicate does not match the key grammar the writers actually use: it ranges a sort key over calendar dates while the live sort key is an opaque UUID, or begins_with a prefix the writer never emits, or reads a base table when the ordering lives on an index. The query is syntactically valid and the call succeeds, so nothing errors and no log fires; it simply returns zero items forever. Because "no rows found" is the guard's PASS condition, a control written to fail closed fails open on every invocation, for every tenant, from the day it shipped. A sibling implementation elsewhere in the codebase frequently has the query right, which is what makes the divergence invisible in review.

**Detect.** Never read a guard's query in isolation — read it against the key builder the writers actually call, and against a real row. For each guard, name the exact sk/pk shape its predicate assumes, then find the module that mints that key (the shared key builder, the contract sk template) and diff the two. Where an index carries the ordering the guard needs, confirm the query names that index rather than the base table. Fastest live check: run the guard's own query against production and look for a result set that is empty when you know a matching row exists. Also compare against any sibling guard enforcing the same invariant on another plane — if two implementations disagree about the key shape, one of them is dead.

**False positives.** Guards whose empty result is genuinely the common case and whose PASS is independently re-checked downstream; queries against a table whose key grammar the same commit also changes; predicates that look wrong but are satisfied by a denormalized attribute the writer really does stamp (verify the writer, not the reader's comment).

## JJ:20 — Client call sites reference API routes the live surface no longer serves

**Statement.** A client codebase composes requests to routes that do not exist on the deployed API —
retired paths, moved paths, renamed methods, or routes that only ever existed on another host or
API of the same platform. The client and server route inventories evolve independently, and no
mechanical parity check joins them, so a server-side retirement leaves callers in place. Each
stranded call site is a landmine that detonates only when a user walks that exact flow: the request
draws a gateway-level 404/403 (often the gateway's unauthenticated-shape error, not the app's),
the client surfaces a generic failure, and nothing server-side logs an application error. Debug
or flag-gated surfaces rot first — they are exercised least — but the same mechanism strands
production lanes whenever a contract migration moves N-1 of N callers (the missed caller class).

**Detect.** Build the client's emitted route set mechanically: find the transport wrapper(s), then
resolve every call site's method + path template (including proxy/rewrite layers that prepend or
strip prefixes — resolve to the path the SERVER sees). Join against the live API's exported route
inventory with positional parameter matching. Unmatched client calls are hits; classify by
reachability (production lane vs flag-gated vs dead code) for severity. Do the join per host: a
path that exists on a different API of the same product is still a miss on the host the client
actually calls.

**False positives.** Calls to third-party hosts (join only against your own surfaces); dynamically
composed paths your resolution genuinely cannot evaluate (report unresolved, never guessed); routes
served by an edge layer (CDN function, rewrite) that answers the path without origin routing —
verify the edge actually handles it before clearing, and flag it as edge-served rather than clean.

## JJ:21 — A settled cross-surface decision ships one half; the unshipped half exists nowhere — no code, no tracking row, no revised decision

**Statement.** An owner/product decision settles a change with two or more coupled parts (e.g.
"gate the purchase on funding AND give the buyer a way to evaluate before paying"). One part ships
completely; the other is never built, and — the actual defect — it exists nowhere: no backlog row,
no tracking id, no revised decision recording that the scope was cut. The shipped half changes
system behavior in a way the unshipped half was meant to balance, so the product silently lands in
a state nobody chose. Everyone downstream reads the shipped half as the whole decision.

**Detect.** For each settled decision with multiple parts (from decision records, incident notes,
design docs), enumerate the parts and locate each one's implementation or its tracking artifact. A
part with neither is a hit — the finding is the untracked gap, independent of whether building it
is currently the right call. Confirm the decision was genuinely settled (not a brainstorm) before
flagging.

**False positives.** Scope cuts that were explicitly re-decided and recorded; parts tracked under
a different name after a legitimate redesign; decisions superseded wholesale by a later recorded
decision.

## JJ:22 — A read boundary returns a literal constant in place of a stored attribute it never projects, so every downstream client that correctly branches on that field is uniformly defeated

**Statement.** A record carries an attribute that distinguishes two materially different kinds of the
same entity — direction, channel, origin, actor side. The writers stamp it correctly. The read API,
written when only one kind existed, hardcodes that kind as a literal in its response mapper and never
adds the attribute to the projection it requests from the store, so the value is not merely wrong, it
is not fetched. Downstream this is invisible in the worst way: every client that was built to branch
on the field works perfectly and branches on a constant. The clients are therefore not suspect, the
field is present in every payload, and the schema is satisfied — the only symptom is that the second
kind of entity is rendered as the first, which reads as a display bug in each client independently
rather than as one boundary telling one lie. The damage compounds when other fields are interpreted
relative to the wrong kind: a counterparty lookup that resolves the correct end of the relationship
for one direction resolves the system's own identifier for the other, so enrichment does not merely
fail, it attributes the record to the wrong party.

**Detect.** For each read boundary, diff the fields the store holds against the fields the boundary
projects, then against the fields the response contains. Any response field that is a literal in the
mapper and absent from the projection is the finding. Confirm both halves against live data: query the
store directly and show the attribute exists with more than one distinct value, then call the API for
one of the minority-value rows and show the response says otherwise. Sweep for the second-order damage
by listing every other field whose computation reads the same record and asking whether its
correctness depends on the kind — enrichment, attribution, sign, and display-name selection are the
usual carriers. The repair is to return the stored fact verbatim and to default only where absence is
itself a determinate fact about the writer that produced the row.

**False positives.** Boundaries that deliberately serve one kind and filter the others out at the query
(the constant is then true of every row returned); fields whose single value is enforced by a
write-side invariant with no path to a second value; and response fields that are genuinely derived
rather than stored, where the derivation is correct.

## JJ:23 — An enumerated selector offers N options while the table that gives those options behavior covers a subset, and the fallback is silent, so the product blames the operator's configuration for its own catalog gap

**Statement.** A picker, industry list, plan matrix or type selector presents a fixed enumeration, and a
separate hand-authored map supplies the behavior for each entry — suggestions, defaults, seeded
content, validation. The two are maintained independently and the map covers only the entries someone
needed at the time. Selecting an uncovered entry falls through to a default that is structurally valid
and semantically empty, and the surface renders its generic empty state. That empty state almost always
says something like "set your category to see suggestions" — advice the operator has already followed —
so the product diagnoses a user error to explain a gap in its own data. The gap is invisible to type
checking (the enumeration and the map are unrelated types), invisible to tests (the covered entries are
the ones anyone writes fixtures for), and self-concealing in support, because the reported symptom is
"the feature is empty" rather than "my category is missing." A related and more insidious variant: an
entry that IS present but keyed to the wrong enumeration member, which serves confidently wrong content
and produces no empty state at all.

**Detect.** Extract the enumeration and the behavior map as two key sets and diff them in both
directions. Keys in the enumeration and not the map are coverage gaps; keys in the map and not the
enumeration are dead or, worse, evidence of a rekeying drift — for every shared key, spot-check that
the map's content actually describes that enumeration member, because a shifted block of entries passes
a pure key diff. Add a gate asserting the coverage relation the product intends, and state the intended
exclusions explicitly in it rather than leaving them indistinguishable from omissions. Then read the
empty-state copy on the consuming surface: it must be able to say "this category has no catalog entry
yet" separately from "you have not chosen a category," or the fallback will keep misattributing the gap.

**False positives.** Deliberate exclusions where the uncovered entries route to a different surface
entirely and the exclusion is recorded; maps whose default is a genuine, useful generic rather than an
empty shell; and enumerations extended by a provider or tenant at runtime, where full coverage is not
achievable and the correct fix is the honest empty state alone.

## JJ:24 — Optional scheduling constraints treat unset as zero: no minimum-lead floor, so the generator offers slots no operation can honor

**Statement.** The availability generator supports lead-time constraints (minimum notice, booking
buffers, cutoffs) as OPTIONAL configuration, and when the tenant has not set them the engine
applies nothing — the first offered slot is the next grid point after "now". A caller at 12:55 is
offered 1:00 for a service that requires travel, preparation, or dispatch. The infeasibility is
obvious to every human and invisible to the engine, and downstream consumers (a booking UI, a
conversational agent) are left to apply judgment the system should have applied at generation.
The correct posture mirrors how past slots are handled: infeasible-lead slots should never be
generated at all — filtered at the source with a safe default floor when config is unset — rather
than rendered and then argued about. Constraint semantics also blur here: per-service duration
buffers (which extend a booking's footprint) get mistaken for lead-time floors (which suppress
imminent slots); tenants set one believing they set the other, and the gap surfaces as "the
system offered a slot it should not have."

**Detect.** Read the slot generator's constraint application: what happens when the rules object
is null or absent — is there a floor default, or does the gate short-circuit to a no-op? Confirm
live tenant config for a tenant that exhibited the symptom (rules unset is not rules ignored —
the distinction decides config-gap vs code-bug). Then inventory the constraint vocabulary across
the config UI and the engine: fields the UI writes that the generator never reads (or vice
versa) are the companion finding.

**False positives.** Domains where now-plus-grid genuinely is bookable (walk-in retail, instant
virtual sessions) and the zero-floor is a documented product choice; engines that DO apply a
documented default floor; consumers that provably filter before display (then the finding moves
to "enforced at the edge, not the source" only if a second consumer exists).

## JJ:25 — Single-window availability cannot express service-class-specific windows — urgent/after-hours classes have no lane

**Statement.** The scheduling domain models ONE bookable window per tenant (business hours /
booking hours), and every service class shares it. Real operations distinguish classes: standard
work books inside standard hours; emergency or urgent work is precisely the class that books
OUTSIDE them — at premium rates, with different notification, dispatch, and buffer semantics.
With a single window the system can only fail in one of two directions: the urgent class is
unbookable after hours (callers with the most valuable, most time-critical jobs are turned away
to voicemail), or after-hours booking is opened for everything (standard work leaks into windows
the operation never staffs). The missing shape is a window-per-service-class model: class-scoped
windows, class-scoped rate/service filtering at slot generation (only urgent-eligible services
render in the after-hours window), class-scoped alerting (immediate owner notification for urgent
bookings, over a channel that does not depend on — or count against — the tenant's own outbound
messaging line), and conservative lead/buffer handling for dispatch-time uncertainty.

**Detect.** Read the availability window model: count the window vocabularies per tenant. One
window plus any service catalog containing urgency-differentiated offerings (emergency fees,
24/7 language, urgent tiers) is the structural signature. Confirm the runtime: what happens to a
booking attempt outside the window per service class — uniform rejection regardless of class
proves the gap.

**False positives.** Domains with genuinely uniform service classes (no urgent tier exists);
systems that model after-hours via a second explicit mechanism (on-call calendars, separate
urgent-intake flows) that actually reaches the same scheduling engine; tenants who deliberately
refuse after-hours work (the gap exists but is not a defect for them — it is for the platform).

## JJ:26 — The cutover moves a collection to a new canonical home but leaves the old one in place and empty, so every unmigrated reader enumerates zero entries and takes the nothing-to-do branch

**Statement.** A shared record carries a collection — a map or list of child entities hanging off a
parent row — and a cutover moves those children to their own canonical rows. The safe-looking move
is to stop writing the old collection while leaving the attribute itself in place, so nothing
dereferences null. That choice converts a loud failure into a silent one. Readers that were never
migrated do not crash and do not log: they read the attribute, get an empty collection, iterate zero
times, and return success having done nothing. Every downstream effect those readers existed to
produce — aggregation, scoring, sweeps, compliance evaluation, enrichment — simply stops, and each
one reports itself healthy because "no children to process" and "the children moved" are the same
observation from inside the reader. Worse, readers that VALIDATE against the empty collection invert:
a compliance check that looks for an attribute on each child now finds none where it expects some,
and emits a false violation for every parent. The blast radius is invisible in code review because
the cutover's own diff touches only the writer and whichever reader prompted it; the remaining
readers are unchanged files. A single earlier fix on one reader is the strongest signal the class
exists and was never swept.

**Detect.** For any retired or superseded collection, grep every repository and every runtime for
reads of the attribute name — not just the one that was fixed — and classify each: enumerating
readers fail silent, validating readers fail loud-but-wrong. Then prove emptiness against live data:
read the parent rows and confirm the collection is empty on records created after the cutover date,
which distinguishes "retired" from "still partially populated". Compare the count of live children
in the new canonical home against the count each reader actually processes in its own logs or
metrics over the same window — a reader whose processed count is zero while the canonical count is
non-zero is a confirmed instance. Check the ledger or changelog for an earlier single-reader fix of
the same attribute; if one exists and other readers remain, the sweep was never done. The correct
remediation is to delete the attribute, not to leave it empty: an absent attribute makes every
unmigrated reader fail loudly on the first call.

**False positives.** Collections that are legitimately empty for the specific records sampled —
verify against records that definitely have children in the new home; readers that consult the old
collection only as a documented compatibility shim with a dated removal plan; write-through periods
where both locations are maintained deliberately during a staged move, which the writer's code will
show; validators whose empty-collection branch is explicitly an accept rather than a violation.

## JJ:27 — A period-stamped counter row is read without comparing its own period key to the current period, so a quiet period serves the previous active period's numbers as current

**Statement.** Rolling counters — calls today, bookings today, minutes this hour — are commonly kept
as a single row that a stream or aggregator overwrites, carrying both the counts and the period key
they belong to. The aggregator only touches the row when there is activity, which is correct and
cheap: on a period with no events, nothing is written and the row keeps the previous period's key and
the previous period's numbers. The reader is where the invariant is lost. If it projects the counts
and ignores the period key, then on any quiet period it presents stale numbers as current, and the
staleness is undetectable from the outside because the shape and magnitude are entirely plausible.
The error is systematically biased: it can only ever overstate, and it overstates precisely on the
periods a viewer is most likely to be checking because activity looks unexpectedly low. Dashboards,
alerting thresholds computed off "today", quota displays, and usage-driven billing previews all
inherit it. The same reader is usually correct about longer windows, which are computed from raw
records, so the bug hides as a single tile disagreeing with a chart beside it.

**Detect.** Find every read of a rolling counter row and check whether the period key stored on the
row is compared against the period computed at read time; a projection expression that fetches the
counts and not the key is conclusive. Reproduce it directly: pick a parent whose activity stopped
before the current period boundary and call the reader — non-zero "current period" counts against
zero raw records for that period is the confirmed defect. Check the aggregator side too, to
establish that it writes only on activity rather than stamping an empty row at each boundary, since
that write pattern is what makes the stale read possible.

**False positives.** Aggregators that do stamp a fresh zeroed row at every period boundary, which
makes the key comparison redundant — verify by finding a parent with a quiet period and reading the
row directly; counters deliberately labelled "last active period" in the interface rather than
"today"; readers that already floor the value against a period-scoped query of raw records.

## JJ:28 — A recovery loop's run-guard requires a state the failure it heals transitions away from

**Statement.** A self-healing loop (re-auth prober, reconnect scheduler, cache rebuilder, drift
repairer) is gated on a conjunction like "system in healthy-mode AND failure-flag set" — but the
failure it exists to heal also flips the system OUT of healthy-mode, either directly in the
failure handler or via a shared state reducer. The conjunction is then unsatisfiable for exactly
the failure class the healer was built for: the system parks in the failed state with the remedy
installed, correct, tested — and unreachable. The shape is easy to introduce because the guard is
written against the COMMON entry path (failure while healthy) and the failure path's own state
transition is added later or lives in another function; each piece reads correctly alone. It is
also easy to mistake for a missing feature during triage, because manually invoking the same
remedy succeeds instantly.

**Detect.** For every recovery loop, enumerate every state the target failure can leave the
system in — including transitions performed by the failure handler itself and by shared reducers
it calls — and prove the healer's guard admits each one. Treat any guard that conjoins a
healthy-looking precondition (authenticated, connected, ready, mounted) with the failure flag as
suspect: trace whether the failure path can clear that precondition. The live signature: the
failed state persists indefinitely with ZERO healer activity observable (no probes on the wire,
no attempts in logs) while the remedy demonstrably works when triggered by hand; recovery
correlates with full restarts/reloads rather than with the healer.

**False positives.** A healer deliberately scoped narrow because a DIFFERENT documented remedy
owns the excluded states (boot-time failures routed to a full re-initialization path) — prove the
other path exists and actually runs for those states. Guards excluding genuinely terminal states
where healing is undesired by design (an explicit sign-out, a decommissioned resource) are
correct, provided the terminal transition is deliberate and the excluded state cannot be entered
by the failure alone.
