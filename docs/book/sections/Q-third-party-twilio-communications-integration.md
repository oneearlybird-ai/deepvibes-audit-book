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

## Q:15 — Media Streams: an entire control document round-tripped by value through a custom `<Parameter>`, past the provider's documented length ceiling

**Statement.** A service needs to hand per-call state (a rendered model prompt, a config document, a
context bundle) to its OWN downstream socket server, and ships it by value: serialized, signed, and
embedded in a `<Stream><Parameter>` in the TwiML response, so the provider carries it out and hands
it back on the media socket. The provider documents a hard ceiling on the combined length of each
custom parameter's name and value; a rendered instruction document exceeds it by one to two orders
of magnitude. The integration works only for as long as the provider declines to enforce its own
published limit — an untested, unversioned dependency on undefined behaviour whose enforcement turns
100% of inbound calls into a hard failure simultaneously, with no reference-based path to fall back
to. The same by-value transport is also a confidentiality decision nobody made: the blob is signed,
not encrypted, so its full contents are readable in the provider's request/response inspector by
every operator with console access to that account, and it persists there under the provider's log
retention, not the application's.

**Detect.** Enumerate every custom parameter emitted in TwiML and measure the RENDERED value length
against realistic production data, not a fixture — assemble the largest plausible document and count
the characters after serialization and encoding. Compare against the provider's currently published
limit, fetched at audit time. Then classify the payload: a short opaque reference (call id, session
handle, per-call ticket) is correct; anything the downstream service could instead resolve for itself
from a store it already reaches is state that should never have left the trust boundary. Check
whether the blob is merely signed (readable by anyone holding it) or encrypted, and whether the
provider's request inspector retains the response body.

**False positives.** Genuinely short references, even when signed, and even when several are present;
integrations where the published limit has been raised or the provider documents the field as
unbounded — cite the current published limit as read at audit time, never from memory; parameters
carrying data the provider is contractually the system of record for.

## Q:16 — Voice: no explicit call-duration ceiling — the vendor default (hours) silently governs, while an internal drain budget is mistaken for the call cap

**Statement.** No `timeLimit` (or equivalent maximum-duration control) is set on the voice leg the
platform creates, so the vendor's default ceiling — typically measured in hours — is what actually
governs how long a call can run. Meanwhile the codebase contains a prominent internal duration
constant that LOOKS like a call cap but is not one: a shutdown drain budget ("the longest call we
will wait out on deploy"), a WebSocket idle timeout, or a billing meter interval. Operators and
security reviewers reason from that constant — sizing per-call credentials, toll exposure, and
abuse budgets to a call length the system never enforces. The gap compounds any credential-lifetime
finding: a per-call token sized "generously above the max call length" is actually sized against an
imaginary number, and a hostile or stuck call can run for the vendor default while continuously
metering cost and holding per-call authority.

**Detect.** Read the actual call-creation surface (TwiML render, REST dial call, SDK params) and
list every duration control present; if none is set, the vendor default applies — cite the vendor's
currently documented default, fetched at audit time. Then grep for duration constants near the media
path and classify each one honestly: drain budget, idle timeout, or true cap. Ask the owner what
they believe the max call length is and diff that against what is enforced. Check what downstream
values (credential TTLs, cost alarms, abuse thresholds) were derived from the believed cap.

**False positives.** Platforms where unbounded call length is the product (conference lines,
monitoring lines) and toll/credential exposure is bounded by other means (cite them); vendor
accounts with an account-level max-duration setting actually configured (verify in the live console
or API, not from memory); explicit product decisions documenting the vendor default as acceptable.


## Q:17 — Live-call transfer executed blind: no availability signal, no context handoff, no accept path for the transferee

**Statement.** The voice system transfers a live caller to a human's direct line as a bare call
redirect. The transferee has no idea who is calling or why (no summary, no caller identity ahead
of the bridge), has no way to accept or decline, and has no way to signal unavailability to the
system — so transfers land on people in meetings, off shift, or driving; callers get personal
voicemail or dead air after being told "connecting you now"; and the receptionist layer's promise
of a warm handoff is actually a cold dump. The complete shape is: a pre-transfer notification to
the transferee (caller identity plus a one-line summary, sent over the PLATFORM's own
notification channel so it never counts against — or waits behind — the tenant's outbound
messaging line), an accept/decline affordance, a per-target availability state (busy/available)
the agent can read so it offers message-taking instead of a doomed transfer, and a designed
message-taking fallback that delivers the summary and caller callback details to the same target
reliably (queued, retried, never silently dropped).

**Detect.** Read the transfer tool and flow end to end: what does the transferee receive before
their phone rings (anything?), what availability state can targets set (anything?), what happens
on no-answer (a personal voicemail? re-prompt? message capture?). A bare Dial/redirect with no
surrounding state machine is the finding.

**False positives.** Deliberate cold-transfer products (call centers with hunt groups and
always-on staffing); systems where the transferee runs a client that itself provides screen-pop
and accept (the affordance exists, just elsewhere); internal-only transfers between
always-staffed desks.
