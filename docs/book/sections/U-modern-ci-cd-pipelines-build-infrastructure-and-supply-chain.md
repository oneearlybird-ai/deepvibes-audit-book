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

## U:19 — Scan stage invoked so that every branch exits success, while the pipeline counts it as a gate

**Statement.** A pipeline stage announced as a security or quality gate is invoked in a form that cannot return a failing status on any path. The scanner is passed its own suppress-failure flag (a soft-fail switch, a forced zero exit code, a continue-on-error setting); the invocation is *additionally* suffixed with an unconditional-success operator; and the whole thing is wrapped in a "if the binary is present … else print skipping" branch whose tool-absent arm also succeeds. Three arms, three guaranteed successes. The stage still prints its numbered banner, still occupies a slot in the pipeline's advertised gate count, and still appears in the runbook, so operators, reviewers, and auditors read the pipeline as N-gates-deep when its effective depth is N−1. Sibling stages in the same file frequently DO fail correctly, which makes the uniformity plausible and removes the one cue that would prompt anyone to read the invocation. The findings — if the tool is installed at all — scroll past in a log nobody blocks on, and the misconfiguration class the stage was added to catch reaches deploy on every run.

**Detect.** For every stage the pipeline calls a gate, extract the literal invocation and evaluate the exit status on each branch independently — primary tool present, alternate tool present, no tool present — instead of reading the banner. Treat the suppress-failure flag, the unconditional-success suffix, and the skip-on-missing-binary arm as three separate defeats and look for all three; any one alone is often a deliberate posture, all three together never are. Diff the stage against its siblings in the same file: where the others are wrapped in an explicit fail-and-exit idiom and this one is not, the file is self-evidencing. Establish whether the tool is installed at all on the machines that actually run the pipeline — a stage that has only ever taken the tool-absent arm has never executed once. Sweep every other invocation site of the same scanner (commit hooks, mirrored pipelines, editor integrations) before concluding the control exists anywhere; the same suppressed form is usually copied to all of them. Finally, compare the advertised gate count against the effective one — that gap is the blast radius.

**False positives.** Scanners deliberately run in report-only mode during a named adoption window with a dated owner and a scheduled enforcement date; stages explicitly labelled advisory on the same line that invokes them AND excluded from the pipeline's advertised gate count; findings from the stage that are enforced by a separate blocking control which is named and verified to run.

## U:20 — A second, weaker lane writes the reviewed artifact to the path the strong lane's apply step admits on existence alone

**Statement.** A deployment pipeline is reachable through more than one entry point: a fully gated lane, and a lighter mirror retained for convenience, kept as a fallback, or simply left behind when a second task runner was introduced without retiring the first. Both lanes produce the same reviewed artifact — a saved plan, a signed bundle, a built image — and both write it to the *identical* path, while the apply step admits that artifact on existence alone and records nothing about which lane produced it or which gates it cleared. At the point of consumption the weak lane's output is therefore indistinguishable from the strong lane's. Nothing has to be misused for this to bite: running the weak lane's documented command and then the strong lane's documented apply command is sufficient, and the audit record written afterwards is byte-identical to a fully gated deploy, so the substitution is invisible in retrospect too. Where the weak lane additionally fails to abort on a failing step, it prints its own success banner over an artifact none of its gates blessed. The artifact is also typically written *before* the gates that judge it, so a lane that does abort still leaves the rejected artifact on disk for the other lane's apply step to find.

**Detect.** Enumerate every entry point capable of producing the deployable artifact — task runners, makefiles, shell scripts, CI jobs — and diff their gate sets step by step; never trust a header comment that calls one a mirror of the other, since the mirror is where drift accumulates silently. Resolve each lane's output path all the way through its variables and defaults, and treat identical *defaults* as identical even where an override exists, because the default is what runs. Then read the consuming step's admission check: an existence test — or any check over the artifact's content that a weak-lane artifact would satisfy equally — means provenance is unverified. Confirm the write ordering inside each lane; an artifact emitted before its judging gates survives their failure on disk. Check the post-deploy audit record for a field that distinguishes the lanes; if there is none, past deploys cannot be attributed either, and the absence of evidence of misuse is not evidence of absence.

