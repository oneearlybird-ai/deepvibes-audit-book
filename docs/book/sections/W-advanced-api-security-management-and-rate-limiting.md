---
section: W
title: "Advanced API Security, Management & Rate Limiting"
group: saas-core
---

# [W] Advanced API Security, Management & Rate Limiting

## W:1 — GraphQL: Unbounded Query Depth and Introspection Vulnerabilities

GraphQL: Unbounded Query Depth and Introspection Vulnerabilities. Allowing clients to submit deeply nested, recursive object relational query patterns to public endpoints without depth analysis limits, enabling malicious actors to trigger immediate system resource starvation.

## W:2 — REST/BOLA: Relying on Sequential Integer IDs for Object Referencing

REST/BOLA: Relying on Sequential Integer IDs for Object Referencing. Exposing simple database serial IDs (e.g., /api/orders/4051) within public application endpoints instead of using randomized UUIDv4 identifiers, allowing attackers to systematically harvest cross-tenant user data by incrementing URL resource numbers.

## W:3 — API Abuse: Lack of Scoped Token Revocation Routes

API Abuse: Lack of Scoped Token Revocation Routes. Implementing permanent third-party API developer key tokens without providing instantaneous revocation methods or security rotation mechanisms, exposing platform resources if a developer keyset is committed to a public repository.

## W:4 — Payload Exploitation: Unchecked Upload Allocation Parameters

Payload Exploitation: Unchecked Upload Allocation Parameters. Accepting massive, unsanitized multi-part request data payloads at the API Gateway layer without asserting rigid size limits, exposing downstream computing functions to rapid memory exhaustion or storage exhaustion vector attacks.

## W:5 — Rate Keys: Limits keyed only on IP (useless behind CDN/CGNAT) with no per-identity tier

Rate Keys: Limits keyed only on IP (useless behind CDN/CGNAT) with no per-identity tier.

## W:6 — Pagination: Page-size parameters honored unbounded — limit=100000 enables bulk extractio…

Pagination: Page-size parameters honored unbounded — limit=100000 enables bulk extraction and OOMs.

## W:7 — Mass Assignment: Request bodies bound wholesale to models — isAdmin/tenantId settable vi…

Mass Assignment: Request bodies bound wholesale to models — isAdmin/tenantId settable via PATCH.

## W:8 — Error Hygiene: Stack traces, internal hostnames, and dependency versions leaking in API…

Error Hygiene: Stack traces, internal hostnames, and dependency versions leaking in API error bodies.

## W:9 — Versioning: No API versioning/deprecation policy — breaking changes ship under the same…

Versioning: No API versioning/deprecation policy — breaking changes ship under the same routes old clients call.

## W:10 — Enumeration: 404-vs-403 semantics and timing differences confirming which resources/user…

Enumeration: 404-vs-403 semantics and timing differences confirming which resources/users exist.

## W:11 — Cache Headers: Private API responses emitted without Cache-Control: private/no-store — s…

Cache Headers: Private API responses emitted without Cache-Control: private/no-store — shared proxies cache user data.

## W:12 — Replay: Signed/webhook-style requests without timestamp+nonce windows — captured request…

Replay: Signed/webhook-style requests without timestamp+nonce windows — captured requests replayable indefinitely.

## W:13 — Parsers: Content-Type not enforced — XML/multipart parsers reachable on JSON endpoints (…

Parsers: Content-Type not enforced — XML/multipart parsers reachable on JSON endpoints (XXE, zip bombs).

## W:14 — ReDoS: User-supplied search/filter input compiled into regexes without escaping or timeo…

ReDoS: User-supplied search/filter input compiled into regexes without escaping or timeout guards.

## W:15 — Error Hygiene: framework default exception serializer bypasses handler-level sanitization

**Statement.** Error-hygiene fixes applied only at handler return paths while the hosting framework's or SDK's catch-all still serializes raw error messages to the caller. Teams sanitize the errors their code constructs and returns, but any exception ESCAPING the handler is caught by the framework default (Express error middleware, MCP SDK createToolError, GraphQL formatError default), which stringifies error.message — including cloud-SDK failure text carrying ARNs, account ids, hostnames, table names — straight into the response or, on agent tool-planes, into the LLM's context. The leak surface is precisely the plumbing (auth, role assumption, client construction) sitting OUTSIDE the sanitized try blocks, plus deliberate rethrows.

