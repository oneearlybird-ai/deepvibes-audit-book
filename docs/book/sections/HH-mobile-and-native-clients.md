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
