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

## FF:10 — The sending identity's DEFAULT configuration set names a set that no longer exists, so every send fails on a resource the caller never mentioned while the identity still reports itself verified and enabled

**Statement.** Email services let an identity carry a default configuration set, applied implicitly to every message sent from it. This is convenient precisely because callers never name it: application code, operational scripts, and alerting all send without referencing the set at all. That convenience is what makes its removal invisible. When the set is deleted — by an environment demolition, an account migration, or a hand-created resource that no template ever owned — the identity keeps the dangling name, and every send fails at call time with a not-found error naming a resource the caller did not ask for and cannot find in its own code. Nothing upstream reports a problem: the identity remains verified, sending remains enabled, the account's reputation and enforcement status stay healthy, and every health probe that asks "can this identity send?" answers yes, because the failure lives one level below the property being checked. The blast radius is total for that identity — transactional mail, operational digests, and alert delivery all stop together — and because the loudest casualties are usually the reports that would have told someone, the outage actively suppresses its own signal.

**Detect.** For every sending identity, read its default configuration set name and then confirm that a set by that name EXISTS; the two facts are stored separately and a listing of configuration sets is the only way to close the gap. Do not accept identity verification status, sending-enabled flags, or account health as evidence that sending works — send a real message, or find one delivered recently. Establish the outage's start from the last message actually delivered rather than from the last one attempted: where sends are archived or self-copied, the gap in that archive dates it. Finally, check whether the configuration set is declared in infrastructure at all; a set that only ever existed by hand will be removed by any demolition that sweeps unmanaged resources, and will not come back with an apply.

**False positives.** Identities whose default set exists and is merely misconfigured, which is a different and usually milder defect; environments where sends legitimately fail for sandbox or suppression reasons that must be excluded by reading the actual error; and identities that are verified deliberately for receiving only, where no send path exists to break.

## FF:11 — A subdomain's signing-key record is published with the parent domain's public key, so every "is signing configured" check passes and every signature fails

**Statement.** A second mail domain is stood up alongside the primary — a subdomain for sales,
support, billing, or a regional brand — and the provider issues it its OWN key pair. Publishing
the key is a copy-paste step into DNS, and the record that is already in the zone for the parent
domain is the nearest thing to copy. The result is a record that is present, syntactically valid,
correctly named, and wrong: the selector resolves, the tag list parses, the key is a well-formed
public key, and it is not the key the subdomain's messages are signed with. Every check that asks
"is signing configured for this domain?" — the provider's dashboard, a zone audit, an
infrastructure gate comparing declared records to live ones, a spot-check that a TXT record exists
at the selector — answers yes, because each is testing for presence, not for correspondence to the
private key actually signing. Receivers do the only test that matters and fail it, silently from
the sender's side: the messages are not bounced, they are downgraded, and under an enforcing
policy on that subdomain they are quarantined or discarded while the parent domain's mail flows
normally. The failure therefore presents as "our sales mail goes to spam", weeks after the record
was published, with a zone file that looks correct to everyone who reads it.

**Detect.** Do not compare the record against the zone declaration; compare it against the
PROVIDER's currently issued key for that exact domain, fetched from the provider. A subdomain
selector whose published key is byte-identical to the parent domain's is the finding on sight —
grep the zone for duplicated key material across names. Then verify end to end by sending a real
message from each domain and reading the receiver's authentication results, and read each
domain's own policy record: a subdomain with an enforcing policy and a mismatched key is
actively losing mail, which sets the severity. Where a provider rotates keys, confirm which key
is current rather than which one was correct when the record was written.

**False positives.** Providers that deliberately sign a subdomain with the parent's key under a
relaxed alignment policy, where the private key genuinely is shared — this must be confirmed
from the provider's configuration, not assumed from the records matching; selectors deliberately
carrying an old key during a documented rotation overlap, where the new selector exists and
carries the new key; and records whose key differs only in formatting (quoting or line splitting
of the same base64 body), which is a presentation difference, not a key mismatch.
