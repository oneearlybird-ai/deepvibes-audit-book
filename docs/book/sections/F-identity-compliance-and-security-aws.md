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
