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

## AA:16 — Compliance-relevant caller challenges (recording objection, consent refusal) have no grounded state and no designed path — the agent improvises legally-consequential assurances

**Statement.** A conversational agent operates inside a system that records, discloses, or
processes the interaction under a compliance regime (call recording disclosure, consent capture,
data-handling promises), but the agent's instructions carry no grounded statement of that state
and no designed response for a party who challenges it. The disclosure is played by the platform
before the agent speaks; the agent itself is never told "this call is recorded" as a fact it owns.
When a caller says "I don't consent to being recorded," the model does what models do with
unanswerable questions asked confidently: it produces a fluent, reassuring, WRONG answer ("this
call isn't being recorded") that directly contradicts the disclosure the same caller just heard.
The system has now made a false compliance representation in a recorded medium — the recording
itself is evidence of the misrepresentation. The absence of a refusal path compounds it: with no
defined alternative (transfer to an unrecorded channel, message-taking, callback by a human), the
agent's only options are to fabricate or to stonewall, and it will fabricate.

**Detect.** Find the platform mechanism that makes the compliance state true (the recording
start, the disclosure play, the consent gate) and confirm it is unconditional. Then read the
agent's assembled instructions end to end for any grounded statement of that state and any
instruction for the challenge case; grep prompt builders and procedure/config sources for the
compliance nouns (record, consent, privacy). Absence on both axes with an unconditional platform
mechanism is the finding. Transcript evidence of an actual fabricated assurance elevates severity
but is not required — the mechanism guarantees the fabrication eventually.

**False positives.** Agents whose instructions state the compliance fact AND script the challenge
response (even minimally: acknowledge, restate the disclosure, offer the designed alternative);
platforms where the challenged state is genuinely conditional and the agent's tools can actually
change it (e.g., a real stop-recording tool the agent is instructed to use); jurisdictions/flows
where the disclosure itself is not required and nothing false is implied.

## AA:17 — Interaction lanes hand the agent partial views of the domain — attributes and context present in the system never reach the lane where the conversation needs them

**Statement.** The agent's tool surface returns different projections of the same domain in
different lanes, and the lane where a conversation actually happens is missing attributes the
system holds. Two recurring shapes: (1) the transactional lane omits catalog attributes — the
availability/booking tools return times and service names but not the price, description, or
policy fields the catalog row carries, so the agent conducts a sale without ever being handed the
price it should quote; (2) workflow-initiated outbound interactions omit the initiating context —
the system calls a customer to reschedule but the prompt carries only the mechanics (times), not
the WHY (staff shortage, provider absence), so the agent opens with a demand it cannot explain.
The failure reads like an agent-quality problem and attracts prompt patches, but no instruction
can make a model speak a fact it was never given; the defect is in the lane's projection, and the
fix is to widen what the lane returns or carries — the same principle as returning data wide
instead of steering with instructions.

**Detect.** For each conversational flow, list the facts a competent human in that role would
state (prices during booking, reason during an outbound call, fees during cancellation) and trace
each to the tool returns and prompt context actually available in that flow — not in some other
tool the agent could theoretically call. An attribute reachable only via a side-lane tool the flow
never invokes is absent for this purpose. Compare projections across lanes: a field returned by
the browse/lookup lane but absent from the transact lane is the signature.

**False positives.** Attributes deliberately withheld from the agent by policy (quotes requiring
human estimation, regulated disclosures that must come from a licensed person) where the
instructions say so; facts genuinely absent from the system (unpriced catalog rows — that is a
data-completeness issue, not a lane-projection one); lanes that omit fields the conversation
provably never needs.

## AA:18 — The agent's spoken confirmation of a side effect is not gated on the tool call that performs it, and reconciliation is post-hoc from the transcript, so the customer is told the thing happened before anything can contradict it

**Statement.** In a conversational agent that performs real side effects through tools — sending a
message, booking a slot, submitting an order — the sentence "I've sent that to you" is generated by
the model, while the send is performed by a tool call. Nothing structurally couples them: the model
can emit the confirmation with no tool call in the trail, and the caller acts on it. Teams that
notice this build a detector that compares the agent's speech against the executed tool list after
the conversation ends, flags the mismatch and stamps the record for attention. That is a real and
worthwhile control, but it is an *audit* control, not a *correctness* control, and it is easy to
mistake for one because the flag is loud, purpose-named and lands in a dashboard. The customer has
already hung up believing a message is on the way. Worse, the post-hoc detector runs in the
summary/analysis lane, so its flag is usually logged at error level in a component whose alarms
mean "the summariser is broken", and on a retried message it re-fires per attempt — which makes a
recurring customer-facing falsehood look like a noisy pipeline.

**Detect.** List every tool that performs a side effect the agent can describe in words. For each,
find what forces the order: does the agent receive the tool's result before it can utter the
confirmation (a required tool call, a state the prompt cannot assert without), or is the wording
left to the model? Then read the mismatch detector's OUTPUT, not its code, over a real window of
production conversations — a detector with live hits is proof the coupling is absent, and the hit
count is the rate at which customers are being told untrue things. Check what the flag reaches: a
stamped record a human may never open is not a remedy; a same-call correction or a follow-up to the
customer is. Finally check the retry behaviour of the lane the detector runs in, so one bad call
cannot be counted as several.

**False positives.** An agent whose confirmation language is emitted by the tool's own return value
rather than the model. A flag raised on speech that promises a future action ("I'll text you once
we're done") where a later lane genuinely performs it. Detector hits on test or simulated
conversations. A single flag class that is cosmetic — markup read aloud after the action did
execute — which is a transcript-quality defect, not a false confirmation.

## AA:19 — The prompt layer that governs what the agent may assert carries no grounding rule, and a procedure step instructs it to conceal tool failure, so the model fills every gap with fluent invention and the caller hears prices, times and classifications that nothing looked up

**Statement.** A conversational agent is assembled from layers: a base prompt, a per-context
render, a set of task procedures, and the tool returns themselves. Teams that have learned the
tool-plane lesson — a tool states what is, never what the agent should say — often leave the
agent's own plane unconstrained: nothing anywhere says that a number, a time, an availability or a
classification the caller hears must have come from a tool return in this conversation. The
absence is invisible while tools succeed, because the model reaches for them naturally. It becomes
the whole failure the moment the model has a reason not to — it is under conversational pressure,
a tool is slow or failing, or it simply judges it already knows — and then it produces a fluent,
plausible answer with the same confidence as a looked-up one. The harm is sharper than a wrong
answer: an invented price is a commitment the business never made, an invented opening is an
appointment that does not exist, an invented urgency classification dispatches someone or fails
to. The pattern is usually compounded by an instruction written for a different failure. A
procedure step that says "if the tool errors, do not announce a system failure, just ask again"
was written to stop the agent narrating stack traces; read by a model that cannot complete the
step, it is an order to cover, and the model covers with an invention. A prompt that tells the
agent to pass as human has the same effect for the same reason: a human receptionist knows her
prices, so admitting she cannot see them breaks character. And because the model's task is
fluency, it will narrate the lookup it did not perform — "let me check the calendar" followed by
invented slots — which reads on a transcript as a tool call and on a metric as a success.

**Detect.** Read every layer of the prompt stack the model actually receives on a real call —
verified by pulling the override sent on a production conversation, not the base prompt in the
console, since a per-call render often replaces the base entirely. Search all of it for the
grounding rule: a statement that a fact the caller hears must come from a tool return in this
conversation, and a named honest fallback for when a tool fails. If neither exists in any layer,
the defect is present regardless of whether it has fired. Then search the procedures for the
inverse — any step that tells the agent not to announce, mention or reveal a failure, or to stay
in character, or to sound certain. Then take one real transcript where a tool failed or was never
called and compare every number, time and status the agent spoke against the tool returns in that
conversation's record; anything spoken with no return behind it is the defect firing. Check the
vendor's success flag on that conversation last: a call marked successful with fabricated content
means the platform's own signal cannot be used to find this.

**False positives.** An agent whose spoken figures are rendered from tool return values by code
rather than generated by the model, where the model cannot emit a number the return did not carry.
A fallback phrase that is generic by design ("a member of the team will confirm the exact price")
and never carries a figure. Estimates the business has explicitly authorised the agent to give
from a written range that is itself supplied by a tool. Procedure language that suppresses
narration of internal detail ("do not read the error text aloud") while still requiring the
failure itself to be stated.
