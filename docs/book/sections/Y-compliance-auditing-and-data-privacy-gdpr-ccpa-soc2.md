---
section: Y
title: "Compliance, Auditing & Data Privacy (GDPR/CCPA/SOC2)"
group: saas-core
---

# [Y] Compliance, Auditing & Data Privacy (GDPR/CCPA/SOC2)

## Y:1 — Data Erasure: Absence of Cascading Hard-Deletion Triggers for Customer Offboarding

Data Erasure: Absence of Cascading Hard-Deletion Triggers for Customer Offboarding. Deleting a primary tenant account while leaving orphaned rows of user PII scattered across secondary analytical logs, storage directories, or background search tables, directly breaching GDPR Right to Be Forgotten requirements.

## Y:2 — PII Exposure: Writing Unencrypted Personal Records into Application Diagnostic Logs

PII Exposure: Writing Unencrypted Personal Records into Application Diagnostic Logs. Emitting raw user passwords, payment data, or telephone identifiers directly into system tracking outputs, exposing private tenant credentials to automated log aggregation tools and compliance validation failures.

## Y:3 — Immutable Auditing: Storing Security Incident Logs in Modifiable Directories

Immutable Auditing: Storing Security Incident Logs in Modifiable Directories. Archiving critical corporate access trails inside basic database tables or standard object storage layers without WORM policies, allowing a malicious actor to rewrite administrative system history to obscure unauthorized data extraction.

## Y:4 — Geolocation Isolation: Routing Regulated EU Citizen Data Across US Jurisdiction Subnets

Geolocation Isolation: Routing Regulated EU Citizen Data Across US Jurisdiction Subnets. Failing to restrict international network traffic boundaries for sensitive data, ensuring cross-border routing violations occur automatically under strict local sovereignty data compliance definitions.

## Y:5 — Retention: No per-data-class retention schedule — everything retained indefinitely "just…

Retention: No per-data-class retention schedule — everything retained indefinitely "just in case."

## Y:6 — DSAR: Subject access/export requests handled by ad-hoc production DB queries — slow, err…

DSAR: Subject access/export requests handled by ad-hoc production DB queries — slow, error-prone, unauditable.

## Y:7 — Consent: Records not versioned against the exact policy text/timestamp the user accepted

Consent: Records not versioned against the exact policy text/timestamp the user accepted.

## Y:8 — Subprocessors: Vendor list stale; data flowing to tools without DPAs or documented trans…

Subprocessors: Vendor list stale; data flowing to tools without DPAs or documented transfer mechanisms.

## Y:9 — Claims Drift: Security/privacy policy claims (encryption, retention) not matching the ac…

Claims Drift: Security/privacy policy claims (encryption, retention) not matching the actual implementation — audit findings waiting to happen.

## Y:10 — Access Reviews: No periodic review of who holds production data access; departed-employe…

Access Reviews: No periodic review of who holds production data access; departed-employee access lingering.

## Y:11 — Justification: Admin reads of customer data without actor, reason, and ticket reference…

Justification: Admin reads of customer data without actor, reason, and ticket reference in the audit log.

## Y:12 — Pseudonymization: "Anonymized" datasets re-identifiable via joins on quasi-identifiers

Pseudonymization: "Anonymized" datasets re-identifiable via joins on quasi-identifiers.

## Y:13 — Breach Runbook: No rehearsed incident-notification path against the 72-hour GDPR clock

Breach Runbook: No rehearsed incident-notification path against the 72-hour GDPR clock.

## Y:14 — Analytics PII: Session-replay/product-analytics tooling capturing form inputs and identi…

Analytics PII: Session-replay/product-analytics tooling capturing form inputs and identifiers by default.

## Y:15 — Consent evidence exists only inside transient or co-mingled artifacts — no durable per-subject consent record, so send-eligibility is unprovable

**Statement.** The system captures consent (a spoken yes on a recorded call, a YES reply in a
double-opt-in message flow) and even gates behavior on it, but the EVIDENCE lives only inside
artifacts owned by other lifecycles: the full-call recording (retention governed by call-log
policy, deletable with it, findable only by replaying calls) and the message log (co-mingled
with all traffic). There is no durable, per-subject consent artifact — the specific recording
clip or message excerpt that constitutes the grant — stored under the subject's identity in
tenant-controlled storage, and no per-subject event HISTORY (grant, channel, purpose,
revocation, re-grant, each with timestamp and an evidence pointer). When a regulator, carrier,
or litigant asks to prove a subject opted in to marketing messages and had not revoked at send
time, the answer requires archaeology across recordings and logs that may already be expired.
Distinct purposes (transactional reminders vs marketing) and distinct capture channels (voice vs
text) each need their own grant chain; a single opted-in boolean collapses legally distinct
consents into one bit. The eligibility gate for every automated send must read this history —
not a flag — and the subject's profile surface must render the full timeline.

