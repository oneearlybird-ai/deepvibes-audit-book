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

## NN:23 — The fence was generated in a cleaner environment than the one that enforces it, so the generator sees less than the gate will

**Statement.** A baseline/suppression fence is regenerated in one working tree and enforced in
another, and the analyzer's output is not a pure function of the source: it depends on environment
state the two trees do not share — an initialized dependency or module cache, a lockfile, generated
clients, a populated build directory. The regeneration therefore under-collects. Every finding the
enforcement environment can resolve but the generation environment could not is missing from the
fence, so the next gate run in the real environment reports a pile of "new" findings that are in
fact the same frozen backlog, and the lane blocks on work nobody introduced. The failure is
especially easy to walk into where the enforcement environment is a long-lived checkout that has run
builds (and is therefore rich in caches) while regeneration happens in a fresh clone or an isolated
agent workspace, which is exactly the setup that makes clean regeneration attractive. The inverse is
equally possible and worse: generate in the rich environment, enforce in the clean one, and the fence
carries entries that never match, hiding a rule that stopped firing.

**Detect.** Determine whether the analyzer's findings depend on environment state by running it on
the identical source in two trees — one freshly cloned, one that has run a build/init — and diffing
the counts; any difference means the fence is environment-coupled. Then check where regeneration
actually happens versus where the gate runs (CI container vs developer checkout vs isolated agent
worktree). Prefer a regeneration path that refuses to run in an environment that cannot see what the
gate sees, and that unions across every scope the gate is invoked with rather than trusting one
broad scan to be a superset.

**False positives.** Analyzers whose output is provably source-only (pure AST or text rules with no
dependency resolution); pipelines that regenerate and enforce in the same ephemeral image; fences
keyed on something coarser than the environment-sensitive detail.

## NN:24 — A machine-written artifact has a canonical serializer but no gate asserting it, so every hand-edit reformats the whole file and buries the real change

**Statement.** A long-lived structured artifact — a ledger, a lockfile, a generated manifest, a
baseline — is written by one tool with a fixed serializer, and is also edited by ad-hoc scripts and
by hand. Nothing asserts the canonical form. An editor that re-serializes with a different
indent, key order, or line ending rewrites every line, and the commit that carries a three-line
semantic change arrives as a whole-file diff. The harm is not cosmetic: review of that commit
becomes impossible, so the one change that mattered ships unreviewed, and a genuine
loss — a dropped entry, a silently reverted status — is indistinguishable from reformatting noise.
The failure recurs and alternates, because each side's writer "fixes" the format back, and each
correction is itself another whole-file commit. Reviewers learn to skip diffs on that file, which is
the durable damage.

**Detect.** Identify the artifact's authoritative writer and read its exact serialization call, then
assert byte-identity against it in whatever gate the workflow already passes through — a validator,
a pre-commit hook, a CI check. Byte-identity, not a formatter run: a formatter is a second writer
with its own opinion and reintroduces the problem. Historical evidence is easy to find and worth
gathering: search the artifact's log for commits whose line count approximates the file's length,
and read their messages — a commit that exists only to restore formatting proves the gate is absent
and dates the first occurrence.

**False positives.** Artifacts deliberately maintained by hand where the tool is the secondary
writer (invert the assertion, do not add it); one-time intentional reformats that are isolated in
their own commit and stated as such; files whose churn is genuine because the generator's output
legitimately depends on inputs that changed.

## NN:25 — Gate assertion anchored by content match rather than definition site, so it binds to a coincidental duplicate and goes blind when that duplicate is deleted

**Statement.** A verifier asserts that some construct has a property by searching a file's text for a
literal the construct would produce. The assertion passes and is read, by its own name and failure
message, as proof about the named subject. But a content match binds to whatever text happens to
match — not to the subject. If the same literal also appears in a sibling module, a deprecated
builder, a fixture, or a generated copy, the gate may have been reading that all along; and if the
intended subject never carried the literal at all, the gate has been green while never once checking
it. The defect is undetectable while both copies exist. It surfaces when the coincidental match is
deleted — typically by a retirement change with no relationship to the gate's subject — at which
point the gate goes red in unrelated work, and the obvious repair (re-point the search at another
file that still contains the literal) reproduces the same defect one file over. Throughout, the
gate's name keeps asserting the subject, so review sees a named check beside a stated contract and
infers the contract is enforced.

**Detect.** For each contains/grep assertion, ask which file the asserted property actually LIVES in
and compare it against the file the assertion reads; a mismatch is the finding whether the gate is
currently red or green. Search the whole repository for every occurrence of the matched literal —
more than one occurrence means the binding is ambiguous by construction. Prove the binding by
mutation: rename or delete the intended subject and confirm the gate goes red; if it stays green it
was never bound to it. Prefer assertions anchored to the definition itself — the declaration line,
the exported symbol, the full function signature — over ones anchored to a value the definition
merely emits.

