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

## FF:12 — The outbound confirmation is composed independently of the write it describes, so a recipient who is owed an error is actively told the thing happened

**Statement.** A handler performs a write and then notifies someone that it happened. The notification
is authored as a fixed sentence at the call site — "recorded", "sent", "updated" — rather than from the
write's return value, so the message is a statement about *intent*, not about *outcome*. As long as the
write is real and rarely fails, the two agree and nothing surfaces. They come apart in three ways, and
all three ship silently: the write is behind a seam that is a no-op in this build, so it never happened
at all; the write is real but returns a refusal the caller does not inspect (a precondition failed, the
target was closed, the row had moved); or the write throws into a catch that logs and continues to the
same fixed sentence. This is strictly worse than a silent failure. A silent failure leaves the
recipient uncertain and likely to check; a false confirmation spends their trust, ends their attention,
and moves the discovery of the problem to the far side of someone acting on it — a reply believed
delivered, a record believed updated. Because the sentence is a literal, no test that asserts on the
outgoing message can detect the divergence: the assertion and the code agree, and both are wrong.

**Detect.** For every outbound message that asserts a completed side effect, find the write it claims
and follow the value: is the message selected from the write's result, or is it a literal on a path the
write's outcome cannot influence? Any confirmation reachable on both the success and failure branch of
its own write is the finding. Check the seam behind the write in the production dependency factory
(A:47) — a no-op writer under a fixed confirmation is this defect's most complete form. Read the
refusal cases specifically: a writer that returns a reason code nobody destructures is the same defect
one step less obvious. The fix shape is an outcome function that maps the write's actual result to the
sentence, so a new refusal reason cannot reach the recipient as a success.

**False positives.** Acknowledgements that are explicitly about receipt rather than completion, where
the wording says so ("we have your request"). Fire-and-forget notifications whose contract is
at-least-once delivery of an event that already happened upstream. Confirmations sent after a write
whose failure modes all throw, where the send is genuinely unreachable on failure and the catch does
not fall through to it.

## FF:13 — The sending service's account-level verification state is a separate gate from the identity grant, and its refusal names the recipient rather than the sender, so the refusal reads as a policy defect and policy is widened while the real blocker is untouched

**Statement.** Managed sending services impose two independent gates on a send: the caller's
identity permissions, and the account's own sending state — a probation, sandbox, or trial mode in
which the service delivers only to addresses that have been explicitly verified. The two gates fail
through the same channel. The refusal arrives as an authorization error, in the vocabulary of
permissions, and it names a resource: the identity it evaluated. In sandbox mode that identity is
the RECIPIENT's, because the recipient's verification is what was missing — and a recipient is
exactly the resource an operator's policy has no reason to name. The error therefore reads as a
grant that is too narrow, and the natural response is to widen it: add the resource the message
named, or loosen the action, or drop the condition that looked responsible. Each attempt produces
the same refusal, because neither attempt touches the gate that is closed, and each one leaves a
permanent widening behind in exchange for nothing. The pattern is self-reinforcing: the closer the
operator reads the error, the more precisely they widen the wrong policy, and a service whose
account-level state is invisible from the call site can absorb an unbounded number of these before
anyone questions the diagnosis. The residue is the real cost — a policy carrying resources and
actions that were added by a misreading and that no later reviewer can distinguish from intent.

**Detect.** Before changing any policy in response to a send refusal, read the account's sending
state from the service's own API — sandbox or production, and the list of verified identities — and
check whether the named resource is a recipient rather than the sender. A refusal naming an
identity the caller never intended to act upon is the signature, and it means the gate is
verification, not permission. Declare the recipients the account must reach, so the verification
that lifts the gate is requested by the provisioning that depends on it rather than performed by
hand and forgotten. Then audit the policy for residue: read the history of every grant on the
sending role and remove the resources and actions that were added chasing a refusal, since each one
is a widening that bought nothing. Where the grant is genuinely wrong, constrain what the role may
send AS rather than which identity the service happens to evaluate — the sender is the thing worth
pinning and is stable across the service's internal choices.

**False positives.** Accounts already out of sandbox, where the same refusal genuinely is a grant
defect. Services that name the sender in the refusal, where the message is not misleading. And
policies deliberately naming recipient identities for a documented reason, such as a fixed
allow-list of destinations enforced at the permission layer as a second control.
