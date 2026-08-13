---
section: E
title: "Integration, Messaging & APIs (AWS)"
group: aws-backend
---

# [E] Integration, Messaging & APIs (AWS)

## E:1 — SQS: Visibility timeout is configured shorter than the consumer Lambda's maximum executi…

SQS: Visibility timeout is configured shorter than the consumer Lambda's maximum execution time, causing immediate duplicate message processing.

## E:2 — SQS: Missing Dead-Letter Queue (DLQ) with appropriate maxReceiveCount limits for poison-…

SQS: Missing Dead-Letter Queue (DLQ) with appropriate maxReceiveCount limits for poison-pill messages.

## E:3 — SNS: Topic resource policies allowing sns:Publish from wildcard * principals

SNS: Topic resource policies allowing sns:Publish from wildcard * principals.

## E:4 — EventBridge: Rules use excessively broad wildcard matching ("source": ["*"]), risking in…

EventBridge: Rules use excessively broad wildcard matching ("source": ["*"]), risking infinite recursive execution loops.

## E:5 — API Gateway: Missing endpoint-level Usage Plans, Rate Limiting, or Throttling limits (Un…

API Gateway: Missing endpoint-level Usage Plans, Rate Limiting, or Throttling limits (Unbounded DoS vulnerability).

## E:6 — API Gateway: Endpoints lacking Custom Authorizers, Cognito validation, or IAM auth (Unin…

API Gateway: Endpoints lacking Custom Authorizers, Cognito validation, or IAM auth (Unintentionally public APIs).

## E:7 — Step Functions: State machines missing explicit Catch/Retry blocks (States.ALL) for tran…

Step Functions: State machines missing explicit Catch/Retry blocks (States.ALL) for transient downstream API exceptions.

## E:8 — SQS: Unconfigured Dead-Letter Queue Redrive Policies

SQS: Unconfigured Dead-Letter Queue Redrive Policies. Operating standard or FIFO queues with dead-letter fallback queues that lack automated redrive mechanisms or defined recovery runbooks, creating an unmonitored graveyard of unhandled transactions.

## E:9 — API Gateway: Missing Cache-Control Header Validations

API Gateway: Missing Cache-Control Header Validations. Accepting arbitrary consumer headers that force edge cache bypasses on static backend routes, allowing malicious clients to deliberately overwhelm backing Lambda layers via rapid cache-busting requests.

## E:10 — EventBridge: Missing Archive and Replay Infrastructure

EventBridge: Missing Archive and Replay Infrastructure. Designing decoupled, event-driven applications without configuring EventBridge Archives, rendering it impossible to replay or backfill missed events into downstream handlers during outages.

## E:11 — Step Functions: Infinite Loops via Self-Triggering State Mutations

Step Functions: Infinite Loops via Self-Triggering State Mutations. Designing execution paths where a state machine step alters an application database row that synchronously invokes the identical state machine, causing immediate runaway cost compounding.

## E:12 — SQS FIFO: All traffic funneled through a single MessageGroupId, serializing throughput t…

SQS FIFO: All traffic funneled through a single MessageGroupId, serializing throughput to one lane.

## E:13 — SQS: Short polling left enabled (WaitTimeSeconds=0), burning request costs and adding la…

SQS: Short polling left enabled (WaitTimeSeconds=0), burning request costs and adding latency versus long polling.

## E:14 — SNS→SQS: Raw message delivery disabled — consumers parse double-wrapped JSON envelopes t…

SNS→SQS: Raw message delivery disabled — consumers parse double-wrapped JSON envelopes that break on subtle format changes.

## E:15 — SNS: Delivery status logging disabled — failed fan-out deliveries are invisible

SNS: Delivery status logging disabled — failed fan-out deliveries are invisible.

## E:16 — EventBridge: Rule targets without DLQs — events silently dropped after the (invisible) r…

EventBridge: Rule targets without DLQs — events silently dropped after the (invisible) retry window lapses.

## E:17 — EventBridge: Event contracts unversioned and unregistered — producers and consumers drif…

EventBridge: Event contracts unversioned and unregistered — producers and consumers drift until production breaks.

## E:18 — API Gateway: Request validation models absent — malformed payloads reach Lambda and burn…

API Gateway: Request validation models absent — malformed payloads reach Lambda and burn compute before failing.

