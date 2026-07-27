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

## AA:13 — Dead capability: agent tool registered and callable but never referenced by any prompt or workflow

**Statement.** A tool is wired into the agent's tool surface (registered on the server, auto-approved by
the platform) but no system prompt, workflow node, or instruction anywhere tells the agent when to use
it. LLM agents overwhelmingly invoke only tools their instructions reference — the capability is
silently dead, and every downstream pipeline it feeds (events, consumers, ledgers) idles at zero
while looking "deployed" on every infrastructure check.

**Detect.** For each registered tool, search the FULL rendered instruction surface — server-side prompt
builders, per-agent platform config, workflow node prompts, first-messages — for a reference to the
tool's purpose or name. Zero references = candidate. Then confirm with runtime evidence EITHER WAY:
consumer-side invocation counts or event emissions since the tool shipped. An instruction may EXIST
yet be non-binding — a standalone section the model skips while a competing flow (e.g. an aggressive
call-closing sequence) carries it past the trigger point. Zero invocations over a meaningful call
volume convicts the instruction surface even when the text is present; the fix is binding the step
into a flow the model demonstrably executes, not adding more prose.

**False positives.** Tools invoked programmatically (not by the LLM); tools whose triggering instruction
lives in dynamic variables or retrieved knowledge that IS delivered at runtime — trace the actual
rendered context before flagging.

## AA:14 — The instruction set that drove an agent's customer-facing actions is not retained per interaction

**Statement.** An agent's runtime instructions are assembled per interaction from several
independently mutable sources — shared reference text, per-tenant configuration, per-caller flags,
capability toggles, wall-clock date — sent to the model, and then discarded. The transcript, the
recording, the outcome, and the billing record are all retained; the instructions that produced them
are not, not even as a content digest with resolved source versions. When a customer disputes what
the agent promised, when quality regresses after any upstream source is edited in place, or when a
reviewer asks what the automated agent was actually told on a specific interaction, the answer is
unreconstructable: the sources have since changed and nothing recorded which versions applied.
Recording the assembled prompt's LENGTH is the usual half-measure and proves nothing about content.

**Detect.** Trace the assembly function to its call site and read what is persisted alongside the
interaction record — the rendered instructions, a digest plus resolved source versions, or nothing.
Grep the persistence writer for a prompt or digest field; a length-only log is a negative result.
Then establish that the sources are independently mutable (reference rows editable in place, tenant
config editable, toggles flippable): mutable sources plus no snapshot means the interaction cannot
be reconstructed even from backups of the sources.

**False positives.** Wholly static instructions pinned to a released artifact whose version id IS
persisted per interaction; systems that persist a digest AND keep every source row immutably
versioned, so the exact text is recoverable by replay; interactions where regulation requires the
instructions NOT be retained (name the regulation).

## AA:15 — Untrusted text fenced into a prompt by a literal delimiter the untrusted text is free to emit — a forgeable boundary read as isolation

**Statement.** Untrusted content — a transcript, a document, a user message — is interpolated into a model prompt inside a literal pseudo-tag or marker (`<transcript>…</transcript>`, `### USER DATA ###`) with no escaping of that marker inside the content. The developer did consider isolation, which is what makes this survive review: the fence is visible in the code and reads as a boundary. But the boundary is made of the same character stream it is supposed to contain, so anything that can put the closing token into the content escapes the fence and addresses the model directly. This is strictly worse than an unfenced prompt, because the fence is what stops anyone asking whether the content is neutralized. Impact is bounded by what the model's output is allowed to do — a schema-validated extraction limits it to steering choices within the schema; a tool-calling or code-emitting consumer does not.

**Detect.** Find every place untrusted text enters a prompt string and identify the isolation mechanism. If it is a literal delimiter, grep the producer path for escaping of that exact token — usually there is none. Trace the content to its true origin (transcription of a phone call, an uploaded file, a webhook body) and confirm nothing between origin and prompt strips markup. Then scope the blast radius by what consumes the model's output: schema validation, enum allowlists and taxonomy checks CAP the damage but do not prevent the injection, so report the ingress and score it on the consumer. Check for second-order reach specifically — whether the model's output is stored and later re-consumed by another prompt or another agent's context — rather than assuming it.

**False positives.** Fences built from a per-invocation random nonce declared in the system prompt (unguessable, so unforgeable); content passed in a separate structured message role the platform guarantees is not instruction-bearing; pipelines that escape or strip the delimiter token before interpolation; outputs constrained to a closed enum where no injected instruction changes any stored value.
