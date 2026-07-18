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
