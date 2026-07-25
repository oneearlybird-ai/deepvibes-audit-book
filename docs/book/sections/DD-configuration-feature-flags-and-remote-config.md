---
section: DD
title: "Configuration, Feature Flags & Remote Config"
group: platform-delivery
---

# [DD] Configuration, Feature Flags & Remote Config

## DD:1 — Flag Debt: Flags without owners and expiry dates — permanent dead branches accumulating…

Flag Debt: Flags without owners and expiry dates — permanent dead branches accumulating in every code path.

## DD:2 — Validators: Config deployments without schema/semantic validators — malformed config shi…

Validators: Config deployments without schema/semantic validators — malformed config ships and services boot on it.

## DD:3 — Versioning: Config documents unversioned — consumers parse blind and break on shape chan…

Versioning: Config documents unversioned — consumers parse blind and break on shape changes.

## DD:4 — Rollout: No staged rollout/bake time with alarm-driven automatic rollback on config pushes

Rollout: No staged rollout/bake time with alarm-driven automatic rollback on config pushes.

## DD:5 — Exposure: Client-evaluated flags shipping unreleased feature logic inside the public bun…

Exposure: Client-evaluated flags shipping unreleased feature logic inside the public bundle.

## DD:6 — Kill Switch: Config cache TTLs so long that the emergency kill switch takes effect in ho…

Kill Switch: Config cache TTLs so long that the emergency kill switch takes effect in hours, not seconds.

## DD:7 — Sentinels: Placeholder values not treated as boot-fatal — services run on "placeholder-s…

Sentinels: Placeholder values not treated as boot-fatal — services run on "placeholder-set-before-first-use".

## DD:8 — Store Misuse: Secrets embedded in non-secret config documents (AppConfig/JSON) instead o…

Store Misuse: Secrets embedded in non-secret config documents (AppConfig/JSON) instead of dedicated secret stores.

## DD:9 — Ghost Config: env templates advertise retired services

**Statement.** Committed onboarding templates (.env.example, sample configs, bootstrap scripts)
carry live-looking keys, enable-flags, or endpoints for a service that has been removed from the
architecture, with zero readers left in code. Every consumer of the template — new engineers,
deploy tooling, and machine/LLM agents ingesting the repo — is taught that the retired service
is the live plane: the keys get set, the "enabled" flag gets flipped, external audits and
architecture decisions get made against a system that no longer exists.

**Detect.** For each key in every committed template, find its reader (search the source for the
key name); a zero-reader key naming infrastructure absent from the live IaC/service inventory is
a ghost. Cross-check advertised endpoints against what the IaC actually provisions. Deletion
history of the consuming module (VCS log) confirms the retirement date.

**False positives.** Keys consumed outside the repo (platform dashboards, sibling repos, deploy
pipelines) — require the external consumer to be named in an adjacent comment; keys for optional
integrations whose reader exists but is disabled by default. A surviving module that retains the retired service's NAME as a compatibility facade is not proof the service is live — nor proof the template keys are read: verify which keys the surviving module actually reads and which transport it actually calls (the vocabulary can be the ghost while the code is current; both a third-party audit and the discovering audit misread this case, in opposite directions).
## DD:10 - Enforcement mode read from remote config with a permissive default, and the key was never authored

**Statement.** A security check (signature verification, origin validation, policy enforcement) is
built correctly but its enforce/observe behaviour is read from a remote configuration document, and
the code resolves an absent or unrecognised value to the permissive mode - typically "monitor" or
"log-only" - so the control ships fully implemented and fully disabled. The permissive default is
usually deliberate and reasoned at authoring time ("do not brick the integration before the ramp is
confirmed"), with a comment naming the condition for flipping it; what fails is that nobody ever
authors the key, no alarm fires on the never-enforced state, and the ramp has no expiry. Reviewers
read the verification code, see it is thorough and constant-time, and record the control as present.
The deployed config - not the source - is the only place the truth lives.

**Detect.** For every enforcement-mode lookup, resolve the value from the CONFIG ACTUALLY DEPLOYED
(fetch the live document at the version the running fleet is pinned to), never from the repo copy or
the default in code, and never from a design document asserting the mode. Then read the fallback
branch: a lookup written as "value equals enforce or off, otherwise monitor" ships permissive on a
missing key, a typo'd key, and a partially-written document alike. Treat an absent key as a confirmed
disabled control, not an unknown. Cross-check for a metric or alarm on the monitor-mode mismatch
counter - a ramp with no alarm on "would have rejected" has no completion pressure and no evidence
anyone is watching.

**False positives.** Ramps with a documented, dated completion condition AND an active alarm on the
observe-mode mismatch counter, where an independent control (network allowlist, per-object
credential) is separately verified to cover the same threat in the interim; checks whose permissive
mode is the intended permanent posture for a non-security telemetry purpose.
