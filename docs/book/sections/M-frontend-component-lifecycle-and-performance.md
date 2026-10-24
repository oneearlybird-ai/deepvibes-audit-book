---
section: M
title: "Frontend: Component Lifecycle & Performance"
group: frontend
---

# [M] Frontend: Component Lifecycle & Performance

## M:1 — Memory Leaks: useEffect hooks missing cleanup return functions for setInterval, WebSocke…

Memory Leaks: useEffect hooks missing cleanup return functions for setInterval, WebSockets, or lingering window event listeners.

## M:2 — Re-rendering Thrashing: Missing useMemo or useCallback on heavy object/function props pa…

Re-rendering Thrashing: Missing useMemo or useCallback on heavy object/function props passed to deeply nested child components, destroying React diffing optimization.

## M:3 — LCP/CLS: Images missing strict dimension attributes (width/height) or fetchpriority load…

LCP/CLS: Images missing strict dimension attributes (width/height) or fetchpriority loading hints, causing Cumulative Layout Shifts.

## M:4 — Lifecycle: Neglecting to Detach Window Observer Callbacks

Lifecycle: Neglecting to Detach Window Observer Callbacks. Setting up complex intersection or resize listeners inside layout lifecycles without defining corresponding cleanup routines, leading to rapid browser memory leaks during single-page transitions.

## M:5 — Performance: Unthrottled Keypress Event Triggers on Real-time Search Inputs

Performance: Unthrottled Keypress Event Triggers on Real-time Search Inputs. Firing heavy client-side calculations or backend network requests on every single character input instead of introducing standardized debouncing utilities, causing visible interface freeze frames.

## M:6 — Virtualization: 10k-row lists fully rendered to the DOM instead of windowed rendering (r…

Virtualization: 10k-row lists fully rendered to the DOM instead of windowed rendering (react-window/virtualizer).

## M:7 — Context: High-frequency-changing values placed in one broad React Context, re-rendering…

Context: High-frequency-changing values placed in one broad React Context, re-rendering the entire subscriber tree.

## M:8 — Render Loops: setState during render or effect chains re-triggering themselves — runaway…

Render Loops: setState during render or effect chains re-triggering themselves — runaway render thrash.

## M:9 — Stale Closures: Effects/callbacks capturing outdated state due to missing or incorrect d…

Stale Closures: Effects/callbacks capturing outdated state due to missing or incorrect dependency arrays.

## M:10 — Aborting: Fetches without AbortController — unmounted components updating state and raci…

Aborting: Fetches without AbortController — unmounted components updating state and racing the next mount.

## M:11 — Main Thread: Heavy parsing/computation on the UI thread instead of Web Workers — long ta…

Main Thread: Heavy parsing/computation on the UI thread instead of Web Workers — long tasks blocking input responsiveness.

## M:12 — Animations: Animating layout properties (top/left/width) instead of transform/opacity —…

Animations: Animating layout properties (top/left/width) instead of transform/opacity — forced reflow jank.

## M:13 — A hook called after an early return, so the hook count changes with the component's own visibility state and the render crashes on toggle

**Statement.** A component takes an early return on a falsy state — `if (!open) return null` for a
modal, `if (!data) return <Spinner/>` for a panel — and a hook call sits BELOW that return. On the
renders where the guard fires, the component runs fewer hooks than on the renders where it does not,
which violates the hook-ordering contract every hook-based runtime depends on: the runtime indexes
hook state positionally, so a changing count means state is read from the wrong slot. The framework
detects the mismatch and throws, taking down the subtree — and because the guard is usually tied to
the very interaction the component exists for, the crash fires precisely when the user opens the
thing. It never fires on first mount, never in a snapshot test that renders one state, and never in a
static type check; the component is "working" in every view except the one that matters. The defect
is also a magnet for well-intentioned edits: hooks migrate below the guard during refactors that move
early-return guards upward for readability, so a component can be correct for months and break in a
change that touched no logic.

**Detect.** For every component with an early return, read the whole body BELOW that return and list
any hook calls found there — this is a purely structural read and needs no reasoning about state. The
ecosystem's exhaustive-hooks lint rule catches this class outright, so the more valuable check is
whether that rule is (a) enabled, (b) at error rather than warning severity, and (c) actually running
over the directories the components live in — a lint gate that resolves to zero files, or reports
warnings the pipeline does not fail on, is the reason the defect reached production and is itself the
finding. Confirm at runtime rather than by inspection where you can: exercise the toggle that flips
the guard and watch for the runtime's hook-count error, which names the component directly. While
reading, check the guard's siblings for the mirror defect — a value derived with a non-null assertion
or optional-chain-free access just above the guard, which throws on the same state the guard exists
to handle.

