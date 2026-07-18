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
