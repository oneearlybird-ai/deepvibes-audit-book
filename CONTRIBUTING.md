# Contributing rules to the Book

Every rule PR passes this gate. The Book's value is rule quality, not rule count.

## The generalization gate

1. **Mechanism, not product.** No company, product, repo, customer, or engineer identifiers — in the
   rule text, the examples, or the commit message. Describe why the failure happens in terms any
   adopter's system can be checked against. If the rule only makes sense knowing your architecture,
   generalize further or don't submit it.
2. **Incident-derived rules are the most valuable.** If this pattern bit a real system, say so with
   the mechanism ("observed in production: webhook retries double-provisioned accounts") — never
   with the identity.

## Required shape

New rules use the full three-field format inside the fitting section file:

```markdown
## X:N — Short defect handle

**Statement.** The defect, stated as fact about a system that has it — one paragraph.

**Detect.** What an auditing agent should trace to prove or disprove it. Name the code shapes,
the call paths, the configs to read. Greppable starting points are fine; grep conclusions are not.

**False positives.** Known situations that look like this defect but are sound. This field is what
separates a useful rule from a noisy one — refutation lessons from real audits land here.
```

- **ID**: next number in the section — append-only, never renumber, never reuse. A new failure
  *family* gets the next unused section letter and a front-matter block matching existing sections.
- Legacy single-line rules (sections A–HH) are being enriched to this format opportunistically;
  enrichment PRs (adding Detect/False-positives to an existing rule without changing its meaning)
  are welcome and need no new ID.

## Mechanical gate

`node tools/build-index.mjs` must pass: it enforces front-matter, section/filename agreement,
contiguous append-only numbering, and global ID uniqueness. Schema or tooling changes must keep
`tools/validate-ledger.mjs` green against a sample instance.

## What gets rejected

- Product-specific rules ("check that OUR service X…").
- Duplicate mechanisms (extend the existing rule's Detect/False-positives instead).
- Vague virtue statements without a Detect path ("code should be secure").
- Renumbering, deletion, or meaning-changes to existing IDs — deprecate in place instead
  (mark the Statement `**Deprecated.**` with the reason and the superseding ID, keep the number).
