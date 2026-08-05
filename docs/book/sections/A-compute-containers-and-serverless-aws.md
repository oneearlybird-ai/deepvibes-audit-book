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

## A:35 — Lambda: Tenant-keyed warm-sandbox caches with TTL-on-read but no eviction or size bound

**Statement.** Handlers cache per-tenant artifacts (API tokens, config rows, SDK clients) in module-scope Maps keyed by tenant or resource id, checking a TTL only on the read path. Keys are never deleted and the Map has no size bound, so cardinality grows monotonically with the number of distinct tenants routed to the container over its lifetime; entries that expired are still retained, and heavy values (SDK clients holding socket pools) amplify the footprint. The result is a slow, unobservable memory leak proportional to tenant fan-in per container.

**Detect.** Module-scope `new Map()` caches keyed by tenant/customer/resource ids; `.set()` on miss or expiry; TTL comparison on read; absence of `.delete()` of expired keys, LRU wrapping, or a max-entry bound; values that hold clients or sockets rather than plain data.

**False positives.** Caches keyed by a small closed set (enum-like codes) where cardinality is structurally bounded; per-invocation maps; caches that evict-and-replace on the read path (stale entry removed when detected, so per-key at most one live value AND key cardinality is bounded by tenancy scale the deployment actually plans for); runtimes with aggressive container recycling documented as the bound.

## A:36 — Handler implements the partial-batch-failure contract but the event source does not enable it, so reported failures are discarded and the records are lost

**Statement.** A batch consumer is written correctly for partial-batch reporting: it wraps per-record
work in try/catch, collects the failed record identifiers, and returns the
`{ batchItemFailures: [...] }` envelope instead of throwing. The event source mapping, however, does
not declare the corresponding response type, so the runtime never reads that envelope. The
invocation is therefore recorded as a complete success: the queue deletes the whole batch, or the
stream checkpoint advances past the failed records. This is strictly worse than having no
partial-batch handling at all — the usual defect (missing the setting while the handler throws)
merely re-processes the batch, whereas this combination DELETES data. Every downstream safety net is
simultaneously disarmed, because bisect-on-error, retry-attempt limits, maximum-record-age, and the
on-failure destination all trigger only on a function error, and this function never errors. The
resource graph looks complete and defensible — there is a DLQ, there is a failure destination, there
are retries, there is an alarm — and not one of them can ever fire. The tell is usually a sibling:
the same handler bound to a second source WITH the response type declared, proving the omission was
an oversight rather than a design.

**Detect.** Do not audit the mapping and the handler separately — the defect exists only in their
pairing. For every event source mapping, read the handler's actual return path and classify it:
throws on failure, returns a batch-item-failure envelope, or returns success unconditionally. Then
compare against the mapping's declared response types. A handler returning the envelope while the
mapping omits the declaration is the finding. Read the LIVE mapping, not just IaC — the setting is a
common drift point. Where one handler serves several sources, diff the mappings against each other;
an unconditioned outlier among conditioned siblings is the finding. Confirm the blast radius by
checking whether the failure destination or DLQ has ever received anything despite the handler's
error log firing.

**False positives.** Handlers that build the envelope for logging but ALSO rethrow when it is
non-empty (the throw is what drives retry, so the mapping setting is genuinely optional); sources
that do not support partial-batch reporting at all; deliberate at-most-once lanes where dropping a
failed record is the documented, alarmed choice and the drop is counted in a metric.

## A:37 — Function imports a bare specifier that only a layer resolves, and the layer is not attached — every invocation dies at module load

**Statement.** Serverless runtimes let a shared layer publish packages onto the module resolution
path, so function code imports them by bare specifier exactly as if they were local dependencies.
Nothing in the function's own manifest records the dependency — that is the point of the layer — so
the import site carries no evidence of what must be attached for it to resolve. When the layer is
missing from the function's layer list, the failure is total and immediate: the module graph cannot
be constructed, so the handler never runs, no application log line is emitted from the function's
own code, and every invocation returns a generic platform error. The mistake is most likely when a
function is created by copying a sibling that already had the layer, when a lazy `await import()`
inside a dependency-builder hides the specifier from any static bundler check, and when the layer
list is maintained in infrastructure code far from the import. It survives review because both
halves are individually correct — the import is spelled right and the layer genuinely publishes the
package — and it survives testing because the suite resolves the same specifier from the repository
tree, where the package is a real directory. The runtime is the only place the two are ever joined.

