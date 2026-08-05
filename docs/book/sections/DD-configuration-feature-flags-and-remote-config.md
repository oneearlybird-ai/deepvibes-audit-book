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

## DD:14 — Compatibility floor declared in the config document but read from the environment, with no step propagating one into the other

**Statement.** A client of a versioned remote configuration implements a compatibility gate: it
refuses to start if the served document is older than the minimum version its code requires. The
floor is parameterised rather than hardcoded — read from an environment variable with a permissive
default so it can be raised per consumer — and the config document itself dutifully records the
required floor for every consumer, so the registry reads as though the mechanism is fully operated.
Nothing propagates the declared value into the deployment: the infrastructure templates that build
each consumer's environment never set the variable, so every consumer runs at the permissive default
and the gate passes against any document new enough to satisfy a floor nobody has raised in years.
The mechanism is complete in three places and connected in none, which is why it survives review —
the client has the check, the document has the value, and the only missing piece is a propagation
step that no artifact is obviously responsible for. The damage appears when a client is shipped that
depends on a newly added section: instead of refusing to start with an explicit version error, it
starts happily against the older document and fails later, deep inside a request path, with an
error naming a missing key rather than a stale contract. Deployment ordering silently becomes
load-bearing — the config must ship before any consumer that needs it — while the guard designed to
make ordering irrelevant sits inert.

**Detect.** Establish the floor three times and compare: the default compiled into the client, the
value the configuration document declares for each consumer, and the value actually present in the
running consumer's environment (read it from the live platform, not the templates). Divergence
between the second and third is the finding, and a floor still sitting at its original default while
the document has advanced many versions is the signature. Then test the consequence directly: list
the config sections the current client code dereferences and check each against the document version
actually being served, since any section newer than the served version is a latent runtime failure
the gate should have caught at load. Finally, look for the propagation step by name — a template
loop, a generator, a deploy task that reads the declared value — and if none exists, the connection
was never built rather than broken.

**False positives.** Single-consumer deployments where the compiled default IS the intended floor and
the document's per-consumer field is documentation only; clients that additionally assert the presence
of every section they use at load, making the version number redundant; estates where the config
plane is guaranteed to deploy before consumers by a pipeline dependency that is itself verified.

## DD:15 - Auto-rollback monitors bound to alarms that can lose data - idle-period config deploys roll back on nothing

**Statement.** Config-deployment services with alarm-driven rollback fail closed on monitor health:
a monitor whose alarm reports insufficient data during the deploy or bake window is treated as "in
alarm" and the deployment rolls back. Alarms on request-driven metrics with missing data treated as
missing oscillate between OK and INSUFFICIENT_DATA with ambient traffic, so at quiet hours - or in a
pre-launch environment with no traffic at all - config deployments roll back nondeterministically.
The safety rail becomes the outage of the config pipeline, and each rollback is misread as a config
defect when the true cause is monitor eligibility. The same fail-closed posture applies to the role
the deployment service assumes to read the monitors: an over-conditioned trust policy (a condition
key the service does not send) fails the deployment within seconds of start. A monitor is eligible
only if it is structurally unable to lose data: missing data treated as not-breaching, or a metric
that emits continuously for as long as the watched resource exists, independent of traffic.

**Detect.** List the environment's rollback monitors and for each read treat-missing-data plus the
metric's emission model (request-driven vs continuous). Pull each alarm's state history across a
quiet day and look for OK to INSUFFICIENT_DATA transitions with "datapoint was unknown" reasons -
oscillation is the disqualifier. Read the deployment event log for rollbacks whose named alarms show
NO state transition at the rollback timestamp: that is the insufficient-data signature, not a real
alert. For the monitor role, verify the trust policy carries only condition keys the service
actually sends - a live deployment that dies in seconds citing inability to assume the monitor role,
while every monitor alarm is healthy, is the trust-condition signature.

**False positives.** Monitors on continuous metrics with treat=missing that cannot lose data in
practice while the resource exists; environments that deliberately accept idle-hour deploy freezes
as a conservative posture - only with that trade-off written down; genuine mid-bake alerts where the
alarm really transitioned to ALARM on real datapoints - that is the rail working, not this defect.

