---
section: H
title: "AI & Data Analytics (AWS)"
group: aws-backend
---

# [H] AI & Data Analytics (AWS)

## H:1 — Bedrock: Unsanitized user inputs passed directly into system LLM prompts without validat…

Bedrock: Unsanitized user inputs passed directly into system LLM prompts without validation, enabling Prompt Injection.

## H:2 — Bedrock: Missing AWS Bedrock Guardrails or toxic content filters on output generation

Bedrock: Missing AWS Bedrock Guardrails or toxic content filters on output generation.

## H:3 — Athena: Queries executed against unpartitioned S3 data layers, causing massive full-buck…

Athena: Queries executed against unpartitioned S3 data layers, causing massive full-bucket scans and cost spikes.

## H:4 — Bedrock: Absence of Input Rate Limiting Per API Key

Bedrock: Absence of Input Rate Limiting Per API Key. Exposing raw foundation model inference routes directly to downstream clients without tracking per-user token usage, allowing single users to exhaust regional model concurrency quotas.

## H:5 — Athena: Lack of Pre-computed View Layer Optimizations

Athena: Lack of Pre-computed View Layer Optimizations. Forcing business intelligence dashboards to issue raw SQL expressions against unstructured nested log formats rather than establishing a curated, performant data warehouse layer via AWS Glue or Iceberg tables.

## H:6 — Bedrock / SageMaker: Training or Fine-Tuning Models on Raw Customer PII

Bedrock / SageMaker: Training or Fine-Tuning Models on Raw Customer PII. Feeding unmasked multi-tenant transactional records directly into customized embedding steps, risking model inversion attacks where an attacker extracts sensitive user records via specific prompt strategies.

## H:7 — Bedrock: Model invocation logging enabled while prompts carry PII — sensitive data repli…

Bedrock: Model invocation logging enabled while prompts carry PII — sensitive data replicated into log storage.

## H:8 — Bedrock: No retry/backoff handling for ThrottlingException and no fallback model/region…

Bedrock: No retry/backoff handling for ThrottlingException and no fallback model/region strategy for capacity events.

## H:9 — LLM: System prompts embedding secrets, internal URLs, or tenant data — extractable via p…

LLM: System prompts embedding secrets, internal URLs, or tenant data — extractable via prompt-leak attacks.

## H:10 — LLM: Model output used to build SQL/shell/API calls without strict validation — indirect…

LLM: Model output used to build SQL/shell/API calls without strict validation — indirect prompt injection becomes code execution.

## H:11 — LLM: No per-request/per-tenant token ceilings — a single conversation can stream unbound…

LLM: No per-request/per-tenant token ceilings — a single conversation can stream unbounded output spend.

## H:12 — Glue/ETL: Jobs granted bucket-wide S3 access instead of dataset-scoped prefixes

Glue/ETL: Jobs granted bucket-wide S3 access instead of dataset-scoped prefixes.

## H:13 — Athena: Workgroups without per-query byte-scan limits or encrypted result locations

Athena: Workgroups without per-query byte-scan limits or encrypted result locations.

## H:14 — Data: Training/eval datasets and production write paths sharing buckets and roles — pois…

Data: Training/eval datasets and production write paths sharing buckets and roles — poisoning and leakage risks in both directions.

## H:15 — LLM: Nondeterministic outputs feeding pipelines that assume idempotent, schema-stable re…

LLM: Nondeterministic outputs feeding pipelines that assume idempotent, schema-stable responses — no normalization/validation layer.

## H:16 — Agents: Tool-call loops without execution-count ceilings — an agent can call the same to…

Agents: Tool-call loops without execution-count ceilings — an agent can call the same tool indefinitely.

## H:17 — Speaker-attribution error in a transcription pipeline promoted into durable customer identity by a downstream extraction step

**Statement.** A conversational pipeline transcribes a two-party exchange, labels each turn by
speaker (diarization), and feeds the labelled transcript to an extraction step that writes structured
facts — the customer's name, contact details, preferences — into the durable customer record.
Diarization is probabilistic, and its characteristic failure is attributing the SYSTEM's own turn to
the human: the automated agent introduces itself by its persona name, that line is labelled as the
customer's, and the extraction faithfully concludes the customer is named after the agent. Nothing
downstream can detect it, because the extraction step is doing its job correctly on the input it was
given, and the input is internally consistent. The result is worse than a dropped field: the customer
record is silently REWRITTEN with the system's own identity, that name propagates into every surface
reading the contact (call lists, CRM views, greetings on the next call, outbound addressing), and it
persists after the transcript that produced it is rotated away — so the corrupted record outlives its
own evidence. Because the persona name is a small closed set that the platform itself chose, the
corruption is systematic across every tenant using that persona rather than a scatter of one-off
errors.

**Detect.** Enumerate the persona/agent identities the platform can present — they are configuration,
so the set is knowable and finite — and query the customer datastore for identity fields matching any
of them; any hit is a confirmed instance, and the count tells you whether this is live or historical.
Then trace the extraction path and answer one question: between the diarized transcript and the
identity write, is there ANY step that could reject a persona name? A prompt that names the personas
and explains that a customer turn introducing itself with one is the system's own line is a mitigation
but not a control, because it is advisory to a probabilistic model; the control is a deterministic
post-extraction filter that strips known persona identities before the write, and its absence is the
finding. Check that the filter emits a distinguishable trace when it fires — silent stripping hides
the diarization defect's true rate and prevents anyone from noticing it worsening. Extend the check
past the name: any field the extraction can write from a misattributed turn (phone, email, stated
preferences, consent) inherits the same defect and needs the same boundary.

**False positives.** Pipelines where the speaker label is asserted by the transport rather than
inferred (separate audio channels per party, per-leg session identity), where misattribution is
structurally impossible; extraction that writes to a review queue rather than the durable record,
where a human boundary exists; systems whose personas are customer-chosen from an open namespace,
where a filter on persona names would strip legitimate customer names and the correct control is
attribution confidence rather than a deny-list; and single-party recordings where there is no
attribution decision to get wrong.
