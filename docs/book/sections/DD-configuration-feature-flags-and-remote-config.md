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

## DD:21 — A migration off environment-supplied identifiers deletes the wiring while an unmigrated consumer still reads it, so the identifier resolves to null and the first use fails at the SDK boundary

**Statement.** A programme moves resource identifiers (bucket names, table names, key ARNs, parameter
paths) out of per-process environment variables and into a central contract or config document. The
migration is enforced negatively — a gate forbids the infrastructure layer from wiring the old
environment names — and the wiring is deleted for the whole fleet in one sweep. But at least one
consumer was never moved to the new source: its code still reads the deleted name. The read does not
throw; it yields the language's absent value (`None`, `undefined`, `nil`), which is carried silently
through module scope and only surfaces when it is handed to an SDK call as a required argument. The
failure is therefore total (every invocation), late (at the client-library validation layer, not at
boot), and reported as a type error about the argument rather than as missing configuration —
so the stack trace names the SDK, not the deletion that caused it. Because the sweep's own commit
message asserts that the fleet now resolves identifiers from the contract, the removal reads as
completed migration in review.

**Detect.** Take the commit or change set that removed the environment wiring and, for every key it
deleted, grep the whole repository — in every language, not just the one the migration was written
in — for a read of that exact name. Any surviving read is the finding. Then confirm both halves
against the live system rather than the diff: read the deployed process's actual environment (an
empty or null environment map is the strongest possible evidence) and pull the consumer's error
metric for the deployment date — a step from zero to error-equals-invocation on the day of the sweep
closes it. Finally check the destination: verify the identifier the code was supposed to migrate to
actually exists in the contract document at the current version. A removal whose replacement was
never authored is the same defect with no forward path.

**False positives.** Consumers that read the name only as an optional override with a working default;
keys deleted because the code path that read them was deleted in the same change; and environments
where the process is genuinely dead (no invocations before or after), where the removal is inert
rather than breaking.

## DD:22 — A fail-closed configuration dependency does not distinguish a transport failure from a policy denial, so a transient config-plane timeout consumes the whole retry budget and is recorded as a permanent record failure

**Statement.** A worker resolves policy from a configuration plane (a sidecar agent, an extension, a
remote config service) on every invocation and fails closed when the resolution fails — correct,
because running without the policy would breach the isolation or authorization guarantee the policy
exists to enforce. The defect is that the failure is undifferentiated: a gateway timeout, a socket
error and a genuine "this record is not permitted" all raise the same error out of the same call
site. The runtime's retry machinery sees an ordinary invocation failure and burns the configured
attempts against a condition retrying cannot fix within the retry window, then routes the batch to
the failure destination. What is lost is not a poison record but a healthy one, and the loss is
attributed to the record rather than to the config plane. The blast radius is usually a single
execution environment — a neighbouring function that never entered the bad state shows nothing —
which makes the incident read as a one-off rather than as a missing failure taxonomy.

**Detect.** For every fail-closed policy dependency, list the error classes its resolver can raise and
check whether the caller distinguishes transport failures (timeout, connection reset, 5xx from the
sidecar) from semantic denials. If one `catch` produces one error, the finding is present. Then read
the consumer's retry configuration and ask whether its budget is long enough to outlive a typical
control-plane blip; a stream or queue consumer with a low attempt count and a short record-age limit
converts a seconds-long config outage into permanent data loss. Verify from the live logs, not the
design: search the worker's log group for the resolver's transport error strings and correlate their
timestamps with the failure destination's arrival metric. Zero occurrences in the preceding weeks
plus a burst that matches the DLQ arrivals is confirmation.

**False positives.** Resolvers that already retry transport failures internally with their own budget
before surfacing, where the outer retry is deliberately a second tier; policy planes whose denial and
transport errors are genuinely indistinguishable at the protocol level and where the safe reading is
denial; and consumers whose records are idempotently re-derivable from a durable source, where the
dead-letter is a queue-position marker rather than a loss.

