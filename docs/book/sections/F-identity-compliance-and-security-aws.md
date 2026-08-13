---
section: F
title: "Identity, Compliance & Security (AWS)"
group: aws-backend
---

# [F] Identity, Compliance & Security (AWS)

## F:1 — IAM: Trust policies utilizing sts:AssumeRole without enforcing sts:ExternalId (Confused…

IAM: Trust policies utilizing sts:AssumeRole without enforcing sts:ExternalId (Confused Deputy vulnerability).

## F:2 — IAM: Policies combining the iam:PassRole permission with wildcard * resources, allowing…

IAM: Policies combining the iam:PassRole permission with wildcard * resources, allowing immediate privilege escalation.

## F:3 — KMS: Customer Managed Keys (CMKs) lacking automated yearly key rotation configurations

KMS: Customer Managed Keys (CMKs) lacking automated yearly key rotation configurations.

## F:4 — Cognito: User Pools lacking Advanced Security Features (compromised credentials checks)…

Cognito: User Pools lacking Advanced Security Features (compromised credentials checks) or enforced MFA.

## F:5 — IAM/SSO: IAM Users generated with static, long-lived access keys instead of utilizing IA…

IAM/SSO: IAM Users generated with static, long-lived access keys instead of utilizing IAM Identity Center (SSO) with short-lived tokens.

## F:6 — IAM: Inline Policies Applied Directly to Users/Roles Instead of Managed Groups

IAM: Inline Policies Applied Directly to Users/Roles Instead of Managed Groups. Hardcoding inline permissions to individual IAM identities rather than using managed Customer Policies tied to corporate RBAC groups, breaking compliance audits and complicating permission revocations.

## F:7 — Secrets Manager: Missing Automatic Rotation Callbacks

Secrets Manager: Missing Automatic Rotation Callbacks. Storing production API credentials or DB strings without deploying a dedicated rotation Lambda function, leaving credentials vulnerable to credential harvesting over time.

## F:8 — KMS: Overly Permissive Key Policies Granting Global Access

KMS: Overly Permissive Key Policies Granting Global Access. Configuring custom key access policies with Principal: "*" and relying purely on IAM profiles to restrict visibility, creating serious exposure risks if IAM configurations are accidentally updated or mismanaged.

## F:9 — IAM: Roles created by CI/CD without permissions boundaries — the pipeline can mint admin…

IAM: Roles created by CI/CD without permissions boundaries — the pipeline can mint admin-grade roles.

## F:10 — IAM: Trust policies allowing the entire account root principal instead of the specific s…

IAM: Trust policies allowing the entire account root principal instead of the specific service/role principal.

## F:11 — IAM: NotAction/NotResource policy constructions granting far more than the author intended

IAM: NotAction/NotResource policy constructions granting far more than the author intended.

## F:12 — IAM: Unused roles, users, and access keys never pruned — no Access Analyzer or last-acce…

IAM: Unused roles, users, and access keys never pruned — no Access Analyzer or last-accessed review loop.

## F:13 — Cognito: Identity pool unauthenticated role grants reaching beyond the intended public-r…

Cognito: Identity pool unauthenticated role grants reaching beyond the intended public-read scope.

## F:14 — Cognito: Token revocation unimplemented and access token TTLs measured in hours — banned…

Cognito: Token revocation unimplemented and access token TTLs measured in hours — banned users keep working sessions.

## F:15 — KMS: kms:Decrypt granted broadly at the IAM layer across keys instead of per-key, per-se…

KMS: kms:Decrypt granted broadly at the IAM layer across keys instead of per-key, per-service scoping.

## F:16 — STS: Maximum session durations set to 12h where 1h suffices, extending the blast window…

STS: Maximum session durations set to 12h where 1h suffices, extending the blast window of leaked credentials.

## F:17 — IaC: Secrets materialized in plaintext inside Terraform state/CloudFormation outputs rea…

IaC: Secrets materialized in plaintext inside Terraform state/CloudFormation outputs readable by broad principals.

## F:18 — GuardDuty/Security Hub/Inspector: Disabled, or enabled with findings routed nowhere acti…

GuardDuty/Security Hub/Inspector: Disabled, or enabled with findings routed nowhere actionable.

