---
section: HH
title: "Mobile & Native Clients"
group: platform-delivery
---

# [HH] Mobile & Native Clients

## HH:1 — Embedded Secrets: API keys/secrets compiled into the app binary — extractable with strin…

Embedded Secrets: API keys/secrets compiled into the app binary — extractable with strings/jadx in minutes.

## HH:2 — Pinning: Certificate/public-key pinning absent — or hard-pinned with no rotation path, b…

Pinning: Certificate/public-key pinning absent — or hard-pinned with no rotation path, bricking old installs on cert renewal.

## HH:3 — Storage: Tokens stored in UserDefaults/SharedPreferences instead of Keychain/Keystore

Storage: Tokens stored in UserDefaults/SharedPreferences instead of Keychain/Keystore.

## HH:4 — Deep Links: Universal/app links processing unvalidated parameters straight into navigati…

Deep Links: Universal/app links processing unvalidated parameters straight into navigation and API calls.

## HH:5 — Version Gates: No minimum-supported-version enforcement — ancient clients hit removed AP…

Version Gates: No minimum-supported-version enforcement — ancient clients hit removed APIs with no upgrade prompt.

## HH:6 — Push Hygiene: Push tokens not unregistered on logout — notifications (with content) reac…

Push Hygiene: Push tokens not unregistered on logout — notifications (with content) reach logged-out shared devices.

## HH:7 — WebViews: Remote content loaded in WebViews with JS bridges exposed to arbitrary origins

WebViews: Remote content loaded in WebViews with JS bridges exposed to arbitrary origins.

## HH:8 — ATS: App Transport Security exceptions permitting cleartext HTTP "temporarily, for one e…

ATS: App Transport Security exceptions permitting cleartext HTTP "temporarily, for one endpoint."

## HH:9 — Shared cross-platform module hardcodes the platform or origin discriminator

**Statement.** Code shared across several platform targets stamps a constant identifying the client —
attribution source, user-agent, device class, analytics channel, telemetry origin — chosen back when
the module served one platform. Every other target inherits the wrong value. Nothing fails: the write
succeeds, the field validates, and the record is silently miscategorized wherever it is later grouped,
filtered, or reported. The defect surfaces as a quietly wrong dashboard rather than an error, so it can
persist for as long as nobody questions the breakdown.

**Detect.** Grep shared modules for literal platform and client identifiers, and trace each to the set
of targets that compile it. Any such literal living in shared code — rather than in per-target
configuration or behind a compile-time platform condition — is the finding. Audit the downstream
consumers too: a value that has been wrong for a while is already embedded in stored records and
historical aggregates, so the fix carries a data-correction question with it.

**False positives.** Constants naming the shared module or SDK itself rather than the host platform;
identifiers genuinely owned by one target, in code compiled only into that target.