**Detect.** Identify the framework layer converting uncaught handler exceptions into responses and read its serializer in the VENDORED copy actually deployed: does it include error.message/stack? Then check whether every handler's pre-logic plumbing sits inside the sanitizing try, and trace where deliberate rethrows land. Sanitized returns coexisting with reachable throws is the tell.

**False positives.** Frameworks whose deployed default serializer already redacts to a generic code with server-side logging; internal-only services whose transport never reaches an end user or model context.
## W:16 - Rate limiting: the counter is stored at a key the limited action itself overwrites, so the threshold is unreachable

**Statement.** A rate limiter counts prior attempts by reading records at a key, while the action
being limited writes its record to that same fixed key with replace semantics rather than appending a
new one or atomically incrementing a counter. The store therefore holds at most one record per key,
the observed count is capped at one, and a comparison against any threshold above one can never be
true: the limiter evaluates on every call, logs nothing, raises no error, and allows without bound.
Adjacent code and comments cite the cap as an enforced control, and other components - sometimes
including a correctly-implemented limiter elsewhere - are written to "mirror" it, so the phantom cap
propagates as a design precedent.

**Detect.** For every limiter, put the read and the write side by side and compare key cardinality:
does the write create a new item per attempt (distinct sort key, window-bucketed key, atomic add on a
counter attribute) or replace one item at a fixed key? Then compute the maximum value the read can
return and compare it to the threshold - if the maximum observable count is below the threshold, the
branch is dead. Exact-match single-item reads (a point read, or a range query pinned to one full key)
behind a threshold above one are the signature. Test the limiter by exercising it past the cap rather
than trusting a unit test that asserts the threshold arithmetic in isolation; a green test over a
fabricated multi-record fixture the production write path cannot produce is corroborating evidence.

**False positives.** Limiters whose write genuinely accumulates (atomic increment on a counter
attribute, one item per attempt, or a sliding-window structure) where a single returned item
legitimately carries the count; thresholds of exactly one, where a single-record read is the correct
implementation; limiters whose real enforcement lives in an upstream edge/gateway layer and whose
application-side check is documented as advisory only.

## W:17 - Generated or templated API contract edited by replacement, silently retiring live routes, with no gate comparing the contract's route set to the deployed API

**Statement.** When the API surface is defined by a single generated or hand-maintained contract
document, adding a route means editing that document - and edits performed as a one-for-one
replacement of a path block, whether by a tool, a regeneration step, or an assistant, remove the block
they land on. The new route works, review focuses on it, and the deleted route leaves no trace in the
diff summary anyone reads. The deployed API then stops serving a path that clients still call, and
because the removal is a *deletion* rather than a change, every test that exercises the surviving
routes passes and every schema validation of the contract passes too - the contract is perfectly valid,
it is simply smaller. Detection is usually a client-side failure days later, and the class recurs:
once a codebase has lost routes this way it will lose more, because nothing in the pipeline compares
the contract's route inventory to the previously deployed one.

**Detect.** Do not review the contract diff for what was added - inventory it. Extract the full route
set (path plus method) from the contract at the merge base and at the head, and assert the head is a
superset unless a removal is explicitly declared; run the same comparison against the live deployed
API's route inventory pulled from the provider, since the contract and the deployment can also drift
independently. Wire that comparison as a pipeline gate rather than a review habit. When auditing after
the fact, diff the deployed route inventory against the client code's call sites: a call site with no
matching deployed route is a silently retired path.

**False positives.** Deliberate, documented route retirements; routes removed in the same change that
removes their only callers across every client surface; contracts where the removed path is served by
a wildcard or proxy integration that still matches.

## W:18 — Unauthenticated edge route proxies an unconstrained path segment into an internal-only service

