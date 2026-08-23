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

## U:24 — Governance names a repository that no shared remote serves, so every other environment silently operates without it

**Statement.** The organization's governing documents — trunk rules, audit scopes, toolchain
inventories — name a repository as a first-class member of the fleet, but no remote any other
environment can reach actually serves it: it was never pushed, or it lives only on one
workstation's disk, or on a private server that is usually offline. Every workspace assembled
anywhere else clones what the remotes offer, comes up one repository short, and nothing
complains: the governance that names the repo has no liveness check, audits scoped to it
silently skip it, and cross-repo tooling that reads it degrades to covering the repos that
exist. The missing repo is typically the tooling repo itself — validators, contract ledgers,
cartography — which is exactly the one whose absence removes the means of noticing absences.
Meanwhile the single copy accretes unpushed history and becomes a single point of loss: one
disk failure deletes a governance-load-bearing repository that, per every document, still
exists.

**Detect.** Diff the set of repositories the governance names against the set the shared
remotes actually serve (the org listing, authenticated-user listing, and any self-hosted
forge — probe each, and treat an unreachable forge as unresolved, not absent). For each
governance-named repo missing from every reachable remote, search the documents for pinned
absolute paths — a workstation-local path in a doc is the tell that the repo lives on exactly
one machine. Check the audit instance's scope config for repos it can never have audited.