**Detect.** Do not read the import list and the layer list separately; the defect exists only in
their pairing. For every function, extract every bare specifier it imports that is not in its own
manifest or the runtime's built-ins — including specifiers inside lazy `import()` calls, which are
the ones static tooling misses — and resolve each against the layer set actually attached to the
LIVE function, not the set declared in infrastructure code. Diff sibling functions that share a
dependency: an outlier missing one layer among peers that all carry it is the finding. Confirm the
blast radius from the platform's own error surface rather than the application's, because a
module-load failure produces no application log: a function whose logs contain only platform
init lines and no first-line-of-handler entry is failing before its own code runs.

**False positives.** Specifiers the runtime itself provides; packages genuinely vendored into the
deployment artifact as well as the layer, where resolution succeeds from the artifact; imports
inside a branch that is provably unreachable in the deployed configuration; functions whose
"missing" layer is attached at an alias or version qualifier the audit query did not resolve.

## A:38 — A correctness guard is held in process memory and justified by the fleet running one instance, but the instance runs a multi-worker process model, so the guard covers a fraction of the traffic it claims

**Statement.** A single-use, deduplication, or rate-limiting guard — a consumed-token ledger, an
idempotency-key set, a "seen this request id" cache — is implemented as an in-process data structure
and defended in review by a topology argument: the service is pinned to one instance, so every
request lands on the same box and the in-memory view is complete. The premise is true and the
conclusion does not follow. The instance runs a pre-forking or clustered server (one worker per
vCPU is the common default), so the box holds N independent processes, each with its own copy of the
structure, and the kernel distributes accepted connections across them. The guard therefore catches
only the collisions that happen to land on the same worker — roughly 1/N of them — while an actor
who simply retries walks the pool until admitted. The defect is invisible in every ordinary test: a
single-process test harness exercises exactly one copy, so unit tests, integration tests and local
runs all pass, and the guard demonstrably works when tried by hand. It is doubly durable because the
same codebase usually contains a NEIGHBOURING in-process structure that is genuinely correct —
per-connection or per-session state, where request affinity guarantees the owning worker also
handles every later event for that connection — and its correctness is cited as precedent for the
new one. The distinction is that per-connection state is only ever read by the worker that created
it, while a uniqueness guard is inherently cross-request: its whole purpose is for one request to
observe what a different request did, and there is no affinity between them.

**Detect.** Never accept an instance count as evidence about a process count; they answer different
questions. Read the process manager's configuration (cluster/worker/prefork directives, worker or
thread counts, "auto"/"max" settings that resolve to a CPU count) and confirm the deployed worker
count from the running system rather than the config — a per-boot startup line emitted once per
worker, counted for a single boot, is the cheapest proof, and an unexplained multiple of expected
startup or periodic-refresh log volume is often the first symptom noticed. Then, for every in-memory
structure that participates in a correctness decision, classify it: is it read only by the request
or connection that wrote it (affinity-safe), or is it read by a DIFFERENT request than the one that
wrote it (cross-request, and therefore wrong under multiple workers)? Uniqueness, idempotency,
replay, quota and lockout guards are always the second kind. Confirm the gap with a test that spawns
a genuinely separate process against the same store and asserts the second actor observes the first
— a test an in-process structure fails while passing every same-process test in the suite. Read the
guard's own comments last and trust them least: the topology justification is usually written by
the author of the defect, and a comment asserting completeness is the artifact under audit, not
evidence about it.

**False positives.** Servers genuinely running one process (worker count pinned to 1, or a runtime
whose concurrency is threads inside one address space sharing the structure); guards whose scope is
explicitly per-connection or per-session, where affinity holds by construction; structures that are
a performance cache in front of an authoritative shared store, where a miss is corrected rather than
admitted; deployments where the process manager routes by a stable key so the same identity always
reaches the same worker; and guards documented as best-effort defence in depth behind a primary
control that is itself complete — the failure is claiming completeness, not choosing a partial
mechanism knowingly.

## A:39 — Serverless: a subpath import that the runtime's resolver cannot extension-search, against a shared package that declares no `exports` map