**Detect.** Find every consent capture point and trace where the EVIDENCE (not the flag) is
persisted: is there a per-subject artifact copy in durable tenant storage with its own retention,
or only a pointer into call/message logs? Check that the revocation path writes the same
history. Then read the automated-send eligibility gate: does it evaluate the event history per
(subject, purpose, channel) at send time, or a mutable boolean? Finally check the operator
surface: can a tenant produce a subject's full consent timeline without engineering help?

**False positives.** Systems whose call/message stores genuinely are immutable, per-subject
indexed, retention-pinned to consent-record requirements, AND exportable per subject (the
artifact requirement is satisfied in place — verify the retention config, not the intent);
low-risk purely transactional flows in jurisdictions where implied consent suffices (name the
basis); platforms where a dedicated consent-management vendor holds the record and the
integration stores its receipt ids per subject.

## Y:16 — Raw contact identifiers embedded in storage keys, which replicate everywhere values are redacted

**Statement.** A storage key (partition/sort key, cache key, rate-limit bucket, queue
deduplication id) embeds a raw contact identifier — phone number, email address — usually because
the key must be stable per contact (a rate limiter per destination, a dedupe per recipient). Keys
travel where attribute VALUES never do: structured logs print them, traces and error reports carry
them, parity/audit tooling enumerates them, stream records and backups replicate them — so every
value-level PII control (redaction, field encryption, log scrubbing) is bypassed by the key
itself. The defect often coexists with a correct sibling (an adjacent principal bucket already
hashed), proving the author knew the posture and the raw variant slipped review.

**Detect.** Enumerate key-construction sites for stores, caches, and limiters; flag any that
interpolate phone/email/name-shaped inputs without a digest. The stability requirement never needs
the raw value — a keyed hash or truncated digest of the identifier preserves per-contact
bucketing. Confirm nothing reads the identifier BACK out of the key (parsing a key to recover a
phone number is the same defect plus a data-model smell). Check what surfaces enumerate keys:
verifier output, parity reports, admin tooling.

**False positives.** Stores whose entire purpose is identifier lookup and which are classified,
access-controlled, and logged accordingly (a contacts table keyed by normalized phone with a
documented posture); opaque tenant/workspace ids that merely look identifier-shaped; digests
mistaken for raw values.

## Y:17 — The agent persona instructs the model to preserve the caller's belief that it is human and supplies a canned deflection for the direct question, turning a disclosure duty into active concealment

**Statement.** Synthetic-voice personas are tuned for naturalness, and a line that reads as a
tone instruction to its author — callers assume they are speaking to a person, keep it that way —
is an instruction to conceal. Paired with the usual companion, a scripted deflection for the
question "am I speaking to a machine", it moves the system across a legal line that mere
naturalness never approaches. Several jurisdictions require disclosure of automated interaction
on request or outright, recording-consent regimes attach to what the caller believes they are
joining, and sector rules add their own; the exposure does not depend on any of them being cited,
because a system that answers the direct question falsely is misrepresentation on its own terms.
Two properties make it durable. First, it lives in the persona layer, which is content — curated
in templates, materialized into hundreds of per-vertical copies, reviewed as writing rather than
as policy, and never touched by the security review that reads the code. Second, it is invisible
in testing: the concealment only manifests when a caller asks, and scripted conversation tests do
not ask. The remedy is not the opposite mandate — an agent that opens every call with a
disclosure it was not asked for is a worse product — but a neutral identity: the model neither
volunteers nor denies, and answers the direct question truthfully.

**Detect.** Read the persona and identity sections of every prompt template and every
materialized copy, not just the base, since verticals fork. Grep the whole prompt corpus for
instructions about what the caller believes, for scripted answers to automation questions, and
for any directive to avoid, deflect or redirect the subject. Then test it as a caller would: ask
the running agent directly, on more than one vertical, and read the answer. Check the count of
materialized copies against the count of sources — a fix applied to templates that is not
regenerated leaves the live plane unchanged, and the live plane is what answers the phone.

**False positives.** Naturalness instructions that carry no claim about identity ("speak
conversationally", "avoid robotic phrasing") — these are style and are not this rule. A
deployment whose opening disclosure already states the automation, where a later line merely
avoids repeating it. Regulated deployments that carry a documented, counsel-reviewed disclosure
posture different from the default; the finding is an undocumented concealment instruction, not a
disagreement about wording.
