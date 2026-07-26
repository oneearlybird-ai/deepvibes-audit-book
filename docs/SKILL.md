# The audit-engine skill has MOVED — this file is a pointer, not the skill

**Live location:** `earlybird-workspace` repo → `.claude/skills/code-audit-team/SKILL.md`

Edit it there. Do not restore a copy here.

> Note: this file deliberately no longer carries YAML frontmatter. With `name:` and `description:`
> present it would still register as a loadable skill, and two skills of the same name is exactly
> the ambiguity this move exists to remove.

## Why it moved

Claude Code discovers skills from `.claude/skills/` in the working directory and every parent up to
the repository root, so a skill tracked in the workspace repo installs itself on every machine that
clones it — no copy step, nothing to keep in sync.

This file used to be the canonical source, with a banner instructing whoever edited it to manually
re-copy the result into `~/.claude/skills/code-audit-team/`. That is the copy-and-drift pattern the
Book itself has rules about, and it had already started: the installed copy carried two lines the
canonical did not.

## The trap that made this urgent

**Personal-level skills silently shadow project-level ones.** If a copy exists at
`~/.claude/skills/code-audit-team/`, it runs *instead of* the git-tracked one, and Claude Code
prints no warning. A machine could run a months-old audit engine while its repo showed current text.

So: one file, in version control, and no personal-level copy on any machine.

## Where the skill expects things

The engine reads the Book from this repo and writes findings to the ledger instance beside it:

```
<workspace root>/
├── .claude/skills/code-audit-team/SKILL.md   ← the skill
├── audit-book/                               ← this repo (the Book + schema + tools)
└── code-audit-team/                          ← the ledger instance
```

If the Book is ever published on its own, the skill is part of that distributable unit and should be
copied in as a deliberate release step — not kept in continuous sync across two homes.
