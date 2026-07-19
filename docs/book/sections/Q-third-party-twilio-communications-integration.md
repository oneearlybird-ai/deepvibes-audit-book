---
section: Q
title: "Third Party: Twilio Communications Integration"
group: third-party
---

# [Q] Third Party: Twilio Communications Integration

## Q:1 — Webhooks: Inbound SMS/Voice webhook endpoints completely missing Request Validation (che…

Webhooks: Inbound SMS/Voice webhook endpoints completely missing Request Validation (checking the X-Twilio-Signature header), allowing forged requests.

## Q:2 — Toll Fraud: Outbound SMS logic lacking aggressive user-level rate limiting or CAPTCHA, e…

Toll Fraud: Outbound SMS logic lacking aggressive user-level rate limiting or CAPTCHA, exposing the app to devastating SMS Pumping / Toll Fraud attacks.

## Q:3 — TwiML Injection: Unsanitized user inputs dynamically interpolated and returned directly…

TwiML Injection: Unsanitized user inputs dynamically interpolated and returned directly into TwiML XML (<Say> or <Dial> tags).

## Q:4 — Logs: Leaving Sensitive Verification Passcodes in Twilio Outbound Logs

Logs: Leaving Sensitive Verification Passcodes in Twilio Outbound Logs. Sending plain-text OTP security pins via SMS without utilizing Twilio's specialized verification architecture, leaving clear security verification vectors exposed to anyone with dashboard or log read privileges.

## Q:5 — Webhooks: Processing Unbound Inbound Call Requests Without Strict Stutter Controls

Webhooks: Processing Unbound Inbound Call Requests Without Strict Stutter Controls. Accepting unrestricted inbound webhook bursts to backend processing architectures, allowing an adversary to execute massive loop attacks by spamming automated voice paths.

## Q:6 — Geo Permissions: International/premium-rate destinations left enabled, multiplying toll-…

Geo Permissions: International/premium-rate destinations left enabled, multiplying toll-fraud blast radius.

## Q:7 — Credentials: Master Auth Token used in app code instead of scoped API keys; no subaccoun…

Credentials: Master Auth Token used in app code instead of scoped API keys; no subaccount isolation per environment/tenant.

## Q:8 — Status Callbacks: Delivery failures invisible — no handler for failed/undelivered messag…

Status Callbacks: Delivery failures invisible — no handler for failed/undelivered message statuses, no alerting on error-rate spikes.

## Q:9 — Voice: No fallback URL on phone-number config — a single webhook outage hard-drops live…

Voice: No fallback URL on phone-number config — a single webhook outage hard-drops live inbound calls.

## Q:10 — Media: Inbound MMS media URLs fetched server-side without validation/content-type checks…

Media: Inbound MMS media URLs fetched server-side without validation/content-type checks (SSRF, malware relay).

## Q:11 — Opt-Out: STOP/HELP keywords not honored in custom sending paths — direct TCPA liability

Opt-Out: STOP/HELP keywords not honored in custom sending paths — direct TCPA liability.

## Q:12 — Streams: Media Streams/ConversationRelay WebSocket endpoints accepting connections witho…

Streams: Media Streams/ConversationRelay WebSocket endpoints accepting connections without authenticating the upgrade.

## Q:13 — Throughput: Outbound bursts exceeding carrier/number throughput with no queue — 429s and…

Throughput: Outbound bursts exceeding carrier/number throughput with no queue — 429s and filtered messages unhandled.

## Q:14 — Phone-format drift: multiple writers persist unnormalized numbers, breaking E.164-keyed delivery and consent joins

**Statement.** Different write paths persist the same logical phone field in different formats (E.164
from telephony webhooks, free-text from dashboards/imports). Everything keyed on the number then
splits: provider send APIs reject or misroute non-E.164 destinations, opt-out list checks miss
(the list holds E.164), consent/contact lookups fail to join, and dedupe by phone silently forks.

**Detect.** Enumerate every writer of each phone attribute and check for a shared normalization
(E.164) at the boundary. Then check senders and joiners: send calls, suppression-list checks, and
GSI/index lookups on phone must all consume the normalized form. Live data sampling (mixed formats
in the same column) is conclusive.

**False positives.** Display-only fields that are never sent, joined, or matched; systems that
normalize at READ time everywhere (verify every reader, not one).