**False positives.** Assertions deliberately checking a literal is ABSENT everywhere, where matching
anywhere is the point; gates whose genuine subject is the rendered text of a generated artifact;
searches over a file that is by construction the single definition site, where duplication is itself
prevented by another gate.

## NN:26 — The fail-closed gate has no resolution path for the legitimate first-occurrence case, so it is a permanent block rather than a conditional one — and its documented override cannot clear it

**Statement.** A safety gate that refuses on uncertainty is the correct posture, and its correctness
depends entirely on that uncertainty being resolvable. The failure mode is a gate whose unknown
branch is reachable by a case that can never become known: a guard that diffs a live resource
against a planned one cannot resolve either side when the resource is born in the same change,
because the locator it needs (a URL, an id, an ARN) is itself computed by that change. The gate then
blocks every first instance of a legitimate pattern — the first queue with a policy, the first
bucket with a policy — permanently, since re-running produces the same unknowns. The escape hatch
does not help: an acknowledgement token exists to confirm a reviewed diff, and there is no diff to
review, so the documented override is structurally incapable of clearing the block. The team's
options collapse to disabling the gate or applying around it, both of which delete the protection
for every future change and not just this one. The gate's own specification usually already states
the correct answer — a resource that does not exist has an empty live set — which is what makes this
a defect rather than a design trade-off.

**Detect.** For every fail-closed gate, enumerate its unknown branches and ask of each: what action
makes this known? If the answer requires information that only exists after the very apply the gate
is blocking, the branch is a permanent block. Test the gate against a plan that creates a resource
and its dependent policy together, not only against plans that modify existing ones — the
first-occurrence case is the one real plans hit and self-tests usually omit. Confirm the override can
actually clear each blocking branch by exercising it; an override that requires a reviewed diff is
inert wherever the block is caused by the absence of one. When resolving the unknown, resolve it
narrowly: derive the identity from the plan's own references, require a pure create, require a
statically known name, and keep every unresolvable shape fail-closed — a blanket pass reopens the
adoption-clobber hazard the gate was built for, since create calls against many services silently
adopt an existing same-name resource.

**False positives.** Gates deliberately blocking a case that genuinely requires human sign-off, where
the override is a person and not a token; unknowns that a documented two-phase apply resolves;
bootstrap-only blocks that a one-time seeded state clears; and gates whose specification really does
treat the first occurrence as dangerous, which should be read before assuming the block is
unintended.

## NN:27 — The gate's file walker is scoped to one language's extensions in a polyglot repository, so a two-sided rule is enforced on the language-agnostic side globally and on the code side only where the walker happens to look

