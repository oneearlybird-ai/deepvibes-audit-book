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

## N:14 — Decorative ambient media exposed to assistive tech — background video announced as content

**Statement.** A purely decorative ambient media element — a muted, looping, non-interactive
background video or animation with no speech and no informational content — is rendered without
`aria-hidden="true"`, so assistive technology announces it as page content, and a11y tooling
demands captions/`<track>` elements it cannot meaningfully have. The correct posture for
ambience is invisibility to assistive tech: captions here would be wrong, not missing. The
element carries meaning only as atmosphere, and a screen-reader user gains nothing but noise
from its announcement.

**Detect.** For each `<video>`, `<canvas>`, or animation container in a layout/background role
(muted + loop + autoplay + no controls, absolutely positioned behind content, or opacity/vignette
treated), check for `aria-hidden="true"` or `role="presentation"`. Audit-tool output demanding
caption tracks on speechless ambience is the smell that the element is exposed. Confirm the
element genuinely carries no informational content before flagging.

**False positives.** Media with speech or informational content (captions genuinely required);
videos with visible controls; media that IS the page content (product demos, testimonials);
decorative media already inside an `aria-hidden` ancestor.

## N:15 — A static utility paints the property a component plugin's state selector owns, and layer order lets the utility win

**Statement.** A form-control plugin renders interactive state by setting a property on a state
selector in the base layer — `:checked { background-color: currentColor }` and the check glyph it
paints on top. A utility class from a later layer sets the same property unconditionally on that
element, and layer order gives the utility precedence over the base-layer state rule. The control
still receives the state, still submits, still fires its handler — only the paint is lost, so the
checked and unchecked renderings are identical. Because the state, the request and the response are
all correct, the report arrives as "I turned it on and it shows empty" and the investigation goes to
the data plane, where nothing is wrong.

**Detect.** For every interactive control carrying a background/border/color utility, resolve the
cascade against the plugin's state rules in the app's OWN compiled stylesheet — layer order, not
specificity, decides this and reading the source classes will mislead you. Render the control in
both states side by side in every theme; a checked control indistinguishable from its opposite is
the defect. Style state through the plugin's own hooks (accent color, state variants) rather than a
static utility.

**False positives.** Controls deliberately styled from scratch with `appearance: none` and their own
state rules; utilities scoped to a state variant rather than applied unconditionally.

## N:16 — Selected-state styling painted outside the border box inside a scroll container with no padding, so only the first and last children are clipped

**Statement.** A row of controls — tabs, segments, chips — marks the selected one with an effect that
paints outside the element's own border box: a ring or outline offset from the edge, a drop shadow, a
transform that scales the element up. The row itself is a horizontally scrollable container so it can
cope with narrow viewports, and it carries no inline padding because at rest nothing needs the room.
The moment a control is selected, its outside-the-box paint extends past the container's content edge
and is clipped by the overflow boundary. Only the first and last children can hit that edge: every
control in the middle has a neighbour to spill over, so it looks perfect. The result is a defect that
appears to be about specific tabs rather than about selection — a few pixels shaved off one side of the
leftmost or rightmost item, present only while that item is selected — which reads as random and is
almost never reproduced from a bug report on the first attempt. It survives review because each
ingredient is idiomatic on its own, and it survives visual regression suites whose snapshots are taken
with the default (usually first) tab selected in a viewport wide enough that no scrolling occurs.

**Detect.** For every scrollable or clipping container, list the children's selected/hover/focus styles
and flag any that paint or transform outside the border box; the pairing is the finding, before any
screenshot. Reproduce deterministically by selecting the FIRST and the LAST child in turn, at a viewport
narrow enough that the container actually scrolls — the middle child is not a control case. Remedies in
order of durability: keep the state style inside the box (background and text weight rather than ring,
shadow, or scale), or give the container inline padding at least equal to the outermost paint extent,
or remove the clipping boundary by letting the row wrap instead of scroll. Check focus rings under the
same lens — a keyboard focus indicator clipped at the container edge is the accessibility form of this
defect and is more serious than the aesthetic one.

**False positives.** Containers that clip deliberately as an affordance (a carousel whose partially
visible edge item signals more content). Effects whose extent is smaller than existing padding, where
the arithmetic already covers them — verify against the compiled stylesheet rather than the source
tokens. Rows that never scroll because their content cannot exceed the viewport at any supported size.
