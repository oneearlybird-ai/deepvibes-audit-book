---
section: AA
title: "AI Agent Infrastructure & Vector Database Operations"
group: saas-core
---

# [AA] AI Agent Infrastructure & Vector Database Operations

## AA:1 — Vector Leakage: Querying Shared Embeddings Indexes Without Active Metadata Partitioning

Vector Leakage: Querying Shared Embeddings Indexes Without Active Metadata Partitioning. Executing similarity lookups inside multi-tenant vector databases (e.g., Pinecone, Milvus) without passing explicit tenant ID isolation filters, allowing an AI agent search query to accidentally pull private data fragments from another tenant.

## AA:2 — Agent Exploitation: Allowing Unchecked Autonomous Tool Access to State-Mutating APIs

Agent Exploitation: Allowing Unchecked Autonomous Tool Access to State-Mutating APIs. Granting LLM-driven agents direct access to execute broad write operations based on unstructured language requests without requiring an explicit human-in-the-loop validation barrier for irreversible financial or systemic actions.

## AA:3 — Embedding Pollution: Storing Unsanitized Document Imports Inside RAG Knowledge Systems

Embedding Pollution: Storing Unsanitized Document Imports Inside RAG Knowledge Systems. Feeding unvetted user file uploads directly into vector extraction parsers, allowing embedded prompt-injection instructions hidden inside text documents to permanently compromise the systemic behavior of internal corporate AI agents.

## AA:4 — Model Exploitation: Unbounded Semantic Search Output Generation Cost Risks

Model Exploitation: Unbounded Semantic Search Output Generation Cost Risks. Running automated iterative generation loops against foundation models where the agent autonomously queries vector space without execution count ceilings, creating rapid token consumption loops and sudden cost spikes.

## AA:5 — Tool Scope: Agents granted broad state-mutating API surfaces for read-mostly tasks — bla…

Tool Scope: Agents granted broad state-mutating API surfaces for read-mostly tasks — blast radius unbounded.

## AA:6 — Memory: Conversation/agent memory persisting PII with no retention policy or erasure path

Memory: Conversation/agent memory persisting PII with no retention policy or erasure path.

## AA:7 — Citations: RAG answers without source attribution — unverifiable claims presented as fact

Citations: RAG answers without source attribution — unverifiable claims presented as fact.

## AA:8 — Index Drift: Embedding model upgraded without a full index rebuild — mixed vector spaces…

Index Drift: Embedding model upgraded without a full index rebuild — mixed vector spaces silently degrade retrieval.

## AA:9 — Deletion Sync: Source-document deletion not propagated to vector indexes — "deleted" con…

Deletion Sync: Source-document deletion not propagated to vector indexes — "deleted" content still retrievable.

## AA:10 — Execution: Agent output executed as code/SQL/shell without sandboxing or allowlisted ope…

Execution: Agent output executed as code/SQL/shell without sandboxing or allowlisted operations.

## AA:11 — Metadata Injection: Retrieved chunk metadata (filenames, titles) interpolated into promp…

Metadata Injection: Retrieved chunk metadata (filenames, titles) interpolated into prompts unsanitized.

## AA:12 — Evals: Prompt/model changes shipped without a regression evaluation suite — quality drif…

Evals: Prompt/model changes shipped without a regression evaluation suite — quality drift undetected.
