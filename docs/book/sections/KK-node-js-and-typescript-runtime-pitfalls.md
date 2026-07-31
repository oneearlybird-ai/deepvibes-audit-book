---
section: KK
title: "Node.js & TypeScript Runtime Pitfalls"
group: runtime
---

# [KK] Node.js & TypeScript Runtime Pitfalls

Language- and runtime-level defects that infrastructure audits never see. Applies to every Node
surface: Lambda functions, EC2 services, Next.js API routes, workers, CLIs.

## KK:1 — Floating promises: async side effects neither awaited nor returned

**Statement.** Promise-returning calls invoked without `await`/`return`/`.catch` — rejections become
unhandled (crashing or silently vanishing depending on runtime flags), effects race the response, and
serverless sandboxes freeze before the work runs.

**Detect.** Enable/run the `@typescript-eslint/no-floating-promises` rule as a scan; manually audit
request handlers, event handlers, and constructors (where `await` is impossible). Every finding is
either awaited, durably enqueued, or explicitly `.catch`-terminated with logging — bare calls are
findings.

**False positives.** Intentional fire-and-forget wrapped in a named helper that catches, logs, and
meters (the intent is visible and the failure path exists); top-level await contexts.

## KK:2 — Global error handlers that keep a corrupted process alive

**Statement.** `process.on('uncaughtException')`/`'unhandledRejection'` handlers log and continue.
After an uncaught throw the process state is undefined (half-completed operations, poisoned singletons,
leaked locks); continuing converts one failed request into arbitrary later corruption.

**Detect.** Find the global handlers. Correct shape: log, flush telemetry, stop accepting work, exit
nonzero, let the supervisor (ASG, ECS, systemd, Lambda runtime) replace the process. Any handler that
swallows and continues is a finding.

**False positives.** Handlers that gate a graceful drain-then-exit sequence; dev-only tooling
processes.

## KK:3 — Event-loop blocking work in the request path

**Statement.** Synchronous CPU-heavy or blocking calls — `JSON.parse`/`stringify` on multi-MB
payloads, sync `zlib`/`crypto`/`fs`, unbounded regex on user input, tight loops — freeze the entire
process: every concurrent request stalls, health checks time out, the instance looks dead under load.

**Detect.** Grep for `*Sync(` calls and large-payload JSON handling in hot paths; review CPU-bound
loops (image/audio processing, crypto, parsing). Verify big work is chunked, streamed, moved to worker
threads, or offloaded to a queue. Confirm payload size limits exist before parse sites.

**False positives.** Boot-time/CLI-time sync calls before serving traffic; small bounded payloads with
enforced size limits upstream.

## KK:4 — Sequential awaits for independent I/O, or unbounded parallel fan-out

**Statement.** Independent async calls awaited one-by-one in sequence (latency = sum instead of max) —
or the opposite failure: `Promise.all` over an unbounded collection, opening thousands of concurrent
connections that exhaust sockets, memory, or downstream rate limits.

**Detect.** Find `for`-loops containing `await` on independent operations and `Promise.all(list.map(...))`
where `list` is unbounded user/data-driven. Require: parallelization for small fixed sets, a
concurrency-capped pool (p-limit pattern) for unbounded sets.

**False positives.** Loops where iterations genuinely depend on prior results; intentional
serialization for downstream rate-limit compliance (comment/config should say so).

## KK:5 — Untrusted JSON parsed without size limits or boundary error handling

**Statement.** `JSON.parse` on request bodies/webhook payloads/queue messages without a byte-size limit
upstream and without try/catch at the boundary — one malformed or gigantic payload throws unhandled or
stalls the loop (see KK:3), turning bad input into an outage.

**Detect.** Find every parse site of external input. Verify a size limit exists before it (body-parser
limit, API Gateway payload cap, explicit length check) and the parse failure maps to a clean 4xx/reject
path, not an uncaught throw.

**False positives.** Parses behind platform-enforced limits (API Gateway 10MB + Lambda) where the error
path is genuinely handled by the adapter — verify, don't assume.

## KK:6 — IEEE-754 `number` used for money or 64-bit identifiers

**Statement.** Money amounts computed in floating point (`0.1 + 0.2`), or 64-bit integer IDs
(Twilio/Stripe/Snowflake ids, file sizes) parsed into `number` — silent precision loss past 2^53,
cent-drift in totals, corrupted ids that mostly work.

**Detect.** Find money arithmetic — require integer minor units (cents) end to end, converting only at
display. Find `parseInt`/`Number()`/implicit JSON parsing of external numeric ids — require string
passthrough or `BigInt`. Check JSON round-trips of large ids specifically.

**False positives.** Display-layer float formatting of already-integer amounts; ids documented ≤ 2^53
by the issuer (still fragile — note it).

## KK:7 — Hand-rolled date arithmetic across DST and month boundaries

**Statement.** Adding days via `86400000` ms math, truncating ISO strings for "the date", or comparing
locale-formatted strings — breaks on DST transitions (23/25-hour days), month/year edges, and non-UTC
business timezones. The business-logic face of this is JJ:7; this rule is the code-level pattern.

**Detect.** Grep for `86400`, `24 * 60 * 60`, `.toISOString().split('T')`, `setHours(0,0,0,0)` on
business-meaningful dates. Require a TZ-aware library (Temporal, Luxon, date-fns-tz) with explicit zone
arguments for any calendar arithmetic.

**False positives.** Pure technical durations (timeouts, TTLs) where civil-calendar meaning is absent —
ms math is correct there.

## KK:8 — `process.exit()` while async work is in flight

**Statement.** Explicit `process.exit()` (or unhandled-signal default death) discards pending writes:
un-flushed logs and metrics, half-written files, unacked messages, open transactions. Combined with
A:31 (no SIGTERM handling) this makes every deploy a small data-loss event.

