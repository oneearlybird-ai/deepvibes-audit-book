---
section: CC
title: "Infrastructure as Code & Environment Management"
group: platform-delivery
---

# [CC] Infrastructure as Code & Environment Management

## CC:1 — State: Terraform state without a remote encrypted backend + locking — concurrent applies…

State: Terraform state without a remote encrypted backend + locking — concurrent applies corrupt state.

## CC:2 — State Access: State files containing secrets in plaintext; the state bucket readable far…

State Access: State files containing secrets in plaintext; the state bucket readable far too broadly.

## CC:3 — Plan Gates: Applies executed without a reviewed plan diff (human or CI policy check) — s…

Plan Gates: Applies executed without a reviewed plan diff (human or CI policy check) — surprise destroys.

## CC:4 — ignore_changes: lifecycle.ignore_changes masking drift on security-relevant attributes (…

ignore_changes: lifecycle.ignore_changes masking drift on security-relevant attributes (policies, encryption flags, parameter values).

## CC:5 — Pinning: Providers and modules unpinned — applies pull breaking upstream changes nondete…

Pinning: Providers and modules unpinned — applies pull breaking upstream changes nondeterministically.

## CC:6 — Keys: count/for_each keyed on mutable values — innocuous edits churn and recreate statef…

Keys: count/for_each keyed on mutable values — innocuous edits churn and recreate stateful resources.

## CC:7 — Destroy Guards: No prevent_destroy/deletion protection on databases, state stores, and K…

Destroy Guards: No prevent_destroy/deletion protection on databases, state stores, and KMS keys.

## CC:8 — Portability: Hardcoded account IDs/regions/ARNs blocking clean environment replication

Portability: Hardcoded account IDs/regions/ARNs blocking clean environment replication.

## CC:9 — Data Sources: "Latest" lookups (AMIs, certs) without stable filter chains that survive r…

Data Sources: "Latest" lookups (AMIs, certs) without stable filter chains that survive renewal/republish.

## CC:10 — Orphans: Resources removed from code but left running (state rm misuse) — unmanaged, unp…

Orphans: Resources removed from code but left running (state rm misuse) — unmanaged, unpatched, and still billed.

## CC:11 — Behavior-defining reference data exists only as hand-authored production rows, with no IaC, seed, or repository artifact

**Statement.** A shared reference table is provisioned by IaC and its seed populates the routing and
metadata rows — identifiers, hostnames, feature defaults — while the rows that actually determine
what the product DOES (the rendered text, rules, or schemas the runtime consumes) are authored by
hand straight against production. No file in version control contains them, no seeding script
creates them, no migration reproduces them, and no review or diff ever covered them. A rebuild into
a fresh account provisions the table, passes every gate, and comes up behaviorally empty; the
runtime's own default-fallback then masks the emptiness behind a generic response, so the failure
presents as mediocre quality rather than as an outage. Point-in-time recovery becomes the only copy
of a first-class product asset, and every change to it is unattributable, undiffable, and
unrevertable.

**Detect.** For each reference table, enumerate the DISTINCT key families present at runtime by
reading the code's key builders — never the IaC alone, which describes only the families it seeds.
For each family, find the WRITER: IaC seed, migration script, reviewed admin endpoint, or nothing. A
family with readers and no writer anywhere in the repository is hand-authored production data.
Confirm by reading the table's own conformance gate: a gate that asserts only the seeded family
cannot see this. Then walk the fresh-environment path explicitly — with the family absent, what does
the runtime render, and does anything alarm?

**False positives.** Genuinely tenant-authored content; reference data whose authoring surface is a
reviewed admin UI with an audit trail AND a version-controlled export that is restore-tested;
families deliberately excluded from IaC because declarative replacement would clobber operator edits
— acceptable only where an exported artifact is committed and its restore path exercised.

## CC:12 — Two IaC stacks each declare the whole of a singleton resource-policy attribute, so every apply silently reverts the other

**Statement.** A resource whose policy is a SINGLE document (a queue policy, topic policy, bucket
policy, registry policy) is declared in two different IaC stacks with separate state files —
typically once as an inline `policy` attribute on the resource in the stack that owns the resource,
and again as a standalone policy resource in the stack that owns a later consumer. Neither
declaration is a merge: each writes the complete document. The provider reports success both times,
so nothing fails and no gate trips. Whichever stack applied last defines live reality, and the other
stack now carries permanent drift that its own plan will silently "correct" on its next unrelated
apply. Because the two documents were written for different purposes, they rarely differ only
cosmetically: one typically carries the tight source-scoping conditions and the other the
account-level guard, so the resource oscillates between two DIFFERENT security postures according to
apply order — and the oscillation is invisible because both states look intentional in their own
repository. The failure surfaces later as either a denied delivery (the scoping the sender needed was
reverted) or an unnoticed permission widening, and the team debugging it reads the stack they own,
finds the correct document, and concludes the infrastructure is fine.

