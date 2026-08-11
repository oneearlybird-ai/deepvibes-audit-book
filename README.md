# The Audit Book

An **agent-executable audit system**: a library of known failure patterns ("the Book"), an audit
engine skill that LLM agents follow (inventory → route → trace → refute → record), and a findings
schema + tooling for operating a living audit ledger.

Existing options are either machine rules (Semgrep/CodeQL/Checkov — precise, but limited to what an
AST matcher can express) or human checklists (Well-Architected, OWASP ASVS — broad, but nobody
executes them). This sits in the middle that LLM agents made viable: **prose rules that require
tracing and judgment**, checked exhaustively by agents that read the actual code.

## Install

Two ways to run the engine with [Claude Code](https://code.claude.com):

**As a plugin (recommended):**

```
/plugin marketplace add oneearlybird-ai/earlybird-audit-book
/plugin install audit-book@audit-book
```

**As a project skill:** clone this repo somewhere near your workspace and copy
`skills/code-audit-team/` into your project's `.claude/skills/`. (Use one install mode per
machine, not both — duplicate skills shadow each other.)

Node.js is the only runtime dependency. Then ask the agent to *"audit \<service/path/repo\>"* —
on the first run the skill bootstraps your private instance (see "The two-repo model" below), and
it operates find → report → fix → report-fix → repeat.

## Layout

| Path | Role |
|---|---|
| `docs/book/sections/*.md` | **The Book** — one file per section (`A`–`OO`), rules as `LETTER:NUMBER`. Append-only; never renumber. |
| `docs/book/index.json` / `index.md` | Generated index. Rebuild with `tools/build-index.mjs`. |
| `skills/code-audit-team/SKILL.md` | **The engine** — the audit skill agents follow. Installed via the plugin or copied into `.claude/skills/`. |
| `.claude-plugin/` | Claude Code plugin + marketplace manifests — makes this repo directly installable. |
| `schema/finding.schema.json` | **The finding schema** — every finding, every run, validates against this. |
| `schema/routing-manifest.json` | Resource-kind → sections router: how inventory maps to chapters. |
| `tools/build-index.mjs` | Parses + validates the Book, emits the index. CI gate for book edits. |
| `tools/validate-ledger.mjs` | Validates an instance ledger + staged runs. CI gate for ledger writes. |
| `tools/merge-runs.mjs` | Folds staged per-finding files into the ledger with global `F-####` ids. |

## The two-repo model

This repo is the **public-track engine**: rules, schema, skill, tools. It must never contain
findings, product names, or anything specific to one codebase.

Your **instance** is a separate private directory/repo (any name) holding what the audits produce.
The skill creates it on first run (it asks where it should live and which repos it covers); the
shape it writes:

```
my-audit-instance/
  config.json            # { "book": "<path-to-this-repo>",
                         #   "ledger": "audit/ledger.json", "runs": "runs",
                         #   "repos": ["repo-a", "repo-b"],
                         #   "surfaces": ["backend", "web", "mobile", "iac", "cross"] }
  audit/ledger.json      # THE ledger — starts as []
  runs/                  # per-run staging: runs/<date>-<name>/<finding>.json
  audit/archive/         # frozen prior baselines — provenance only, never truth
```

Agents stage one JSON file per finding into `runs/`, then:

```
node audit-book/tools/merge-runs.mjs  <instance-dir>   # assign ids, dedupe, append
node audit-book/tools/validate-ledger.mjs <instance-dir>  # must pass
```

## The rules of the Book

- **IDs are permanent.** `A:4` means one thing forever. New rules append at the end of a section;
  new families get the next section letter. Deprecated rules are marked, never removed.
- **Rules describe mechanisms, not products.** A rule born from a real incident is generalized until
  any adopter's agent can check it: statement of the defect, how to detect it (what to trace), and
  known false positives.
- **Rules must be checkable by reading code.** If verifying a rule requires tribal knowledge, it
  isn't finished.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution gate.

## Provenance

Grown from a production SaaS platform's internal audit practice: an initial 493-rule taxonomy across
34 sections (AWS backend, frontend, Vercel, third-party integrations, SaaS core, platform &
delivery), extended with cross-cutting chapters (concurrency, domain invariants, runtime pitfalls,
crypto misuse, test-suite integrity) and hardened by a fresh-audit method with adversarial
refutation after a 27% false-positive rate taught us that findings must be disproven before they are
recorded.

## License

[Apache-2.0](LICENSE). Contributions are accepted under the same terms (License §5).
