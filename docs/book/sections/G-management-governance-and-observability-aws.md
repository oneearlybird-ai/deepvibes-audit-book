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