## F:19 — Account: Root user without hardware MFA, or root access keys existing at all

Account: Root user without hardware MFA, or root access keys existing at all.

## F:20 — IAM: Hand-rolled policies replicating (worse) what AWS-managed service-role policies alr…

IAM: Hand-rolled policies replicating (worse) what AWS-managed service-role policies already provide, drifting from service updates.

## F:21 — KMS: Service-principal key-policy statements without kms:CallerAccount / kms:ViaService — cross-account confused deputy through the service

**Statement.** A CMK key policy grants usage (Encrypt/Decrypt/GenerateDataKey/CreateGrant) to an
AWS service principal (`secretsmanager.amazonaws.com`, `elasticache.amazonaws.com`,
`rds.amazonaws.com`, …) with no `kms:CallerAccount` / `kms:ViaService` condition. Service
principals are shared across ALL customers: the statement authorizes the service acting for
anyone, so a foreign account that learns the key ARN can point its own resource (a secret, a
cluster) at the key and the service will happily use it on their behalf — the classic confused
deputy AWS's own key-policy guidance conditions against. Especially telling when sibling
statements in the same policy carry the conditions and one service's statement does not.

**Detect.** For every key-policy statement whose Principal is a `*.amazonaws.com` service, demand
`kms:CallerAccount` (and `kms:ViaService` where the service supports it) or an encryption-context
condition that pins account-owned resource ARNs. Diff statements within one policy — an
unconditioned outlier among conditioned siblings is the finding. Verify against the LIVE key
policy, not just IaC.

**False positives.** Statements conditioned instead on `kms:EncryptionContext:*` values that embed
the account id (equivalent pinning); metadata-only actions (`kms:DescribeKey`) deliberately split
into an unconditioned statement because they carry no encryption context; services that reject
the conditions (verify against current AWS documentation before accepting this excuse).

## F:22 — IAM: Per-tenant physical principals allocated against an account-level hard quota with no telemetry or scale plan

**Statement.** The tenancy model mints K physical IAM roles (or users/policies) per tenant at provisioning time. IAM roles per account default to 1,000 and cap out around 5,000 even after quota increases, so tenant growth hits an account-wide provisioning wall at roughly quota/K tenants: every new tenant's onboarding fails at once, and nothing warns beforehand because the role count is not monitored against the quota. The per-tenant isolation pattern itself may be a sound, deliberate security choice — the defect is the unmonitored, unplanned ceiling, not the pattern.

**Detect.** Per-tenant `CreateRole` in provisioning code; count role types K minted per tenant; compute quota/K against the business's tenant projections; check for Service Quotas monitoring or a CloudWatch alarm on the IAM role count; check for a documented plan (quota raise request, cell/account sharding, role consolidation to session-tag ABAC) that engages before the wall.

**False positives.** Cell-based architectures where accounts shard before the quota binds, with the trigger documented; per-tenant principals minted in tenant-owned accounts; deployments whose documented tenant ceiling times K stays far under the default quota AND the ceiling is enforced somewhere real.

## F:23 — IAM: Tenant provisioning continues to mint principals for a decommissioned subsystem

**Statement.** A subsystem is removed from the platform, but the per-tenant provisioning path still creates — and the repair/inspect loops recreate or demand — its roles and policies for every new tenant. Dead principals accumulate with tenant growth, inflate the account's role count toward quota, and enlarge the audit surface with trust policies nobody exercises. A sweep-only cleanup regresses because the factory still runs: retirement must land in the provisioning code first, then the strays are deleted.

**Detect.** Diff the set of role types minted by provisioning code against the set actually assumed anywhere (STS AssumeRole call sites, federation flows, service configurations). A minted-but-never-assumed role type — especially one whose policies reference removed services — is the signature. Confirm the repair path would recreate it if deleted, which proves sweep-first cleanup regresses.

**False positives.** Roles for a dormant-but-planned plane with the plan documented; break-glass roles deliberately never assumed in normal operation; retirements already landed in provisioning code where only stray instances await deletion.

## F:24 — Service-principal resource policy scoped to the account only, on the claim that the sender set is uncountable, when the senders carry a deterministic generated name prefix