**Statement.** A function imports a submodule of a shared dependency (a layer, a vendored package, a
workspace-local module) by a *subpath* specifier written without a file extension —
`import('shared-lib/registry')` where the file on disk is `registry.js`. If that package's manifest
declares no `exports` map, the ESM resolver performs NO extension search on subpaths: the specifier
resolves to a path that does not exist and the import throws `ERR_MODULE_NOT_FOUND`, frequently
reported against the *package* ("Cannot find package 'shared-lib'") rather than the missing file,
which sends the reader hunting for a packaging or attachment problem that does not exist. The same
specifier works unchanged under a bundler, under CommonJS `require`, and under any resolver that
does extension search, so it survives local runs, unit tests and build gates and fails only on the
deployed runtime. When the import sits inside a lazily-invoked accessor, the module still loads
clean and the throw lands at first invocation — so the function deploys green and dies on its first
real request. A scheduled or event-driven consumer with no synchronous caller then fails invisibly:
nothing waits on its response, and the only trace is a fault metric nobody has bound an alarm to.

**Detect.** Enumerate every subpath specifier of a first-party or layer-shipped package across the
codebase (`from '<pkg>/<sub>'` and `import('<pkg>/<sub>')`) and split them by whether they carry a
file extension. Any package where BOTH forms appear is the strongest signal: the extensionless one
is the outlier and the fleet's own majority convention is the correct form. Then read that package's
manifest — if there is no `exports` field, every extensionless subpath is broken on a strict ESM
resolver, full stop; if there IS an `exports` field, check that the specific subpath is mapped,
because an unmapped subpath is *also* a hard failure regardless of extension. Confirm on the
deployed artifact, never the repo: pull the runtime's own error log and look for
`ERR_MODULE_NOT_FOUND` / resolver hints of the form "Did you mean to import X.js?" — that hint is a
positive identification, because it proves the resolver found the directory and the file and
rejected only the specifier form. Treat a newly-introduced extensionless subpath in a change that
otherwise looks like a correctness improvement as high-risk: this defect is characteristically
introduced BY a fix, and the fix's own verification runs in an environment that resolves it.

**False positives.** Packages that declare an `exports` map covering the subpath, where the
extensionless form is the intended public API; bundled or transpiled deployment artifacts where the
specifier never reaches a Node resolver; TypeScript path aliases resolved at build time; runtimes
and loaders explicitly configured with extension-search or custom resolution hooks; and
CommonJS-only consumers, where `require` retains extension search and the form is legitimate.

## A:40 — A capability is wired into a function across several independent planes and landed plane by plane, so the function boots dead on whichever plane is still missing

**Statement.** Attaching one capability to a serverless function routinely requires changes in three
or more unrelated planes: an environment variable or runtime setting, an attached layer or sidecar
that supplies the file the setting names, and an identity grant that lets the running function reach
the service behind it. Nothing in the platform binds these together — they live in different IaC
files, often different stacks, and are frequently landed in different changes over hours or days.
Each partial state is accepted without error by the deploy: the function updates successfully, its
configuration is valid, and every gate that checks one plane in isolation stays green. The failure
appears only at execution, and it appears as an *initialization* failure rather than a logic one:
the sandbox exec dies before the handler loads when the wrapper path a setting names is not on the
filesystem (an exit-127 class error, with no application log line at all), or the boot-time config
fetch returns 403 and the process exits on a status the code never expected. Because the failure is
at init, per-invocation error handling cannot reach it and the function is 100% dead rather than
degraded — but only from the first invocation onward, so a low-traffic or event-driven function can
carry the defect for days before anything exercises it.

**Detect.** Do not audit the planes separately. For every function, assemble the full wiring set from
the live configuration and assert closure over it: for each runtime setting that names a filesystem
path (exec wrappers, extension entrypoints, preload hooks), prove that some attached layer actually
ships that path; for each sidecar or extension the function's boot path talks to, prove the
execution role carries the grant that sidecar's backing service demands; for each layer the function
declares, prove the code actually resolves against it. Then invert the check across the fleet — take
the population of functions carrying a given setting and diff their layer and policy sets; a
minority that differs is almost always an incomplete landing, not an intentional variant. Read the
recent history of the wiring: a capability introduced in one change and completed in a later one is
the characteristic shape, and the window between them is the exposure. Confirm at the runtime, not in
the repo: `Errors == Invocations` with no application log lines is the signature of an init-phase
death, and a function with zero recent invocations proves nothing about whether the wiring works.

**False positives.** Functions that legitimately declare a setting they do not exercise on every
path, where the dependency is genuinely optional and its absence is handled; canary or shadow
functions deliberately deployed with partial wiring; grants supplied through a boundary or
resource-based policy rather than the execution role, which a role-only sweep will not see; and
capabilities where the platform itself injects the missing plane at deploy time.
