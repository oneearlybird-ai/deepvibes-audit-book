---
section: MM
title: "Cryptography & Randomness Misuse"
group: cross-cutting
---

# [MM] Cryptography & Randomness Misuse

How applications misuse crypto primitives they didn't need to invent. Key *management* lives in [F]
(KMS/rotation) and token *lifecycle* in [T]; this chapter is the usage layer: comparisons, modes,
randomness, and verification logic.

## MM:1 — Secrets compared with non-constant-time equality

**Statement.** Tokens, API keys, HMAC signatures, and OTP codes compared with `===`/`==`/string
equality — early-exit comparison leaks match-length through timing, enabling byte-by-byte forgery of
signatures and brute-force acceleration on hot verification endpoints.

**Detect.** Find every comparison where one side is attacker-supplied and the other is secret-derived
(webhook signature checks, API-key auth, OTP verify). Require the platform's constant-time primitive
(`crypto.timingSafeEqual`, `hmac.compare_digest`, `ConstantTimeCompare`) on equal-length buffers
(hash both sides first when lengths vary).

**False positives.** Comparisons of two non-secret values; lookups by high-entropy id where the
subsequent secret check is constant-time (the id lookup itself is not the oracle).

## MM:2 — Security tokens from non-cryptographic randomness

**Statement.** Session ids, reset tokens, invite codes, and API keys generated with `Math.random()`,
`rand()`, timestamps, or UUIDv1 — predictable or seedable output lets attackers forecast or enumerate
"random" credentials.

**Detect.** Trace every security-bearing token to its entropy source. Require CSPRNG
(`crypto.randomBytes`/`randomUUID`, `SecRandomCopyBytes`, `secrets` module) and ≥128 bits of entropy.
Grep for `Math.random` anywhere near auth, codes, or ids that gate access.

**False positives.** Non-security randomness (jitter, sampling, shuffle animations) — `Math.random` is
fine there; UUIDv4 from a crypto-backed generator.

## MM:3 — IV/nonce reuse under the same key

**Statement.** AES-GCM/CTR/ChaCha20 encryption with a static, hardcoded, or counter-reset IV/nonce —
nonce reuse under one key in GCM/CTR catastrophically breaks the scheme: keystream reuse reveals
plaintext XORs and (GCM) enables forgery of the authentication key.

**Detect.** Find symmetric encryption call sites. Verify a fresh random (or strictly-monotonic,
persisted) nonce per encryption, stored/transmitted alongside ciphertext, never a constant or
per-boot-reset counter. High-volume keys need nonce-space math (or key rotation) reviewed.

