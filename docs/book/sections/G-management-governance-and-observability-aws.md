---
section: G
title: "Management, Governance & Observability (AWS)"
group: aws-backend
---

# [G] Management, Governance & Observability (AWS)

## G:1 — CloudTrail: Multi-region trails disabled, or Log File Validation disabled (allowing unde…

CloudTrail: Multi-region trails disabled, or Log File Validation disabled (allowing undetected log tampering).

## G:2 — CloudWatch: Log Groups lacking retention periods, causing infinite compounding log stora…

CloudWatch: Log Groups lacking retention periods, causing infinite compounding log storage costs.

## G:3 — CloudWatch: Missing critical anomaly Alarms for SQS DLQ depth (ApproximateNumberOfMessag…

CloudWatch: Missing critical anomaly Alarms for SQS DLQ depth (ApproximateNumberOfMessagesVisible) or 5xx API errors.

## G:4 — AWS Organizations: Missing Service Control Policies (SCPs) to Prevent Resource Modificat…

AWS Organizations: Missing Service Control Policies (SCPs) to Prevent Resource Modification. Failing to restrict root member account activities at the organization level, allowing developers to accidentally delete centralized security instrumentation or disable logging trails.

## G:5 — CloudWatch: Missing Metric Filters for Mass-Extraction Detection

CloudWatch: Missing Metric Filters for Mass-Extraction Detection. Absence of pattern matching alarms for sensitive text phrases (e.g., AccessDenied, Password, BearerToken) in application stdout logs, meaning configuration leaks remain undetected until exploited.

## G:6 — CloudTrail: Failing to Log S3 Data Events for Sensitive Asset Pools

CloudTrail: Failing to Log S3 Data Events for Sensitive Asset Pools. Omitting granular data-plane logging for highly confidential cloud storage objects, creating a blind spot regarding exactly who accessed or extracted user data files.

## G:7 — CloudWatch: Alarms without actions, or actions routed to dead/unsubscribed SNS topics —…

CloudWatch: Alarms without actions, or actions routed to dead/unsubscribed SNS topics — alerts firing into the void.

**False positives.** An alarm with an empty action list is not necessarily unreachable: it may be an
INPUT to a composite alarm, which is the deliberate shape — the input carries the measurement, the
composite carries the notification, and giving the input its own action would page on the half-signal
the composite exists to suppress. Before calling an actionless alarm a hole, join it against every
composite alarm's rule expression in the account, not just against the metric-alarm set: a census that
lists metric alarms alone will always report the composite's inputs as unreachable. The same applies
to alarms referenced by a dashboard, a rollback monitor, or a deployment gate, which consume alarm
STATE rather than a notification. Read the alarm's own description first — a deliberate input usually
says so, and says which composite is the page.

## G:8 — CloudWatch: No composite alarms — a single incident pages 40 times across correlated sym…

CloudWatch: No composite alarms — a single incident pages 40 times across correlated symptoms.

## G:9 — Logging: Unstructured printf/console logging in production instead of structured JSON wi…

Logging: Unstructured printf/console logging in production instead of structured JSON with stable field shapes.

## G:10 — Logging: Correlation/request IDs not propagated across service hops — cross-service trac…

Logging: Correlation/request IDs not propagated across service hops — cross-service traces unjoinable.

## G:11 — AWS Config: Recording disabled — no resource-drift history or compliance snapshots avail…

AWS Config: Recording disabled — no resource-drift history or compliance snapshots available for the auditor.

## G:12 — Tagging: Cost-allocation and ownership tags unenforced — orphan resources nobody can att…

Tagging: Cost-allocation and ownership tags unenforced — orphan resources nobody can attribute or safely delete.

## G:13 — Tracing: No distributed tracing across async hops (Lambda→SQS→Lambda), making end-to-end…

Tracing: No distributed tracing across async hops (Lambda→SQS→Lambda), making end-to-end latency invisible.

## G:14 — Dashboards: No single per-workload health dashboard; incident response starts with ad-ho…

Dashboards: No single per-workload health dashboard; incident response starts with ad-hoc metric spelunking.

## G:15 — Budgets: No AWS Budgets or Cost Anomaly Detection alerts — runaway spend discovered on t…

Budgets: No AWS Budgets or Cost Anomaly Detection alerts — runaway spend discovered on the monthly invoice.

## G:16 — CloudWatch: High-cardinality custom metric dimensions (per-user/per-request) exploding m…

CloudWatch: High-cardinality custom metric dimensions (per-user/per-request) exploding metric ingestion costs.

## G:17 — SSM: Session Manager sessions without session logging to encrypted S3/CloudWatch — privi…

SSM: Session Manager sessions without session logging to encrypted S3/CloudWatch — privileged access leaves no trail.

## G:18 — CloudWatch: Alarm dimensions referencing nonexistent resources — INSUFFICIENT_DATA forever, monitoring theater

**Statement.** An alarm's dimensions point at a resource that no longer exists (a deleted API id,
a renamed function, a replaced load balancer): the metric never emits, the alarm sits
INSUFFICIENT_DATA indefinitely, and the dashboard reads as "monitored" while the surface the
alarm was written for — or its replacement — is actually unwatched. Deleted-and-replaced
resources are the sharpest case: the old resource's alarm survives the migration, the new
resource never gets one, and the alarm inventory count hides the gap.

**Detect.** For every alarm with hardcoded resource dimensions (ApiId, FunctionName,
LoadBalancer/TargetGroup ARNs, TableName, QueueName), verify the resource exists live. Alarms in
INSUFFICIENT_DATA state since creation are the runtime tell (`StateValue` +
`StateUpdatedTimestamp` from describe-alarms). Prefer dimensions resolved from the same source of
truth that provisions the resource (resource references, SSM parameters) over pasted literals.

**False positives.** Alarms on metrics that are legitimately sparse (custom metrics emitted only
on rare events) — distinguish "resource gone" from "metric quiet" by checking the resource, not
the metric; alarms pre-created for resources that a pending deployment is about to create
(verify the deployment actually lands).
## G:19 - Log groups provisioned without a customer-managed key while carrying identity, payment, or tenant data

**Statement.** Managed log groups are created without an explicit customer-managed encryption key,
inheriting the provider's default service-owned encryption. Data is encrypted at rest, so automated
scanners that check only "is it encrypted" pass - but the key is outside the organization's control:
there is no key policy to restrict decryption to named principals, no audit trail of key use
attributable to the log data, no independent revocation or rotation lever, and no cryptographic
separation between logs holding authentication traces, payment records, or tenant-scoped data and
logs holding build output. The gap is usually silent and partial: an organization's own standard
mandates a key, the newest resources comply because a module sets it, and everything provisioned by
older modules, console actions, or provider-implicit creation does not - so the posture is a
per-resource coin flip nobody has counted.

**Detect.** Enumerate every log group in the account from the live provider API, not from the IaC, and
count how many lack a key reference - provider-implicit creation (a compute runtime creating its own
group on first write) never sets one, so IaC review systematically misses these. Classify the unkeyed
groups by what actually flows through them (authentication and session handlers, payment and ledger
paths, per-tenant data services) rather than treating the count alone as the severity. State the ratio
and name the sensitive subset. Distinguish this from retention: retention being correctly set
everywhere is not evidence about keys.

**False positives.** Log groups carrying only non-sensitive operational output (build logs, health
probes, infrastructure metrics) where a documented data-classification policy exempts them; groups
whose provider default is a customer-managed key at the account level (verify the account setting
rather than assuming); environments where a documented, dated decision accepts service-owned keys
with a named revisit condition.

## G:20 - Detective alarm latched by a chronic baseline: a control that can never transition again can never notify

**Statement.** An alarm only notifies on a state *transition*. When the metric it watches carries a
permanent non-zero baseline - background automation re-writing the same resources on a schedule,
a health-check path counted as a "change", a noisy filter matching routine activity - the alarm
crosses into ALARM once and stays there indefinitely. Every dashboard, inventory, and compliance
scanner still reports the control as present, enabled, and wired to a live notification target, and
it is: it simply has no remaining transition to make. The real event the control exists to catch
(an unexpected policy edit, an unexpected configuration change) arrives, raises the metric further,
and produces no notification at all, because the alarm was already in the state it would have moved
to. This is the inverse of the missing-alarm gap and strictly worse to find, because the control
tests as healthy. The permanent baseline is usually itself a defect - an automation loop that never
converges - so the latched alarm is simultaneously a dead control and the loudest available evidence
of an unrelated fault nobody is reading.

**Detect.** List every alarm and compare `StateUpdatedTimestamp` / `StateTransitionedTimestamp`
against now: any alarm whose last transition is days or weeks old while its metric still receives
data is latched, not quiet. For each, pull the metric over a multi-day window and look for a flat
non-zero floor rather than spikes - a constant rate (an exact per-hour multiple of a scheduler
interval is the strongest tell) means an automated producer, not organic activity. Then trace the
producer: query the audit log for the events the metric filter matches within one interval and
identify the calling principal. Judge the control by whether a *new* occurrence could notify anyone,
not by whether the alarm exists and has actions attached.

**False positives.** Alarms deliberately latched as a persistent status indicator whose notification
path is a separate mechanism (a composite alarm or a dashboard widget); alarms in a documented
maintenance suppression window; alarms whose metric legitimately carries a constant floor and whose
threshold is set above it, so a real event still crosses; freshly created alarms that have not yet
had an opportunity to transition.

## G:21 - Custom config-compliance rule calls the resource API for the changed resource without handling deletion notifications

**Statement.** A custom compliance rule driven by a configuration-change stream receives a
notification for every recorded change to an in-scope resource, and deletion is a change. Rules are
routinely written to take the resource identifier from the notification and immediately call the
owning service's describe/get API to fetch the current configuration to evaluate. For a deletion
notification that call cannot succeed: the resource is gone, the API returns not-found, and the
unhandled exception fails the whole invocation. The rule then never submits an evaluation for that
resource, so the compliance service keeps the resource's last known verdict forever, and - because
every deletion in a fleet with normal churn produces one of these - the rule's error rate can sit at
effectively 100% while the compliance dashboard still shows the rule as attached and in scope. The
same shape appears when the notification carries a resource in a state the evaluator's happy path
does not model. Deletion notifications must be answered with an explicit not-applicable evaluation,
not by calling an API for something that no longer exists.

**Detect.** Read the rule handler's entry point and check whether it inspects the notification's
resource-status field before dispatching - a handler that branches only on message type and resource
type, then calls a describe/get with the supplied identifier, is the defect. Confirm from the live
system rather than the code alone: pull the rule function's error and invocation counts over a
window that includes resource churn and compare them; then read the error payloads and look for
not-found exceptions naming resources that no longer exist. Verify the consequence at the compliance
service - resources with a stale verdict and no recent evaluation timestamp.

**False positives.** Rules driven purely by periodic snapshot evaluation, which enumerate live
resources themselves and never receive per-resource deletion notifications; handlers that already
catch not-found and submit a not-applicable verdict; evaluators whose scope legitimately excludes the
resource type carrying the deletions.

## G:22 - Alarm bound to an opt-in metric family that was never enabled on the watched resource

**Statement.** Several cloud metric families are opt-in per resource - autoscaling-group group
metrics, per-instance detailed monitoring, container/cluster insights: the resource exists, the
alarm's namespace and dimension names are exactly right, but the service publishes nothing for that
resource until collection is explicitly enabled on it. An alarm written against such a family passes
every name-level review and every "does the resource exist" check, yet can never evaluate real data.
With missing data treated as breaching it latches ALARM permanently the moment it is created - pages
once, then never transitions again, so the page is dismissed as noise and the alarm is mentally
written off. With missing data treated as missing it sits INSUFFICIENT_DATA forever. Either way the
alarm cannot signal the condition it was written for while dashboards and coverage reviews count it
as protection. This is distinct from alarms whose dimensions reference nonexistent resources (G:18):
here everything is spelled correctly - the telemetry is simply switched off at the source, and the
fix is one enablement attribute on the watched resource, not a rewrite of the alarm.