## E:19 — API Gateway: Access logging disabled on production stages, blinding incident forensics

API Gateway: Access logging disabled on production stages, blinding incident forensics.

## E:20 — API Gateway: Lambda resource policies with overly broad SourceArn wildcards, letting any…

API Gateway: Lambda resource policies with overly broad SourceArn wildcards, letting any stage/method invoke any function.

## E:21 — API Gateway/CORS: Reflecting arbitrary Origin values while sending Access-Control-Allow-…

API Gateway/CORS: Reflecting arbitrary Origin values while sending Access-Control-Allow-Credentials: true.

## E:22 — WebSocket API: $connect route without an authorizer — auth deferred to application messa…

WebSocket API: $connect route without an authorizer — auth deferred to application messages, leaving connections half-open and unauthenticated.

## E:23 — Step Functions: Standard workflows used for high-volume short executions (or Express for…

Step Functions: Standard workflows used for high-volume short executions (or Express for >5 min work) — the wrong type for the cost/duration profile.

## E:24 — Step Functions: Full payloads threaded between states toward the 256KB limit instead of…

Step Functions: Full payloads threaded between states toward the 256KB limit instead of passing S3 pointers.

## E:25 — Kinesis: Static shard counts under growing traffic; GetRecords.IteratorAgeMilliseconds u…

Kinesis: Static shard counts under growing traffic; GetRecords.IteratorAgeMilliseconds unmonitored until data expires unread.

## E:26 — EventBridge: consumer's accepted event vocabulary has no producer — a feature that can never fire

**Statement.** A consumer (rule target, handler switch, allowed-event set) enumerates event types that
no code anywhere emits. The lane looks complete — rule, target, permissions, handler, tests — but its
trigger set is empty vocabulary: the feature has silently never run. Common after an emitter is
deleted, renamed, or simply never built while the consumer shipped first.

**Detect.** For each detail-type/source a consumer accepts, search the entire producing estate
(services, jobs, tools, other lambdas) for a PutEvents/publish of that exact type. Zero producers =
flag. Confirm with runtime evidence: rule match metrics or consumer invocation counts since deploy.

**False positives.** Vocabulary reserved for a producer that is verifiably live in ANOTHER repo or
emitted by an AWS service itself (S3, Config, etc.); staged rollouts where the producer ships in the
same release train — verify the train, not the intent.

## E:27 — Step Functions: inter-state payload contract drift — states reference JSONPaths their predecessors do not produce

**Statement.** A state machine mutates its working payload via ResultPath/OutputPath per state, and a downstream state references a JSONPath that the actually-executed predecessor chain does not produce: a Catch without ResultPath replaces the entire input with the error object (destroying the ids cleanup states need — the failure then raises uncatchable States.Runtime), or a retry/alternate lane writes its outcome to a different ResultPath than the primary lane while shared downstream Choice/Task states read the primary path only. The defect is invisible until that specific branch executes in production.

**Detect.** Walk every state: build the set of payload paths available on ENTRY to each state per incoming edge (including Catch edges — a Catch without ResultPath yields ONLY the error object). Flag any Parameters/Choice/ResultSelector JSONPath not present on some feasible entry edge. Pay special attention to retry lanes duplicated from primary lanes with a different ResultPath, and to Catch blocks lacking ResultPath while their cleanup targets reference business ids.

**False positives.** Paths guaranteed present via the execution input on every edge; Catch targets that genuinely need only the error (pure Fail/notify states referencing nothing); Map/Parallel states whose inner scope intentionally shadows outer paths.

## E:28 — A resource rename leaves out-of-IaC event targets pointing at the pre-rename name, failing every invocation forever behind zero signal

**Statement.** A cleanup pass renames messaging resources — dropping a legacy prefix, restandardising
a queue or topic name — by editing the IaC and letting the new resource be created. Anything that
referenced the old name from OUTSIDE that IaC, typically rules and schedules created by hand during
an earlier phase, keeps its stale ARN. Because those references are unmanaged, no plan diff, no
apply, and no drift check ever visits them; the rename's own verification passes because everything
the IaC owns is consistent. The stale rule stays ENABLED and fires on schedule against a target that
no longer exists, so every single invocation fails permanently — not intermittently, not under load,
but 100% of the time from the moment of the rename. The failure is inert: a nonexistent target
produces a delivery failure rather than an application error, so no consumer logs anything, no
function errors, and no alarm keyed to the consumer can see it. If the target also lacks a
dead-letter configuration — usual for hand-created rules, since the DLQ pattern normally arrives with
the IaC — the payload is not merely undelivered but unrecoverable. These lanes are typically
discovered only by reading the scheduler's own delivery metrics, months later, and they are easy to
misread as healthy because the rule's trigger and invocation-attempt counts look completely normal:
only the failure counter distinguishes them.