**Statement.** A resource policy grants an AWS service principal write access to a queue, topic, or
bucket and conditions it on the source ACCOUNT alone, deliberately omitting the source-ARN condition.
The omission is documented and reasoned: the senders are provisioned dynamically, one per tenant, so
their ARNs cannot be enumerated at deploy time and any fixed list would be wrong by the next
onboarding. The reasoning is sound but the conclusion is not, because dynamically created does not
mean unpatterned — provisioning code almost always mints these names from a deterministic template
with a fixed literal prefix, which a wildcard ARN condition matches exactly and permanently. The
result is a grant far wider than intended: every resource of that type in the account, including ones
belonging to entirely unrelated subsystems and ones that are internet-exposed, can drive writes into
the target through the shared service principal. The danger is that the comment makes the statement
look audited — a reviewer reads a considered justification for a wildcard and moves on, and the
policy then survives every subsequent review on the strength of its own explanation.

**Detect.** For every resource-policy statement naming a service principal, list the conditions and
flag any that pin the account without pinning the source resource. Do not accept the accompanying
justification: find the provisioning code that actually creates the sender and read the name it
builds. A template with any fixed literal segment means a wildcard ARN condition was available and
the justification fails. Then quantify the real grant by listing every resource of that type in the
account and asking which of them the current condition admits — naming the unrelated and
externally-reachable ones is what converts this from pedantry into a finding. Where a genuinely
random name is generated, check whether provisioning could tag or prefix it instead.

**False positives.** Senders whose names are wholly caller-supplied or externally assigned with no
controlled segment; services that do not populate the source-ARN key for this action (verify against
current vendor documentation, not assumption); statements already narrowed by an equivalent pin such
as a resource tag or encryption-context condition; single-tenant accounts whose entire resource
inventory is the intended sender set and where that scope is stated.

## F:25 — Identity: User-pool password policy departs from the audited benchmark with no recorded acceptance — and a pool factory re-stamps it on every tenant

**Statement.** The platform's user pools carry a password policy below the compliance benchmark the
organization itself runs — a character class switched off, or the minimum length parked at the
benchmark's floor — and no document records the deviation as a decision. Where pools are minted by a
tenant-provisioning factory (and re-converged by a repair lane that re-states the full policy block),
the weak shape is not one misconfigured resource but a template: every new tenant is born failing the
benchmark, every repair pass re-stamps the old shape over any hand-fix, and the finding count grows
with tenant count. A length-first policy can be the RIGHT call (NIST 800-63B recommends against
composition rules), but an undocumented deviation from the benchmark the org audits against is a
decision-hygiene defect even when the cryptographic argument is defensible — the auditor sees only
failing controls and no recorded reasoning.

**Detect.** Read the factory's create/update parameter sets (and any repair/converge lane — these
often restate the full policy because the update API resets omitted fields) and diff the password
policy against the benchmark the account actually runs. Search for a recorded acceptance (ledger,
ADR, security doc). Enumerate client-side password validators that mirror the rule — a server-side
tightening without the client sweep produces confusing rejects at signup. Check compensating
controls (breach-password screening, lockout, MFA, passkey-first sign-in) to calibrate severity
honestly.

**False positives.** A deliberately length-first policy WITH a documented acceptance and compensating
controls; pools serving only machine principals; benchmarks the org has explicitly disabled or
scoped out with recorded rationale.

## F:26 — Grant names only the base resource ARN while the code reads through a secondary index, whose child ARN the grant never covers — every indexed read is denied

**Statement.** Managed data stores expose secondary indexes as child resources with their own ARNs,
and an authorization decision for a read through an index is made against the CHILD ARN, not the
parent. A policy that names the table and stops therefore authorizes direct-key access and denies
every query that names an index — a distinction invisible in the policy, which reads as complete
coverage of the table, and invisible at the call site, which names the index as an ordinary
parameter. The same statement usually compounds the gap on the action axis: policies written for a
writer path enumerate point operations and omit the query action entirely, so the read is denied
twice over for two unrelated reasons and fixing either one alone leaves it denied. Least-privilege
discipline makes this MORE likely, not less: a wildcard resource would have covered the index by
accident, so the projects most careful about scoping are the ones that hit it. The runtime signature
is an authorization error, not a validation error, so it reads as a provisioning or trust-policy
problem and sends investigation toward the role's assumption path rather than its statement list.
When the denied read sits in front of a side effect — a notification, an enrichment, an audit write —
the effect simply never happens, and because the caller is asynchronous the failure is invisible to
the user action that triggered it.

