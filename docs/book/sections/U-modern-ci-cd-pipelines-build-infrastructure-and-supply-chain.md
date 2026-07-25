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

## U:17 — Gate Liveness: a pipeline gate's per-item client retry worst-case exceeds the gate's own kill timeout, with no progress output — one wedged connection reads as "gate too slow" and the control gets bypassed or deleted

**Statement.** A pipeline/CI gate iterates items serially against a remote API under an outer kill-timeout, while the API client's own retry policy composes to a per-call worst case — attempts × (connect_timeout + read_timeout) + cumulative backoff — that equals or exceeds the entire gate cap. One black-holed connection (half-open TCP, dropped SYN, silent middlebox reset) then burns the whole gate budget inside a single silent call: the gate dies by external kill (rc=124) with no cause attached, the failure is misattributed to item volume, the cap gets raised instead of the retry multiplier fixed, and eventually the gate is routed around via a fast lane or removed outright — the organization loses the control, not just the minutes. The defect compounds when a prior hardening pass added timeouts/bounded retries to sibling client construction paths but missed one (the incident recurs on the unpatched path and discredits the earlier fix), and when the gate emits no progress, making a wedge indistinguishable from slow legitimate work. Request-path sibling: X:8 (nested timeout budgets → thread starvation); this rule is the control-plane variant where the casualty is the gate itself.

**Detect.** For every gate wrapped in a timeout/kill cap that calls a remote API per item: compute one item's worst case = client max_attempts × (connect_timeout + read_timeout) + summed backoff, and flag when a single item can consume ≳25% of the gate cap. Enumerate EVERY client-construction site in the gate's tool (module-level defaults AND per-feature overrides) and flag divergent retry budgets across siblings of the same service — especially after an incident patched some but not all. Flag serial per-item remote loops with no progress emission (log/stderr heartbeat with counts) and no dedupe of identical items. History smells: a gate whose timeout was raised (rather than root-caused) after kill events; a sibling gate previously deleted "because it hangs"; a fast lane documented as existing because the full lane is too slow.

**False positives.** Gates genuinely item-volume-bound with visible progress and a bounded per-item cost — raising the cap is then the correct fix. Batch APIs where one call legitimately dominates the budget (the bound belongs on that call, not per item). Clients whose high attempt counts sit under an enforced TOTAL-duration bound (adaptive/rate-limited modes with an overall operation deadline) — verify the total bound exists before flagging attempt count alone.

## U:18 — Concurrent workers share one checkout, so a plain `git commit` captures whatever another worker had staged

**Statement.** Two or more agents, jobs, or humans operate the same working tree at once. The staging index is per-repository, not per-actor, so a worker that runs `git add <its files>` and then `git commit` with no pathspec captures the union of everything staged at that instant — including another worker's in-flight changeset. The result is a commit whose message describes a fraction of its contents: the stolen work is attributed to an unrelated ticket, its own rationale is never written down, and if the thief pushes first the history cannot be corrected without a force-push over a shared branch. Reviewers reading the log are actively misled about why files changed, and a later bisect or revert of that commit silently reverts unrelated work.

**Detect.** Look for concurrency at the tree level first — multiple agent sessions, parallel CI jobs, or a shared dev box against one clone — then check whether the commit step is index-based (`git add` then bare `git commit`, `git commit -a`, or a stage-then-commit helper) rather than pathspec-scoped. After the fact, the signature is a commit whose file list is much wider than its subject implies: diff each commit's touched paths against the subsystem named in its message and flag the outliers. A repo with a "commit only my files" helper that stashes the remainder is evidence the hazard is already known.

**False positives.** Single-actor repositories; workflows where each worker owns an isolated clone or worktree; deliberate umbrella commits whose message enumerates every subsystem they touch.