**Detect.** Reconcile the live scheduler against the live resource inventory rather than against the
IaC: for every rule and schedule, resolve every target ARN and assert the target actually exists.
Then pull per-rule delivery metrics and flag any rule whose failure count equals its trigger count
over a long window — a sustained 100% failure ratio is the signature, and its duration dates the
regression. Cross-check each such rule against the IaC: a rule absent from every stack is
unmanaged and will not self-heal. Treat rename/migration scripts as a map of where to look — every
old→new pair in one is a candidate for a dangling reference somewhere outside the tree the script
edited. Also confirm whether the surviving consumer would even accept the payload: a renamed target
that was repointed but whose consumer no longer dispatches that job type is the same dead lane with
one more layer of disguise.

**False positives.** Rules deliberately left disabled; targets in another account or region that the
inventory query did not cover; rules whose failures are genuinely intermittent rather than total —
check the ratio, not the raw count; short windows immediately following a deployment where the
target is mid-creation.

## E:29 — Fan-out notification chain with no failure capture at any layer, carrying a legally-mandated signal

**Statement.** A regulator-facing or otherwise legally-mandated inbound signal — an unsubscribe
keyword, a consent revocation, a deletion request — is delivered through a pub/sub topic to a single
handler, and no layer of that chain can capture a failure. The subscription carries no redrive policy,
so the broker drops the message once its built-in retries are exhausted. The function has neither a
dead-letter target nor an on-failure destination, so the asynchronous runtime drops it too. And the
handler catches its own per-record errors and returns success, so neither of those mechanisms is ever
reached in the first place — the broker records a successful delivery, the runtime records a
successful invocation, and the only trace of the lost obligation is a log line nobody is alarmed on.
The three gaps are individually forgivable and jointly fatal: each layer's designers could reasonably
assume one of the others would catch it. The severity is set by what the signal means rather than by
volume, because a single dropped opt-out converts every subsequent message to that recipient into a
separate statutory violation, and the platform will keep sending precisely because it never learned
to stop. The configuration that makes this lethal is usually one flag elsewhere declaring that the
platform, not the provider, owns the obligation.

**Detect.** Start from the obligation, not the topology: find the flag that decides whether the
platform or the upstream provider processes the keyword or request, and if the platform owns it,
trace that signal's entire path. At each hop demand a named failure sink — subscription redrive
policy, function dead-letter or on-failure destination, handler error propagation — and confirm each
against LIVE configuration, since all three are absent-by-default and none appears in a
happy-path test. Then close the loop: read the handler's catch blocks and establish whether any
failure can reach the sinks that do exist. Where the handler swallows, the sinks are decorative
regardless of how they are configured.

**False positives.** Chains where the provider retains the obligation (auto-processed opt-outs) and
the handler is advisory only; signals reconciled by an independent periodic sweep that would recover
a dropped message, where that sweep is itself verified; handlers that swallow only after durably
recording the obligation, so the swallow follows the commit rather than replacing it.

## E:30 — Orchestrator promotes a downstream secret into workflow state, and execution-data logging persists it to history and logs

**Statement.** A workflow step provisions a credential — a sub-account token, an API key, a
short-lived password — and the orchestrator lifts that value out of the step's result into its own
working state so a later step can consume it. The state machine is separately configured to record
execution data, which is normal and usually desirable for debugging, and the two decisions combine
into a durable plaintext copy of the credential in two places nobody thinks of as a secret store:
the orchestration service's own execution history, readable by anyone who can describe executions,
and the log group it writes to, readable by anyone holding a broad log-read grant. Both persist far
beyond the workflow, and neither is covered by the secret-manager rotation story that the credential
otherwise has. Encryption at rest does not mitigate it, because the exposure is to authorized-but-
unintended readers rather than to storage. The pattern is made much worse by a catch-all failure
handler that forwards the entire state for diagnostics, which copies the credential again into every
failure record. The giveaway is that the secret has exactly one legitimate consumer — the step that
writes it to the real secret store — so it never needed to traverse the orchestrator at all.