**Detect.** Work from the code to the policy, never the reverse. Enumerate every read in the service
that names a secondary index, and for each, resolve the exact principal that executes it — including
any session policy or permission boundary that intersects the role, since a session-scoped fence
produces a differently-worded denial for the same shape. Then check the effective grant for BOTH the
child ARN pattern and the query action; a statement naming the base ARN with point-operation actions
is the finding even when the table is otherwise fully covered. Prefer the provider's policy simulator
against the real principal and the real child ARN over reading the JSON. Do not accept an absence of
errors as evidence: an asynchronous consumer that is denied on its first read logs and dies without
touching the surface that invoked it, so confirm from the consumer's own error stream and from
whether its downstream effect has ever been observed, not from the health of the caller.

**False positives.** Indexes read only through paths that are provably dead; grants that cover the
child ARN via a trailing wildcard on the table ARN, which does authorize index access; principals
whose denial is deliberate and handled — the code catches the authorization error and falls back to a
documented alternative read; environments where the index is a recent addition and the audit is
reading a policy that has legitimately not yet been applied, which is a deploy-lag finding rather
than a policy-shape one.

## F:27 — Provisioning principal granted the create action but not the post-create hardening calls the same code path makes, so every resource lands half-configured

**Statement.** Provisioning a resource is rarely one API call. The create succeeds, and the same code
path immediately follows it with the calls that make the resource fit to use — enable versioning, put
the encryption configuration, attach the lifecycle policy, block public access, tag it. The role's
policy is written against the resource the provisioner OWNS and frequently names only the create
action, because that is the verb in the ticket and the one the author was thinking about. Every
hardening call after it is then denied. Two failures follow from one gap, and the second is the
dangerous one. The provisioner throws partway through its sequence, so the resource exists but is
missing whichever protections came after the first denied call — and it exists, which means an
existence check, an inventory sweep, or a compliance rule keyed on presence reports it as provisioned.
The ordering of the calls silently decides which protections a tenant gets, so two resources created
by the same code differ in posture according to where in the sequence the denial landed. Retries make
it worse rather than better: each attempt recreates or re-touches the resource, fails at the same
call, and leaves another partially configured artifact, so the account accumulates half-built
resources with no single event marking any of them as incomplete. The pattern is most likely where the
provisioner is asynchronous — a worker, a step in a state machine — because nothing user-facing
observes the throw.

**Detect.** Read the provisioning function as an ordered sequence of API calls, not as a unit, and
check the executing role for EVERY verb in that sequence against the exact resource ARN the call
targets — including the calls that run after the one you assume is the hard part. Names that read as
one capability are separate authorization decisions. Then verify from the live account rather than the
code: enumerate the resources this provisioner has created and check each one for the full set of
post-create properties it is supposed to carry; a population where the same property is missing on
every member, or missing on everything after a certain date, is the finding. Read the provisioner's
own error stream for authorization failures — an asynchronous provisioner that dies mid-sequence
usually logs and is never looked at, and its DLQ or failure destination is the fastest inventory of
half-built resources. Do not accept a green compliance rule as counter-evidence if that rule keys on
the resource existing.

**False positives.** Post-create calls that are genuinely optional and whose absence is the documented
posture; sequences whose later calls are performed by a different, correctly-granted principal (a
bucket-policy applier, a tagging sweeper) on a schedule; providers that apply the property as an
account-level default so the explicit call is redundant; provisioners that catch the denial, record it,
and re-drive the hardening step through a path that does have the grant.

## F:28 — An inline session policy grown past the credential service's packed-size budget turns the least-privilege fence into a total outage

