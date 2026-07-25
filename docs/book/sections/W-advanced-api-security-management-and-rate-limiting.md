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
