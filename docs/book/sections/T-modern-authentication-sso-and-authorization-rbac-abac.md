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
