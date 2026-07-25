---
section: BB
title: "Modern Frontend Monorepo & Build Tooling (Turborepo, Nx, Vite, esbuild)"
group: saas-core
---

# [BB] Modern Frontend Monorepo & Build Tooling (Turborepo, Nx, Vite, esbuild)

## BB:1 — Environment Leakage: Misconfigured Pipeline Build Cache Sharing Across Discrete Scopes

Environment Leakage: Misconfigured Pipeline Build Cache Sharing Across Discrete Scopes. Utilizing shared cloud build optimization systems across separate environments without strict scoping, allowing public or staging pipeline builds to accidentally bake internal development environment values directly into compiled distribution bundles.

## BB:2 — Circular Micro-Frontends: Unmanaged Inter-Dependency Layout Cycles

Circular Micro-Frontends: Unmanaged Inter-Dependency Layout Cycles. Designing complex monorepos where multiple shared code utility libraries cross-reference each other's local execution scopes without explicit interface abstractions, causing endless recursive build loops and brittle compilation outputs.

## BB:3 — Phantom Dependencies: Requiring Unlisted Sub-Package Node Modules Inside Application Views

Phantom Dependencies: Requiring Unlisted Sub-Package Node Modules Inside Application Views. Accessing nested dependencies made available purely via monorepo hoisting without defining them within the target component's local package.json, causing random frontend crash states when structural hoisting paths are updated.

## BB:4 — Tree Shaking Blockers: Importing Monolithic Shared Libraries via Wide Export Scopes

Tree Shaking Blockers: Importing Monolithic Shared Libraries via Wide Export Scopes. Structuring corporate frontend component utilities with unoptimized index routing patterns that inadvertently block core engine tree-shaking mechanisms, forcing massive volumes of unused JavaScript artifacts into the final client bundles.

## BB:5 — Cache Trust: Untrusted PR builds permitted to write to the shared remote build cache — a…

Cache Trust: Untrusted PR builds permitted to write to the shared remote build cache — a cache-poisoning path into production artifacts.

## BB:6 — Inputs: Task hash inputs undeclared (env vars, config files) — stale cache hits ship out…

Inputs: Task hash inputs undeclared (env vars, config files) — stale cache hits ship outdated builds.

## BB:7 — Config Drift: Per-package TypeScript/ESLint configs diverging — safety guarantees vary s…

Config Drift: Per-package TypeScript/ESLint configs diverging — safety guarantees vary silently across the monorepo.

## BB:8 — Dependency Confusion: Internal package names unscoped/unregistered publicly — an attacke…

Dependency Confusion: Internal package names unscoped/unregistered publicly — an attacker publishes a higher version upstream.

## BB:9 — Define Leaks: Bundler define/env replacement inlining server-only constants into client…

Define Leaks: Bundler define/env replacement inlining server-only constants into client chunks.

## BB:10 — Type Gates: Transpile-only builds (esbuild/swc) in CI without a separate typecheck step…

Type Gates: Transpile-only builds (esbuild/swc) in CI without a separate typecheck step — type errors ship to production.

## BB:11 — Vacuous Type Gate: the CI typecheck step's file selection silently resolves to zero source files

**Statement.** A dedicated typecheck (or lint) gate runs green while its project/include
configuration selects no application source: unsupported glob syntax (e.g. brace expansion
`*.{ts,tsx}` in a tsconfig `include`, which TypeScript does not implement), a wrong project
root, or an exclude list that removes the very surfaces the gate exists to protect (server
routes, middleware, backend adapters). The pipeline reports "typecheck passed" forever; the
trust-boundary code is only ever transpiled, never type-checked, so type errors ship while
the gate certifies them.

**Detect.** Never trust the include text — enumerate the real program: `tsc -p <project>
--listFilesOnly` (or the tool's equivalent) and count first-party files against the repo's
source census. Then union EVERY typecheck lane (root project, per-package project, framework
build) and list which files appear in none of them; a build-cache manifest (e.g. a fresh
`.tsbuildinfo`) is admissible evidence of what the framework build actually checked. Brace
groups in tsconfig include/exclude are the classic silent-zero.

**False positives.** Projects genuinely scoped to a tiny set (a d.ts-only contract package);
files verifiably covered by a different lane — but verify by listing that lane's program, not
by reading its config. A refutation attempt on the discovering audit died exactly this way:
the root include LOOKED comprehensive and only `--listFilesOnly` exposed the zero-match.
