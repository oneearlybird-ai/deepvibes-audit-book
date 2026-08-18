---
section: PP
title: "Third-Party Data Sync & Canonical Mapping"
group: third-party
---

# [PP] Third-Party Data Sync & Canonical Mapping

Bidirectional sync engines against third-party provider APIs (CRMs, schedulers, calendars,
ticketing) fail in ways none of the provider-specific sections capture, because the defects live in
the ENGINE's own contracts: how raw payloads become canonical records, how outbound writes resolve
referenced entities, and how provider status codes are classified into connection lifecycle
transitions. The unifying trap: a sync engine's unit tests exercise its own logic against recorded
payloads, while this section's defects only manifest against the provider's LIVE behavior — index
lag, entitlement gating, status-code overloading — so every rule here carries a live-verification
bias. Rules PP:1–PP:4 audit mapping fidelity; PP:5–PP:7 audit the write/lifecycle seam.

## PP:1 — Outbound writes never resolve the referenced party, so records land unlinked

**Statement.** The integration composes a child object (appointment, order, ticket, deal) that
references a person or account by provider-side id, but the write path never looks up or creates
that party in the provider. The reference field is populated only when a previous INBOUND sync
already mirrored the party, so every record written for a party the provider has not seen lands
unlinked — silently, because the provider accepts the unattached create with 200. The gap hides
in plain sight when a sibling code path (a generic mapper-driven writer) does resolve parties and
the affected provider bypasses it via a bespoke writer.

**Detect.** Trace the write composer's party-reference field to its source. If the only assignment
echoes an id captured from inbound sync (or the caller), new parties can never attach: confirm by
asking "what happens on the first write for a person the provider has never seen?" Audit bespoke
per-provider writers separately from the generic path — parity between them is the thing to check,
not assume.

**False positives.** Providers whose create-API attaches parties by value (embedded contact
object) rather than by reference; providers with genuinely no party model (pure calendars);
integrations that deliberately write unattached and reconcile in a documented second pass.

## PP:2 — A constant timezone stamped on inbound canonical records