**Detect.** Read every result-mapping in the workflow definition and list the fields it promotes into
state, flagging any whose name or provenance indicates a credential; then check whether execution
data logging is enabled and at what level. Confirm on the live system rather than inferring: pull a
real execution's history and search it for the field name, and grep the log group for the value's
shape. Trace each flagged field to its consumers — a secret with a single downstream consumer should
be passed inside the producing step, not through the orchestrator. Finally, inspect failure paths for
whole-state forwarding, which re-exposes every field the happy path carried.

**False positives.** Values that merely look like credentials but are non-secret identifiers
(account SIDs, public keys, resource ids); workflows with execution data logging disabled AND
history access restricted to a break-glass role, where that restriction is verified; references to a
secret (an ARN or a version id) rather than its material.

## E:31 — Deployed API route whose integration targets compute that no longer exists

**Statement.** A route on a deployed API — REST, HTTP, or WebSocket — carries an integration whose
URI names a function or service that has since been deleted or renamed. The route remains fully
routable: DNS resolves, the gateway accepts the request, auth runs, and then integration dispatch
fails with a 5XX minted by the gateway itself. Because the target never executes, its own telemetry
— invocations, errors, logs — stays at zero, so the standard "is anything wrong with this function"
dashboards show a resource that looks merely idle. The pattern arises when compute is deleted out
from under an API surface that nothing re-validates: the deletion succeeds because the platform does
not reference-count integration URIs, and the API keeps advertising a contract it can no longer
serve. Sibling mechanisms: out-of-IaC event targets after a rename (E:28) and dangling DNS (C:13) —
this is the API-integration limb of the same family.

**Detect.** Export every deployed API's routes WITH integrations (not the IaC's intent — the live
export), parse each integration URI to its target identity, and join against the live inventory of
that target type. Any route whose parsed target has no live counterpart is a confirmed hit — no
traffic test needed; the config alone proves the 5XX. Cover v2/WebSocket APIs too: tooling that only
models REST integrations misses them.

**False positives.** Integrations that intentionally point at cross-account or cross-region targets
your inventory does not include (resolve the target in ITS account before flagging); mock
integrations (no target by design); routes behind a feature gate that the owner documents as
awaiting a target that ships in the same change set.

## E:32 — API route target exists but lacks the gateway's invoke grant, so the gateway 5XXs before the function ever runs

**Statement.** A route's integration points at a real, healthy function — but the function's
resource policy does not (or no longer does) grant the gateway service permission to invoke it for
this API. Every call fails inside the gateway with a 5XX and a permissions error only visible in
gateway-side logs; the function is never invoked, so its metrics and logs remain empty. The trap has
two halves. First, the failure is invisible from the function's side — zero invocations reads as
"unused", which is precisely the opposite of the truth ("every use fails"). Second, the grant and
the function have different lifecycles: deleting and recreating a function silently discards its
resource policy while the route keeps pointing at the (new) function, so a rebuild or rename that
"changed nothing" severs every route wired to it. Alias-qualified integrations sharpen it further:
a grant on the unqualified function does not satisfy an alias-qualified invocation and vice versa,
so a policy can exist and still not be the one the route needs.

**Detect.** For every live route integration, fetch the target's resource policy for the exact
qualifier the integration URI names (alias, version, or unqualified) and require a statement whose
principal is the gateway service and whose source condition matches the fronting API's identity.
Absence of a policy, absence of a gateway statement, or a source that names other APIs but not this
one are all confirmed hits. Zero invocation counts on the target corroborate but never clear it —
silence is the symptom, not the exoneration.

**False positives.** Integrations that authenticate with an execution role on the integration
itself (credentials-based invoke needs no resource policy — check the integration's credentials
field first); targets invoked through a private link or service mesh where authorization is
enforced by a different layer that you have verified actually grants the gateway.

## E:33 — Merge-only API deployment mode never deletes, so removed routes and empty resources accumulate as permanent live drift

