---
section: Z
title: "Modern Webhooks & Outbound Notification Systems"
group: saas-core
---

# [Z] Modern Webhooks & Outbound Notification Systems

## Z:1 — SSRF: Dispatching Outbound Webhooks Without Domain Architecture Sandboxing

SSRF: Dispatching Outbound Webhooks Without Domain Architecture Sandboxing. Allowing users to supply arbitrary webhook target registration URLs that the backend system attempts to ping from internal networks, enabling Server-Side Request Forgery attacks against private VPC services.

## Z:2 — Webhook Floods: Synchronous Retries Without Jitter on Target Outage States

Webhook Floods: Synchronous Retries Without Jitter on Target Outage States. Triggering massive backlogs of outbound user webhook notifications against a failing target customer server with fixed, concurrent retry timings, unintentionally launching a distributed denial-of-service attack against the subscriber.

## Z:3 — Missing Signature Layers: Outbound Payloads Sent Without Cryptographic Tokens

Missing Signature Layers: Outbound Payloads Sent Without Cryptographic Tokens. Broadcasting webhook state changes to customer endpoints without signing the payloads with a unique customer-shared secret key, preventing subscribers from verifying that the data originated from the authentic SaaS platform.

## Z:4 — Event Ordering: Delivering Sequential Status Updates Out of Chronological Sequence

Event Ordering: Delivering Sequential Status Updates Out of Chronological Sequence. Sending overlapping webhook status notifications (e.g., sending order.dispatched before a delayed order.processed event arrives) without sequence counters, breaking the accurate tracking of data states on subscriber architectures.

## Z:5 — Replay: Signature schemes without timestamps — captured payloads stay valid forever

Replay: Signature schemes without timestamps — captured payloads stay valid forever.

## Z:6 — Secret Rotation: Per-endpoint webhook secrets not rotatable with a dual-secret overlap w…

Secret Rotation: Per-endpoint webhook secrets not rotatable with a dual-secret overlap window.

## Z:7 — Timeouts: Dispatchers without per-delivery timeouts — one slow subscriber stalls the sha…

Timeouts: Dispatchers without per-delivery timeouts — one slow subscriber stalls the shared worker pool.

## Z:8 — Visibility: No customer-facing delivery log/dead-letter view — subscribers can't see wha…

Visibility: No customer-facing delivery log/dead-letter view — subscribers can't see what they missed.

## Z:9 — Payload Scope: Full PII objects pushed in webhook bodies instead of IDs + authenticated…

Payload Scope: Full PII objects pushed in webhook bodies instead of IDs + authenticated fetch-back.

## Z:10 — Redirects: Outbound webhook clients following 3xx responses — a validated URL redirects…

Redirects: Outbound webhook clients following 3xx responses — a validated URL redirects into internal network targets.

## Z:11 — TOCTOU: Target URL validated at registration only — DNS rebinding flips it to an interna…

TOCTOU: Target URL validated at registration only — DNS rebinding flips it to an internal IP at delivery time.
