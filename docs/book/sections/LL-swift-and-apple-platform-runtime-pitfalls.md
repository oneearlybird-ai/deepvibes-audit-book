---
section: LL
title: "Swift & Apple Platform Runtime Pitfalls"
group: runtime
---

# [LL] Swift & Apple Platform Runtime Pitfalls

Runtime-correctness defects for iOS/macOS clients. Security-surface items (Keychain, pinning, deep
links) live in [HH]; this chapter is the concurrency, memory, and lifecycle family.

## LL:1 — Blocking the main actor: sync I/O and heavy work on the UI thread

**Statement.** Network calls, disk I/O, Core Data fetches, image decoding, or JSON parsing executed
synchronously on the main thread/actor — frozen UI, dropped frames, and watchdog terminations
(0x8badf00d) that ship as "random crashes."

**Detect.** Audit main-actor code paths (view models, SwiftUI body-adjacent helpers) for synchronous
file/network/database calls and CPU-heavy loops. Verify heavy work runs in detached tasks or
background contexts with results hopped back to the main actor for UI.

**False positives.** Small bounded reads at launch behind a splash state (still worth noting); work
already measured to be sub-millisecond.

## LL:2 — Strong `self` captures in long-lived closures: retain cycles

**Statement.** Closures stored by long-lived owners (timers, observers, async sequences, Combine
pipelines, callback registries) capturing `self` strongly — the object can never deallocate, its
observers keep firing, memory grows, and side effects run against screens the user left.

**Detect.** Audit closure registration sites (`Timer.scheduledTimer`, `NotificationCenter` blocks,
`sink`, stored callbacks): `[weak self]` (or explicit ownership reasoning) required when the closure's
lifetime can exceed self's. Instruments/leaks runs on navigation-heavy flows confirm.

**False positives.** Short-lived closures structurally released before self (a completed URLSession
task callback); intentional self-retention until completion (`Task` doing finite work) — the cycle
must provably break.

## LL:3 — Concurrency safety silenced instead of fixed

**Statement.** `@unchecked Sendable`, `nonisolated(unsafe)`, `@preconcurrency`, and
`DispatchQueue.main.async` sprinkled to silence strict-concurrency diagnostics without establishing
actual isolation — the data race remains, now invisible to the compiler.

**Detect.** Grep for `@unchecked Sendable`, `nonisolated(unsafe)`, `@preconcurrency`. Each occurrence
needs a written justification of the real synchronization (lock, queue confinement, immutability). No
justification = finding. Check mutable stored properties on `@unchecked Sendable` types especially.

**False positives.** Genuinely synchronized types (internal lock) where the annotation is the honest
escape hatch and the invariant is documented; third-party interop shims pending upstream fixes
(tracked).

## LL:4 — Unstructured tasks without cancellation: work outliving its screen

**Statement.** `Task { }` launched from views/view models without storing the handle, checking
`Task.isCancelled`, or using structured `.task {}` modifiers — dismissed screens keep networking,
writing state, and posting notifications; rapid navigation stacks duplicate work.

**Detect.** Find `Task {` in UI-adjacent code. Require: SwiftUI `.task`/`.task(id:)` (auto-cancelling)
where possible; otherwise stored handles cancelled in `onDisappear`/`deinit`, and long loops/awaits
checking cancellation. Verify async sequences (`for await`) terminate on cancel.

**False positives.** Deliberate fire-and-forget app-scoped work (analytics flush) owned by an
app-level object, not a screen.

## LL:5 — Force-unwrap and `try!` on runtime-variable data

**Statement.** `!`, `try!`, and `as!` applied to values that vary at runtime — network responses, disk
state, user input, URLs built from strings, dictionary lookups — converting recoverable conditions into
crashes. Each one is a latent crash report with a stack trace and no context.

**Detect.** Grep for `!` unwraps / `try!` / `as!` outside tests and static-by-construction values.
Hot paths (decode, deep link handling, migration) get priority. Require `guard let` with a degrade path
(error UI, default, telemetry), not silent `try?` swallowing either.

**False positives.** Compile-time-constant constructions (`URL(string: "https://literal")!`,
regex literals) — genuinely static; test code.

## LL:6 — Managed-object and model contexts crossed between threads/actors

**Statement.** Core Data `NSManagedObject`s (or SwiftData models) fetched on one context/queue and
touched from another — intermittent crashes and silent data corruption that reproduce only under
timing. The classic "works in dev, corrupts in the field" client bug.

**Detect.** Audit Core Data usage: every access wrapped in the owning context's `perform`/
`performAndWait`; objects passed across boundaries as `NSManagedObjectID`, never as live objects;
background writes merged into the view context deliberately. Enable `-com.apple.CoreData.ConcurrencyDebug 1`
in debug builds.

**False positives.** Value-type snapshots (structs mapped from models) crossing threads — that is the
correct pattern.

## LL:7 — Decoding strictness mismatched to contract: silent nil-drift or brittle crashes

