---
section: V
title: "Background Processing, Work Queues & Cron Tasks"
group: saas-core
---

# [V] Background Processing, Work Queues & Cron Tasks

## V:1 — Poison Pills: Indefinite Worker Crashes Due to Lack of Task Parsing Try-Catch Blocks

Poison Pills: Indefinite Worker Crashes Due to Lack of Task Parsing Try-Catch Blocks. Processing message queue payloads with specialized schema assumptions without wrapping parsers in rigorous exception handling blocks, allowing an invalid task string to repeatedly crash workers and stall processing pipelines.

## V:2 — Task Idempotency: Duplicate Queue Execution Causing Double State Increments

Task Idempotency: Duplicate Queue Execution Causing Double State Increments. Designing heavy backend execution worker loops under the assumption that a message broker delivers every notification exactly once, resulting in duplicated database updates when the network triggers an "at least once" delivery retry.

## V:3 — Job Starvation: Co-mingling High-Priority User Events and Slow Batch Runs

Job Starvation: Co-mingling High-Priority User Events and Slow Batch Runs. Running prolonged analytical calculations on the identical system execution queue dedicated to instantaneous, interactive user-facing events, completely freezing critical system tasks during heavy background usage bursts.

## V:4 — Distributed Locks: Abandoned Mutex Expirations During Node Failures

Distributed Locks: Abandoned Mutex Expirations During Node Failures. Acquiring a system-wide Redis or DynamoDB lock for a heavy processing routine without configuring an absolute timeout threshold, ensuring that if the execution node crashes midway, the lock remains orphaned and blocks future jobs.

## V:5 — Overlap: Job runtime exceeding its schedule interval without overlap locks — concurrent…

Overlap: Job runtime exceeding its schedule interval without overlap locks — concurrent duplicate runs.

## V:6 — Time Math: Cron schedules assuming a timezone; DST shifts double-fire or skip runs

Time Math: Cron schedules assuming a timezone; DST shifts double-fire or skip runs.

## V:7 — Duplication: Schedules defined both in code and infrastructure — the same job firing twi…

Duplication: Schedules defined both in code and infrastructure — the same job firing twice from two schedulers.

## V:8 — Silent Death: No "last successful run" monitoring — dead cron jobs discovered weeks late…

Silent Death: No "last successful run" monitoring — dead cron jobs discovered weeks later by the absence of their output.

## V:9 — Retry Storms: Failed jobs requeued without backoff or retry budgets, amplifying downstre…

Retry Storms: Failed jobs requeued without backoff or retry budgets, amplifying downstream outages.

## V:10 — Checkpointing: Long batch jobs without progress checkpoints — any restart reprocesses fr…

Checkpointing: Long batch jobs without progress checkpoints — any restart reprocesses from zero.

## V:11 — Scaling Signal: Workers autoscaled on CPU instead of queue depth/age — backlog grows whi…

Scaling Signal: Workers autoscaled on CPU instead of queue depth/age — backlog grows while CPU idles on I/O waits.

## V:12 — Lease Extension: Long tasks exceeding visibility/lease timeouts without heartbeat extens…

Lease Extension: Long tasks exceeding visibility/lease timeouts without heartbeat extension — concurrent re-delivery mid-flight.

## V:13 - Automated remediator self-certifies success for a failure class it has no handler for, producing a non-convergent detect-repair loop

**Statement.** A self-healing lane pairs a detector that finds faults with a remediator that fixes
them and hands the subject back for re-inspection. The remediator is written around the faults it
knows how to fix, and its final step - returning "repaired" and moving the subject back into the
inspected state - is unconditional: it reports success because its own actions completed, not because
the fault is gone. When the detector reports a fault class outside the remediator's repertoire, or
when the hand-off drops the detector's specific findings and passes only a coarse category, the
remediator runs its full repertoire, changes nothing that matters, declares success with zero
remaining failures, and returns the subject. The detector immediately re-finds the same fault. The
pair now oscillates on a fixed interval forever. Nothing alerts, because every individual pass
"succeeds"; the subject never reaches its terminal healthy state and quietly stays out of service;
and the remediator's write actions - often expensive, audited, or rate-limited ones - accumulate at
the loop frequency indefinitely, which is how these are usually discovered, as unexplained churn in a
downstream audit metric rather than as a fault in the lane itself. The two defects are separable: the
missing handler is a gap, but the unconditional success report is what turns a gap into an infinite
loop.

