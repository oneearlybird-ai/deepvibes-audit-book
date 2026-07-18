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
