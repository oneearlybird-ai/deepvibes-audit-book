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