**Detect.** Read the remediator's dispatch: enumerate the fault reasons it branches on and diff that
set against the reasons the detector can emit - anything the detector emits and the dispatch does not
handle, or handles with a catch-all, is a loop candidate. Check whether the "repaired" verdict is
derived from a re-verification or merely from the remediator's own actions completing, and whether
the hand-off preserves per-check findings or collapses them to a category. Then confirm on the live
system: pull the remediator's logs over several intervals and look for the identical subject and
identical reason repeating at exactly the schedule period with a success verdict each time, and check
the subject's stored state for a repair-attempt counter (its absence is the missing convergence
guard). Quantify the collateral: count the write operations per pass times the loop frequency.

**False positives.** Remediators that intentionally re-apply a desired state on every pass as
convergent configuration management, where the subject does reach and hold its healthy state; loops
bounded by an attempt counter, backoff, or a terminal give-up state that alerts; short-lived
oscillation during an active incident that resolves once the upstream fault clears.

## V:14 — Full-corpus tenant export executed synchronously in the request path and buffered wholly in memory

**Statement.** A "download my data" style endpoint pages a tenant's entire corpus into process memory, serializes it as one document (pretty-printing multiplies the size), uploads it, and responds — all inside one synchronous invocation behind a fixed gateway timeout. Completion time and memory scale with tenant data while the timeout and memory limit do not, so growth converts the export into 5xx timeouts or out-of-memory kills precisely for the largest tenants. When the gateway timeout is shorter than the function timeout, the client receives an error while the export completes invisibly — retries then double-run the job.

**Detect.** Request-path handlers that loop paginated reads to exhaustion, accumulate results into arrays, `JSON.stringify` the whole corpus, and upload once; compare the gateway's integration timeout against the function timeout; absence of a 202/job-id + async worker + completion-notification pattern; absence of streaming upload (multipart from a paginator stream) bounding memory.

**False positives.** Corpora with schema-bounded small size and a stated bound; endpoints that only enqueue the export job synchronously; streaming implementations with bounded memory; internal/admin-only tools where the operator owns the timeout risk knowingly.

## V:15 — A safety pre-check that loses its permission degrades to a logged warning, and the job proceeds unguarded on every run

**Statement.** A periodic job opens with a pre-check that exists to make it safe to run: is a
sibling execution already in flight, is a circuit breaker tripped, is another writer holding the
lease. The pre-check queries a control-plane API, and the job's role lacks that API's permission —
either it never had it or a later policy tightening removed it. The call raises an authorization
error, the handler catches it, logs a warning, and continues, because the author reasonably decided
that a failed check should not take down the job. The job then completes and reports success on
every run. The result is a guard that has never once guarded: the condition it exists to detect is
undetectable, and the failure it exists to prevent — the double execution, the write during a
tripped breaker — will occur silently the first time the underlying race actually happens, with a
successful-looking log line for every prior run as evidence that the guard was working.

**Detect.** Read the job's own warning-level log lines, not just its errors — the signature is an
authorization error inside a message whose name ends in check_failed or similar, on every
invocation, alongside a normal completion record. Grep every catch block that wraps a safety
pre-check and ask what the code does when the check cannot answer; warn-and-continue on an
authorization failure is always the finding, because an authorization failure is a permanent
condition, not a transient one. Then confirm from the live policy that the permission is genuinely
absent rather than conditioned away.

