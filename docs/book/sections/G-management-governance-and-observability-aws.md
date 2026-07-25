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
