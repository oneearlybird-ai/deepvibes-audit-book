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

## OO:3 — A durable record cites the change identifier it saw before the delivery step that rewrites it, so the citation resolves to nothing

**Statement.** A record meant to outlive the work — an audit entry, a decision log, a remediation
ticket, a comment marking why a line exists — cites the change that implemented it by its
identifier. The identifier is captured while the change is still local, and the delivery path
rewrites identifiers as a matter of course: a rebase onto the updated trunk, a squash at merge, a
cherry-pick into a release line, a patch queue re-applied. What lands carries a different
identifier, and nothing goes back to correct the record, because the step that changed the
identifier is mechanical and produces no artifact anyone reviews. The record now points at
something that does not exist anywhere in the repository's history. This fails in the worst
possible direction: the record reads as though it carries proof, so a later reader treats the
claim as verified and does not re-derive it; only someone who actually resolves the identifier
discovers there is nothing behind it, and by then the record has been cited onward by other
records that copied the identifier rather than the evidence. The class multiplies whenever one
delivery lands several records at once — every entry written in that session carries the same
dangling identifier — and it is invisible to any review that reads records for plausibility rather
than resolving their citations.

**Detect.** Take every change identifier appearing in the record store and resolve it against the
repository; anything that does not resolve is a finding, and the resolution must be a real lookup,
not a format check. Do this as a standing gate, not an occasional sweep, since the defect is
introduced silently and repeatedly. Establish where in the delivery path identifiers are rewritten
and make the record cite something downstream of that point — the landed identifier read back from
the trunk after delivery, or a stable handle the delivery mints. Where a record must be written
before delivery, require it to name the change by content — the files and the assertion — so the
claim survives the identifier's loss and can be re-verified by reading the current code, which is
the check that should have been performed anyway.

**False positives.** Identifiers deliberately naming a change on a branch or fork that is not
expected to exist in this repository, where the record says so. References into an external
repository resolvable there. Records whose identifier is a stable release or tag rather than a
per-change identifier.

## OO:4 — A change lands with no statement of intent — its message carries only metadata — so the sole record of why it happened is the diff

**Statement.** The commit message is the only place a change explains itself to the future, and a
change lands with that field effectively empty: the subject line holds a trailer, a tool signature,
an issue reference, or a template fragment, and there is no body. Everything the tooling requires is
present, so nothing rejects it — the message is non-empty, the trailer is well formed, the hooks
pass. The change itself is often large, because the same conditions that produce an unwritten
message (an automated or semi-automated sweep, a batch cleanup, a late-session land) also produce
broad diffs, so the record is thinnest exactly where it is needed most. The cost lands later and on
someone else: a reviewer auditing the period sees an entry that names no purpose and must
reconstruct intent from a diff spanning many files, which is possible for a mechanical change and
effectively impossible for one carrying a judgement call. Any record that cites the change inherits
the blankness, and a bisect that lands on it yields an identifier and nothing else. The defect also
hides scope: a sweep described by no message can carry one unrelated substantive edit among hundreds
of mechanical ones, and nothing in the record distinguishes them.

**Detect.** List the changes over a window with subject and body and flag every one whose subject is
a trailer, a signature, an identifier alone, or empty, and every one whose body is absent while the
diff exceeds a handful of files. Add the check to the commit path rather than reporting on it after
the fact: a subject that matches the trailer grammar, or is shorter than a floor, should be refused
where the author can still fix it. Where changes are produced by tooling or by an agent, verify the
message is composed from the change's purpose and not only from its provenance footer — a signature
line is attribution, never description. Cross-check against the record store: changes with no
message and no corresponding entry anywhere are the population whose intent is now unrecoverable,
and that count is the finding's blast radius.

**False positives.** Merge and revert commits carrying the generated form, where the referenced
change holds the description. Mechanical vendoring or generated-artifact updates governed by a
convention that says so. Repositories where the normative record is elsewhere — an entry store or a
review record — and the convention is documented where authors read it.

## OO:5 — A resource identifier names a vendor or a scope, which are claims, and unlike a wrong comment a wrong identifier is copied into every derived name rather than sitting still

**Statement.** Identifiers are the documentation with the widest readership: every engineer meets a
component's name before its code, and many never read anything else. A name that encodes a vendor —
the mapping provider, the payment processor, the mail service — or a scope — which entity owns the
data, which tier the component belongs to — is making two assertions that can each be false
independently, and both go stale by ordinary means. The vendor assertion dies the first time the
implementation is switched, which is common, because the switch is a code change and nobody
renames a live resource to follow it. The scope assertion dies when a component originally built for
one caller is reused by others, which is the normal life of anything useful. What makes this worse
than a stale comment is propagation: a comment is wrong in one place, while an identifier is
reproduced mechanically into the execution role, the log group, the metric namespace, the alarm, the
dashboard, the test filename, the artifact key and the ticket title. By the time anyone notices,
correcting it is not an edit but a migration, because for most infrastructure the name IS the
resource's identity and changing it destroys and recreates. So the cost of the wrong name rises
continuously while the chance of fixing it falls, and the usual outcome is a permanent, load-bearing
lie that every new engineer is taught as fact and that eventually reaches someone who acts on it.

**Detect.** Read the name as two testable claims and check each against the code. For the vendor
claim, list the component's actual dependencies and calls: an identifier naming a provider that
appears in no import, no endpoint and no credential is false, and the giveaway is often a comment
elsewhere in the estate that already records the contradiction because someone hit it and wrote it
down instead of renaming. For the scope claim, check whether the scoping identifier the name asserts
is ever used: a component named for an entity whose id it never reads, never filters by and never
passes on is not scoped to it, and its real scope is whatever its authentication actually requires.
Then enumerate the derived names before proposing a fix, because the rename is only complete when
the role, the log group, the alarm, the tests and the artifact key move with it — and check for
`prevent_destroy` or its equivalent, which turns the rename into a deliberate recreate rather than
an edit.

**False positives.** A name that describes the component's own protocol or shape rather than a
vendor — one naming the standard it implements, not the company that hosts it — is durable and not
this defect. A scope in the name that matches the component's authorization boundary is correct even
if the component does not read the id itself, provided the boundary genuinely rejects other scopes.
And a deliberately provisional name inside a migration that is still running is not a finding while
the migration has a stated end; it becomes one when the migration is declared done.