## DD:16 — Replace-semantics update API re-stated by hand — every omitted field silently resets, including by the factory's own harden step

**Statement.** A resource's update API has replace semantics: any field omitted from the call reverts
to its service default, not to its current value. Callers nonetheless treat it as a patch, re-stating
only the fields they care about from a hand-maintained list — often with a comment right there
warning that omitted fields reset, which marks the trap without disarming it. Every call site with an
incomplete field set becomes a config-regression factory: each invocation of a harden, rename,
repair, or converge lane quietly reverts some other setting to its default. The nastiest variant is
the resource factory whose own SECOND call (a rename/harden step issued seconds after create) resets
what its first call just declared — the declared shape never survives to production, every fleet
resource diverges identically, and no error is ever raised. Identical divergence across an entire
fleet is the signature: drift scattered by hand-edits varies; drift stamped by a resetting writer is
uniform.

**Detect.** For each update-API call site, diff the passed field set against (a) the create-time
declaration and (b) the API's full mutable surface — every mutable field absent from the update is a
reset candidate. Live-diff fleet resources against the factory's declared create shape; uniform
divergence on a field the create call sets means a resetting writer runs after create — find it.
Treat in-code comments admitting the reset semantics as detection leads, not as evidence of safety.
Converge scripts must build their params from a full live read (describe → mutate → update), never
from a hand-enumerated subset.

**False positives.** APIs with true patch semantics (verify against current provider documentation,
not assumption); update params constructed from a complete live describe; fields deliberately left at
defaults where the default is documented as the chosen value; immutable-at-update fields the API
rejects rather than resets.

## DD:17 — The self-healing drift loop is scoped to the spare pool, so the in-service members it exists to protect are the only ones it never repairs

**Statement.** A fleet keeps its members on the current configuration through a reconciler: a
scheduled inspect/repair pair that compares each member's stamped version against the code's current
version and re-applies the generated configuration on mismatch. The loop enumerates its work from the
POOL table — the inventory of pre-warmed, not-yet-assigned members — because that is where
provisioning bookkeeping lives. Assignment then removes a member from that inventory (or the
inventory only ever held spares), so the moment a member starts serving traffic it leaves the
reconciler's field of view permanently. The result inverts the intent: idle spares are immaculately
current while every member handling real requests is frozen at whatever generation it was stamped
with on the day it was claimed. Because the reconciler reports success — it genuinely repaired every
member it enumerated — dashboards and version scans look clean, and each new generated-config fix
appears to roll out while silently reaching nobody who matters. The gap compounds: each release
widens the delta between the in-service members' frozen configuration and the current generator, and
the divergence is invisible until someone reads a live member's actual configuration.

**Detect.** Find the reconciler's work enumeration and name the exact table/filter it scans, then
diff that set against the authoritative list of ALL members (the identity provider's tenants, the
account's roles, the live resource inventory) — members in the authoritative list but absent from the
scan set are unreachable by the loop. Confirm on a live in-service member rather than in the pool:
read its actual stamped configuration and compare against the current generator's output; a member
whose stamp predates several generator releases proves the gap. Ask specifically whether ASSIGNMENT
deletes the row the loop iterates.

**False positives.** Fleets where assignment keeps the row and only flips a status the scan
includes; a separate reconciler that covers assigned members (find it and check its schedule is
enabled, not merely present); deployments where the generated configuration is re-applied on every
request or boot, making the stamp advisory.

## DD:18 — The drift repairer advances the fleet's version marker while re-applying only one class of the versioned artifacts, so the other classes drift forever behind a converged-looking version

**Statement.** A fleet's members are stamped from versioned templates spanning more than one
artifact class — e.g. per-member access policies AND the trust/admission documents governing who
may use them. The reconciler's drift branch, on version mismatch, re-generates one class (usually
the one the last incident was about), then advances the member's version marker to current. The
marker certifies the whole template set, but only part of it was delivered: every change to the
other classes rides the same version ratchet, is never re-applied, and the mismatch that would have
flagged it is erased the moment the marker moves. The fleet reads as converged in every inventory;
the stale class surfaces only when a member is exercised through it. The tell is a member whose
version equals current but whose artifact of the unrefreshed class predates changes the changelog
attributes to older versions.

