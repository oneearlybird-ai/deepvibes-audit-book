---
section: OO
title: "Documentation & Comment Truthfulness"
group: cross-cutting
---

# [OO] Documentation & Comment Truthfulness

Comments, headers, and docstrings that record architectural facts are load-bearing: owners,
reviewers, and coding agents make routing, deployment, and design decisions from them. When they
drift from the live system they become believed-false documentation at the exact point of maximum
trust — adjacent to the code. This section audits the truthfulness of decision-bearing prose, not
its style.

## OO:1 — Decision-bearing comments and headers contradict live wiring

**Statement.** Comments, file headers, and docstrings that record ARCHITECTURAL FACTS — "X is intentionally not in this flow", "triggered by Y", "N-step flow", "this surface runs Z" — contradict the current live wiring after the system moved on. These are not cosmetic: a stale "not in this flow" header conceals a live cost path; a stale "runs the voice client in-page" comment misdescribes the security surface; a stale trigger list sends maintainers to entry points that no longer exist. The wrongness compounds because readers extend the code in the direction the prose describes, not the direction the wiring runs.

**Detect.** For each decision-bearing comment (claims about what invokes what, what a flow contains or intentionally excludes, step counts, security posture), verify the claim against the live wiring it describes: trace the caller, the IaC state machine, the registry, the mounted component. Prioritize headers of files whose behavior changed after the header was written (git-blame the header against the flow it describes). Every contradiction is a finding regardless of whether the code itself is correct — the comment IS the defect.

**False positives.** Comments explicitly marked historical ("was", "pre-cutover", changelog notes); TODOs stating intent rather than fact; documents the repo's own policy quarantines as non-authoritative (their existence may still warrant cleanup, not a truthfulness finding).

## OO:2 — A fail-open branch justified in-comment by a compensating control that does not cover the same risk

**Statement.** A guard skips its check when an input it depends on is absent, and an adjacent comment justifies the skip by naming a downstream "second line of defense". The named control is real and does run — but it decides a DIFFERENT question than the skipped check, so it cannot compensate for it: a timing or rate check cited as cover for a missing eligibility check, a schema validator cited as cover for a missing authorization check, a retry cited as cover for a missing idempotency check. The comment is precisely what lets the fail-open survive review — a reader who confirms the cited control exists concludes the gap is covered and stops, because disproving it requires opening another module and comparing what each one actually decides.

**Detect.** For every fail-open branch of the shape `if (a && b) { check } else { note-and-continue }`, read the justification, then read the cited control's IMPLEMENTATION rather than its name. Write one sentence for what the skipped check decides and one for what the cited control decides; if they are different questions, the justification is false and the fail-open is unmitigated. Grep the cited control's call sites as well — a defense that runs on a different code path than the one failing open compensates for nothing. Note whether the skipped input is optional at its own write path: an optional field feeding a mandatory guarantee is how the branch gets taken in practice.

**False positives.** Citations to a control that genuinely re-decides the same question later on the same path; fail-open branches whose skipped check is redundant with a precondition already enforced upstream; comments that accurately describe residual risk instead of claiming it is covered.
