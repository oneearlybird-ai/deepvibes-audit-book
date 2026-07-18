---
section: GG
title: "Cost Management & FinOps"
group: platform-delivery
---

# [GG] Cost Management & FinOps

## GG:1 — Attribution: No per-feature/per-tenant cost attribution — unit economics unknowable

Attribution: No per-feature/per-tenant cost attribution — unit economics unknowable.

## GG:2 — Idle Waste: Unattached EIPs, idle load balancers, stopped-instance EBS volumes, and aged…

Idle Waste: Unattached EIPs, idle load balancers, stopped-instance EBS volumes, and aged snapshots accumulating untracked.

## GG:3 — Transfer: Cross-AZ and egress data-transfer patterns unexamined — architecture decisions…

Transfer: Cross-AZ and egress data-transfer patterns unexamined — architecture decisions made blind to transfer pricing.

## GG:4 — Log Spend: Debug-level logging at production scale — CloudWatch ingestion quietly domina…

Log Spend: Debug-level logging at production scale — CloudWatch ingestion quietly dominating the bill.

## GG:5 — Tuning: Lambda memory/timeout never profiled (power-tuned) — paying for headroom that ad…

Tuning: Lambda memory/timeout never profiled (power-tuned) — paying for headroom that adds no latency benefit.

## GG:6 — Detection: Cost anomalies surfacing on the monthly invoice instead of daily anomaly alerts

Detection: Cost anomalies surfacing on the monthly invoice instead of daily anomaly alerts.

## GG:7 — Commitments: Savings Plans/Reserved coverage unmanaged — 100% on-demand pricing for stea…

Commitments: Savings Plans/Reserved coverage unmanaged — 100% on-demand pricing for steady-state load.
