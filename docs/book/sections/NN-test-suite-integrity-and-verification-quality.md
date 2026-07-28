---
section: NN
title: "Test-Suite Integrity & Verification Quality"
group: cross-cutting
---

# [NN] Test-Suite Integrity & Verification Quality

The audit of the auditors: a green suite is only evidence if the suite itself is sound. These rules
target the ways test suites lie — asserting nothing, mocking fiction, flaking until ignored — so that
"CI passed" regains meaning. Companion to CI/CD mechanics in [U].

## NN:1 — Assertion-free and tautological tests

**Statement.** Tests that execute code but assert nothing meaningful: no `expect`/`assert` at all,
`expect(true).toBe(true)`, asserting only "did not throw," or snapshotting `undefined`. They inflate
coverage metrics while verifying nothing — the purest form of coverage theater.

**Detect.** Scan test bodies for missing/trivial assertions (lint rules: `expect-expect`,
`no-standalone-expect`). Spot-check high-coverage/low-assertion files. Mutation-test a critical module:
if mutants survive under 100% line coverage, the assertions are decorative.

**False positives.** Deliberate smoke tests ("boots without crashing") that say so in their name and
are counted as smoke, not behavior coverage; type-level compile-only tests.

## NN:2 — Hand-rolled fakes drifting from the real dependency

**Statement.** Mocks/stubs of external services (payment APIs, webhooks, internal microservices)
maintained by hand and never checked against the live contract. The suite verifies conversation with a
fiction: real API changes shape, mocks stay green, production breaks — with every test passing.

**Detect.** Inventory mocked boundaries. For each, ask what mechanically ties the fake to reality:
contract tests, recorded-replay fixtures refreshed on a schedule, schema-validated fixtures, or
provider-published test harnesses. Hand-written response literals older than the last provider API
version are findings.

**False positives.** Fakes for interfaces you own where the same repo's typechecker + integration
tests pin both sides; official vendor sandboxes/emulators kept current.

## NN:3 — Clock- and sleep-dependent tests

**Statement.** Tests using real wall-clock time — `sleep(500)` then assert, `Date.now()` comparisons,
timeout-race assertions — pass on fast machines and flake in CI, at midnight, on DST boundaries, or
under load. Time-math bugs (JJ:7, KK:7) also hide because tests only run at "now."

**Detect.** Grep tests for sleeps and direct clock reads. Require injected/fake clocks
(`jest.useFakeTimers`, injected `now()` seams — the DI-seam pattern) and explicit boundary-date cases
(DST shift, month end, leap day). Sleeps waiting on async completion must become awaited signals.

**False positives.** True end-to-end latency tests whose subject IS timing (load tests, SLA probes),
isolated from the unit suite and marked as such.

## NN:4 — Order- and state-coupled tests

**Statement.** Tests sharing mutable state — module singletons, one database, leftover files, unreset
env vars — pass in suite order, fail alone or shuffled (or vice versa). One test's writes become
another's fixture; adding a test breaks a distant one; parallelization is permanently blocked.

**Detect.** Run the suite shuffled (`--randomize`) and per-file in isolation; any divergence from the
full-suite result is a finding. Audit setup/teardown pairing on shared resources (DB truncation,
temp dirs, env restoration, module-registry resets between tests).

**False positives.** Explicit ordered integration sequences (provision→use→teardown) declared as a
single sequential scenario, isolated from unit tests.

## NN:5 — Flakiness normalized: retry-until-green as culture

**Statement.** Known-flaky tests handled by auto-retry (CI retry: 3, rerun buttons pressed on red)
instead of quarantine-and-fix. Retries convert real intermittent bugs — races (II), timeouts, leaks —
into "passed on attempt 2." The suite's signal decays until red means nothing and real regressions
ship.

**Detect.** Check CI config for blanket retry policies and rerun-on-failure habits (pipeline history:
how often does a red turn green on rerun?). Require: a tracked quarantine list with owners and dates,
flake-rate metrics, and retry allowed only on the quarantine, never globally.

