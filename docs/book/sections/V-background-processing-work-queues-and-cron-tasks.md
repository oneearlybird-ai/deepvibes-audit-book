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