**Statement.** A per-request credential fence is expressed as an *inline* session policy passed at
assume-role time, and the fence is attribute-pinned: it enumerates resources, conditions, and tag
constraints that grow with every capability added to the lane. The credential service compresses and
size-limits that document, and when the packed size crosses the budget the assume-role call itself
fails — not the action the policy was meant to constrain. Every request on the lane dies before any
business logic runs, and because the failure is raised by the credential layer it surfaces as an
opaque infrastructure error rather than an authorization decision: an unhelpful generic 5xx at the
edge, with the real exception name only in the function's own logs. The defect is created by the
safest-looking possible edit — tightening the fence with one more explicit resource — so it is
shipped by exactly the reviewer who is being careful.

**Detect.** Measure, do not estimate: probe the real credential service with each built policy and
record the returned packed size against the budget as a ground-truth pin, then gate on drift from
that pin. Anything already near the ceiling must move to a managed policy referenced by ARN, since
only the ARN counts toward the packed budget. Sweep every profile in one pass — the profiles that
are closest to the cliff are rarely the ones being edited. Byte-identical twin profiles that fall
out of the sweep are a second finding: two lanes for one job.

**False positives.** Profiles whose policy is generated per-request from a bounded set (measure the
worst case, not the median); lanes already on managed policies where the inline document is only a
narrowing overlay; a one-off spike from a debugging build that never shipped.

## F:29 — A role granted the data-plane action on a customer-managed-key-encrypted store, but not the key action, fails 100 percent of the time at the key service

**Statement.** A store is encrypted with a customer-managed key, and a principal is granted exactly
the data-plane action it needs — read, write, or delete — with correctly scoped resource ARNs. The
grant looks complete and passes least-privilege review, because the reviewer is checking the store's
permissions. But every data-plane call against a CMK-encrypted store also requires the corresponding
key action on the key, and that statement is absent. The result is not a partial degradation: it is
a 100 percent failure rate for that principal on that store, raised by the key service, with an error
text that names the key rather than the store — so the failure reads as a key-policy problem and is
triaged away from the role that is actually missing the grant. The tell is a sibling: another
function in the same subsystem, written at the same time, that does carry the key statement. The one
without it was the one whose access pattern looked simple enough not to need it.

**Detect.** For every store encrypted with a customer-managed key, enumerate all principals holding
a data-plane action on it and assert each also holds the matching key action on that key — the check
is mechanical and should be a verifier, not a review habit. Live-confirm by comparing the failing
principal's inline policies against its siblings' in the same subsystem; a missing whole statement
(not a narrowed one) is the signature. Failure-rate evidence settles it: count the principal's
invocations against its logged failures over a window; equality proves it has never once succeeded.

**False positives.** Stores encrypted with a service-owned key, where no key grant is required;
principals whose key access is granted by the key policy rather than an identity policy (check
both sides before filing); read paths against a store whose encryption context the caller never
touches because it only reads metadata the service returns unencrypted.

## F:30 — A caller granted sts:AssumeRole on a stamped role family is never admitted by the family's trust template, so the grant's two halves ship apart and the path is dead on first exercise

**Statement.** Assuming a role requires two artifacts that live in two different places: the
identity-side grant (sts:AssumeRole, plus sts:TagSession when sessions are tagged) on the caller's
role, and resource-side admission of the caller in the target role's trust policy. When targets are
per-tenant roles stamped from a shared trust template, those halves have different owners and review
paths — the grant sits in the caller's own IaC, the admission in the template a provisioner renders —
so wiring a new consumer routinely ships the grant and forgets the template. Nothing fails at deploy:
gates stay green, the caller's policy review looks complete, and the defect waits for the first real
exercise of the path, where it fails 100 percent of the time at AssumeRole (TagSession denials
surface first when sessions are tagged, which reads as a tagging bug rather than a missing trust
entry). Rarely-exercised paths — first activation, account deletion, month-end jobs — carry it
dormant for weeks and are then discovered by a customer, not a gate. The tell is the caller's own
sibling: the same template already admits a role added for an adjacent flow at an earlier version,
proving additions were known to be required and this one was simply missed.

**Detect.** Enumerate every principal holding sts:AssumeRole on the role-family ARN pattern in IaC,
and diff that set against the union of the trust template's principal lists — every consumer absent
from the template is a finding; the check is mechanical and should be a verifier, not a review
habit. Assert action parity too: a trust statement admitting AssumeRole but not TagSession breaks
every tagged-session caller identically. Live-confirm on one stamped instance: read the actual trust
policy of a rendered role and check the caller's ARN is present.