## DD:23 — A security tunable is declared as independent literals at multiple sites instead of one config-plane value, so adjusting the intended single knob silently misses copies

**Statement.** A parameter that security posture depends on — a credential TTL, a session ceiling, a
rate budget — is written as a bare numeric literal at two or more code sites (often with identical
comments claiming it "matches" some other lifecycle), rather than resolved from the platform's
configuration plane where sibling parameters of the same kind already live. Each copy compiles,
tests and ships independently; nothing cross-checks them. The day the value needs to change — an
incident response shortening a TTL, a product decision lengthening a session — the operator adjusts
the site they know about and the system runs split-brained: some mints honor the new value, others
the old, and the divergence surfaces only as intermittent, hard-to-attribute authentication or
expiry behavior. The pattern is worse than a single hardcoded constant because the duplication
invites partial updates; and worse than ordinary config debt because the value is security-load-
bearing, so the missed copy is not a stale feature but a live hole.

**Detect.** For each security-relevant duration/limit literal, search for the same value (and the
same variable name) across the repo; two or more independent declaration sites of the same tunable
is the finding. Check whether the platform already has a config plane (remote config, contract
document, parameter store) carrying comparable values — if yes, severity rises: the correct home
exists and was bypassed. Comments asserting the literal "matches" another system's lifecycle are a
detection gift: verify the claim against the other system's current value; a stale claim proves the
copies already drifted once.

**False positives.** Deliberately compile-time constants with a single declaration imported by every
consumer (one source, many importers, is correct); values that genuinely must differ per site
(document why); test fixtures mirroring a production constant.


## DD:24 — Completeness is validated where the config is CONSUMED, never where it is AUTHORED, so every gap is discovered by an end user at service time instead of by the author at save time

**Statement.** A consumer of per-record configuration (a template renderer, a policy evaluator, a
session builder) enforces required fields fail-closed at read time — the correct last line of
defense against serving around blanks. But the write path that AUTHORS the record (the settings
API, the onboarding wizard, the admin console) accepts and persists the record without evaluating
the same requiredness, even though the requirement is fully knowable at save time (the record
already names the template/policy/class that demands the field). The defect is born silently at
authoring and detonates per end-user interaction: every request served from the incomplete record
takes the fail-closed lane — an apology, a refusal, a dead feature — one user at a time, while the
author who could fix it in seconds was never told anything was missing. Read-side and write-side
validation are twins; shipping only the read side converts an instant authoring-time correction
into a slow-burning service-time outage.

**Detect.** For each fail-closed requiredness check in a consumer, locate the write path that
persists the record and demand the same evaluation there (shared implementation, not a re-typed
copy), surfaced to the author as a rejection or an explicit gap warning in the write response.
Test by saving a record missing a consumer-required field: a write that returns success with no
gap signal is the defect. Cross-check requiredness sources: if templates/policies declare their
required fields, the write path must resolve the record's template and evaluate against it, not
against a hardcoded list that drifts.

**False positives.** Records deliberately savable as drafts with the gap surfaced at
publish/go-live time instead (verify the publish gate exists); requiredness genuinely unknowable
at write time (the consuming template is chosen per-request); write paths that DO return
structured gap warnings the caller chooses to ignore — that is a client display gap, cite the
client instead.

## DD:25 — One concept is persisted in two stores and the editing surface writes the one the runtime read path never consults, so every edit reports success and changes nothing

**Statement.** A configuration concept — a field mapping, a routing target, an entitlement — ends up
with two homes: an authoritative row the runtime actually reads, and a generic attribute bag on some
neighbouring record (an integration row's `settings`, a profile's `metadata`) that grew organically
because it was the convenient place to put things. The editing surface writes the bag; the runtime
reads the row. Both halves are individually defensible in review, and the write returns 200 with the
value echoed back, so the UI renders the saved state from its own optimistic copy and every
verification an author can perform from the surface passes. The concept is only ever observed as
broken from the far end — the integration silently does nothing — and the distance between the
symptom and the cause is the whole system, which is why this class routinely burns days. The
asymmetry is what makes it durable: a store with a writer and no reader raises no error, produces no
metric, and looks exactly like a store that works.