**Detect.** For every resource kind whose policy is a singleton document, enumerate ALL declarations
across every stack — an inline `policy =` argument on the resource AND any standalone `*_policy`
resource targeting the same physical name — and flag any physical resource with more than one
declaring stack. Since two stacks can reference the same resource through different addresses (a
managed resource in one, a `data` lookup plus policy resource in the other), match on the physical
name or ARN, never on the IaC address. Then confirm on the live system: fetch the live policy and
diff it against each stack's recorded state value; a stack whose state differs from live is the loser
of the last race and will revert it. Statement `Sid`s make the diff obvious — a live document missing
a `Sid` that a stack's state contains is proof.

**False positives.** Providers whose policy resource genuinely merges statements rather than
replacing the document; one stack declaring the resource while the other only reads it via a data
source without writing any policy; deliberate hand-off where the inline attribute is paired with
`lifecycle { ignore_changes = [policy] }` so ownership is unambiguous (verify the ignore is actually
present, and note that this masks drift per CC:4).

## CC:13 - Provider-populated default attribute omitted from IaC - the permanent revert flap

**Statement.** Cloud services periodically start auto-populating a new attribute on existing
resources, usually a security tightening, with a service-side default. IaC written before the
attribute existed omits it; from that day the provider reads the live value, compares it to the
declared absence, and every apply "reverts" the attribute to empty - which the service re-adds
minutes later. The plan permanently shows a phantom change on that resource: every apply churns it,
reviewers learn to skim past the familiar diff (masking real changes to the same resource), automated
drift detection cries wolf, and in the window after each apply the - typically protective - default
is actually stripped from the live resource until the service restores it. The fix is one line:
declare the service default (or the deliberately chosen value) so declared state equals live state
and the flap disappears.

**Detect.** Run two plans some minutes apart with no intervening code change: an attribute diff that
reappears both times on the same resource is the flap - real one-shot drift does not come back after
an apply. Confirm by inspecting the live resource between applies and watching the service re-add
the value. Then check the resource block in code: the attribute entirely undeclared (not set to a
conflicting value) completes the signature. Provider changelogs and service release notes usually
name the attribute.

**False positives.** Genuine drift from a console edit - reverts once and stays reverted; an
organization that deliberately wants a value different from the service default - declaring that
value equally ends the flap, so the finding is only the omission, never the preference;
lifecycle-ignore masking of the attribute, which silences the plan while abandoning the field - that
is its own defect (CC:4), not a fix for this one.

## CC:14 — An honest apply of a singleton policy enumerates only the consumers IaC knows — out-of-band consumers are revoked silently

**Statement.** A resource's access policy is a singleton document managed by IaC, and the live
estate also contains consumers created outside IaC (console-created rules, hand-built schedules,
legacy senders). When the IaC narrows or regenerates the policy — often as a correct, well-intended
tightening — it enumerates the consumers it knows about: exactly the ones in its own state. Every
out-of-band consumer is silently revoked on that apply. Nothing fails at apply time; the orphaned
consumers begin failing on their next invocation, often with no DLQ or alarm because the same
out-of-band birth that excluded them from IaC also excluded them from monitoring. The root defect
is the unmanaged consumer, but the visible incident is manufactured by the honest apply — and the
team that ran the apply has no reason to connect the two events.

**Detect.** Before any singleton-policy change, diff the policy's CURRENT live principal/source
list against the IaC-declared list; every live-only entry is an out-of-band consumer that the apply
will cut off. After the fact: correlate the consumer's first failure timestamp with CloudTrail's
policy-write events — an exact match names the apply. Sweep for siblings: any other singleton
policy the same stack regenerates.

**False positives.** Deliberate revocations of known-rogue consumers (recorded as such); policies
where the narrowing was itself the incident response; consumers that were already dead before the
apply (verify last-success predates the policy write).

## CC:15 — lifecycle.ignore_changes on a deployment pointer freezes live traffic on stale code while the repo believes itself deployed

**Statement.** A deployment pointer — a function alias, a task-definition revision reference, a
release channel record — carries `lifecycle.ignore_changes` on the very attribute that names the
version it points at. Every subsequent build still publishes a new version, so the pipeline reports
success and the repository's own "is it deployed" check (which compares the published artifact to
source) passes; only the pointer stays where it was the day it was created. Live traffic runs the
version that happened to be current at birth, indefinitely. The failure is invisible while
successive builds produce byte-identical artifacts — a parity check that hashes code cannot see a
pointer that never moved — and surfaces only on the first build whose bytes actually differ, by
which time the pointer may be many versions and many weeks stale. The ignore is almost always
inherited from an earlier out-of-band deploy era whose reason no longer exists.