**Statement.** A static gate enforces a rule with two halves — the infrastructure half ("no
configuration may wire this class of name") and the code half ("no source may read this class of
name"). The infrastructure half is matched against a declarative format the walker recognises
everywhere, so it is enforced across the whole tree. The code half is matched by a walker whose
extension filter names only the repository's majority language. Every source file in a minority
language is therefore invisible: it can violate the code half indefinitely and the gate reports
clean. The consequence is worse than an unenforced rule, because the gate does not merely miss the
violation — it actively certifies the removal of the wiring that the unscanned consumer depended on,
and the anti-vacuity floor the gate prints ("N reads and M keys checked") reads as coverage while
counting only the scanned language. The blind spot is invisible in review precisely because the
minority-language file count is small; a single unscanned file is easy to believe does not exist.

**Detect.** Read the walker, not the gate's description: find the extension regex or suffix test and
list the extensions it admits. Then enumerate the actual source extensions present under every root
the gate claims to cover (`find <root> -type f | sed 's/.*\.//' | sort -u` is enough) and diff the
two lists. Any extension present in the tree and absent from the walker is the finding, and its
severity is set by whether the gate's rule has a second half that IS enforced everywhere — an
asymmetric two-sided rule is the dangerous case. Confirm by pointing the excluded file at the rule by
hand: if it violates, the gate has been green on a live violation.

**False positives.** Walkers whose narrow filter is correct because the rule is genuinely
language-specific (a rule about a JavaScript module system has no meaning in a shell script); trees
where the excluded extensions are only fixtures, vendored dependencies, or generated output already
excluded by policy; and gates that pair the narrow walker with a separate, declared gate covering the
other languages.

## NN:28 — A gate's exception list has no staleness tripwire, so the excepted defect outlives every reason for excepting it

**Statement.** A gate bans a pattern but allowlists the existing occurrences — "legitimate for now,"
a pending rename, a migration window. Nothing watches the exception itself: when the excepted
occurrences are renamed, deleted, or their sanctioning decision expires, the list neither shrinks
nor complains. From that day the allowlist is load-bearing documentation that the banned thing is
acceptable — new occurrences are written to match the excepted spelling, reviewers read the list as
precedent, and the original rationale is unrecoverable from the list alone. The strong form is a
SELF-EXPIRING exception: the gate also asserts that each exception still matches something, and
FAILS the lane the moment it does not — "this deferral is stale; the rename happened; delete this
block" — so the scaffolding is mechanically forced out the moment the debt it tracked is paid. An
exception nobody is ever forced to remove is a deleted rule wearing a comment.

**Detect.** For every allowlist, skip-list, or deferral inside a gate, ask two questions: does any
check FAIL when an entry stops matching anything, and does each entry carry its reason and intended
end-state? A list failing both is the finding, independent of whether its entries are currently
valid. The repair is the tripwire plus a dated reason per entry.

**False positives.** Permanent, semantically-justified exceptions — a vendor API's own name, an
enforcement pattern that must literally name what it bans — which should be commented as permanent
rather than left indistinguishable from forgotten debt; and exception lists in report-only tools
that gate nothing.

## NN:29 — The e2e harness authenticates against the production auth plane and never revokes, so real credentials accumulate in the live credential store

**Statement.** An authed e2e lane signs in through the real login flow — correct, that is the path
worth testing — and persists browser state for the specs, but defines no teardown: the minted
session or token, a REAL credential carrying the test account's full grants and the platform's
normal multi-week lifetime, is simply abandoned, still valid. Every CI run adds one more. The live
credential store fills with dozens to hundreds of unexpired credentials belonging to a handful of
test principals, frequently holding elevated fixture grants (admin-view), each one a theft target
and none attributable to a person. Second-order damage follows: session-count anomaly signals are
numbed for exactly the accounts least monitored, per-account session lists become unusable, and
capacity or TTL assumptions in the session store quietly skew.

**Detect.** Find the authed e2e bootstrap (storage-state capture, login fixtures). Check for a
teardown that spends the minted credential on the product's real logout/revoke endpoint. Then
measure live, which proves the finding independent of code reading: count unexpired credentials in
the production store belonging to test principals and compare against the harness's run cadence —
dozens of live rows for one test account is the leak made visible. Note the grant level those rows
carry; cached elevated grants raise severity.

**False positives.** Harnesses running against ephemeral per-run environments destroyed with the
run; bootstraps minting deliberately short-TTL credentials (minutes) where accumulation
self-clears; a missing teardown compensated by a scheduled reaper provably scoped to test
principals — verify the reaper runs and matches, not that it merely exists.

## NN:30 — Every implementation of a plug-in contract is tested only against its own shape

**Statement.** A registry dispatches N interchangeable implementations — providers, adapters,
drivers — through a shared set of call sites. Each implementation ships its own test file, which
constructs it and calls it the way that implementation happens to be written. Nothing drives every
registration through the REAL call-site shapes, so implementations fork the contract one argument at
a time: a factory that takes different parameters, a stream that returns a different type, a
discovery that returns an object where the caller iterates an array. Every suite is green and a
large fraction of the fleet is broken at the seam. The failure only appears when that implementation
is actually exercised in production, and it appears as a different error for each one.

**Detect.** Count the registrations and count the tests that invoke them THROUGH the dispatcher; if
the second number is zero the contract is unenforced regardless of coverage. Write one conformance
test that iterates the registry and drives every entry through each real call site, then read which
entries fail — that number is the finding. Check the call sites too: an argument the dispatcher
never passes is a fork on the caller's side.

**False positives.** Registries with a single implementation; contracts enforced by a type system at
the dispatch boundary with no dynamic registration.

## NN:31 — A cross-repo gate resolves its reference checkout by relative traversal

**Statement.** A gate in one repository validates against a generated artifact that lives in another
repository, and it locates that sibling by walking up a fixed number of parent directories. The
assumption holds only in the layout the author had. In any multi-checkout arrangement — private
worker clones, nested workspaces, vendored copies — the traversal lands on an arbitrary peer whose
contents are at an unrelated revision, and the gate grades against it with full confidence. The
symptom is inverted: correct work fails the gate because the peer is behind, so the pressure is to
weaken or bypass the control.

**Detect.** Read how the gate resolves the sibling path and ask what else could occupy that
position. The reference must be chosen by identity — the canonical checkout an explicit sync keeps
on the mainline, the topmost match, a configured path — not by distance. Confirm the gate still
emits a loud unverified verdict when no reference is found, rather than silently passing.

**False positives.** Monorepos where the relative position is structurally guaranteed; gates that
resolve by an explicit configured path already.

## NN:32 — A complete parallel implementation carries a passing suite while no call path reaches it

**Statement.** A second implementation of a subsystem exists in full — its own writers, resolvers,
helpers — with a comprehensive and green test suite, and nothing in the product invokes it. The
tests make it look load-bearing: coverage counts it, refactors maintain it, reviewers read its
assertions as evidence the behavior is exercised. It drifts from the live path it shadows, and the
next person to touch the area cannot tell which of the two is real. The green suite is certifying
code the product never runs.

**Detect.** For each module, trace inbound references from an entry point, not from the test file —
a module whose only importer is its own test is unwired. Compare the two implementations' behavior
where they overlap and note the drift; then delete the unreachable one in the same change rather
than documenting it.

**False positives.** Libraries published for external consumers; deliberately staged code behind a
flag with a dated cutover and an owner.

## NN:33 — The comment-stripper removes block comments before line comments, so one line comment swallows the file

**Statement.** A static gate strips comments before asserting that a pattern is absent from (or
present in) source. The stripper runs the block-comment pass first. Any line comment containing the
block-open sequence — a commented-out glob, a URL, a regex — opens a block the pass then closes
hundreds of lines later, deleting everything between. The gate now reads a truncated file: absence
checks pass vacuously and presence checks report a live construct as missing. The gate is green and
blind, and the failure is invisible to review because the file on disk is correct.

**Detect.** Strip line comments FIRST, then block comments, and pin the order with a test whose
fixture contains a line comment holding a block-open sequence. Any absence check that reads
comment-stripped source needs a negative test proving it fails on a planted violation — a gate that
never goes red on purpose has never been shown to work.

**False positives.** Real tokenizer-based strippers that track string and comment state properly.

## NN:34 — Coverage judged after de-duplicating records by display name

**Statement.** A verifier walks a set of platform records and reports whether each is configured.
The records are keyed into a map by their human name, so several generations of the same-named
record collapse into one entry — and the survivor is whichever the listing ordered last. The
verifier then inspects that single instance, finds it correct, and reports complete coverage while
the instances actually attached to the running system are unconfigured. The check is not just weak;
it reliably inspects the wrong object.

**Detect.** Judge coverage per RECORD identity, never per name, and report the count of records
examined alongside the verdict. Where several generations exist, assert on the ones the live
attachment points reference. A verifier that cannot say how many objects it checked cannot be
trusted to have checked yours.

**False positives.** Namespaces where the name is the platform's real primary key.

## NN:35 — The verifier's evidence parser discards every line it cannot parse, so an upstream format change empties the evidence set and the check renders a confident verdict about a world it never observed

**Statement.** A canary, probe, or gate proves something happened by reading a stream of evidence —
log lines, event records, exported rows — and parsing each item before matching it. The parse is
wrapped in a swallow: parse failure means skip this item and continue. That is correct for genuinely
foreign lines and catastrophic for a format change, because a change that affects EVERY item (a
process manager prefixing each line with a timestamp, a new envelope, a switched serializer) makes
the parser skip everything and leaves the matcher with an empty set. The verifier then reports the
absence it was built to detect. Whether that reads as a false failure or a false pass depends only
on which way the assertion points: an assert-present check goes red and gets debugged as a real
outage, an assert-absent check goes green and certifies silence as safety. In both directions the
verdict is about the parser, not the system, and nothing in the output distinguishes "observed
nothing" from "could not observe".

**Detect.** For every evidence parser in a verifier, ask what happens when NO item parses, and make
that state distinct from a genuine empty result: count parsed versus skipped items and fail on a
skip ratio at or near one, whatever the assertion concludes. Feed the parser one real captured line
from the producer as a fixture, so a producer-side envelope change breaks the fixture rather than
the verdict. Check the producer's actual output format at the point the verifier reads it (through
the process manager, the log driver, the exporter) rather than at the point the application writes
it — the wrapper is where the prefix is added.

