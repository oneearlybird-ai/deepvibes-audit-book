---
section: A
title: "Compute, Containers & Serverless (AWS)"
group: aws-backend
---

# [A] Compute, Containers & Serverless (AWS)

## A:1 — EC2: Instance Metadata Service v1 (IMDSv1) is enabled

EC2: Instance Metadata Service v1 (IMDSv1) is enabled. Must enforce IMDSv2 (token-based) to prevent SSRF credential theft.

## A:2 — EC2/ASG: Auto Scaling Group lacks scale-in protection during stateful processing, riskin…

EC2/ASG: Auto Scaling Group lacks scale-in protection during stateful processing, risking termination of active background jobs.

## A:3 — Lambda: Missing a Dead-Letter Queue (DLQ) or On-Failure Destination for asynchronous inv…

Lambda: Missing a Dead-Letter Queue (DLQ) or On-Failure Destination for asynchronous invocations (silent message drops).

## A:4 — Lambda: Unbounded concurrency (Missing Reserved Concurrency limits), creating massive Do…

Lambda: Unbounded concurrency (Missing Reserved Concurrency limits), creating massive DoS and downstream DB connection-pool exhaustion risks.

## A:5 — Lambda: Hardcoded secrets in environment variables instead of dynamically resolving AWS…

Lambda: Hardcoded secrets in environment variables instead of dynamically resolving AWS Secrets Manager or SSM Parameter Store ARNs.

## A:6 — Lambda: Over-permissioned Execution Role (e.g., using Action: "*" or Resource: "*" inste…

Lambda: Over-permissioned Execution Role (e.g., using Action: "*" or Resource: "*" instead of tightly scoped least-privilege ARNs).

## A:7 — ECS/EKS: Task Definitions or Pods running containers as the root user without readonlyRo…

ECS/EKS: Task Definitions or Pods running containers as the root user without readonlyRootFilesystem enabled.

## A:8 — ECS (Fargate): Containers mapped directly to public IP addresses instead of residing in…

ECS (Fargate): Containers mapped directly to public IP addresses instead of residing in private subnets utilizing VPC Endpoints/NAT.

## A:9 — Lambda: Ephemeral Storage (/tmp) Data Persistence Leakage

Lambda: Ephemeral Storage (/tmp) Data Persistence Leakage. Reused Lambda execution contexts retain data in /tmp across invocations, risking cross-tenant data leaks if temporary files containing multi-tenant user data are not explicitly purged before function termination.

## A:10 — Lambda: Lack of VPC Endpoints for Private Subnet Lambdas

Lambda: Lack of VPC Endpoints for Private Subnet Lambdas. Functions running inside custom VPC subnets routing traffic through NAT Gateways to hit core AWS services, incurring heavy data processing penalties and NAT traversal latency instead of using private VPC Interface Endpoints.

## A:11 — ECS (Fargate): Missing Storage Encryption on Ephemeral Volumes

ECS (Fargate): Missing Storage Encryption on Ephemeral Volumes. Task definitions processing highly confidential or regulated data failing to enforce KMS encryption on localized Fargate task scratch space or container storage volumes.

## A:12 — EC2/ASG: Missing Instance Refresh Policies for Automated Patching

EC2/ASG: Missing Instance Refresh Policies for Automated Patching. Auto Scaling Groups running static, long-lived AMIs without scheduled instance refreshes, leaving underlying container hosts or compute instances vulnerable to zero-day OS kernel exploits.

## A:13 — ECS/EKS: Absence of Container Resource Limits (cpu/memory)

ECS/EKS: Absence of Container Resource Limits (cpu/memory). Microservices deployed without hard memory limits or CPU allocations, enabling an isolated software memory leak or compute loop in one container to completely starve adjacent tasks on the same cluster node.

## A:14 — App Runner / Elastic Beanstalk: Unconfigured HTTP-to-HTTPS Redirection

App Runner / Elastic Beanstalk: Unconfigured HTTP-to-HTTPS Redirection. Platform-as-a-Service environments exposing default unencrypted port 80 web interfaces without custom configuration profiles forcing immediate global protocol updates to secure port 443.

## A:15 — Lambda: Latency-critical synchronous endpoints lacking Provisioned Concurrency, exposing…

