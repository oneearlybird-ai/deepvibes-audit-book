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
