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
