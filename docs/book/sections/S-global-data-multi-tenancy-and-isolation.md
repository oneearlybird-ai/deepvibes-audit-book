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