**False positives.** Callers admitted by a different trust statement in the same policy (service
principals, federation, a separate user-context statement in a dual-trust design — check every
statement before filing); grants that are deliberately dormant behind an unreleased feature, but
demand a dated note saying so; families whose trust is intentionally managed outside the template —
then the finding is that split, not the missing entry.

## F:31 — Grant names a hierarchical resource by a path-truncated ARN, so the authorization decision is made against a resource that does not exist and every call is denied

**Statement.** Services whose resources live in a name hierarchy — parameter stores, secret stores,
object prefixes, IAM paths — encode the FULL path inside the resource ARN, and the authorization
decision is an exact match against that path, not against the leaf name. A policy that names the
resource by its leaf, or by any prefix-truncated variant of its real path, therefore authorizes a
resource that does not exist and denies the one the code actually requests. Nothing in the policy
looks wrong: it names a plausible path, passes every syntax and lint check, and reads at review as
precise least-privilege scoping. Nothing in the IaC catches it either, because the grant and the
resource are usually declared in different stacks or different files and no reference binds them —
the ARN is a hand-written string, so the two drift the moment either side is renamed or re-homed
under a new prefix. The defect is invisible until runtime and then total: not a degraded path but a
100% denial, from the first call, forever. Its blast radius is set by what the caller does with the
denial, and callers that treat "cannot load the credential" as "the feature is unavailable" convert
a hard authorization fault into a silent, permanently-suppressed feature that reports success to its
own caller.

**Detect.** Do not read policies for plausibility — bind them to reality. Extract every literal
(non-wildcard) resource ARN granted across the tree for hierarchical services, parse the path out of
each, and diff that set against the live inventory of resources actually provisioned; any granted
path with no live resource behind it is either this defect or a dead grant, and both are findings.
Drive the check from the consumer as well: for each caller, resolve the exact resource identifier it
passes at runtime (from live configuration, not from source defaults, since the path usually arrives
by environment or contract) and confirm the effective policy for its principal covers that exact
string. Confirm the consequence in the audit log rather than by inspection — a denial on a
hierarchical read is recorded with the requested ARN, so the log states the real path and the policy
states the granted one, side by side. Where the caller has a failure branch, check what that branch
does before sizing severity: a suppressed-and-continue branch hides the fault from every health
signal that is not the audit log.

**False positives.** Statements where a sibling clause covers the same resource by wildcard or by a
trailing-slash prefix, which does authorize the full path; paths that legitimately do not exist yet
because the grant ships ahead of the resource in a documented ordering; resources addressed by alias
or by a service-resolved name where the ARN is not the authorization key; deliberately dead grants
retained for a documented future consumer, which are a hygiene finding rather than a denial one.

## F:32 — A stamped trust policy adds a required session-tag class and existing admitted callers never update their tagging code, so every call dies as an opaque TagSession denial

**Statement.** Session-tag-conditioned trust policies (ABAC) evolve: a hardening pass
splits callers into classes and adds a REQUIRED tag for one class (e.g. a user-identity
tag on user-context callers, enforced via a presence condition on the request tag). The
trust template, its principal list, and each caller's AssumeRole tagging code form a
THREE-part contract; the tag-requirement change lands in the template — often minted per
tenant by a provisioner, restamped fleet-wide by drift repair — while admitted callers
that predate the class keep sending the old tag set. Every such call is denied, and the
error is maximally misleading: "not authorized to perform sts:TagSession" reads as a
missing identity-policy grant, though both the grant and the admission are fine — a
CONDITION on a tag the caller never sends is what failed. Related but distinct from the
two-halves grant/admission drift (F:30): here the caller IS admitted; the condition
vocabulary moved underneath it.

**Detect.** Diff the trust template's per-class required tags against each admitted
caller's actual AssumeRole tag set (code or CloudTrail requestParameters.tags) — for
every caller, every required tag of its class must be present, and transitive-tag-key
lists must include it. Lock the pairing with a static gate that derives the caller
classes FROM the template source and fails on any unmapped or under-tagged caller.
Treat any "sts:TagSession" AccessDenied where the principal appears in the trust as
this pattern until proven otherwise.

