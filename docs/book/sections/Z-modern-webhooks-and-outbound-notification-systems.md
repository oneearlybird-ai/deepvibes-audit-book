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

## Z:12 — The callback route goes live in one deploy unit and its gateway-to-function invoke grant in another, so the vendor's POSTs die at the gateway during the window — and fire-and-forget callbacks never tell anyone

**Statement.** Inbound platform callbacks (status webhooks, delivery receipts, stream events) are
wired as gateway route → function integration, where the gateway needs an explicit invoke grant on
the target (a resource-policy statement scoped to the route, or an integration credentials role).
When the feature's code, the route, and the grant travel in different commits or different
stack applies, there is a window where the route exists and the handler is deployed but the
gateway's invoke is denied: the vendor's POSTs answer 5xx with an integration-layer 403 visible
only in the gateway's access log. Many callback classes are fire-and-forget — the vendor does not
retry and surfaces the failure only in its own console — so every callback in the window is
silently lost, and whatever the callbacks were supposed to stamp (session limits, delivery state,
lifecycle timestamps) is simply absent for those sessions. Per-route grant scoping — the correct
least-privilege posture — is exactly what makes each NEW route a fresh opportunity for this gap:
the wildcard that would have masked the miss is the thing the posture forbids.

**Detect.** Enumerate the gateway's routes with function integrations and, for each, prove the
invoke path: a resource-policy statement whose source ARN covers that route (on the ALIAS if the
integration targets one — an unqualified-function policy does not answer for the alias), or a
credentials role with invoke on the target. Assert the parity mechanically in a repo gate so a
route cannot merge without its grant. In access logs, search for 5xx with integration status 403
on callback paths — each hit is a lost vendor event. Check deploy ordering: if routes and grants
live in different stacks, the grant's stack must apply before or with the route's.

**False positives.** Gateways invoking through integration credentials roles that already cover
the target (no per-route statements to forget); routes deliberately dark-launched with the grant
withheld (must be documented as intentional); vendor callbacks with durable retry and a dead-letter
surface, where the window costs latency rather than data.