**Detect.** For each configuration concept, enumerate its writers and its readers independently
(grep the persisted key names, not the API field names, which usually differ) and intersect them: a
store with writers and no runtime reader is the defect, as is a store with a reader whose only
writers are seed/migration paths. Trace at least one concrete value from the editing surface's
request body to the exact attribute the runtime dereferences, and require they be the same
attribute of the same item. Treat a successful write response as no evidence at all — the assertion
must be made at the consumer.

**False positives.** Deliberate projections where one store is a derived cache the runtime refreshes
from the authoritative one (verify the refresh path runs and is not itself dead); attribute bags
read by a different consumer than the one under test — enumerate all consumers before concluding
nothing reads it; transitional states inside a single change that also deletes the loser.

## DD:26 — Backend code composes user-facing web destinations from literal hosts the web plane owns

**Statement.** Backend code (email/SMS builders, redirect and return-URL composition, payment
success links, hosted asset references) embeds the web plane's hostnames or route paths as string
literals. The web topology is owned elsewhere and moves for its own reasons — a dashboard route is
renamed, a surface migrates between subdomains, a brand domain changes — and every literal keeps
composing the OLD destination. Nothing errors at build or deploy: the emails still send, the
redirects still fire, and the drift surfaces only as user-facing 404s, broken images, or links into
a retired surface, often weeks later and only for the flows that embed the moved piece.

**Detect.** Sweep backend code trees (functions, shared layers, service hosts) for the product's
web hostnames and for host-expression + route-path compositions. Every hit must resolve through the
configuration owner (a config document/contract the web plane updates when topology moves) rather
than a literal; a repo-wide verifier that fails the build on new literals is the durable form. Keep
API-plane paths the backend itself owns out of scope — they are code, not web topology.

**False positives.** The configuration loader's own bootstrap coordinates; test fixtures and the
config document itself; asset paths appended to a config-resolved host when the path is a stable
contract with the web repo (the HOST is the drifting half — flag compositions gluing config hosts
to web ROUTE literals the config also owns).

## DD:27 — A mode change governs only future items and strands everything accumulated under the old mode

**Statement.** A setting selects how incoming work is handled — review-then-accept versus accept
automatically, manual versus scheduled, staged versus live. Flipping it changes the code path for
items that arrive AFTER the flip and does nothing about the ones already sitting in the state the
old mode created. The operator's mental model is a property of the system ("everything is automatic
now"); the implementation's model is a branch in the intake path. The stranded items are in a
holding state no path will ever drain, they are invisible on the surfaces that only show current
behavior, and nobody discovers them until someone counts.

**Detect.** For every mode/flag that routes work into a holding state, ask what the flip does to the
existing backlog. The correct behavior is that the transition itself runs the backlog through the
same routine the new mode uses for fresh arrivals — with failures leaving the item in its holding
state, visible, rather than lost. Query the live store for items in the holding state whose owning
config no longer selects that mode: every one is stranded.

**False positives.** Modes where retroactive application would be wrong (a retention change that
must not reach already-exported data); flips that are documented as forward-only with a separate,
existing drain path.

## DD:28 — A setting scoped to standalone syncs is enforced on a dependency of an explicitly requested write

**Statement.** A per-workspace setting governs whether the system may create records of some type in
an external system on its own initiative. The write path enforces it everywhere that type appears,
including where the record is a REQUIRED dependency of an action the user explicitly asked for — the
customer a booking must be attached to. With the setting off, the requested write is impossible by
construction: the external system refuses the parent for the missing child, and the user is told the
write failed with the provider's error, not the setting's name.

**Detect.** For each governed side effect, separate initiative from dependency: the setting should
govern standalone synchronisation, while a dependency of an explicitly requested operation is part
of that operation. Where the restriction is genuinely meant to bind, the pre-check must refuse the
parent action by name rather than letting the provider refuse it.