**Statement.** The IaC deploys the API definition in a merge mode: present paths are created or
updated, but paths absent from the source are never removed from the live API. Every route deletion
in source silently becomes a no-op live — the deployed API is the union of every definition ever
applied. Over time the live surface accretes ghost routes that still execute old handlers,
method-less resource stubs left when a route family was retired, and an inventory that no longer
matches any version of the source. IaC-vs-live diffing normalizes to "in sync" because the tool only
asserts what should exist, not what should not. The residue is not cosmetic: ghost routes are
reachable attack surface with whatever auth they last had, and they anchor drift baselines that grow
monotonically.

**Detect.** Read the deployment mode in the IaC (merge vs overwrite semantics). Then diff the live
route inventory against the current source-of-truth definition in BOTH directions: source-minus-live
shows unapplied intent, live-minus-source shows the accumulated ghosts. Method-less leaf resources
in the live tree are the fossil record of merge-mode deletions and are hits on their own.

**False positives.** Merge mode chosen deliberately to compose one API from multiple ownership
boundaries — legitimate only when a compensating reaper (a job or verifier that enumerates and
deletes live-minus-source residue) demonstrably exists and runs; routes intentionally live-managed
outside IaC that are tracked by an explicit, shrinking baseline with a gate that blocks new drift.

## E:34 — Event-bus input-transformer template authored through a JSON encoder that escapes angle brackets — placeholders never substitute

