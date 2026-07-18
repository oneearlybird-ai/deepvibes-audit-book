---
section: CC
title: "Infrastructure as Code & Environment Management"
group: platform-delivery
---

# [CC] Infrastructure as Code & Environment Management

## CC:1 — State: Terraform state without a remote encrypted backend + locking — concurrent applies…

State: Terraform state without a remote encrypted backend + locking — concurrent applies corrupt state.

## CC:2 — State Access: State files containing secrets in plaintext; the state bucket readable far…

State Access: State files containing secrets in plaintext; the state bucket readable far too broadly.

## CC:3 — Plan Gates: Applies executed without a reviewed plan diff (human or CI policy check) — s…

Plan Gates: Applies executed without a reviewed plan diff (human or CI policy check) — surprise destroys.

## CC:4 — ignore_changes: lifecycle.ignore_changes masking drift on security-relevant attributes (…

ignore_changes: lifecycle.ignore_changes masking drift on security-relevant attributes (policies, encryption flags, parameter values).

## CC:5 — Pinning: Providers and modules unpinned — applies pull breaking upstream changes nondete…

Pinning: Providers and modules unpinned — applies pull breaking upstream changes nondeterministically.

## CC:6 — Keys: count/for_each keyed on mutable values — innocuous edits churn and recreate statef…

Keys: count/for_each keyed on mutable values — innocuous edits churn and recreate stateful resources.

## CC:7 — Destroy Guards: No prevent_destroy/deletion protection on databases, state stores, and K…

Destroy Guards: No prevent_destroy/deletion protection on databases, state stores, and KMS keys.

## CC:8 — Portability: Hardcoded account IDs/regions/ARNs blocking clean environment replication

Portability: Hardcoded account IDs/regions/ARNs blocking clean environment replication.

## CC:9 — Data Sources: "Latest" lookups (AMIs, certs) without stable filter chains that survive r…

Data Sources: "Latest" lookups (AMIs, certs) without stable filter chains that survive renewal/republish.

## CC:10 — Orphans: Resources removed from code but left running (state rm misuse) — unmanaged, unp…

Orphans: Resources removed from code but left running (state rm misuse) — unmanaged, unpatched, and still billed.
