---
section: EE
title: "Real-time: WebSockets, SSE & Push"
group: platform-delivery
---

# [EE] Real-time: WebSockets, SSE & Push

## EE:1 — Upgrade Auth: WS connections accepted without authenticating the upgrade/$connect — auth…

Upgrade Auth: WS connections accepted without authenticating the upgrade/$connect — auth deferred to later messages.

## EE:2 — Heartbeats: No ping/pong idle detection — zombie connections exhaust connection quotas

Heartbeats: No ping/pong idle detection — zombie connections exhaust connection quotas.

## EE:3 — Fan-out AuthZ: Broadcasts pushing full objects to every subscriber without per-recipient…

Fan-out AuthZ: Broadcasts pushing full objects to every subscriber without per-recipient authorization/field filtering.

## EE:4 — Reconnect Storms: Deploy-triggered mass reconnects without jittered backoff — a self-inf…

Reconnect Storms: Deploy-triggered mass reconnects without jittered backoff — a self-inflicted thundering herd.

## EE:5 — Gap Recovery: No resume cursor/sequence numbers — events emitted during a reconnect wind…

Gap Recovery: No resume cursor/sequence numbers — events emitted during a reconnect window are lost silently.

## EE:6 — Connection Hygiene: Stale connection IDs never purged from the connection table; sends t…

Connection Hygiene: Stale connection IDs never purged from the connection table; sends to dead connections (GoneException) unhandled.

## EE:7 — Backpressure: Per-client send queues unbounded — one slow consumer balloons server memory

Backpressure: Per-client send queues unbounded — one slow consumer balloons server memory.

## EE:8 — SSE: Event streams behind buffering proxies/CDNs without no-buffering headers — "real-ti…

SSE: Event streams behind buffering proxies/CDNs without no-buffering headers — "real-time" arrives in 30-second batches.

## EE:9 — Gap Recovery: per-reconnect resync refetch without coalescing, bypassing rate limits via force flags

**Statement.** Reconnect-triggered gap-recovery logic fires a full REST resync on EVERY reconnect with no debounce or minimum interval, and its refresh path bypasses application-level cooldowns via force flags. Under connection flap (server accepting then dropping, LB churn, deploys) — especially when backoff counters reset on successful subscribe before the drop — the client hammers the API with full-surface refetches at the flap frequency, amplifying the outage it is trying to recover from.

**Detect.** Find the resync trigger on the connected/reconnected transition: is there a minimum interval since the last completed resync? Does the refresh path bypass cooldowns (force:true)? Check whether backoff attempt counters reset on connect-success-before-stable — a connect-subscribe-drop cycle that resets backoff yields sustained near-zero-delay retry.

**False positives.** Resyncs bounded by a stable-connection timer or debounce; backoff counters reset only after a sustained-healthy interval; recovery limited to a cheap cursor/sequence catch-up rather than full refetch.

## EE:10 — Subscriptions: per-subscription transient errors unhandled on a live connection

**Statement.** The server can reject or fail an individual subscription on an otherwise healthy connection (authorization backend blip, per-channel error frame), but the client's recovery machinery only exists at the connection level (reconnect backoff on socket death). Per-subscription error frames hit a default no-op branch, leaving the channel in the desired set but unsubscribed server-side — silently delivering nothing until an unrelated reconnect, with comments asserting "the socket's backoff owns it" when the backoff never sees error frames.

**Detect.** Enumerate the server's per-subscription failure vocabulary (error frames that do NOT close the connection — verify server-side, not just client comments). For each, trace the client's frame handler: transient per-channel failures must schedule a bounded re-subscribe on the live socket or force a reconnect after N failures. A default: break branch on error frames is the tell.

**False positives.** Terminal per-channel denials (permission permanently revoked) where staying unsubscribed is correct AND the app state reflects it; servers that close the connection on any subscribe failure (connection-level recovery genuinely owns it).

## EE:11 — Graceful-completion branch guarded by a conjunction of runtime flags, so a session that finished successfully falls through to the abandonment path and the user gets the failure experience

**Statement.** A bridge between two legs of a session — an inbound transport and an upstream service —
has two legitimate teardown outcomes that demand opposite handling: the session finished, which should
end the user's leg cleanly, and the session was abandoned, which should route the user to a recovery
experience. Because abandonment is the dangerous case, the recovery path is made the default and the
clean completion is gated behind a conjunction of runtime flags that together attest the session
really did finish. The conjunction is written conservatively and correctly. What makes it a defect is
that its failure mode is silent and inverted: any single flag that is false — because an upstream flag
was never set on this code path, because a build predating the flag is running, because a race left it
unwritten — sends a session that completed perfectly into the abandonment branch, and the user
experiences a failure at the exact moment the system succeeded. The user-visible symptom is
indistinguishable from a genuine outage, so it is reported as one and investigated in the wrong
subsystem. The peer's own close code is the evidence that is available and ignored: a normal-closure
code from the upstream leg says the interaction ended by design, while the user's leg is closed with an
error code moments later, and the two codes disagreeing in the same teardown is the whole finding.

