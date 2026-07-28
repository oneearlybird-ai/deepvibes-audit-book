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