**False positives.** Bounded retry on infrastructure setup steps (runner network blips) as opposed to
test bodies; a quarantine process actually burning down.

## NN:6 — Happy-path-only coverage on failure-rich code

**Statement.** Error branches — timeouts, 4xx/5xx responses, malformed payloads, permission denials,
partial failures — untested precisely where the code's whole job is failure handling. The catch blocks,
fallbacks, and compensation paths (JJ:10) ship as never-executed fiction.

**Detect.** For each external call site, count tests exercising its failure modes vs. success. Review
coverage of catch blocks specifically (branch coverage, not line). Retry/backoff logic verified for
schedule and give-up behavior, not just "eventually returns."

**False positives.** Thin pass-through wrappers whose failure behavior is fully owned and tested one
layer up (verify that layer's tests actually simulate the failures).

## NN:7 — Snapshot tests as rubber stamps

**Statement.** Large auto-generated snapshots (full component trees, whole API responses) updated
wholesale with `--update` on every diff — review skims 400 changed lines, approves, and the "test"
becomes a changelog nobody reads. Intent is captured nowhere; regressions get snapshotted in as the new
truth.

**Detect.** Measure snapshot sizes and update frequency (git log on `.snap` files: updated in >X% of
PRs = stamp). Require targeted assertions for the properties that matter (specific fields, roles,
labels) with snapshots reserved for small, stable, reviewed surfaces.

**False positives.** Small focused snapshots (an error message, a serialized config) that get real
review; visual-regression systems with dedicated image-diff review flows.

## NN:8 — Test doubles for infrastructure semantics that differ materially

**Statement.** In-memory/lite stand-ins (SQLite for Postgres, local dicts for DynamoDB, sync fakes for
queues) whose semantics diverge from production — case sensitivity, transaction isolation, conditional
writes, delivery ordering — so the suite validates behavior production doesn't have (and misses
behavior it does, e.g. the races in [II]).

**Detect.** List infra stand-ins used in tests. For each, name the semantic differences and check
whether tested code paths depend on them (conditional writes, isolation levels, ordering). Require at
least one CI lane against the real engine (containerized Postgres, DynamoDB Local with condition
checks) for those paths.

**False positives.** Stand-ins for code that touches none of the divergent semantics; the DI-seam fake
pattern for unit logic, backed by a separate integration lane on the real engine.

## NN:9 — Coverage thresholds gamed by volume instead of behavior

**Statement.** A line/branch percentage gate satisfied by low-value tests (getters, render-only,
generated code counted in) while the critical invariants — money math, authz decisions, state
transitions — sit uncovered. The number is green; the risk is untouched. The gate drives writing
tests, not verifying behavior.

**Detect.** Read the coverage config: what's excluded/included, is generated code inflating the
denominator? Map the top-risk modules (billing, auth, booking) and inspect their tests for invariant
assertions specifically. Mutation testing on those modules is the honest metric when available.

**False positives.** Teams using coverage as a floor plus explicit critical-path test plans — the
number as smoke detector, not target.

## NN:10 — Designed failure modes shipped untested

**Statement.** The failure machinery this book demands — DLQ routing (E:2), circuit breakers (X:3),
graceful shutdown (A:31), fallbacks, load-shedding (X:10), alarm paths (G:7) — deployed without a test
that ever triggers it. First execution of the failure path is the incident itself; it usually has a
bug of its own.

**Detect.** For each resilience mechanism in the architecture, demand the test or drill that exercises
it: poison message actually lands in DLQ and alerts; breaker actually opens under injected failure;
SIGTERM actually drains. No trigger-test = the mechanism is unverified decoration (X:6's sibling for
code-level machinery).

**False positives.** Mechanisms exercised by scheduled chaos/game-day drills with recorded results —
the drill is the test; verify recency.

## NN:11 — Framework installed, zero tests: the suite exists only in the dependency manifest

