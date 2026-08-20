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
