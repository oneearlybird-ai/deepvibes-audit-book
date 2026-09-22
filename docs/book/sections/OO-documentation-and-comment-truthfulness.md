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

## OO:6 — The record-keeping tool stamps a lifecycle event the subject never underwent, so a durable record ends by contradicting its own status field

**Statement.** A durable record store — an audit ledger, an issue history, a compliance journal —
is written by a tool that appends a birth event to every record it ingests. The tool was written for
the common case, where a record is born in the open state, so the append is unconditional. But the
same store also ingests records that arrive already resolved: work that shipped before the store saw
it, imported from another system, or retro-recorded by a reconciliation pass. Those records carry
their own history, including the event that resolved them, and the tool appends the birth event
after it. The permanent, append-only record therefore ends with an event asserting the subject was
opened, sitting beside a status field that says resolved. Both halves cannot be true. The damage is
not cosmetic, because an append-only history is consulted precisely when the status field is in
doubt, and every consumer that derives state by reading the last event — a report, a dashboard, a
later reconciliation — now derives the opposite of the truth. The tell that this is a defect and not
a convention is usually visible in the same function: some other branch nearby already handles the
resolved arrival correctly, proving the author knew the case existed and missed this one path.

**Detect.** Do not read the writer's intent, read its output: scan the store for records whose
status field disagrees with their final history event, and separately for records where a birth
event is dated at or after a terminal one. Derive the population twice by those two different
queries and reconcile the difference, because the shapes are not identical and the gap between them
is itself informative. Then fingerprint the suspect events by their exact key set — a tool-written
event carries precisely the fields the writer emits and no others, so a population of events sharing
one key set and lacking the free-text field a human would have filled is machine-authored, not a
record of anything. Confirm by reading the ingest path for an unconditional append, and check
whether the store's validator inspects fields individually while never comparing the status field
against the history beside it, which is what lets the contradiction pass green indefinitely.

**False positives.** A genuine reopening is not this defect: it carries the vocabulary the schema
reserves for it and it moves the status field, so a record that is open again after being closed is
correct. An evidence note or a delivery event appended after a terminal event is legitimate and
common — later proof about resolved work is exactly what an append-only history is for — and only a
birth or state-transition event is the finding. A store whose history is explicitly unordered, or
whose events carry no ordering field at all, cannot support this claim; establish that the history
is chronological before asserting anything about its last element.

## OO:7 — Guidance that activates on a path pattern keeps reading as correct after the tree is restructured, because the file is still there and still true; what changed is that its selector now matches nothing, so the rule silently stops reaching the work it governs

**Statement.** Contextual guidance — area rules, ownership files, review checklists, agent
instructions, editor and lint overrides scoped by directory — is delivered by a selector, usually
a path glob in a header block, that decides when the text applies. The selector is the only thing
binding the guidance to its subject, and it is the one part of the file nobody reads when
reviewing the guidance, because reviewers read the prose for correctness. A restructure then
renames the directories the selector names. Nothing fails: the loader is not an error when a glob
matches zero paths, that is its ordinary quiet outcome for every rule not relevant to the current
work. The file remains in the tree, correct in every sentence, discoverable by search, and cited
by other documents. It simply never arrives where the work happens.

This decays worse than a document that goes stale, because the usual signals all point the wrong
way. Staleness is eventually noticed by someone reading the document beside the code; an
unreachable document is never read beside the code at all, so its content drifts unchallenged for
as long as it survives. Meanwhile everyone continues to reason about the rule as though it were in
force — a later audit will describe it as the most-read statement of its subject, a review will
decline to repeat its content because the rule already covers it, and a decision will be recorded
on the assumption that anyone touching that area sees it. Where the selectors of several rules are
listed together, the damage is uneven and therefore invisible: whoever did the restructure updated
the selectors of the rules they happened to be exercising and left the rest, so one rule loads
correctly and its neighbours do not, and the one that loads is the proof everyone cites that the
mechanism works. The most costly case is a rule carrying a safety constraint — data handling,
secret scope, a destructive-operation boundary — because the constraint's absence is not visible
in any output; it is visible only as work done without it.

