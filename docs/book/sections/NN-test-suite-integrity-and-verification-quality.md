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