**Statement.** A production surface ships with test tooling declared — a runner in
devDependencies, `tests/**` carve-outs in tool configs, CI caches for it — but zero executable
specs committed, no runner config, and no CI step that executes any test. Reviewers, dependency
dashboards, and third-party auditors read the manifest and credit the surface with a suite it
does not have; every behavioral regression reaches users because nothing executable ever ran.

**Detect.** Don't read manifests — enumerate committed spec files (`git ls-files` filtered by
the runner's discovery patterns) and the CI steps that would execute them. A devDependency
runner with no config file and no committed specs is coverage theater. Static verifier scripts
(lint, schema, contract checks) verify structure, not behavior — do not count them as the suite.

**False positives.** Packages tested exclusively from a sibling package in the same monorepo
(trace the CI invocation that covers them); a brand-new scaffold explicitly documented as
pre-test with a dated owner decision.

## NN:12 — Post-incident static verifier asserts source presence for a runtime-absence failure class

**Statement.** After a live incident caused by an element or config being absent AT RUNTIME, the team ships a static verifier that checks the artifact exists IN SOURCE — a strictly weaker property. Conditional rendering (tabs, permissions, breakpoints, feature flags), dead code paths, and environment divergence all keep the incident class alive while the gate stays green — and the green gate now actively suppresses suspicion ("CI checks that").

**Detect.** For each verifier born from an incident (comments usually cite it), restate the incident's failure predicate and the verifier's checked predicate; if the verifier's predicate is satisfiable while the incident predicate recurs (source-present but conditionally unmounted; config-defined but not deployed), the gap is the finding. Enumerate the concrete divergence paths as evidence.

**False positives.** Verifiers explicitly scoped as one layer of several, where a runtime check (e2e, canary, graceful degradation) covers the residual class and is named; failure classes that structurally cannot diverge between source and runtime.

## NN:13 — Blocking gate detects a pattern's syntax instead of its semantics, so it fails on a categorically different construct

**Statement.** A merge- or deploy-blocking verifier encodes a banned pattern as a shape-level match
(a regex over an operator and a keyword, an AST node type, a name substring) rather than over the
property the ban is about. A construct that shares the syntax but not the semantics — a default
value where the rule meant a dependency, a same-named local where the rule meant an import, a
literal inside an unrelated expression — trips the gate. Because the gate is a hard block, the
false positive forces one of two outcomes, both worse than no gate: legitimate work is blocked at
the moment it is most urgent, or the finding is silenced by adding the innocent file to a
grandfather/baseline list — which permanently exempts that file from the real rule too. A gate that
has never matched a true positive in the tree it guards is not protecting the invariant; it is
taxing the team and eroding trust in every other gate beside it.

**Detect.** For each blocking verifier, extract the literal predicate it evaluates and restate the
prose rule it claims to enforce; where the predicate is broader than the rule, construct the
innocent construct that satisfies the predicate. Then measure the gate's yield: search the guarded
tree for the pattern the rule actually bans (the semantically-qualified form) and count true
positives. Zero true positives plus a live failure is the finding, not a coincidence. Check the
baseline/allowlist file for entries added to silence a false positive rather than to grandfather a
real violation — each such entry is a permanently unguarded file, and its presence is corroborating
evidence.

**False positives.** Deliberately conservative detectors on invariants where a miss is
catastrophic and the over-match rate is documented with a named review step; gates whose broad
predicate is paired with an explicit, narrowly-scoped exception mechanism intended for the innocent
construct (a per-line suppression comment with a required justification, not a whole-file
baseline).

## NN:14 — Cross-repo contract gate validates against a vendored snapshot whose freshness check silently no-ops in CI

**Statement.** A merge-blocking gate protects consumers against calling an endpoint, field, or
operation the producer no longer serves — but it evaluates client call sites against a *vendored
snapshot* of the producer's contract committed into the consumer repo, not against the producer
itself. The snapshot's freshness is delegated to a sync script that resolves the producer through
an ambient path (a sibling checkout, a monorepo-relative directory, a local artifact cache) and,
when that path is absent, takes the "trust the committed copy" branch and exits success. CI checks
out only the consumer repo, so the absent branch is the *only* branch CI ever runs: the drift
detector is structurally incapable of failing where it is enforced, and it fails only on developer
machines that happen to have both repos side by side. The blocking gate downstream then reports a
precise, confident tally ("N client calls checked against M producer routes — OK") computed
entirely from a snapshot nothing keeps current. A producer-side removal or rename stays in the
snapshot, every consumer call to the dead operation is greenlit, and the failure resurfaces in
production as the exact class the gate was built to prevent.