**False positives.** Parsers over deliberately mixed streams where non-matching lines are the
majority by design AND a positive floor is asserted elsewhere; verifiers that already report parsed
and skipped counts and gate on them.

## NN:36 — The ingestion step deduplicates incoming records against existing ones on a key coarser than the record's identity, so a distinct record is discarded as a duplicate and the run reports a success count

**Statement.** A pipeline folds newly produced records — findings, alerts, tickets, inventory rows —
into a durable store, and suppresses re-submissions by matching each incoming record against the
existing ones on a composed key. The key is chosen for the common case (same category, same file,
same subject) and is coarser than what actually distinguishes two records: two different defects in
one file under one category, two occurrences at different sites, two events on one entity. Every
collision after the first is dropped. Nothing errors, and the summary reports how many records
merged plus a count of duplicates skipped — a shape that reads as housekeeping — so the operator who
produced ten records and sees eight merged has no reason to look. Two aggravating variants recur:
the ordering that decides which record survives is incidental (alphabetical file name, listing
order), so the survivor may be the least important of the set; and records in a terminal state are
added to the live-match index alongside active ones, letting a record that is already resolved
suppress a new, unresolved one submitted in the same batch.

**Detect.** State the record's identity explicitly and compare it against the dedupe key field by
field; any identity component missing from the key is a collision class, so construct the two
records that collide and confirm the second is dropped. Require the summary to NAME every suppressed
record and what it matched, never to count them — a count cannot be audited, a list can. Check that
only records in an active state populate the match index, and that entries added during the current
run cannot suppress later ones in that same run unless they are active. Where the coarse key is
genuinely wanted as a near-duplicate hint, keep it as a warning path that still ingests, rather than
as the skip condition.

