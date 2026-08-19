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

## FF:8 — Transport: Outbound sending configuration leaves TLS optional — silent downgrade to cleartext SMTP

**Statement.** The sending pipeline's delivery configuration (provider configuration set, relay
settings) leaves transport encryption at its opportunistic default instead of requiring TLS. The
provider then delivers over cleartext SMTP whenever a receiving MX fumbles or omits STARTTLS — which
includes downgrade-by-interception positions — and nothing in the sending path logs that the
downgrade happened. Auth links, invites, receipts, and operational notifications transit the open
internet readable, occasionally and silently. The defect usually enters as an omission: the IaC
resource simply has no delivery/TLS block, and the provider's default (optional) wins without anyone
having chosen it.

**Detect.** Read the sending configuration in IaC AND live (an absent block commonly means
optional — verify what the provider returns, not what the default is documented to be). Identify
which mail classes ride the configuration: transactional/auth mail is exactly the class where
require-TLS is the correct trade. Check per-identity or per-message overrides that might bypass the
config set entirely.

**False positives.** Deliberately opportunistic broadcast/marketing lanes where reaching legacy MX
hosts is a documented availability trade-off; providers or regions that enforce TLS unconditionally
regardless of configuration (verify against current provider documentation); inbound/receipt-rule
TLS settings, which gate what senders may do and carry a different availability calculus.

## FF:9 — Non-ASCII typography in machine-generated copy, re-encoded by a hop nobody controls

**Statement.** Templated outbound copy contains typographic characters outside ASCII — em dashes,
curly quotes, middots, non-breaking spaces. The sender declares the right charset and renders
correctly; somewhere along the delivery chain a gateway, list processor, archiver or client
re-encodes the body, and the recipient reads mojibake in the middle of a sentence. The sending side
is not at fault and cannot be fixed, which is exactly why defending against it fails: the only
reliable control is to not emit characters the chain can mangle. Note the scope boundary — this
applies to OUR copy, never to interpolated customer data, which must stay full Unicode so names and
business names render correctly.

**Detect.** Render every message type and scan the output for codepoints above 0x7F, separating
template copy from interpolated values. Gate it statically, with the file list DISCOVERED from
imports of the template module rather than hand-registered, so a sender written later is covered the
day it exists. Confirm the templates and the transport still declare a Unicode charset for the data
half.

**False positives.** Deliberately localized copy in a language ASCII cannot express — there the fix
is transport hardening and encoding tests, not transliteration; internal-only mail with a known
client.
