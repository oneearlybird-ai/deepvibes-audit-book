---
section: S
title: "Global Data Multi-Tenancy & Isolation"
group: saas-core
---

# [S] Global Data Multi-Tenancy & Isolation

## S:1 — Tenant Leaks: Implicit Multi-Tenant Filtering via Frontend-Supplied IDs

Tenant Leaks: Implicit Multi-Tenant Filtering via Frontend-Supplied IDs. Relying on the client application to supply a tenant_id query parameter for backend routing instead of extracting it securely from the verified server-side JWT session, allowing easy cross-tenant data harvesting.

## S:2 — Database Pool Co-mingling: Lack of Execution-Level Row Policies

Database Pool Co-mingling: Lack of Execution-Level Row Policies. Storing multiple customers' records inside a shared relational database table without active PostgreSQL Row-Level Security (RLS) or rigorous ORM wrapper checks, risking accidental data exposure via simple developer missing-where-clause bugs.

## S:3 — Data Squeeze: Uncontrolled Shared Connection Starvation

Data Squeeze: Uncontrolled Shared Connection Starvation. Exposing a multi-tenant application to noisy-neighbor effects where a single customer running high-volume parallel batch syncs completely exhausts the shared database connection pool, taking down the SaaS platform for all other active tenants.

## S:4 — NoSQL Co-habitation: Shared Partition Keys Without Prefix Enforcement

NoSQL Co-habitation: Shared Partition Keys Without Prefix Enforcement. Storing multi-tenant datasets in a single NoSQL cluster using standard structural keys without strict tenant scoping prefixes, allowing cross-tenant data collisions or unauthorized lookups during data scans.

## S:5 — Async Context: Background jobs and queue consumers running without tenant context propag…

Async Context: Background jobs and queue consumers running without tenant context propagation — cross-tenant writes are one bug away.

## S:6 — Crypto Isolation: Per-tenant encryption keys promised contractually, but all data encryp…

Crypto Isolation: Per-tenant encryption keys promised contractually, but all data encrypted under one shared key.

## S:7 — Search: Shared search indexes (OpenSearch/Algolia) queried without enforced tenant filte…

Search: Shared search indexes (OpenSearch/Algolia) queried without enforced tenant filters at the query-builder layer.

## S:8 — Offboarding: Tenant deletion leaving orphaned S3 prefixes, queues, schedules, and vector…

Offboarding: Tenant deletion leaving orphaned S3 prefixes, queues, schedules, and vector entries behind.

## S:9 — Impersonation: Support "login as customer" without explicit consent capture, time-boxing…

Impersonation: Support "login as customer" without explicit consent capture, time-boxing, and an audit trail.

## S:10 — Limits: Rate/usage limits enforced globally instead of per-tenant — one noisy tenant con…

Limits: Rate/usage limits enforced globally instead of per-tenant — one noisy tenant consumes the shared quota.

## S:11 — Identifiers: Guessable sequential tenant/workspace IDs doubling as authorization inputs

Identifiers: Guessable sequential tenant/workspace IDs doubling as authorization inputs.

## S:12 — Analytics: Cross-tenant aggregate reporting computed without anonymization thresholds —…

Analytics: Cross-tenant aggregate reporting computed without anonymization thresholds — small-N tenants identifiable in "anonymous" stats.

## S:13 — Caller-controlled value concatenated into a delimited composite key forges the segments that follow it

**Statement.** A composite sort/range key is built by string-joining segments with a delimiter (`ENTITY#{id}#{channel}#{purpose}#{timestamp}`) from a value the caller supplies, with no rejection or escaping of the delimiter inside that value. A caller who embeds the delimiter forges every segment after it: the stored row lands under a prefix the validated fields never authorized, and — where readers select the newest row by descending key order — a crafted trailing timestamp segment makes the forged row permanently win that read. Every field-level validator still passes, because none of them examines the key grammar; the type check that guards the segment (`typeof id === 'string'`) is orthogonal to the injection.

**Detect.** List every composite-key builder and mark which segments come from request input. For each, read what the READER does with the key: `begins_with` prefix queries and descending-order `Limit: 1` reads are the amplifiers — a forged row need only share the prefix and sort above the genuine ones. Confirm the writer constrains the segment's charset rather than just its type. Then check the supersede path (revoke, close, cancel): if it rebuilds the key from the same unvalidated input, it writes a correctly-dated row that sorts BELOW the forgery, so the forged state can never be retracted.

**False positives.** Builders whose caller-supplied segments are server-minted opaque ids (UUID/ULID) validated against a charset excluding the delimiter; keys whose readers select by exact match rather than by prefix or ordering; delimiters that cannot occur in the segment's validated format.

## S:14 — Rows written under a retired provisioning flow persist in live tenant tables — current code refuses or misreads them

**Statement.** Tenant-plane tables carry rows minted by an earlier generation of the provisioning
flow: key prefixes the current grammar retired, lifecycle states the current state machine cannot
produce, or anchor rows missing fields every current writer stamps. Current code meets them in
three bad ways: guards refuse them by design (turning them into permanent un-repairable objects),
key-joins silently miss them (they become unreachable and uncounted), or probes misread them (a
malformed row satisfies or breaks an idempotency check). None of this errors in aggregate — the
debris surfaces only when a specific flow touches a specific stale row.

**Detect.** Scan each tenant table for key prefixes and lifecycle values outside the current
grammar (enumerate the grammar from the isolation contract or key-builder module, not from memory).
For each stale family: count rows, find what minted them (git history of the retired flow), and
trace what current code does on contact — refuse, miss, or misread. Rows reachable by live flows
rank above orphans.

**False positives.** Rows a documented migration/reaper is scheduled to process (verify the reaper
exists and runs); intentionally-retained historical records under a recorded retention decision;
prefixes that are still-legal aliases per the current contract.
