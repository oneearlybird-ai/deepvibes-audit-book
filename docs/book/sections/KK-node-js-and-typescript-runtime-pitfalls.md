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

## KK:15 — Result-envelope async clients consumed with rejection-only error handling: the catch that can never fire

**Statement.** An async client normalizes transport and server failures into a RESOLVED result
envelope — `{ data, errors }` in the GraphQL convention, `{ ok: false }` in fetch-wrapper style —
and rejects only on genuinely unexpected throws (often never, because its own try/catch converts
those too). A caller attaches `.catch()` or wraps in try/catch but never inspects the resolved
envelope's error field, so every real failure — HTTP 4xx/5xx, validation rejection, expired auth,
schema mismatch — takes the success path. The present-but-dead rejection handler is the trap: the
code LOOKS error-handled and passes review, while the action's failure is invisible to user, log,
and operator alike. Compounded when the UI applied the change optimistically: the user sees
success, the server never learned, and the discrepancy surfaces later as state that "mysteriously
reverted".

**Detect.** For each async client, read its failure CONTRACT first: does it reject, resolve with an
error field, or both? Then audit call sites for handling that matches that contract. A
`.catch`-only (or bare-try/catch-only) caller of a resolve-with-errors client is a confirmed dead
handler — flag it without needing a runtime repro. Grep call sites of known envelope clients
(GraphQL executors, fetch wrappers returning `{ok}`/`{errors}`) for `.catch(` and for `await` with
no subsequent error-field read on the result.

**False positives.** Fire-and-forget calls whose failure is deliberately without consequence —
confirm the failure is metered somewhere. Clients that BOTH populate the envelope AND re-throw
(verify in the client source before flagging callers). Callers that pass the resolved envelope to a
shared handler which does inspect the error field.

## KK:16 — A serializer configured to strip undefined values silently removes a placeholder the query string still references, converting an absent optional field into a hard request-validation error

**Statement.** Document/marshalling clients are commonly configured to drop `undefined` properties so
that optional fields need no guarding at each call site. That convenience becomes a fault when the
same request carries an EXPRESSION — an update expression, a filter, a parameterized statement —
that names placeholders by key: the stripping pass removes the placeholder's entry while the
expression string still refers to it, and the service rejects the whole request for an undefined
placeholder. The failure is total (the entire write is refused, not just the one attribute), and it
is data-dependent: it appears only for the records where the optional field resolves to `undefined`,
so it passes every test whose fixture happens to populate it. The usual source of the `undefined` is
a conditional expression whose branches are not exhaustive — a ternary over a field that may be
absent on older or partially-populated rows returns `undefined` from a branch nobody considered.

**Detect.** For every request that pairs an expression string with a values map, enumerate the
placeholders named in the string and prove each one is assigned a defined value on EVERY path that
reaches the call, including the branch that reads an optional attribute off a stored row. Read the
client's marshalling options first: strip-undefined turns this from a marshalling error into a
service-side validation error, which is why it surfaces in production rather than in unit tests.
Search runtime logs for the service's own wording for an undefined placeholder — it names the exact
key, which points straight at the unassigned branch. Fixtures must include a stored record with the
optional attribute missing, not merely empty.

**False positives.** Expressions assembled conditionally, where the placeholder is appended to the
string in the same branch that assigns its value (verify the string and the map are built together);
values legitimately typed as null rather than undefined, which marshal fine; and clients that do not
strip undefined, where the failure is an earlier and louder marshalling error.

## KK:17 — Miscased request property silently dropped by the SDK serializer — the setting is absent, and a hand-rolled test double asserting the same wrong name verifies the typo

**Statement.** JS SDK clients (AWS SDK v3 included) serialize request objects by picking the model's
known fields; an unknown property — including a correct field name with wrong casing — is dropped
without any error. When the dropped property is one whose absence is itself a legal, weaker
configuration (an encryption key id, a retention setting, an opt-in flag, a limit), the call succeeds
and the system runs with the weaker default indefinitely. Nothing fails at call time, nothing logs,
and any test whose double was hand-written restating the author's memory of the field name goes green:
the stub records what the code sent and the assertion checks the same misspelling — the suite verifies
the typo, not the contract. The defect surfaces only when a later consumer depends on the setting
actually being present, at which point the failure is attributed to that consumer, not to the
months-old create path. In the paid-for instance, `KMSMasterKeyId` (SDK field: `KMSMasterKeyID`) left
every runtime-provisioned vault bucket's default SSE unpinned for 2.5 months — silently, since writes
landed on the AWS-managed key — until a bucket-policy deny keyed on the correct per-BP KMS key shipped,
after which every NEW bucket was born unwritable (its own policy denies the writes its own default
produces) and the outage was first misdiagnosed as a dead vendor webhook.

