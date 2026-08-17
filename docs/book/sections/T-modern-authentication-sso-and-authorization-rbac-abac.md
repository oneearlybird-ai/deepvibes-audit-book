---
section: T
title: "Modern Authentication, SSO & Authorization (RBAC/ABAC)"
group: saas-core
---

# [T] Modern Authentication, SSO & Authorization (RBAC/ABAC)

## T:1 — JWT Validation: Blindly Relying on Token Header alg: "none"

JWT Validation: Blindly Relying on Token Header alg: "none". Processing incoming JWT payloads without forcing specific signature verification algorithms, allowing malicious clients to forge valid administrative user structures by submitting an unsigned token with the algorithm header set to "none".

## T:2 — SAML/SSO: Missing Replay Attack Protections on XML Assertions

SAML/SSO: Missing Replay Attack Protections on XML Assertions. Validating corporate single sign-on assertions without verifying unique ID attributes or tracking absolute timestamp expirations, allowing an intercepted SAML response to be resent to log into the application.

## T:3 — Refresh Tokens: Storing Long-Lived Refresh Tokens in Plaintext Databases

Refresh Tokens: Storing Long-Lived Refresh Tokens in Plaintext Databases. Saving persistent user application access keys inside system databases without strong cryptographic hashing, meaning a database leak gives attackers instant, long-term access to every user account on the platform.

## T:4 — AuthZ Cache: Stale Role Permissions Retained in Local Edge State

AuthZ Cache: Stale Role Permissions Retained in Local Edge State. Storing a user's permission scopes or subscription state in an immutable Edge cookie or long-lived cache, enabling de-provisioned or banned users to continue executing administrative API operations until the cache naturally expires.

## T:5 — JWT Claims: aud/iss/exp/nbf unvalidated — tokens minted for other apps in the same IdP a…

JWT Claims: aud/iss/exp/nbf unvalidated — tokens minted for other apps in the same IdP accepted here.

## T:6 — Session Fixation: Session identifier not rotated at login and privilege elevation

Session Fixation: Session identifier not rotated at login and privilege elevation.

## T:7 — Reset Tokens: Password-reset tokens long-lived, multi-use, or surviving a successful pas…

Reset Tokens: Password-reset tokens long-lived, multi-use, or surviving a successful password change.

## T:8 — OAuth: Public clients without PKCE; state parameter unchecked — auth-code interception a…

OAuth: Public clients without PKCE; state parameter unchecked — auth-code interception and login CSRF.

## T:9 — MFA: Step-up/re-auth absent on sensitive operations; recovery paths (SMS, backup email)…

MFA: Step-up/re-auth absent on sensitive operations; recovery paths (SMS, backup email) weaker than the primary factor.

## T:10 — BOLA/IDOR: Authorization checked at the route level but not per-object in service/data l…

BOLA/IDOR: Authorization checked at the route level but not per-object in service/data layers.

## T:11 — Staleness: Role/permission changes only take effect at next login — no token refresh or…

Staleness: Role/permission changes only take effect at next login — no token refresh or revocation push.

## T:12 — Brute Force: Login, OTP, and reset endpoints without progressive delays, lockouts, or de…

Brute Force: Login, OTP, and reset endpoints without progressive delays, lockouts, or device fingerprinting.

## T:13 — JWKS: Key sets fetched per-request without caching/kid handling — or cached forever, bre…

JWKS: Key sets fetched per-request without caching/kid handling — or cached forever, breaking key rotation.

## T:14 — Logout: Client-side-only logout — the server session and refresh token remain valid

Logout: Client-side-only logout — the server session and refresh token remain valid.

## T:15 — Email Change: Address changes without re-verifying both old and new addresses — a silent…

Email Change: Address changes without re-verifying both old and new addresses — a silent account-takeover vector.

## T:16 — B2B Keys: Customer API keys stored unhashed and retrievable in full after creation

B2B Keys: Customer API keys stored unhashed and retrievable in full after creation.

## T:17 — Cookie Scope: Cookie-conditioned server behavior unreachable under the cookie's own scoping — Strict cookies expected on cross-site callbacks