**Detect.** Grep for `process.exit` outside CLI arg-error paths. Verify shutdown flows: signal handler
→ stop intake → await in-flight → flush telemetry/clients → exit. Check the logger/metrics clients'
flush methods are actually awaited.

**False positives.** CLI tools exiting after fully-awaited work; the fail-fast exit in KK:2's correct
handler shape (after flush).

## KK:9 — Warm-container module state treated as request-scoped

**Statement.** Serverless/module-scope mutable state (arrays, maps, "current user/tenant" variables)
accumulating across invocations of a warm container — cross-request data bleed, cross-tenant leakage,
and slow memory growth. Infrastructure face: A:9 (/tmp); this is the in-memory face.

**Detect.** In function entrypoints and their imports, find module-scope `let`/mutable containers
written during request handling. Anything holding request- or tenant-derived data at module scope is a
finding unless it is an intentional keyed cache with TTL and tenant-scoped keys.

**False positives.** Immutable warm caches (clients, config) — the DI-seam pattern; explicitly keyed
per-tenant caches with eviction.

## KK:10 — Type assertions substituting for runtime validation at trust boundaries

**Statement.** External input (request bodies, queue payloads, third-party API responses, env/config)
typed via `as X`, `any`, or generic `JSON.parse` casts. The compiler is satisfied; nothing at runtime
checks shape. Contract drift and malicious payloads surface as deep `undefined` explosions far from the
boundary.

**Detect.** Audit every boundary where bytes become typed objects. Require a runtime validator (zod /
JSON Schema / hand-rolled asserts) at the boundary, with the static type derived from the validator.
Grep for `as ` casts on parsed external data.

**False positives.** Internal module-to-module calls within one typechecked codebase; generated clients
whose upstream schema is contractually enforced elsewhere (verify the enforcement exists).

## KK:11 — Catch-and-rethrow that destroys the error cause chain

**Statement.** `catch (e) { throw new Error("X failed") }` — the original stack, type, and metadata are
gone. Production incidents show only the top wrapper; the actual failing call is unrecoverable from
logs. Also covers `catch {}` swallow-and-continue on paths that must not proceed.

**Detect.** Grep catch blocks. Rethrows must use `new Error(msg, { cause: e })` (or attach the
original); logging must serialize `cause` chains. Empty catches on side-effecting paths are findings
unless a comment justifies why continuing is safe.

**False positives.** Boundary sanitization deliberately hiding internals from clients — provided the
full chain is logged server-side first (W:8's complement).

## KK:12 — Cancellation not propagated: work continues after the caller is gone

**Statement.** Timeouts and client disconnects abort nothing: `AbortSignal` never threaded into fetch/
DB/downstream calls. Abandoned requests keep consuming connections and compute; retries stack on top of
still-running originals — brownout amplification (X:8's code-level cause).

**Detect.** Check hot handlers: is there a request-scoped `AbortSignal` (or deadline) passed into every
network/DB call? Do long loops check for cancellation? Verify SDK calls receive `abortSignal`/
`signal` options where supported.

**False positives.** Short bounded handlers where total work < timeout budget by construction;
operations that must complete once started (commit points) — these should instead be enqueued.

## KK:13 — Streams and file descriptors without error handlers or pipeline management

**Statement.** Node streams piped manually (`a.pipe(b)`) without error handling on every stage — one
`error` event crashes the process (default) or leaks the other stages' descriptors/memory. Long-running
services accumulate leaked fds until mysterious EMFILE death.

**Detect.** Grep for `.pipe(` — require `stream.pipeline()`/`pipeline` from `stream/promises` (which
propagates errors and tears down all stages). Check every manually created stream has an `error`
listener and a close/destroy path on early client disconnect.

**False positives.** One-shot CLI scripts where a crash is the acceptable error path.

## KK:14 — Module-system mismatch hidden inside a lazily-invoked accessor: the file loads clean and throws on first call

**Statement.** A file's module system is fixed by its extension and the nearest package manifest's
type field. A mechanical edit — a migration that rewrites identifier lookups, a codemod, a patch
copied from a sibling file of the opposite type — can introduce the other system's loader call: a
synchronous `require` inside an ES module, or `import`/top-level await inside a CommonJS one. Placed
at the top level this fails loudly: the module will not load, and every cold start and every test
reports it at once. The dangerous placement is inside a function body — a lazily-invoked accessor, a
thunk deliberately deferring resolution to call time. The module then parses and loads cleanly.
Static analysis sees a defined symbol. Tests that stub or never reach the accessor pass. A smoke
check that merely imports the module passes. The failure is a bare loader-is-not-defined error
raised on the FIRST invocation of that accessor in the running system, which for an accessor behind
a rarely-taken branch can arrive long after the deploy that shipped it. When the file lives inside a
shared library artifact that is versioned and attached to many consumers at once, one publish arms
the fault in every consumer that reaches the branch.

**Detect.** For each source file, establish its module type from the extension and the nearest
package manifest, then search the whole body — not just the header — for the opposing system's
loader call, discounting matches inside comments and string literals. Rank hits inside function
bodies ABOVE top-level ones: top-level breaks at load, in-body breaks in production. Then trace
publication: if the file ships inside a shared layer or library artifact, establish what validation
runs between commit and attach, and whether any of it actually INVOKES the accessor rather than only
importing the module. A test suite that imports every module proves nothing about this class.

**False positives.** Files that construct an explicit interop handle where the construction is
visible in the same file; package entry shims whose purpose is to re-export the other format's
build, routed deliberately by the manifest's export map; bundler output emitting a loader call for a
runtime that supports it.
