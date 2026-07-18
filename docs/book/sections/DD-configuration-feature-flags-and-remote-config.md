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