**Statement.** A server path branches on the presence of a cookie whose declared attributes
(SameSite=Strict/Lax, Domain, Path, Secure) prevent the browser from ever attaching it to that
route's real request context — most commonly a SameSite=Strict session cookie expected on a
cross-site-initiated top-level navigation (OAuth/SSO callbacks, emailed deep links,
payment-provider return URLs). The cookie-present branch silently never executes in production
(or executes only for some arrival paths — an external-app open with a null initiator carries
Strict cookies, a webmail click does not), while unit tests fabricate the Cookie header on
synthetic events and stay green, advertising a feature the transport cannot deliver.

**Detect.** For every server read of a cookie, enumerate the request contexts that can actually
reach that route (same-site fetch/XHR, same-site top-level navigation, cross-site-initiated
top-level navigation or redirect chain, external-app open with null initiator) and check each
context against the cookie's minted attributes at its Set-Cookie site. Flag any branch that only
executes when the cookie arrives via a context its attributes exclude. Redirect chains take the
cross-site character of their initiating origin, not their destination; Set-Cookie on the
response still lands (SameSite gates sending, not setting), so "the mint works" is not evidence
the read works. Tests injecting Cookie headers into fabricated events for such routes are
corroborating evidence, not counter-evidence.

**False positives.** Routes reachable through multiple contexts where the cookie-present branch
is a designed progressive enhancement for same-site arrivals and the cookie-absent path is the
designed cross-site behavior (documented as such); cookies deliberately minted Lax or None
specifically so the cross-site route receives them; reads on endpoints provably called only via
same-site fetch (e.g. CSRF-token-gated POSTs).

## T:18 — Sign-out: identity teardown serialized behind unbudgeted best-effort network calls

**Statement.** Sign-out or session-revocation flows await best-effort network side effects (push unregister, server logout, telemetry flush) BEFORE clearing local credentials and leaving the authenticated UI, with no time budget. The calls' failure is already accepted (try/catch-swallowed), yet a degraded network extends the authenticated window on a device the user believes signed out. The hook contract "must not throw or hang" exists only as a comment with no enforcing mechanism.

**Detect.** Trace the sign-out path: enumerate every await between the user action and (a) local credential clearing, (b) the UI leaving authenticated state. Any network call ahead of those without an explicit short timeout or race is a hit. A documented "must not hang" contract with no timeout wrapper is the tell.

**False positives.** Calls that MUST precede credential death to be authorized (device unregister) when time-boxed to a small budget with teardown proceeding on expiry; flows that flip UI/local state first and run network best-effort afterward.

## T:19 — Re-auth: fail-open identity-continuity checks in resume flows

**Statement.** A resume/re-auth flow that keeps the previous user's client state alive guards the identity boundary by fetching the new session's identity and comparing it to the old — but the comparison lives inside the fetch's success branch, so any transport failure, non-OK status, or shape drift skips the guard and the flow proceeds as if identity is unchanged. The single mechanism protecting cross-user isolation silently degrades to no protection exactly when the network is flaky.

**Detect.** For every login/re-auth path that does NOT tear down client state (no reload, no cache clear), locate the old-vs-new identity comparison and trace the failure branches of the read feeding it: if catch/non-OK/missing-field paths fall through to the committed-resume path instead of failing closed (reload or full teardown), flag. Asymmetry between sibling handlers (one event lane has the check, another commits the same state without it) is a strong tell.

**False positives.** Flows where the server refuses to bind a different principal to the same continuation (server-enforced, client comparison cosmetic); flows that always hard-navigate after auth so client state dies with the document.
## T:20 - Step-up: re-authentication gate enforced only in the client, over data the server already released

**Statement.** A sensitive action or field is gated behind a step-up challenge (password re-entry,
MFA re-prompt, PIN) whose verification endpoint returns a bare pass/fail and whose result is consumed
only by client state - a boolean, a timer, a store flag - while the protected data was already
included in the ordinary read response. The server never learns that step-up succeeded and never
conditions its projection on it, so the gate controls rendering, not access: skipping the challenge
entirely and reading the underlying response yields the same data. The challenge is load-bearing in
the product's privacy story and load-bearing nowhere in its enforcement.

**Detect.** Trace the step-up verification endpoint's response and find every consumer. If no
subsequent request carries proof of step-up (a scoped token, a re-auth marker on the session, a
distinct privileged read), and no server-side projection branches on such proof, the gate is
cosmetic. Then confirm from the data endpoint's own projection whether the protected fields are
present unconditionally. Two tells: the challenge endpoint returns no credential of any kind, and
the "unlocked" duration is enforced by a client-side timer.

