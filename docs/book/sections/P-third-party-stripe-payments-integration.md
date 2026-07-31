---
section: P
title: "Third Party: Stripe Payments Integration"
group: third-party
---

# [P] Third Party: Stripe Payments Integration

## P:1 — Webhooks: Stripe webhook handlers immediately parsing req.body without cryptographically…

Webhooks: Stripe webhook handlers immediately parsing req.body without cryptographically verifying the payload signature using stripe.webhooks.constructEvent and the raw body buffer.

## P:2 — Idempotency: Mutating API calls (Charges, Subscriptions) missing Idempotency-Key headers…

Idempotency: Mutating API calls (Charges, Subscriptions) missing Idempotency-Key headers, risking massive double-charging during network retries.

## P:3 — Price Trust: Client-side calculating cart totals and sending raw pricing amounts to the…

Price Trust: Client-side calculating cart totals and sending raw pricing amounts to the backend instead of the backend securely fetching actual Stripe Price IDs.

## P:4 — Webhook Timeouts: Webhook processors blocking synchronously on heavy internal database o…

Webhook Timeouts: Webhook processors blocking synchronously on heavy internal database operations instead of instantly returning a 200 OK and processing asynchronously, causing Stripe retry floods.

## P:5 — Metadata: Storing Plain Customer PII Inside Stripe Core Objects

Metadata: Storing Plain Customer PII Inside Stripe Core Objects. Attaching raw user information (e.g., phone numbers, unencrypted company emails) directly to Stripe Metadata fields, exposing sensitive records during third-party integration audits or dashboard security breaches.

## P:6 — Events: Double-Processing Transactions Due to Event Typo Misconceptions

Events: Double-Processing Transactions Due to Event Typo Misconceptions. Misconfiguring webhook handlers to mistake invoice.payment_succeeded for charge.succeeded without validating business contexts, resulting in double-provisioning or duplicated user account credits.

## P:7 — Disconnect: Lack of Real-Time Customer Portal Webhook Sync

Disconnect: Lack of Real-Time Customer Portal Webhook Sync. Failing to process customer.subscription.deleted events instantly when triggered directly via the Stripe Customer Portal, allowing users to cancel billing but retain premium service access indefinitely.

## P:8 — Webhooks: No event.id-keyed dedupe store — Stripe's at-least-once delivery double-fires…

Webhooks: No event.id-keyed dedupe store — Stripe's at-least-once delivery double-fires provisioning logic.

## P:9 — Checkout: Success-URL provisioning without server-side verification of session payment_s…

Checkout: Success-URL provisioning without server-side verification of session payment_status — direct navigation grants paid features.

## P:10 — Dunning: past_due/incomplete/unpaid subscription states unhandled — no grace logic, no r…

Dunning: past_due/incomplete/unpaid subscription states unhandled — no grace logic, no recovery emails, no access revocation.

## P:11 — Keys: Test/live key mixups across environments; no runtime assertion on key prefix (sk_l…

Keys: Test/live key mixups across environments; no runtime assertion on key prefix (sk_live_ vs sk_test_).

## P:12 — Keys: The full-access secret key used everywhere instead of restricted keys scoped per s…

Keys: The full-access secret key used everywhere instead of restricted keys scoped per service.

## P:13 — Async Methods: Bank-debit/delayed-notification payment methods treated as instantly fina…

Async Methods: Bank-debit/delayed-notification payment methods treated as instantly final — fulfillment fires before funds settle.

## P:14 — Disputes: charge.dispute.created/refund events unhandled — refunded or disputed customer…

Disputes: charge.dispute.created/refund events unhandled — refunded or disputed customers keep entitlements.

## P:15 — Amounts: Currency math in floats instead of integer minor units; zero-decimal currencies…

Amounts: Currency math in floats instead of integer minor units; zero-decimal currencies mishandled.

## P:16 — Proration: Mid-cycle upgrades/downgrades unmodeled — entitlement state diverges from bil…

Proration: Mid-cycle upgrades/downgrades unmodeled — entitlement state diverges from billing reality.

## P:17 — Portal: Customer Portal configuration allowing plan switches/cancellation flows the appl…

Portal: Customer Portal configuration allowing plan switches/cancellation flows the application logic doesn't actually support.

## P:18 — Mandates: standing card-on-file charge authorization persisted as bare config — no consent artifact, no amount bound, no change notification

**Statement.** An auto-recharge / auto-top-up / usage-triggered purchase feature persists its
standing authorization as a plain configuration write ({enabled, threshold, amount} on an entity
row) while capturing no evidence of the agreement it purports to represent: no acting identity, no
timestamp-bound terms text or version, no client IP/user-agent, and no linkage to a network-level
mandate (a credential stored with declared off-session usage / stored-credential consent). The
config carries no per-charge or per-period AMOUNT ceiling — a count cap alone leaves exposure =
count × an unbounded customer-set amount — and enable/change transitions notify nobody. Card-network
stored-credential frameworks require a cardholder agreement, captured when the credential is stored,
covering how amounts are determined, the triggering event, and cancellation; a merchant whose only
artifact is a config row defends "I never agreed to this" with an application log. Distinct from
Y:7 (consent records exist but are unversioned): here no consent record exists at all, on the money
path.

**Detect.** Find every writer of standing-charge configuration (auto-recharge, auto-top-up,
threshold-triggered purchasing). For each: (1) trace the write path for a consent artifact (actor,
terms version/hash, timestamp, IP/UA) written atomically with the config; (2) check the saved
credential's storage intent — was it saved with off-session usage declared, is a mandate/setup
artifact linked; (3) look for per-charge and per-period amount ceilings enforced both at the config
boundary and at charge-mint time; (4) check whether enable/change transitions emit any customer
notification.

**False positives.** Flows where every charge is customer-present through a hosted payment surface
(no standing authorization exists to record); processors that capture and store the mandate
themselves (e.g. bank-debit mandates held by the PSP) when the config row links that mandate id;
internal/admin-only lanes unreachable by customers.
