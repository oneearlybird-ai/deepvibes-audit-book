---
section: HH
title: "Mobile & Native Clients"
group: platform-delivery
---

# [HH] Mobile & Native Clients

## HH:1 — Embedded Secrets: API keys/secrets compiled into the app binary — extractable with strin…

Embedded Secrets: API keys/secrets compiled into the app binary — extractable with strings/jadx in minutes.

## HH:2 — Pinning: Certificate/public-key pinning absent — or hard-pinned with no rotation path, b…

Pinning: Certificate/public-key pinning absent — or hard-pinned with no rotation path, bricking old installs on cert renewal.

## HH:3 — Storage: Tokens stored in UserDefaults/SharedPreferences instead of Keychain/Keystore

Storage: Tokens stored in UserDefaults/SharedPreferences instead of Keychain/Keystore.

## HH:4 — Deep Links: Universal/app links processing unvalidated parameters straight into navigati…

Deep Links: Universal/app links processing unvalidated parameters straight into navigation and API calls.

## HH:5 — Version Gates: No minimum-supported-version enforcement — ancient clients hit removed AP…

Version Gates: No minimum-supported-version enforcement — ancient clients hit removed APIs with no upgrade prompt.

## HH:6 — Push Hygiene: Push tokens not unregistered on logout — notifications (with content) reac…

Push Hygiene: Push tokens not unregistered on logout — notifications (with content) reach logged-out shared devices.

## HH:7 — WebViews: Remote content loaded in WebViews with JS bridges exposed to arbitrary origins

WebViews: Remote content loaded in WebViews with JS bridges exposed to arbitrary origins.

## HH:8 — ATS: App Transport Security exceptions permitting cleartext HTTP "temporarily, for one e…

ATS: App Transport Security exceptions permitting cleartext HTTP "temporarily, for one endpoint."

## HH:9 — Shared cross-platform module hardcodes the platform or origin discriminator

**Statement.** Code shared across several platform targets stamps a constant identifying the client —
attribution source, user-agent, device class, analytics channel, telemetry origin — chosen back when
the module served one platform. Every other target inherits the wrong value. Nothing fails: the write
succeeds, the field validates, and the record is silently miscategorized wherever it is later grouped,
filtered, or reported. The defect surfaces as a quietly wrong dashboard rather than an error, so it can
persist for as long as nobody questions the breakdown.

**Detect.** Grep shared modules for literal platform and client identifiers, and trace each to the set
of targets that compile it. Any such literal living in shared code — rather than in per-target
configuration or behind a compile-time platform condition — is the finding. Audit the downstream
consumers too: a value that has been wrong for a while is already embedded in stored records and
historical aggregates, so the fix carries a data-correction question with it.

**False positives.** Constants naming the shared module or SDK itself rather than the host platform;
identifiers genuinely owned by one target, in code compiled only into that target; and shared-module
code whose only live callers are on the matching platform (verify by call-site inventory — latent,
not wrong, until a second platform adopts the shared API and inherits the constant).

## HH:10 — Debug-only instrumentation guarded at the call site but linked in every configuration, so its private-API symbols ship in the store binary

**Statement.** A development/QA harness — an in-process automation bridge, an inspector, a state
server — is installed with the intent that it exists only in debug builds, and the *call sites*
are correctly wrapped in the language's conditional-compilation directive. That guard is real but
it removes **calls, not linkage**. The dependency is declared unconditionally in the project's
link phase, or the guarded module depends on the instrumentation module with no configuration
condition, so the release configuration still compiles and links the whole library. For anything
whose runtime is name-based — Objective-C selectors, reflection metadata, exported symbol tables
— the identifiers are then emitted into the shipped binary *whether or not any code path can
reach them*, because they are string literals in a data section rather than call targets the
linker can prove dead. Store review scans those sections, not the call graph, so an app whose
source is provably free of private-API calls is rejected for private-API usage. The harness is
usually the worst possible payload for this: touch synthesis, view-hierarchy inspection and
state mutation are implemented *specifically* through the private APIs review prohibits, so a
single unconditional link converts a QA convenience into a blocked release.

The failure is durable rather than one-off because the instrumentation is typically installed by
a generator or template, and the generated manifest often *documents* the guard it did not emit —
a comment asserting a configuration-conditional dependency, and a CI invariant that inspects the
built binary, neither of which exists in the artifact. The team then reads its own scaffolding as
proof of safety (see NN:15, and the class of "a claim is not a guard" findings generally).