**False positives.** Step-up that stamps the server session or mints a short-lived scoped credential
which a distinct privileged read requires (enforcement is server-side; the client flag is only UX);
challenges gating a write whose authorization the server independently re-checks; gates over data the
viewer is already authorized to read where the prompt is documented as deliberate friction
(confirmation of intent) rather than an access control.

## T:21 - Coverage: a per-object capability credential verified on only a minority of the entry points it was built for

**Statement.** A system designs and implements a per-object authorization credential - a signed
ticket, capability token, or scoped grant binding one caller to one object - then wires verification
into a small subset of the entry points that operate on those objects. The remaining entry points
authorize on a transport-level secret shared across all objects (a service bearer token, a network
allowlist) plus an object identifier supplied by the caller, so any party holding the transport
credential can name any object and act on it. The existence of the credential makes the surface look
protected in review and in design documents; the coverage gap means the strongest control present is
the one least used, and the identifier doing the real authorization work is typically not a secret at
all (it appears in logs, webhooks, provider consoles, and third-party records).

**Detect.** Enumerate every registered entry point on the surface - every route, tool, handler, or
command, from the registration table rather than from documentation - and mark for each whether the
per-object credential is (a) accepted in its input schema and (b) verified before the object is
resolved. Coverage below 100% is the finding; state the ratio. Separately establish the secrecy of
the identifier the uncovered entry points trust: if it is minted or observed by any third party, or
appears in any log or console, it is not an authorization input. Check whether verification is gated
by a mode flag whose deployed value disables it.

**False positives.** Entry points that resolve the object from a server-held context rather than
caller input (nothing for the caller to forge); read-only entry points returning data already public
to every holder of the transport credential; a documented, dated enforcement ramp where the uncovered
entry points are individually compensated by another per-object check and the ramp names its
completion condition.

## T:22 — Authorization-check transport failure rendered as definitive denial

**Statement.** A UI authorization check (can-I? endpoint, policy batch call) treats transport failure — network error, 5xx, timeout — identically to an authoritative deny: the client caches "no access", marks the check resolved, and renders a terminal access-denied state ("you don't have access, contact your administrator") with no retry path. Failing CLOSED for gating is correct; asserting the FACT of denial from an unknown is not. Fully-privileged users on a transient blip land in a dead-end that tells them they lack access they hold — worst on empty/first-run screens where the denied state is the entire page.

**Detect.** Read the authorization-fetch error paths: catch/!ok branches that write the same client state as an authoritative allowed:false response are the finding. Check whether the denial UX asserts a fact ("no access") versus an unknown ("couldn't verify — retry"), and whether any retry/backoff runs before the terminal state renders.

**False positives.** Gating that fails closed but renders a neutral loading/retry state (not a denial assertion); clients that honor a backend deny-vs-error distinction; security-sensitive surfaces where even the error state must not reveal the resource exists (the copy still must not claim definitive denial).

## T:23 — Verification gate conditioned on optional configuration silently degrades to the weak factor

**Statement.** A privileged action verifies a shared secret (PIN, passphrase, second factor) with correct, constant-time logic — but the check is wrapped in a presence test on OPTIONAL configuration (`if (row.secretHash) { verify }`). When the operator never sets the secret, the branch is skipped entirely and the action's only remaining authentication is a weak, spoofable identifier (caller ID, ANI, email From, device name). The administrative UI presents the secret as an optional nicety and never states the consequence of leaving it blank, so the insecure posture is the DEFAULT one an operator picks by doing nothing. Reviewers read the verification code, see it is correct, and miss that it is conditional.

**Detect.** For each privileged action, list its authentication factors and mark which are conditional on stored config. Any factor gated by `if (config exists)` is optional in deployment: evaluate the action's blast radius with that factor removed, against whatever identifier remains (trace it — caller ID and email envelopes are attacker-controlled). Then read the admin UI copy that sets the secret: an "(optional)" label with no consequence statement confirms the finding. Weigh mitigating gates (a per-tenant capability flag defaulting off) as scope reduction, not as a fix — the exposure is what an operator gets after enabling the feature normally.