**Detect.** Enumerate every deployment pointer in the estate and diff the version it resolves to
against the newest published version; a pointer that is not the newest, on a resource whose IaC
declares no deliberate pinning strategy, is the finding. Grep the IaC for `ignore_changes`
containing the pointer's version attribute and demand a recorded reason for each. A fleet sweep is
the strongest evidence: when 142 of 143 pointers track the version and one does not, the one is a
defect, not a policy. Compare the pointer's own last-modified timestamp against the function's.

**False positives.** Deliberate pinning with a recorded owner and rollback plan (canary/blue-green
pointers that a separate promotion step advances — but verify that step exists and has run);
pointers advanced by a deploy tool outside IaC where the ignore is what prevents the two owners from
fighting (that is CC:12, and the fix is one owner, not the ignore); resources mid-migration where
the pin is scoped to a dated change.

## CC:16 — A resource name over a service-side identifier length cap fails mid-apply, after earlier resources in the same run are already created

**Statement.** A naming scheme composes a resource name from a prefix, a subsystem, and a suffix,
and the composed string exceeds a hard identifier length limit the target service enforces at create
time. Nothing in the IaC toolchain knows the limit: the plan is clean, the graph is valid, and the
failure arrives only when the API call runs. Because it is an apply-time API rejection, it lands
*mid-run* — every resource ordered before it in the graph is already created, the state file records
a partial estate, and the operator is left reconciling a half-applied stack under time pressure. The
scheme itself is usually correct; only the two or three longest members overflow, which is why it
survives review and why the same scheme keeps producing new violations as subsystem names grow.

**Detect.** For every resource type in a change, look up the service's documented name-length and
character-class constraints and compute the rendered name at plan time. The durable form is a
plan-time assertion in the IaC itself (a precondition on `length(name)`) so the next over-limit name
dies in the gate rather than mid-apply — a fix that only shortens today's three names leaves the
next one to be found the same way. Check character-class rules in the same pass; length and
allowed-character rejections are the same class of apply-time surprise.

**False positives.** Names the provider truncates or auto-generates rather than rejecting; limits
that differ by partition or by name-vs-ARN, where the constraint applies to a different field than
the one being asserted; resources whose name is server-assigned.

## CC:17 — Shell command-substitution syntax written into an IaC string literal, which the IaC engine has no shell to evaluate, so the expression itself ships as the live value

**Statement.** Declarative IaC languages interpolate with their own syntax and have no shell. A value
authored as a shell expression — command substitution, backticks, a variable expansion in shell
rather than template form — is therefore not evaluated, not rejected, and not warned about: it is
carried through plan, apply, and drift detection as an ordinary opaque string and materializes in the
live resource verbatim. This most often reaches a field whose whole purpose is to record a fact about
the deployment — a build stamp, a rotation timestamp, a version or commit marker — usually copied out
of a shell script or a runbook where the same line was correct. The result is configuration that
states something false about the system in the exact place an operator will look for the truth,
during exactly the incident where the fact matters: a rotation timestamp that is a literal `date`
expression tells a responder nothing about when the secret last rotated, and reads as a real value
until someone looks closely. Nothing detects it, because every layer treats the field as free-form
text: the type checks pass, the plan is clean, the resource converges, and drift detection compares
the literal against itself forever. Where such a field IS read by code, the same defect becomes a
parse failure or a silently wrong comparison instead of merely a lie.

**Detect.** Grep the IaC tree for shell-only syntax inside quoted values — `$(`, backticks, and
`${...}` forms that the engine's own interpolation would not have accepted — and treat every hit in a
string literal as a finding rather than as style. Confirm against the LIVE resource, not the source:
read the deployed value back through the provider API, because a value that was correct once and is
now stale is a different (and lesser) defect than one that was never evaluated. For each hit,
determine whether anything consumes the field: an unconsumed field is a truthfulness defect scoped to
whoever reads the console, while a consumed one is a correctness defect and should be severity-rated
by what the consumer does with an unparseable value. Sweep sibling fields in the same resource and
the same module — this arrives by copy-paste from a script, so it clusters.

**False positives.** Values deliberately carrying shell text as data — user-data, entrypoint scripts,
command arrays, container args, CI step definitions — where the string is meant to be evaluated later
by a real shell; templating systems that DO perform substitution at render time before the IaC engine
sees the file; fields whose literal `$(...)` is consumed by a downstream agent that evaluates it.

## CC:18 — Retiring one delivery lane deletes shared dependencies a surviving lane references by name, outside the IaC dependency graph