**Detect.** Never reason from the call sites; read the link. Enumerate what the release
configuration actually links: every product in the app target's link phase without a
configuration filter, plus every dependency edge inside the package graph that carries no
configuration condition — one unconditional edge anywhere in the transitive closure defeats every
guard above it. Then stop arguing and inspect the artifact: build the release configuration and
dump the binary's symbol table and string sections, grepping for the instrumentation's module
name and for the specific private identifiers it is known to use. Absence of the module name is
not sufficient on its own, since a renamed or vendored copy leaks the same selectors. Where the
platform publishes the prohibited-API list, match against the list rather than a hand-kept
subset. Make that inspection a merge-blocking gate on the release build — it is the only check
that observes what actually ships, and the manifest's claim that such a gate exists is worth
exactly nothing until you have run it and watched it fail on a dirty binary.

**False positives.** Instrumentation genuinely excluded from the release configuration — verified
by inspecting the release binary, not by reading the manifest. Test-only targets that are never
part of the shipped bundle. Symbols that merely resemble private identifiers but belong to the
app's own namespace; confirm against the platform's published list before filing. A separate
debug-only application target, distinct from the shipped one, that links the harness deliberately.

## HH:11 — A client build embeds a service hostname the platform treats as movable, so an infrastructure move strands every installed build

**Statement.** A native or web client reaches a long-lived service — a realtime socket, a media
gateway, an upload endpoint — through a hostname written into the build as a constant or a
build-time environment default. The platform, meanwhile, treats that hostname as one it may
re-home: the record moves between DNS zones during an account or cell migration, or the custom
domain behind it is re-created, and nothing on the platform side lists the installed clients as
consumers of the name. The next move omits the record or points it elsewhere, and every build in
the field — the store version, the beta, the ones users will not update for months — fails the
same way at the same moment with no server-side change able to reach them. The failure is worse
than a broken web deploy because it cannot be rolled forward: only a store release repairs it, and
until then the platform must resurrect the old name regardless of where it wanted to be.

The mechanism has two halves that are usually owned by two teams and reviewed separately: the
client that embeds the name never appears in the infrastructure's consumer list, and the
infrastructure that moves the name never sees the client's constant. A build-time environment
override with an embedded default is the same defect wearing a configuration costume: the default
is what ships, and the override is set nowhere.

**Detect.** In each client codebase, list every scheme-qualified host literal (`wss://`, `https://`,
`stun:`, custom-scheme URLs) and every build-time environment variable whose *default* is a host.
For each, find the platform artifact that owns the name: the DNS record and the certificate or
custom-domain resource. If the name is not declared in the platform's routing layer with the
client named as a consumer, or the client learns it from anything but a server response it
already fetches at bootstrap, flag it. Prove the exposure live: resolve the name from a public
resolver and open the protocol handshake; a name that answers today is still a finding if a
rename would require a store release to repair. The fix has a fixed shape: the platform's routing
layer owns the public name, the server hands the address to clients in the bootstrap payload they
already parse, and the client refuses to connect until it has been handed one — no embedded
default, no environment override.

