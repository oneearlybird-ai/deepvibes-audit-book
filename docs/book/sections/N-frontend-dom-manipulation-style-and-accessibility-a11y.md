---
section: N
title: "Frontend: DOM Manipulation, Style & Accessibility (a11y)"
group: frontend
---

# [N] Frontend: DOM Manipulation, Style & Accessibility (a11y)

## N:1 — a11y: Attaching interactive onClick events to generic <div> or <span> elements without r…

a11y: Attaching interactive onClick events to generic <div> or <span> elements without role="button", tabIndex, or keyboard event handlers.

## N:2 — Focus Traps: Missing focus traps for modal dialogs, allowing users to tab out into the o…

Focus Traps: Missing focus traps for modal dialogs, allowing users to tab out into the obscured background DOM.

## N:3 — DOM: Direct document.querySelector manipulation bypassing the framework's virtual DOM re…

DOM: Direct document.querySelector manipulation bypassing the framework's virtual DOM reconciliation.

## N:4 — a11y: Missing Aria-Live Politeness Assertions on Dynamic Toast Alerts

a11y: Missing Aria-Live Politeness Assertions on Dynamic Toast Alerts. Appending temporary status notifications or security error indicators directly into the view layout without proper accessibility indicators, leaving screen readers unaware of critical application messages.

## N:5 — DOM: Relying on Component Array Index Ordering for Loop Keys

DOM: Relying on Component Array Index Ordering for Loop Keys. Utilizing default array iteration indices (key={index}) within dynamic lists that undergo sorting or filter mutations, leading to broken component state tracking and erratic interface updates.

## N:6 — Contrast: Text and interactive elements below WCAG AA contrast ratios

Contrast: Text and interactive elements below WCAG AA contrast ratios.

## N:7 — Labels: Form inputs without programmatically associated <label>/aria-label

Labels: Form inputs without programmatically associated <label>/aria-label.

## N:8 — Error Semantics: Validation errors conveyed by color alone — no text/aria-describedby fo…

Error Semantics: Validation errors conveyed by color alone — no text/aria-describedby for assistive tech.

## N:9 — Motion: prefers-reduced-motion ignored — parallax and auto-playing motion forced on sens…

Motion: prefers-reduced-motion ignored — parallax and auto-playing motion forced on sensitive users.

## N:10 — Headings: Broken heading hierarchy (h1→h4 jumps) destroying screen-reader document outli…

Headings: Broken heading hierarchy (h1→h4 jumps) destroying screen-reader document outlines.

## N:11 — Zoom: Layout breaks or content clips at 200% browser zoom / text-only scaling

Zoom: Layout breaks or content clips at 200% browser zoom / text-only scaling.

## N:12 — Skip Links: No skip-to-content link — keyboard users tab through the full nav on every p…

Skip Links: No skip-to-content link — keyboard users tab through the full nav on every page.

## N:13 - Design-token indirection consumed in a form the build or the browser cannot resolve, yielding invisible or mis-themed UI with no error

**Statement.** Token systems put a layer of indirection between a component and a colour, and that
layer has forms the toolchain silently refuses to resolve. Two shapes dominate. First, a token
defined as a static utility rather than as a first-class theme colour: the utility works bare, but
every modifier form composed on top of it - opacity suffixes above all - generates no CSS at all, so
the element renders fully transparent. Second, a token stored as raw colour channels intended to be
wrapped by a colour function at the use site: consumed directly, or wrapped when the variable already
holds a resolved colour, the declaration is invalid and the browser drops it, falling back to an
inherited value that happens to look correct in the theme the author was viewing and wrong in the
other. Both fail *silently*: no build error, no console warning, no failing test - the only symptom
is a control the user cannot see or a surface that is unreadable in one theme. They also cluster, so
a single mis-declared token can blank out unrelated surfaces across the product, and the bug is
routinely misfiled as "the settings buttons are missing" rather than as a token defect.

**Detect.** Do not review the component - review the token declaration and every form the codebase
composes on it. For each token, enumerate the modifier forms in use and confirm each emits CSS in the
built stylesheet, not in source: grep the compiled output for the generated class names. For
channel-style variables, resolve what the variable actually holds and check every use site applies
the matching wrapper - a mixed codebase where some variables are channels and some are resolved
colours guarantees mistakes at the boundary. Verify visually in both themes, since one theme's
fallback frequently coincides with the intended colour and hides the defect. A token gate that
asserts only that tokens are *used* rather than that they *emit* will not catch either shape.

**False positives.** Utilities deliberately defined statically because no modifier form is ever
composed on them; intentional transparency; variables documented as channel-only with a lint rule
enforcing the wrapper at every use site.
