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

## D:30 — An applied, checksum-verified migration file is edited by a repository-wide path rewrite, so every build made after the edit fails the integrity check at boot

**Statement.** A migration runner that enforces immutability hashes each migration file's whole contents and refuses to start when an already-applied file's digest differs from the digest recorded at apply time. This is a correct and desirable guard. It becomes an outage when a repository restructure — a directory move, a package rename, a path-normalizing codemod — rewrites text INSIDE an applied migration, most often a path mentioned in a header comment. The edit is semantically null: no schema statement changes, review reads it as part of a mechanical move, and every gate that checks SQL or schema shape passes. But the runner hashes bytes, not statements, so the digest moves and every image built from that revision dies during startup. The failure is latent and time-shifted: it appears not when the move lands but when someone first deploys a new build, which may be days later, and it presents as a boot crash in an unrelated release. Because the previously deployed instance keeps serving, health checks stay green and the deployment looks merely stuck rather than broken.

**Detect.** Identify every artifact class whose integrity is verified against a stored digest — migrations, applied patches, signed fixtures, golden files — and confirm which ones the runner hashes WHOLE rather than by canonicalized content. Then diff every restructure or codemod commit against that file set: any change inside an already-applied artifact is the defect, including changes only to comments or trailing whitespace. Confirm against the live record rather than the repository: read the applied-digest table (or equivalent ledger) and compare it to the digest of the file on the mainline. Check the deployment history for boot failures whose first occurrence lags the offending commit, and for a running instance whose image predates it.

**False positives.** Runners that hash a canonicalized form (statements normalized, comments and whitespace stripped) — read the hashing function, do not infer it from the guard's error text; artifacts not yet applied in any environment, where an edit is lawful; digests recorded per-environment where the environment in question has been rebuilt from empty since the edit; and repositories where the mainline file legitimately differs because the applied version is pinned by release tag rather than by branch tip.

## D:31 — A field made optional at the API layer is still written as an explicit null, and the store rejects it because that attribute is an index key

**Statement.** A requirement is relaxed: a field the API used to demand becomes optional, and validation, client forms, and response types all move together. The write path is updated to accept the absent value but persists it as an explicit null rather than omitting the attribute. When that attribute participates in a secondary index's key schema, the store does not accept a null there — key attributes are typed, and a null is a type violation rather than an absent value — so the whole write is rejected and the operation fails with a server error. The result is that the field remains a hard requirement one layer below the one that was changed, and the failure surfaces as an opaque store-level type error rather than as validation, so it reads as an infrastructure fault instead of the contract change that caused it. The same shape appears in reverse on updates, where clearing the field is expressed as setting it to null instead of removing the attribute.

**Detect.** For every field whose optionality was relaxed, resolve whether the attribute appears in any index key schema — not only the base table's key — by reading the live table description rather than the model. Then read the write path for an explicit null assignment, and the update path for a set-to-null where a remove is required. Confirm live: attempt or locate a create without the field and read the store's error, and check the readers of that index, since omitting the attribute removes the row from a sparse index and any consumer that assumed total membership now misses it.

**False positives.** Attributes that are keys only of the base table, where the field was never truly optional and the API change is itself the defect; stores that model a null key as an absent attribute; write paths that already omit rather than nullify — verify by reading the marshalled item, not the function signature; and cases where a sparse index is the intended design and every reader of it independently requires the field.


## D:32 — A store named for one entity family hosts several unrelated families, so grants, readers and new work are routed by the name to the wrong home and the other families live unnamed under it

**Statement.** A table is created for one entity - the agent, the order, the account - and
over time gains sort-key families for things that were convenient to co-locate: the team,
the bookable resources, their time off, the routing groups. The name still says the first
entity. Every grant that needs the team must be granted "the agents table"; every reader
discovering the data model from names looks elsewhere first; every new family is added here
because the neighbours are, and the key-space collisions and id-space confusions that follow
(a reader treating one family's ids as another's) grow in exactly this soil. When the rest of
the model is one table per family, the misnamed store is the exception that nobody documents
as one. Nothing is broken by the layout itself; the cost is paid by every person who reasons
from the name.

