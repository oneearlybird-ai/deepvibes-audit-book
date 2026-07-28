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
