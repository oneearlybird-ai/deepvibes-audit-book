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