**False positives.** Callers that assume through a shared library that injects the
required tags (verify the library path, not the absence of inline tags); callers in a
class the template genuinely exempts (sentinel values, system-context statements) —
confirm against the statement that actually admits them, not the file as a whole.

## F:33 — Row-scoping condition applied to a resource whose own key schema cannot express the scope, making the grant structurally unusable

**Statement.** A tenant-isolation policy grants an action on a family of resources with a wildcard
(`.../table/*/index/*`, a prefix pattern, a path glob) and constrains it with a key-scoping condition
— a leading-key match, a path prefix, a partition predicate — written in the *base* resource's key
grammar. At least one resource inside that wildcard has a DIFFERENT key schema: a secondary index
whose partition key is a natural business identifier (an external call id, an email, an order
number) rather than the tenant-prefixed key. The condition is evaluated against the key schema of
the resource ACTUALLY queried, so on that index the required key can never match any allowed
pattern, and the grant is an unconditional deny for every principal and every tenant — not a
narrowing, an annihilation. Nothing in the policy reads as broken: the resource is listed, the
action is listed, and reviewers checking "is the index covered?" find that it is. The failure is
uniform rather than selective, which is what makes it survive: it never looks like a tenant-scoping
bug because no tenant ever succeeds, so it presents as a feature that was never finished rather than
a permission that was never usable. Paired with a caller that catches the authorization error and
degrades (see the swallowed-precheck and failure-with-no-rendering patterns), the capability ships,
renders empty forever, and bills a permanent error-rate signal that operators learn to ignore.

**Detect.** For every policy statement that pairs a wildcard resource with a key-scoping condition,
enumerate the CONCRETE resources the wildcard covers and read each one's real key schema from the
live data store, not from the IaC that was supposed to create it. Any covered index whose partition
key is not the attribute the condition constrains is structurally denied — write out the actual key
value a real query would present and check it against each allowed pattern by hand; a natural
identifier cannot match a tenant-prefixed glob. Then trace from the other end: enumerate every query
in the codebase that names a secondary index, resolve which principal executes it, and confirm that
principal's condition can be satisfied by that index's partition key. The runtime signature is
diagnostic — an authorization denial naming a specific index while the policy visibly lists that
index means condition failure, not a missing grant, and a denial message reading "no identity-based
policy allows" on a resource the policy clearly names is this pattern until proven otherwise. Grep
the callers of every such query for catch blocks that log-and-continue: those are where the evidence
has been going. Finally, check the sibling indexes — a correctly tenant-prefixed variant of the same
index (composite tenant-key + natural-key) very often already exists and is used by other callers,
which both proves the intended design and supplies the fix.

**False positives.** Indexes deliberately reserved for platform/system principals that hold a
separate, condition-free grant, where the tenant role's denial is the intended boundary; conditions
whose allowed-pattern set genuinely includes the natural identifier's shape; policies where a second
statement grants the same action on that specific index without the condition; key-scoping engines
that evaluate against the base table's key even for index reads (verify the provider's documented
semantics before flagging); and grants that are dead because the query path is dead, where the
finding is the unreachable code rather than the policy.

## F:34 — Session-scoped policy enumerates the action set of an older access shape, so a read path that changed from a point lookup to a range query is denied by the intersection the role review never sees

**Statement.** Per-request credentials are commonly fenced by an inline session policy that
INTERSECTS the assumed role's own grant: the caller may do only what both allow. That fence is
written once, from the access shape the code had at the time — typically a point read and a write.
When the data model later moves the read to a range/prefix query (the "latest row in this partition"
pattern that replaces a deterministic key), the query action is added to the ROLE, where policy
review looks, and forgotten in the SESSION policy, where nothing does. Every call in that path is
denied. The denial message is self-describing — it says no session policy allows the action — but it
surfaces only at runtime, on the specific profile, and any audit that reads the role's policy
concludes the permission is present. The blast radius is the whole capability behind that read, and
when the read gates a compliance decision (consent, entitlement, eligibility) the failure is worse
than an outage: the record that proves the decision cannot be consulted at all.

