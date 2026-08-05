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