**Detect.** Trace the gate's reference data to its origin and identify the environment boundary it
crosses. Read the sync script's not-found branch and confirm the exit code; then read the CI job
and confirm whether the producer is actually checked out (a bare checkout step with no `repository:`
override means it is not). Separately, ask what regenerates the snapshot: grep the producer repo for
the generator's invocation in CI config, task runners, and verifier suites — a generator wired into
nothing is refreshed only by memory. Prove staleness empirically rather than arguing it: run the
generator against the live producer and diff against the committed snapshot. Additive-only drift is
still the finding — the mechanism that permitted it permits a removal just as silently.

**False positives.** Snapshots regenerated by an automated producer-side job that opens the
consumer PR on every contract change (verify the job exists and has run recently); gates whose CI
genuinely checks out both repos or pulls the contract from a published, versioned artifact rather
than a filesystem sibling; consumer repos where a runtime contract test (a smoke call against a
deployed producer) covers the same class and is named as the compensating control.

## NN:15 — The governing contract names an automated enforcement authority the repository does not contain

**Statement.** A repository's own engineering contract states that its checks are enforced
automatically at integration time — "the suite runs on every change", "a failing check blocks
merge", "the gate is required" — and the checks themselves are real: numerous, well-targeted, and
genuinely capable of catching the classes they name. What does not exist is the *authority*. The
repository contains no pipeline definition, no required-status or branch-protection configuration,
no server-side hook — nothing that can observe a change and refuse it. The checks are reachable
only when a human chooses to invoke a task-runner target, or through client-side version-control
hooks that live per-clone, are installed by a separate opt-in step, and that the tooling documents
how to skip. Every incentive then runs against them, because the checks are slowest and most
irritating exactly when a change is most urgent. The damage exceeds the missing automation: the
written claim causes reviewers, downstream teams, and remediation plans for other defects to treat
the checks as satisfied preconditions, so nobody re-derives whether they ran — and a contributor
who skips them leaves behind no signal that they were skipped. The tell is empirical: run the suite
against the integration branch and count the failures sitting in history that the contract says
could never have landed.

**Detect.** Read the enforcement claim literally, then look for its implementation as a deployed
object *before* reading any code — a pipeline-definition directory, a required-status or
branch-protection configuration, a server-side hook. Absence of the directory is dispositive;
presence is not, so enumerate which jobs actually invoke the named check. Separately, inventory
every check the claim covers and classify each by how it can be reached: server-enforced,
client-hook (name the documented skip flag), or manual invocation only. A suite-runner target that
aggregates the checks is routinely mistaken for their enforcement — trace every caller of that
target and confirm whether any caller is automatic. Where client hooks are the only mechanism,
check whether they are installed by checkout or require a separate step, and whether anything
rejects a push that bypassed them. Then prove the gap empirically rather than arguing it: execute
the checks against the committed head of the integration branch; any failure that is purely static
(needing no credentials or deployed state) is a violation the contract asserts is impossible, and
is the finding's strongest evidence. Finally, check whether the contract's stated trigger is even
reachable under the repository's own workflow policy — a claim keyed to a review event in a
repository whose policy forbids that event is unimplementable, not merely unimplemented.

**False positives.** Repositories whose enforcement genuinely lives in an external system the
repository does not contain — a central pipeline service, an organization-level policy, a
mirror-side gate — where that system is verified and named; single-operator repositories that
explicitly document manual invocation as the accepted posture with a dated owner decision;
client-side hooks paired with a server-side re-check that renders the local skip inconsequential.

