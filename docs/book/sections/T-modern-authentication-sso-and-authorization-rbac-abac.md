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
