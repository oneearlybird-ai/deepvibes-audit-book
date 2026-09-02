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

## GG:8 — Recurring-cost external resources minted for never-funded accounts with no reclamation path

**Statement.** Signup/creation flows purchase recurring-cost external resources (phone numbers, seats, certificates, dedicated infrastructure) before the account has any payment identity, and no sweep reclaims resources belonging to never-funded accounts. Every free signup — including abusive multi-signups — permanently accretes third-party spend with zero offsetting revenue, and the leak stays invisible because the per-item cost is small and the vendor invoice aggregates.

**Detect.** Trace every creation/onboarding flow for third-party purchase calls (vendor SDK create/buy endpoints) and check their ordering against the payment-identity mint. For any purchase reachable pre-funding, look for a reclamation job keyed on funding status + age. Absence of both the ordering and the reclamation is the finding; quantify as vendor unit cost × signups.

**False positives.** Resources with no recurring cost; documented trial budgets with enforced caps AND a reclamation sweep; purchase deferred to a funded step (ordering already correct).

## GG:9 — The provider's billing standing is an undeclared dependency of provisioning, and nothing in the platform watches it

**Statement.** Every resource the platform creates depends on the account being in good standing
with the provider, and that standing depends on a payment instrument that expires, is declined, or
is replaced — a state entirely outside the platform, changed by no deploy and observable through no
metric the platform emits. When it lapses, the provider does not fail loudly: it restricts new
activations and new sub-account creation while everything already running keeps running, so the
serving surface stays green, every alarm stays quiet, and the first symptom is a provisioning path
failing for a reason no runbook covers. Architectures that create accounts or subscriptions as part
of ordinary operation — onboarding a customer, standing up an isolated cell, enabling a regional
service — are the ones this actually breaks, and they break at the moment of growth rather than at
rest. The notice itself is delivered by mail to a billing contact, which is typically a different
address, a different person, and a different attention pattern from the channel operational alerts
use; where that mail is forwarded into an operational inbox it arrives among routine statements and
reads like one. Nothing correlates the notice with the failures it will cause, so the outage and its
cause are discovered separately, if at all.

**Detect.** Ask what live signal would tell the platform its account standing has lapsed, and expect
to find none — then create one: the provider exposes account and billing status through an API, and
a scheduled check that asserts good standing belongs beside the other detective controls, alarming
to the same channel as an outage rather than to a mailbox. Enumerate every code path that creates a
new account, subscription, or service activation and record what each does when the provider refuses
on standing grounds; a path that surfaces the provider's error verbatim to an end user, or retries
it as if transient, is a second finding. Verify who actually receives billing notices and whether
that person is on call. Check the payment instrument's expiry against the calendar, and confirm at
least two contacts are registered, so a single lapsed address cannot silence the warning.

**False positives.** Accounts under an invoiced or committed-spend agreement where the restriction
mechanism does not apply. Sandbox or throwaway accounts that provision nothing on demand.
Organizations where a central finance function owns and monitors standing under a documented
control, and the platform's dependence on it is stated.