**False positives.** The API origin the bootstrap request itself is sent to — something has to be
embedded to fetch the rest, and that one name must be treated as permanent and owned by the
routing layer explicitly. Hosts that are genuinely immutable by contract with a third party (a
vendor's fixed API domain). A development or test target that points at a fixture server and is
never shipped.

## HH:12 — A later-added orientation or onboarding overlay is guarded on its own readiness only, so it presents over a pre-existing gate screen and makes the gate unreachable on exactly the installs the gate exists for

**Statement.** Two features are added months apart to the same launch path. The first is a GATE: a
screen shown when the session lacks something the app needs chosen before it can proceed — a
workspace, a profile, a location, a role. The second is an ONBOARDING overlay, presented on first
run and guarded on a condition about ITSELF (not yet seen, not in some other mode) with no
reference to the gate. Each is correct alone, and the overlay presents over the gate, with a
dimming scrim, on every fresh install. The gate is still rendered and still functional underneath;
the user simply cannot see it, and reaches it only by finding a skip or close control. Reported,
this reads as "sign-in took me nowhere" or "the picker is gone", which sends the investigation to
authentication and to the gate's own recent history, where it finds nothing, because neither is
broken. The overlay is also usually meaningless at that moment — it orients the user to a thing
they have not selected yet — so the harm is doubled: the useful screen is hidden behind a useless
one. It survives review because it is invisible to anyone whose install is already past the gate,
which includes everyone who tested the overlay when it shipped.

**Detect.** Enumerate every modal, sheet or full-screen overlay presented automatically on launch
and list the conditions each is guarded on; then enumerate every gate screen the launch path can
show. Any overlay whose guard does not reference the gate states is this defect. Verify on a CLEAN
install in each gated state rather than on a developer account, since the gate states are exactly
the ones a long-lived install never re-enters. The remedy is to make the overlay wait for the
precondition its own content assumes, and — because a launch-time presentation usually runs once —
to also offer it at the moment the gate clears, so the user who arrives gated is not silently
skipped instead of merely delayed.

**False positives.** Overlays that must precede the gate by design (a legal acceptance, a
version-required notice, a security prompt); gates that are themselves presented modally above the
overlay by the same coordinator; and apps where the launch presentation is centrally sequenced and
the ordering is asserted in one place.

## HH:13 — A setting the other clients present as administrator-owned and read-only is left editable on one client, so the weakest surface becomes the way to change it

**Statement.** A configuration value belongs to an administrator and determines how the rest of the
product behaves for that account — the template it renders, the workflow it runs, the vertical shell
it presents. The web client and one native client express that ownership by showing the value as a
locked badge with the owner named. A second native client, built later or from an older screen,
still carries the full editing control it inherited from the creation flow, because the restriction
was implemented as a per-screen presentation choice rather than as a property of the value. No
server rule contradicts it, since the endpoint was always permitted to accept the write from an
account member. The result is not a cosmetic inconsistency but an authorization boundary that exists
on two surfaces and not the third: the account can change its own governing setting through the one
client that forgot to lock it, and the change is legitimate at every layer it passes through. The
blast radius is disproportionate to the control's size, because a value that selects a whole
behavioural mode reconfigures features the person editing it never saw and did not intend to touch.
The defect is systematically underweighted in review, because each client's screen reads as correct
on its own and only the comparison across clients shows the hole.

**Detect.** Enumerate governing settings by consequence rather than by widget: any value that
selects a template, a workflow, a pricing mode or a vertical is one, whatever it is called in the
model. For each, list every client that renders it and record the affordance each one offers —
locked badge, disabled control, or live editor — and treat any disagreement between clients about
the same value as the finding, with the most permissive client naming the real boundary. Then test
whether the restriction is presentation-only by checking the server: if the write endpoint accepts
the change from an ordinary account member, the lock exists solely in whichever screens remembered
to draw it, and adding the badge to the third client narrows the gap without closing it. Creation
flows are a deliberate exception and must be separated from post-creation editing surfaces, because
the value is legitimately chosen once.

**False positives.** A client that shows the control to users who genuinely hold the administrative
role is correct, and the comparison must hold the viewer's role constant before it means anything. A
value that is merely a display preference, with no downstream behavioural consequence, does not
carry this blast radius even where clients disagree about it. And a client deliberately shipping an
editing surface the others lack as a stated, role-gated administrative tool is a design decision
rather than an omission, provided the gate is enforced server-side.

## HH:14 — Withdrawn: a duplicate of LL:17, which already states this mechanism

**Statement.** Withdrawn before any finding cited it. The mechanism it described — a centred, non-scrolling card with
fixed-height controls that becomes unreachable at the largest accessibility text sizes, hardest on the first screens a
person meets — is LL:17. Cite LL:17; the one point this entry added (a blocking first-run overlay must also be
dismissable through the platform's accessibility escape gesture) now sits in LL:17's Detect. The number stays reserved
because the Book never renumbers.

## HH:15 — A row's wrapped state is never designed: the layout is checked only at the width where the longest expected value fits beside its label, so the one value that wraps renders in the container's default alignment nobody chose

**Statement.** A label/value row is composed from a shared primitive that lays the two out side by side. On the wide client every allowed value fits. On the narrow client one long but legitimate value (a status sentence, a provider-specific name) cannot fit beside its label, the primitive stacks it, and the stacked block takes the alignment of the enclosing container rather than the leading edge every other row shares - so the one row that wraps sits centred in a card of left-aligned rows. Nothing is clipped or hidden; the row reads as a different component. The row was built against the short values the fixtures carry and the long value appears only in one state (one lane, one error, one locale), so the regression is seen in a screenshot of that state and nowhere else. The sibling client with explicit wrap handling shows the same value correctly, which is the parity evidence.

**Detect.** For each composed label/value row, list the longest value each state can produce (status sentences, localized strings, provider names) and render the row at the narrowest supported width with that value. A stacked result whose alignment differs from the row's unwrapped alignment, or from the sibling client's wrapped row, is the finding. In code: a stacking fallback inside the primitive with no explicit frame/alignment on the stacked branch inherits the container's default; the fix is one explicit full-width, leading-aligned frame on the row.

**False positives.** Rows whose stacked state is intentionally centred (a hero or summary tile, by design and matching the sibling client); values that are truncated with an ellipsis rather than wrapped, where the question is truncation not alignment; primitives that already pin alignment on both branches.

## HH:16 — A desktop layout's breakpoint sits above the app's own default window size, so the layout the design describes appears only after a resize and the fallback is what every first run shows

**Statement.** A desktop app docks a side panel beside its main view from a minimum window width and floats it over the main view below that width. The threshold is chosen for the panel's comfort, and the app's default and minimum window size were set earlier for other reasons; when the default is below the threshold, every fresh launch shows the floating fallback - covering part of the main view the design says stays usable - and the docked layout is seen only by people who widen the window. Snapshot tests recorded at a larger size never show the default state.

**Detect.** Read the app's default and minimum window size and every width threshold that switches a layout; a threshold above the default is the finding when the below-threshold layout breaks a stated property (a clickable main view, a visible column). Confirm by launching at the default size.

**False positives.** Thresholds above the default where the fallback is the intended default layout and the design says so; apps that restore a saved window size larger than the threshold for every user, verified on first launch.

## HH:17 — A native app declares an entitlement that its registered app identifier does not enable, so every build compiles and archives and then fails at signed export, and the release lane stays red until someone with portal access changes a setting no code review can see

**Statement.** Platform capabilities on native apps (payments, push, associated domains, keychain groups, app groups) live in two places: the entitlements file in the repository, and the capability switches on the app identifier registered with the platform vendor, from which signing profiles are generated. A change adds the entitlement to the file and lands green: the compiler does not check it, simulators and local debug builds run with development signing that tolerates it, and unit and UI suites never sign for distribution. The first step that reconciles the two is the cloud build's signed export, which fails for every build from that commit on. The failure is read as flaky CI, the fix is a portal setting that only an account holder can change, and a release lane can stay red for weeks while every land gate is green.

**Detect.** Diff every entitlement key in each target's entitlements file against the capabilities enabled on that target's registered app identifier (portal export, the vendor's API, or the generated profile's embedded entitlements). Read the release lane's history: a run of consecutive export or signing failures that began with the commit introducing an entitlement is the signature. Check whether any land gate compares entitlements to the profile; none means the repository cannot detect this.

**False positives.** Entitlements that are development-only and stripped from the release configuration; capabilities that need no app-identifier switch; a lane failing at export for a reason the export log names that is unrelated to entitlements (an expired certificate, an agreement awaiting acceptance).

## HH:18 — A native app's "email me a link" reuses a web-first verify endpoint, so for an address that already has an account the link signs a browser in and the app that asked stays signed out

**Statement.** Passwordless email links are usually built for the web first. The verify endpoint resolves the address; for a new address it mints a single-use token and redirects to an account-creation page, and for an existing account it mints a browser session (a cookie) and redirects to a signed-in web page. A native client that adds the same "email me a link" reuses the start endpoint unchanged, and its universal-link or app-link handler claims the account-creation path, so the new-account branch comes back into the app and the feature passes every test that creates an account. The existing-account branch has nothing the app can use: the link opens in the mail client's browser or the default browser, the cookie lands there, the redirect lands on a web page the app does not claim, and no token or code ever reaches the app. The person sees themselves signed in, in a browser, returns to the app, and is still at its sign-in screen. Suites that exercise only account creation, and offline fixtures that stub the send, cannot see it.

**Detect.** Read the verify handler end to end for both branches — an address with no account and one with an account — and write down what each returns: a token on a path, a cookie, a redirect target. If either branch ends in a cookie and a redirect to the web origin, list every native client that can trigger the send (the start endpoint usually takes no client hint) and every path each app claims (its associated-domains or app-links file and its deep-link handler). A native lane needs a branch that hands the app a single-use code or token on a claimed path, or a code the person types, exchanged by a native session endpoint. Then read the copy: an app that offers the link to every address has the full defect; one that offers it only for account creation has it only for a returning person who takes that path anyway.

**False positives.** Apps whose verify handler returns a token on a claimed path for both branches; apps that offer the link only for account creation and whose existing-account branch refuses or explains instead of signing a browser in; flows that are meant to sign the browser in (a "continue on the web" link) and say so; platforms where the link opens in an in-app view that shares the native session store.