**Statement.** Input-transformer templates reference their variables as `<name>`, but the IaC or
codegen path builds the template string through a JSON encoder that escapes `<` and `>` to their
six-character unicode escape sequences (backslash-u-0-0-3-c / backslash-u-0-0-3-e — several
encoders, including HCL's jsonencode, do this by default as an HTML-safety measure). The bus stores the
escaped form, so the literal placeholder token never appears and substitution never occurs: every
delivery carries the template verbatim, with unresolved placeholder text where data should be. The
target API then rejects on missing/null required fields (filling a DLQ with byte-identical bodies)
— or worse, accepts placeholder text as data. Every target authored by the same encoder fails
identically, silently, from birth; nothing errors at plan or apply time.

**Detect.** Read the RAW template back from the bus API (not from source) and search for the
unicode escape of `<` (the literal five characters u003c preceded by a backslash). Sample the
target's DLQ: many messages sharing one body hash is the signature, and the bodies show the
unsubstituted `<name>` tokens escaped that same way. Cross-check the downstream API's error
(null/missing required members named in the template). Sweep every rule authored by the same
encoding path — the defect is per-encoder, not per-rule.

**False positives.** Encoders configured not to escape HTML characters; templates that use no
placeholders (static payloads); transformations expressed purely through input paths, which have no
angle-bracket syntax.

## E:35 — Stream handler wraps deterministic record validation and transient I/O in one try/catch that reports every throw as a retryable batch-item failure, so one malformed record becomes an ordered-shard poison pill

**Statement.** Ordered stream consumers report per-record failures back to the event-source mapping
so the failed record alone is redriven. The classification of a failure as retryable is therefore a
correctness decision, not a logging detail. A handler that encloses BOTH the record's parse/validate
step and its downstream I/O in a single `try` and, in the `catch`, reports the record as a batch-item
failure, has silently asserted that every possible throw is transient. Validation throws are not:
they are a pure function of the record's own bytes, so the redrive re-runs the identical computation
and fails identically until the mapping's retry budget is exhausted. Because the shard is ordered,
every later record behind the poison pill is blocked for the whole retry sequence, so a single
malformed row converts into a shard-wide stall whose duration is set by the retry policy, and then
into a dead-letter record that requires manual handling. The comment above such a `catch` usually
states the assumption explicitly ("infrastructure failure — retryable by definition"), which is true
of the I/O the author was thinking about and false of the parser the same `try` also covers. The
tell-tale artifact is a handler that computes its own retryable/permanent tally and still reports a
failure count larger than the retryable count — the code already knows the failure is permanent and
asks for a retry anyway.

**Detect.** For each stream handler, list every statement inside the `try` whose failure is a
deterministic function of the record (schema validation, id/format assertions, key construction,
enum mapping, required-field checks) and confirm each one is either outside the retry-reporting path
or classified as permanent before the report is built. Compare the handler's own counters in its
completion log: a run where the permanent-failure count is non-zero while the retryable count is zero
AND the reported batch-item-failure count is non-zero is the defect, observable without reading the
code. Then confirm the consequence from the mapping's failure destination — a dead-letter record
whose condition is retry-exhaustion while the function's own response status was success means the
retries were spent on a computation that could never succeed. Check the shard's processing latency
across the retry window to size the stall.

**False positives.** Handlers whose validation genuinely depends on mutable external state (a schema
registry, a feature flag, a reference table), where a re-read can legitimately change the outcome;
pipelines with a bisect-on-failure setting that isolates the poison record by design; consumers where
the retry budget is deliberately set to zero or one so the record reaches the dead-letter path
immediately and ordering is explicitly not guaranteed; unordered consumers, where a blocked record
delays nothing behind it.

## E:36 — Async handler treats a nonexistent-tenant authorization denial as transient, so an undeliverable event burns the retry budget and permanently latches the dead-letter alarm

**Statement.** An event-driven handler resolves per-tenant credentials before doing work — assuming
a tenant role, building a scoped client, reading a tenant-scoped key. When the tenant does not
exist, that resolution fails with an authorization denial from the identity service, which is
indistinguishable by type from the denial raised by a genuinely transient condition. If the handler
lets it propagate undifferentiated, the async invoker's contract treats the throw as retryable and
replays the event for its whole retry budget, recomputing an identical failure each time, then parks
it in a dead-letter queue. Three costs follow. The retry budget is spent on an event no retry can
ever deliver. The queue accumulates permanently-undeliverable messages that no redrive can clear, so
its depth alarm latches and stays latched. And that alarm can no longer distinguish undeliverable
residue from a real, recoverable failure on the same path — which, for a money, fulfilment, or
provisioning handler, is precisely the signal that must remain trustworthy. The raised error names
the identity resource rather than the missing tenant, so triage is pulled toward a permissions
theory and away from the event's addressing.

**Detect.** Find every per-tenant credential resolution on an async path and ask what a failure
means when the tenant identifier is unknown or synthetic. Read the outermost catch: if authorization
denials propagate without classification, the classification is absent — the handler has asserted
that every denial is transient. Inspect dead-letter CONTENTS, not depth: a message whose recorded
failure is an identity denial naming a resource absent from the live inventory is permanent by
construction. Check whether the queue's alarm has any means of separating undeliverable residue from
live incidents, and whether anything but a human can ever drain it.

**False positives.** Paths where the tenant's identity is provisioned asynchronously and a denial
genuinely is transient inside a provisioning window, provided the retry budget exceeds that window
and the handler documents it; queues that are deliberately human-adjudication surfaces with a named
owner, where parking the event is the designed outcome rather than a failure.

## E:37 — The gateway serves a deployment snapshot, so a route created by a different stack's apply stays unreachable until something changes the snapshot's redeploy trigger

**Statement.** Snapshot-deployment API gateways separate the *definition* of a route from the
*deployment* that serves it: creating the resource, method and integration changes nothing a client
can reach until a new deployment is cut and the stage is pointed at it. IaC models the deployment as
a resource whose recreation is driven by a trigger — typically a hash over the route set the
deployment's own stack knows about. When routes are declared in a different stack from the
deployment (a capability stack adding a provider webhook, a domain stack adding an endpoint), that
trigger does not observe them, so the route-creating apply succeeds, the console and the IaC both
show the route existing, and the live stage keeps serving the older snapshot. The symptom is a
gateway-level rejection rather than an application error — a missing-authentication-token or
missing-route response on the new path while sibling paths on the same base resource answer
correctly — which reads as an auth or integration bug and sends the investigation to the wrong
plane entirely. The defect recurs once per cross-stack route forever, because nothing about the
successful apply signals that the route is not being served.

**Detect.** Never accept the IaC or the control-plane resource listing as proof a route is live:
probe the deployed stage itself and compare the new path against a known-good sibling on the same
parent resource — a gateway-level rejection on one and a normal application response on the other is
positive identification. Then read the deployment resource's trigger expression and enumerate which
stacks contribute routes to the same gateway; any route defined outside the trigger's field of view
is exposed. Check the stage's last-updated timestamp against the route's creation time: a stage
older than the route is the defect, stated in two facts. In a multi-stack layout, the durable form of
the check is a cumulative trigger that every route-contributing stack writes into, plus a
post-apply smoke probe of newly added paths — treat "the apply succeeded" as evidence about the
control plane only.

**False positives.** Gateways in auto-deploy mode, where every configuration change is served
immediately; routes intentionally staged ahead of their cutover; paths that are rejected for a
genuine authorization reason rather than absence, which the response code and the access log
distinguish; and canary deployments where the old snapshot is deliberately still serving a share of
traffic.

## E:38 — The downstream API demands an explicit "there is none" declaration where the upstream provider simply omits the field, and the client omits instead of declaring

**Statement.** An integration client relays a third-party response into a persistence or brokerage
API. The upstream population is heterogeneous: most providers return the optional field (an expiry,
a scope, a cursor) and a minority return nothing at all. The downstream API does not accept silence
as an answer — it requires either the value or an explicit sentinel asserting the value's absence,
and it rejects a payload carrying neither. A client written against the majority simply forwards the
field when present and omits it when absent, so it works for every provider that returns a value and
hard-fails for exactly the subset that does not. The failure lands at the *last* step of an otherwise
fully successful flow — consent granted, code exchanged, credentials received — so the user
experiences a complete success followed by an unexplained failure, and the logs attribute it to the
storage step rather than to the payload shape. Per-provider blast radius means it can persist
indefinitely while the integration is judged healthy on the providers that happen to be exercised.

**Detect.** Read the downstream API's contract for every optional field the client relays and note
which ones have a required-sentinel rule; then read the client and check what it does when the
upstream value is absent — an `if (value) body.field = value` with no else branch is the defect
shape. Enumerate the provider population and classify each by whether it returns the field: the
providers that do not are the exposed set, and the fix must be verified against one of them
specifically. Search runtime logs for the downstream API's own validation error code scoped by
provider — a rejection that appears for a stable subset of providers and never for the others is
positive identification. Tests must pin BOTH body shapes against the real wrapper; a fixture built
only from a value-returning provider cannot fail.

**False positives.** Downstream APIs that genuinely treat omission as the sentinel; fields the client
is documented to derive rather than relay; providers whose absent field is legitimately fatal and
should be rejected upstream; and SDKs that inject the sentinel themselves below the client code.

## E:39 — The reuse key is composed from unbounded user text, so the provider's field cap fails the existence LOOKUP and the create is never attempted

**Statement.** A caller mints resources at an external provider idempotently by composing a
deterministic key from a stable internal identifier plus human-readable display text — display name
followed by the internal id in brackets — and then reuses that key on both sides of the flow: it
queries the provider filtered by the key to find an existing resource, and it creates with the key
when none is found. The display component is user-supplied and unbounded while the provider caps
that field's length, so a sufficiently long input pushes the composed key past the cap. The subtle
part is which call fails first: the provider validates the field on the filter parameter of the
list or search call as well as on create, so the existence lookup errors out before the create is
reached. Code that correctly treats a lookup failure as fatal — refusing to create a possible
duplicate on an inconclusive read, which is the right instinct — then marks the whole provisioning
permanently failed for an input whose only sin was being verbose. The repair is to cap the composed
key inside the key builder, yielding the display prefix and never the identity suffix, so that
inputs short enough to fit compose byte-identically to the pre-cap shape and every resource minted
before the cap still resolves.

**Detect.** Find every function that composes an external-system key or name from more than one
part, and classify each part as bounded — internal id, enum, hash — or unbounded — business name,
user display name, free text. For each, read the provider's documented cap on that field, then check
both call sites, because a cap enforced on a search or list filter is the failure that hides: search
for the key builder's callers and confirm the read path passes the same composed value. Trace what
the caller does when the lookup throws — a fatal-on-inconclusive-read path, correct on its own,
turns this into a hard provisioning failure rather than a duplicate. Fault traces and provider error
codes for length violations, clustered on a single unusually long input, are the live confirmation.

**False positives.** Keys whose unbounded component is already validated against a shorter cap at
the point of entry, where the validator's bound is verified to be at or below the provider's and
enforced on every writer; providers that silently truncate rather than reject — still worth noting
where truncation could collide two distinct inputs onto one key, but not this failure; composed
values used only for display and never as a lookup filter.