**False positives.** Repositories deliberately retired with their governance references
removed in the same change; repos on a private forge that is verifiably reachable from the
environments that need it (verify reachability, don't assume); scratch tooling explicitly
documented as single-machine and named in no governing rule.

## U:25 — A deploying command piped into a filter reports the filter's exit code, and the filter's early exit can kill the deploy mid-flight

**Statement.** An operator or script runs a command that ships — build, publish, apply, migrate — and
pipes it into a pager or filter to trim the output: `deploy | grep -E 'error|done' | head -5`. Two
independent failures follow. First, a shell pipeline's status is the LAST stage's, so the pipeline
succeeds whenever the filter succeeds; the deploy's own non-zero exit is discarded and the run is
recorded as green. Second, a filter that exits early (`head`, `sed q`, a pager the user quits) closes
the pipe, and the next write from the deploy raises SIGPIPE — terminating it partway through, after
some gates ran and before the change reached the target. The combination is worse than either half:
the deploy is killed AND reported successful, so the operator moves on to the dependent step, which
then fails with a confusing message about a state the first step was supposed to establish. Filters
whose patterns match the tool's own echoed command lines (recipe echoes, `set -x` traces) hit the
early-exit path almost immediately, long before any real output.

**Detect.** Grep operational docs, runbooks, Makefile/justfile recipes, and CI steps for a shipping
verb piped into `head`, `tail`, `grep`, `less`, `more`, `awk`, or `jq` without `set -o pipefail` (or
`${PIPESTATUS[0]}`, or PowerShell's `$LASTEXITCODE`). Confirm the exposure by checking whether the
tool's success is asserted anywhere OTHER than the pipeline's exit status. Then verify the deploy's
own record — its audit log, the published artifact version, the target's last-modified — rather than
trusting the reported success; a missing audit entry after a "successful" run is the signature.

**False positives.** Read-only commands (status, describe, list) where truncation loses nothing;
pipelines that set `pipefail` AND use a filter that consumes all input; shipping tools that write
their own durable audit record which the operator checks independently.
## U:26 - The promotion step between "artifact built" and "fleet points at it" is documented as automated, was provisioned, and was never wired

**Statement.** A release path has three parts: build the immutable artifact, move the pointer the
fleet reads (an SSM parameter, a tag, a channel alias, a "current" symlink), and roll. The pointer
move is declared as automated — a publisher function exists, IaC describes the parameter as
"managed by <event> -> <function> on success", and the function is provisioned and healthy — but no
trigger was ever created, so the automation has never executed once. Nothing surfaces this: the
build step succeeds loudly, the function reports Active, the parameter holds a real (older) value
rather than a placeholder, and the fleet keeps running the previous artifact exactly as it did
before. The promotion silently falls to whichever human knows the undocumented manual command, and
the gap is normally discovered only when something else forces the versions apart — a config change
that ships ahead of the code, an instance replacement that boot-loops, an incident. The danger is
proportional to how long the two halves stay compatible: a pointer that lags harmlessly for months
trains everyone to trust a step that has never run.

**Detect.** For every pointer a fleet resolves at launch, name the writer and prove it has executed:
a function with NO log group has never been invoked at all, and enumerating every rule/trigger's
targets for that function's ARN proves whether anything could invoke it. Compare the pointer's
last-modified timestamp against the newest artifact's creation timestamp — a pointer older than the
latest build is the symptom. Then read the release runbook and the build command's closing output:
if neither performs the promotion and no automation does, the step exists only in someone's head.

**False positives.** Deliberately manual promotion gates (a human approval between build and roll)
where the manual step is documented and the IaC does not claim automation; pointers written by the
build job itself rather than by an event-driven function; brand-new automation that has genuinely
not had a triggering event yet — check whether a qualifying event has occurred since it was wired.

## U:27 - A weighted traffic-shift stalls at zero: the router's primary advances, the weights pin all traffic to the old version, and everything downstream of "unweighted" breaks quietly

**Statement.** Guarded rollouts shift traffic between an old and a new artifact version through a
weighted router (a serverless alias with version weights, a load-balancer target-group split, a
service-mesh route). When the shift stalls at its starting position — or a rollback re-installs the
weights — the router enters a deceptive steady state: its primary pointer names the NEW version
(so dashboards, IaC state, and humans read the deploy as done) while the weight table still routes
100% of traffic to the OLD one. Nothing alarms: the old version serves correctly, health checks
pass, and every subsequent "successful" deploy advances the primary again without ever moving
traffic. Meanwhile subsystems that require an unweighted router are blocked with errors that name
the symptom, not the stall (capacity pre-provisioning refuses weighted aliases; declarative IaC
that declares no weights plans their removal forever and never converges — or converges and is
silently re-weighted by the stalled controller between applies). The fleet can run arbitrarily
stale code for weeks with green deploys the whole time.

**Detect.** For every weighted router in the fleet, read the LIVE routing table, not the deploy
log: a weight of ~1.0 on a non-primary version, or any weight older than the rollout system's
maximum shift duration, is a stalled shift. Cross-check three clocks: the primary pointer's
version, the weighted version, and the newest published version — any spread means traffic lags
delivery. Then find the controller that owns the weights (deployment service, rollback monitor,
cron) and check whether it is alive, failed, or was deleted with its weights left behind. Recurring
IaC plans that remove the same routing weights on every run are the same finding seen from the
other side.

**False positives.** A shift genuinely in progress (weight timestamps within the configured bake
window). A deliberate long-lived split (A/B or blue-green hold) that is documented and monitored —
the tell for the stall is that nobody can name the owner or the end condition.

## U:28 — Commits staged by directory sweep with no gate against untracked filesystem debris, so mistyped-redirect artifacts enter history

**Statement.** The repository's normal commit path stages by sweeping the working tree — add-all,
commit-all, or a helper that passes a directory rather than a file list — because that is what an
automated or fast-iterating workflow needs. Nothing in the commit gate asks whether a newly added
path is a file anyone meant to create. Shell accidents produce exactly such paths: a redirect
operator that consumed the next token creates an empty file named after a flag or a fragment, a
quoting slip writes a file named after part of a command. These artifacts are zero bytes, carry no
extension, and sit wherever the command ran, so every content-shaped check — formatters, linters,
schema validators, large-file limits, secret scanners — passes them without comment, and the sweep
commits them alongside real work. The damage is not the file; it is that the repository's history
now contains noise attributed to a substantive commit, the follow-up removal commit is the only
record that anything went wrong, and the same accident recurs because nothing was added to prevent
it.

**Detect.** Search history for removal-only commits whose message describes cleaning up a stray or
empty file, and for tracked paths that are zero bytes or whose names contain characters typical of
shell operators or flags; two occurrences in a week is a systemic gate gap, not two accidents.
Then read the commit-stage gate and confirm what it asserts about *added* paths specifically — a
large-file ceiling bounds size from above and says nothing about zero, and end-of-file fixers leave
empty files untouched. The gate to look for is one that rejects a newly added file that is empty,
extensionless, or named unlike anything else in the tree, with an explicit escape for the rare
legitimate case.

**False positives.** Deliberately empty marker files (keep-files, sentinel paths, fixtures that
must be zero bytes) — these are legitimate and should be allowlisted rather than argued about;
generated empty outputs the build requires; repositories whose commit path stages explicit file
lists, where the sweep this rule depends on does not exist.

## U:29 — The deploy pointer is written last-writer-wins, so a concurrently-finishing build rolls the fleet backwards between promotion and rollout

**Statement.** The fleet reads its artifact from a single mutable pointer — a parameter holding an
image id, a tag, a digest, a "current" symlink — and the promotion step writes that pointer with an
unconditional overwrite, validating only that the incoming artifact exists and is well formed.
Nothing compares the incoming artifact against the one already promoted, and nothing detects that
another actor wrote the pointer since this actor read it. Promotion and rollout are two steps —
write the pointer, then refresh the fleet — so any concurrent build that finishes inside that gap
silently redirects the rollout: the refresh reads the pointer at launch time, gets the other actor's
artifact, and rolls the fleet onto code the operator never chose. The damage is worst during
recovery, when the operator is refreshing precisely to restore service and the fleet comes back on
the older artifact — the rollout "succeeds", every pipeline check passes, and the outage continues
with no failed step to point at. Backwards moves deserve a guard rather than a prohibition, because
deliberate rollback is a legitimate and urgent operation; the guard is that going backwards must be
stated, not inferred.

**Detect.** Find every writer of each deploy pointer and confirm the claim that there is exactly one
— a second writer anywhere makes ordering unprovable. Read the promotion step: does it fetch the
pointer's current value before writing, compare artifact recency by creation timestamp, build
number, or digest provenance rather than lexical tag order, and require an explicit force flag to
move backwards? Is the write conditional on the value the actor read — compare-and-swap,
expected-version, conditional put — or an unconditional overwrite? Then check the gap: if promotion
and rollout are separate commands, does the rollout re-read the pointer and assert it still holds
the artifact the operator promoted? Incident histories are the fastest confirmation — a recovery
rollout that brought back the wrong build, with no failed command in the transcript, is this rule.

**False positives.** Pipelines where promotion and rollout are one atomic operation that passes the
artifact identifier through by value rather than re-reading the pointer; pointers written only by a
single serialized deployment controller with enforced mutual exclusion, where the lock is verified
to exist rather than taken on faith; environments where concurrent builds are structurally
impossible because the build lane itself holds an exclusive lease for its whole duration.

## U:30 — The task runner's validation guard exits a subshell, and the separator that follows discards its status, so the guarded operation runs anyway and the command reports success

**Statement.** A task-runner recipe — make, just, npm script, shell wrapper — validates a
precondition with the idiom `check || ( echo "refusing"; exit 1 )`. The parenthesised failure branch
is a subshell: its `exit` terminates the subshell, not the recipe. Whether that still stops anything
depends entirely on what follows on the same logical line. If the guard is the last statement, the
subshell's non-zero status becomes the line's status and the runner fails the recipe, so the idiom
appears to work — and it does, in most of the places it is used, which is exactly why it survives
review. If the guard is followed by more work joined with an unconditional separator, that separator
discards the status, and the operation the guard was protecting executes on the state the guard
just rejected. The result is the worst possible shape for an operator: the refusal message is
printed in full, immediately above a success message, and the command exits zero. Every downstream
check — pipeline status, audit log, the operator's own eyes on the last line — reads success. The
same file usually contains both the safe and the unsafe instance of the identical idiom, so a
reviewer who spot-checks one occurrence concludes the pattern is fine.

**Detect.** Grep every recipe file for a failure branch wrapped in parentheses containing `exit`, and
for each occurrence determine what follows it on the same logical line after continuations are
joined. An occurrence terminated by the end of the line, by `&&`, or by a case-branch or `then`
terminator that is itself the line's last statement, is safe — the status propagates. An occurrence
followed by `;` with further commands is the defect. Do not stop at the pattern count: the ratio of
safe to unsafe occurrences is usually high and the unsafe ones are the interesting minority. Prove
each hit rather than reasoning about it — run the recipe against a deliberately invalid input with
the effectful command stubbed out, and read the exit status and the last line printed. The repair is
a brace group, `|| { echo "…" >&2; exit 1; }`, which runs in the current shell so the exit is real.

**False positives.** Guards that are the final statement of their recipe line, including those
closing an `if`/`case` whose compound status the runner already observes; guards inside a chain
joined only by `&&`, where a failing subshell short-circuits the rest; runners configured to abort
on any non-zero statement (an explicit `set -e` in the recipe's shell, or a runner whose default
shell sets it) — confirm the setting rather than assuming it, since several popular runners default
to a shell with `-u` but not `-e`.

## U:31 — An interactive confirmation inside a deploy lane reads stdin without a tty check, so automation contexts hang forever on an open pipe or sail through on EOF

**Statement.** A guarded lane — a destroy confirmation, a production gate — prompts with a bare
`read` mid-recipe. On an operator's terminal it works, which is where it is tested, so it survives.
Run from automation — a background shell, CI, an agent harness — stdin is one of two things the
author never chose: an open-but-silent pipe, where `read` blocks indefinitely and the lane freezes
with zero output and zero state written (the most expensive symptom, because it presents as a slow
apply and the diagnosis burns exactly the window the gate existed to protect), or a closed/null
stream, where `read` returns EOF immediately and the comparison's else-branch silently decides the
outcome. The gate's behavior in the context that most needs it is unspecified — decided by which
stdin the runner happened to wire, not by anyone's intent.

**Detect.** Grep lane recipes for `read`/prompt constructs; for each, require an explicit
interactivity test (`[ -t 0 ]` or the runner's equivalent) with a fail-closed non-interactive branch
that names the deliberate override an automated caller must pass (an env var or flag). Prove each
hit by running the recipe twice with the effectful step stubbed: once with stdin from an open pipe,
once from the null device — a hang in the first or a silent branch decision in the second is the
defect.

**False positives.** Prompts in operator-only utilities that no automated lane invokes; prompts
already behind an interactivity check with a fail-closed branch; runners that allocate a pseudo-tty
for every recipe — verify the allocation, never assume it.

## U:32 — A build/bake provisioner declares environment variables the command template never interpolates, so every declared var is silently absent and the scripts run on their own defaults

**Statement.** An image-build or provisioning step declares variables for its scripts in one field
(an `environment_vars`/`env` list) and overrides the command that runs them in another (a custom
`execute_command`/entrypoint template). The two are joined only by an interpolation token the
template must contain; omit it and the declaration becomes decorative — the variable list is parsed,
validated, and shown in build output, while the script process is spawned with none of it. Nothing
errors, because a build script that reads an unset variable takes its own default. The defect
therefore hides for as long as every default happens to equal the value the template was passing,
which is the normal case when the template was written by copying the script's own default. It
surfaces only when one script starts *requiring* a variable, or when a version pin is bumped in the
template and the built image keeps shipping the old version — and at that moment the pin, the
template, and the build log all still read as correct. The blast radius is every artifact baked
since the template was written, and the artifact is what runs in production.

**Detect.** For every provisioner that overrides the default command, diff the set of declared
variables against the tokens actually interpolated in the command template; a non-empty declaration
with no delivery token is the defect. Do not accept the build log as evidence — it prints the
declaration, not the delivery. Prove it by having one script echo a sentinel variable into the image
and reading the sentinel out of the built artifact, or by asserting the built artifact's version
strings against the values the template passed. Sweep sibling templates in the same repo together:
this is copy-paste-shaped and is almost never present at only one site.

**False positives.** Runners whose default command already exports the declared variables and whose
template was overridden for an unrelated reason (verify the default's documented behavior for that
tool and version); variables consumed by the provisioner itself rather than the spawned script;
declarations deliberately kept for documentation where the scripts read the values from a
config file instead — verify the scripts genuinely never reference the environment.

## U:33 — A hook manager's core.hooksPath displaces the git-lfs hooks, so pushes publish pointer files whose objects never upload

**Statement.** A repo adopts a hook manager (husky, lefthook, pre-commit) that sets
`core.hooksPath` to its own directory. `git lfs install` writes its hooks — pre-push
chief among them, the one that UPLOADS objects — into `.git/hooks`, which the
manager's path setting silently displaces. Every push then succeeds at the git
layer while uploading nothing to the LFS server: the remote accumulates pointer
text for every LFS-tracked file pushed since adoption. Downstream, any consumer
that deploys the raw checkout content (a host that does not resolve LFS at build
time, a CI runner without an lfs fetch step) ships the ~130-byte pointer TEXT
under the media's filename — the page 200s, the element renders nothing, and the
file's own name asserts it is a video or image. The failure is doubly silent:
authors always see their real local file, pushes and builds stay green, and the
only externally visible symptom is a content-length three orders of magnitude
too small.

**Detect.** In any repo whose `.gitattributes` carries `filter=lfs` AND whose
config sets `core.hooksPath` (or a hook-manager directory exists): read the
manager's pre-push script and confirm it invokes `git lfs pre-push`. Then verify
remote truth independently: for each LFS-tracked path, compare the deployed/
served content-length against the size the pointer declares — a ~130-byte
response where megabytes are declared is the finding. `git lfs push --dry-run`
listing objects the server lacks confirms the gap; an orphaned ~130-byte "media"
file committed in history is the scar of a previous undiagnosed hit.

**False positives.** Managers whose hook scripts genuinely chain LFS (grep
before flagging); hosts that resolve LFS at build time when the objects exist
server-side; deliberate pointer-only mirrors; repos whose LFS patterns match no
tracked file.

## U:34 — The edit script reports success unconditionally, so a replacement that matched nothing looks applied

**Statement.** A helper script rewrites a file — a doc addendum, a config block, a generated section
— with a search-and-replace, then prints success. It never asserts that the search matched. A
whitespace drift, a reflowed line, or an earlier edit makes the match fail; the script prints
success, the caller commits, and the change is simply absent. The commit message describes work the
tree does not contain, and the omission is discovered whenever someone next reads the file.

**Detect.** Every programmatic edit asserts its match count and exits non-zero on zero matches.
Where the edit is meant to be idempotent, assert either "applied once" or "already present" — never
an unconditional success print. After any scripted edit, diff the file rather than trusting the
script's own report.

**False positives.** Genuinely optional edits that log clearly which branch they took.

## U:35 — IaC adopts part of a console-created resource group and records the rest as skipped, leaving an unmanaged sibling that can never work

**Statement.** A resource group is first created through a console convenience flow, which
provisions several linked objects at once. The infrastructure code is written afterwards and adopts
only the members the authors consider real, marking the others in a comment as skipped because they
came from the quick-create path. The skipped objects are not deleted — they stay live, outside the
state file, invisible to plan and to drift review, and they keep serving traffic. Because the
supporting grants are written to cover only the adopted members, the unadopted path is live but
permission-less: it matches requests, attempts its downstream call, is refused, and returns a
server error to the caller. The comment that documents the omission is the only record that the
path exists, and prose in a definition file is not a control. Every review reads the managed
resources and concludes the surface is correct.

**Detect.** Enumerate the live members of each resource group from the provider API and diff that
set against the IaC state — never against the IaC source, which by construction omits what was
skipped. Treat any live member absent from state as a finding regardless of comments. For each
unmanaged member, follow its downstream call and check whether a grant covers it; a path with no
grant is permanently broken and should be deleted, not adopted. Grep IaC for comments naming a
resource id as skipped, ignored, or created out of band — each one marks a live object nothing owns.

**False positives.** Resources deliberately owned by a different state file or team, where the
boundary is declared and the owning module is identifiable; provider-managed children that have no
independent identity.

## U:36 — The build fetches a remote artifact with a client that treats an HTTP error response as success, so the error body is written to the artifact path and the failure surfaces later as a corrupt archive with its cause gone

**Statement.** A build step downloads a dependency, a layer, or a toolchain archive from a signed
URL or a registry using a transfer client whose default is to write whatever the server returned and
exit zero — an expired-signature XML document, a 404 page, a partial body from a dropped connection.
The bytes land at the artifact path, the step reports success, and the failure appears one or more
steps later as an unarchive error, a missing-file error, or a module that will not load. By then the
HTTP status, the URL, and the response body are all gone, so the visible error names the wrong
layer entirely and the build is debugged as a packaging problem. Retryable transient causes make it
intermittent, which is what converts a one-line flag into repeated lost build runs. The same defect
is usually present at several call sites, because the idiom is copied: hardening the one that
happened to fail leaves its siblings live.

**Detect.** Enumerate every network fetch in the build scripts and require, at each, that the client
fails on HTTP error status, retries transient failures, and that the result is verified against a
pinned digest before use. Treat "the later integrity check would have caught it" as a diagnosis
defect rather than an absolution: the check does stop the bad artifact, but it reports the wrong
cause, so record it as such and fix the fetch. Sweep by idiom, not by incident — grep for the
transfer command itself and audit every occurrence, since the copied call sites are the finding.

**False positives.** Fetches immediately followed by a digest or signature verification against a
pinned value AND whose failure message names the download as a possible cause; steps where a
partial or error body cannot parse as the expected format and the parser reports the URL and status
it came from.
## U:37 — Derived build output tracked by version control — rewritten by every build, exempt from every content gate that rightly excludes the build directory

**Statement.** Derived build output — object files, module caches, build-system task stores,
generated intermediates, build logs — is tracked by version control because the toolchain's default
output directory was never added to the ignore rules before the first sweep-style commit captured
it. From that point the debris is self-sustaining: every local build rewrites tracked paths, so the
tree reads dirty after ordinary work and the fastest way to a clean status is to commit the churn,
attributing thousands of derived-file changes to substantive commits. The repository's own content
gates make it worse rather than better, because scanners and pattern gates rightly exclude the build
directory — leaving content that IS tracked, cloned, and diffed by every consumer permanently exempt
from every check the repo runs on tracked content. Reviewers learn to skip any diff touching the
directory, which is the durable damage; the megabytes are the visible one.

**Detect.** Diff the version-control index against the toolchain's known derived-output locations:
list tracked files under the build system's default output directories (the in-tree `build/` for
project-relative builds, package-manager output dirs, log files at the root) and read the ignore
rules for those exact paths — an ignore file that lists the tool's *alternate* output spelling but
not the default one is the tell that the rule was written after the debris landed. Check when the
artifacts entered history and whether any script, CI job, or document references them; zero inbound
references confirms debris rather than a vendored input. Cross-check the repo's content gates for
an exclusion of the same directory: tracked-but-unscannable is the combination that elevates this
above cosmetics.

**False positives.** Deliberately vendored binary inputs (fixtures, golden files, prebuilt
third-party blobs) that something in the build or test path consumes — trace the consumer before
filing. Generated source that the project's own freshness gate regenerates and diffs (a committed
codegen output with a drift check) is a different, legitimate architecture. Repositories that
intentionally commit lockfile-adjacent build metadata for reproducibility, where a document names
the decision.

## U:38 — A content-addressed artifact cache keyed on working-tree bytes, with more than one checkout able to build, so normalization differences make two builders invalidate each other forever

**Statement.** The build skips work by hashing an artifact's source files and comparing that digest
to one stored beside the published artifact — a sound design, and the usual cure for slow pipelines.
It becomes a deadlock the moment two different checkouts of the same repository can both run the
build, because the digest is taken over bytes on disk rather than over content the version-control
system considers canonical. Line-ending normalization is the common divergence: one checkout
materialized its files before the repository declared a normalization rule, or under a different
client-side conversion setting, and version control will not rewrite files whose content it
considers unchanged — so the stale spelling persists indefinitely while status reports clean. Each
builder then computes a different digest for the identical commit, re-uploads the artifact, and
stamps its own digest, which makes the other builder's freshness gate report the artifact stale.
Neither builder is wrong and neither can win; the gate oscillates for as long as both lanes run.
The damage is not the wasted uploads — it is that the failure presents as "your artifacts are
stale", so the operator's instinct is to rebuild, and rebuilding is the thing causing it.

**Detect.** Ask first whether more than one checkout of the repo exists on any machine or image that
can invoke the build — reference clones, read-only mirrors kept for grepping, per-worker clones, a
CI cache directory alongside a developer tree. For each, compare the digest the build would compute
for the same artifact directory at the same commit; any difference is the bug, and the file count
matching while contents differ points at normalization rather than missing files. Version control
can name the divergence directly: an eol/attribute listing that reports the index and the working
tree in different spellings for the same path (`i/lf w/crlf`) is conclusive, and it will coexist
with a clean status. Confirm the oscillation from the artifact store rather than inferring it —
list the stored digests across recent versions of one artifact and look for two values alternating.
Note that a force-overwrite re-checkout is not a reliable repair: some implementations skip files
that already exist, leaving mtimes untouched and the operator believing the tree was rewritten.

**False positives.** A build whose hash is computed over version-control-canonical content
(hash-object, archive output, or the commit itself) rather than the working tree is not exposed,
however many checkouts exist. Digests that differ because the trees genuinely differ — one checkout
behind, or carrying uncommitted work — are ordinary staleness, not this; establish that both
checkouts are at the same commit and clean before filing. A single-checkout pipeline can never
exhibit the oscillation regardless of how the digest is computed, so this stays theoretical until a
second builder is proven able to run.
