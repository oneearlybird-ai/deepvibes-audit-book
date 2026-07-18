---
section: D
title: "Databases & Memory Caching (AWS)"
group: aws-backend
---

# [D] Databases & Memory Caching (AWS)

## D:1 — DynamoDB: Point-in-Time Recovery (PITR) is disabled on a production-tier table

DynamoDB: Point-in-Time Recovery (PITR) is disabled on a production-tier table.

## D:2 — DynamoDB: Global Secondary Indexes (GSIs) projecting ALL attributes instead of specific…

DynamoDB: Global Secondary Indexes (GSIs) projecting ALL attributes instead of specific INCLUDE subsets, duplicating storage and WCU costs.

## D:3 — DynamoDB: Application backend relies on unbounded Scan operations on large tables instea…

DynamoDB: Application backend relies on unbounded Scan operations on large tables instead of heavily indexed Query operations.

## D:4 — RDS: Database cluster configured as PubliclyAccessible: true

RDS: Database cluster configured as PubliclyAccessible: true.

## D:5 — RDS: Multi-AZ deployment is disabled for production database instances

RDS: Multi-AZ deployment is disabled for production database instances.

## D:6 — RDS: IAM Database Authentication is disabled; backend relies entirely on static, hardcod…

RDS: IAM Database Authentication is disabled; backend relies entirely on static, hardcoded master passwords.

## D:7 — ElastiCache (Redis): Cluster lacks AUTH tokens and TLS Encryption-in-Transit, allowing u…

ElastiCache (Redis): Cluster lacks AUTH tokens and TLS Encryption-in-Transit, allowing unauthenticated connections within the VPC.

## D:8 — DynamoDB: Lack of Adaptive Capacity Monitoring

DynamoDB: Lack of Adaptive Capacity Monitoring. Failing to optimize partition keys for uniform distribution, causing "hot partition" throttling events even when aggregate provisioning metrics indicate ample unused Read/Write Capacity Units.

## D:9 — RDS: Missing Automated DB Snapshot Sharing Encryption Limits

RDS: Missing Automated DB Snapshot Sharing Encryption Limits. Sharing daily validation snapshots with development accounts or third-party analytical environments without stripping production Customer Managed Keys (CMKs) or verifying target encryption parameters.

## D:10 — ElastiCache (Redis): Missing Eviction Policy Configuration for High Memory Utilization

ElastiCache (Redis): Missing Eviction Policy Configuration for High Memory Utilization. Operating multi-tenant caching clusters with an unoptimized eviction policy (e.g., noeviction), causing the backend to throw direct memory errors and reject write payloads once memory caps are met.

## D:11 — DocumentDB / Neptune: Unused Indexing on Frequent Query Predicates

DocumentDB / Neptune: Unused Indexing on Frequent Query Predicates. Querying large JSON structures or graph relationships on unindexed keys, forcing massive sequential collection scans that drive cluster CPU to 100% and delay API responses.

## D:12 — DynamoDB: Ephemeral rows (sessions, locks, idempotency keys) without a TTL attribute, gr…

DynamoDB: Ephemeral rows (sessions, locks, idempotency keys) without a TTL attribute, growing tables and costs unbounded.

## D:13 — DynamoDB: TTL expiry relied on as a security boundary — TTL deletions can lag by up to d…

DynamoDB: TTL expiry relied on as a security boundary — TTL deletions can lag by up to days; reads must still filter expired items.

## D:14 — DynamoDB Streams: Consumers not idempotent despite at-least-once delivery, double-applyi…

DynamoDB Streams: Consumers not idempotent despite at-least-once delivery, double-applying side effects on retry.

## D:15 — DynamoDB: Multi-item invariants written without TransactWriteItems, leaving partial stat…

DynamoDB: Multi-item invariants written without TransactWriteItems, leaving partial states on mid-flight failures.

## D:16 — DynamoDB: Writes without ConditionExpression guards — concurrent writers silently overwr…

DynamoDB: Writes without ConditionExpression guards — concurrent writers silently overwrite each other (lost updates).

## D:17 — DynamoDB: Billing mode (on-demand vs provisioned) never revisited against real traffic c…

DynamoDB: Billing mode (on-demand vs provisioned) never revisited against real traffic curves.

## D:18 — RDS: Storage autoscaling disabled — disk-full incidents take the database read-only in p…

RDS: Storage autoscaling disabled — disk-full incidents take the database read-only in production.

## D:19 — RDS: Backup retention set to the minimum and snapshots never copied cross-account/cross-…

RDS: Backup retention set to the minimum and snapshots never copied cross-account/cross-region for ransomware isolation.

## D:20 — RDS: Performance Insights and slow-query logging disabled, leaving query regressions und…

RDS: Performance Insights and slow-query logging disabled, leaving query regressions undiagnosable.

## D:21 — RDS: Lambda/serverless callers connecting directly without RDS Proxy, exhausting connect…

RDS: Lambda/serverless callers connecting directly without RDS Proxy, exhausting connections during scale-out bursts.

## D:22 — Redis: Cache keys without TTLs treated as durable storage, participating in auth/rotatio…

Redis: Cache keys without TTLs treated as durable storage, participating in auth/rotation flows that never refresh.

## D:23 — Redis: Hot-key cache stampede — synchronized expiry without jitter or request coalescing…

Redis: Hot-key cache stampede — synchronized expiry without jitter or request coalescing floods the origin database.

## D:24 — OpenSearch: Domains without fine-grained access control or VPC placement; index-level mu…

OpenSearch: Domains without fine-grained access control or VPC placement; index-level multi-tenant isolation absent.

## D:25 — SQL/ORM: N+1 lazy-loading query patterns on hot endpoints, multiplying latency under lis…

SQL/ORM: N+1 lazy-loading query patterns on hot endpoints, multiplying latency under list views.

## D:26 — Migrations: Schema migrations run at process boot without distributed locks — parallel i…

Migrations: Schema migrations run at process boot without distributed locks — parallel instances race and corrupt schema state.