**False positives.** Keys that are the record's true primary key by construction (a content hash, a
supplied idempotency token); pipelines where suppressed records are written to a reject store the
operator is required to review, and the review step is enforced rather than described.

## NN:37 — A gate treats "the check could not run" and "the check found nothing to object to" as the same empty value, reproducing inside the gate the manufactured-absence it was built to catch

**Statement.** A gate compares the thing being shipped against an external reference — the previously
published artifact, a baseline store, a registry, the deployed version — and passes when the
comparison shows no problem. Two very different conditions both yield "no problem": the reference
legitimately does not exist yet (a first publish, a new key, an empty baseline), and the reference
could not be consulted at all (the store is unreachable, credentials expired, the endpoint is down,
a network partition). Where the lookup is written to return one empty value for both — an empty
string, a null, a swallowed error — the gate cannot distinguish them and takes the pass branch for
both. The result is a gate that is strongest when nothing is wrong and silently absent exactly when
infrastructure is degraded, which is when bad artifacts are most likely to be produced. This is the
same manufactured-absence shape the gate usually exists to catch — a build step that returns success
while having produced less than it should — reproduced one layer up, inside the checker. The
diagnostic subtlety that makes it durable is that the obvious separator often does not work:
point-lookup APIs frequently return byte-identical error text for "this key is missing" and "this
entire container does not exist," so a stderr or message-string parse is a false premise that passes
its own review and fails silently in production. The separation has to be structural — an API shape
where absence is a success with an empty result set and unreachability is a non-zero exit — not
textual.

**Detect.** For every gate that compares against an external reference, read the lookup helper and
enumerate the distinct conditions that produce its "nothing to compare" value; if unreachable and
absent collapse to one value, that is the finding regardless of how well the comparison itself is
written. Prove the separation empirically with three controls rather than by reading the code: a
real reference (expect a value), a missing reference in a reachable container (expect the absent
branch), and an unreachable container or revoked credential (expect the could-not-run branch) —
and require that the third produces different output from the second. Where the implementation
separates them by matching error text, treat that as unproven until the two error strings are
captured side by side; identical text is common and dispositive. Require the could-not-run branch to
say so in the build output in terms an operator cannot read as a pass; whether it also fails the
build is a defensible design choice, but invisibility is not. Finally, check the threshold's
provenance: a comparison constant with no recorded measurement beside it is the sibling defect, since
nobody can later tell whether it was derived or guessed, and an indefensible constant is the usual
reason a gate is eventually switched off.

**False positives.** Gates that are explicitly advisory and documented as best-effort, where the
authoritative check runs elsewhere and is not subject to the same lookup — verify the authoritative
one actually exists. Lookups against a store colocated with the build such that unreachability is
already fatal earlier in the run for an unrelated reason. First-run bootstrap paths whose reference
is guaranteed absent by construction and whose pass is therefore unconditional by design. Checks
whose reference is a local file whose absence and unreadability are already distinguished by the
filesystem API.

## NN:38 — Every test double satisfies the authorization layer unconditionally, so an entire class of least-privilege defects is structurally invisible to the whole unit suite and can only be discovered in production

**Statement.** A codebase with a dependency-injection seam replaces its data-store and service
clients with in-memory doubles for testing. Those doubles implement the *functional* contract — get,
put, query, the shapes that come back — and none of them implement the *authorization* contract,
because authorization is enforced by the platform on the real client, not by the interface being
faked. Every call a handler makes against a double therefore succeeds by construction. The
consequence is not that a few tests are weak; it is that a whole defect class has no possible
detection in the unit suite. A handler that reads a table outside its credential profile's fence, a
worker that writes a key its role does not cover, a code path that assumes an action its
session-scoped policy never granted — each is green locally, green in CI, and denied at runtime on
first real invocation. The failure surfaces as a runtime denial, usually a 500 behind whatever
fail-closed copy the caller renders, on the exact code path the tests exercised most confidently.
The trap for reviewers is that the suite's coverage of the path is genuinely high, which reads as
assurance and is why the gap survives review: the tests prove the logic and are silent about the
permission, and nothing in the report distinguishes the two. Teams usually learn this once per
profile and leave a comment beside the fix rather than a check, so the second occurrence lands in a
different handler months later and is diagnosed from scratch.