**Statement.** Codable models either all-optional (server contract changes pass silently as `nil`s,
features quietly blank out) or all-required (one additive server change fails the whole decode and
blanks the screen). Neither failure mode is chosen deliberately.

**Detect.** Review API models: required fields = things the feature cannot render without; optional
fields = genuinely optional, each with a handled nil path. Decode failures must be surfaced to
telemetry, not `try?`-swallowed. Contract tests against recorded live payloads (see NN:2) close the
loop.

**False positives.** Exploratory/debug endpoints; models generated from a schema that the backend
enforces at CI time (verify the generation is actually wired).

## LL:8 — UserDefaults as a database: large blobs, sensitive data, cross-process assumptions

**Statement.** UserDefaults holding multi-KB JSON blobs, entire caches, or sensitive tokens (HH:3's
neighbor): synchronous plist load at launch grows, writes race across extensions/processes, and none
of it is protected or migration-versioned.

**Detect.** Enumerate UserDefaults keys and payload sizes. Tokens/secrets → Keychain (HH:3). Documents
and caches → files/Core Data with explicit versioning. Check app-group defaults for multi-process write
patterns and last-write-wins races.

**False positives.** Small scalar preferences (flags, last-tab) — the intended use.

## LL:9 — Observers and subscriptions never torn down

**Statement.** NotificationCenter block-based observers, KVO, timers, and Combine subscriptions
registered without removal/cancellation — callbacks fire into deallocated-adjacent state, duplicate on
every re-registration (N screens visits = N handlers), and keep retain cycles alive (LL:2 compounding).

**Detect.** For each registration site, locate the paired teardown (`removeObserver`, stored
`AnyCancellable` set cleared on deinit, `invalidate()`). Block-based NotificationCenter observers
require explicit removal of the returned token — grep for discarded return values.

**False positives.** Selector-based NotificationCenter observers on iOS versions with automatic
deregistration AND no duplicate-registration path; app-lifetime singletons subscribing once.

## LL:10 — Background transitions unhandled: suspensions mid-write

**Statement.** Multi-step writes (uploads, migrations, sync batches) with no `beginBackgroundTask`/
expiration handling and no resumability — the OS suspends the app mid-operation, leaving corrupt
half-state; work silently dies when the user backgrounds at the wrong moment.

**Detect.** Identify operations that must complete once started. Verify: background task assertions
around them with expiration handlers that checkpoint; long transfers on `URLSession` background
configuration; state machines resumable from any checkpoint at next launch (V:10's client face).

**False positives.** Pure reads/refreshes safely restartable from scratch; operations already on
background URLSession.

## LL:11 — Combine/async pipelines dying silently on first error or never starting

**Statement.** Combine pipelines where one upstream error terminates the subscription forever (UI
stops updating until restart), `sink` results discarded so the pipeline deallocates instantly, or
async sequences consumed once and never restarted after failure.

**Detect.** Audit `sink`/`assign` sites: cancellables stored? Error events handled with retry/replace
(`catch`, `retry`) where the stream must stay alive? For `for await` loops: what restarts them after a
throw? A UI stream that can terminate on error without recovery is a finding.

**False positives.** One-shot pipelines (single request) where termination is the design; streams
whose owner restarts them on scene activation (verify it does).

## LL:12 — Blocking primitives inside the cooperative thread pool

**Statement.** `DispatchSemaphore.wait`, `sleep`, sync `DispatchQueue` hops, or lock-held awaits inside
Swift-concurrency tasks — the cooperative pool's threads are few by design; blocking them starves or
deadlocks the entire concurrency runtime (the async/await deadlock classic: waiting on work that needs
the thread you hold).

**Detect.** Grep async contexts for semaphores, `sleep`, `.sync {`, and `NSLock` held across `await`.
Replace with structured awaiting (`await` the thing, `Task.sleep`, actors for mutual exclusion).
Bridging sync APIs to async via semaphore is the highest-priority hit.

**False positives.** Semaphore bridging in synchronous legacy call sites that are provably OFF the
cooperative pool (still fragile — prefer refactor); `os_unfair_lock` around non-awaiting critical
sections.

## LL:13 — A11y: gesture-only custom controls, and platform-twin fixes applied to one target only

**Statement.** Native custom-drawn interactive controls (gesture-driven sliders, canvases, drawn charts) shipped without an accessibility element exposing the SAME operation the gesture performs (adjustable action, activate action, keyboard path) — and accessibility fixes applied to one platform target while the sibling target's twin of the same control keeps the pointer-only implementation. A label-only combine element is perceivable but not operable.

**Detect.** For every DragGesture/onTapGesture on a drawn shape (not a Button/Slider), require a paired accessibilityElement plus accessibilityAdjustableAction/accessibilityAction providing equivalent operation. When an a11y fix lands, grep the OTHER platform target for the twin view (same scrubber/chart pattern) and verify the same treatment.

**False positives.** Purely decorative/read-only visualizations with an equivalent accessible data representation adjacent; controls where an alternate accessible control (buttons) provides the same operation.