**Detect.** Read the teardown handler and enumerate every reachable path into it, then evaluate the
completion conjunction on each — any path that cannot set all of the flags is a path that silently
degrades a good session. Require that BOTH branches log, with the flag values, so the branch taken is
recoverable after the fact; a teardown where neither branch left a record cannot be diagnosed and the
absence of both log lines is itself the finding, because it proves the running build is not the build
being read. Correlate the two legs' close codes on real sessions: a normal closure upstream paired
with an error closure downstream is the signature. Then confirm against the running artifact rather
than the repository — a conjunction referencing a flag introduced after the deployed image was built
evaluates false on every session, so establish the build identity of the instance that served the
traffic, not the current one.

**False positives.** Conjunctions where every clause is provably set on every reachable completion
path and the degradation is genuinely unreachable; bridges whose abandonment path is itself benign to
a finished session (a silent hangup rather than an error announcement); deployments where the
completion branch is deliberately disabled behind a flag during a staged rollout, with the degraded
experience accepted and documented for that window.

## EE:12 — Pre-authentication frame buffer bounded by entry count while each entry is attacker-sized, so the real ceiling is count × max-payload

**Statement.** A connection handler buffers inbound frames that arrive before the peer has
authenticated — typically so the first moments of a session are not lost while a downstream
dependency is still connecting — and bounds that buffer by NUMBER OF ENTRIES. Separately, the socket
layer caps the size of a single frame. Neither limit is wrong alone, but their product is the actual
memory an unauthenticated peer can pin: an entry cap sized for small protocol frames multiplied by a
payload cap sized for the largest legitimate message. The entry cap is usually chosen against an
implicit frame size ("N seconds of audio at M frames/second"), and that assumption is never enforced,
so a peer that sends maximum-size frames reaches hundreds of times the intended footprint. Because
the buffering happens before any credential is checked, no quota, tenancy, or per-account limit
applies, and the cost of the attack is one socket. Where the process is supervised with a memory
ceiling that restarts it, the restart is the exploit: a supervised restart commonly enters a drain or
refuse-new-work state for a bounded period, so a few sockets can hold the whole service in a
degraded mode indefinitely. A per-frame log line emitted once the cap is reached is a second,
independent amplifier — it converts the same traffic into unbounded log volume and write pressure.

**Detect.** Find every buffer that accumulates before the authentication decision and ask what bounds
it in BYTES, not entries. Multiply the entry cap by the transport's maximum payload and compare the
product to the process memory ceiling and to any supervisor restart threshold; if the product exceeds
either, the finding is confirmed by arithmetic and needs no exploit. Read the comment next to the
entry cap: an entry cap justified by a duration or frame-rate assumption is the signature, because
that assumption is a statement about well-behaved senders. Confirm the ordering by tracing a frame
that is not the authentication message through the handler — if it reaches the buffer without a
guard on the authenticated identity, every pre-auth frame is retained. Check whether the overflow
branch logs per frame, and whether the health endpoint deliberately keeps reporting healthy while
the process is draining, which prevents the load balancer from rotating the instance out.

**False positives.** Buffers whose entry cap is multiplied by a transport payload cap small enough
that the product is immaterial against the process ceiling; handlers that authenticate during the
transport handshake (so no unauthenticated frame is ever buffered) and buffer only post-auth;
prebuffers bounded by accumulated byte length rather than entry count; and deployments where the
socket is reachable only from an allowlisted, authenticated network path, so "unauthenticated peer"
is not reachable in the first place — verify that at the edge configuration, not from a comment.

## EE:13 — The far end names the failure in the WebSocket close frame and the bridge records only the numeric code, so every distinct rejection collapses into the same four digits

**Statement.** Close frames carry a code AND a short UTF-8 reason, and vendor platforms put the
actual cause in the reason — the specific validation error, the quota, the policy violated. A
relay or bridge that records only `code` on close turns auth rejection, schema validation,
concurrency limits, and permission failures into one indistinguishable number; operators then
reconstruct the cause from adjacent systems — vendor dashboards, conversation archives, API
archaeology — when the peer had already stated it in the frame that was in hand. The cost lands
hardest exactly where such bridges live: realtime voice and media paths, where the session is dead
in milliseconds and the vendor-side record may be the only other witness. A legitimate
privacy posture can forbid logging vendor-authored strings verbatim (external bodies may echo
user-derived content); the correct form under that posture is a bounded client-side
CLASSIFICATION — match the reason against known vendor failure patterns and log the matched enum —
not discarding the cause entirely.

**Detect.** In every WS close and error handler, check whether the handler signature exposes the
reason (typical client libraries pass (code, reason), the reason often a byte buffer needing
decode) and whether the emitted log or metric captures it in any form — verbatim, hashed, or
classified. A close log with a code field and no reason-derived field is the defect. Where a
log-privacy contract exists, verify the classification path: the enum values must come from the
matcher, never from interpolating the raw string.

**False positives.** Peers that provably send empty reasons (capture it anyway — it costs
nothing); privacy postures that ban vendor strings AND already log a classification or hash
derived from them; client libraries that genuinely surface only the code — record the library
limitation and the upgrade path instead of a finding against the handler.