**Statement.** A public, auth-free gateway route captures a free-form path parameter and interpolates it into the URL of an internal-only backend reached over a private link. The valid values are a known, finite, enumerable set — a provider catalog, a handler list, a fixed set of channels — but nothing at the edge constrains the segment to that set: no request validator, no pattern model, no per-value resource. The edge therefore forwards arbitrary attacker-chosen path values into a service with no public listener, whose own authentication was designed assuming only well-formed traffic reaches it, and the sole remaining defense is how that backend happens to behave on unknown paths.

**Detect.** For every gateway route with authorization disabled, follow the path parameter into the integration URI. If it is interpolated into the backend path and the accepted set is finite and known, that alone is the finding — the missing constraint is provable from IaC, with no escalation to demonstrate. Assess escalation SEPARATELY: whether the platform decodes and forwards encoded separators or dot segments into the integration path, and whether the backend normalizes them. A single-segment (non-greedy) parameter resource materially weakens the traversal case. Report the missing constraint even when the escalation is unproven, and state the escalation's status honestly rather than asserting it.

**False positives.** Routes where each valid value is provisioned as its own literal resource; parameters constrained by an attached request validator or pattern model; integrations whose backend is itself internet-facing and independently authenticated, so the gateway adds no isolation there is anything to bypass.

## W:19 — Backtracking-prone regex inside a universal defensive transform, applied to unbounded input

**Statement.** A cross-cutting defensive helper — PII masking in the logger, redaction, sanitization, normalization — applies a regex with super-linear backtracking to every string handed to it, and at least one caller hands it unbounded attacker-influenced input with no length clamp. Patterns shaped `[charclass]+@` or `(a+)+` scan quadratically across a long run of first-class characters that never completes the match, so one oversized field stalls the thread for its whole duration. The control's universality is what makes it dangerous: because it sits on the LOGGING path, every code path is a delivery vector, and the stall lands on whatever the process was doing — commonly a single-threaded poller whose own liveness heartbeat is starved by the same blocked event loop, so the outage surfaces as an unrelated health failure and an instance replacement.

**Detect.** Inventory the regexes in shared masking/sanitizing/normalizing helpers and classify each for super-linear behavior on NON-matching input; an unbounded quantifier over a character class followed by a required literal is the common quadratic shape. Then trace the helper's callers for any string not length-bounded before the call — queue payload fields, message bodies, headers, user-supplied names. A clamp applied after the transform does not help. Finally check what shares the thread: an event-loop stall that starves a heartbeat converts a CPU issue into a replacement event, so the blast radius is larger than the request that triggered it.

**False positives.** Helpers whose every caller clamps length first; regexes proven linear (no nested or adjacent unbounded quantifiers over overlapping character classes); runtimes using a linear-time engine (RE2) or enforcing a per-match timeout.

## W:20 — The size cap is evaluated on the materialized collection, so the guard runs after the allocation it exists to prevent

**Statement.** A handler expands a caller-supplied range — a time window, a page span, a quantity, a
coordinate box — into one in-memory object per unit of granularity, then checks whether the resulting
collection is too large and rejects it. The check is correct, the error is well-typed, and the limit
is well chosen; it simply cannot fire before the cost it is guarding against has already been paid,
because its input is the length of the array whose construction is the expense. Where each element's
construction is itself costly (a formatter, a timezone resolution, a regex compile), the multiplier is
far worse than object count alone suggests. The caller does not need a large request body: two
timestamps or one integer expand into millions of elements, so the attack is indistinguishable from a
normal request at every upstream layer — payload-size limits, WAF rules and gateway throttles all see
a small, well-formed call. Sibling call sites of the same expansion helper commonly differ: one
applies the post-hoc cap and another applies none at all, which is the strongest evidence that the
bound belongs inside the helper rather than at its callers.

**Detect.** For every expansion helper, read its loop and establish whether it has an internal
ceiling; a helper that loops from a start to an end by a step with no counter check is unbounded by
construction. Then enumerate its call sites and, for each, trace the range endpoints back to the
request boundary and record every validation between. A validation that only asserts ordering
(end > start) or finiteness bounds nothing. Where a cap exists, check whether its input is the
materialized collection (`result.length`) or an arithmetic projection of the range
((end − start) / step); only the latter can run first. Compute the worst case the boundary permits and
compare it to the process memory and timeout budget. Because the request is small, look also at what
shares the compute pool — a per-invocation exhaustion becomes a shared-capacity outage when
concurrency is unreserved.

