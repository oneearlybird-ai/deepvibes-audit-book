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