**Detect.** Ask, for each faked boundary, what the real client enforces that the double does not —
authorization is the usual answer and is rarely written down. Then close the gap statically rather
than hoping a test catches it: build a check that extracts every resource-and-action pair the
handler code actually issues (tracing through shared helpers, since the helper's method is the truth
and not the call site) and diffs that set against the grants declared in the credential profile or
role that path runs under, failing on any action issued but not granted. Treat the existence of a
prior fix-with-a-comment in a profile as a marker that the profile has this shape and that its other
handlers are unaudited. Where such a static check cannot be built, require at least one integration
test per profile that runs against real credentials with the real fence in place, and confirm it is
wired into a lane that actually runs — an unwired verifier never runs, and a permission test that
executes against doubles is worse than none because it manufactures the assurance it cannot provide.
Search runtime logs for the credential service's denial wording; a single occurrence proves the
class is live in this codebase.

**False positives.** Codebases where the real client is exercised against a local emulator that does
enforce policy evaluation, verified by making an unauthorized call and observing the denial.
Handlers running under a single broad role with no per-path fence, where the class does not exist —
though that is usually its own finding. Doubles for boundaries that carry no authorization at all
(pure computation, formatting, local caches). Paths already covered by an equivalent static
grant-versus-usage check, provided that check traces call paths rather than grepping for action
names.

## NN:39 — The committed generated artifact and the source it regenerates from drift in both directions, while the only gate compares supersets and can therefore see just one of them

**Statement.** A contract artifact — an API document, a client schema, a route table — is produced
by a generator from a separate, human-edited source file, and both the source and the generated
output are committed. Editors then touch whichever of the pair is closer to hand: a new route is
added to the generated document without its source block, or a retirement removes the source block
while the generated document keeps the route. Neither edit fails anything at the time, because the
generator is not run on every change. The pair now holds two opposite kinds of staleness with
opposite consequences, and the distinction is what makes this durable: an entry present in the
generated output but absent from the source will be DELETED the next time anyone regenerates, and an
entry absent from the output but present in the source will be RESURRECTED. Whichever gate exists
usually checks only that the deployed or generated surface is a superset of some baseline, which
catches disappearances and is structurally blind to resurrections — so one of the two shapes passes
review, passes CI, and lands. The third shape is quieter still: the same entry set on both sides
with hand-edited content differing inside an entry, which no set-comparison notices at all. The
failure lands on whoever next runs the generator, typically during unrelated work, and presents as
their change having deleted or revived routes they never touched.

**Detect.** Do not compare the artifact against a baseline; compare it against itself. Run the REAL
generator against a copy of the committed source and require the committed artifact to be
byte-identical to the output, normalizing only line endings — a second reimplementation of the
generator inside the checker is itself a drift source and must not be written. Diagnose the three
shapes by name in the failure text, since the remedy differs: entry in output without a source block
(regeneration would delete it), source block surviving a retirement (regeneration would resurrect
it), and identical entry sets with differing content (hand-edited integration, authorizer, or CORS
drift). Wire the check into the earliest lane that fronts every land rather than only the slow
certification lane, and make it fail closed when its interpreter or toolchain is unavailable — a
silent skip is the status quo the gate exists to end. Add a parse-collapse floor so that a generator
run producing implausibly few entries is treated as a failure rather than as a fresh artifact.
Finally, check for a second, live-drift half: the deployed surface can hold entries neither file
does, and where the deployment mode never deletes, those require their own shrinking baseline.

**False positives.** Generated artifacts produced deterministically in CI and never committed, where
the pair cannot drift. Sources whose generator is genuinely run by a pre-commit hook already proven
to execute on every path. Intentional, documented divergences carried in an explicit exception list
with a staleness tripwire. Formatting-only differences on a pair where the committed artifact is
deliberately prettified and the comparison is normalized for it.

## NN:40 — The drift gate proves the token exists as text somewhere in the component, not that it is emitted at the site the detector watches