**False positives.** Ranges structurally bounded upstream by a schema (a date type that cannot express
a century, an enum of allowed spans); helpers that stream or generate lazily so no collection is
materialized; caps computed arithmetically before expansion even if the error is raised later; and
paths where the expansion is bounded by a resource the caller cannot inflate — verify the caller
cannot supply the granularity as well as the range, since a caller-controlled step defeats an
otherwise sound range bound.

## W:21 — Generated spreadsheet exports quote for the CSV parser but never neutralize leading formula characters, so stored third-party text executes in the operator's spreadsheet

**Statement.** An export endpoint serializes stored records to CSV through an escape helper that
handles the CSV grammar correctly — it quotes values containing the delimiter, doubles embedded
quotes, quotes embedded newlines — and stops there. CSV quoting and formula neutralization are
different problems: spreadsheet applications interpret a cell whose first character is one of
`= + - @`, tab or carriage return as a formula regardless of quoting, so a correctly quoted value is
still executed. The consequence lands outside the service, on the workstation of whoever opens the
file, and the injected text is usually not authored by that person or even by a user of the product:
free-text fields are commonly populated from an external party (a caller's spoken name, an inbound
message, a form on a public page), so an unauthenticated outsider writes the payload and a trusted
operator executes it. Because the value is stored, it fires on every future export until the record is
edited, and one poisoned record reaches everyone who exports. Even where command execution is blocked
by the spreadsheet's own protections, link-shaped formulas exfiltrate neighbouring cells — which in an
export are other records' contact details — to an attacker-controlled URL on a single click.

**Detect.** Find every path that produces a file for human download (CSV, TSV, and the text paths of
spreadsheet writers) and read the escape helper. If its predicate is a test for the delimiter, quote
or newline, it is a CSV-grammar escaper and formula neutralization is absent — confirmed by reading,
without needing a payload. Then walk each exported column back to its writer and mark which are
externally influenced; the finding's severity is set by whether an unauthenticated party can reach
any exported field, so trace the ingestion path rather than assuming only authenticated users write.
Check the columns nobody thinks of as free text — tags, source, category, display names assembled
from parts — since these are frequently populated by automated flows. Where the same record fields
are sanitized on one path and not another, the asymmetry is the evidence.

**False positives.** Exports rendered into a binary spreadsheet format through a library that writes
values as typed cells rather than parsed text; downloads whose content type and extension make
spreadsheet interpretation implausible and which are consumed only by machines; fields provably
constrained to a character set excluding the formula triggers at the write boundary — verify the
constraint is enforced server-side on every writer, not in one client; and pipelines that neutralize
at ingestion rather than at export, which is a valid alternative placement as long as every writer is
covered.

## W:22 — The attempt limiter is keyed to a scope the attacker creates for free, so every new session restores a full budget and the lockout bounds nothing

**Statement.** A secret-verification path enforces a maximum number of failed attempts, and the
counter is keyed by the current session, connection, or request identifier rather than by the identity
being authenticated or the source attempting it. Within one session the limit holds exactly as
designed, which is what the tests assert; across sessions it does nothing, because the attacker
obtains a fresh key — and therefore a fresh budget — by reconnecting, and reconnecting is free. The
effective bound on guessing becomes the attacker's session-establishment rate, not the configured
limit, so a short secret drawn from a small space falls in a number of attempts that the presence of
a lockout makes everyone believe is impossible. Two aggravators usually travel with it: the counter
lives in process memory, so it is also lost on restart, deploy, and any instance that did not serve
the earlier attempts; and the counter is evicted by a size bound, so a high-volume attacker can flush
their own record. This pattern most often appears as the remediation of an earlier finding that the
path had NO attempt limit — the limiter was added at the scope that was convenient to the request
context rather than the scope that identifies the principal, converting an absent control into an
ineffective one while closing the original finding.

