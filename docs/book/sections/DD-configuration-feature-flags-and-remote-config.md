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

## DD:11 - Machine-readable resource contract describes one of several live key families, and the gate guarding it validates only the described subset

**Statement.** A central contract document declares each shared resource's key shape and attribute
set, consumers resolve identifiers through it, and a verifier enforces conformance — the pattern that
is supposed to make configuration speak the truth. The live store carries MORE than one key family,
and the contract declares only one, so every undeclared family is outside the contract and outside
the gate simultaneously. The attribute list drifts in both directions at once: names accumulate that
no reader reads, while the names readers actually consume are unregistered. Every gate stays green,
because the gate's scope IS the contract's scope — it re-asserts the declaration rather than
comparing the declaration to reality. The result is worse than having no contract: reviewers treat
the declared shape as verified truth for a store whose behaviour-critical majority nothing validates.

**Detect.** For each contract-registered resource, grep every key-builder and `Key:` literal across
the codebase and collect the DISTINCT (partition, sort) shapes actually used at runtime; compare
that set — not one example — to the contract's declared shape. Independently diff the declared
attribute list against the attribute names consumers actually project and read, in BOTH directions:
a declared attribute with zero readers and a read attribute with no declaration are equally
diagnostic and usually appear together. Then read the verifier itself and ask what input it compares
the contract against; if its only source of truth is the contract, it is structurally incapable of
detecting this class.

**False positives.** Contracts that intentionally declare only one family with a documented carve-out
naming the others and their owner; attribute lists deliberately kept a superset for a named,
scheduled forward migration; stores where the second family is genuinely ephemeral and has no
readers.

## DD:12 — Entry points migrate to the resource contract while the shared libraries they delegate to keep resolving the same identifiers from ambient defaults

**Statement.** An organization adopts a central contract as the single source of every resource
identifier — table and index names, role and account identifiers, parameter and secret paths — and
migrates its entry points to resolve through it. The reads and writes themselves, however, are
performed by shared library modules the entry points delegate to, and those modules were never
moved: each keeps a module-scope constant of the form "this environment variable, or else this
literal", so the identifier comes from ambient configuration with a hardcoded resource name behind
it. For any identifier the deployment never actually sets, the fallback is not a fallback at all —
it is the sole resolution path in production, and the contract's declared value is dead text that
reviewers nonetheless read as authoritative. The conformance verifier that certifies the migration
enumerates entry points, so the library plane sits outside its scope permanently and the migration
reports complete while the majority of live resource references bypass the contract entirely.
Renaming a resource in the contract then desynchronizes every library site silently, and an unset
variable yields a confident read against the wrong target instead of the fail-fast the contract's
design promised. Partially converted files are the diagnostic signature: one identifier rewritten
as a contract lookup, a comment recording that its fallback "is gone", and its untouched
neighbours two lines below.

**Detect.** Do not measure conformance at the entry points — that is the plane that was migrated.
Enumerate the first-party shared modules those entries import and grep them for the
ambient-lookup-with-literal-default form across every identifier class the contract claims to own,
taking care to separate contract-owned identifiers from genuinely deployment-scoped inputs
(region, log level, tunables) so the count means something. Classify each hit by whether the
deployment actually sets that variable: search the infrastructure definitions AND any per-unit
configuration files, because a variable set in neither means the literal is the live value today.
Read the conformance verifier and establish which directory roots it walks; a verifier whose roots
exclude the library tree cannot report this class no matter how long it has been green, and its
greenness is what sustains the belief that the migration finished. Compare each literal against the
contract's registered value in both directions — agreement is what makes the defect latent rather
than an active outage, disagreement is an outage already in flight. Treat any file mixing contract
lookups with ambient defaults as an interrupted migration and count the residue rather than the one
line that prompted the look.

**False positives.** Modules that execute outside the contract's delivery mechanism and carry a
documented, owner-named exemption; variables that are genuinely per-deployment inputs rather than
contract-owned identifiers; a defaulted literal the module immediately reconciles against the
contract and hard-fails on mismatch.

## DD:13 — The central contract registers whole classes of identifier that its client library exposes no accessor for, so those classes can only be resolved from the environment

**Statement.** A central resource contract is adopted and populated conscientiously: alongside the
data stores it also registers queues, buses, functions, workflows — the full estate. The client
library through which services read that contract, however, only ever grew accessors for the classes
that existed when it was written. The remaining sections are present in the document, validated by
its schema, and unreachable through any function the library exports. Consumers needing those
identifiers therefore have no contract-shaped option at all, and every one of them resolves from an
environment variable or a literal — not out of laziness, but because the API offers nothing else.
The result reads as a half-hearted adoption and is actually a missing method: the registry is
authoritative, the values are correct, and they are dead text, so renaming a queue updates the
contract and changes nothing about what the code targets. Two signatures identify it. First, the
contract's own sections are asymmetrically served — the ones with accessors are used everywhere and
the ones without appear in no consumer. Second, and decisively, a DIFFERENT runtime plane in the
same estate — a container or instance service with its own hand-rolled contract client — will often
have implemented exactly the missing accessors for exactly those sections, proving the data is
usable and the gap is confined to one library. Governance reviews miss it because they check whether
the contract is loaded and whether registered values are correct, and both answers are yes.

**Detect.** Enumerate the contract document's top-level sections, then enumerate the accessor
functions the client library actually exports, and diff the two sets; every section with no accessor
is a class of identifier the codebase structurally cannot resolve through the contract. Confirm the
consequence rather than assuming it: for each unserved section, grep consumers for the corresponding
identifiers and expect to find ambient lookups, with any literal-default form marking where an unset
variable is already the live value. Compare against sibling runtime planes — a second client
implementing the missing accessors converts this from a design question into a proven omission, and
its implementation is the specification for the fix. Check registry completeness in the same pass:
sections nobody can read tend to be under-populated, so count registered entries against the live
inventory before treating the data as trustworthy.

**False positives.** Sections that are deliberately provisioning-only metadata consumed by the
infrastructure pipeline rather than by runtime code; identifiers genuinely scoped to a deployment
rather than to the contract (region, log level, concurrency tunables); estates where a documented
adapter already resolves the section through a different, verified path.