**False positives.** Pre-checks that are advisory by design and documented as such, where a second,
authoritative guard exists downstream (find it and prove it runs); transient throttling or timeout
failures on the check, which are a retry concern and not this rule; jobs whose concurrency is
genuinely prevented by the scheduler or by a reserved-concurrency setting, making the in-code check
redundant — verify the setting exists before accepting this.

## V:16 — Composite job identifier joined with the queue backend's reserved key delimiter, so the broker rejects every enqueue

**Statement.** A queue library builds its own storage keys by concatenating a namespace, the queue
name and the job id with a delimiter character, and therefore forbids that character inside a
caller-supplied custom job id. The application composes its ids from parts it already has —
connection id, stream, tenant, request id — and joins them with the same character, because it
reads naturally and is the obvious separator. Every producer path that supplies such an id throws
at the moment of enqueue, before the job exists. The failure is total and permanent rather than
intermittent: it is not a race, a capacity limit, or a transient broker error, so no retry policy
can clear it, and a scheduler built this way has never successfully enqueued anything since the
day it was written. Detection is delayed because the crash surfaces at the producer, far from the
consumer everyone watches, and because the feature's live verification usually exercises the work
function directly rather than through the enqueue path.

**Detect.** Find the delimiter the queue backend reserves (it is stated in the library's key-prefix
documentation and enforced in its add-job path) and grep every custom job id, deduplication key,
and idempotency key for it — including delimiters that arrive indirectly, inside an id that was
itself composed elsewhere. Then verify at the boundary rather than in the middle: assert that a job
actually lands in the backend, because in-memory queue fakes accept any string and will happily
encode the very format the real broker refuses. Treat a scheduler whose success log exists but whose
consumer has never run as this rule until disproven.

**False positives.** Ids that contain the delimiter only inside a payload field rather than the id
itself; backends that escape rather than reject the character (confirm from the library's source,
not its README); systems where the id is generated by the library and the composite string is only
a job name or tag, which is not key-forming.

## V:17 — A windowed source API pulled without explicit range parameters, so the job inherits the provider's default window and reads a bounded empty result as "no data"

**Statement.** A third-party list endpoint is windowed: when the caller omits the range parameters,
the provider substitutes defaults — typically "from now" plus a fixed span — rather than returning
everything. A sync job that sends only pagination parameters therefore queries a window it never
chose, and the records outside it are not merely unfetched but structurally invisible: the provider
answers 200 with an empty page and a null cursor, which every layer above reads as an authoritative
"there is nothing here". The bug is silent in exactly the way that matters most, because the pull
appears healthy — no error, no retry, no dead letter — while the history it exists to import can
never arrive. It is usually misattributed to the transport or to the connection when it finally
surfaces.

**Detect.** For every provider list call, open the provider's own reference for that endpoint and
enumerate its range parameters and their defaults; the finding is any parameter with a non-infinite
default that the client does not set. Confirm the direction of the default too — a default anchored
at "now" hides the past, one anchored at the epoch hides the future. Where the provider caps the
span, the client must walk explicit sub-windows across a horizon it owns, with the walk's position
persisted alongside the page cursor so an interrupted walk resumes inside its window rather than
restarting. Horizons belong to the platform's configuration, never to the provider's default.

**False positives.** Endpoints whose omitted range genuinely means unbounded (verify in the
reference, not by observation on a small dataset); pulls that are deliberately forward-only and
documented as such; providers where a separate "updated since" cursor is the intended incremental
axis and the range parameters are optional filters.

## V:18 — A completed backfill walk records no incremental high-water mark, so every scheduled cycle re-reads the entire horizon