## NN:16 — The gate checks the declarative registry's shape but not its correspondence to the implementation map it dispatches into, and a missing entry degrades to a legitimate-looking negative

**Statement.** A feature is expressed as a declarative registry — entries carrying an identifier plus metadata — while a separate map supplies each identifier's behavior: a state signal, a handler, a resolver, a formatter. The registry's own header states the correspondence as a requirement, in the imperative: an identifier declared here must have an implementation there. A blocking verifier is then written for the registry and asserts exactly the properties that are easy to express over a single file — required fields present, enumerated values known, budgets respected — and stops, frequently with an explicit note that it checks only what is statically decidable. But the correspondence is *also* statically decidable; both sides are literals in source. It is simply the one clause nobody encoded, and it is the only clause whose violation is silent. A lookup miss yields the language's absent value, which the consuming expression folds into the negative branch of a legitimate binary — not complete, not permitted, not applicable — so the surface renders a plausible, permanent wrong answer instead of failing. Nothing else catches it: the map is typed as an open record keyed by string, so compilation is satisfied; review sees a green gate beside a stated contract and infers the contract is enforced. The pattern is most likely immediately after an earlier gate was retired for over-claiming, because the replacement is deliberately scoped down to defensible checks and the scoping-down is what drops the clause that mattered. A registry that happens to be complete today is not a defence — completeness is exactly what lets the gap survive every review until the next entry is added.

**Detect.** Read the registry's stated invariants as an explicit list and check each one against what the verifier actually asserts; where the verifier's header enumerates its own checks, the omission is mechanical to spot. Grep the verifier for any reference to the implementation module at all — zero references means it can only ever have checked one side of a two-sided contract. Then work from the consumer: find every lookup keyed by a registry identifier and evaluate what the expression yields when the key is absent; if the miss is indistinguishable from a real value rather than throwing or failing the build, the correspondence must be gated rather than documented, and the rendered negative state is the blast radius. Establish whether the registry is currently complete before assigning severity, and say which it is — a latent gate gap and a live wrong answer are different findings with the same root cause.

**False positives.** Maps where an absent entry is a deliberate, documented opt-out with its own rendering path; correspondences the type system genuinely enforces, such as a mapped type keyed by the registry's own literal union so a missing key fails compilation; registries whose implementations are resolved at runtime from a location no static tool can enumerate, where a startup assertion is named and verified as the compensating control.

## NN:17 — Remediation verified by reading the committed diff and closed without confirming the change reached the running system

**Statement.** A finding is remediated, the change is committed, and the tracking entry is closed on
the strength of the diff — the resource is declared, the destination is configured, the schedule is
corrected, the guard is added, and anyone re-reading the repository will find exactly the intended
state. What never happened is the deploy: the declaration lives in version control and nowhere else,
because applying it is a separate act that no gate ties to the close. The tracker now asserts, with
evidence, that a live defect is gone while it is entirely intact, and that assertion is more harmful
than the original defect because it retires the defect from attention. Repositories that gate
deployment on committed source are especially prone to it, since the commit genuinely is a
precondition for shipping and is easily mistaken for shipping. The failure compounds when the closed
finding was itself the mitigation for a second finding, and it hides indefinitely, because every
subsequent source review confirms the fix and no source review can see the gap.

**Detect.** Treat "closed-fixed" as a claim about the RUNNING system and re-verify it there: for each
recently closed finding, identify the observable the fix was supposed to create — a destination on a
function, an attribute on a resource, a schedule value, a policy statement — and query the live
provider API for exactly that observable, never the repository. Prefer the API call that enumerates
what actually exists over the one that fetches what you expect (list rather than get, so an absence
is a visible empty set rather than an exception you might mis-handle), and remember that
alias-qualified or version-qualified configuration may not appear in the unqualified read. Where
several findings were closed in one batch, check them all: the un-applied change is usually a whole
stack, not one resource. Diff the tracker's closed set against live reality on a schedule, not only
when something breaks.

