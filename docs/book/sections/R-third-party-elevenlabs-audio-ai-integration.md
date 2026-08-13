---
section: R
title: "Third Party: ElevenLabs Audio/AI Integration"
group: third-party
---

# [R] Third Party: ElevenLabs Audio/AI Integration

## R:1 — Key Exposure: ElevenLabs API Key exposed directly to the frontend/browser to generate au…

Key Exposure: ElevenLabs API Key exposed directly to the frontend/browser to generate audio, leading to immediate API quota theft.

## R:2 — Quota Exhaustion: Backend not caching frequently requested identical TTS snippets in S3/…

Quota Exhaustion: Backend not caching frequently requested identical TTS snippets in S3/Redis, burning duplicate character quotas unnecessarily.

## R:3 — Latency: Synchronous audio generation blocking the main backend thread instead of stream…

Latency: Synchronous audio generation blocking the main backend thread instead of streaming chunks (responseType: 'stream') back to the client.

## R:4 — Generation: Unvalidated Dynamic Pitch/Stability Parameter Interpolation

Generation: Unvalidated Dynamic Pitch/Stability Parameter Interpolation. Accepting arbitrary user UI slider inputs for voice synthesis generation parameters without strict backend clamping, causing downstream model generation errors and unnecessary billing charges.

## R:5 — Security: Lack of Origin Domain Locking on Embeddable Reader Widgets

Security: Lack of Origin Domain Locking on Embeddable Reader Widgets. Deploying ElevenLabs web generation interfaces without explicit domain whitelisting, allowing malicious sites to copy application configuration keys and stream speech assets on unauthorized perimeters.

## R:6 — Cloning: Voice-clone creation without consent verification flows — impersonation and lik…

Cloning: Voice-clone creation without consent verification flows — impersonation and likeness liability.

## R:7 — Webhooks: Platform callbacks (e.g., agent events) consumed without HMAC signature verifi…

Webhooks: Platform callbacks (e.g., agent events) consumed without HMAC signature verification.

## R:8 — Streaming: No backpressure on TTS streams — slow clients balloon server memory per conne…

Streaming: No backpressure on TTS streams — slow clients balloon server memory per connection.

## R:9 — Input Bounds: Unbounded text length accepted for synthesis — one request can burn a mont…

Input Bounds: Unbounded text length accepted for synthesis — one request can burn a month of character quota.

## R:10 — Pinning: Voice/model IDs hardcoded with no fallback — upstream deprecation breaks produc…

Pinning: Voice/model IDs hardcoded with no fallback — upstream deprecation breaks production speech paths.

## R:11 — Concurrency: 429/concurrency-limit responses unhandled — no queueing, retry budget, or d…

Concurrency: 429/concurrency-limit responses unhandled — no queueing, retry budget, or degradation path.

## R:12 - Per-tool input overrides validate against the LIVE tool schema - config cannot precede the code deploy