**Statement.** A sync job walks a long horizon in pages or sub-windows and persists its position so
an interrupted run can resume. When the walk completes, the position is cleared and the completion
is recorded as a flag rather than as a watermark, so the next scheduled cycle starts at the
beginning of the full horizon again. Correctness is preserved — every cycle re-reads everything and
upserts — which is why the pattern survives review and is often written down as a deliberate
"eventual correctness floor". The cost is not: steady-state request volume equals cold-start
request volume, permanently, multiplied by the schedule frequency and by the number of connections.
A horizon of two years walked in monthly sub-windows every fifteen minutes is thousands of
third-party calls per connection per day to discover nothing changed, and it scales linearly with
tenants while provider rate limits do not.

**Detect.** Read what the job persists at the moment it declares completion. A cleared cursor plus a
boolean is the signature; a stored timestamp or opaque change-token that the next run reads as its
lower bound is the healthy shape. Confirm at runtime rather than in code: consecutive cycles that
report identical page counts, with zero fetched records, are re-walking. Then check whether the
provider offers an incremental axis at all — a change feed, an updated-since filter, or webhooks —
before accepting the full re-walk as necessary.

**False positives.** Horizons small enough that a full walk is cheaper than watermark bookkeeping,
where the bound is stated; providers with no incremental axis and no webhook, where periodic full
reconciliation is the only correct option — that is an accepted posture, not this rule, provided the
schedule is set to match; first runs and explicitly requested re-imports.

## V:19 — A dispatcher that hits a closed regulatory or quiet-hours window drops the work item instead of holding it, so the obligation silently expires with nothing recorded

**Statement.** An outbound job — a call, an SMS, a notification — is gated by a legally or
contractually defined contact window (quiet hours, business hours, a jurisdictional cutoff). The
gate is implemented at the moment of send, as a refusal: the attempt is consumed, an error or
`skipped` is returned, and the work item ends. Because the refusal is *correct* — the send genuinely
must not happen — it reads as compliance working, and the missing half is invisible: the item is
never rescheduled to the window's reopening, so an obligation created near the boundary (a job
queued at 22:00 against a window that closes at 21:00) simply dies overnight. Nobody is contacted,
no terminal outcome is stamped on the record, and the operator surface shows the item as
in-flight-forever or reverts it to its pre-dispatch state — indistinguishable from one that was
never started. The compounding failure is retry policy: where a refusal is counted as a failed
attempt, a few boundary-adjacent refusals exhaust the retry budget and the item is abandoned during
the very hours it was allowed to run.

**Detect.** For every window/quiet-hours check, follow the refusal branch to its terminal state:
require that it computes the window's next opening, persists that instant on the work item, and
re-enters a wait rather than returning a terminal status; require that a refusal does not decrement
the attempt budget. Verify the held item is re-evaluated on wake (windows move with timezone and
DST, and an overnight hold can outlive the owning claim/lease — the wake must re-check both). Assert
that every non-success terminal path stamps a readable outcome on the record; a work item that can
end with no outcome field set is the defect regardless of the window logic.

**False positives.** Fire-and-forget notifications with no delivery obligation, where dropping is
the specified behavior; windows enforced by a downstream provider that itself queues until open
(verify the provider queues rather than rejects); systems where a separate sweeper demonstrably
re-enqueues dropped items — verify the sweeper's query actually selects them.

## V:20 — The idempotency record is claimed at receipt, so a failed attempt makes every redelivery a duplicate

**Statement.** A consumer's exactly-once guard inserts the message's idempotency key on RECEIPT and
treats the insert conflict as "already handled". Nothing distinguishes claimed-but-unfinished from
completed. When processing then fails, the claim row remains, so the broker's redelivery — the
mechanism that exists to recover exactly this failure — is discarded as a duplicate. The message is
lost silently: no retry, no dead-letter, and an empty dead-letter queue that reads as health. The
window between claim and completion is precisely the window in which failures happen.

**Detect.** Read the guard's insert and its conflict arm together. A correct guard records a
completion marker (a processed-at stamp, a terminal status) and the conflict arm re-claims rows
whose marker is unset; only a completed row is a true duplicate. Prove it by failing a message
mid-processing and redelivering it. In live data, count claim rows with no completion marker older
than the visibility timeout — every one is a lost message.

