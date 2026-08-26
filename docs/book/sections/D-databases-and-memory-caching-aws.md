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

## D:27 — DynamoDB: GSI queried against a key schema it does not have — runtime ValidationException CI never sees

**Statement.** A Query names a GSI but its KeyConditionExpression does not match the index's actual key
schema (e.g. conditions on the range key alone, or treats the range key as the hash). DynamoDB rejects
it at runtime (ValidationException), so every caller of that code path hard-fails — but unit-test
fakes rarely model index key schemas, so CI stays green and the crash ships. Frequently caused by two
consumers assuming DIFFERENT schemas for the same index name.

**Detect.** For every Query with IndexName, resolve the index's real key schema (IaC/contract/table
description) and check the KeyConditionExpression uses the hash key with equality. Cross-check ALL
consumers of the same index against one schema. Treat range-only conditions as certain failures.

**False positives.** Queries against the base table (no IndexName) keyed on the table's own hash;
expressions where attribute-name aliases obscure a correct hash-key condition — resolve aliases first.

## D:28 — DynamoDB: Offboarding/deletion funneled through one hard-capped transaction over a growing per-tenant item set

**Statement.** A lifecycle operation (tenant deletion, archival, retirement) collects every item belonging to a tenant and submits them in a single `TransactWriteItems` call. The API hard-caps items per transaction (100); a guard that terminally fails the request when the cap is exceeded converts ordinary data growth into a permanent, user-facing failure of the operation — deletion works for young tenants, then becomes "contact support" precisely for the tenants with the most data, which can breach contractual or regulatory deletion promises (GDPR/CCPA).

**Detect.** Transaction item lists built by iterating query results whose per-tenant cardinality is unbounded (grows with item classes, sub-resources, or age); guards comparing collected length against the transaction cap that respond with a terminal error; absence of an asynchronous or paged fallback (BatchWrite loop, queue worker, Step Functions) for the over-cap case.

**False positives.** Transactions over item sets whose cardinality is schema-bounded below the cap (fixed item classes with enforced limits, and the bound stated in code); designs where the capped transaction is a fast path and an async paged path takes over above the threshold; operations that only stamp a status row transactionally and defer bulk movement to a worker.

## D:29 — A stored attribute's TYPE is changed to fix a writer, and rows written before the cutover become poison for readers that were type-correct for the old shape

**Statement.** A concurrency or atomicity fix is delivered by changing the STORAGE TYPE of an existing attribute — a list becomes a set so it can be mutated with an atomic add/remove instead of read-modify-write, a scalar becomes a counter, a string becomes a map. The writer, its tests, and the reader that motivated the change all move together and are internally consistent, so review sees one coherent change. What no one owns is the OVERLAP WINDOW: rows written by the previous deployment are still live, still carrying the old type, and every reader that dereferences the attribute with a type-specific operation (`.has`, `.length`, a numeric add, a key lookup) throws a TypeError on them — not a validation error the code models, but a language-level fault from a value the code proved could not exist. The window's length is set by the row's own lifetime, so it is invisible in staging, where rows are seconds old, and real in production, where a session, connection, cart, or lock row outlives a deploy by hours. The failure looks like a code bug in the reader long after the deploy that caused it, because the reader's source is correct for every row it will ever see again. Severity is decided by where the type-specific dereference sits relative to the code's per-item error containment: inside a per-item guard it costs one item, but these dereferences are usually written as an inline filter or match ABOVE the guard, where one stale row aborts the whole batch, request, or fan-out and takes healthy items down with it (see the poison-pill/containment-scope rule for that amplification).

**Detect.** Diff the deployment for writes whose expression operator or marshalled type changed on an attribute that already existed — atomic add/delete replacing a whole-attribute set, a set constructor replacing an array literal. For each, enumerate EVERY reader of that attribute across every service, not just the one the fix was written for, and classify each dereference: type-specific operations on a value that can be either shape are the defect. Then establish the overlap window from the row's real lifetime (TTL attribute, session duration, lock lease) and compare it against deploy frequency — a lifetime longer than the gap between deploys means the window is always occupied. Confirm live rather than by reading code: query the table for rows whose attribute is the OLD type, and search the readers' logs across the deploy timestamp for TypeErrors naming that attribute's method. Finally, locate the dereference relative to the nearest per-item try/catch or continue-guard to size the blast radius, and check whether a failure destination (dead-letter queue, retry-exhaustion path) captured work that was silently never delivered.

**False positives.** Type changes on attributes of rows that are provably created fresh after the deploy and never read across it (rows keyed by a build or release id); readers that normalize defensively before dereferencing (coercing to a common shape, or branching on the observed type) — the normalization must be read, not assumed from a comment; deployments performed with a genuine drain in which the old-shape population is proven empty before the reader ships, evidenced by a live query rather than by elapsed time; and attributes whose old shape is absent rather than differently-typed, which optional chaining already handles and which is a different, benign case.