**Statement.** The agent platform validates per-tool configuration - input overrides that inject
per-call credentials or identifiers as dynamic variables - against the tool's input schema as served
by the currently deployed MCP/tool server, not against any committed or declared source. An override
naming a parameter the live server does not declare is rejected per tool ("override path does not
exist in schema"). So when server-side enforcement of a new required credential parameter ships -
every tool now demands it before resolving the session - the overrides can only be seeded AFTER the
enforcing server is deployed, and until they are seeded every tool call fails closed. Config-first
sequencing, the instinctive "prepare the platform before the deploy", is structurally impossible;
the correct cutover is deploy-then-seed with the seeding prepared as an idempotent script and
rehearsed dry-run beforehand, holding the fail-closed window to seconds. A second trap compounds it:
the platform's coarse server-object update endpoint can return 200 while silently ignoring the
tool-config field - the per-tool sub-resource endpoints are the real write path, and every write
must be verified by re-reading the object.

**Detect.** Dry-run the seeder against the current live server and classify per-tool errors: schema
rejections for exactly the new parameter prove the ordering constraint is in force. Diff the
platform's live tools/schemas listing against the committed tool registrations to see which side is
ahead. For the write path, PATCH the coarse endpoint, re-read, and diff - an echoed old value under
a 200 is the silent no-op; find the sub-resource CRUD endpoints in the vendor's API schema and use
those. Check the cutover runbook orders deploy before seed, runs the seeder in the same change
window, and ends with a coverage verification that fails on any uncovered tool.

**False positives.** Platforms that validate overrides against registered/declared schemas
independent of the live server - config-first is then safe and preferable; parameters already
declared by the deployed server, where seeding order is free; an apparent 200-no-op that is
eventual consistency - re-read after a delay before concluding the endpoint ignores the field.

## R:13 - Agent-platform orchestration artifacts hand-authored in the vendor console with no repository source - two authorities compete for the conversation sequence

**Statement.** Conversation procedures/workflows/graphs exist live on the agent platform, authored
by hand in the vendor console, matching no committed artifact: the repo's prompt-builder also
encodes step sequencing, the catalog/spec documents describe artifacts that do not exist live (and
name an apply script that was never written), and the live artifacts are partially wired (empty
triggers, no hub edges). Behaviour becomes whichever authority the platform consults for a given
turn; edits to either side diverge silently, and no gate can see console-side changes. The repo may
even state a single-authority principle that the live console state contradicts.

**Detect.** List the live orchestration artifacts via the vendor API and diff against every
committed spec/catalog/apply script. Check wiring completeness (triggers, edges, referenced tool
ids). Grep the repo for the apply pipeline the docs reference. Compare observed call transcripts
against the artifact's declared first steps - a live call that follows the prompt rather than the
procedure proves the split authority.

**False positives.** Platforms where the console is the declared single source of truth and the
repo is intentionally silent, recorded as a sanctioned posture; vendor-supplied read-only demo
artifacts that nothing routes to.

## R:14 - Post-call analysis consumer reads collection fields the agent is not configured to collect - the branch is structurally dead

**Statement.** A post-call webhook or completion handler resolves the call outcome from the agent
platform's analysis/data-collection output, but the live agent configuration's collection block is
empty (or lacks the fields the reader names). The reader returns null on every call, so the
fallback lane - timeouts, re-dials, abandonment classification - silently becomes the de-facto
primary path. Every layer succeeds; the intended lane has simply never produced a value.

**Detect.** Diff the reader's field list against the live agent configuration's collection block
(fetched via API, not from docs). Search history for the reader ever yielding a non-null outcome
(logs, metrics, downstream state transitions). A fallback lane whose counters equal the total call
count is the signature.

**False positives.** Fields populated by a different producer (server-side injection into the same
payload); readers that are deliberate forward-compatibility for a collection rollout that is
tracked and imminent; optional enrichment where the null path is the designed primary.

## R:15 — The voice provider emits synthetic placeholder turns for non-speech, and the transcript normalizer admits them as real speaker content

**Statement.** Conversational voice platforms return a turn-structured transcript in which not every
turn corresponds to something a human said. Silence, an unrecognized utterance, or a barge-in that
produced no words are commonly rendered as a placeholder turn carrying an ellipsis or a similar
non-lexical marker, attributed to the speaker who was expected to talk. A normalizer that filters
only on empty or whitespace-only content accepts these as genuine speaker turns, and every consumer
downstream inherits the fiction: the transcript UI renders empty bubbles, turn counts and
talk-ratio metrics are inflated, "did the caller speak" checks answer yes for a caller who was
silent throughout, and any extraction or summarization step is handed placeholder text as if it
were speech. The defect is invisible in aggregate — the transcript looks well-formed and the volume
looks plausible — and it corrupts precisely the cases that matter most, the calls where one party
said nothing.

**Detect.** Take a real call in which one party was silent and read the provider's raw payload for it
end to end, rather than reasoning from the normalizer's output; the placeholder marker is only
visible there. In the normalizer, examine the emptiness predicate: a check for empty string or
trimmed-empty passes anything with a punctuation glyph in it, so the correct predicate is the
absence of any letter or digit content. Sweep stored transcripts for turns whose content contains no
alphanumeric character and count them per call — a nonzero population confirms admission, and the
distribution shows which consumers are already contaminated. Verify each downstream consumer
separately, since the placeholder can be harmless in one and load-bearing in another.

**False positives.** Legitimate transcripts of non-lexical but meaningful content (a spoken symbol,
a number rendered as digits, a language whose script the check must not exclude); providers whose
ellipsis marks a truncation of real speech rather than its absence; and turns whose content is empty
by design while their metadata carries the payload that matters, which must be preserved rather than
dropped.

## R:16 — Registering a hosted tool server with the conversational agent is mistaken for exposing its tools, so the agent runs with an empty tool surface and narrates the actions it cannot take

**Statement.** Agent platforms separate two configuration surfaces that read like one: the list of
tool SERVERS attached to an agent, and the list of TOOLS the agent may call. Attaching a server
registers the connection; it does not populate the tool list. When the deploy path sets only the
server binding and leaves the tool array empty — or, worse, deletes the tool array on every update
because an earlier revision treated it as server-derived — the agent boots with no callable tools at
all. Nothing errors. The conversation still runs, the orchestration graph's tool nodes have nothing
to fire, filler speech covers the wait, and a generative agent asked to complete a transaction does
what it always does with an unavailable capability: it describes the outcome as if it had happened.
The user is told the booking, order, or transfer is done, and no record exists anywhere. Two further
traps sit next to this one: the platform's DEFAULT approval policy may require a human click per
call, which stalls a live conversation exactly as an empty list does; and declaring the derived
identifier list (tool ids) alongside the materialized entries makes the server mint duplicate
records and report drift forever.

**Detect.** Read the agent's live configuration through the platform API, not the deploy code or the
console summary: count the entries in the tool array itself and compare against the tools the
attached server actually serves when scanned. A non-empty server binding with an empty tool array is
the defect. Check each materialized entry's approval policy against what an unattended live call can
survive. Then close the loop behaviorally — run one conversation that must call a tool and assert a
tool invocation was recorded, since the transcript alone cannot distinguish a successful action from
a fluent description of one. Cross-check the reverse direction too: a tool present on the agent that
the live server no longer serves is the same class of drift.

**False positives.** Agents deliberately configured for speech only; platforms that genuinely derive
the tool surface from the server binding at call time — verify against the live agent object rather
than the vendor's marketing description; and staged rollouts where the empty surface is the
intentional pre-cutover state and no live traffic reaches the agent.

## R:17 — Per-call tool-id overrides resolved from an account-wide name→id map while the platform mints tool records per agent — the override cites records the agent does not own, silently dropped until a vendor-side validation rollout kills every call at initiation

**Statement.** The platform materializes an agent's callable tools as vendor-minted RECORDS: ids are
minted per agent per materialization, so N agents times M re-materializations leave duplicate
same-named records account-wide, and each agent references only its own mint. A per-conversation
narrowing override (a tool_ids-style list sent in the conversation-initiation payload) must cite
records ATTACHED to the routed agent. When the resolution source is a single account-wide name→id
map — built by listing every tool record and keying by name — the map can match at most one agent's
mint, and keyed-map construction with last-wins semantics (Object.fromEntries or a dict
comprehension over a duplicate-capable list) makes even that selection an accident of the vendor
API's list ordering. The defect is masked for as long as the vendor SILENTLY IGNORES unattached ids
in the override — the agent simply runs its full baseline tool surface and calls succeed — so the
wrong map can sit live for days. When the vendor later begins validating the override (a
server-side rollout: invisible, unannounced, no client change), every conversation carrying the
override is rejected at initiation with a policy-violation close before the first audio frame, and
the whole fleet is down while nothing in the repository changed.

**Detect.** For each managed agent, GET the live agent object and read its attached tool-record
ids; take the map or config the per-call override is computed from and assert every id it can emit
is a subset of the routed agent's attachments. List account tool records grouped by name — more
than one record per name is the precondition; trace which mint each agent references. In the
override-building code, find keyed-map construction over an account-wide listing and prove the
listed collection cannot hold duplicate keys, or fail loudly when it does. Close the loop
behaviorally: run one conversation per agent with the override and read the conversation's
termination reason through the vendor API — "not attached to this agent" is the proof. Treat any
in-repo comment recording that the vendor "silently ignores" invalid override content as a latent
hard failure with a vendor-controlled fuse, not as a stable contract.

**False positives.** Platforms that resolve overrides by NAME server-side (no minted ids in the
override); a genuinely single-agent account where a reconcile-time check asserts the map equals
that agent's attachments; overrides intentionally absent or empty so the baseline surface applies;
a vendor-documented guarantee that unknown ids are ignored — still record that as an accepted-risk
posture with the guarantee cited, because it is the vendor's to revoke.