**Statement.** The inbound mapper stamps a literal timezone ('UTC', or the server's zone) on every
canonical record while the provider expresses the real zone elsewhere — typically on a location,
venue, calendar, or resource object rather than on the event payload itself. The stored instant
stays correct, so nothing fails loudly; every downstream wall-clock rendering, reminder schedule,
and "what time is my appointment" answer is wrong by the seller's UTC offset.

**Detect.** Grep inbound mappers for literal zone strings. For each, read the provider's object
model for where the zone actually lives (location/resource/venue), and confirm the mapper joins it
in. A zone that lives on a sibling object the mapper never fetches is the defect even when the
mapper's own payload genuinely lacks a zone field.

**False positives.** Providers that are contractually zone-less AND whose timestamps carry
explicit offsets consumed downstream; products documented as UTC-only end to end.

## PP:3 — Opaque provider identifiers flow into human-facing display fields

**Statement.** The mapper reuses a provider id for a name-shaped canonical field (service name,
staff name, product title) because the id is present in the payload and the name requires a second
lookup. Downstream surfaces treat the field as display text — interpolating it into customer SMS,
speaking it through a voice agent, rendering it in UI — so end customers receive raw identifiers
("your 7WQXSXBBHW3RRDCFZ7JV6XVX appointment"). The defect is invisible in unit tests because the
id is a perfectly valid string.

**Detect.** For every display-shaped canonical field, confirm the mapped source is a human name,
not an id. Then sweep the field's consumers for message templates, TTS/speech builders, and UI
renders — any interpolation of the field proves the blast radius. When the name requires a catalog
join, verify the join exists and its source stays fresh (discovery/catalog sync cadence).

**False positives.** Fields documented as reference codes and rendered as such; ids deliberately
shown in admin/debug surfaces.

## PP:4 — Aggregates computed from the first element of a multi-element collection

**Statement.** A derived value (end time, duration, total, item count) is computed from
`collection[0]` alone while the provider legally sends multiple elements — multi-segment
appointments, multi-line orders, multi-leg itineraries. Single-element payloads (the common case,
and the only case in fixtures) produce correct results, so the defect ships and then under-reports
every real multi-element record: an appointment "ends" when its first service does, an order
"totals" its first line.

**Detect.** In mappers and composers, flag every index-zero access on a payload collection. Check
the provider's schema for the collection's legal cardinality; if >1 is legal, the aggregate must
fold over ALL elements. Fixtures that contain only single-element examples are corroborating
evidence, not reassurance.

**False positives.** Collections the provider documents as singleton (cite the doc); code paths
that explicitly reject multi-element payloads upstream.

## PP:5 — Look-then-create against an eventually-consistent provider search index

**Statement.** The integration deduplicates by searching the provider before creating ("look
first, then create"), but the provider's search endpoint is an INDEX that lags its own writes by
seconds. Two resolutions for the same party in quick succession both search, both miss, and both
create — a duplicate in the customer's system of record, with every API call returning 200.
Request-derived idempotency keys cannot close the race: two different logical requests for the
same party are two different keys. The fix shape is an identity-derived idempotency key (provider
enforces uniqueness per key), plus treating the provider's concurrent key-reuse REJECTION as "the
party now exists — re-read" rather than as an error; providers may replay sequentially but reject
concurrently, and both behaviors must be handled.

**Detect.** Find every create guarded only by a search. Establish the search endpoint's
consistency model from provider docs or a live write-then-search probe (create, immediately
search; a miss proves the lag). Then read the create's idempotency key derivation: request-scoped
keys mean the race stands. Verify the key-reuse error path re-reads instead of failing the write
or, worse, retrying the create.

**False positives.** Providers with proven read-after-write search consistency; providers that
natively dedupe on a unique field (email-unique contact APIs) and signal conflicts.

## PP:6 — Non-credential 401s classified as credential death

**Statement.** The provider answers 401 Unauthorized for a MISSING PRODUCT ENTITLEMENT (feature
tier not purchased, module not activated) on some endpoints, while the same token succeeds on
others. A shared transport that classifies every 401 as credential death — flipping the
connection to needs-reauth — kills healthy connections the moment any entitlement-gated endpoint
is touched. The worst instance is connect-time discovery: the customer authorizes, discovery
sweeps all endpoints, one entitlement 401 kills the seconds-old connection, and the customer sees
"reconnect required" in an endless loop until they buy the provider's upsell.

**Detect.** Read the transport's 401 branch: does anything inspect the response BODY before the
credential-death transition? Enumerate the provider's documented 401 semantics (or probe live with
a valid token against gated endpoints). Any provider that overloads 401 for entitlement needs a
body-marker classification before reauth, and the entitlement case must fail the JOB legibly while
leaving the connection alive.

**False positives.** Providers that strictly reserve 401 for authentication and 403 for
entitlement; transports that already classify per-endpoint.

## PP:7 — Deletion detection dead-coded by a throwing transport

**Statement.** The webhook/refetch handler documents "absent on re-fetch means deleted → soft
delete" and implements it as a null-check on the fetch result — but the shared transport THROWS on
every non-2xx, so the fetch never returns null and the soft-delete branch is unreachable. Every
deletion event escalates an exception instead of recording a deletion; retry machinery redelivers
until the message dead-letters. Providers whose subscription TEST events carry synthetic object
ids (guaranteed 404s) poison the queue on day one, before any real deletion occurs.

**Detect.** Trace the re-fetch call chain from the handler's null-check down to the raw HTTP
layer, and prove which layer converts 404 into which shape. If any layer throws for 404 and no
intermediate catch converts it back to null/absent, the branch is dead code. Fire the provider's
own test-event mechanism as the live probe — it exercises exactly this path.

**False positives.** Transports that genuinely return null/absent on 404 (verify by reading the
code, never by trusting the handler's comment); handlers that catch the typed 404 error
explicitly.