**Detect.** Enumerate the artifact classes the version marker claims to certify (read the template
module: what does it generate?), then read the drift-repair path and list what it actually
re-applies — any class in the first set and not the second is drifting silently. Live-confirm by
diffing one converged member's artifacts of the suspect class against the current generator output.
Pin it with a unit test asserting the drift path writes every class (count the write calls per
class).

**False positives.** Version markers explicitly scoped to one artifact class, with the other
classes carrying their own markers or delivered by a different reconciler — verify that second path
exists and runs, then audit its coverage instead; members intentionally pinned or frozen by an
operator hold, which must be recorded visibly on the member, not inferred from staleness.

## DD:19 — A client-side capability catalog advertises a provider as available through a hand-maintained flag, with nothing tying the flag to the server capability it claims

**Statement.** Product surfaces that integrate many third parties keep a catalog — a per-provider
record carrying display copy and an availability flag the UI reads to decide whether to render a live
action or a coming-soon state. The flag is hand-maintained and lives on the client, while the
capability it asserts lives on the server: a provider entry in the backend registry, a credential
with a non-empty client id, a route that returns something other than not-implemented. Nothing binds
them. The flag is flipped in anticipation of backend work, or is left flipped after the backend half
is reverted or never finished, and the UI then offers a live action that terminates in an error the
user cannot act on. This is more damaging than an absent feature: the user commits attention and
often external steps — a vendor login, a consent screen — before the dead end, and the failure
appears to be their fault or the vendor's. The catalog usually documents its own rule, that
availability requires working credentials, in a comment; which is precisely the kind of rule nothing
enforces.

**Detect.** Treat every availability flag as a claim to be tested against the server, not read.
Enumerate the catalog's enabled entries and, for each, exercise the actual initiation endpoint and
require a real response — a not-implemented or misconfigured-credential answer for an entry the
catalog calls available is the defect. Check the server side directly too: an entry missing from the
backend provider registry, or present with an empty credential id, cannot support the action
regardless of what the route returns on a happy path. Then close the loop permanently with a gate
that derives availability from the server, or asserts correspondence between the two lists in CI, so
the flag cannot drift again — and check the inverse direction as well, since a capability shipped
while its flag stays off is the same class of untruth pointing the other way.

**False positives.** Flags gated behind an entitlement or rollout the auditor's session does not have;
providers whose initiation legitimately fails only for the auditing account's configuration; entries
deliberately enabled for an internal pilot; and catalogs where the flag means listed and a second,
server-fed field carries actual availability.

## DD:20 — Two concurrent lines of work allocate the same monotonic contract version, and the merge reconciles the content while leaving one number naming two different documents

**Statement.** A versioned contract document — a schema, an identifier registry, a machine-readable
resource map — carries a single incrementing version that consumers use to reason about
compatibility. When two independent work streams each bump it from N-1 to N, the version becomes an
allocation with no allocator: both are correct in isolation, and a trunk-based merge resolves the
content cleanly, because the two changes touch different keys, while leaving the number silently
overloaded. From that moment the version identifier is no longer a fact about the document: the same
N names one document in one deployed artifact and a different document in another, so every
compatibility check, cache key, freshness assertion and did-the-consumer-get-the-new-contract
diagnosis built on the number is unsound — and unsound quietly, because the check still passes. The
damage outlives the merge: logs, pinned references and prior verification runs all cite N, and
nothing afterwards can tell which N they meant.

**Detect.** Read the version's history rather than its current value: two commits from different lines
of work that both set the same number, or a merge whose result keeps a version the parent already
used, is the defect on its face. In review, treat a contract version bump as a conflict-worthy line
even when the merge tool resolves it silently — the number is a shared resource and the merge is
exactly where its ownership is lost. Where a generator produces the document, check that the version
is derived (a content hash, a counter allocated at merge) rather than hand-typed; where it is
hand-typed, add a gate asserting the value exceeds every value already present on the trunk. When the
collision has already landed, the repair is a fresh number that supersedes both, not a retroactive
renumber of either.

**False positives.** Version fields that are intentionally content-derived and therefore identical for
identical content; documents where the number tracks a schema shape that genuinely did not change;
and vendored copies that legitimately carry an upstream version they did not allocate.