**False positives.** Early returns that are unreachable in practice because a parent already gates
rendering (still worth fixing, but not a live crash); frameworks whose hook implementations are keyed
rather than positional; calls that look like hooks by naming convention but are ordinary functions
with no hook state; and components where the "early return" is inside a callback or effect body
rather than the render path, where no ordering contract applies.

## M:14 — Above-the-fold autoplay video shipped at source scale with no poster — the largest paint waits on a multi-megabyte decode

**Statement.** A hero/above-the-fold `<video autoplay>` ships encodes sized for the production
master (e.g. 4K at streaming bitrates) regardless of the box it actually renders in, lists the
heaviest source first (browsers take the FIRST playable `<source>`, not the smallest), offers no
smaller rungs for smaller viewports, and carries no `poster`. Autoplay forces the download for
every visitor — `preload` hints are moot once autoplay is set — and with no poster the element's
first paintable frame IS the decode of that download, so the page's largest contentful paint is
bound to a multi-megabyte media fetch and the hero renders as a blank box in the interim. The
waste is provable, not aesthetic: compare encoded pixel area against the element's rendered area
× devicePixelRatio — pixels beyond that product are computed, transferred, and discarded.

**Detect.** Find above-the-fold `<video>` elements with `autoplay`. For each `<source>`, probe
encoded resolution/bitrate (ffprobe) and file size; compare against the element's rendered box on
representative viewports (`getBoundingClientRect()` × DPR). Check source ordering against
per-browser playability and size — the common defect is the largest file listed first. Check for
a `poster` attribute. Measure the FCP→LCP gap and the media request's transferSize share of the
page total.

**False positives.** Content players where the video is the product and playback is
user-initiated; posters genuinely present (first-frame extraction, so the poster→video handoff is
invisible); multi-rung selection implemented in JS render forks (`<source media>` is unsupported
for video, so its absence alone is not the finding when a JS fork exists).

## M:15 — An effect's setup performs a global side effect whose cleanup has a delayed consequence (a pushed history entry popped asynchronously), so the development double-invoke lands the first cleanup's late event on the second setup and the component tears itself down

**Statement.** A UI framework's development mode deliberately runs every effect's setup, cleanup and setup again on mount, to surface effects that are not idempotent. An overlay hook pushes a placeholder entry onto the browser history when it opens, listens for the back event to close, and on cleanup pops its entry with an asynchronous back navigation. Under the double invoke the sequence is push, back (queued), push, and then the queued back completes: the browser fires the back event, the second setup's listener is now on top of the overlay stack, and it treats the event as the user pressing Back, so the overlay closes itself the moment it opens. Production builds run each effect once, so every production check is green while every developer and every preview reviewer sees overlays that cannot stay open, and the usual response is to blame the dev server rather than the hook. The same shape applies to any setup whose undo completes later than the cleanup returns: an asynchronous unsubscribe, a deferred navigation, a timer that fires a close.

**Detect.** For each effect whose setup touches global state (history, focus, scroll lock, document listeners, sockets), read the cleanup and ask whether any of its consequences arrive after it returns. If one does, trace the setup, cleanup, setup sequence and check whether the second setup can receive the first cleanup's late event; reproduce in the framework's strict development mode at the viewport where the effect activates. A guard that ties each late event to the instance that caused it (a token in the history state, a pending-pop counter checked by identity) is the fix shape.

**False positives.** Effects whose cleanup is fully synchronous; frameworks or configurations where the development double invoke is disabled and documented as such; overlays whose history entry is pushed by a navigation the router owns rather than by the effect.

## M:16 — A provider wraps its children in a second provider only once a resource exists, so the moment the resource arrives the element tree changes shape at that position and React remounts the whole subtree, resetting every piece of local state below it

**Statement.** A context provider holds a lazily created client (an embedded-payments session, a socket, an SDK instance) and renders `instance ? <SdkProvider instance={instance}>{children}</SdkProvider> : children`. React identifies children by their position and element type; inserting a wrapper changes the type at that position, so React unmounts the old subtree and mounts a new one. Everything below - the page the user is on, its half-filled form, a flag the click handler just set - starts over, while the provider's own state (the new instance) survives. The visible symptom is an action that seems to need two presses: the first press sets local state and creates the instance, the remount throws the local state away, and the second press, with the instance now present, works. Any effect that fetches on mount also runs twice.

**Detect.** Grep providers and layout components for a conditional that returns the children either wrapped or bare (`cond ? <X>{children}</X> : children`). For each, find the local state below it that the triggering action sets, and confirm by pressing the action once and watching whether that state survives (React DevTools shows the remount). Keep the tree shape constant: always render the wrapper (with a null or placeholder value), or lift the triggering state above the conditional.

**False positives.** Wrappers that are present on every render with a changing prop; conditionals above a subtree that holds no local state and does no mount-time work.
