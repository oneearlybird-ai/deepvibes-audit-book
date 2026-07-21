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