**False positives.** Compliance-driven settings that legitimately forbid the whole operation, when
the refusal is surfaced as such.

## DD:29 — Published remote-config versions carry a human description the publish path never derives from the content, so two different documents claim the same identity and the deployment trail cannot say what shipped

**Statement.** A remote-configuration service stores each published document as an immutable,
service-numbered version and lets the publisher attach a free-text description. The publish tooling
sets that description from a constant, a stale variable, or the document's own internal version field
rather than deriving it from the content actually being uploaded. Successive publishes therefore
carry identical or wrong descriptions while the service's own version numbers advance, and the
deployment record — the only human-readable column in the version list — stops distinguishing the
documents. Nothing breaks at runtime: the newest version is served correctly and the application is
unaffected. What breaks is every retrospective question. During an incident the natural first move is
to list the published versions and identify which document introduced a behavior; with duplicate
descriptions that list cannot answer it, and the investigator must download and diff raw payloads to
learn what the audit trail was supposed to record. The defect is self-concealing because it is
invisible from the application's side and visible only in the version listing, which nobody reads
until something has already gone wrong — and it compounds any environment where remote config can
ship ahead of the code that consumes it, since reconstructing the config timeline is exactly how that
class of incident is diagnosed.

**Detect.** List the published versions for every configuration profile and check the description
column for duplicates, nulls, and values that disagree with the document's own internal version
field; any two versions sharing a description is the finding. Read the publish script and confirm the
description is computed from the content being uploaded — a content hash, the document's version
field read from the payload at publish time, or the source revision — rather than from a literal or a
variable set earlier in the script. Verify by publishing to a non-production profile and reading back
the stored description. Extend the check to the deployment records that reference those versions: a
deployment whose description names a version number different from the one it deployed has the same
defect at higher blast radius. Where a documented rollback procedure selects a version by
description, treat this as severity-raising, since the procedure can select the wrong document.

**False positives.** Profiles whose descriptions are deliberately null and whose provenance is
carried by a separate, verified changelog keyed on the service's version number. Single-document
profiles that are never rolled back or compared. Systems where the version list is generated from
the payload at read time rather than from a stored description field, so a stale stored value is
never consulted.

## DD:30 — Runtime service-catalog registry accretes entries for retired targets: fail-closed on add, fail-open on retire

**Statement.** A shared configuration document carries a registry of invocable targets (function
names, service endpoints, queue names) and the resolution accessor deliberately fail-fasts on any
UNREGISTERED name, so adding a target forces a registry entry. But nothing enforces the reverse
lifecycle: when a target is retired, its entry stays. The registry becomes append-only in practice —
the accessor validates ENTRY existence, not TARGET existence — so retired names remain happily
resolvable and die only at invoke time, in the caller's error path, with the registry's own
fail-fast guarantee having vouched for them. Every registry-driven consumer inherits the phantoms:
compliance evaluators iterate targets that do not exist, scaffolding verifiers scan for source
directories that were deleted, capacity and cost inventories over-count the fleet, and a future
caller who finds the name in the registry writes a new invocation of a corpse.

**Detect.** Diff the registry's key set against the live fleet inventory (the cloud API's function/
service list), both directions. Every registered-but-absent name is the finding; confirm retirement
(no source directory, no IaC declaration, no live resource) rather than rename before flagging.
Check whether any reconciliation exists — a verifier, a periodic job, a publish-time gate — that
compares the registry to the live fleet; absence of that mechanism is the structural half of the
finding even when the current diff is clean.

**False positives.** Entries for targets that are declared in IaC and genuinely pending first
deploy (name the change that ships them). Registries whose entries are explicitly lifecycle-stamped
(e.g. `retired_at`) and whose accessor refuses stamped entries — that is the fix pattern, not the
defect. Names that exist under an alias or qualified variant the inventory listing missed.

## DD:31 — A runtime that materializes its public interface from remote config on every request and hard-fails on any missing key makes renaming a key undeployable in either order