Lambda: Latency-critical synchronous endpoints lacking Provisioned Concurrency, exposing users to multi-second cold starts under bursty traffic.

## A:16 — Lambda: Oversized deployment packages and unused layers inflating cold-start init time a…

Lambda: Oversized deployment packages and unused layers inflating cold-start init time and approaching hard size quotas.

## A:17 — Lambda: Function timeout configured longer than the API Gateway 29s integration limit, d…

Lambda: Function timeout configured longer than the API Gateway 29s integration limit, doing work whose result the client can never receive.

## A:18 — Lambda: Recursive invocation loops (e.g., S3-triggered function writing back into the sa…

Lambda: Recursive invocation loops (e.g., S3-triggered function writing back into the same bucket/prefix) with no recursion-detection guard.

## A:19 — Lambda: Missing X-Ray/OpenTelemetry tracing on functions participating in multi-hop chai…

Lambda: Missing X-Ray/OpenTelemetry tracing on functions participating in multi-hop chains, making latency attribution impossible.

## A:20 — Lambda: Init-phase "load once at boot" caching of secrets/clients in the warm sandbox wi…

Lambda: Init-phase "load once at boot" caching of secrets/clients in the warm sandbox without TTL-based refresh, breaking secret rotation.

## A:21 — Lambda: Deprecated or EOL-approaching runtimes still deployed in production

Lambda: Deprecated or EOL-approaching runtimes still deployed in production.

## A:22 — Lambda: Function URLs configured with AuthType: NONE, exposing direct unauthenticated in…

Lambda: Function URLs configured with AuthType: NONE, exposing direct unauthenticated invocation paths that bypass API Gateway controls.

## A:23 — Lambda: Event source mappings without partial-batch responses (ReportBatchItemFailures),…

Lambda: Event source mappings without partial-batch responses (ReportBatchItemFailures), re-processing the entire batch when a single record fails.

## A:24 — Lambda: Async invokes missing MaximumEventAge/MaximumRetryAttempts tuning, replaying hou…

Lambda: Async invokes missing MaximumEventAge/MaximumRetryAttempts tuning, replaying hours-old stale events after a recovery.

## A:25 — ECS: Secrets passed as plaintext environment variables in task definitions instead of th…

ECS: Secrets passed as plaintext environment variables in task definitions instead of the `secrets` block referencing Secrets Manager/SSM.

## A:26 — ECS: Container health checks missing or misaligned with ALB target group health checks,…

ECS: Container health checks missing or misaligned with ALB target group health checks, causing routing to dead tasks or restart loops.

## A:27 — EKS: Cluster API endpoint publicly accessible without CIDR restriction or private-endpoi…

EKS: Cluster API endpoint publicly accessible without CIDR restriction or private-endpoint enforcement.

## A:28 — EKS: Pods using the node instance role instead of IRSA/Pod Identity, granting every pod…

EKS: Pods using the node instance role instead of IRSA/Pod Identity, granting every pod the union of all node permissions.

## A:29 — EC2: Launch templates not enforcing encrypted EBS root volumes, leaving sensitive scratc…

EC2: Launch templates not enforcing encrypted EBS root volumes, leaving sensitive scratch data unencrypted at rest.

## A:30 — EC2: SSH key pairs and open SSH daemons still present on instances instead of SSM Sessio…

EC2: SSH key pairs and open SSH daemons still present on instances instead of SSM Session Manager-only access.

## A:31 — Compute: Missing SIGTERM/graceful-shutdown handling, dropping in-flight requests on ever…

Compute: Missing SIGTERM/graceful-shutdown handling, dropping in-flight requests on every deploy and scale-in event.

## A:32 — Fargate: Task platform version unpinned or stale, silently picking up breaking platform…

Fargate: Task platform version unpinned or stale, silently picking up breaking platform changes untested.

## A:33 — Lambda: Multiple unrelated responsibilities packed into one "do-everything" function, co…

Lambda: Multiple unrelated responsibilities packed into one "do-everything" function, coupling failure domains and bloating IAM scope.

## A:34 — Compute: AMI/image pipeline lacking automated rebuild on upstream CVE disclosure (golden…

Compute: AMI/image pipeline lacking automated rebuild on upstream CVE disclosure (golden image rot).
