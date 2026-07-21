---
section: II
title: "Concurrency, Races & Distributed Coordination"
group: cross-cutting
---

# [II] Concurrency, Races & Distributed Coordination

The richest bug class in real distributed systems. These rules apply to any code path where two
executions (requests, workers, instances, regions) can interleave on shared state. Related scattered
rules: D:14–D:16 (DynamoDB specifics), V:2–V:4 (queue workers), X:9 (retry idempotency), Z:11 (TOCTOU
on URLs). This chapter is the general pattern family.

## II:1 — Check-then-act (TOCTOU) on shared state without an atomic guard

**Statement.** A precondition (existence, availability, quota, balance, uniqueness) is read in one
operation and acted on in a second operation, with no conditional guard on the write. Two concurrent
executions both observe the precondition as satisfied and both proceed — double-booking, double-spend,
duplicate creation.

**Detect.** Find read→decide→write sequences that cross an `await`/network boundary. Then check whether
the final write carries the precondition with it: a conditional expression (`ConditionExpression`,
`WHERE` guard, compare-and-swap, unique constraint). If the precondition lives only in application code
before the write, the race is real. Trace the hot paths first: booking, checkout, signup, claim/assign.

**False positives.** Single-writer architectures (one partition-serialized consumer per entity) where
interleaving is structurally impossible; advisory pre-checks that are re-verified atomically at the
write (the pre-check is UX, the guard is the contract).

## II:2 — Read-modify-write without optimistic locking or a version stamp

**Statement.** An entity is loaded, mutated in memory, and written back whole. A concurrent writer's
update between the read and the write is silently overwritten (lost update) — no version number, ETag,
or condition on the previous state.

**Detect.** Find load→mutate→save flows on entities that more than one actor can touch (user + webhook,
two dashboard tabs, worker + API). Check the save for a version/updatedAt condition or a field-scoped
update (SET specific attributes) instead of whole-object replacement.

**False positives.** Whole-object writes where the object is genuinely owned by one actor (per-session
scratch state); last-write-wins semantics that are an explicit, documented product decision.

## II:3 — Multi-entity mutation without a transaction or compensation path

**Statement.** An operation mutates two or more records that must agree (debit + credit, reservation +
counter, parent + children) as separate non-transactional writes. A crash or throw between writes
leaves permanent partial state.

**Detect.** Find sequences of two or more writes in one logical operation. Ask: if the process dies
between write 1 and write 2, is the resulting state legal? If not, require a transaction
(`TransactWriteItems`, SQL transaction) or an explicit saga with recorded compensation steps.

**False positives.** Writes where the second is derivable/repairable from the first (an idempotent
projector rebuilds it); append-only event logs where consumers tolerate partial suffixes.

## II:4 — Retried side-effecting operations without idempotency keys

**Statement.** Operations with external side effects (charge, provision, send, create) are retried on
timeout/failure — by SDKs, queues, or users — without an idempotency key, producing duplicate side
effects. The timeout case is the trap: the caller does not know whether the first attempt succeeded.

**Detect.** Enumerate every side-effecting call that can be retried (HTTP client retry config, queue
redelivery, user double-click). Verify a caller-supplied idempotency key derived from the business
operation (not a fresh UUID per attempt) is sent and honored.

**False positives.** Naturally idempotent operations (absolute-value set, PUT of full state);
operations wrapped in a dedupe store keyed on a stable operation id.

## II:5 — Consumers assume exactly-once delivery from at-least-once transports

**Statement.** Queue/stream/webhook consumers apply side effects assuming each message arrives once.
SQS, SNS, EventBridge, Stripe/Twilio webhooks, and DynamoDB Streams all deliver at-least-once;
duplicates double-apply increments, sends, and state transitions.

**Detect.** For each consumer, ask: what happens if this exact payload is processed twice, possibly
concurrently? Require either a processed-message dedupe record (conditional create on message/event id)
or naturally idempotent handlers.

**False positives.** FIFO queues with deduplication enabled AND a consumer that is also safe across the
5-minute dedupe window boundary; handlers that only ever set absolute state.

## II:6 — Events applied without ordering guards — stale data overwrites newer

**Statement.** Consumers apply updates from events/messages assuming arrival order matches production
order. Redeliveries, retries, shard splits, and parallel workers reorder them; an older snapshot
overwrites a newer one.

