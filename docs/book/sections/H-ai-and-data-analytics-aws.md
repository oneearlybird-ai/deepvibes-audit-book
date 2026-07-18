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