**Detect.** For every alarm on a namespace with opt-in families, read the watched RESOURCE's
enablement state live (e.g. the scaling group's enabled-metrics list) instead of trusting that the
metric name looks right. Treat an alarm that has never left its birth state - ALARM or
INSUFFICIENT_DATA since creation with zero datapoints in the underlying series - as this defect
until proven otherwise. Cross-check the IaC: the alarm resource present while the enablement
attribute is absent from the watched resource's declaration is the code-side signature, and the fix
must land on the resource, in the same change set that relies on the alarm.

**False positives.** Alarms deliberately documented as enablement tripwires ("this fires until
collection is turned on") - rare and must be written down; metric-math alarms whose missing member
is declared optional; families that emit unconditionally for the resource class (load-balancer
request counts, queue depth), where absence of data genuinely means absence of the resource's
activity.

## G:23 — Detective alarm whose trigger datapoint an unauthenticated party can mint — pageable at will, and pinnable to suppress the real event

**Statement.** A detective alarm counts a signal emitted by a handler on an UNAUTHENTICATED endpoint, unconditionally, before any origin or signature check — so the datapoint the alarm exists to notice is one any anonymous caller can produce on demand. Two harms follow, and the second is the serious one. The obvious harm is nuisance paging. The severe harm is suppression: alarms notify on STATE TRANSITION, not on continued breach, so an attacker who keeps the metric above threshold holds the alarm in ALARM permanently, and the genuine event the control was built to catch then arrives with the alarm already firing and pages nobody. The control reads as healthy and loud right up until it matters.

**Detect.** For every alarm, trace its metric back to the line that emits it and ask who can reach that line. Any metric filter over a log statement on a route with no authorizer, no signature verification, and no origin allowlist is attacker-mintable — check the route's live authorization type, not just the IaC. Then check the alarm's shape: a Sum/Count threshold with no corroborating dimension is both forgeable and pinnable. The tell that suppression is possible is a low threshold plus a short period plus notification only on transition, which is the CloudWatch default.

**False positives.** Alarms whose emitting path is authenticated, signature-verified, or reachable only from a private network; alarms on infrastructure-emitted metrics the application cannot influence; alarms whose action is idempotent enrichment (a ticket, a dashboard annotation) rather than a page, where forged datapoints cost noise but suppress nothing.

## G:24 — Decommissioned subsystem leaves running remains: parked services, black-holed fronts, and records nobody reaps

**Statement.** A subsystem is retired — its core compute deleted or its service scaled to zero — but
decommissioning stops there. The rest of its estate keeps running: the load balancer and target
group stay attached and listening (now black-holing), the container service sits ACTIVE at desired
zero on a live cluster, DNS records keep resolving (sometimes to private addresses in public zones,
or to nothing), certificates keep renewing, and API fronts keep advertising routes into the void.
None of it is IaC-managed — retirement happened by console or by deleting only the piece someone
remembered — so no plan ever shows the residue and no drift check owns it. The remains cost money,
enlarge the attack surface with whatever auth they last had, confuse every inventory pass ("is this
load-bearing?"), and poison tooling that assumes named resources are live intent. The signature is
correlated debris under one naming family: an empty-but-attached target group, a desired=0 service,
a dangling record, and a dead API front that all share a prefix.

**Detect.** Cluster inventory by naming family and lifecycle signals: attached target groups with
zero targets (C:23), services at desired=0 on live clusters, API routes integrating to missing
compute (E:31), DNS records resolving to private or unallocated space, and certificates with no
consuming endpoint. When two or more of these correlate under one name family, treat the family as
a decommission-residue candidate and sweep EVERYTHING carrying the family name across every
resource type before disposing. The disposal is a delete, not a repair — dead legacy gets deleted,
not converted.

**False positives.** Deliberate scale-to-zero architectures with a verified wake path; seasonal or
blue/green capacity kept warm by documented intent; resources whose naming merely collides with a
retired family (verify by creation date and references, not name alone).

## G:25 — Compliance findings evaluated across a configuration-recorder gap are testimony about the past, not the present

**Statement.** When the configuration recorder was stopped and later restarted — commonly as a side
effect of enabling a posture-management product that requires it — the first waves of compliance
findings evaluate whatever configuration items exist at evaluation time: some freshly re-baselined,
some frozen at the stop date. The wave therefore mixes three populations: true findings, rows already
remediated during the gap (false FAIL — the live resource passes), and rows broken during the gap
(false PASS — the live resource fails and nothing flags it). Teams that remediate straight from the
first wave fix ghosts, suppress real gaps, and burn credibility on tickets for resources that were
already correct. Resource-level truth during this window requires reading the resource, not the
finding.

**Detect.** Compare the recorder's lastStopTime/lastStartTime against the findings' first-observed
timestamps; any batch created within the re-baseline window (hours to a day after restart, longer
for large estates) is suspect. Live-verify a sample of each control's flagged resources before
acting; a single mismatch (live passes, finding says FAIL) marks the whole control's wave as stale.
Expect periodic re-evaluation to converge the findings within a day or two — and expect the false
PASSES to surface as new findings then, not now.

**False positives.** Findings on resources created after the restart (their CIs are necessarily
fresh); change-triggered rules whose resources changed post-restart; waves observed well after the
re-baseline completed; recorders that were never stopped.

## G:26 — Dead-letter queue given a depth alarm but no drain owner or redrive procedure — the alarm latches on permanently and the messages are never recovered

**Statement.** A prior audit finds a dead-letter queue with no monitoring and the remediation adds a
depth alarm, which closes the finding correctly: the queue is now observable. What the remediation
does not add is the other half — who drains it, by what procedure, and what returns the alarm to OK.
A depth alarm on a DLQ is structurally different from an alarm on a rate or a latency, because depth
does not decay: the threshold is crossed by the first undeliverable message and stays crossed until a
human moves it. The alarm therefore latches on and never clears, and a signal that is always firing
is operationally identical to no signal at all — worse, because it now suppresses suspicion on the
whole class ("that queue has an alarm"). Two effects follow. The notification channel trains its
recipients to ignore it, so the NEXT distinct failure into the same queue is invisible. And the
messages themselves — each one a real piece of work the system promised to do — accumulate
indefinitely until the retention period silently deletes them, converting a recoverable backlog into
permanent data loss with no event at the moment of loss. The pattern is most likely where the alarm
was added to satisfy a fleet-wide coverage sweep, because coverage sweeps are written against the
existence of an alarm per queue and cannot express the existence of a drain path.

**Detect.** Treat a DLQ's alarm and its drain path as one control and audit them together. For every
dead-letter queue, read the LIVE depth and the LIVE alarm state, then compute how long the alarm has
been continuously in its firing state from the alarm's own history — a firing duration measured in
days, not minutes, is the finding regardless of how well-formed the alarm is. Ask what the documented
redrive procedure is and whether anything automated performs it; a queue whose only consumer is a
human who has not run is undrained by design. Compare the live depth against the queue's retention
setting to bound the time remaining before the backlog is deleted, and inspect the oldest message's
age directly. Then read a sample message and establish what the system promised the user it would do —
that, not the queue depth, is the severity. Finally, check whether the alarm's destination has any
confirmed recipient at all, since a latched alarm into an unsubscribed channel is two controls failing
at once.

**False positives.** Queues deliberately used as an inspection buffer with a documented periodic
review and an owner named in the runbook; alarms configured on message AGE rather than depth, which do
clear once the backlog is worked; DLQs whose messages are provably duplicates of work completed on a
retry path, where the accumulation is cosmetic and the accepted posture is documented; queues drained
by an automated redrive whose schedule is longer than the audit window.

## G:27 — An injected instrumentation layer writes its own failures at the application's error level, so every level-based error alarm fires on telemetry

**Statement.** A platform adds a caught-error signal by filtering the application's own structured
logs at the error level, and the same runtime also carries an injected observability layer — an
agent, an exporter, a wrapper — that the application did not write and cannot control. That layer
logs its own operational faults, most commonly export timeouts to a collector, through the same
console at the same level and in the same structured envelope. The filter cannot tell them apart:
the level is a property of the record, and the record is indistinguishable. The alarm therefore
fires on telemetry health rather than application health. Two harms compound. The alarm flaps or
latches on a fault the on-call cannot act on, training the team to ignore it; and the metric is
permanently non-zero, so a real caught error on that function raises no transition and pages
nobody. The signal is at its least trustworthy on the functions that carry the heaviest
instrumentation — usually the ones on the critical path.

**Detect.** Sample the log records that actually drive the error metric, do not assume they are the
application's — read the stack frames, and any frame pointing into an injected layer's own bundle
rather than the function's code is the finding. Cross-check: a function whose alarm is latched or
flapping on a fixed cadence while its business metrics are healthy is the signature. The durable fix
excludes the injected layer's records at the filter (by source, logger name, or message shape)
instead of by widening the threshold, which only moves the blindness; a separate alarm on the
instrumentation layer's own health keeps that fault visible where it belongs.

**False positives.** A layer whose export failures genuinely indicate application distress (memory
pressure, event-loop starvation) — confirm by correlating with the function's own duration and error
metrics before dismissing; functions where the noisy records are the application's, merely poorly
levelled, which is a logging-hygiene defect in the application and not this rule.

## G:28 — Detective alarm on a privileged identity whose filter also matches the platform's own service-attributed calls under that identity, so the control oscillates on background noise and the real event is indistinguishable

**Statement.** Controls that watch a privileged identity — the account root, a break-glass role, a
deployment principal — are written as "any activity by this identity is an event," because for a
human that is true. Cloud platforms, however, attribute a growing set of their OWN managed calls to
those same identities: notification polling, entitlement and subscription reads, marketplace and
support plumbing, health and billing readers. These arrive on a fixed cadence and carry the watched
identity in the audit record, so a filter keyed on identity alone matches them exactly as it matches
a human sign-in. Unlike a permanently latched control, this one keeps transitioning: the background
cadence is usually shorter than the alarm's evaluation window but not continuous, so the alarm
oscillates indefinitely, delivering a steady stream of notifications that are all benign. The control
now fails in the worst available way — it is not silent, so no gap shows on any inventory or
compliance report, and it is not trustworthy, so operators mute it, filter it, or stop reading it.
When a genuine privileged action does occur it produces a notification identical in shape to the
hundreds already ignored. Attempts to fix it by excluding read-only actions frequently do not, because
the exclusion is written with a wildcard the log-filter grammar compares literally rather than as a
glob, so the exclusion silently matches nothing.

**Detect.** Do not judge these by existence or by wiring. Pull the alarm's transition history over a
multi-week window and count transitions: a detective control on a rare event that has transitioned
tens of times is reporting noise, whatever its dashboard state. Then resolve the actual events behind
the metric — query the audit log for the filter's own pattern over one interval and group by the
calling service principal and event name, not by identity. Any group whose source is a platform
service domain is noise the filter should never have matched. Verify every exclusion clause in the
pattern against the log-filter grammar's real comparison semantics by testing it against a known
matching record, since wildcard-looking exclusions in equality comparisons are compared as literal
strings. Finally, ask the operator-facing question: given the last month of notifications from this
alarm, would a real privileged action have been distinguishable? If not, the control is dead
regardless of its configuration.

**False positives.** Alarms whose filter already constrains on the calling service principal or on a
session/credential-type attribute that excludes service-attributed calls; environments where the
watched identity genuinely performs frequent legitimate work and the control is scoped to a specific
high-risk action set rather than to the identity; controls whose notification target is an
aggregation or ticketing pipeline that deduplicates by design; short-lived alarms during a documented
break-glass window.

## G:29 — Missing-data policy set to breaching latches a disappearance detector for the entire pre-traffic period

**Statement.** A detector is written to catch a signal going away — traffic stopped arriving, a job
stopped reporting, a heartbeat went quiet — so its missing-data policy treats absent datapoints as
breaching. That is correct once the signal exists. Before the system carries real traffic the metric
has no datapoints at all, so the alarm enters the breach state on creation and stays there for the
whole build-out. Because notification fires on state TRANSITION, a latched alarm is silent: the
control is dead during exactly the period when the surrounding system changes most, and it cannot be
distinguished from a control that is quietly working. Two effects compound it. The notification
channel is trained to read the alarm as permanent noise, so the first genuine firing after launch is
dismissed as the same false positive everyone has been ignoring. And if the threshold is a
band or baseline model rather than a constant, the model has no observations to train on, so what it
will eventually enforce is undefined rather than merely untriggered. Inventory, dashboard, and
compliance views all report the control as present, enabled, and wired to a live notification target
— and it is. It simply has nothing it can say.

**Detect.** List alarms sitting in the breach state whose state has not changed in days, then pull
the underlying metric's datapoints over that same period; an empty series under a breaching
missing-data policy is the pattern. Separate it from a chronically-breaching baseline, where data
exists and genuinely exceeds the threshold — the remedy differs. For each hit make the pre-traffic
posture explicit and recorded: suppress the alarm until launch, or treat missing data as
not-breaching so the detector arms itself on the first real datapoint. Establish whether the alarm
is the only detector for its failure mode; its own description frequently says so outright, which
raises the severity from noise to a coverage hole.

**False positives.** Alarms intentionally latched as a launch blocker with a named owner and a
recorded expiry; detectors on paths that genuinely must never be idle, where the latch is the
correct and intended signal; alarms whose channel is suppressed under a documented maintenance
window.

## G:30 — A periodic refresh logs unconditionally at info on every tick, so a no-op dominates the operational log

**Statement.** A component re-reads its configuration, re-fetches a contract, or re-checks a lease
on a short timer so that changes apply without a redeploy, and it emits an info-level line each time
it does so. The line is written on the refresh, not on a change, so its content is identical on
every tick — the same version, the same value — and it is emitted whether or not anything moved.
At a sub-minute interval this is thousands of lines a day per running instance carrying zero
information, and it is the highest-volume message the component produces precisely because it is
the one thing that happens when nothing is happening. The real events the log exists to preserve —
a job completing, a sync failing, a version actually changing — are interleaved a few per hour
between them, so reading the log means paging past the no-op, tail-following is useless, and every
retention window holds proportionally less of what matters. Ingestion and storage are billed on the
noise.

**Detect.** Sort the log's messages by count over a day; a single message at a rate matching a timer
interval, with an invariant payload, is the finding. Confirm from the call site that the emission is
unconditional rather than change-gated — the healthy shape logs at info only when the fetched value
differs from the cached one, and drops the steady-state tick to debug or to a counter metric.
Check the log group's retention and any subscription filters at the same time, since both multiply
the cost of the noise.

**False positives.** Heartbeats that are themselves the monitored signal, where absence is the alarm
and a metric is genuinely not substitutable; low-frequency refreshes where the per-tick line is a
useful liveness record; components where the logged value is expected to vary each tick and the line
is therefore informative.

## G:31 — Two alarms with identical metric, dimensions, threshold and period watch one resource under different names, so the alarm inventory counts two detectors where one exists

**Statement.** The same condition on the same resource is declared twice, usually because two
generations of naming convention (or two stacks, or an import of a console-created alarm alongside its
codified twin) each produced an alarm and neither removed the other. The pair is not redundancy in the
availability sense: they share a metric, so they share every failure mode — a metric that stops
publishing, a dimension that no longer resolves, a latched state — and they fail together, always.
What the duplication does change is the reader's model. An inventory of alarms, a coverage report, or
a per-service alarm count all record two detectors on that resource, and a review that asks "is this
queue watched?" gets a doubly reassuring yes. Every incident also notifies twice, which trains
recipients to filter by name, and the filter usually keeps the older name — so a later change that
correctly retires one of the pair can silently remove the one people still read.

**Detect.** Group every alarm by the tuple (namespace, metric name, sorted dimensions, statistic,
period, comparison operator, threshold) and report any group with more than one member. Do this
against the live control plane rather than the IaC, because the common cause is exactly that one
member is not in the IaC. For each duplicate group, check which member the notification actions
route to and whether they differ — an alarm whose actions point somewhere else is a different
finding (a divergent detector), not a duplicate. Resolve by deleting one and confirming the survivor
is the one referenced by the runbook, the dashboard and the subscription.

**False positives.** Alarms that share a metric but differ meaningfully in threshold or evaluation
window (a warning tier and a page tier); composite alarms that reference a child by design; and
deliberately duplicated alarms routed to genuinely independent notification paths as a
notification-plane redundancy measure, where that intent is documented.

## G:32 — The outage alarm counts failures, so the total-failure case publishes no datapoint and the alarm reports healthy

**Statement.** A resource's availability alarm is built on the *failure-count* side of a membership
metric — unhealthy hosts greater than zero, failed instances greater than zero, errored members
greater than zero — with missing data treated as not-breaching, or as "missing", which holds the
last state. The metric is only published per member, so when the pool empties completely there is
nothing left to count as unhealthy: the failure-count metric stops publishing, and the alarm reads
the absence as good news. The pool being empty is precisely the worst state the alarm was bought to
catch, and it is the one state the alarm is structurally incapable of entering. The correct polarity
is a FLOOR on the healthy-count metric — healthy members less than one — with missing data treated
as breaching, which catches both "some members are sick" and "there are no members". The two shapes
look interchangeable on a dashboard and diverge only during an outage. Duplicated resource families
make this worse: the floor alarm is often written correctly on the one balancer or cluster where an
incident taught the lesson, while its twin keeps the failure-count shape, so the fleet's monitoring
quality varies by which resource happened to break first.

**Detect.** Enumerate every availability alarm and classify its metric by polarity. Any alarm whose
metric counts BAD members — unhealthy host counts, failed or errored gauges — is a candidate;
confirm by asking whether the metric has any datapoint to publish when member count is zero. If it
does not, and missing data is treated as not-breaching or as missing, the alarm cannot fire on total
loss. Then check coverage in the other direction: for every load balancer target group, cluster, or
pool, assert that at least one alarm watches the HEALTHY count with a floor and treats missing data
as breaching. Where a family of near-identical resources exists — two balancers, several clusters —
diff their alarm sets against each other; an explanatory comment on one member naming this exact
reasoning, with no matching alarm on its twin, is the signature. Alarm history is the proof: during
any real outage the correct alarm transitions to ALARM while the failure-count alarm transitions to
INSUFFICIENT_DATA, or stays OK, at the same minute.

**False positives.** Failure-count alarms that are deliberately the second tier behind a
healthy-floor alarm on the same resource — check for the floor alarm before flagging; pools whose
platform publishes a member-count metric that is genuinely continuous at zero, verified against the
provider's metric documentation rather than assumed; alarms on resources that are expected to be
empty and whose front door is verifiably disabled while empty; composite alarms that already combine
a floor condition with the failure count.

## G:33 — Tracing is enabled on the workload but its execution identity was never granted the telemetry-publish action, so the exporter throws on every invocation while the work itself succeeds

**Statement.** Distributed tracing is switched on in two independent places: a platform-level flag on
the compute resource (tracing mode active, an auto-instrumentation layer or sidecar attached) and a
permission on the execution identity that lets the exporter publish segments upstream. The flag and
the grant are usually authored in different files by different changes — the flag rides the function
or task definition, the grant rides the role — so a workload can carry the whole instrumentation
stack and none of the authorization. When that happens the application's own logic runs and returns
normally, and the exporter fails with an authorization denial on every single invocation. The result
is worse than having no tracing: there are no traces AND there is a permanent stream of
authorization errors attributed to the workload, which drives any error-rate or error-level alarm
built over the function into constant firing. Teams then tune the alarm, or mute it, and the real
application errors it was bought to catch are lost with the noise. The fleet-wide shape is the
tell — the grant is present on the large majority of identities because it is part of the standard
role template, and absent on the handful of roles authored by hand or copied before the template
existed.

**Detect.** Enumerate every compute resource with tracing enabled, resolve each to its execution
identity, and simulate the telemetry-publish action against that identity — do not read the role's
policy documents and reason about them, ask the authorization engine. Any implicit deny is a
confirmed instance; the count that matters is the ratio, because a small minority failing against a
large allowed majority proves the template exists and these roles missed it. Confirm at the
workload's own logs: the denial names the identity and the action, and its rate equals the
invocation rate. Cross-check the alarm plane — an error-level or caught-error alarm on the same
workload that fires and clears on a cycle unrelated to traffic incidents is the downstream symptom.

**False positives.** Workloads where tracing is enabled but the exporter is deliberately configured
to a local collector that forwards under a different identity — verify which identity actually
publishes before flagging; identities whose grant arrives through a permission boundary or session
policy the simulation does not model, which the simulation's own result will show as allowed once
the correct source ARN is used; resources where the tracing flag is set but no instrumentation layer
is attached, which is a different defect (tracing configured and never emitted) and belongs to the
missing-instrumentation rule.

## G:34 — A percentile alarm on a sparse metric evaluates a single datapoint, so ordinary variance transitions it dozens of times a day and the channel is desensitized

**Statement.** Latency alarms are commonly authored as "percentile over period, threshold, one
evaluation period" and left there. On a high-volume service that is defensible: the percentile over
a full period is a stable statistic. On a sparse or bursty service it is not — a period containing a
handful of requests lets one cold start, one slow dependency call, or one large payload move the
p95 past the threshold, and with a single evaluation period and no datapoints-to-alarm requirement,
that one period is the whole decision. The alarm transitions to ALARM and back to OK within a few
minutes, repeatedly, all day. Nothing is broken and nothing is actionable, but the notification
channel now carries dozens of state changes per alarm per day. Two things then fail: any human
reading the channel stops reading it, and any automation keyed to alarm state — configuration
rollout monitors, deployment gates, composite alarms — inherits a signal that is randomly ALARM at
any given moment. The defect is not the threshold, which is usually reasonable; it is that the
evaluation window is one sample wide on a statistic that needs several to be meaningful.

**Detect.** Pull the alarm history for the window and count state transitions per alarm; any alarm
transitioning more than a few times a day with no corresponding incident is a candidate. For each
candidate read its live configuration and look for datapoints-to-alarm unset or one, together with
an evaluation-period count of one or two, on a percentile or average statistic. Then measure the
metric's own density over the same period — if periods routinely contain few datapoints, the
percentile is not a stable statistic at that period length and the single-datapoint decision is the
defect. Confirm the alarm is code-managed rather than console-authored before proposing the fix, so
the fix lands where the next apply will not revert it.

**False positives.** Deliberately twitchy alarms whose only consumer is a dashboard or a
low-priority digest, documented as such; alarms on genuinely high-volume metrics where a single
period is a large sample; step-change detectors that are supposed to fire on one datapoint by
design, such as an availability floor; alarms whose flapping is a real intermittent fault, which the
metric itself will show as a bimodal distribution rather than a long tail.

## G:35 — Caught failure paths answer the user with a graceful degradation and never touch the platform error metric, so the alarm suite watches a number that polite outages cannot move

**Statement.** A handler catches an internal failure and returns a designed degradation — an
apology message, a fallback response, a clean hangup — which is correct user-facing behavior and
also means the invocation SUCCEEDS as the platform counts it: the error metric the alarm suite
watches (invocation errors, 5xx counts) never increments. The failure exists only as an
error-level line in the application log. Unless each such caught path has its own log-metric
filter and alarm, a workspace, tenant, or business line can fail EVERY request politely and
indefinitely — the operator dashboard stays green, and discovery arrives through the affected
customer's complaints. The trap compounds because teams typically add the log-metric pattern for
the first caught path that burns them and not for siblings added later: coverage decays one
graceful catch at a time.

**Detect.** Enumerate every catch block that returns a degraded-but-successful response and logs
at error level; for each, demand the matching log-metric filter + alarm (and verify the filter's
pattern syntax matches the log group's format — a JSON pattern on a text group matches nothing).
Diff the set of error-level log markers in code against the set of metric-filter patterns in IaC;
every unmatched marker is an unmonitored polite outage. Confirm the alarm's missing-data policy
fits sparse traffic.

**False positives.** Degradations that are genuinely user-preference outcomes rather than
failures; caught paths that re-emit into an errors metric the alarms DO watch (custom EMF error
counters); environments where a log-aggregation alerting layer (not metric filters) demonstrably
alerts on the specific marker — verify the alert rule exists, not the aggregator.

## G:36 — A validation branch returns a client-visible error status while emitting no log line, so a failure the user can see is undiagnosable from the server side

**Statement.** A handler rejects a request in a guard clause — unrecognized keys, a failed shape
check, an empty projection — and returns a 4xx with a short machine code. The branch logs nothing:
it is not an exception, the platform counts the invocation as a success, and the author's mental
model is that a 4xx is the client's problem to read. The result is a request that is loud at the
client and completely silent at the server: the access log shows a normal short invocation, tracing
shows no downstream subsegments (because the handler returned before touching anything), and the
error metric never moves. Every hop between the two ends — edge, gateway, integration, body
decoding — then has to be excluded one at a time by an operator who cannot see which guard fired or
what it received, which is why this class converts a one-line bug into a multi-day investigation.
It is strictly worse than an unhandled throw, which would at least leave a stack trace.

**Detect.** Enumerate every branch that returns a 4xx (or any non-success envelope) without
throwing, and require each to log a distinct structured marker naming the guard and the *shape* of
what it received — received key names, decoded body length, content-type — never the values, so the
line stays safe for payloads carrying customer data. Cross-check the set of returnable error codes
in the handler against the set of markers in its log group over a window where that code is known to
have been returned; a code with no corresponding marker is the defect. Where a body-decoding
fallback exists, require it to log the encoding facts it observed, since a mis-decoded body reaches
the guard looking like a legitimately empty one.

**False positives.** Guards on hot unauthenticated paths where per-request logging is a documented
denial-of-service or cost decision and a sampled/aggregated counter demonstrably exists instead;
rejections already emitted by a shared middleware that logs centrally — verify the middleware runs
for that route; health and probe endpoints.

## G:37 — A ticket-per-event target on a re-emitting findings source multiplies open tickets per refresh cycle, and once deduplication is added the absorbed duplicates read as delivery failures

**Statement.** An event rule whose target creates a ticket (ops item, issue, incident record) for
every matching event assumes the source emits once per problem. Security-posture and compliance
services do not: they re-publish every still-open finding on each refresh, rescan, or periodic
re-evaluation cycle, so the target mints a new ticket per finding per cycle and the open-ticket
count grows with findings × cycles rather than with new problems — burying the handful of
actionable items under their own duplicates. Observed in production: roughly 3,900 open tickets
from under 950 unique findings within days. The defect has a second stage: when a deduplication
key is later added at the create call, the platform absorbs duplicates by *rejecting* the create,
and the event bus records that rejection as a failed target invocation — so a dead-letter queue or
failure alarm wired to the target (correct for real delivery failures) now fires once per absorbed
duplicate, converting ticket noise into failure-signal noise.

**Detect.** Enumerate event rules whose target creates an entity rather than upserting one. For
each, establish the source's emission contract from its documentation or by watching a single
stable finding across two refresh cycles: state-transition sources emit once per change;
findings-import and compliance-evaluation sources re-emit unchanged items. For re-emitting
sources, require a deduplication key derived from finding identity in the target input, and check
its granularity against triage intent. Check the identity key's COMPOSITION as well as its
granularity: an emission timestamp inside the finding or ticket id converts every intended update
into an insert — the producer believes it maintains one record per resource while minting one per
run — and any resolve/archive path addressed by the same rule writes to the new id, closing a
record no consumer has ever seen while the original stays open forever — an identity field shared by every finding of one product
collapses all of them into a single ticket, while per-resource identity recreates the flood on
first import. Then fire the same event twice against live infrastructure and watch the target's
failure metric and dead-letter queue: an absorbed duplicate that lands as a failure will hold any
zero-threshold alarm on that queue permanently in alarm once steady-state refreshes resume.

**False positives.** Targets that are natively idempotent (upsert keyed on event identity, or a
ticketing system with server-side deduplication) — verify the key, not the vendor claim; sinks
meant to record every emission (append-only archives, metric streams); genuinely
once-per-transition sources feeding low-rate targets where one ticket per rare transition is the
intended paper trail; rejection paths demonstrably filtered out of the failure signal (a
dead-letter consumer or alarm that excludes the duplicate-rejection error code).

## G:38 — A compliance or findings producer with no freshness signal — silence is indistinguishable from a clean bill of health

**Statement.** A custom checker — a Config rule, a scheduled auditor, a Security Hub
BatchImportFindings producer — reports violations into a dashboard, and the dashboard is consumed
as current truth. But nothing watches the PRODUCER: no last-successful-run alarm, no dead-man
timer, no maximum-age check on the findings it emits. When the producer breaks (permission rot, a
lost schedule, a refactor orphaning its trigger), its last findings freeze in place: the feed's
silence reads as improvement, and its stale findings read as live problems that burn triage on
ghosts. Verification systems must themselves be verified — the test-suite version of this lesson
("a green suite is not evidence anything was captured") has a production twin: the checker whose
heartbeat nobody checks.

**Detect.** Inventory every non-AWS-managed findings producer. For each, locate its freshness
signal: a max-age alarm on the last successful run, a dead-man switch, or an alert on
newest-finding age. No signal = the finding. Then cross-check each producer's newest finding
UpdatedAt against its intended cadence — staleness beyond twice the cadence means the producer is
already dead and the dashboard is archaeology.

**False positives.** Producers deliberately decommissioned WITH their findings archived — an
orphaned ACTIVE finding set is precisely the failure, so archival is what earns the exemption;
event-driven producers with legitimately rare triggers — those need a synthetic heartbeat event,
and its absence is the finding, not an excuse.

## G:39 — A compliance evaluator that emits a cannot-evaluate status for deleted resources creates immortal findings no lifecycle ever closes

**Statement.** Per-resource compliance evaluators report a status for every resource they watch;
when a resource is deleted, some emit a cannot-evaluate status (NOT_AVAILABLE, "insufficient
data") instead of a closing one. The findings pipeline imports every status as an open finding,
its auto-resolution keys on an explicit PASS, and its archival keys on the evaluator re-reporting
the resource — which it never does for one it can no longer see. The finding is now immortal: it
keeps its original title, which described the CHECK ("public write prohibited"), not the outcome,
so the queue fills with entries that read as live exposures on resources that ceased to exist.
Observed in production: nineteen open "public bucket" findings, every one referencing a bucket
deleted weeks earlier, sitting above genuinely actionable work precisely because their titles
demanded triage first.

**Detect.** List open findings whose compliance status is a cannot-evaluate value, then
existence-check each referenced resource live; a deleted referent is an immortal finding. Age is
the cheap tell — a cannot-evaluate finding older than the evaluator's re-run period will never
update again. Then read the pipeline's archival contract directly: name the path that closes a
finding whose producer stopped reporting it, and if no such path exists, every future resource
deletion mints another immortal entry.

**False positives.** Transient cannot-evaluate during evaluator permission or throttling outages
— the existence check passes because the resource is alive, and the next evaluation cycle
resolves it; pipelines with a working stale-finding reaper — verify by finding an entry it
actually reaped, not by reading its configuration; deliberate forensic retention of
deleted-resource findings, distinguishable because they are marked resolved rather than open.

## G:40 — A compliance evaluator embeds its model of the system as code constants, so the checker drifts from the architecture it judges and errs in both directions at once

**Statement.** A custom evaluator needs a model of the system to judge it: which data stores hold
tenant data, which planes are exempt and why, what the sanctioned access patterns are. When that
model is written down as constants in the evaluator's own source — table lists, exemption sets,
plane prefixes — it freezes at authorship while the system keeps moving, and the checker begins to
err in both directions simultaneously: resources created after the freeze are invisible to
set-scoped checks (the newest, often most sensitive stores get no coverage), while planes built
after the freeze are judged by rules that never modeled them (whole function families flagged for
violating expectations that do not apply to their sanctioned design). Both failure modes are
silent: under-coverage produces no finding at all, and over-flagging produces findings that look
actionable. Observed in production: an isolation evaluator modeling 15 of 55 live tables — blind
to the transcript and consent stores created after its authorship — while flagging an entire
administrative plane whose sanctioned access path (tagged STS assumption) postdated the
evaluator's world-model. The same system already held a versioned, contract-style catalog of its
resources that the evaluator loaded at runtime — and read only the account id from it.

**Detect.** For every custom evaluator, find where its expectations come from. Constants in source
(resource name sets, exemption lists, prefix tables) are the defect surface: diff each set against
the live inventory it claims to model (list the real tables, functions, planes) and count what
exists in the system but not in the model, and what exists in the model but not in the system.
Then check whether a machine-readable source of truth the evaluator could derive from already
exists — a contract document, a tagged inventory, a registry the provisioner writes — and whether
the evaluator consumes it. An evaluator that loads a living catalog but reads only metadata from
it is one refactor away from never drifting again; note it as such. Expectation sources loaded at
runtime from the same artifact the system itself deploys (a live layer, a versioned contract) are
the sound pattern and need no flag.

**False positives.** Deliberately pinned models with a documented review cadence that is actually
observed (verify a past review happened, not that one is scheduled); evaluators whose scope is a
closed, finished subsystem that genuinely cannot grow; constants that are performance caches of a
living source refreshed at deploy time — verify the refresh mechanism exists and ran recently.

## G:41 — A ratio detector on a low-volume surface, saturated by one misbehaving client

**Statement.** A detective alarm is expressed as a RATIO — error responses over total requests —
because the absolute count varies with traffic. On a surface whose normal volume is small, a single
client stuck in a retry loop supplies both the numerator and most of the denominator, so the ratio
reports the fleet-wide condition the alarm exists to catch while that condition does not exist. The
alarm then straddles its threshold and flaps for as long as the client runs — days — and every
transition notifies. The detector is not merely noisy: it is now incapable of distinguishing one
broken client from total lockout, which is the only distinction it was built to make.

**Detect.** Take the alarm's own window during a firing and break the responses down by client,
credential and route. If one identity accounts for the majority, the ratio is measuring that client.
A detector for a fleet-wide condition needs a fleet-wide signal — distinct affected principals, or
the ratio computed with per-client contribution capped — and a per-client abuse control to stop one
loop from dominating. Count state transitions per day as the standing health check on any ratio
alarm.

**False positives.** High-volume surfaces where no single client can move the ratio; alarms
deliberately scoped to one client or one route.

## G:42 — The fail-closed dependency client names the transport status but never the resource requested

**Statement.** A shared client resolves configuration, parameters, or secrets and fails closed on
any non-success — correct behaviour. But the error it throws carries only the status code: not the
key requested, not the owning scope, not the operation. When it fires inside an asynchronous
consumer the work dead-letters with a stack trace that names the helper and nothing else, so the
dead-lettered item cannot be attributed to a resource, an owner, or a cause without manually reading
the queue. The fail-closed posture is sound and its diagnosability is zero.

**Detect.** Every fail-closed throw carries the identity of what it was resolving (the key or path —
never the value) and the caller's own context stamps the log line before the dependency is touched.
Read a real failure end to end and ask: from this log alone, can I name the record, the owning
scope, and the resource? If not, the instrumentation is the defect.

**False positives.** Paths where the identifier is itself sensitive — there, log a stable hash.

## G:43 — A vendor-side failure that never reaches our compute produces no metric, so a total outage is invisible

**Statement.** An integration's requests are validated and rejected by the vendor's own platform
before they are forwarded to the integrator's endpoint. Every alarm the integrator owns is defined
over its own telemetry — invocations, errors, latency — and all of them stay green, because there is
nothing to count. The capability can be one hundred percent dead for days and the only detector left
is a human noticing. Absence of traffic is the signal, and nothing watches for it.

**Detect.** For each externally-triggered capability, define a detector on EXPECTED activity, not on
errors: a low-volume or no-data alarm on the inbound metric over a window wider than normal quiet
periods, and a synthetic exercise where volume is naturally sporadic. Reconcile periodically with
whatever the vendor exposes (call/tool logs) so vendor-side rejections are pulled into our
telemetry.

**False positives.** Genuinely intermittent capabilities where the quiet window cannot be bounded —
there, prefer the synthetic probe to a volume alarm.

## G:44 — An absolute-count error alarm whose threshold exceeds the surface's own per-period traffic, so total failure cannot reach it

**Statement.** A detective alarm counts error responses in a fixed window and fires above an
absolute threshold. The threshold was chosen to mean "clearly abnormal" on a busy surface, but this
surface is sparse: its entire per-period request volume is smaller than the threshold. A complete
outage therefore produces a handful of errors, stays numerically below the trigger, and the alarm
reports healthy for as long as the failure lasts. Unlike the vanishing-datapoint case, the metric is
present and correct — it is the comparison that is unreachable. The alarm passes every review that
checks whether a detector exists, whether it has an action, and whether it has a sane
treat_missing_data, because the only thing wrong with it is a number no one compared against
traffic.

**Detect.** For every count-based alarm, pull the watched metric's own volume over the alarm's
period across a representative week and compare the ceiling to the threshold. If a 100% failure of
the surface yields fewer events than the threshold, the alarm cannot fire. Prefer a detector whose
sensitivity scales with volume — a small absolute floor combined with a rate, or an anomaly band —
and set it from the metric's real distribution, never from a round number. Any alarm that has never
left OK on a surface with known incidents is a candidate.

**False positives.** Alarms deliberately tuned to catch only mass events, where the low-volume
failure is covered by a separate detector; alarms on surfaces whose volume is genuinely large.

## G:45 — The checker names one unconditional remedy for a failure it can reach in several states, and for the commonest state that remedy is rejected by the platform, so operators repeat an impossible action instead of finding the cause

**Statement.** A drift or parity checker detects that a resource is out of step and, to be helpful,
prints the fix: "publish a new version and update the alias," "re-run the apply," "redeploy." The
remedy string is emitted unconditionally from the single failing branch, because the author had one
cause in mind when writing it. The resource, however, can be out of step for several distinct
reasons, and for at least one of them the platform will refuse the named operation outright — a
mutation blocked by another attribute on the same resource, an update rejected while a dependent
configuration is in a failed state, an operation forbidden by the very condition that produced the
drift. An operator following the instruction gets a rejection, assumes a transient, and repeats it;
the true cause goes unexamined for as long as the loop holds. The damage exceeds the wasted attempts
in two ways. First, an authoritative-sounding remedy that cannot work teaches operators to distrust
the checker generally, which is more expensive than a checker that says only "failed." Second, the
same unconditional framing tends to appear in the human-facing digest or runbook built on top of the
checker — "just needs an apply" — where it is read as clearance, and acting on it against a resource
whose drift is load-bearing (an undeclared weight, a hand-applied workaround, a preserved-by-accident
state) converts a reporting defect into an outage. Lag is not a severity: a resource can be maximally
out of step and maximally load-bearing at the same time, and a report that conflates the two is
recommending the outage.

**Detect.** For every checker that prints a remedy, enumerate the distinct states that reach that
branch and, for each, confirm against the platform's documented semantics — and preferably against a
live probe — that the named operation is actually permitted in that state. Any state where it is
refused is the finding. Require the diagnostic to describe the observed state before naming an
action, and to derive the action from the state rather than from the branch; where the correct
sequence differs by cause, each cause gets its own sequence. Check the runtime cost of the extra
facts before assuming the richer diagnosis is expensive — the distinguishing attributes usually ride
along on a call the checker already makes, and the conditional second lookup runs only for the rare
failing resource. Then sweep the operator-facing layer built on the checker: any digest, runbook, or
summary that converts a drift list into a to-do, or that closes with a blanket "once the tree is
caught up," inherits the defect at higher blast radius and must be corrected in the same change.
Where detection already exists in one checker, extend it rather than adding a second — and name the
existing checker's real path in the runbook, because a path that does not resolve reads as absent
coverage and invites exactly the duplicate the extension was meant to prevent.

**False positives.** Checkers whose failing branch genuinely has one reachable cause, proven by
enumeration rather than assumed. Remedies phrased as a diagnosis to investigate rather than a command
to run. Environments where the blocking attribute cannot occur because it is prohibited by policy and
that policy is enforced, not merely documented. Advisory output clearly marked as a starting point,
consumed only by engineers with the resource in front of them.

## G:46 — The batch summary's outcome counters omit a branch, so the tallies do not sum to the candidate count and a real drop is reported as indistinguishable from a benign no-op

**Statement.** A periodic job iterates a candidate set and emits one summary line holding a count of
candidates and a counter per outcome — written, skipped, failed. The per-item worker returns a
boolean or a status, and the loop increments a counter only on the affirmative branch: `if (wrote)
written += 1`, with no else. The worker, however, returns its negative value for several materially
different reasons — the work was already done for this period, a concurrent runner won the write,
validation rejected the output and dropped it — and every one of them increments nothing. Two
consequences follow, and the second is the dangerous one. First, the summary's arithmetic silently
stops closing: `written + skipped + failed` is less than the candidate count, which means the line
can never be used to prove that every candidate was accounted for, and the summary's whole value as
a coverage signal is gone. Second, and worse, the benign uncounted case (already done) and the
harmful uncounted case (output produced, validated, rejected, discarded) are rendered identically —
which is to say, not rendered at all. The drop is usually logged on its own line by the worker, but
the summary is what operators read, what dashboards chart, and what a metric filter is built on, so
a systematic validation failure can run indefinitely while the one line anybody looks at reports a
steady, healthy-looking zero. Codebases that document the drop as happening "loudly" in a header
comment while the summary swallows it are the common shape, because the loudness was implemented at
the worker and never propagated to the tally.

**Detect.** For every batch or sweep summary, assert the arithmetic first: does the sum of the
outcome counters equal the candidate count, on real production log lines, across several runs? Any
run where it does not is the finding, and the gap size tells you how many items took an uncounted
branch. Then read the per-item worker and enumerate every distinct value it can return along with
the condition producing it; require a counter, distinctly named, for each one — "already present"
and "rejected by validation" must never share a bucket or share the absence of one. Treat the header
comment as a claim to verify rather than as evidence: where documentation says a failure is loud,
follow that path to the summary line and confirm it appears there. Where a metric filter or alarm is
built on the summary, check which counters it reads, since a counter that exists but is not emitted
as a metric is only marginally better than one that does not exist. Finally, prefer a summary that
also states the candidate count and asserts its own closure, so that a future branch added without a
counter fails visibly rather than quietly widening the gap.

**False positives.** Loops whose worker genuinely has one negative reason, proven by enumeration
rather than assumed. Summaries whose uncounted branch is a documented, separately-metricked terminal
state that the operator surface displays alongside the summary. Jobs where the candidate count is
itself approximate (sampled or streamed) so exact closure is not expected — verify the approximation
is stated. Debug-level per-item lines that already carry every outcome, where the summary is
explicitly a convenience rather than the coverage signal.

## G:47 — An alarm on an idle-by-design metric keeps the platform's default missing-data policy, so the metric's normal absence is a distinct third state and every idle boundary crossing is delivered as an alert

**Statement.** Error counters, throttle counters and per-function fault metrics on a low-traffic
or event-driven workload emit nothing at all for most evaluation periods — not zero, nothing.
Left at the platform's default missing-data treatment, absence is neither healthy nor breaching
but a third state, so the detector oscillates between that state and healthy on the boundary
between an idle window and a busy one. The oscillation has nothing to do with the threshold: the
metric never breached, and raising or lowering the number changes nothing. It becomes an
operational defect rather than a cosmetic one when the notification wiring publishes both the
breach transition and the recovery transition to the same channel, which is the common
configuration — then each idle boundary is two messages, the channel's volume is dominated by
detectors that have never once fired on a real fault, and the population of alarms in the
not-healthy state at any instant is permanently non-empty, so "is anything wrong right now?"
cannot be answered by looking. Reviews miss it because each alarm is individually defensible and
the defect is only visible in aggregate transition counts.

**Detect.** Pull state-transition history for every alarm over a multi-day window and rank by
transition count; for each of the top entries, read the missing-data policy and then the
underlying metric's datapoint density over the same window. A high transition count against a
sparse series and a default missing-data policy is this finding — confirm by checking that the
breach threshold was never actually crossed. Cross-check the notification wiring: recovery
actions pointing at the same destination as breach actions turns every transition into traffic.
The remedy is to declare absence explicitly as healthy for counters where zero events genuinely
means zero faults, leaving the threshold untouched.

**False positives.** Detectors whose PURPOSE is to catch a signal going away (heartbeats,
liveness, throughput floors), where absence must remain breaching or missing — see the
disappearance-detector rule; metrics that emit a real zero every period rather than nothing, which
cannot enter the missing state at all; and alarms whose transitions are genuinely threshold
crossings, which is a sensitivity question and a different finding.

## G:48 — The alarm's metric is never published because the emitting principal is not authorized to publish it, and the emitter catches the authorization error, so the job reports success and the alarm reports health

**Statement.** A drift, reconciliation, or invariant watchdog is built as a pair: a job computes the quantity and publishes it as a custom metric, and an alarm on that metric pages when it goes non-zero. The job is deliberately read-only and treats telemetry as best-effort, so its publish call is wrapped in a try/catch that logs and continues — correct, in isolation, because a metrics outage must not fail a reconciliation. If the job's execution role lacks the publish permission, that catch absorbs an authorization denial on EVERY run: the job completes successfully, its own success/error signals stay green, and the metric is never created at all. The alarm, written with missing data treated as not-breaching, then reports healthy forever — not because the invariant holds, but because nothing has ever been measured. Every artifact a reviewer would consult agrees the watchdog is armed: the alarm exists in the IaC with the right namespace and dimensions, the job runs on schedule and succeeds, and the change that introduced them is recorded as complete. The permission gap is the only place the truth lives, and it is in a different file — often a different stack — from both halves of the pair. The signature is a custom-metric namespace that contains some of the metric names its code emits and not others: metrics published by one role appear, those published by the under-privileged role are simply absent, which reads as "idle" rather than as "denied".

**Detect.** Do not verify a custom-metric alarm by reading the alarm. List the namespace's metrics live and assert that each alarmed metric name is actually PRESENT; an alarmed name missing from the namespace listing is this defect until proven otherwise. Then close the loop from the producer side: for every custom metric the code emits, resolve the emitting function's execution role and simulate the publish action against it — an implicit deny is proof, and it is invisible in the emitter's own source. Read the emitter's logs for a caught publish failure recurring once per scheduled run; an authorization message repeating at the job's exact cadence, under a log level the job's own health alarm does not gate on, is the same finding observed from the other end. Where an alarm treats missing data as not-breaching, treat "never had a datapoint" and "healthy" as indistinguishable and require the datapoint before accepting the alarm as coverage. Comments asserting cadence — "a zero datapoint every run, so OK is a datapoint, not missing data" — are a claim about a publish that may never have succeeded; check it against the series, not the comment.

**False positives.** Metrics genuinely not yet emitted because the emitting feature is unreleased or the schedule has not yet run for the first time, where the alarm is knowingly ahead of its producer; namespaces whose metrics have aged out of the listing window after a long idle period, which is absence of recent data rather than absence of authorization — distinguish by querying the series over a longer window; emitters that publish through an agent or extension under a different principal than the function role, where the role simulation is the wrong subject; and best-effort telemetry that is explicitly documented as non-load-bearing and is not the sole evidence for any alarm.

## G:49 — The noise exclusion is a denylist of the injected layer's literal message strings, so every new error shape the vendor emits silently re-contaminates the signal

**Statement.** A platform has already found and fixed the injected-instrumentation problem — an agent
or wrapper the application did not write logging its own faults at the application's error level — by
excluding those records at the filter. The exclusion is written as a list of literal substrings taken
from the fault messages observed at the time ("export took longer than", the exporter class that was
failing that week), rendered into the filter pattern as negative match clauses. That list is a denylist
over a set the vendor owns and extends. The instrumentation layer has many error shapes — transport
errors, serialisation errors, authentication errors against the collector, each with its own class name
and message — and only the ones that happened to be firing during the investigation are enumerated.
The next time the collector fails a different way, the new shape passes straight through the exclusion
and is counted as an application error again. The regression is silent and looks exactly like the
original defect, but every artifact says it was fixed: the rule exists, the comment explains the
mechanism in detail, and a reviewer who checks that the exclusion is present concludes the class is
handled. Because the enumeration is usually written once in a shared local and rendered for the whole
fleet, one missing shape re-contaminates every function's error signal at once.

**Detect.** Find the exclusion list and treat its length as the finding: any filter that separates
first-party from injected records by enumerating the other party's literal strings is unbounded by
construction. Enumerate the injected layer's actual error surface from its own published source — the
set of error classes it can throw — and compare against the list; anything absent is live exposure.
Then prove it from the log plane rather than the config: query the group for records at error level
that the application's own code cannot have written (a stack frame inside the injected layer's file
path, an error class the application does not define) and check whether the metric filter matched them.
Prefer an inclusion test over an exclusion list — match the application's own structured envelope, or
the presence of its correlation id — so that an unrecognised record is excluded by default instead of
counted by default.

**False positives.** Exclusions written against a first-party component whose full error vocabulary is
enumerable and enforced by the same repository's types. Filters that already anchor on a positive
first-party property and use the substring list only for ranking or dashboards, where a miss costs
tidiness rather than a false alarm. Layers that emit every fault under one stable prefix the vendor
documents as its contract, where the enumeration is the vendor's own namespace and not a sample of it.

**Repair order (lesson, 2026-09).** The exclusion list is usually the residue of a catch-all that had to exist because the positive vocabulary was incomplete: on the instance that reopened this rule, a level-based catch-all survived two fixes because 137 first-party messages in 48 functions were logged at the error level but enumerated nowhere, so deleting the catch-all first would have silently uncounted them. Repair in this order - measure the gap between what the code logs at the error level and what the filter enumerates, close it, make completeness a gate the tree cannot pass without (every literal handed to an error-level log call must be in the list; free text at that level is refused), and only then delete the catch-all in favour of a positive anchor the injected layer cannot produce, such as the runtime's own error-record shape. Deleting the catch-all first trades a loud false alarm for a silent blind spot.

## G:50 — Alerting is wired for the breach transition only, so the channel reports what broke and never what recovered

**Statement.** Alarms are created with a notification action on the breach transition and no action on
the return to healthy. Each is defensible alone — the recovery is "not an incident" — but applied as
the default across a fleet it makes the alert channel structurally unable to answer the question the
operator actually asks: is this still happening? Every alarm that has ever fired leaves a permanent
unanswered message, so the channel accumulates breaches with no matching resolutions and the only way
to learn that something recovered is to leave the channel and query the alarm state directly. The
second-order harm is worse than the clutter: an operator who fixes a fault sees no confirmation, so a
successful remediation and a still-broken system produce an identical inbox, and a flapping alarm and
a latched one are indistinguishable from the notifications alone. It is invisible in review because
each alarm's definition looks complete, the omission is a field that is absent rather than wrong, and
the count only becomes legible when the whole fleet is enumerated at once.

**Detect.** Enumerate every alarm in the account and partition by whether a breach action is set and a
recovery action is not; report the ratio, not examples — this is a fleet-shaped finding and a handful
of instances reads as intentional. Cross-check against the notification destination itself: a channel
whose message history contains breach subjects and no recovery subjects over a window in which alarms
demonstrably returned to healthy is the same finding observed from the receiving end. Where a shared
module or factory creates alarms, fix it at the definition site so the default carries both, and treat
any alarm that deliberately omits recovery as owing a stated reason in its description.

**False positives.** One-shot or informational alarms that cannot meaningfully recover (a budget
threshold crossed for the period, an audit event counter). Destinations that already correlate
transitions themselves — an incident manager or paging tool consuming the state-change event stream
directly rather than the notification topic — where the topic is not the operator's channel. Alarms
whose recovery is deliberately routed to a quieter destination, which is a design and not an omission,
provided the quieter destination exists.

## G:51 — A designed retry signal and a genuine fault leave through the same catch at the same log severity, so the detective alarm keyed on that severity fires on normal operation

**Statement.** A queue consumer implements at-least-once delivery by throwing on a condition it
expects and intends to retry — a sibling record not yet written, a resource not yet converged —
and bounds the retry by delivery count. The throw travels to the handler's outer catch, which
exists for infrastructure and model failures and logs at error severity before reporting the
item for redelivery. Both paths are now indistinguishable to everything downstream. A
fleet-wide detective alarm counting error-severity emissions therefore fires on the system
working exactly as designed, and resolves a few minutes later when the redelivery succeeds,
producing a page with nothing to do. The surrounding code usually proves the intent was
otherwise: the same function's other non-events are logged at warning severity, and only the
catch-all is error. The nuisance is the visible harm; the suppression is the real one, because
alarms notify on state transition — while the expected condition holds the alarm in breach, a
genuine fault arriving in that window pages nobody, and the recurring benign page teaches
operators to read the alarm's name as noise before it ever carries a real one.

**Detect.** For each alarm keyed on a log severity or a caught-error metric, walk backwards to
every emission site the filter matches and classify each by whether the condition is expected
and self-healing. Any throw the code itself creates for control flow — recognizable by a
purpose-named error, a delivery-count or attempt bound around it, and a comment describing the
retry — that lands in a catch shared with genuine failures is the finding. Compare severities
within the one function: where sibling non-events use warning and only the shared catch uses
error, the intended classification is already documented in the file. Confirm against the alarm
history rather than the code alone — a breach that resolves on its own within roughly one
redelivery interval, repeatedly, with no operator action recorded, is this pattern. Check
whether the retry is bounded and what happens at the bound: the exhausted case is a real fault
and must keep the loud severity.

**False positives.** Retries whose exhaustion is the only signal, where the per-attempt log is
already at a quieter severity and the alarm keys on the dead-letter surface. Conditions that
look expected but are not bounded — an unbounded retry on a condition that never clears is a
genuine fault wearing a retry's clothes. Systems where the error-severity emission is
deliberately the intended trigger and the alarm is tuned to a rate that normal retry volume
cannot reach; verify that the tuning exists rather than inferring it from the absence of pages.

## G:52 — The monitor stays in the environment the workload left, so it latches on a resource that no longer exists while the live twin's silence looks identical to health

**Statement.** Monitors are declared beside the resource they watch, so when a workload is
relocated the monitor is rebuilt in the destination and the original is left running in the
origin. Its metric source is gone, and which way it fails is decided by a detail nobody chose:
a threshold on a healthy-count metric evaluates the absence as zero and latches into a permanent
firing state, while a threshold on an error-count metric evaluates it as nothing and sits
permanently green. Both outcomes destroy the signal. The latched one is the more expensive,
because the fix that responders reach for is to stop believing that alarm name — and the alarm
name is shared with the destination's real monitor, so the habit that quiets the dead one also
quiets the live one. Meanwhile the permanently-green variety is indistinguishable from a healthy
service, which is precisely the state a decommissioned monitor should never be able to claim. The
underlying error is that a monitor is treated as a property of the resource rather than as an
assertion about a running system, so nothing checks that the thing being asserted about still
exists.

**Detect.** Take the inventory of firing and long-quiet monitors in every account and join it to
the inventory of the resources they name. Any monitor whose dimension resource is absent from
that account is the finding, regardless of which state it is stuck in. Sort firing monitors by
how long they have held that state: anything firing continuously for longer than the incident it
would represent could plausibly last is either a dead monitor or an unhandled incident, and both
demand an answer. For the permanently-green half, do not read state — read datapoint recency,
since a monitor with no datapoints in the evaluation window is making no assertion at all. When
the same monitor name exists in two accounts, name them distinctly or delete one; identical names
across a migration boundary are what convert a stale alarm into distrust of a live one.

**False positives.** Monitors deliberately retained over a cutover window while the origin can
still take traffic. Monitors on metrics that are legitimately sparse, where missing data is
correctly configured as not-breaching and the absence of datapoints is the expected steady state —
verify the missing-data treatment was chosen rather than defaulted. Composite monitors whose
children carry the real assertions.

## G:53 — The alarm names a sibling monitoring construct inside a metric-math expression, by a string the template builds itself, and the not-breaching treatment renders the mismatch as health

**Statement.** Some monitors do not watch a service metric directly; they watch the output of
another monitoring construct — a log-analysis rule, a synthetic canary, a published custom
metric — pulled in through a metric-math function that takes the construct's NAME as a quoted
string argument. That string is the only link between the two objects, and it is usually not a
reference to the construct's resource: it is composed in the template from a prefix plus an
interpolated identifier, in a naming convention someone intended the other side to follow. If the
construct's declared name does not match the composed string, nothing anywhere objects. The
provider does not resolve metric-math arguments at plan time, so the apply succeeds; the
dependency graph sees no edge between the two resources, so ordering and drift detection have
nothing to say; and the alarm object exists afterwards with correct-looking math. The runtime
result is a query for a construct that does not exist, which returns no data rather than an
error. Whether that reads as broken depends entirely on the missing-data treatment, and the
treatment chosen for this class is almost always not-breaching — correctly, because the healthy
steady state genuinely produces no datapoints. So the alarm reports OK from birth and never
leaves it. Every check that would normally catch a dead monitor now confirms it: it exists, it is
attached to a notification channel, its state is the good one, and it has never flapped. The
detector is counted as coverage for exactly the failure it can no longer see, and because this
shape is chosen for cardinality and log-derived signals — the ones written to catch total,
silent, everything-is-refused outages that emit no ordinary error metric — the coverage that is
fictional is the coverage of last resort.

**Detect.** Enumerate every alarm whose definition contains a metric-math expression, and extract
each quoted name it passes to a function rather than each dimension it sets. Resolve every one of
those names against the live inventory of the construct type it refers to — log-analysis rules,
canaries, custom metric namespaces — and treat an unresolvable name as the finding regardless of
alarm state. Do not screen by state: unlike a dimension pointing at a deleted resource, this
defect presents as OK, so state-based and never-fired-since-creation sweeps skip it. Datapoint
recency is the runtime tell — an alarm evaluating a math expression that has produced zero
datapoints for its whole lifetime is making no assertion. In the IaC, a composed name string
where a resource attribute reference was available is the static tell; compare the composition
against the referenced resource's own name attribute in whichever file declares it, which is
frequently a different stack or component from the alarm.

**False positives.** Constructs deliberately provisioned outside the IaC whose names are stable
and verified live. Expressions whose named argument is a metric or namespace rather than a
resource. Alarms on genuinely sparse signals where zero datapoints is the correct steady state —
distinguish by resolving the NAME, never by reasoning about the data volume, since both cases
look identical from the metric alone.

## G:54 — The compliance evaluator accumulates verdicts for a whole population and publishes once at the end, so one member's unguarded dependency read discards every verdict in the batch

**Statement.** A scheduled compliance rule enumerates a population, evaluates each member into an
accumulator, and submits the accumulated verdicts to the compliance service in a single call
after the loop. Individual checks inside a member's evaluation are usually defended — a read that
may legitimately be absent is wrapped and converted into a recorded issue — but at least one
dependency read is not, typically one considered infrastructural rather than a check: a lookup
against a shared table, a registry, or a peer service that the author reasoned must exist. When
that read throws, the exception escapes the member's evaluation, escapes the loop, and aborts the
invocation before the submit call is reached. Nothing is published — not the failing member's
verdict, and not the verdicts of every member already evaluated successfully. The compliance
service does not interpret an absent submission as a problem: it keeps each resource's last
recorded verdict indefinitely, so the dashboard continues to show the population as it was on the
last run that completed, in the good state, with no marker that the evidence is stale. The rule's
failure is therefore visible only in its own invocation telemetry — an error metric, a
retry-exhaustion record on a dead-letter queue — which is a different surface from the compliance
report it exists to produce, watched by different people. The batch shape is what converts a
one-member fault into total silence: the same defect in a per-member submit would have cost one
verdict.

**Detect.** For every evaluator that builds a list and submits after the loop, list the awaited
calls on the per-member path and classify each as guarded or unguarded; any unguarded call to a
dependency outside the resource under evaluation is the finding. The asymmetry is the quickest
tell — a function whose optional reads are wrapped and whose one mandatory read is not was
reasoned about member by member and never as a batch. Confirm at runtime: compare the timestamp
of the rule's most recent published evaluation against its invocation schedule. A verdict older
than several evaluation intervals on a rule whose function is being invoked is this defect, and
it is the only signal that separates it from a rule that is genuinely evaluating and finding
nothing. The correct shape is a per-member catch that publishes an explicit
could-not-evaluate verdict, so that failing to check is never recorded as having checked.

**False positives.** Evaluators whose submit call is itself inside the loop, where a member's
failure costs only that member. Rules that deliberately abort a run on a dependency failure AND
publish a not-evaluable verdict for the whole population before exiting. Populations of one,
where batch and per-member are the same thing.

## G:55 — The workload was rebuilt in a new account and its alerting fan-in was not, so the alarms there name notification targets that do not exist and the account is deaf while every alarm looks correctly wired

**Statement.** Alarms are declared beside the workload they watch and address their notification
target by a composed ARN — account, region, topic name — so the same code produces correct-looking
alarms in whatever account it is applied to. The fan-in itself is not part of any workload: the
topics, their subscriptions, and the delivery integration behind them live in a shared or platform
stack, declared once, and that stack is usually the last thing anyone relocates because nothing in
the workload's own plan depends on it. Applying the workloads into a new account therefore creates
the alarms and none of their destinations. The cloud provider does not validate an alarm's action
ARN at creation, and a publish to a nonexistent topic at fire time fails silently: no error is
surfaced on the alarm, no failure metric is emitted, and the alarm's own state machine transitions
exactly as designed. Every property an operator or a coverage review checks — the alarm exists, its
threshold is right, it has an action, it has transitioned recently — is true. The second form is
quieter still: a target that does exist with zero confirmed subscriptions, which is a valid,
successful publish to nobody. Both usually appear together, because the same relocation that left
the topics behind also left the subscriptions behind. The result is an account carrying a full
complement of alarms and no path from any of them to a human, and its severity scales with the
move: the newly-populated account is typically the one now holding the data plane and the
customer-facing surface, so the alerting that went dark is the alerting that matters most, and the
first evidence anyone gets is an incident found by other means.

**Detect.** Do not audit alarms in the account they were written for; audit them in the account
they now run in. Enumerate every alarm's action ARNs, reduce to the distinct set of targets, and
resolve each one live in THAT account — a not-found is the finding, and count the alarms behind it
rather than reporting the target once, because the number is the argument. For every target that
does resolve, read its confirmed-subscription count; zero is the second form of the same finding.
Then prove the path end to end rather than by configuration: take an alarm that actually
transitioned in the recent past and look for its delivery at the far end — the mailbox, the
channel, the event feed — and treat a transition with no corresponding delivery as confirmation.
Cross-check the origin account for the topics of the same names, which is where they will be, and
which also explains why the alerting looks healthy to anyone testing from there.

**False positives.** Deliberate cross-account alerting, where the alarm's action ARN names the
ORIGIN account's topic and that topic's policy permits publishing from the new account — verify the
policy rather than the ARN's shape. Accounts in a staging phase where the alerting stack is a
named, pending step. Alarms whose only action is an autoscaling or systems-manager action rather
than a notification, which have no human destination by design.

## G:56 — A workload relocation moves the emitters but leaves their metric filters and alarms bound to the origin's now-empty log destinations, so coverage counts stay whole while nothing is watched

**Statement.** When workloads move between accounts, regions, or infrastructure layers, the move is scoped to the things that serve traffic — functions, roles, queues, endpoints — because those are what the cutover plan is written against. The observability layer that watched them is usually declared somewhere else entirely: a central monitoring stack holding a hand-kept map of every workload, from which metric filters and alarms are generated. That stack is not part of the cutover, so its filters stay attached to the ORIGIN's log destinations, which after the move receive nothing. The alarms remain present, enabled, and correctly configured; they simply evaluate a metric that no longer has a publisher. Missing data on such an alarm is conventionally treated as not-breaching, so the alarm sits in a permanently healthy state, and any coverage verifier that counts alarms per workload still reports full coverage — the resources all exist. The system is therefore blind for the entire interval between the workload move and the monitoring move, and blind in the most dangerous way: with a green board and a passing coverage gate asserting that it is not.

**Detect.** For every relocation, list the observability resources that named the moved workloads and prove where each one is declared; any that live outside the moved unit are suspects. For each suspect, confirm against live state rather than IaC: read the origin log destination's most recent event timestamp, and read the alarm's state history for the period since the move — an alarm with no state transitions across a window in which the workload demonstrably served errors is the finding. Treat a coverage verifier's pass as evidence of nothing until you have checked what it counts: verifiers that assert existence of an alarm per workload cannot see that the alarm is pointed at an empty source. Compare the emitter's real destination against the filter's declared source directly.

**False positives.** Deliberate dual-running windows where the origin still receives traffic and both sets are intentionally live; alarms sourced from service-level metrics published by the platform rather than from log filters, which follow the workload automatically; monitoring that was moved in the same change and whose apparent silence reflects a genuinely quiet workload — establish the workload was actually invoked before calling the alarm blind.

## G:57 — A per-event alarm placed on a condition that is permanent until someone acts clears itself after every occurrence, so a standing defect is rendered as a series of short blips that nobody reads as one thing

**Statement.** An alarm is added to close a "miss path has no signal" finding, and it is shaped
for the event it was written against: threshold one, a single evaluation period, missing data
treated as not breaching. That shape is right for a transient fault — a failed call, a rejected
write — where each occurrence is its own incident. It is wrong for a condition that persists
until a human acts: a reference table that was never seeded, a store built empty by a
relocation, a permission that was never granted. Such a condition produces one event per
request that touches it, so the alarm enters its firing state for one period after each
request and returns to healthy as soon as traffic pauses. The notification channel receives
a scatter of alarm-then-recovered pairs, spaced by whatever the request rate happens to be,
and every recovery message says the problem went away. Readers learn to treat the pair as
noise, and nothing in the stream says that the condition has been continuous since a
particular date. The signal exists, has fired, and has been delivered, and the defect is still
invisible — the worst of the three outcomes, because a later audit finds the alarm, finds its
history, and reasonably concludes the estate was watching. The alarm's own history is the only
record of persistence, and only when read as a whole.

**Detect.** For every alarm whose metric is a log-token count, ask what the token means: does
it mark an event that ends with the request, or a state that will still be true on the next
request? For a state, a per-event alarm shape is the finding, whether or not it has fired.
Read the alarm history over a long window and look for repeated firing-and-recovering pairs
against the same token; three or more pairs with no intervening fix is a standing condition
being reported as blips. Then verify the condition directly — read the store, the grant, the
row — rather than the alarm. Confirm the fix owns both halves: a standing check (a scheduled
probe that reads the thing the token complains about and stays in alarm until it is present)
beside the per-event detector, never instead of it.

**False positives.** Tokens that genuinely mark per-request faults with independent causes;
alarms that latch by design (a queue depth, a gauge) and therefore cannot self-clear; an
alarm whose recovery message is deliberately suppressed and whose runbook treats the first
firing as a ticket, when that runbook is demonstrably followed.


## G:58 — A log-token monitor names a token on a function that never emits it because the emitter lives in another workload's log group, so the alarm is dead and the coverage gate stays red on trunk

**Statement.** Monitoring is declared per function as a list of log tokens, and a static
coverage gate checks that every declared token is emitted by that function's source. A
token is named on the function that owns the domain event ("booking created") while the only
code that emits it runs elsewhere - a tool server, a stream consumer, a sibling function -
writing to a different log group. The metric filter on the named function matches nothing
forever, so the alarm never fires, and the coverage gate fails on trunk with a message that
reads like a housekeeping nit. Because the gate belongs to the slow certification lane rather
than the landing lane, the red persists across every landing, every stack's certification
fails at the same step before it starts, and the debt of unpaid certifications grows with no
one stack to blame.

**Detect.** For every token in a function's monitor entry, find the emitter by searching the
whole repository, not the function's directory; when the emitter is another workload, the
token is on the wrong entry. Run the coverage verifier on trunk itself, not only in a work
tree, and treat a red on trunk as a finding whose owner is the domain that declared the token.
Check which lane the verifier runs in: a coverage gate that only the certification lane runs
cannot stop the landing that broke it.

**False positives.** A token intentionally declared on the function that will emit it in the
same change (the config and the code land together); tokens listed in an explicit emission
exemption with the runtime path that carries them.

## G:59 — Event-bus rule armed for telemetry the source only emits through an opt-in publisher that was never configured, so the rule is enabled, counts as coverage, and can never fire

**Statement.** Some services emit their operational events only through an opt-in publishing
container attached to the emitting resource — a sending configuration set, a notification
configuration, an event-destination binding. The events themselves are first-class and
documented, so a bus rule written against their source and detail-types is spelled perfectly and
is accepted by the bus. It is also permanently silent, because nothing upstream has been told to
publish. This is the event-bus analogue of the opt-in metric family (G:22), and it is strictly
harder to see: an alarm on an unpublished metric at least sits visibly in ALARM or
INSUFFICIENT_DATA forever, whereas an enabled rule that has never matched is byte-for-byte
indistinguishable from a rule guarding a condition that has simply not occurred. Silence is the
expected reading. Every review artifact reinforces the error — the rule is present, ENABLED, its
pattern is correct, its target is wired, and its description states the health question it
answers — so coverage reviews, dashboards and audit checklists all count it as protection for a
signal that has never once been produced. It is distinct from a consumer whose event vocabulary
no producer emits (E:26): there the names are wrong; here the names are right and the producer
is switched off. The blast radius is the whole class of conditions the events carried, which for
delivery and reputation telemetry is typically the one class that also throttles or suspends the
service when it goes unattended.

**Detect.** Do not read the rule; read the emitting side. For every bus rule, name the resource
that would produce its events and query live whether the opt-in publisher exists and is attached
to that specific resource — the account having zero such containers is the unambiguous form. Then
confirm the negative directly: search the rule's target sink for any event of those detail-types
over a window in which the underlying activity certainly occurred, and treat zero as the finding
rather than as quiet. The IaC signature is a rule whose description names the publishing
container by name while no resource of that type is declared anywhere in the tree — a description
that references infrastructure the repository does not create is the cheapest grep in this rule.
Beware the account trap: run the check under credentials for the account that actually emits, not
whichever the session happens to hold.

**False positives.** Sources that publish the detail-types unconditionally, with the container
affecting only enrichment or routing. Rules deliberately pre-armed ahead of a publisher being
switched on, where that sequencing is written down. Windows in which the underlying activity
genuinely did not occur — establish the activity independently before calling the silence a
defect.

## G:60 — Edge-security alarm whose threshold sits below the volume of hostile traffic the control is built to block, so the control's ordinary success is delivered as an incident several times a day

**Statement.** A perimeter control — a web ACL, an IP-reputation list, a bot ruleset — is placed in
front of an internet-facing endpoint and given a "blocked requests spiked" alarm, on the reasoning
that a surge of blocks is worth knowing about. The threshold is chosen from the endpoint's own
legitimate traffic, which for a machine-to-machine endpoint is tiny. What actually arrives at any
public address is continuous background scanning, and the managed reputation and bot rules block it
by the hundred without the workload ever seeing a packet. The alarm therefore measures the control
working, and crosses its threshold whenever the ambient scanning rate does — several times a day,
each crossing delivering an ALARM and, minutes later, an OK, to whichever channel the security
topic feeds. The signal inverts: the metric that would identify a real, targeted flood is the same
metric that fires on the daily weather, so the one crossing that matters is indistinguishable from
the thirty that do not, and the channel is trained to be deleted unread. Unlike an over-matching
detective filter (G:28), nothing here is misconfigured in the filter sense — the rule blocks
exactly what it should; the defect is that the threshold was calibrated against the served traffic
rather than the offered traffic.

**Detect.** For each blocked-request alarm, pull the same window's totals for both series: requests
blocked and requests allowed, broken out per rule. A blocked total that is an order of magnitude
above the allowed total, dominated by a managed reputation or bot rule, is ambient scanning and not
an event. Then count the alarm's state transitions over a representative multi-day window: any
detective alarm transitioning daily is reporting weather. Confirm by attributing the blocks — a
spread across many source countries and generic scanner signatures is background; a concentration
on one source or one path is the real thing the alarm was meant for.

**False positives.** Endpoints whose legitimate traffic genuinely exceeds the scanning floor, where
the threshold does separate the two. Alarms deliberately set as a volume telemetry feed into a
dashboard rather than a notification channel — check where the actions route before filing.
Freshly exposed endpoints during the first days of discovery, where the elevated rate is transient.

## G:61 — A log consumer names events from a structured field the fleet never emits, so its output collapses to one constant fallback label — the table fills, the console renders, and every row says the same thing

**Statement.** A derived signal — an error index, a triage table, a "what is failing for this
customer" view — is built to read a name from a structured field of the log record: an event
key inside a JSON message, an error code. The producers, meanwhile, write their errors through
a formatter that joins arguments into one string (a token followed by an inspected object,
under a JSON log envelope). The field never exists, so the consumer's fallback runs on every
record, and when the fallback is a constant ("unhandled_error", "unknown") every row carries
it. The artifact then looks healthy in every way that does not involve reading it: rows are
written, counts increase, the console renders, the writer's own health alarm stays quiet
because writing succeeded. The signal carries no information and reads as coverage. When the
fallback is also a level-based catch-all, anything the runtime or an injected layer logs at
that level — a wrapper's diagnostic, an export failure — becomes a row with the same constant
name, so the noise floor and the real errors are indistinguishable in the one place staff look.

**Detect.** Put the consumer's parsing code beside a live sample of the producers' records —
sampled from the log groups, not inferred from the shared logger's intent — and check that the
field the consumer reads is present in the sample; if it is not, read the table the consumer
writes and count distinct names, and treat a dominant constant as the finding. Find the
fallback branch whose output is a fixed string; every record it names is one the consumer did
not understand. Ask whether any alarm on the writer can tell "wrote nothing useful" from
"wrote" — invocation errors and throughput cannot.

**False positives.** A consumer whose fallback is to drop the record, so rows exist only for
shapes it understood; a fleet that genuinely emits the structured field the consumer reads,
verified per function on live records; a constant label used deliberately as the bucket for a
bounded, documented class that has its own alarm.

## G:62 — Findings from a custom detective control are imported on every run but nothing in the pipeline ever transitions one, so a sanctioned posture and an unremediated violation are the same untriaged row and the severity label stops discriminating

**Statement.** A first-party compliance rule evaluates the estate on a schedule and imports its
failures into the organization's findings store as high-severity rows. The import path is complete and
the re-import keeps each row's timestamp current, so the control looks healthy and its evaluation count
is cited as evidence that the estate is watched. What was never built is the other half: no step in the
pipeline, and no human ritual, ever moves a row out of its initial workflow state. Rows accumulate — a
first bulk import establishes a floor of dozens, and each genuinely new violation joins it as one more
identical-looking entry. Because the control cannot be told that a given subject's posture is
deliberate and enforced elsewhere, sanctioned exceptions sit in the same state as real debt, at the
same severity, with no note. The store's severity labels then measure nothing: the only way to find the
violation that appeared yesterday is to sort by creation date, which is the query nobody runs on a page
that has been red since it was turned on. The control's own accuracy is not in question, and that is
what makes the defect durable — every audit of the rule comes back clean.

**Detect.** For each custom detective control, group its active findings by workflow state and by
creation date. A single state holding all of them, with no analyst notes, is the finding; a creation-date
histogram with one large founding spike and a thin tail is its signature, and the tail is the set of
real events the channel has been unable to surface. Ask what mechanism can ever transition a row —
a suppression path, an exception register keyed to the subject, a triage step in a runbook — and treat
its absence as the defect rather than the backlog's size. Cross-check each subject the control flags
against the codebase's own sanctioned-posture records: any subject whose posture is deliberate and gated
elsewhere, yet flagged at the same severity as unremediated debt, proves the channel cannot discriminate.

**False positives.** A control deliberately run in observe-only mode during a stated bring-up window,
with the window's end recorded; a store whose triage genuinely happens in a separate system of record
that is reconciled on a named cadence.

## G:63 — A derived error index keeps the rows its corrected classifier would no longer write, so the console shows the retired fiction for the whole retention window and the decoding catalog still explains it as a real fault

**Statement.** An index derived from logs — or any materialized view of a stream — is corrected by
changing the code that derives it, and the correction is judged by what that code writes from then
on. The rows the old code already wrote are untouched: they carry the old names, they age out only
with their retention, and the console that reads them keeps counting and ranking them as if they
were current faults. The catalog that decodes names for staff was written for the old vocabulary,
so the retired fallback name still decodes to a confident root cause ("uncaught runtime exception")
that nearly none of the rows ever were. The engineer who fixed the classifier sees a green test and
a clean run; the operator opening the console the next morning sees thousands of errors under a
name the code can no longer produce, and cannot tell which of them was real.

**Detect.** After any change to the deriving code, list the distinct names in the store and diff
them against the names the new code can emit: every name the code can no longer produce is residue,
and its rows are dated before the change. Check the decoding catalog for entries describing names
the code no longer emits. The correction is complete only when the residue is purged or re-derived
from the source with the new code, and the catalog's vocabulary matches the emitter's.

**False positives.** Rows written during the overlap window while old and new code both ran; a
name still emitted by a second producer the change did not touch; a store whose retention is shorter
than the time it takes anyone to look.

## G:64 — A noisy alarm is recalibrated by subtracting the background series inside metric math, and the subtrahends name the rules by their resource names rather than their telemetry labels, so every subtraction is of an empty series and the correction is a no-op that reads as done

**Statement.** A detective alarm that fires on ambient traffic is not usually retired; it is
refined, by replacing the raw counter with an expression that subtracts the sub-counters the
operator has agreed are background — per-rule, per-status, per-route series drawn from the same
namespace as the total. The refinement depends entirely on each subtrahend resolving to the series
the operator meant, and in several telemetry models the dimension that selects a sub-counter is NOT
the sub-resource's own name: it is a separate publishing label the resource declares for its
metrics (a visibility or monitoring block, a metric-name field, an observability alias), and the two
are commonly different strings for the same object. Naming the sub-resource instead selects a series
that was never published. Nothing objects: the expression is syntactically valid, the provider does
not resolve dimension values at plan time, and the arithmetic treats a subtrahend with no datapoints
as zero rather than as an error — so the expression silently evaluates to the uncorrected total.
The alarm keeps producing datapoints, keeps crossing on exactly the traffic it did before, and its
description, its comment and its change record all state that the background is now excluded. The
defect is durable because the natural verification confirms it: reading the alarm back from the
control plane shows the five-query shape that was intended, and the shape is right. Only the values
are wrong, and only against the corrected expression does that show.

**Detect.** Never accept the shape of a metric-math alarm as evidence that it works. For every
subtrahend, fetch that exact series for a period the alarm actually crossed and require it to be
non-empty; then evaluate both expressions — the deployed one and one built from the sub-resources'
declared telemetry labels — over the same window and compare. If the deployed expression equals the
uncorrected total at every timestamp, the correction is absent. Read the sub-resource declarations
for the field that names their published metrics and diff those strings against the dimension values
the alarm uses. The same check applies to any consumer that filters by a sub-resource dimension:
dashboards, anomaly detectors, cost allocation.

**False positives.** A window in which the background genuinely did not fire, so an empty subtrahend
is correct — distinguish it by finding any window where the sub-resource's real series is non-empty
and confirming the deployed expression drops there too. Platforms where the dimension really is the
resource name. An expression whose subtrahends are deliberately optional because the sub-resources
are conditionally created.

## G:65 — The operations console draws its population from a store that mixes pre-provisioned internal inventory with real customer entities, so every count, list and bulk action silently includes things that are not customers

**Statement.** To make onboarding instant, a system pre-creates entities ahead of demand — shells,
tenants, seats, numbers — and parks them in the same store, with the same schema, as the entities that
real customers occupy. The distinction lives in a status attribute, and often in a stale one: an idle
spare carries whatever state the provisioner left when it finished, which frequently reads as
in-progress rather than as available-unclaimed. The operations console is then built the obvious way —
list the store, render the rows — and from that moment the operator's picture of the business is wrong
in a specific direction: the population is overstated, the ratio of healthy to stuck entities is
meaningless, and anything the console offers to do across the list reaches inventory that no human is
behind. The danger is not the miscount, it is the action: a surface that lists spares as customers
invites someone to contact, bill, migrate, or remediate them, and the first time that happens it is
indistinguishable from reaching real customers. Because the spares are genuinely healthy, nothing ever
errors; the console is most convincing exactly where it is most wrong.

**Detect.** For every operational list, read the query behind it and ask what populations the store
holds — then check whether the query names the one it wants or merely takes everything. Compare the
console's own count against an independently derived count of real customers (billing subjects,
authenticated principals, signed agreements); a gap is the finding. Inspect the status vocabulary the
provisioner writes on completion and confirm an unclaimed-but-ready entity is distinguishable from an
in-flight one — a terminal state that still reads as transitional is the usual root. Then enumerate
every bulk or per-row action the surface exposes and determine, for each, what it would do to an
unclaimed entity.

**False positives.** Consoles explicitly scoped to fleet or inventory management, where seeing spares
is the purpose and the view is labelled so. Stores where the internal population is separated by a
partition the query already pins. Environments with no pre-provisioning, where every row is by
construction a real entity.

## G:66 — A monitoring invariant enforced by one central loop over a resource set is lost when the set is redistributed to per-domain ownership, and nothing detects the loss because no gate asserts the two sets are the same set

**Statement.** A fleet-wide monitoring rule — every dead-letter queue has a depth alarm, every
function has an error alarm, every bucket has a replication check — is commonly implemented once,
as a single loop over an enumerated set of resources. This is the good version: one declaration,
one owner, and adding a resource to the set adds its monitor automatically. The invariant, however,
lives in the loop, not in the repository, and the loop's authority extends exactly as far as the
set it iterates. When the architecture is later reorganised — the estate split into per-domain
stacks, the monolith decomposed, the resources moved into the teams that own them — the resources
are relocated one domain at a time, and each domain's move is reviewed on its own terms: the queue
is declared, its permissions are declared, its consumers are wired, and the change looks complete
because everything the domain needs is present. What the domain does not know is that a monitor it
never declared was being contributed on its behalf by a loop in another stack, and that loop's set
shrinks to nothing as the last resource leaves. No plan shows a deletion, because the alarms were
never in the domain's state; no reviewer misses a line, because the line was never in the domain's
files. The estate ends with the resources fully owned and the invariant owned by nobody, and the
first evidence is a queue holding real messages that no one has been told about. Reorganisations
that improve ownership are therefore the specific event that destroys cross-cutting coverage, and
they destroy it silently, in proportion to how thoroughly they succeed.

**Detect.** Do not read the monitoring code; enumerate both sets from the live account and compare
them. List every resource of the governed kind, list every monitor of the governing kind, and print
the resources with no monitor — the answer is a number, and the only acceptable number is zero.
Run this against the account, not the provisioning tree, because a monitor that was destroyed by a
removed loop and a monitor that was never written look identical in code and different in the
account. Then find the invariant's new home: a rule that was true because of one loop must become
true because of a gate, so add a check that asserts set-equality between resources and monitors and
fails the build on any resource without one, and be aware that adding this gate to an estate that
has already drifted will fail immediately — fix the coverage first, then land the gate, or the gate
gets weakened to green. Treat the dates as evidence: resources created in a single burst on the
migration date, with monitors whose creation dates cluster before it, is the signature.

**False positives.** Resources deliberately exempt from the invariant, where the exemption is
registered by name with a reason and the gate reads that register. Sets where the monitor is
genuinely intrinsic to the resource declaration — a module that emits both together, so relocation
carries the monitor with it. And transitional states inside a migration that is still running,
where the loop and the per-domain declarations coexist by design; that is only this defect once the
central loop is removed, and the window between the two is where the fix belongs.

## G:67 — A compliance analyzer that matches call syntax rather than the callee's contract reports the named-constant refactor as an omission, and its finding text teaches a false model of the library to everyone who reads it

**Statement.** A guardrail that inspects source to confirm a safe call was made almost always does
it by pattern: the option name, a colon, a quoted value. That works against the code it was written
for, because the first implementation of anything spells its arguments out. It stops working the
moment a codebase does the ordinary thing and lifts a repeated value into a named constant — the
call site now holds an identifier rather than a literal, the value at runtime is identical, and the
pattern sees nothing. The analyzer reports the option as absent. Because the change that breaks it
is a quality improvement, the guardrail's false reports concentrate in the better-maintained code
and land on the engineers who removed the duplication. The second and more damaging half is the
finding text: having decided the option is missing, the guardrail explains the consequence — the
familiar shape is "missing X permits unsafe fallback Y". If the callee actually defaults that
option to the safe value, or overrides it unconditionally after merging the caller's options, the
stated consequence is not merely unproven, it is structurally impossible, and the guardrail is
publishing a false model of the library's contract to every engineer who reads a finding. That
model outlives the finding. It is repeated in review, copied into new code as defensive
boilerplate, and cited as the reason for changes that were never needed, so the cost keeps
accruing long after the analyzer is corrected.

**Detect.** Never accept an analyzer's verdict about a call without reading the callee. Open the
function being called and establish two things from its own source: what happens when the option is
absent — a default in the destructure, a throw, a silent fallback — and whether the caller's value
survives to the point of use or is overwritten, because an options spread followed by a literal
assignment of the same key means the caller never controlled it at all. Then resolve the caller's
argument: where it is an identifier, follow it to its declaration and read the value. A finding
survives only if the resolved value is genuinely absent or genuinely unsafe. Separately, test the
analyzer against a file that passes the option through a constant and confirm it reports compliant;
where it does not, the defect is in the analyzer, every finding of that shape is suspect, and the
finding text must be re-read as a claim about the callee that was never checked.

**False positives.** A guardrail matching literals is not wrong to exist — the literal form is the
common one and the pattern catches genuine omissions cheaply. Do not file the analyzer as defective
merely because a constant exists somewhere in the file; confirm the constant is the value actually
passed at the flagged call site. Equally, a callee that defaults an option safely today may not
have when the guardrail was written, so check whether the default was added after the rule: that is
a stale guardrail rather than a wrong one, and the correct fix is to retire the check rather than
rewrite it.

## G:68 — Static analysis scoped to the deployment unit cannot see code delivered by a runtime layer, so a component whose data access lives in shared code reads as having none and its grant reads as unexplained

**Statement.** Serverless and container platforms let a component's dependencies arrive separately
from its own artifact — layers, shared runtimes, sidecars, base images. An analyzer that fetches
"the component's code" fetches the artifact, because that is what the platform's API returns, and
the artifact contains only the files the component itself ships. Every behaviour contributed by the
shared delivery is invisible to it. This produces a specific and confusing class of verdict: the
analyzer observes from the permissions that the component can reach a data store, observes from the
artifact that the component contains no data-store code at all, and concludes that the access must
therefore be happening outside whatever safe path the rule governs. The truth is usually the
opposite — the access is in the shared library, which is the sanctioned path, and the analyzer has
simply never read it. The verdict is maximally misleading because both of its observations are
correct and only their combination is wrong, so an engineer who checks the component's own source
confirms the second observation and is left believing the first one implies a defect. The same
blindness hides the genuine case, because an unused grant and a grant satisfied by a layer are
indistinguishable to a reader who cannot see the layer.

**Detect.** Establish the analyzer's source horizon before trusting any verdict that reasons about
absent code: read the fetch, and check whether it resolves the component's layers, its base image,
or any dependency delivered outside the artifact. Where it does not, treat "this component contains
no such code" as "no such code in this artifact" and go and find the real call — enumerate the
attached layers and search them for the access the permissions imply. A grant with no in-artifact
usage is a question, never a conclusion: the two honest answers are "the access lives in shared
code" and "the grant is unused", they call for opposite fixes, and only reading the shared code
distinguishes them.

**False positives.** A grant with no corresponding code in the artifact OR in any attached layer is
a real finding — an unused permission — and should be filed as one, under least privilege rather
than under whatever heading the blind analyzer used. Do not assume a layer explains every such
case; confirm the call exists before dismissing the grant. Equally, a component that legitimately
holds a grant for a future or conditional path is not defective if that path is declared somewhere
a reviewer can find.

## G:69 — An evaluator that derives its scope from a catalog stops checking whatever the catalog omits, so an uncatalogued resource is not reported as unknown, it is silently exempt

**Statement.** Replacing a hard-coded resource list inside a guardrail with a read of a central
catalog is a genuine improvement, and it is usually made in response to the hard-coded list having
gone stale. It also moves the failure somewhere worse. The guardrail's checks are written as
membership tests — is this table one of the governed ones, is this bucket in the protected set —
and a resource the catalog does not mention answers no to all of them. Answering no means the check
does not run, and a check that does not run reports nothing, so the resource passes. The system now
carries a silent exemption whose trigger is an omission in a document maintained by a different
team, on a different cadence, for a different purpose. This is strictly worse than the stale list
it replaced, because the list's staleness was visible in the guardrail's own source where its
reviewers would see it, whereas the catalog's omission is visible nowhere: the guardrail is
current, the catalog is authoritative, and the resource is unchecked. The window opens exactly when
a resource is new, which is when it is least reviewed and most likely to be wrong, and it closes
only if someone happens to add the entry.

**Detect.** Do not audit the guardrail against the catalog; audit both against the live account.
Enumerate every resource of the governed kind that actually exists, enumerate the catalog's
entries, and print the difference — every live resource absent from the catalog is an unchecked
resource, and the only acceptable count is zero. Then confirm the guardrail's behaviour on an
uncatalogued resource directly rather than by reading it: it must return a distinct and loud
verdict — unknown, unclassified, non-compliant — and never silence. A guardrail that returns
compliant for a resource it has no classification for is inverted, and the fix belongs in the
guardrail's default, not in the catalog, because a catalog will be incomplete again.

**False positives.** A catalog deliberately scoped to a subset — governed environments only,
production only, one data classification — is not incomplete, and resources outside that scope are
correctly absent; read the catalog's own declaration of what it covers before counting omissions. A
resource created shortly before the audit may be legitimately ahead of the catalog's update cycle,
so judge by whether a mechanism exists that closes the gap rather than by a single instance.

## G:70 — Detection routed to a destination that must be visited accumulates unread, and a detector nobody pulls from is indistinguishable from a detector that was never installed

**Statement.** Findings, alerts and audit output are frequently routed to a place that stores them
well: a ticket queue, a console view, an object store, a dashboard. Each is a defensible
destination, each preserves the record, and each is usually chosen precisely because it is more
durable and more structured than a notification. What they share is that nothing about them
arrives — the record waits for a person to go and look at it. Where the routing is the artefact
under review, this passes review easily: the detector is enabled, the rule is correct, the
destination is provisioned, and the wiring is complete end to end. The gap is not in the pipe but
in the assumption that somebody opens it, and that assumption decays silently because the
destination does not report its own depth to anyone. Backlogs of this kind are discovered by
accident, are always older than anyone expects, and routinely contain at least one item whose
window for acting has already closed. The most dangerous property is that the arrangement looks
strictly better than having no detector at all, while delivering the same protection as having
none, and consuming the budget and the confidence of real coverage while it does so.

**Detect.** Count what is waiting. For every detector, find its destination and read the current
backlog depth and the age of the oldest item — a queue with a non-trivial count whose oldest entry
predates the current week has no reader, whatever the routing diagram says. Then ask for the push:
trace whether anything leaves that destination unprompted — a notification, a digest, a page, a
scheduled summary — and confirm its recipient is a person or a rota that exists rather than an
address that merely resolves. Where the only exit is a human opening a console, treat the detector
as unmonitored regardless of its own health, and read its backlog specifically for items whose
deadline has already passed, because those are the finding rather than the depth.

**False positives.** A destination with a named consumer that runs on a schedule — a daily triage
rota, an automated summariser that does report outward — is genuinely monitored, and depth alone
does not condemn it; a large backlog there may be accepted triage debt that someone decided to
carry. A store used deliberately as an archive rather than a work queue is also not this defect,
provided the work queue exists elsewhere and is the thing actually being read.

## G:71 — A detector identifies the governed library by an unanchored substring of its module path, so a sibling module whose name merely contains it is admitted and every downstream check then runs against a component that never imported the library

**Statement.** Detectors that ask "does this component use the governed library" almost always
answer by searching the source for the library's path. The path is written as a bare substring
because that is the shortest thing that works — it survives relative and absolute spellings, import
and require, single and double quotes. It also matches every longer path that happens to contain
it, and module ecosystems produce those constantly: a scoped or hyphenated sibling, a local
directory of the same name one level down, a vendored copy. The match is not a near miss; the
detector concludes the component uses the governed library, and that conclusion is the gate for
everything after it. Each downstream check then asks a question that has no meaning for this
component — which of the library's options did it pass, is it on a current version of the library,
does its declared scope cover the tables it touches — and each answers in the negative, because the
component never called the library at all. The output is a component reported as violating a
contract it is not party to, described in the vocabulary of a library it does not import, and the
engineer sent to fix it finds nothing to fix. The failure compounds with every check that depends
on the gate, so a single loose alternation branch is not one false positive but a whole false
profile, and it lands hardest on components that are correctly built — the ones that use a narrow,
purpose-named sibling module instead of the general one.

**Detect.** Read the detector's module-identity test as a string, not as an intention, and ask what
else in the tree it matches: run it against the whole repository and list every file it selects,
then subtract the files that genuinely import the governed library — the remainder is the false
population, and it is usually a named handful you can check by eye. Anchor the test to the things
that actually delimit a module path: a quote or the start of a specifier on the left, a quote,
slash or extension on the right, rather than the bare name. Where a file already guards one
matcher against this exact hazard — a trailing delimiter on a versioned identifier, a comment
explaining that some near-name must not false-match — treat that as evidence the hazard was
discovered once and fixed only where it bit, and audit every other matcher in the same file, which
is where the unfixed instances will be. Finally, confirm downstream: a component the detector
admits must have a real call site, so require one before any option-level check is allowed to
report.

**False positives.** A wrapper or re-export that genuinely forwards to the governed library is
correctly admitted even though the component never names the library directly, and tightening the
match must not exclude it — follow the wrapper rather than the string. A vendored or duplicated
copy of the library is also a real user of it, and often a real finding of its own, so do not
silence it as a name collision. And a detector deliberately written loose, to over-collect and then
filter, is not this defect provided the filter exists and runs before anything is reported.

## G:72 — An isolation check tests whether a broad grant exists rather than what the grant permits, so the read-only lookup that a resolve-then-scope design requires is reported identically to a grant that can write every customer's rows

**Statement.** Designs that serve an unauthenticated or externally-triggered entry point cannot know
which customer an event belongs to until they have read something: a telephone number, a provider
account id, a callback token. The correct shape is two-phase — a narrow, read-only lookup across the
registry that resolves the customer, then a scoped credential for everything after it. The first
phase necessarily holds a grant that carries no scoping condition, because there is no resolved
identity yet to condition on. A checker built to find isolation bypasses will usually test exactly
one thing: does this principal hold a grant on a customer-scoped store without the scoping
condition. That test cannot distinguish the resolve-phase read from a full read-write grant that
lets the principal mutate any customer's rows at will, so it reports both, in the same words, at the
same severity. The consequences run in both directions. The correctly built component is told to fix
something that is load-bearing, and the usual response — widening the condition, or routing the
lookup through the scoped path that cannot exist yet — breaks the entry point. Meanwhile the
genuinely dangerous grants sit in the same undifferentiated list, so the finding that matters is
indistinguishable from the finding that does not, and the population is too large to triage by hand.
A checker that cannot separate these is not merely noisy: it makes the real bypasses harder to find
than having no checker at all, because it supplies a plausible reason to dismiss the whole category.

**Detect.** Read the grant, not its existence. For every principal flagged, pull the statements and
split them on the action set: a grant whose actions are read-only is a candidate lookup grant, and
one carrying any write action on a customer-scoped store is a candidate bypass — those are different
findings with different fixes and must never share a queue. Then test the lookup grants against what
resolution actually needs: the registry store and the specific index the lookup queries, read-only,
and nothing else. A lookup grant that also names the customer's data stores, or spans indexes by
wildcard, is over-broad even though its phase is legitimate, and that is the finding to file.
Finally, confirm the second phase exists: find the credential the component assumes after resolving,
and confirm the writes go through it. Where the design documents itself — statement identifiers
naming the phase, a separate policy for the lookup — treat that as the author's claim and verify it
rather than as proof.

**False positives.** A read-only grant genuinely confined to the registry and its lookup index, with
every write going through the scoped credential, is the correct implementation and is not a finding
at any severity. A broad grant on a component whose whole purpose spans customers — an
administrative aggregate, a lifecycle worker, an export or deletion job — is also not an isolation
defect, though it remains subject to ordinary least-privilege review. And a checker that
deliberately reports both shapes because a human triages them is acceptable provided the report
carries the distinction; it is the undifferentiated verdict, not the broad collection, that is the
defect.

## G:73 — A detective control is registered against one compute resource type while the risk it looks for is carried by a permission any principal can hold, so every other principal holding that permission is not passing the check, it is outside it

**Statement.** Continuous-compliance services evaluate resources, and a custom control must name the
resource type it evaluates. For a rule about what code is allowed to do with a data store, the
natural choice is the compute type where most of that code runs — the serverless function, the
container task — and for a while the choice is invisibly correct, because that is where the code is.
The risk, though, does not live in the compute type; it lives in the permission, and a permission
can be attached to any principal: an instance profile, a task role, a cross-account role assumed by
a sibling service, a role a human assumes from a console, a role held by a scheduled job. Each of
those can hold exactly the grant the rule exists to find, and none is the resource type the rule is
registered for, so none is ever evaluated. The output is not a false negative in the ordinary sense,
because the rule never looked — the principal is not compliant and not non-compliant, it is absent,
and absence renders identically to safety on every dashboard, in every count and in every report
that says how many resources were assessed. The gap widens exactly as an architecture matures: work
moves off the original compute type onto instances and containers, integrations arrive as
cross-account roles, and each migration quietly removes its subject from the control's population
while the control's own health stays green.

**Detect.** Do not audit the control's findings; audit its population. Enumerate every principal in
the account that holds the permission the control exists to police — read it from the identity
service, not from the provisioning tree — then enumerate the principals the control actually
evaluated, and print the difference. Anything in the first list and not the second is unexamined,
and the count must be zero or explained principal by principal. Expect the difference to be
concentrated in instance and task roles and in roles whose trust policy names another account,
because those are the ones no compute-type-scoped rule reaches. Then fix the axis rather than the
list: a control whose subject is a permission belongs on the identity object or in a scheduled
account-wide sweep, not on one compute type, and where the platform forces a resource type, register
the control against every type that can hold the permission and say so explicitly.

**False positives.** A control deliberately and documentedly scoped to one compute type, where a
separate named control covers the other principal types, is complete — check that the sibling exists
and runs before filing. Principals that hold the permission but cannot exercise it, because a
permission boundary or service control policy denies it, are genuinely out of scope, though the
denial must be verified rather than assumed. And a break-glass or administrative role intended to
hold broad permissions is not a finding of this rule; it is an accepted posture that should be named
as one.

## G:74 — A fleet-wide re-evaluation of a compliance rule exhausts the control-plane rate limit with its own reads, so the sweep manufactures the blind spots it then reports as violations

**Statement.** A custom compliance rule evaluates one resource per invocation and, for each, makes
several control-plane describe calls to assemble the evidence behind its verdict. That is
affordable at the trickle rate of ordinary change events. It is not affordable during a full
re-evaluation, which the provider triggers whenever the rule itself is updated, its scope changes,
or an operator requests one — and which fans the whole population out at once. The rule's own sweep
then becomes the heaviest consumer of an account-wide control-plane quota that is shared, low, and
not sized per rule, so a large fraction of its evidence reads are throttled. Where the rule has
already been hardened so that an unreadable dependency is never scored as clean — the correct fix
for the opposite and more dangerous defect — every throttled read now becomes a violation instead.
A single administrative act therefore publishes a burst of verdicts in which the great majority name
no real defect, and individual resources oscillate between states several times within the sweep as
their retries land differently. The population that is genuinely violating is unchanged and still
present, but it is now a small minority inside its own alarm, which is the condition under which the
control stops being read at all. Retry budgets do not save this: a handful of attempts with
sub-second backoff is sized for an isolated throttle, not for a self-inflicted stampede that lasts
as long as the sweep does.

**Detect.** Separate the rule's verdicts by WHY they were reached, not by what they are: count how
many of the window's violating verdicts carry the annotation the rule emits for unreadable evidence
versus one naming an actual rule breach, and treat a large ratio of the former as the finding
regardless of the total. Chart the rule's invocation count per day against its throttle count per
day over a period long enough to contain at least one quiet day — the signature is a day with an
order-of-magnitude invocation spike and every throttle in the window inside it, while ordinary days
carry none. Count how many distinct resources changed state more than once during the sweep;
repeated oscillation within hours is not a property of the resources and can only come from the
evaluator. Correlate the spike with the rule's own deployment history, since the commonest trigger
is the rule being updated. When counting any of this from a log-query API, page the results fully
and count client-side: a truncated first page silently reports a fraction, and several of these
quantities are only meaningful as totals.

**False positives.** A burst of genuine violations after a real change — a permissions migration, a
new resource family arriving non-compliant — is the control doing its job, and the annotations will
name concrete breaches rather than unread evidence. Throttling that appears on every day at a steady
low rate is ordinary contention and belongs to capacity, not to this pattern, which is specifically
self-inflicted and correlated with a sweep. And a rule that correctly declines to publish any
verdict at all when its evidence is unavailable is not this defect: the finding requires that the
unreadable state be published as a violation.

## G:75 — A compliance rule publishes its verdicts under an identifier the recorder does not use for that resource, so a deleted resource's verdict is never superseded and the ghost is counted in every report thereafter

**Statement.** A continuous-compliance recorder identifies each resource by one identifier — for
some resource types a name, for others an opaque id, rarely the full ARN — and a custom rule may
publish an evaluation under any string it likes. The rule's scheduled sweep enumerates the fleet
through the service's own API and publishes each verdict under the identifier that API returns,
typically the ARN; its change-triggered path receives the recorder's configuration item and answers
under the identifier that item carries, typically the name. Both are accepted, both appear in the
rule's results, and for a live resource the disagreement is invisible because both verdicts say the
same thing. It becomes visible only at deletion: the recorder delivers a deletion item under its own
identifier, the rule correctly answers not-applicable under that identifier, and the sweep's verdict
under the other identifier is never touched again, because the sweep only ever enumerates resources
that still exist. The stale verdict then outlives its subject indefinitely, still non-compliant, still
counted by every consumer that reads the rule's results without checking that the resource exists,
and it can only be cleared by an operator who notices it and deletes the rule's evaluation results
wholesale.

**Detect.** List the rule's non-compliant results and, for each, check that the identifier resolves
to a live resource through the service's own API; any that does not is a ghost. Then compare the
identifier shape the sweep publishes with the identifier the recorder's inventory returns for that
resource type — if they differ, every deletion since the rule was deployed has left a ghost, and the
count of ghosts should match the count of deletions the recorder has seen. The rule's own log usually
shows the split directly: a not-applicable evaluation submitted under one identifier while the
compliance details still carry a non-compliant verdict under another for the same resource.

**False positives.** A recorder that has not yet delivered the deletion item is a delay, not this
defect; wait one recording interval before filing. A resource type the recorder does not record at
all can only be evaluated by a sweep, so nothing will ever supersede its verdicts on deletion and the
rule must prune them itself — that is a different rule and a documented limitation, not a mismatch.

## G:76 — A throttling remedy hardens the one call the incident named and leaves its neighbours on the same hot path at library defaults, so the next stampede fails beside the fix — and where the neighbours sit outside the handler's degraded-result catch, a recorded degradation becomes an unrecorded dead invocation

**Statement.** An incident names a call: the evidence read in the middle of a handler, the one whose
throttles were counted. The remedy is written for that call — a generous attempt budget, backoff
measured in seconds, a cache so the same subject is read once per container — and it is proven
against the very sweep that produced the incident, which now runs clean by the metric the incident
was measured in. What the remedy does not do is change the load. The sweep still fans the whole
population out at once and still consumes the same account-wide control-plane quota, so the quota is
still exhausted; only the identity of the call that loses has changed. The handler's other
control-plane calls — the fetch that resolves the subject before the hardened read, the publish that
records the verdict after it, a registry lookup during initialisation — were never in the incident's
frame and remain on the client library's defaults, typically three attempts a few hundred
milliseconds apart. They now absorb the stampede the hardened call used to.

The relocation is not neutral, and this is what makes the pattern worth its own rule. A remedy is
usually written into the part of the handler that already has a degraded-result path, because that
is where the previous fix taught everyone to look: the hardened read is wrapped in a catch that
turns an unreadable dependency into an explicit incomplete verdict, which is recorded, annotated and
countable. The neighbouring calls are not inside that catch. A throttle there propagates out of the
handler, the invocation fails, and the platform records a generic error with no verdict attached to
any subject. So the same underlying exhaustion that used to produce a loud, wrong, countable answer
now produces no answer at all — and every dashboard built during the first incident reads clean,
because each was keyed to the annotation the hardened path emits. The control appears repaired at
exactly the moment its failures stopped being attributable.

**Detect.** Never accept a throttling fix proven only in the vocabulary of the incident it closed.
Take the platform's own invocation-error count for the handler over the window and compare it with
the count of the remedy's degraded-verdict annotations: the fix is genuine only when both fall.
Where the annotation count falls to zero while the error count is unchanged or higher, the failures
were relocated, not removed. Then attribute them: pull the throttle records and group by the
application stack frame, not by exception type — the frames that are not the hardened function name
the neighbours, and their share of the total is the size of the miss. Confirm by reading the handler
for control-plane calls that sit outside the try/catch which produces the degraded result; each one
is a path on which a transient throttle is fatal. A sweep whose invocation-error rate is a
double-digit percentage while its compliance data reads complete is this defect recovering behind
platform-level retries rather than being absent.

**False positives.** A neighbouring call that is genuinely idempotent and retried by the platform
itself, where the failed invocation is re-driven and the only cost is the error count, is a
monitoring concern rather than a correctness one — say so, but do not score it as data loss. A
handler whose every control-plane call was hardened together, where the residual errors come from a
quota the caller cannot influence, is sized wrong rather than swept wrong. And a first deployment of
a remedy measured before any subsequent stampede has occurred is unproven, not refuted.

## G:77 — A static guardrail resolves the operand of the call it audits through a hand-maintained alias map, so the codebase's prevailing accessor idiom resolves to nothing and the empty extraction is published as a positive scope claim

**Statement.** A guardrail that judges code by reading it must first turn each call site's operand
into a name it can reason about — which table, which bucket, which queue. Source rarely spells that
operand as a literal, so the analyzer grows a small resolver: a regular expression for the literal
form, another for an environment variable, and, bridging the two, a hand-written map from the
identifier names the author happened to see to the resources they stand for. The map is written once,
against the handful of call sites in front of the author, and it is never wrong in a way anything
reports — a name missing from it does not raise an error, it resolves to undefined and is dropped.
Meanwhile the codebase converges on an idiom the author did not anticipate, typically a central
accessor introduced precisely because hard-coded names were a problem. Every call site written in
the new idiom resolves to nothing, and the analyzer concludes the component touches no governed
resource at all.

What makes this worth its own rule is the shape of the verdict, not the miss. The checks downstream
are written as existential tests over the extracted set, and every one of them is false on the empty
set, so the component clears each check in turn and the guardrail states the result affirmatively —
"uses the datastore for ungoverned resources only", "direct client on non-governed resources". That
sentence is not a silence to be noticed later; it is a positive assertion about the component,
published into the compliance record, contradicted by the component's own source. A reviewer who
doubts a component looks it up, reads the clean verdict, and stops. The blindness is strongest
exactly where the codebase is most consistent, because a house idiom adopted everywhere is invisible
everywhere, and the few components still written in the old style are the only ones judged at all —
which makes the guardrail's small population of findings look like a small population of problems.

**Detect.** Never accept the extracted set as the set the code touches. Take the analyzer's own
resolver — every pattern and every entry of its alias map — and run it across the whole tree, then
count the call sites of the audited API that resolve to nothing; the ratio, not the absence of
errors, is the guardrail's reach. Read three of the unresolved call sites in their own source and
name the resources they reach, then look up those components' published verdicts: a verdict that
positively claims a narrower scope than the source shows is the defect in its reportable form.
Cross-check from the permission side, which has no such resolver — a principal holding a grant on a
governed resource whose component is scored as touching none is the same defect seen from the
outside. Confirm the direction of the failure by reading what the downstream checks do with an empty
set: if they clear and the verdict is stated as a fact rather than as unknown, the blindness is
being published as a pass.

**False positives.** A resolver that reports an unresolved operand as unknown — a distinct warning,
a coverage gap, a refusal to score — is bounded rather than blind, and its misses are already
visible; say the reach is narrow, not that the verdict is wrong. A component whose operand genuinely
cannot be resolved statically because it is chosen at runtime is a limit of static analysis, and the
correct finding is that no verdict should be published, not that the extraction is incomplete. And an
alias map that is generated from the same catalog the rest of the system reads, rather than typed by
hand, cannot drift from the codebase's idiom in this way.

## G:78 — A control detects the sanctioned property by the canonical library that usually provides it, so an equivalent inline implementation is reported as that property's absence

**Statement.** A platform makes a security property available through a library — a scoped client, a
tagged session, a narrowed credential — and a detective control is written to enforce it. The control
has to decide, from source, whether a component has the property, and the cheapest reliable signal is
a call into the library: if the import and the entry point are there, the property is there. That
inference is sound in one direction only. The library is a way of obtaining the property, not the
property itself, and a component may obtain it inline — resolving the same principal, assuming the
same role with the same tags, constructing its client from those credentials — using the same
platform helpers the library itself calls. The control sees no library call, concludes the property is
absent, and publishes a violation.

The violation is not merely a false positive, it is a statement of a consequence the code has made
impossible: the finding says the component's credentials are unscoped when every request it issues is
signed by the scoped role. This costs more than a wasted triage. The control's population of findings
now mixes components that really do bypass the property with components that implement it by hand,
and nothing in the verdict distinguishes them, so the register cannot be worked down — each entry has
to be re-derived from source by a human, which is the work the control existed to remove. Worse, the
false entries are indistinguishable from real ones to any process built on top: an exception register
records them as sanctioned, a dashboard counts them as debt, and a note pointing at a tracking record
gets written for a defect that does not exist. The control is also now teaching the wrong lesson,
since the only way to clear the finding is to adopt the library, which may be correct as policy but is
not what the control claims to be measuring.

**Detect.** Read the control's detector and name the property it claims to test, then name the signal
it actually tests; when the signal is an import, a module path, or an entry-point call, the gap is
present by construction and the only question is whether anything occupies it. Find out by searching
the tree for the property's underlying mechanism rather than the library — the assume-role call, the
credential construction, the tag that carries the scope — and list the components that have the
mechanism without the library; each one is a published false verdict. Verify one end to end: read
every client construction in the component and prove each request is issued on the scoped credential,
then read the control's live finding for that component and quote the clause it contradicts. Check
the register built on the control's output too: a false verdict that has acquired an analyst note, a
suppression, or a tracking reference has propagated past the control into the process, and each of
those is a second thing to unwind.

**False positives.** A control whose stated purpose is to enforce use of the library itself — as a
supportability or uniformity policy, declared as such in its own text and its findings' wording — is
measuring what it says it measures; the inline component is then genuinely non-compliant with a policy
about implementations, and the finding is correct even though the property is present. An inline
implementation that differs materially from the library's — a longer credential lifetime, a missing
tag, no re-assertion of the scope after a caller's options are applied — is not equivalent, and the
difference, not the absence of the library, is the finding. And a component that constructs any client
outside the scoped path, even one used on a single code path, does bypass the property and is
correctly flagged. That last case is also the trap in repairing this rule: if the control learns to
credit equivalent implementations per COMPONENT - any scoped assume anywhere in the artifact turns
the table-access verdict into a pass - then a component that reaches one table through the scoped
path and another through its own broad credentials is cleared along with the genuine equivalents. The
credit has to be per call site: attribute each table operand to the client that sends it, and credit
only the operands whose client came from a scoped assume. Until the control can do that, leave the
equivalents flagged; noise that fails closed is cheaper than a pass that hides a real bypass.

## G:79 — The log-derived detective control is rebuilt in a different account from the one its organization-scoped trail can deliver to, so filters and alarms arrive complete and the source cannot follow, and not-breaching treatment publishes the unfed control as healthy

**Statement.** A log-derived detective control is a three-link chain: a producer delivers audit
records into a log store, filters over that store publish counters, and alarms read the counters.
Only the last two links are ordinary per-account resources that a workload move carries with it.
The first is frequently not a resource of that account at all: an organization-wide audit trail is
owned centrally and its log-delivery destination is a single log group in the account that owns the
trail, so the whole organization's records can be pointed at exactly one account. When a control's
consumers are relocated — a restructure into per-domain stacks, a workload migration out of the
management account, a landing-zone rebuild — the log store, the filters and the alarms are
recreated faithfully in the destination and reference each other correctly, and the producer stays
where it was or is torn down with the origin. Nothing in the destination account is wrong. The log
store exists with the right name and retention, every filter names it, every alarm names a filter's
metric, and the resulting chain is internally consistent from link two onward. It is fed nothing.

What converts the severed link into silence rather than a signal is the missing-data treatment,
and the treatment is usually not-breaching for exactly the right reason: these controls count rare
bad events, so most periods legitimately publish no datapoint, and any other setting would make the
healthy steady state noisy. So "no record has ever arrived" and "nothing bad happened" render as
the same green. The counters do not sit at zero — the metric names do not exist, because a filter
that never matches a line never creates its metric — and an alarm reading a metric that has never
been created reports OK from birth. Every review that would normally catch this confirms it
instead: the alarm inventory lists the control present, enabled and wired to a live notification
target; the filter inventory lists the pattern; the log store is there. The gap is not a missing
object but a missing edge, and it is an edge to something outside the account, which is why
same-account consistency checks cannot represent it. The blast radius is the whole detective
posture the control existed to provide, held for as long as nobody asks the one question the
inventory does not answer.

**Detect.** For every metric filter in the estate, resolve its log group and read the group's
stored-bytes and stream count, not its existence — a group with zero streams has never received a
line from anything and every filter over it is dead by construction. Independently, list the metrics
actually present in each filter's target namespace and compare that set with the set the filters
claim to publish; a namespace that returns no metrics at all while filters declare several is the
finding. Then name the producer for each log store and prove the edge: describe the trail, delivery
stream, subscription or agent that is supposed to write there, read its configured destination, and
confirm the destination is that group in that account. For organization-scoped producers check the
account boundary explicitly, since the destination can only be one account and a control living
anywhere else cannot be fed by it however the permissions are written. Compare the log store's
creation time against the alarms' and filters' — a store created in the same window as a
restructure, with no data since, dates the severance. Finally check the missing-data treatment on
each alarm so you know which way the dead control is failing: not-breaching publishes it as healthy,
which is the expensive direction.

**False positives.** Controls deliberately provisioned ahead of the producer during a staged
build-out, where the tree says so and a tracking record names the pending link. Filters over a
store whose producer is genuinely idle rather than absent — the distinction is stream count and
last-ingestion time, not datapoint count, since a real producer creates streams even in a quiet
period. Chains whose producer writes intermittently by design and whose alarms were chosen with
that sparsity in mind. And a control replicated into several accounts where one copy is fed and the
others are deliberate inert standbys, provided the standby status is declared and the fed copy is
the one the posture depends on.

## G:80 — An alarm pages on a filtered resource whose own request logging was never attached, so the only record of what it filtered is the provider's short-lived sampling buffer and every firing is uninvestigable by the time anyone reads it

**Statement.** A traffic-filtering resource — an edge firewall, an API shield, a bot or rate-limit
control — publishes aggregate counters as a first-class metric with no configuration at all, and it
exposes the individual requests it acted on through two quite different channels. One is a logging
configuration the operator must attach explicitly, naming a durable destination the operator owns.
The other is a provider-side sampling buffer, readable through a describe-style call, retained for a
fixed short window measured in hours and not extendable. Because the counters need no wiring, an
alarm over them can be built, tuned, thresholded and connected to a notification target entirely
without the logging configuration ever existing, and nothing in the alarm's own definition refers to
it. The alarm is correct. It fires on the condition it was written for. What it cannot do is answer
the question it was written to raise.

The asymmetry is in the lifetimes. The alarm's purpose is to bring a human — or a scheduled reviewer
that runs once a day — to a decision that requires the request detail: which client, which path,
which rule, one hostile source or a legitimate population that the allowlist stopped matching. The
alarm's own description usually states that fork explicitly. But the notification arrives in a
mailbox or a queue that is read on a human or daily cadence, while the sampling buffer expires in a
few hours, so on any read that is not immediate the evidence is already gone and the call that would
fetch it is rejected outright for naming a window the provider no longer holds. The failure is
silent in the worst way: there is no error, no gap in a dashboard, no missing object. The counters
are intact and can be plotted precisely, so the episode's shape — when it began, how long it lasted,
how many requests — is fully recoverable while its cause is permanently not. A post-incident review
therefore ends in a plausible story rather than an identification, and the same alarm will fire again
into the same emptiness.

Two related shapes hide the defect from inventory. The destination may already exist — provisioned
in the same change as the resource, correctly named, encrypted and retained — with only the
attachment missing, so an audit that enumerates log destinations finds one per filtering resource
and reports full coverage. And a sibling resource of the same kind, provisioned by a later change
that did include the attachment, will be logging correctly, so a spot check that samples one
resource concludes the practice is in force. Where the codebase states the practice in a comment —
every such resource logs to its own destination — the unattached resources are drift from a written
rule, not an undecided question.

**Detect.** Enumerate every traffic-filtering resource in every account and scope, and for each one
call the provider's own read-the-logging-configuration operation. Treat only a returned
configuration naming a live destination as coverage: a not-found error is the finding, and so is a
configuration naming a destination that does not exist. Do not infer coverage from the presence of a
destination — resolve the edge in the other direction as well, reading each destination's stored
bytes and stream count, since a destination with zero streams has never been written to whatever the
configuration says. Then cross the result with the alarm inventory: any alarm whose metric carries
the filtering resource as a dimension, on a resource with no attached logging, is a page that cannot
be triaged, and its severity is the severity of the decision the alarm exists to force. Confirm the
retention asymmetry concretely rather than assuming it — issue the sampling-buffer call for a window
older than the provider's cap and record the rejection, so the report names the boundary as measured
rather than as documented. Check whether an adjacent access log could substitute; where the filter
rejects requests before the downstream service sees them, it cannot, and the tree's own comments
often say so.

**False positives.** A resource in a counting or monitoring-only mode, which takes no action and
whose alarm is an observation rather than a page. Estates that ship request records off-platform
through a streaming delivery attached elsewhere, where the durable copy exists outside the log store
being enumerated — verify the stream, do not accept the claim. Filtering resources fronting a
surface with a hard no-retention posture recorded as a decision, where the accepted consequence is
that firings are triaged from counters alone. And a resource that is newly created inside the
current sampling window, where the attachment is genuinely pending in an in-flight change.

## G:81 — A shared operational feed multiplexes sources whose event rates differ by orders of magnitude, and the loudest source republishes unchanged state, so the rare high-value event is unreachable in the channel that exists to surface it

**Statement.** An operational review feed is built by pointing several event sources at one
destination, on the reasonable principle that everything the estate emits should land in one place a
reviewer can read each morning. The sources are chosen for what they mean, not for how often they
speak, and their rates are never compared: a state-change notification fires a handful of times a
day, a service-health advisory a few times a month, while a finding aggregator republishes its
entire active population on every evaluation cycle, because its publish event fires on update as
well as on creation and nothing in the pipeline ever transitions a finding out of the population.
The result is a feed in which one source outnumbers every other by three orders of magnitude, and
almost none of its volume is new information — the same identifiers, re-emitted, carrying the state
they already carried.

The feed still works, in the sense that every event is present and retained. What stops working is
reading it. A reviewer who fetches the day's events receives a payload dominated by repeats, and the
few events that would change a decision are a fraction of a percent of it, scattered among them with
no ordering that separates them. A scheduled reviewer fares worse than a human: it pages through the
volume under a context or output limit, so the limit itself decides what gets read, and the events
most likely to be dropped are the rare ones. Both then report on the feed rather than from it. The
destination's cost grows on the same curve, and its retention — chosen for the valuable minority —
is paid on the repeats.

Every check that would normally catch this passes. The routing rules are individually correct and
each names a real source and a real destination. The destination exists, is encrypted and is
retained. Coverage audits that ask "is this source captured" answer yes for all of them. Volume is
not part of any of those questions, and the loudest source is usually the one whose capture was most
deliberately argued for, so its presence reads as diligence. The defect lives only in the ratio, and
the ratio is invisible until someone counts by source.

**Detect.** Count the destination's events for a full representative window, grouped by source, and
put the counts side by side — the finding is a distribution, never a single event, so any sample
small enough to skip the counting will miss it. For the dominant source, extract the identity of
each item it published and count distinct identities against total events, then count how many of
those identities were created inside the window: a large volume resolving to a smaller set of
identities almost none of which are new is republished state, not activity. Express the remaining
sources as a percentage of the total and compare that with the feed's stated purpose, since the
purpose usually names exactly the low-volume sources. Read the destination's stored bytes against
its retention to price the repeats. Finally check whether the dominant source already has a
purpose-built aggregate channel — a periodic digest, a console, a scheduled summary — because where
one exists the firehose is redundant with a better-shaped consumer and the narrowing costs nothing.

**False positives.** A destination explicitly built as an archive or a search index rather than a
review feed, where a consumer queries by source and volume is the point. A dominant source whose
events genuinely are distinct occurrences at that rate — verify by distinct-identity count, not by
intuition about the source. Feeds whose consumer filters by source at read time as a matter of
course, provided the filter is in the consumer's own definition rather than in a reviewer's habit.
And a temporary volume spike from a one-off bulk import, where the steady-state rate is ordinary.

## G:82 — A detector's blindness is repaired and recorded as fixed, and the violations its restored sight produces are written down only inside that closure, so the record reads the problem as solved on the day the problem became visible

**Statement.** When a compliance analyzer has been passing components it could not read, the repair
is a change to the analyzer, and it is recorded, correctly, as a fixed defect in the analyzer. The
deploy of that repair converts a population of silent passes into a population of failures in a
single sweep, often dozens at once, and the failures are true: every one of them was true the day
before, the analyzer simply could not see it. Whoever closes the analyzer's record usually notices
the wave and writes it into the closing note, often in exactly the right words — a backlog revealed,
not a regression introduced; each needs its own triage. That note is the last place the wave is
written down. The record that carries it is closed, and closed records drop out of every view of
open work. The findings store shows the wave as a batch of new high-severity rows beside a founding
population that nobody triages (G:62). And the next reviewer, finding the analyzer's record closed
with a careful note, has no reason to look further. The organization has just learned the most
important thing the analyzer was built to tell it, and has filed it under done.

The failure is quiet because every individual step was correct. The analyzer's fix is real and
verified, the closure is honest, the note is accurate, and the findings exist in the store. What is
missing is a single transition: the revealed population never becomes work that anyone owns.

**Detect.** For each closed record of a detector or analyzer fix, read the closure for a change in
the detector's output — a count of subjects that now fail, a phrase such as "newly reported" or
"revealed". For every such rise, look for an open record, or an owner decision, that covers the
newly failing subjects. Then compare the detector's live failing population today with its
population before the fix was deployed: any subject that entered the failing state at the deploy
and appears in no open record and no recorded decision is the finding. Check the direction before
flagging — a fix that removes false failures legitimately closes with a falling count and needs no
successor; only a rise needs one.

**False positives.** A closure that itself opens or links successor records for the revealed
population, or records an owner decision to accept it with a reason; a detector in a declared
observe-only bring-up window whose output is not yet treated as work; and a rise that is fully
explained by subjects deleted and recreated during the window rather than newly visible.

## G:83 — An alert topic's email subscription is declared as code, created unconfirmed, and deleted by the notification service days later, so between applies the topic has no subscriber and every plan shows only a harmless-looking create

**Statement.** Email delivery from a notification topic needs the recipient to confirm: the
subscription is created in a pending state, a confirmation message goes to the address, and the
service deletes the pending subscription if nobody confirms within a few days. Infrastructure code
declares the subscription like any other resource, so the apply succeeds and reports it created.
When the address is an automated mailbox (an archive, a ticketing intake, a forwarding rule), nobody
is looking for a confirmation link; when it is a person, the message reads like spam. Days later the
subscription disappears, the next refresh drops it from state, and the next plan proposes to create
it again - a line that looks like routine drift rather than a monitoring outage. Between those two
moments the topic has no confirmed subscriber and every alarm that publishes to it reaches nobody.
Topics in secondary accounts (a security-tooling account, a log archive) are the usual victims,
because they are applied rarely, so the gap lasts from one apply to the next and each apply sends
one more unanswered confirmation.

**Detect.** For every topic that an alarm, a rule or a pipeline notifies, list its subscriptions and
count only confirmed ones; a topic with alarm publishers and zero confirmed subscribers is the
finding. Read the account's API audit trail for subscribe calls on that topic with no confirmation
after them. In plans, treat a create of an email subscription on a topic that already existed as a
signal to check confirmation, not as drift to apply and forget. Confirm the fix by reading the
subscription back with an identifier rather than the pending marker.

**False positives.** Protocols that need no confirmation (queue and function subscriptions in the
same account); topics that are deliberately unsubscribed because nothing publishes to them any more
(then the finding is the dead topic); and addresses fronted by an automated confirmer that validates
the topic belongs to the organisation before confirming - check that it ran for this topic.