**False positives.** Findings whose fix is genuinely source-only (a test, a document, a build-time
check) with no runtime observable; environments where the close is explicitly scoped to the
repository and a separate deployment record tracks the rollout; changes deployed through a pipeline
whose success is itself recorded on the finding.

## NN:18 — Golden captures that are content-free, or invariant across the axis they claim to test

**Statement.** A snapshot, screenshot, or golden-file suite reports green while its artifacts capture
nothing, or capture the same thing for every variant. Two shapes recur. The capture is structurally
empty: the subject was rendered without a real layout pass, so the artifact holds only a background or
container and none of the elements the test is named for — a large file that reads as coverage of a
surface never observed. Or the variants do not vary: the axis under test (theme, locale, size class,
feature flag) is read from shared mutable ambient state instead of being pinned per case, so the
baselines are byte-identical and the variant case cannot fail. Either way the comparison passes by
construction. A non-deterministic subject — a looping animation, a live clock — compounds both, because
any genuine capture then flakes, which pressures the team toward a looser comparison rather than a
fixed subject.

**Detect.** Inspect the artifacts, not the test names. Hash the baselines for variants that must differ:
identical hashes across a theme or locale pair prove the axis is unpinned. Add a rendered-content guard
that fails when a capture is flat or near-uniform, so the degenerate case cannot silently return. Verify
the subject is laid out in a real container before capture, that the axis is injected per case rather
than read from shared storage, and that animations and clocks are frozen. Confirm the framework is
actually linked into the test target and that the suite has ever run — an unlinked suite reports nothing
and blocks nothing.

**False positives.** Variants that legitimately render identically on the axis under test, provided the
test asserts that equivalence deliberately rather than inheriting it; small golden files whose content
is a single reviewed value.

## NN:19 — The contract generator's hand-maintained sidecar makes freshly generated output wrong, and every consumer gate inherits it

**Statement.** A generated contract (route manifest, endpoint catalog, event schema registry) is
assembled from a machine-readable source of truth plus a hand-maintained sidecar list covering
resources created outside that source — secondary IaC states, escape-hatch resources, cross-stack
additions bolted onto a spec-managed surface. Adding a resource through the out-of-band path
requires a human to remember the sidecar; nothing diffs the sidecar against the system that
actually owns those resources. The generator then emits a complete-looking contract, and every
downstream gate — in every consumer repo that vendors it — validates confidently against a
contract that was wrong the moment it was generated. Consumers get legitimate calls flagged as
dead (blocking real work at the gate) or removed resources kept alive (greenlighting dead calls).
The defining property: this is invisible to snapshot-freshness checks, because regeneration is not
stale — the freshly generated output itself omits live resources. The sidecar usually carries its
own confession: a comment saying "when you add a route here, remember to add it there."

**Detect.** Open the generator and identify every emitted entry whose provenance is a literal
array or map in the generator source rather than the parsed source of truth. Diff the generated
output against the live control plane for that resource class (the deployed gateway's route table,
the broker's topic list, the registry's schema set — not the IaC files, which can themselves lag).
Each side's extras are findings. Then ask what performs this diff automatically: if the answer is
nothing, the sidecar drifts again after the hand-fix. An in-generator comment instructing humans to
keep the list current is the tell that no gate exists.

**False positives.** Resources deliberately excluded from the contract (internal-only,
deprecated-pending-delete) are not drift when the generator names them as explicit exclusions —
absence alone is never a documented exclusion. A sidecar that is itself generated from the owning
IaC state is a different (acceptable) architecture, provided that generation runs in the same
build as the primary parse.

## NN:20 — Remediation deploys and still fails, differently, at the same boundary — the finding closes on a landed diff and green gates because nothing re-reads the live signal that opened it