**False positives.** Schemes designed for deterministic nonces (SIV modes); libraries that generate
the nonce internally per call (verify, don't assume).

## MM:4 — ECB mode or unauthenticated encryption

**Statement.** ECB anywhere (identical blocks → identical ciphertext: structure leaks), or CBC/CTR
without a MAC — malleable ciphertexts get accepted, enabling bit-flipping attacks and padding oracles
on decrypt-then-parse paths.

**Detect.** Grep cipher initializations for mode strings (`aes-*-ecb`, `aes-*-cbc` without an
accompanying HMAC in encrypt-then-MAC order). Default requirement: AEAD (AES-GCM, ChaCha20-Poly1305)
with the auth tag verified before any plaintext use.

**False positives.** CBC+HMAC legacy constructions implemented in correct encrypt-then-MAC order with
constant-time tag checks (aging but sound — note for migration); ECB as a building block inside a
vetted higher construction (key wrapping per spec).

## MM:5 — Passwords hashed with fast hashes

**Statement.** User passwords stored with MD5/SHA-1/SHA-256 (even salted) — GPU rigs test billions of
guesses per second; a leaked table falls in hours. Only memory-hard, tunable KDFs make offline cracking
expensive.

**Detect.** Find the password verify path. Require argon2id/scrypt/bcrypt with per-user salt and
current cost parameters, plus a transparent rehash-on-login upgrade path for older records. Any
general-purpose hash in the password path is a finding.

**False positives.** HMAC-SHA-256 over high-entropy machine secrets (API keys ≥128-bit random) where
brute force is infeasible by entropy, not by KDF cost — that is T:16 territory, not a password.

## MM:6 — Homegrown crypto protocols and primitives

**Statement.** Custom encryption schemes, hand-rolled token formats ("encrypted" JSON with XOR/base64),
DIY signatures, or novel key-exchange logic instead of vetted constructions (AEAD, JWT/PASETO, TLS,
libsodium sealed boxes). Every historical instance of this pattern has fallen to the first serious
review.

**Detect.** Inventory crypto call sites; anything combining primitives in a novel arrangement (manual
XOR, custom padding, hash-chains as auth) rather than using a library's high-level construction is a
finding. "Why not the standard construction?" must have a defensible answer.

**False positives.** Thin wrappers over vetted libraries; documented implementations of a published
spec with test vectors.

## MM:7 — Long-lived key material without envelope encryption or rotation path

**Statement.** One raw symmetric key encrypts everything forever — held whole in env/config, no data-key
layer, no key-id stored with ciphertext. Rotation is impossible without re-encrypting the world in one
migration, so it never happens; one leak decrypts all history.

**Detect.** For each encryption-at-rest use: is there a master/data key split (envelope), a key id or
version stored alongside each ciphertext, and a documented rotation procedure that new writes pick up
immediately? Key loaded whole at boot with no TTL re-fetch compounds with A:20/F:7.

**False positives.** KMS-native encryption (S3-SSE, DDB encryption) where AWS owns the envelope; short-
lived caches encrypted with ephemeral keys.

## MM:8 — Weak or human-chosen HMAC/JWT signing secrets

**Statement.** HS256 JWT or webhook-HMAC secrets that are short, human-memorable, or reused across
environments — offline brute force against one captured token recovers the secret and mints arbitrary
valid tokens for every user.

**Detect.** Locate signing secrets at their source (SSM/env). Require ≥256 bits of CSPRNG entropy,
per-environment values, and rotation capability (dual-secret verify window, Z:6's sibling). Check test/
example secrets ("secret", "changeme") cannot reach production boot (DD:7 sentinel rule).

**False positives.** Asymmetric signing (RS/ES) where no shared secret exists — check key size/curve
instead.

## MM:9 — Ciphertext trusted before integrity verification

**Statement.** Decrypt-then-parse flows acting on plaintext before (or without) verifying integrity:
GCM tag checked after streaming plaintext out, CBC without MAC (MM:4), or signature checks that parse
attacker JSON first — tampered ciphertexts drive application logic.

**Detect.** Review decrypt/verify ordering at each site: authenticate → then decrypt → then parse.
Streaming decryption APIs that release plaintext before the final tag check must buffer or re-verify
before side effects. Signature-then-parse order on webhooks (P:1, R:7, Z:3 cousins) — verify raw bytes
first.

**False positives.** AEAD libraries that structurally refuse to emit unverified plaintext (most
one-shot APIs) — the finding targets streaming and hand-assembled flows.

## MM:10 — Unpredictability conflated with uniqueness

**Statement.** Identifiers chosen for uniqueness (UUIDs, ULIDs, nanoid defaults, hashids) treated as
unguessable capabilities — share links, "secret" URLs, recovery paths — or vice versa: v1/ULID
timestamps leaking creation time and monotonic order to anyone holding two ids (W:2's neighbor).

**Detect.** For each id doubling as an access grant (no further auth on the route), require explicit
capability-grade entropy (≥128-bit CSPRNG) and treat it as a credential: expiry, revocation, no
logging. For sortable ids (ULID/v7), confirm the embedded timestamp is acceptable metadata leakage.

**False positives.** UUIDv4 from CSPRNG used as a capability with expiry and revocation — acceptable
when deliberate and documented; internal ids never used as authorization.

## MM:11 — Verifier accepts attacker-influenced algorithm or key selection

**Statement.** Signature verification where the attacker's payload chooses the algorithm or key: JWT
`alg`/`jku`/`kid` honored from the token (T:1's general form), SAML/XML-DSig KeyInfo trusted from the
document, webhook verifiers supporting multiple schemes selected by header — downgrade-to-none and
key-confusion (RS→HS with the public key as HMAC secret) forgeries.

**Detect.** For every signature verifier: algorithm pinned server-side (allowlist of exactly one),
key resolved from server config by pinned id (unknown `kid` = reject), no fallback chain of verifiers.
Multi-algorithm "compatibility" verification loops are findings (§2: pick one, reject the rest).

**False positives.** Deliberate dual-secret rotation windows (same algorithm, two keys, Z:6) — that is
key rollover, not attacker-selected verification.

## MM:12 — TLS verification disabled in production paths

**Statement.** `rejectUnauthorized: false`, `NODE_TLS_REJECT_UNAUTHORIZED=0`, `verify=False`,
trust-all TrustManagers, or ATS arbitrary-loads exceptions (HH:8) shipped "temporarily" — every
transport guarantee (confidentiality, integrity, peer identity) silently gone; MITM becomes trivial on
any hop.

**Detect.** Grep for the disable flags across code, env files, and IaC. Each hit in a production path
is a finding regardless of justification comment age. Internal/self-signed targets get a pinned
private CA bundle, never blanket disable.

**False positives.** Local-only dev tooling gated by environment checks that provably cannot activate
in production builds (verify the gate, not the comment).