**Statement.** A detector is configured from a hand-kept vocabulary — log-message tokens for a metric
filter, event names for an alarm, error codes for a routing rule — and a static gate guards it
against rename drift by asserting each configured token still appears in the component's source. The
assertion is a substring test over the concatenated source text. That proves the string survives
SOMEWHERE, not that it survives at the *emitting* site the detector observes: a token that has moved
into a response body, a comment, a constant table, a test fixture, or a differently-levelled log line
still satisfies the gate while the filter it configures can no longer match anything. The gate is
strongest exactly where the drift is cheapest — a refactor that keeps the identifier but changes
where it is written — so the detector's death and the gate's approval have the same cause.

**Detect.** Read the gate's matcher, not its output: a bare `source.includes(token)` (or an unanchored
regex over the whole file) is the finding. Then measure the gap: for every configured token, test
whether its occurrences intersect the emitting construct the detector actually reads (inside a
`console.*`/logger call for a log-message filter, at the level the filter demands, on the stream the
filter is attached to). A population of tokens present in source but absent from any emitting site is
the live evidence — triage it before tightening, because helper-based logging produces legitimate
members. Prefer a gate that binds to the emission site (or to a single exported vocabulary the
emitter and the detector both import) over one that scans text.

**False positives.** Codebases that log through a wrapper or a structured-logging helper, where the
token legitimately appears only as an argument or a map key — the emission is real, the naive
proximity test just cannot see it. Tokens deliberately registered ahead of the code that will emit
them, carried in an explicit pending list with a staleness tripwire. Vocabularies shared by several
emitters where the gate checks the union on purpose.

## NN:41 — A coverage gate's authority-side parser silently degrades unreadable policy data to "unrestricted", so every subject passes while the subject-side metrics look healthy

**Statement.** A verification gate diffs subjects (calls, permissions used, versions, routes)
against an authority (policies granted, manifests, contracts). The subject side is instrumented —
counts, floors, known-good controls — but the authority side is parsed with a shape assumption
(object vs serialized string, list vs map, field name) that the producing API does not actually
meet. The parser does not throw; it reads "no restrictions found" and the gate's semantics map
absence of restriction to unlimited allowance. Every subject is now covered by construction. The
gate's own health metrics stay green — hundreds of subjects analyzed, controls found — because the
controls assert only that subjects were SEEN and PASSED, which a vacuously-permissive authority
side satisfies perfectly. This is the dual of the zero-subjects vacuous gate: there, nothing is
checked; here, everything is checked against nothing.

**Detect.** For any gate that compares usage against grants: find where the authority data is
parsed and ask what the code does when the shape is wrong — a `?.` chain or type-mismatched field
access that yields undefined and falls through to a permissive default is the defect. Prove it
live: hand the gate one subject that must fail (a tamper probe using an authority entry that
verifiably does not grant it) and require exit-nonzero before trusting any green run. Require the
gate to carry an authority-side floor (at least N subjects resolved to a BOUNDED authority) and a
known-good control asserting a specific subject is covered BY A BOUNDED entry, not merely covered.

**False positives.** Authorities where absence-of-policy genuinely means unrestricted BY DESIGN
(a null session policy meaning role-wide access) — but then the bounded/unbounded split must be
explicit in the gate's model and the unbounded population must be reported, not silently folded
into "covered".

## NN:42 — A freshness or deploy-lag monitor derives its subject inventory from source-file presence rather than from each unit's own state anchor, so a unit that owns no state is tracked forever as maximally stale

**Statement.** A monitor answers "how long since each deployable unit was last deployed" by
walking the tree, treating every directory that contains source of the right kind as a unit, and
comparing each one's recorded last-deploy timestamp against now. Real trees contain directories
that look like units but are not: shared module containers instantiated by a parent, libraries
consumed by other units, scaffolding left by a restructure. These have no state anchor of their
own — nothing can be deployed *to* them directly, so nothing can ever advance their timestamp.
The monitor reports them as maximally lagged on every run, permanently. The cost is not the
wrong number; it is that the monitor now has a finding that no action can clear, so operators
learn that this check has a standing exception, and the next genuine lag is read as the same
known-noise entry. Where the monitor gates a lane, the exception is worked around by a
suppression list, which then has to be maintained against a tree that keeps changing. The tell
that distinguishes it from a genuinely undeployed unit: the "last deploy" date is not merely old
but frozen at an era boundary — a restructure, an import, the day the inventory was first built.

**Detect.** For each unit the monitor enumerates, require the presence of the artifact that makes
it independently deployable — its own state/backend declaration, its own pipeline entry, its own
release target — and derive the inventory from that artifact rather than from source-file
presence. Then check the monitor's own output for entries whose lag never decreases across
consecutive runs: that set is either this defect or a real, unattended unit, and the two are
distinguished by whether a deploy of that unit is even expressible. Suppression lists are a
symptom; read each entry and ask why it was added.

