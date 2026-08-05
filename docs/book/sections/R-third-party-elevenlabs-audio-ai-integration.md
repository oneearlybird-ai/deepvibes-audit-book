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