**Detect.** Do not read the prose. Take each selector literally and resolve it against the tree as
the loader would: for a path glob, list the paths that actually match, and a match count of zero is
the finding on its own. Do this for every rule in the set at once and compare — a set whose
selectors were written together and maintained apart will show some live and some dead, and the
live ones tell you the restructure happened and was applied partially. Then invert the test, which
catches the more common half: take the directories where the governed work actually lives today and
ask which rules a change there would load; a governed area that loads no rule, or loads only a
neighbour's, is the same defect seen from the other side. Confirm behaviourally rather than by
reading, since loaders differ: make or simulate an edit in the governed directory and observe which
guidance is actually delivered. Finally, search the tree and the decision record for statements
that assume the rule is in force — a finding, review note, or design record that says "the area
rule covers this" is a second artefact to correct, and its existence dates how long the rule has
been unreachable.

**False positives.** Selectors deliberately pointing at a directory that does not exist yet, for
work about to land, where the tree says so. Rules delivered by more than one mechanism, where a
dead glob is redundant beside a live one — verify the live path really delivers the same file
rather than a different rule with a similar name. Sets where a rule is intentionally dormant and
recorded as such. And a glob that matches nothing in the repository you are looking at but matches
in a sibling repository the same rule set governs, which is a scoping question rather than a dead
selector.

## OO:8 — Deleting a dead symbol leaves its comment behind, and the orphan re-parents onto the next construct, so a hygiene change converts an accurate comment into a confident false statement about code that was never there

**Statement.** Nothing in any mainstream language binds a comment to the thing it
describes; the binding is adjacency and reader convention alone. So when a cleanup removes
a symbol that genuinely had no callers — the whole point of the change, and the easiest
kind of change to approve — the declaration goes and the comment above it stays, because
the deletion was scoped to the parse tree and the comment is not in it. The orphan then
sits against whatever construct now follows, and every future reader applies the ordinary
convention and reads it as documenting THAT. The comment has not merely gone stale; it has
acquired a new and wrong subject, and it keeps its original confident register — a date, an
author's reasoning, often a citation to the incident that prompted it — so it reads as the
most authoritative line in the neighbourhood.

The damage depends entirely on what the deleted symbol was. If it was a helper, the result
is noise. If it was a CONTROL — a verification step, a gate, an authorization check, a
sanitizer, a retry bound — the orphan now asserts that the control is present, and it is
precisely the kind of statement that stops the next reader from looking. A reviewer
wondering whether the sensitive path is gated finds a dated comment saying it is, and stops.
An auditor sampling for the control finds the comment and marks it satisfied. The absent
control is thereby defended by the artifact of its own removal.

Two properties make this class survive review. First, the producing change is a hygiene
change — dead code out — which is reviewed for what it removes, not for what it leaves, and
whose diff shows the deleted lines while the surviving comment appears in no hunk at all
unless context happens to reach it. Second, searches for the control by name still succeed:
the identifier is right there in the comment, so a name search returns a hit in the file
where the control used to be, and only reading the surrounding code shows the hit is prose.

**Detect.** Take each deletion of a named symbol in a cleanup or dead-code change and look
at the lines immediately preceding the deleted declaration: any comment whose subject is
that symbol must leave in the same change. On existing code, read every comment against the
construct that follows it and ask whether the comment's subject appears in that construct at
all — a comment about authentication above an event reducer is the shape. The sharpest
mechanical signal is a comment naming an identifier, endpoint, route, flag or flow that a
repository-wide search for the name finds ONLY inside comments: a subject that exists
nowhere in executable form is either deleted or never built, and both make the comment
false. Prioritize comments asserting a security or correctness control, and confirm by
tracing the control end to end rather than by finding its name. When one is found, the
history tells you which change orphaned it: search the file's history for the commit that
removed the named symbol, and read what else that change left behind.

**False positives.** Banner or section comments that legitimately describe a following group
or a whole file rather than the next construct, and block comments at file head. Comments
explicitly retained as history and marked as such ("was", "removed in", changelog notes).
A comment whose named subject still exists elsewhere and is genuinely reached from this
file, where the comment is a pointer rather than a local description — verify the path
actually runs before calling it orphaned. Commented-out code kept deliberately under a
policy that permits it. And a comment describing a subject that is absent because it is not
built YET, where the text says so — that is a TODO's register, not a false claim.
