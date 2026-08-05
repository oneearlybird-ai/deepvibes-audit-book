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

## P:19 — A user-typed redemption string resolved against the wrong one of two provider namespaces that share it, so a retired object shadows the live one

**Statement.** Payment providers expose promotional value through two distinct object namespaces: a
durable internal object (the discount/coupon, usually operator-created and long-lived) and a
customer-facing redemption object (the promotion/redemption code, which references the internal one).
Both are addressable by short human strings, both accept the same string, and the same word is
routinely used for a retired internal object AND a live customer-facing one. A redeem path that
resolves the typed string against the INTERNAL namespace first will find the retired object and stop
— never reaching the live redemption code that points at a valid replacement — and reject the
redemption with the retired object's own state ("expired", "inactive"), which reads as a correct
answer about the string the customer typed. The error message is true about the object the code
found and false about the code the customer holds, so the report arrives as "your discount is broken"
and the logs agree with the code rather than the customer. The defect is invisible until the two
namespaces first collide on one string, which is exactly when a marketing code is reissued after its
predecessor is retired — the highest-traffic moment for that string.

**Detect.** Find every path that resolves a user-supplied redemption string and read the ORDER of
lookups. The correct order is dictated by what the user was given, not by what is convenient to
retrieve: if the string was printed on a campaign, it is a redemption code and must resolve in that
namespace first, with the internal-object lookup reserved for operator-issued identifiers that have
no redemption code. Then hunt the collision directly rather than reasoning about it — list the live
redemption codes and the retired internal objects and intersect their identifier strings
case-insensitively; any intersection is a live incident, not a hypothetical. Check the validity
predicate too: a redemption code and the object it references have SEPARATE validity, expiry and
usage-cap state, and a path that validates only one of them will both accept expired redemptions and
reject live ones. Finally, confirm against the provider's real API rather than the test double,
because doubles for this class are routinely written to return whichever object the test author had
in mind, which makes the ordering bug unreachable in the suite.

**False positives.** Integrations that expose only one namespace to customers and use the other
purely for operator-issued identifiers, where the ordering is deliberate and documented; providers
whose lookup endpoint genuinely searches both namespaces and disambiguates server-side; and paths
where the string is not user-typed but selected from a server-rendered list carrying the resolved
object id, where no namespace ambiguity exists.