**False positives.** Lanes whose artifacts are written to disjoint, lane-tagged paths; consumers that verify a provenance token — a signature, attestation, or gate-result sentinel bound to the artifact's content hash — rather than its mere presence; a documented fasttrack lane whose artifacts are consumed only by a matching fasttrack apply step that is itself scoped away from production (verify the fast apply is a real, separately-gated implementation and not an alias to the strong lane's apply).

## U:21 — An auto-fixing commit hook normalizes a file property that the version control system's own checkout filter re-applies in reverse, so the gate can never converge and the commit path deadlocks

**Statement.** A commit-time gate runs an auto-fixing hygiene hook: it rewrites files to a canonical form for some whole-file property — line terminators, encoding, trailing bytes, indentation — and, having modified the working tree, exits non-zero so the author re-stages and re-runs. That contract is sound in isolation and converges in one retry. It stops converging when the version control system is *itself* configured to transform the same property in the opposite direction through a content filter applied whenever it materializes a file from the object store, and no per-repository attribute file exists to arbitrate between the two. The store holds the canonical form, the filter denormalizes on every materialization, and the hook renormalizes on every run: each is individually correct and the pair has no fixed point. What makes the deadlock total rather than intermittent is that the gate runner materializes the tree as part of its own protocol — to judge exactly the staged content it sets unstaged work aside and restores the staged form from the store, which runs the filter *inside* every invocation. The hook is therefore guaranteed to observe the denormalized form no matter what the author staged, and retrying reproduces an identical file list forever. Three consequences follow and are usually discovered in this order. The set-aside/restore cycle is not atomic under hook failure, so staged entries can be silently dropped: a run can commit an arbitrary *subset* while the wrapper reports failure, landing history whose message claims a changeset far larger than its contents — the inverse of the shared-index over-capture in U:18, and equally misleading to a later revert or bisect. The set-aside entries accumulate, each holding unrelated in-flight work hostage behind a manual restore that a failed run never reaches. And where the deployment pipeline is gated on "source committed and pushed" with no bypass by design, an unconverged commit path escalates from an ergonomic annoyance to a total deploy outage: reviewed, verified changes cannot be committed, cannot therefore be deployed, and sit in a working tree where any subsequent discard or restore destroys them. The diagnostic tell is that the only files that survive to be committed are those whose materialized form already happens to match the hook's target — typically the ones written directly by tooling and never yet materialized through the filter.

**Detect.** Inventory every commit-time hook that both mutates files and fails on having mutated them; for each, name the property it canonicalizes. Then ask, for that same property, whether the version control system applies its own transform on materialization, and read the effective configuration at *every* scope — a machine-wide or installer default is the common case and is invisible from inside the repository, so a repo-local read alone will report nothing wrong. Confirm whether a per-repository attribute file arbitrates; its absence is dispositive, and its presence is not, because marking files as text does not by itself pin the materialized form — only an explicit form directive, or disabling the filter, overrides the global default. The decisive evidence is mechanical and cheap: compare stored form against materialized form for every tracked file and look for a split population, where the store is uniform but a large fraction of the working tree is denormalized; that split both proves the filter is active and predicts precisely which files will pass the hook and which will not. Read the gate runner's set-aside/restore implementation to confirm it materializes from the store rather than preserving bytes in place, and check whether its restore path is reached when a hook fails. Prove non-convergence empirically without bypassing anything: two consecutive invocations that report the identical file set as fixed and fail identically are the finding. Sibling repositories under the same machine-wide setting that commit successfully are diagnostic but routinely misread — verify whether they simply lack the hook before crediting an attribute file with protecting them, since the wrong conclusion here yields a remediation that does not work. Finally, sweep history for commits whose file count is far below what their subject claims, and the set-aside store for orphaned entries; both are residue of prior deadlocked runs and quantify how long the condition has held.

**False positives.** Check-only hooks that report without rewriting, which fail loudly but converge once the author fixes the file; repositories carrying an attribute file that pins the property explicitly, or that disable the filter, so only one side transforms; hooks whose canonical form matches the filter's output direction rather than opposing it; one-time bulk normalization commits that fail once and succeed on the retry that follows; environments where the working tree is materialized once by a fresh clone with the filter already disabled, so the denormalized population never appears.