**False positives.** Consumers whose processing is genuinely part of the same transaction as the
claim; at-most-once designs that document dropping as acceptable.

## V:21 — A total-result cap used as a page size, so the walk stops early and records a full sync

**Statement.** A paginated walk passes the source's result-limiting parameter as its page size — but
that parameter caps the TOTAL result set, not the page (SQL-dialect `LIMIT` in a query language the
provider evaluates once, a `max_results` the API applies to the whole query). The walk retrieves the
cap, sees no continuation token, concludes it reached the end, and stamps the sync complete. Every
record past the cap is invisible, permanently, and the completeness marker guarantees nothing will
ever go back for them.

**Detect.** For each paged source, read the provider's own reference for what the limiting parameter
bounds, then test against a data set larger than the cap and assert the walked count. Treat any walk
that both applies a limit and writes a completeness flag as suspect. In live data, look for syncs
whose record count equals a round number exactly.

**False positives.** Deliberate sampling or preview reads that do not claim completeness; sources
whose page parameter is documented as per-page and returns a continuation token.

## V:22 — The sweep's per-item eligibility test parses a field shape the canonical store stopped emitting, so every item is skipped and the run reports a well-formed, healthy zero-work completion

**Statement.** A periodic sweep decides per item whether work is due by reading one field and
parsing it — an hours range, a cron string, a window, a threshold expressed as text. The field's
canonical store later changes shape: what was a rendered display string becomes a structured object
(or the reverse, or a scalar becomes a map keyed differently). The sweep's parser is consumer-local
— written against the shape the field had when that consumer was built — and its failure mode is a
*non-match*, not a throw: coercing a structure to a string yields something the pattern simply does
not match, an absent key yields undefined, and the item falls through to the not-due branch. Because
"not due" is the overwhelmingly common and entirely legitimate outcome of any sweep, the run
completes normally and emits a well-formed summary — `{written: 0, skipped: N}` — that is
byte-indistinguishable from a healthy tick on a quiet hour. Nothing throws, no error metric moves,
no alarm has a datapoint to cross, and the downstream table simply never gains rows. The feature is
dead from the moment of the shape change and stays dead for as long as it takes a human to ask why
a table is empty; the elapsed time is bounded by curiosity, not by monitoring. The compounding
factor is that the parser is usually one of several private re-implementations of a normalizer the
platform already owns, so the same shape change is a latent time bomb in every other consumer that
grew its own copy.

**Detect.** For every scheduled sweep, name the fields its eligibility test reads and prove the
shape each one actually holds by reading live records from the canonical store — not the type
declaration, not a fixture, not the writer's intent. Where the consumer parses rather than consuming
a shared normalizer, treat that as the finding's seed and enumerate every other consumer of the same
field; a private parser is never singular. Distinguish the two zero-work outcomes in the sweep's own
telemetry: a run where every candidate was evaluated and none was due must be recorded differently
from a run where the eligibility test could not interpret its input, and an item whose field is
unparseable or absent must emit a distinct warning rather than joining the skip count. The decisive
query is longitudinal: chart the sweep's written-count against its candidate-count over the period
since the shape change landed and look for a written-count that is flatly zero while candidates are
non-zero — a real quiet period varies, a dead parser does not. Fixtures are the trap: assert the
consumer's tests round-trip the REAL normalizer over records copied from the live store in every
stored syntax, since a fixture authored beside the parser encodes the parser's own assumption and
will agree with it forever.

**False positives.** Sweeps over genuinely empty candidate sets, and seasonal or business-hours
windows where a run of zero-work ticks is expected — confirm by finding at least one tick in the
window that did write. Newly deployed sweeps whose first eligible item has not yet occurred.
Consumers that parse a field the canonical store still emits in exactly that shape, verified by
reading a live record rather than the schema. Skip counts driven by an explicit disable flag on the
item, which is a decision rather than a parse failure.