**Detect.** Compare each store's declared sort-key families with its name; a store whose
families belong to more than one domain concept, in a schema that otherwise keeps families
apart, is the finding. Look for grants and profiles that name the store for access to a family
the name does not suggest, and for incidents where one family's id was read in another's
space. Record the intended home for each foreign family in the contract before any move.

**False positives.** A deliberate single-table design applied consistently across the schema
and documented as such; adjacency families that are strictly children of the named entity
(an order's lines under the orders table).

## D:33 — An unconditioned update on a row that was deliberately removed recreates it as an attribute-less stub, and a guard that reads the row's attributes treats the stub as permission

**Statement.** In a key-value store an update on a missing key is an upsert: the write
succeeds and a new item exists with only the attributes the update set. A lifecycle that
removes a row on purpose — a pool member's row deleted when it is claimed, a tombstone
replaced by a projection elsewhere — is silently undone by any later writer that stamps a
version, a timestamp or a health mark without a condition that the row exist. The stub it
leaves carries none of the attributes the rest of the system keys on: no status, no owner,
no protection flag. Every reader that gates on those attributes now sees a row whose
answer to "may I destroy this" is a blank, and blank is not in the forbidden set. The
resource behind the stub is live and in use; the guard that was written to protect it
reads the stub and proceeds. The same stub is invisible to inventories that query by
status, so the live resource is at once unprotected and uncounted.

**Detect.** For every writer to a table whose rows are removed on purpose, read the
condition on its updates: a version bump, a heartbeat or a repair stamp without
`attribute_exists` on the key is the recreator. Then read every destructive path's guard
and ask what it does when the attribute it checks is absent — a forbidden-set check that
lets an undefined status through is the defeated guard. Confirm live by listing rows that
lack the status attribute and joining them against the live resources they name: a stub
whose resource is in use is the finding, already armed.

**False positives.** Updates guarded by `attribute_exists` on the key (or an equivalent
conditional write); destructive paths whose guard is a positive allow-list ("only these
statuses may be destroyed") rather than a forbidden set; tables whose rows are never
removed by design.

## D:34 — A conditional write's fallback path reuses the guarded attempt's expression-attribute maps after dropping the attribute they were built for, and the store rejects every fallback for unused expression attributes

**Statement.** A writer that must not move a value backwards is written as two attempts: a
guarded update carrying a condition on that value, and — when the condition fails because the
stored row already holds a later one — a second update that writes everything except it. The
second attempt is authored by copying the first and deleting the clause, but the name and value
maps are shared objects built once above both calls, so they still carry the placeholder the
deleted clause was the only reader of. Document-store update APIs reject a request whose
declared expression attributes are not all referenced, so the fallback fails validation every
single time it is reached. The result is a write path that works perfectly until the moment it
is supposed to degrade, and fails exactly and only in the case it was written to handle. It is
invisible in three ways at once: the failure is a client-side validation error, not a conflict,
so retry logic treats it as a new problem; the fallback is by definition the rarer branch, so a
smoke test that writes each key once never reaches it; and the counter that would show the
branch succeeding is incremented only on the success the branch never achieves, so the metric
that should reveal it reads zero rather than wrong. Where a whole delivery is failed when no
row lands, the same defect converts a benign duplicate into a retried, alarming invocation.

**Detect.** Find every catch block that responds to a conditional-write failure by re-issuing
the write, and check whether the name/value maps are constructed once and passed to both calls.
Then diff the two expressions: every placeholder that appears in the first and not the second
is a rejection. Confirm live rather than by reading — the branch is reachable only on a real
conflict, so query the logs for validation errors from that writer, and read the counter the
fallback increments on success: a fallback that has never once succeeded in production, on a
table with repeated keys, is this. Unit tests that stub the write dependency cannot see it; the
expression is built in the real-dependency factory, below the seam the tests replace.

**False positives.** Fallbacks that build their own maps, or that pass a map derived by
deletion from the first. Stores whose API ignores unreferenced expression attributes rather
than rejecting them. A fallback that is genuinely unreachable because the condition cannot fail
(a key written exactly once by construction) — though the dead branch is then its own finding.
