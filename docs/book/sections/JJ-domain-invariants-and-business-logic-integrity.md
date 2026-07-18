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