**False positives.** Actions whose blast radius is genuinely read-only or self-scoped with no cross-customer effect; deployments where the secret is mandatory at enrollment (no row can exist without it); flows where the weak identifier is corroborated by an independent live factor (an out-of-band code delivered per session).

## T:24 — Delegated-auth token exchange routed by callback-supplied data, validated on scheme rather than host

**Statement.** An authorization-code exchange lets the provider's redirect query select the token endpoint — multi-region providers legitimately return a routing hint naming the regional accounts host the code must be redeemed at. The handler accepts that hint after validating only the URL SCHEME, then POSTs the application's client credential to it. The redirect-target route is unauthenticated by necessity (the provider's cross-site redirect carries no session), and the query is fully browser-supplied, so any party holding a valid state nonce names an arbitrary host and receives the client secret — a credential scoped to the APPLICATION, not the tenant, so one tenant's request discloses a secret covering every tenant. The same hint is typically persisted into the connection's stored routing config, so later refresh grants repeat the disclosure on a schedule.

**Detect.** Find every place a token endpoint, issuer, or JWKS URL is computed from callback input rather than static provider config. Then read the validation: a scheme test (`/^https:/`), a `startsWith`, or a substring/suffix match is not host validation — require an exact hostname compared against a fixed per-provider allowlist. Confirm what the credential-bearing request carries (form body or Basic header — both leak), and whether the same value is written into stored connection config that a refresh path later templates into a URL. Check reachability honestly: the exchange usually requires a valid one-time state nonce, which any authenticated tenant can mint for itself.

**False positives.** Hints compared against an exact hostname allowlist before use; providers where the hint is a fixed enum resolved through a lookup table rather than interpolated into a URL; exchanges that carry no long-lived application credential (public client with PKCE and no secret).

## T:25 — The authorization cache's revocation fence compares a version the reader hydrates from a different record than every writer stamps, so the fence is constant-true and revocation silently never takes effect

**Statement.** A permission cache short-circuits the live authorization call for a bounded window and
documents a version fence as its "instant" revocation mechanism: any permission mutation bumps a
counter, the cached window recorded the counter it was opened under, and a mismatch voids the window
on the very next request. The fence is real code and it is unit-tested — but the reader hydrates the
counter from one record (commonly the user's identity/membership row) while every mutator writes it
to a different record, and often under a different key shape (a permissions row keyed by tenant +
subject rather than tenant + user). Both sides then coerce a missing attribute to the same default,
usually zero, so the comparison is permanently equal. Revocation, disable, and downgrade appear to
succeed at every layer — the mutation is written, the policies are deleted — while the cache keeps
authorizing the old grants for the full window. The failure is invisible precisely because it is a
comparison of two defaults: nothing errors, no log fires, and tests that construct the session object
by hand (supplying both fields directly) pass, because they never exercise the hydration path where
the divergence lives. Systems that deliberately do NOT revoke the session on disable — relying on the
authorization layer to deny instead — convert this into a full authorization bypass for the window.

**Detect.** Do not read the fence; read the two ends of it. Find the single function that hydrates the
version onto the session and record the exact table and key it reads. Then enumerate EVERY writer of
that attribute — permission update, role change, disable, delete, per-resource grant and revoke,
tenant bootstrap — and record the table and key each writes. The finding is the set difference, and
it is mechanical. Treat a coercion to a default on the read side (`Number(x || 0)`) as an amplifier,
because it converts "attribute absent" into "fence satisfied" rather than "fence unknown". Check
whether the fence value is forwarded into any downstream plane's request context; a stale fence is
inherited by every consumer. Finally, check the tests: if every test supplies both the version and the
window version as literals on a hand-built session, the hydration path is untested by construction,
and a green suite is not evidence.

**False positives.** Deployments where the reader and every writer provably resolve to the same table
AND the same key shape — verify both, since a shared table name with divergent key shapes fails the
same way; designs that intentionally accept a bounded staleness window and revoke the session itself
on privilege loss, so the cache is not the enforcement point; and fences whose absent-value behavior
is fail-closed (an unresolvable version disables the cache rather than satisfying it), which is the
correct shape even if the records diverge.

## T:26 — A network-asserted originator identifier (caller ID, sender address, forwarded-for) used as the sole ownership proof for cross-record reads and destructive writes

**Statement.** A record is stamped at creation with the identifier the transport reported for whoever
created it, and every later read, cancellation, or modification is authorized by comparing that stored
identifier to the one the transport reports for the current requester. The comparison itself is sound
and often carefully written — fail-closed when the identifier is absent, exact-match, tenant-prefixed
— which is what makes it persuasive; the defect is upstream, in treating a value the network asserts
as a credential the requester possesses. Telephone caller ID, email envelope sender, and
client-supplied forwarding headers are all assertions by the originating network, not proofs of
control, and can be set by the party placing the request on many carriers and relays. The result is
that anyone who knows a victim's identifier can read the victim's records and perform destructive
operations on them, with no token, no session, and no network position — and, where an automated
agent mediates the request, the platform's own trusted component performs the action on the
attacker's behalf, so the audit trail shows a normal interaction. The tell is usually an internal
inconsistency: the same codebase adds a shared secret (a PIN, a confirmation code) to a
higher-privilege operation on the same transport precisely because the identifier is spoofable, while
a lower-profile but still sensitive operation continues to rely on it alone.

**Detect.** Enumerate every operation reachable over the transport and classify each as
identifier-only or identifier-plus-secret. Any cross-record read or state-changing write in the first
class is the finding. Trace the stored ownership anchor back to where it is stamped and name the
component that supplied it; if that component received the value from an external network rather than
deriving it from an authenticated exchange, it is an assertion. Read the comments around the
comparison — words like "authoritative", "server-attested", or "trusted" applied to a transport-
supplied value mark the assumption being made and are frequently the only place it is stated. Confirm
by finding the sibling operation in the same codebase that DOES require a secret and asking what
distinguishes them; usually nothing but when each was written. Check whether the record owner is
notified out-of-band when the operation succeeds, since silent success removes the last detective
control.

**False positives.** Transports where the originator identifier is cryptographically attested end to
end and the attestation is actually verified on this path; flows where the identifier only selects a
candidate set and a second factor (confirmation code, callback to the number on file, an
authenticated session) gates the operation; read-only disclosure of information the requester
demonstrably already holds; and operations whose blast radius is genuinely self-limited — verify by
reading what the handler returns and writes, not by the operation's name.

## T:27 — System-context credential path carries an end-user identity attribute the privilege boundary forbids — the lane fails on every invocation

**Statement.** A machine-context execution path (event-driven worker, scheduler, queue consumer)
calls a credential-minting or role-assumption seam passing a caller-identity attribute (a user id,
often a placeholder like "SYSTEM"), and the boundary hard-rejects identity attributes on
system-scoped credential profiles as a security invariant. The rejection is correct; the caller is
wrong — and it fails on 100% of invocations, from the first deploy. When the caller also swallows
the error and reports success (the fan-out-swallow class), a mandatory outbound lane is dead from
birth with every layer individually "working." The same codebase frequently demonstrates the
correct call shape in an adjacent client of the same seam — the lesson was learned once and not
propagated.

**Detect.** Enumerate the boundary's forbidden-attribute list for system profiles, then grep every
caller that resolves credentials under a system/machine context for those attributes in its call
arguments. For each hit, check whether the lane has EVER succeeded: error logs at the seam,
downstream table counts, delivery records. Zero successes since deploy plus a hard throw at the
seam is conclusive.

**False positives.** User-context paths where the identity attribute is required and permitted;
boundaries that ignore rather than reject extra attributes (dead config, not an outage);
placeholder identities the boundary explicitly whitelists as service principals.

## T:28 — Verdict discard: transport success conflated with semantic approval — 200-with-negative-verdict treated as verified

**Statement.** A verification API returns transport success (HTTP 200) with the actual outcome
in-band ({verified:false}, {allowed:false}, {valid:false}), and a client helper branches only on
transport status, discarding the verdict field — so the negative-verdict path is indistinguishable
from approval at every call site above the helper. The failure is silent and bidirectionally
deceptive: server logs show a correct denial while the client behaves as approved. Frequently
latent in shared helpers that are dead at audit time but written to be wired into future
step-up/verification UI — the trap arms when the first caller arrives. Mirror of T:22 (transport
failure rendered as definitive denial).

**Detect.** For every client of a verification/authorization endpoint, diff the response fields the
server can emit (including negative verdicts under 2xx) against the fields the client actually
reads. Flag any call site that branches on status alone when the server can 200-with-deny. Include
exported-but-uncalled helpers: their contract is the finding even when unreachable today.

**False positives.** APIs that guarantee a non-2xx status on every negative verdict — status
branching is then the correct contract (prove it from the server, not the client); clients that
pass the raw body upward to a caller that does read the verdict.

## T:29 — A delegated-authorization scope requested at the actor's own visibility tier answers success-with-empty for resources outside that tier, so a mis-scoped integration presents as "no data" instead of "no permission"

**Statement.** Providers that serve both the end user and the account operator frequently publish two
scope tiers over one resource: a self tier (the records this application created, the bookings made by
this buyer) and an account tier (everything on the merchant's, seller's, or organization's books). The
names differ by a modifier that reads as an intensifier rather than a change of subject — READ versus
ALL_READ, read versus read_all, personal versus organization. An integration consented at the self tier
calls the list endpoint and gets HTTP 200 with an empty collection: the call is authorized, the filter
is applied silently at the provider, and no error, warning or scope field in the response distinguishes
"there is nothing" from "you may not see it." Every diagnostic therefore points away from authorization
— the token is valid, the connection is healthy, the API returns success — and the investigation goes
to sync scheduling, window parameters, or the customer's own data. The condition is also sticky:
consent is recorded per connection, so widening the requested scope in code fixes only connections
established afterwards, and every existing connection keeps its narrow grant until its owner
re-consents.

**Detect.** For each provider, read the scope reference for every resource the integration lists and
identify whether a tier distinction exists; treat any scope pair differing only by an ALL, ORG, ACCOUNT
or _all modifier as a tier distinction until the provider's own documentation says otherwise. Then
verify empirically rather than by reading the request: call the list endpoint with a live token for an
account known to hold records, and treat a 200-with-empty as evidence of the wrong tier rather than of
an empty account. Introspect the granted scopes on the stored token — the granted set, not the
requested set — because providers downgrade silently. Where the scope list is widened, the finding is
not closed by the code change: it closes when existing connections have been re-consented, so the
remediation must include an enumeration of connections still holding the old grant and a path to
re-consent them.

**False positives.** Endpoints whose empty response is genuinely correct for the account under test;
providers that do return an explicit insufficient-scope error, where an empty list means what it says;
and integrations deliberately scoped to the self tier because the product's contract is to manage only
what it created.

## T:30 — A session-scoped credential's revocation flag has writers only for the granting value, so the revocation gate is dead code and the credential's oversized TTL becomes the only bound

**Statement.** A per-session capability credential (a call ticket, a job token, a device grant)
carries a lifecycle flag in its backing record — `status: active` — and the verifier correctly
rejects any credential whose flag is not the granting value. The gate is real, tested, and runs on
every request. But auditing the WRITE side shows every writer in the codebase stamps only the
granting value: the session-end path (completion handler, hangup callback, teardown job) updates
timestamps, durations and retention fields on the same record without ever touching the flag. The
revoking transition exists in the vocabulary and in the tests, but no code path emits it — so
revocation-at-session-end silently never happens, and the credential remains valid for its full
cryptographic TTL, which was sized generously (hours or days) precisely on the assumption that
early revocation was the real bound. The failure is invisible in operation: nothing errors, the
rejection reason appears in logs only under fault injection, and the record itself often has its
retention extended at session end (for history/reporting), keeping the still-active flag live far
beyond the session.

**Detect.** For every lifecycle flag a verifier reads, enumerate ALL writers of that field across the
codebase and list the distinct values written. If the set of written values does not include at
least one value the verifier rejects, the gate is dead. Then find the code that runs at session end
(completion pipeline, disconnect handler, status callback) and confirm whether it touches the flag.
Finally compare the credential's own TTL against the real session length distribution: a TTL sized
in hours against sessions measured in minutes, combined with a dead revocation gate, is the finding
at full severity.

**False positives.** Flags whose revoking value is written by an out-of-band operator tool or an
admin API that is genuinely part of the design (cite it); credentials whose TTL is already tightly
sized to the session so the flag is deliberately a manual kill-switch only, and this is documented;
lifecycle flags used for analytics rather than authorization (verify the verifier actually branches
on it).


## T:31 — The consented scope set is frozen at grant time while the set of endpoints the integration calls keeps growing, so a new feature breaks every existing connection and only per-connection re-consent repairs it

**Statement.** In delegated-authorization integrations the scope list is requested once, at the
moment the resource owner consents, and the resulting credential carries exactly that set for its
lifetime. The code that requests scopes and the code that calls provider endpoints then evolve
independently: a feature ships that calls one more endpoint, the scope constant is not touched, and
every already-connected account is denied on that endpoint. A fresh connection is fine only if the
constant was updated, and the denial is per-endpoint rather than per-connection, so nothing fails at
connect time. The failure surfaces far downstream as an authorization error inside one job, and
because integration jobs commonly translate provider errors into a neutral state — needs attention,
parked, no data — the operator sees an integration that is connected and idle rather than one that
is under-permitted. The critical property is that a deploy cannot fix it: shipping the corrected
scope list changes only what FUTURE consents request. Every existing connection stays broken until
its owner re-authorizes, which makes the remediation a rollout with human steps, not a release. That
asymmetry is why the scope list must be derived from, and tested against, the complete set of
endpoints the integration calls — not maintained by hand alongside them.

**Detect.** Enumerate every provider endpoint the integration calls across all its jobs, webhooks,
and interactive flows, map each to the scope the provider's own documentation requires, and diff
that set against the scope constant actually requested. Any endpoint whose scope is missing is a
confirmed instance; a repeat instance within a short window is the signature of a hand-maintained
list and should be reported as the class, not the individual scope. Confirm live: the provider's
authorization errors for existing connections, and the connection's own status field sitting in a
neutral state rather than an error state, prove the downstream masking. Assert the pinning in a test
that fails on scope regression, and check whether one exists — its absence is part of the finding.

**False positives.** Scopes the provider grants implicitly with a broader scope already in the list,
verified against the provider's documentation rather than assumed; endpoints called only under a
feature flag that is off for every existing connection; integrations whose credential is a
provider-issued application key rather than a delegated grant, where a deploy does fix it; scope
lists that are generated from the endpoint map at build time, which is the remediated shape.


## T:32 — Security-facing device labels are derived by ordered substring user-agent sniffing, so platforms whose UA embeds another platform's token are misattributed and the session list users audit for intrusions lies about their own devices

**Statement.** Session-management and security screens ("your active sessions", "devices signed
in") show OS/browser/device labels derived from a hand-rolled user-agent parser: a chain of
substring tests evaluated in order, first match wins. User-agent strings deliberately embed other
platforms' tokens for compatibility — every iOS UA contains "like Mac OS X", every Android UA
contains "Linux", Edge contains "Chrome", Chrome and nearly everything else contain "Safari",
in-app webviews (search apps, social apps) present as the host platform's browser. Any chain that
tests a broader token before the platform whose UA merely embeds it misattributes the device — an
iPhone recorded as macOS, an Android tablet as Linux, Edge as Chrome. The label is typically
computed once at session mint and written into an audit/device row, never re-derived, so the wrong
label outlives any parser fix for the session's lifetime. The harm concentrates in exactly the
screen the label exists for: a user auditing "is this login mine?" sees their own phone listed as
an unfamiliar desktop — a phantom intruder that triggers panic revocations and support load — or,
worse, learns that the list is unreliable and stops reading it, so a real intruder's session
scrolls past as noise.

**Detect.** Find where session/device audit rows get their os/browser/deviceType values. If the
source is a hand-rolled ordered substring chain, table a real-world UA corpus against the chain
order and prove each lands correctly: iOS Safari ("like Mac OS X" — the iOS test must precede any
mac test), Android Chrome ("Linux" — the Android test must precede any Linux test), Edge
("Chrome" and "Safari" — Edge before Chrome before Safari), plus at least one in-app webview.
Then check whether the computed label is snapshotted into a persisted row at mint: if so, note
that existing rows keep the wrong label after the parser is fixed, and the finding includes the
stale-row decay window.

**False positives.** Parsers delegating to a maintained UA library with documented token
precedence (verify the shipped version actually handles the failing corpus entry); surfaces that
display the raw UA string without classifying it; iPadOS in desktop mode, which presents a
Macintosh UA genuinely indistinguishable from macOS Safari without UA-Client-Hints — misattribution
there is a platform limitation, not an ordering bug (flag it only if client-hint headers were
available and ignored); deviceType/browser fields that are correct while only a cosmetic label
elsewhere is wrong — scope the finding to the fields actually misattributed.