**Detect.** Do not audit the role policy alone. For every credential-vending profile, list the
actions its session policy grants per resource and diff them against the actions the code actually
issues against that resource, tracing the call path rather than grepping for action names — a shared
helper's method is the truth, not the call site. Where a role grant and a session grant differ, the
narrower one is the live permission; treat any action present in the role but absent from the
session policy as a live denial waiting for its first caller. Search runtime logs for the credential
service's exact wording distinguishing session-policy denials from role denials; a single occurrence
proves the intersection, not a transient. The same trap applies to key-management actions on
customer-managed-key-encrypted stores, which is why they are usually the first casualty and the
comment left behind after that fix is a reliable marker that the profile has this shape.

**False positives.** Actions the code issues only on an unreachable branch; profiles whose narrower
session policy is the deliberate fence and whose caller is expected to fail closed (confirm the
failure is handled as a decision, not an exception); and denials that are actually the role's, whose
fix belongs at the role.

## F:35 — A role-scoped credential wrapper hardcodes its own role family, silently overriding the per-profile role binding the policy registry declares

**Statement.** Platforms that vend per-request credentials usually keep a central registry mapping a
named profile to BOTH the role family it should assume and the session policy it should carry. Layer
or module wrappers are then written per role family for convenience, and each pins the role type it
was named for. When a caller reaches for a profile that belongs to a DIFFERENT family through one of
these wrappers, the wrapper's hardcoded family wins: the session is minted on the wrong role and
carries the right profile's policy. Nothing declares a conflict — the registry's role binding is
simply not consulted — and the resulting credential is the intersection of one role's grant with
another role's intended fence. It usually half-works, which is the danger: the wrong role happens to
allow the reads, so the path appears functional until the first write, which the wrong role never
had a reason to grant. The registry entry, meanwhile, still documents the correct binding, so every
reader of the configuration concludes the correct role is in use.

**Detect.** For each profile in the registry, record its declared role family; then find every code
path that requests that profile and determine which family the vending wrapper actually assumes —
read the wrapper's implementation, since the parameter is often absent from the call site entirely.
Live confirmation is exact and cheap: the assumed-role ARN and session name appear in the credential
service's own denial messages and in trace segments, so one real invocation shows which role was
minted. Then diff the two roles' grants against the operations the profile's code performs, and
flag every operation the actually-assumed role does not allow, not merely the one that failed first.
A gate belongs at the registry: a profile whose declared family differs from the family of every
wrapper that requests it is a build-time contradiction.

**False positives.** Registries whose role field is documentation rather than a binding (verify what
the vending code reads); deliberate escape hatches where a profile is intentionally usable from more
than one family and both roles carry the full grant; and single-family systems where the wrapper's
pin is the only binding there is.

## F:36 — A permission narrowing justified as "now unused" is validated against restart-free steady state, so a still-declared secret dependency detonates on the next cold start

**Statement.** An IaC change shrinks a principal's decrypt/read grant — dropping a KMS key or a
secret ARN from a policy — on the claim that the removed resource is no longer used. The claim is
checked against what is currently running: live traffic, healthy tasks, quiet dashboards. But
injected secrets are fetched only at task/container START, and the principal's own task definition
or launch template still names a secret encrypted under the dropped key. Long-lived workloads keep
serving on credentials fetched before the change, so the apply is green, the fleet is green, and no
runtime signal references the removed grant. The defect surfaces at the next restart — a scale-out,
a deploy, an instance replacement, often days later and usually inside an UNRELATED change's rollout
— as a start-time fetch failure on every new instance while the old ones keep serving. It reads as
"the new deploy is broken," not "an old grant was revoked," and the diagnosis happens under rollout
pressure instead of at the leisurely moment the narrowing landed.

**Detect.** For every ARN or key removed in an IAM diff, compute the union of secrets and parameters
referenced by that principal's OWN task definitions, launch templates, and env-injection blocks in
the same codebase, then resolve each referenced secret's encryption key. A removed key still
reachable from that union is the finding — no traffic analysis required or trusted. As the apply's
verification, restart one instance of each affected workload in a controlled window; steady-state
health after a grant narrowing verifies nothing.

**False positives.** Grants referenced by nothing in the principal's declared definitions — prove it
by describing the task definitions and launch templates, never by observing traffic; and narrowings
landed in the same change that repoints every consumer to the surviving key (the atomic form, which
is the correct shape).
