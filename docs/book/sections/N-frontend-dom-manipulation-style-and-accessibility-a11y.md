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