**Statement.** A control is found dead because its calls to an external service fail; the fix adds a
new branch that handles the previously-unhandled case and calls the SAME service to report the
outcome. The change is real, it deploys, and the original error class genuinely disappears. But the
new branch constructs its request slightly differently from the sibling branch that always worked — a
timestamp serialized as a string where the sibling passes a native date, a field omitted, an enum
spelled differently — and the service rejects it. The control remains exactly as dead as before,
failing at the same boundary with a different exception, and every observation the closure relied on
still reads as success: the diff shows correct-looking code, the suite passes because it stubs the
client and asserts the call was MADE rather than that the service accepted it, and the deploy
genuinely happened, so the "committed but not shipped" check that a mature process does run comes back
clean. This is strictly harder to catch than a fix that never deployed, because the usual
verification — confirm the change reached the running system — passes. The distinguishing feature is
that nobody re-read the live signal the finding was BORN from: the error rate, the evaluation count,
the delivery count. That number is unchanged, or worse, and it is the only artifact that would have
said so. The pattern concentrates in remediations of guardrails and reporting paths, where the
service's response is discarded by design and the caller's own success is decoupled from the outcome.

**Detect.** Close a finding against the metric that opened it, not against the code. For every
recently closed finding, identify the specific live observable that constituted the original
evidence — fault count on the function, accepted-evaluation count on the control, delivered count on
the channel — and re-query exactly that observable over a window that begins AFTER the deploy
timestamp; a value that did not move is the finding regardless of how correct the diff is. Where a
fix adds a call path beside an existing one to the same API, diff the two request constructions field
by field and check every value's TYPE against the API's contract, not just its presence — a client
that serializes without validating will send a string where the service demands an instant and report
success locally. Then check whether any test asserts the accepted shape rather than the call: a suite
whose fake records arguments and returns a canned success can never distinguish an accepted request
from a rejected one, and its greenness is not evidence.

**False positives.** Fixes whose observable is genuinely expected to lag the deploy (a scheduled
control that has not yet run its first cycle since shipping — re-verify after one full interval rather
than filing); metrics whose window still includes pre-fix data points; controls where the residual
error rate is a known, separately-tracked second defect that the closure explicitly named and scoped
out.

## NN:21 — Fence identity keys derived from invocation-relative context — the same finding matches or misses depending on how the tool was called

**Statement.** A baseline, suppression list, or dedupe fence keys its entries on an identity that
includes context relative to the invocation — a path relative to the scan target, a module-local
name, an id that embeds the working directory. The same underlying finding then produces different
keys depending on which directory the scanner was pointed at, so the fence match becomes an accident
of invocation shape: a per-module scan reopens findings a whole-tree scan froze (blocking lanes on
ancient backlog), while double-listed dual-form entries accumulate as operators paper over each
mismatch by adding the variant the error message showed them. The store's growing pollution is the
tell — entries that differ only in a path prefix are fossilized invocation histories, not findings.

**Detect.** Read the fence tool's key construction and ask which components vary with invocation
(scan root, cwd, module prefix). Scan the store for entry pairs identical except for a path prefix.
Run the tool against the same tree from two roots and diff the computed key sets — any difference is
the defect.

**False positives.** Stores whose consumers always invoke the tool from one pinned root enforced by
a wrapper (the instability exists but cannot express); keys intentionally scoped per-module with a
per-module store to match.

## NN:22 — Fence-store regeneration scoped narrower than the store — the update command silently discards the rest of the fence

**Statement.** The maintenance command that regenerates a baseline/suppression store accepts a scope
argument (a directory, a module, a subset) but writes the ENTIRE store from only that scope's scan.
Every entry outside the scope vanishes in the same write that adds the intended one. The next scan of
any other area then reports the whole frozen backlog as new regressions — or worse, the operator
re-runs the regenerate against that other area to "fix" it, destroying the first area's entries
instead, ping-ponging the store between partial views. The failure is invisible at update time
because the command reports success and the intended entry IS present.

**Detect.** Read the update path: does it merge into the existing store or replace it? If replace,
does it refuse scopes narrower than the store's domain? Diff store size before/after any regenerate
in history (version control makes the drops visible as large deletions in baseline files). A store
whose entry count sawtooths across commits was being ping-ponged.

**False positives.** Genuinely scope-partitioned stores (one file per module); update commands that
merge; replace-semantics commands hard-pinned to the store's full domain.
