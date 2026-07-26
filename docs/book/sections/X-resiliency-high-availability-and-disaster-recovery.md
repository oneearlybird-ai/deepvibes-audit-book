---
section: X
title: "Resiliency, High Availability & Disaster Recovery"
group: saas-core
---

# [X] Resiliency, High Availability & Disaster Recovery

## X:1 — Split-Brain DNS: Lack of Multi-Region Failover Validation Drills

Split-Brain DNS: Lack of Multi-Region Failover Validation Drills. Operating sophisticated global fallback infrastructure without performing scheduled chaos simulation drills, ensuring hidden configuration mismatches or routing drift will derail live disaster recovery attempts.

## X:2 — Backup Isolation: Retaining Snapshots and Hot Databases on the Identical AWS Core Account

Backup Isolation: Retaining Snapshots and Hot Databases on the Identical AWS Core Account. Storing critical recovery snapshots within the exact same structural AWS account as the active application, leaving backup history completely exposed to total destruction if the primary workspace is compromised.

## X:3 — Cascade Failures: Missing Circuit Breaker Infrastructure on Fragile Downstream Integrati…

Cascade Failures: Missing Circuit Breaker Infrastructure on Fragile Downstream Integrations. Allowing system workers to synchronously retry connections to an unresponsive third-party API without exponential backoff or short-circuit fallback states, leading to thread pool exhaustion and systemic platform collapse.

## X:4 — State Mismatch: Out-of-Sync Cross-Region Replication Latencies

State Mismatch: Out-of-Sync Cross-Region Replication Latencies. Designing data synchronization processes where primary transaction logs are mirrored asynchronously to secondary regions without transaction order tracking, resulting in severe relational schema inconsistencies during unexpected mid-operation failovers.

## X:5 — Objectives: RTO/RPO undefined — backup cadence and architecture never derived from actua…

Objectives: RTO/RPO undefined — backup cadence and architecture never derived from actual business tolerance.

## X:6 — Restore Tests: Backups never restore-tested end-to-end — recovery confidence is purely t…

Restore Tests: Backups never restore-tested end-to-end — recovery confidence is purely theoretical.

## X:7 — Health Checks: Shallow checks (static 200) hiding dead dependencies — or over-deep check…

Health Checks: Shallow checks (static 200) hiding dead dependencies — or over-deep checks cascading flaps across services.

## X:8 — Timeout Budgets: Nested timeouts not budgeted (caller waits 30s on a dependency that ret…

Timeout Budgets: Nested timeouts not budgeted (caller waits 30s on a dependency that retries 3×20s) — thread starvation under brownout.

## X:9 — Idempotency: Write retries during incidents without idempotency keys — duplicated side e…

Idempotency: Write retries during incidents without idempotency keys — duplicated side effects exactly when accuracy matters most.

## X:10 — Load Shedding: No feature-flag kill switches or degradation tiers — the only choice duri…

Load Shedding: No feature-flag kill switches or degradation tiers — the only choice during overload is full outage.

## X:11 — SPOFs: Single NAT/queue/region/third-party dependencies with no documented fallback or a…

SPOFs: Single NAT/queue/region/third-party dependencies with no documented fallback or accepted-risk record.

## X:12 — Quotas: Service limits (Lambda concurrency, SES rate, connection caps) unmonitored until…

Quotas: Service limits (Lambda concurrency, SES rate, connection caps) unmonitored until production hits the wall.

## X:13 — A shared account-level vendor quota is the real ceiling for several unrelated capabilities, so exhausting it anywhere takes them all down at once

**Statement.** Multiple independent capabilities — an authentication factor, transactional customer
notifications, internal operational alerts — are delivered through one vendor channel governed by a
single account-scoped quota (a monthly spend cap, a daily send allowance, a shared rate ceiling).
Per-tenant metering and per-recipient rate limits exist and are correct, but they all draw from the
same pool, so the pool, not the per-tenant limit, is the true bound. Any one consumer exhausting it
— an attacker pumping the cheapest unauthenticated entry point, one tenant's legitimate burst, or
ordinary aggregate growth — silently disables every other capability on that channel, including
ones far more valuable than the consumer that drained it. Two properties turn this from a capacity
issue into an incident with no fast exit: the failure is usually a soft vendor-side rejection that
application code logs and swallows rather than surfacing, and the quota's self-service maximum
often equals its current value, so raising it requires a vendor support request measured in hours
or days rather than a config change.

**Detect.** Enumerate every capability that reaches users through each external delivery channel and
group them by the quota that actually governs them — read the LIVE quota from the vendor's API, not
the IaC, since an unset limit means an account default applies. Where two or more capabilities share
a pool, the finding is present unless a per-capability reservation exists; per-tenant limiters do not
count, because they bound one tenant against the pool rather than the capabilities against each
other. Divide the pool by realistic unit cost to get the true message/request budget and compare it
against projected aggregate volume, not per-tenant volume. Then check remediation latency: compare
the enforced value against the self-service maximum — equal values mean there is no fast lever
during the incident. Finally, trace the exhaustion response through application code; a vendor
rejection caught and logged without an alarm means the outage is invisible until users report it.

**False positives.** Channels carrying exactly one capability, where exhaustion degrades only the
consumer that caused it; quotas with vendor-side per-purpose reservations or separate sub-accounts
per capability; pools whose headroom over projected peak is large and explicitly monitored with an
alarm at a fraction of the limit.