**Statement.** A service builds its externally visible surface — tool schemas, field
descriptions, prompts, form definitions — by reading a remotely published config document, and
does so per request or per session rather than once at boot. Its accessor is strict: a key the
document does not carry raises rather than returning a default, which is a deliberate and
usually correct fail-closed posture. Renaming a key in that document then has no safe ordering.
Publishing the renamed document first breaks the already-running fleet, which still asks for the
old key, and remote config is designed to reach that fleet in seconds with no deploy. Shipping
the code first breaks the new build against the document still live, and any gate that checks
code and document agree fails the build. The deadlock is invisible until the moment of the
rename because both halves are individually correct — strict accessor, fast propagation — and it
is specifically the combination of per-request materialization and strict lookup that removes the
window a boot-time read would have provided. The usual escape is to declare both keys for one
release, which works but installs a real dual path in the interface; the escape's own risk is
that the transitional key has no forcing function to remove it and quietly becomes permanent.

**Detect.** Find every read of the remote document on a request/session path and check what the
accessor does with an unknown key. Where it throws, the document's key set is a hard contract
with the running fleet, so ask of any proposed key change: what runs between publish and the last
old instance retiring? Require that renames land as add-new → migrate readers → drain → remove-old,
with the removal carrying an explicit condition (a fleet revision floor, a dated gate entry) and
not a comment. Audit for the residue: transitional keys declared "temporarily" in the document or
the schema with no gate that fails once the drain condition is met.

**False positives.** Documents read once at boot into an immutable snapshot, where a publish
cannot affect running instances and the ordering is a normal deploy sequence; accessors that
return a documented default for unknown keys; key sets versioned as a whole with consumers
pinned to a version, where old and new documents coexist by design.

## DD:32 — A per-environment config document also carries the consuming platform's own interpolation syntax, so the IaC template engine cannot parameterize it and the naive escape silently rewrites security-enforcing values

**Statement.** A configuration document has to be parameterized per environment — an account
id, a region, a queue host differs per deployment — and the obvious mechanism is the IaC
tool's template function. But the same document also contains `${...}` sequences (or the
equivalent) belonging to the CONSUMING platform's runtime interpolation: IAM policy variables,
log-format placeholders, prompt-template slots, shell-expansion markers. The template engine
claims that syntax first, and there are only two outcomes. Either the render fails on an
expression it cannot resolve, which is survivable precisely because it is loud; or an author
escapes the collisions until the render passes, and every occurrence they miss is rewritten or
emptied. The second is the dangerous one, and it is worst exactly where the embedded syntax is
what enforces a boundary — a policy variable that scopes a caller to its own partition becomes
a literal matching nothing, or a prefix matching more than it should. Nothing downstream
notices: the document is still well-formed, it still passes its schema validator, its version
still increments, and the widened permission is observable only by attempting the access that
should have been denied.

**Detect.** Before introducing a template function, grep every document the IaC layer renders,
or might render, for that engine's own delimiters. For each hit, establish who OWNS the
sequence — the IaC layer, or the consuming runtime. Anything owned by the runtime is a
collision. Then read what the collided value does: one that appears in an authorization
condition, a resource-prefix constraint or a partition key raises this from a build hazard to a
security finding, and it should be graded on what the broken form would permit rather than on
whether it currently renders. Prefer a targeted substitution over a general engine for such
documents — replace only the specific tokens that vary by environment and leave every other
byte untouched, which makes a missed escape impossible by construction rather than merely
unlikely. Where an engine is genuinely unavoidable, require a post-render assertion that every
runtime-owned sequence survived byte-for-byte, because schema validation will not catch it.

**False positives.** Documents with no runtime-owned interpolation, where the template engine is
simply the correct tool. Sequences the IaC layer legitimately owns and intends to resolve.
Documents generated wholesale from structured input rather than rendered from a source file — a
generator emits the runtime syntax as data and never parses it, so the collision cannot arise.