**Detect.** For every hand-authored SDK request literal carrying security or correctness load
(encryption config, retention, policies, limits, versioning), diff each property name against the
client's shipped TypeScript model (`dist-types/models/*.d.ts`) — a name absent from the model is a
finding even when every test passes. Prefer making the compiler do this permanently: a typechecked
call site (`.ts`, or JSDoc `@type` on the command input) turns the whole class into a build error.
In tests, never restate field names by hand — assert against the SDK model's names, or round-trip the
request through the real client's serializer. And read the configuration back after provisioning
(`get-bucket-encryption` and kin) comparing to intent: a create path whose result is never read back
is unverified by construction.

**False positives.** Clients accepting genuinely open-ended maps (tag maps, metadata bags) where
arbitrary keys are legal; a property deliberately omitted to accept the documented default, when the
default is the intended state and a comment says so.

## KK:18 — A retirement sweep deletes a shared construction along with the feature it was written for, and the surviving callers read it only inside function bodies, so the module parses clean and the process dies at first call

**Statement.** A feature is retired in one sweep: its helpers, its comparison inputs, and the object
literal that was originally introduced to serve it are all deleted together. One of those deletions
is not part of the retired feature — it is shared scaffolding that surviving code paths still read,
typically a context object assembled once near the top of an entry function and consumed as
`ctx.something` deep inside callees. Because every surviving reference is a property read inside a
function body rather than a top-level use, the module still parses, the type checker (in a plain
ESM/JS project, or wherever the binding was implicitly typed) has nothing to bind against, and any
gate that stops at parse, lint-on-changed-files, or unit tests that stub the entry point stays
green. The failure is deferred to the first real invocation and is total for that lane rather than
partial. It is easy to mistake for an environment problem because the diff that caused it contains
no edit to the code path that throws.

**Detect.** For any commit that deletes more than it adds in a long entry function, list the
bindings it removed and grep the post-change tree for each name — a name that still appears only as
a property root inside callees is the finding. Prefer a gate that actually executes the entry point
in a dry/plan mode over one that parses it. Where a context object is assembled once and read
everywhere, construct it in a function that returns it (so its absence is a call-site error) rather
than as a bare binding in a several-hundred-line scope. After the fact, a `ReferenceError` or an
`undefined` property read on the first invocation after a retirement commit names the deletion.

**False positives.** Bindings the sweep deleted whose consumers it deleted in the same commit
(verify by grepping the post-change tree, not the diff); dynamic construction where the binding is
legitimately assigned on a branch not taken in the failing run.

## KK:19 — A dependency declared by relative filesystem path is left dangling by a directory move, and the installer links it to a missing target without failing

**Statement.** A package inside a repository depends on a sibling package by relative filesystem
path rather than by registry name. The path is written relative to where the depending package sits
at the moment it is authored, so its correctness is a fact about directory depth, not about either
package. Any structural move — a component pushed one level deeper, a tree flattened, a workspace
re-rooted — invalidates the path while changing nothing else, and the move's author has no reason
to look inside a manifest for a `../..` count. The installer is the second half of the mechanism:
asked to install a local path, it materializes the link and reports success whether or not the
target exists, leaving a link that resolves to nothing. Nothing fails at install, nothing fails at
lint or typecheck if those do not resolve runtime imports, and the lockfile is rewritten around the
broken path so it looks freshly maintained. The failure surfaces only when something actually
imports the dependency, and then it takes out the whole importing unit at once — every module in
that package dies on the same unresolved-module error, which reads as one catastrophic breakage
rather than a one-character path defect. Because the units most likely to import a shared local
package are test suites and workers, the class typically destroys a verification surface rather
than a serving one, so it can survive indefinitely with no user-visible symptom.

**Detect.** Enumerate every manifest in the repository and extract every dependency whose specifier
is a filesystem path rather than a version range, then resolve each one from its own manifest's
directory and assert the target exists — this is a whole-repository sweep, not a per-package check,
because a single move usually breaks several at once and finding one is not evidence the rest are
sound. Treat the installed link itself as evidence: read the link's target and confirm it resolves,
rather than trusting that install succeeded. Then check whether anything would have caught it —
require at least one import of each locally-pathed dependency to be exercised by a gate that runs
on every change, and confirm that gate's failure is visible (see the multi-block runner class).
After any structural move, diff the set of path-specifier depths before and after; a move that
changes depth and touches no manifest is the signature.

**False positives.** Path specifiers pointing at a genuinely optional target that the consuming code
guards for absence. Manifests in a template or scaffold directory that are never installed. Package
managers whose workspace protocol resolves by declared workspace name rather than by literal path —
those are name-resolved and immune to depth changes, and should not be counted with them.
