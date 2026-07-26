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