**Detect.** For every attempt counter, name the key and ask what it costs the attacker to change it.
A key derived from a session, connection, call, or request id is defeated by reconnecting; a key
derived from the account, subject, or credential being tested is not. Check the store: an in-process
map cannot bound attempts across instances or restarts, so a horizontally scaled or supervised
service has no durable budget regardless of key. Compute the real search space — read the validator
that constrains the secret's length and alphabet at the WRITE boundary, not the comment describing it,
since the two frequently disagree — and divide by the per-session budget to get the number of sessions
required; state that number, because it is what makes the finding concrete. Where the limiter was
added to close a prior finding, re-read that finding's claim and confirm whether the remediation
addressed the scope or only the presence of a control. Finally, check for a detective control:
repeated failures against one identity across distinct sessions should be alarmable, and usually are
not.

**False positives.** Limiters keyed to the principal or the source with the session id used only as a
secondary dimension; paths where establishing a new session is itself metered by an independent
control that binds the same attacker (a per-source connection limit that is actually enforced); and
secrets whose space is large enough that the session-establishment rate is not the binding constraint
— compute it rather than assuming, and remember that a durable, principal-keyed lockout is still the
correct shape even when the arithmetic is currently comfortable.

## W:23 — The declared input schema strips the very keys the repair table promises to heal, because validation runs before repair, so an alias with no matching schema field is dead on arrival

**Statement.** A tool or endpoint that accepts input from an imprecise caller — a model, a partner
integration, a legacy client — is given two layers: a declared input schema that validates and
coerces, and an alias/repair table that renames the caller's approximate key to the canonical one.
The two are authored separately and the order of execution decides everything. Where the framework
validates against the declared schema first, and that schema's object mode discards keys it does not
declare, every alias whose canonical spelling is declared but whose alternate spelling is not has
already been deleted by the time the repair table runs. The table promises; the schema decides;
nothing reconciles them. The defect is worse than inert, because its severity depends on whether the
canonical field is required: a stripped alias on a required field produces a loud validation failure
a caller can often recover from, while a stripped alias on an optional field produces a silent wrong
answer — the handler sees the field as absent, takes its default or resolve-the-most-likely-value
branch, and returns a confident, well-formed response to a question nobody asked. Repeated attempts
do not help, because every attempt is stripped identically; the transcript reads like a system
working correctly while the caller is answered about the wrong subject as many times as they ask.
The mirror defect is equally real and usually unexamined: an alias declared on a surface whose
canonical field that surface does not accept, so the repair renames a value into a key nothing reads.

**Detect.** Do not read the alias table alone and do not read the schema alone — the finding lives
only in their intersection. Enumerate every surface-alias-canonical triple and assert the invariant
in both directions: every alias is declared as an accepted key on every surface that accepts its
canonical, and no surface declares an alias whose canonical it does not accept. A one-directional
check passes the defect in one of its two forms. Establish the framework's actual order empirically —
validate-then-repair versus repair-then-validate — by sending an aliased key and observing whether
the handler ever sees it; the framework's documentation is not sufficient, and the order can differ
between the streaming and non-streaming paths of the same framework. Separately, inventory optional
fields whose absence triggers an inference branch rather than an error, and treat each as a
silent-wrong-answer candidate: search production logs for calls that took the inference branch while
the caller's own transcript shows they supplied the value under another name. Make the invariant a
gate rather than a one-time sweep, and give the gate's parser a known-good control that fails the run
if a field it should see stops parsing — a naive flat scan will read nested object properties inside
array-of-object fields as top-level parameters and report fabricated defects, and a verifier that
invents defects teaches its readers to skip its output.

**False positives.** Frameworks whose object mode passes unknown keys through rather than stripping
them, verified by observation. Aliases deliberately scoped to one surface where the canonical is
genuinely absent elsewhere. Repair layers that run before validation, where the table is
authoritative and the schema sees only canonical keys. Nested field names that coincide with a
canonical parameter name but belong to a sub-object — the parser must be depth-aware before any of
its reports are actionable. Baselined known gaps that are recorded, counted, and tracked rather than
silently tolerated.
