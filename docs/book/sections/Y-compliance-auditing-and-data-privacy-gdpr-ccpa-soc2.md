---
section: Y
title: "Compliance, Auditing & Data Privacy (GDPR/CCPA/SOC2)"
group: saas-core
---

# [Y] Compliance, Auditing & Data Privacy (GDPR/CCPA/SOC2)

## Y:1 — Data Erasure: Absence of Cascading Hard-Deletion Triggers for Customer Offboarding

Data Erasure: Absence of Cascading Hard-Deletion Triggers for Customer Offboarding. Deleting a primary tenant account while leaving orphaned rows of user PII scattered across secondary analytical logs, storage directories, or background search tables, directly breaching GDPR Right to Be Forgotten requirements.

## Y:2 — PII Exposure: Writing Unencrypted Personal Records into Application Diagnostic Logs

PII Exposure: Writing Unencrypted Personal Records into Application Diagnostic Logs. Emitting raw user passwords, payment data, or telephone identifiers directly into system tracking outputs, exposing private tenant credentials to automated log aggregation tools and compliance validation failures.

## Y:3 — Immutable Auditing: Storing Security Incident Logs in Modifiable Directories

Immutable Auditing: Storing Security Incident Logs in Modifiable Directories. Archiving critical corporate access trails inside basic database tables or standard object storage layers without WORM policies, allowing a malicious actor to rewrite administrative system history to obscure unauthorized data extraction.

## Y:4 — Geolocation Isolation: Routing Regulated EU Citizen Data Across US Jurisdiction Subnets

Geolocation Isolation: Routing Regulated EU Citizen Data Across US Jurisdiction Subnets. Failing to restrict international network traffic boundaries for sensitive data, ensuring cross-border routing violations occur automatically under strict local sovereignty data compliance definitions.

## Y:5 — Retention: No per-data-class retention schedule — everything retained indefinitely "just…

Retention: No per-data-class retention schedule — everything retained indefinitely "just in case."

## Y:6 — DSAR: Subject access/export requests handled by ad-hoc production DB queries — slow, err…

DSAR: Subject access/export requests handled by ad-hoc production DB queries — slow, error-prone, unauditable.

## Y:7 — Consent: Records not versioned against the exact policy text/timestamp the user accepted

Consent: Records not versioned against the exact policy text/timestamp the user accepted.

## Y:8 — Subprocessors: Vendor list stale; data flowing to tools without DPAs or documented trans…

Subprocessors: Vendor list stale; data flowing to tools without DPAs or documented transfer mechanisms.

## Y:9 — Claims Drift: Security/privacy policy claims (encryption, retention) not matching the ac…

Claims Drift: Security/privacy policy claims (encryption, retention) not matching the actual implementation — audit findings waiting to happen.

## Y:10 — Access Reviews: No periodic review of who holds production data access; departed-employe…

Access Reviews: No periodic review of who holds production data access; departed-employee access lingering.

## Y:11 — Justification: Admin reads of customer data without actor, reason, and ticket reference…

Justification: Admin reads of customer data without actor, reason, and ticket reference in the audit log.

## Y:12 — Pseudonymization: "Anonymized" datasets re-identifiable via joins on quasi-identifiers

Pseudonymization: "Anonymized" datasets re-identifiable via joins on quasi-identifiers.

## Y:13 — Breach Runbook: No rehearsed incident-notification path against the 72-hour GDPR clock

Breach Runbook: No rehearsed incident-notification path against the 72-hour GDPR clock.

## Y:14 — Analytics PII: Session-replay/product-analytics tooling capturing form inputs and identi…

Analytics PII: Session-replay/product-analytics tooling capturing form inputs and identifiers by default.
