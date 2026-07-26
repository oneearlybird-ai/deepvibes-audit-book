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