**False positives.** Units that genuinely are deployable and genuinely have not been deployed —
the lag is true and the monitor is right; units deployed through a mechanism the monitor does not
know about, where the fix is to teach it that mechanism rather than to drop the unit.

## NN:43 — A record store has one validated write path and one unvalidated one, and its validator is a manual step no gate runs, so the unvalidated path fills the store with records the validator would reject

**Statement.** A structured record store — an audit ledger, a findings database, a compliance register, a decision log — is created through a tool that validates every record before writing, which is where the schema's authority is demonstrated and where reviewers form their confidence. But records are also MUTATED through a second path: status transitions, closures, appended history, corrections, all performed by editing the store directly because the creating tool has no verb for them. That second path shares the schema and shares none of the enforcement. The store's validator exists and is correct, but it is a manually-invoked command named in a process document rather than a gate wired to commit, push, or CI, so it runs only when someone remembers — and the people most likely to remember are the ones editing carefully anyway. The failure is silent and compounding: each edit-path write is individually plausible and locally consistent, so the divergence is a shape drift rather than a visible error — a different key set for the same concept, an enum value the writer found more truthful than any the schema offers. Nothing surfaces it until someone runs the validator, at which point the backlog is large enough that repairing it looks like a project and gets deferred again, and the validator's red output becomes normal. The compounding term is that independent sessions converge on the SAME divergent shape by copying the last record they read, so the invalid population grows faster than the valid one, and the schema quietly becomes a description of history rather than a constraint on the present.

**Detect.** Enumerate every writer of the store, not just the one the documentation describes, and for each ask whether validation is on its path or beside it — a validator invoked as a separate documented command is beside it. Run the validator yourself on the current store before trusting any record in it, and bucket the failures by which writer produced them: failures clustered in recently-mutated records with a common alternative key set identify the unvalidated path precisely. Compare a record's creation-time fields against its mutation-time fields; the same concept expressed two ways within one record (a timestamp under two names, a status expressed both as a field and as an event) is the signature. Check the store's own version history for the last commit where the validator passed, and count how many records were written after it — that count, not the error count, is the real exposure. Finally, treat enum violations and shape divergences differently on repair: a value stronger or more specific than any the enum offers is evidence the schema is too narrow, and rewriting it to fit falsifies the record, while a divergent key set for an existing concept is a genuine drift to normalize.

**False positives.** Stores whose validator genuinely is wired into a gate that ran and passed, where the invalid records predate the gate and are knowingly grandfathered with that decision recorded; append-only stores with exactly one writer, where no second path exists; deliberate schema evolution in which older records are expected to fail the current validator and the validator is versioned to skip them; and staging or scratch copies of the store that are not the authority and were never meant to validate.

## NN:44 — The gate hand-lists the values it expects instead of deriving them from the source of truth, so it is a second store that drifts and can be green while the claim it protects is false

**Statement.** A published surface makes a checkable claim about its own provenance — each entry names
the change it shipped in, each record cites its origin, each document states the version it was built
from — and a test is written to protect that claim. Instead of deriving the expectation from the
authoritative source, the test transcribes it: a literal array of filenames and identifiers, copied by
hand at the moment it was written. From that moment there are two stores of the same fact and only one
of them is maintained, so the test's list is stale as soon as the real set changes, which is
immediately. The failure mode is not that the test breaks — it is that the test verifies a set that
never existed, passing or failing on names unrelated to the live surface, while the claim it was
written to protect goes unchecked in production. The tell is transcription itself: placeholder-shaped
identifiers among the literals, entries whose names match nothing in the tree, a comment describing the
list as a snapshot of a range. A companion artifact often exists alongside it — a console script that
proved the original diagnosis and was kept — which cannot fail a build and therefore guards nothing
after the day it was written.

**Detect.** For any test asserting a set of real artifacts, ask where the expected set comes from: read
from disk and cross-referenced against the authoritative record is a gate; a literal in the test file
is a second store. Verify the literals resolve — every name should exist and every identifier should
match a real one — because a list that has drifted usually contains at least one entry that never
existed. Rewrite as a derivation: enumerate the artifacts from the tree, load the expectations from the
one authoritative source, and assert the relation between them. The derived form must import the
production parser rather than inline a copy of it, or the same drift reappears one level down. Locate
the authoritative source by a property that identifies it (a marker it must contain), not by a fixed
relative path, because the same suite runs from more than one working root and a path that resolves in
only one of them will skip the check silently in the other.

**False positives.** Small, deliberately frozen fixtures that pin a historical format and are supposed
never to change. Golden files reviewed as part of every change, where the diff IS the review. Lists
whose whole purpose is to be a hand-curated allowlist with no upstream source to derive from — though
those still owe a check that every listed entry resolves.
