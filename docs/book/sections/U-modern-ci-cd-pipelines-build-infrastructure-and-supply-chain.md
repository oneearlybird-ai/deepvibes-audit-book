---
section: U
title: "Modern CI/CD Pipelines, Build Infrastructure & Supply Chain"
group: saas-core
---

# [U] Modern CI/CD Pipelines, Build Infrastructure & Supply Chain

## U:1 — Dependency Bleed: Blindly Importing Unpinned Third-Party Packages

Dependency Bleed: Blindly Importing Unpinned Third-Party Packages. Pulling open-source framework dependencies via loose semantic version constraints (e.g., ^1.0.0), opening the door to automated supply chain injection attacks if an upstream package repository is hijacked.

## U:2 — Runner Exposure: Hardcoding Persistent Production Secret Vault Keys Inside Build Runners

Runner Exposure: Hardcoding Persistent Production Secret Vault Keys Inside Build Runners. Exposing highly sensitive production infrastructure access keys directly to general GitHub Actions or GitLab CI runtime runner environments instead of utilizing dynamic OpenID Connect (OIDC) federation keys.

## U:3 — Container Bloat: Building Production Container Images from Untrusted, Unscanned Base Dis…

Container Bloat: Building Production Container Images from Untrusted, Unscanned Base Distros. Packing application bundles into raw base container environments without daily vulnerability scans or using ultra-minimal distroless base images, carrying critical operating system security flaws into production clusters.

## U:4 — Artifact Verification: Deploying Production Code Without Cryptographic Attestations

Artifact Verification: Deploying Production Code Without Cryptographic Attestations. Deploying software builds to serverless configurations or container registry frameworks without active container or artifact image signature verification steps, allowing modified compilation files to slip into production.

## U:5 — Lockfiles: Not committed or not enforced in CI (install vs ci) — builds non-reproducible…

Lockfiles: Not committed or not enforced in CI (install vs ci) — builds non-reproducible across machines.

## U:6 — SCA: No dependency-vulnerability gate (osv-scanner/npm audit/Dependabot) — known-CVE dep…

SCA: No dependency-vulnerability gate (osv-scanner/npm audit/Dependabot) — known-CVE dependencies rot in place.

## U:7 — Secret Scanning: No gitleaks/trufflehog hook on push — credentials reach remote history…

Secret Scanning: No gitleaks/trufflehog hook on push — credentials reach remote history before anyone notices.

## U:8 — Actions Pinning: Third-party CI actions referenced by mutable tags instead of commit SHA…

Actions Pinning: Third-party CI actions referenced by mutable tags instead of commit SHAs — an upstream tag hijack executes inside your pipeline.

## U:9 — Privilege: One deploy credential spanning environments — the staging pipeline can mutate…

Privilege: One deploy credential spanning environments — the staging pipeline can mutate production.

## U:10 — Rollback: Forward-only deploys with no rehearsed revert path — incident recovery is "fix…

Rollback: Forward-only deploys with no rehearsed revert path — incident recovery is "fix forward under pressure."

## U:11 — Smoke Tests: No post-deploy verification — failure detection is user complaints

Smoke Tests: No post-deploy verification — failure detection is user complaints.

## U:12 — Parity: Staging drifts from production (config, data shape, scale) until a green staging…

Parity: Staging drifts from production (config, data shape, scale) until a green staging run means nothing.

## U:13 — ClickOps: Manual console changes uncaptured by IaC, undetected by drift checks, lost on…

ClickOps: Manual console changes uncaptured by IaC, undetected by drift checks, lost on the next apply.

## U:14 — Install Scripts: Dependency postinstall scripts executing in CI runners that hold secret…

Install Scripts: Dependency postinstall scripts executing in CI runners that hold secrets in their environment.

## U:15 — Permissions: CI workflow tokens (GITHUB_TOKEN) with default write-all permissions instea…

Permissions: CI workflow tokens (GITHUB_TOKEN) with default write-all permissions instead of least-privilege per job.

## U:16 — Tooling: repo scripts and verifier file-lists retaining references to deleted source files

**Statement.** Codemods, one-off scripts, and verifier file-lists enumerate source paths by string, outside the module graph compilers check. When a listed file is deleted, existence-guarded tools silently no-op (dead lanes misleading the next maintainer) and unguarded ones break at run time; neither is caught by typecheck or build.

**Detect.** On any file deletion, grep the ENTIRE repo — scripts/, tooling, CI configs, verifier file-lists — for the deleted path and each deleted export, not just importable code. Flag survivors even when existence-guarded; classify guarded ones as dead-lane, unguarded as breaking.

**False positives.** Historical references in changelogs/docs describing past states; deny-lists and migration maps whose job is to name files that no longer exist.
