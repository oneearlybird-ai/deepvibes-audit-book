---
section: FF
title: "Email & Transactional Notifications"
group: platform-delivery
---

# [FF] Email & Transactional Notifications

## FF:1 — Auth: SPF/DKIM/DMARC unconfigured, or DMARC parked at p=none indefinitely — the domain r…

Auth: SPF/DKIM/DMARC unconfigured, or DMARC parked at p=none indefinitely — the domain remains spoofable.

## FF:2 — Reputation: Bounce/complaint feedback loops unhandled — SES/SendGrid suspends sending at…

Reputation: Bounce/complaint feedback loops unhandled — SES/SendGrid suspends sending at the worst possible moment.

## FF:3 — Suppression: No suppression-list check before send — repeatedly mailing hard-bounced and…

Suppression: No suppression-list check before send — repeatedly mailing hard-bounced and complained addresses.

## FF:4 — Injection: User-supplied content interpolated into HTML email templates unescaped

Injection: User-supplied content interpolated into HTML email templates unescaped.

## FF:5 — Links: Reset/magic-link emails with long-lived, multi-use, or non-invalidated links

Links: Reset/magic-link emails with long-lived, multi-use, or non-invalidated links.

## FF:6 — Environments: Staging sharing the production sending domain — test blasts damage product…

Environments: Staging sharing the production sending domain — test blasts damage production deliverability reputation.

## FF:7 — Criticality Tiers: OTP/security email sharing queues and rate limits with marketing — lo…

Criticality Tiers: OTP/security email sharing queues and rate limits with marketing — login emails delayed behind newsletters.