## U:22 — Only the destructive half of a replace-in-place refactor is published, leaving the integration branch worse than either endpoint

**Statement.** A subsystem is retired and replaced in one conceptual change, but the change is physically two halves — files removed, files added — and only the removal half reaches the shared integration branch. The asymmetry is structural, not careless: deletions are already materialized in the author's tree and are captured by the ordinary commit motion without any deliberate act, while the replacement consists of files the version control system does not yet track and edits that were never staged, so a pathspec-scoped or partially-staged commit omits it in silence. The branch that results is strictly worse than either endpoint: the old subsystem is gone, the new one was never delivered, and the surviving call sites reference identifiers that no longer resolve. Nothing warns the author, because the working tree they keep testing in holds both halves and is green — the defect is invisible from the only vantage point they have and total from every other one. A fresh clone cannot compile; the aggregate lint or verify target fails on its own account, because task-runner entries still name the deleted checker by path; the release build cannot run. It compounds wherever the organization's deploy rule is "what runs is exactly what is on the integration branch" — that rule exists to guarantee the branch is deployable, so a broken branch converts one person's staging mistake into a release stop for everyone, and every hour it stands is another worker syncing onto a foundation that does not build. The commit's own subject is the strongest misdirection available: it announces the replacement, so the log reads as though the work landed.

**Detect.** Do not read the working tree — it is the one place the defect cannot be seen. Materialize the integration branch by itself (a fresh clone, an archive export, or the pipeline's own checkout) and run compile, lint, and build against it; a green local tree beside a red materialized branch is the finding, and the distance between them is its size. The cheapest evidence of all is the integration pipeline's own recorded result for the branch tip: an unwatched failure on the mainline is routine, and reading it costs one query. Without a build, triage statically: for every commit that removes source files, list the removed paths and search the branch's own contents for surviving references — both module-graph imports the compiler would catch and string references in task-runner targets and checker file lists, which it would not. A commit whose diff is overwhelmingly deletions while live referents remain is the signature. Then invert the search: inventory untracked files and unstaged edits in every shared working tree and ask which published deletion each was supposed to accompany, which catches the same defect before another consumer pays for it.

**False positives.** Deliberate staged retirements where the removal is published first and every referent is removed in the same change, so the branch stays coherent at each step; deletions of genuinely unreferenced code; replacements delivered as a separate published artifact — a dependency version bump, a generated bundle — rather than as tracked source in the same repository.

## U:23 — The test suite is wired to no enforcement point, so the only branch goes red and stays red

**Statement.** The repository has a real test suite and a documented command to run it, but no
mechanical actor ever runs it: no CI provider is configured, and no pre-push or pre-merge hook
invokes the suite. Enforcement is a sentence in a contributor doc. With one careful contributor
this fails occasionally; with several concurrent lanes committing to a single trunk it fails
structurally — each lane runs at most the tests for its own scope, cross-scope regressions land
silently, and trunk accumulates failures nobody saw happen. The suite's redness then becomes
ambient: the next actor who runs it inherits failures they cannot tell from their own, failures
get attributed away as pre-existing, and the suite loses its authority as evidence — which is
precisely when regressions in the highest-stakes code (billing, auth) ride in unnoticed.

**Detect.** Enumerate enforcement points: CI configs (workflow directories, pipeline files),
`core.hooksPath`, committed hook scripts, and any deploy pipeline step that runs tests — confirm
by reading what they execute, not what they are named. If none runs the suite, run the FULL suite
on a clean checkout of trunk and count failures; any nonzero count is the finding, and the delta
between "suite documented" and "suite enforced" is the mechanism. Check the repo's own docs for
claims that a gate exists (NN:15 overlap) and whether recent trunk commits could have passed the
suite they landed on.

**False positives.** Suites genuinely enforced by an external system (org-level CI the repo
cannot see, a deploy pipeline that provably runs them) — verify the wiring end to end before
crediting it. Deliberately quarantined tests explicitly marked skipped/known-failing with an
owner and a date are hygiene, not this finding — silent redness is.