**Detect.** Find consumers that write event payload fields directly onto entities. Check for a
sequence number, version, or event-timestamp condition on the write (`ConditionExpression: version <
:incoming`). If absent and the transport can reorder (any parallelism or retry), flag.

**False positives.** Append-only consumers (each event becomes its own record); single-shard,
single-consumer, no-retry pipelines (rare — prove it).

## II:7 — Distributed locks without expiry and fencing

**Statement.** A cross-process lock (Redis/DynamoDB row, advisory lock) is taken with no TTL — a
crashed holder blocks the resource forever — or with a TTL but no fencing token, so a paused/zombie
holder resumes and writes after its lease expired and another holder took over.

**Detect.** Find lock acquisition code. Verify: (1) TTL/expiry exists; (2) lease-holder writes carry a
fencing token (monotonic lock generation) checked at the protected resource, or the protected write is
itself conditional; (3) release only deletes its own lock (owner check), not whoever's lock is there.

**False positives.** Locks used purely as best-effort work-avoidance where duplicate execution is safe;
step-scoped locks whose protected writes are independently conditional (the lock is an optimization,
the condition is the correctness).

## II:8 — Wall-clock time used for ordering, uniqueness, or coordination across nodes

**Statement.** Correctness depends on timestamps from different machines agreeing: `Date.now()`-based
IDs assumed unique, "latest timestamp wins" merges, token/deadline comparisons across services. Clock
skew and NTP steps make these silently wrong.

**Detect.** Find IDs, ordering keys, and comparisons built from wall-clock time where more than one
machine produces them. Require: server-generated monotonic sequences, single-writer stamping, or
explicit tolerance windows sized to real skew.

**False positives.** Human-facing display timestamps; TTLs and coarse windows (minutes) where
sub-second skew is irrelevant; time from a single authoritative writer.

## II:9 — In-process memory used as a cross-instance coordination point

**Statement.** Rate counters, dedupe sets, locks, or "did we already do this" flags kept in process
memory of a horizontally scaled or serverless service. Each instance/container has its own copy; the
guard only works per-instance, which is to say it does not work.

**Detect.** Find module-scope `Map`/`Set`/counters that gate behavior (rate limits, once-only actions,
caches used for correctness). Check the deployment: more than one instance, or serverless with many
concurrent sandboxes? Then the state must live in a shared store.

**False positives.** Pure performance caches where staleness/misses are harmless; single-instance
deployments explicitly pinned to one replica AND documented as such (fragile — note it even then).

## II:10 — Fire-and-forget async work: errors vanish, shutdown races the work

**Statement.** Async operations are started without being awaited, joined, or handed to a tracked
background mechanism. Failures disappear (no log, no retry), process shutdown/scale-in kills work
mid-flight, and serverless runtimes freeze the sandbox before the work runs.

**Detect.** Find un-awaited promises/tasks with side effects (the `void doThing()` and bare
`doThing()` patterns), especially in request handlers and Lambda. Verify every async side effect is
either awaited before response, or durably enqueued (SQS, stream) — not floated in memory.

**False positives.** Explicitly durable hand-offs (enqueue then respond); runtimes with a real
extension mechanism (e.g. `waitUntil`) actually being used.

## II:11 — Lazy initialization races: first-use singletons and boot-time migrations

**Statement.** Expensive setup (connection, schema migration, cache warm, config load) runs "on first
use" or "at boot" guarded only by an in-memory flag. Parallel first-requests or parallel booting
instances run it concurrently — duplicate side effects, corrupted schema state, thundering-herd boot.

**Detect.** Find `if (!initialized) { initialized = true; await setup() }` patterns and boot-time
migration hooks. For anything with external side effects, require a distributed once-guard
(conditional insert of a migration/init record) or single-flight promise reuse for in-process cases.

**False positives.** Pure in-process setup (client construction) using the single-flight promise
pattern correctly; migrations run exclusively from a dedicated single-run deploy step, never at
service boot.

## II:12 — Same-entity operations processed in parallel without per-key serialization

**Statement.** Workers/handlers process operations concurrently with no per-entity ordering lane: two
workers mutate the same booking/account/document simultaneously. Global concurrency is tuned, per-key
concurrency is unbounded — the race is per entity, not per system.