**Statement.** Two delivery lanes for the same artifact (an automated pipeline and a
manually-orchestrated tool, or two generations of the same automation) share supporting
resources — an IAM instance profile, a security group, a bucket, a parameter. One lane is
retired and its IaC is deleted. The dependency graph shows the shared resources as consumed
only by the retired lane, because the surviving lane is driven by a DIFFERENT tool whose
configuration references those resources **by name as opaque strings** — a builder template,
a shell script, a CI step — which the IaC engine cannot see as edges. The deletion plans
clean, applies clean, and the surviving lane keeps validating statically (its config is just
strings). The break surfaces only at the surviving lane's next RUN, as a not-found error at
launch time — often days or weeks later, on an urgent deploy, which is the worst possible
moment to discover the only remaining deploy path is dead. The lesser variant of the same
mechanism leaves the surviving lane's comments and docs pointing at the deleted files as
"the canonical path," misleading the next operator during exactly that incident.

**Detect.** For every IaC deletion of a named resource (identity, network, storage,
parameter), grep the WHOLE repository for the resource's literal name — not just the IaC
tree: builder templates, provisioning scripts, CI definitions, service configs, runbooks.
A hit outside the IaC graph is a live consumer the plan cannot know about. Conversely, when
auditing a repo that recently retired an automation (deleted pipeline files, "one path now"
commits), enumerate the by-name references in the surviving tooling and confirm each named
resource still exists live via the provider API. Exercise the surviving lane end to end
after the retirement — a lane that only validates statically has not been proven.

**False positives.** Names that match but are re-created by the surviving lane itself at
run time (ephemeral keypairs, temporary security groups the tool manages); references in
historical docs or changelogs that describe the past rather than configure the present;
deletions where the surviving lane was migrated to new resource names in the same change —
verify the new names exist live before dismissing.

## CC:19 — A shadowed delivery layer keeps a divergent copy of a policy the edge now owns

**Statement.** A policy — CORS/preflight answers, security headers, redirects, an auth check —
migrates to an outer delivery layer (CDN function, edge middleware, reverse proxy), but the inner
layer's original implementation stays in place with its now-frozen configuration. In normal
topology the outer layer answers first and the inner copy is inert, so the divergence is invisible
and accumulates silently as the outer policy evolves. The inner copy becomes the live answer the
moment topology changes — direct-to-origin access, an edge bypass for debugging, a new environment
wired without the edge, the edge function detached during an incident — and it then serves the
stale policy (origins missing, headers wrong, checks absent), misattributed to whatever change
exposed it rather than to the years-old shadow.

**Detect.** For each policy the edge answers, search the inner layers for a second implementation
of the same policy and DIFF the two configurations; any divergence is drift. Remediate toward one
owner: delete the inner copy (edge ownership documented), or generate both from a single source.
Where the origin is reachable directly, verify with a direct request — the answer must be the
documented policy or a refusal, never a stale third thing.

**False positives.** An inner copy deliberately maintained as the origin-direct fallback AND kept
in mechanical sync with the edge (single generated source, or a verifier asserting equality);
defense-in-depth duplicates whose equality is enforced by CI.

## CC:20 — A reconciler's drift check diffs its published artifact against a recomputation by the same selection logic, so consistent-wrong states are structurally invisible

**Statement.** A reconciler derives an artifact — an id map, an endpoint list, a generated policy —
from live inputs through a selection function, publishes it, and later "checks drift" by re-running
the same selection and diffing the result against the published copy. That check can only ever
detect that the WORLD moved since the last publish; it is structurally blind to the selection
picking the wrong element, because both sides of the diff flow through the shared defect. The
blindness compounds when the selection runs over a duplicate-capable collection into a keyed map
with last-wins semantics: which duplicate wins is an accident of the source API's ordering, the
recomputation reproduces the accident deterministically, and check after check passes green while
every CONSUMER of the artifact references a different element than the artifact names. The
comparison that matters is against the consumers' live references — the attached ids, deployed
pointers, live versions the artifact exists to describe — not against the generator's own output
re-derived.

**Detect.** In reconciler and drift-check code, classify the right-hand side of every comparison:
recomputed-by-the-same-function versus read-from-the-live-consumer. Any check whose two sides share
the selection function is self-referential — locate what the artifact's consumers actually hold at
runtime and add that as a comparison basis, asserting the artifact's emissions are a subset of each
consumer's live references. Separately, grep the selection for fromEntries / dict-comprehension /
reduce-into-map over vendor list endpoints, and either prove the listed collection is unique-keyed
or make duplicates a loud failure instead of a silent pick.

**False positives.** Input collections whose uniqueness the source schema guarantees (assert it
anyway — the assertion is one line); a self-diff check that exists deliberately to catch
out-of-band edits to the published artifact AND is paired with a consumer-side subset check
elsewhere — verify the pair exists in code, not in a comment; artifacts whose consumers are
unreachable third parties where a consumer-side read is impossible — record the residual blindness
as an accepted posture instead of pretending the check covers it.