**Detect.** For each parallel consumer, ask: can two in-flight operations target the same entity id?
Check for per-key serialization (FIFO message-group per entity, partition-by-key streams, per-key
locks) or fully conditional writes making interleaving safe.

**False positives.** Handlers whose writes are all conditional/atomic (serialization not needed for
correctness, only for throughput fairness); genuinely append-only workloads.

## II:13 — Re-triggerable long-running workflows without a per-entity in-flight guard

**Statement.** An API/UI action starts a long-running workflow instance (state machine, saga,
human-callback loop) keyed to an entity, but nothing records that one is already running: execution
names are salted with timestamps/UUIDs, and no conditional "in-flight" marker is stamped on the
entity. Re-triggering — a double submit, a second client surface, a second operator, a bulk re-run —
launches concurrent instances against the same entity. Even when every data write inside the workflow
is version-guarded (so the datastore stays consistent), the *external* side effects duplicate:
the same human gets two phone calls, two SMS, two emails about the same thing, or the same
downstream system is driven twice. The longer the workflow can live (callback waits, scheduled
retries measured in hours), the wider the duplication window.

**Detect.** For each workflow trigger, ask: what prevents a second Start for the same entity while
one instance is still running? Look for a conditional in-flight stamp on the entity row (acquired
transactionally at trigger, cleared at terminal states), a deterministic per-entity execution id the
engine rejects as duplicate, or an upstream per-entity lock. A trigger that names executions
`{entity}-{timestamp}` has explicitly opted out of engine-level dedupe. Trace every surface that can
reach the trigger (dashboard, mobile, bulk endpoints, scheduled sweeps) — the guard must be in the
trigger or the workflow's first state, not in one client's button-disable logic.

**False positives.** Workflows whose duplicated side effects are genuinely idempotent or harmless
(pure recomputation, cache warming); triggers already gated by an upstream per-entity lock or queue
with per-key serialization; workflows so short-lived that the UI's own submit-guard covers the
realistic window AND no other surface can trigger them.

## II:14 — Single-use continuations double-fired from an unguarded submit affordance

**Statement.** A client submit spends a single-use server-side continuation — an auth-challenge
session blob, a one-shot token, a redeem-once nonce — but the affordance stays enabled (and the
submitting method is not reentrancy-guarded) while the consuming request is in flight. A second
activation fires a concurrent duplicate consume of the same continuation. Exactly one wins; the
loser's rejection ("expired" / "already used") races back and lands in shared error state, so the
surfaced outcome contradicts what actually happened — an error banner over a successful login, a
"try again" over a completed redemption — and where the server budgets limited attempts per
continuation, the duplicate silently burns them.

**Detect.** For each client action that transmits a single-use token/session, check the full
in-flight window: the triggering control disables on the flow's loading flag (not merely on input
validity) OR the method guards reentrancy, AND late failure handlers cannot overwrite state a
completed success already set. Async-actor UIs deserve special attention: an `await` inside a
main-actor method is a reentrancy window even though the code reads as serial. Contrast with the
same screen's other submits — a primary CTA that disables on the loading flag while the secondary
submit does not is the tell.

**False positives.** Submits that are server-idempotent under a client-supplied key (the duplicate
is absorbed); affordances structurally unmounted on first activation (the state that renders them
is cleared synchronously before the first await); duplicate responses routed to per-request state
that cannot clobber the winning outcome.

## II:15 — Broadcasts: cross-context announcements emitted before the announced multi-step transition commits

**Statement.** A producer announces a state transition to other execution contexts (tabs via storage events, windows via postMessage, services via pub/sub) at the START of a multi-step sequence rather than after its final commit. Observers react immediately, read the shared source of truth mid-transition, and durably adopt the intermediate state; the producer's later corrective steps are never re-announced, so observers stay wrong until an unrelated refresh trigger.

**Detect.** For each cross-context broadcast, locate it relative to the full sequence it announces: any awaited mutations after the emit are windows where observers see intermediate state. Then check whether observers re-sync on anything other than the broadcast — if it is their only trigger, the intermediate adoption is sticky. Special attention to auth flows: login broadcasts fired before scope/tenant re-assertion completes.

**False positives.** Broadcasts carrying the final payload inline (observers do not re-read shared state); observers that debounce/poll the source of truth after the event; sequences whose intermediate state is a valid final state.
