---
section: O
title: "Vercel Infrastructure & Edge Hosting"
group: vercel
---

# [O] Vercel Infrastructure & Edge Hosting

## O:1 — Environment Variables: Sensitive backend API keys unintentionally prefixed with NEXT_PUB…

Environment Variables: Sensitive backend API keys unintentionally prefixed with NEXT_PUBLIC_ or VITE_, exposing them to the client browser bundle.

## O:2 — Edge Caching: Unintentional edge caching of dynamic user-specific pages due to misconfig…

Edge Caching: Unintentional edge caching of dynamic user-specific pages due to misconfigured Cache-Control headers.

## O:3 — Execution Limits: Vercel Serverless functions processing heavy logic (e.g., PDF generati…

Execution Limits: Vercel Serverless functions processing heavy logic (e.g., PDF generation/scraping), exceeding the maximum 10s/15s execution timeout.

## O:4 — Security: Vercel Preview Deployments lacking SSO/Password Protection, leaking unreleased…

Security: Vercel Preview Deployments lacking SSO/Password Protection, leaking unreleased internal features to public web crawlers.

## O:5 — Edge: Forcing Node.js Runtime Libraries into Edge-Only Configurations

Edge: Forcing Node.js Runtime Libraries into Edge-Only Configurations. Attempting to process standard cryptographic or localized system modules inside Vercel's lightweight Edge runtime without polyfills, causing unexpected runtime errors during deployment.

## O:6 — Infrastructure: Leaving Default Wildcard Subdomains Active

Infrastructure: Leaving Default Wildcard Subdomains Active. Retaining unmonitored development and staging branch subdomains (*-git-branch-username.vercel.app) exposed to public view, making it easy for adversaries to discover unreleased application features or bypass security boundaries.

## O:7 — ISR: Incremental static regeneration caching one variant of pages that differ for logged…

ISR: Incremental static regeneration caching one variant of pages that differ for logged-in users.

## O:8 — Cron: Vercel cron endpoints publicly invokable — no CRON_SECRET/authorization check on t…

Cron: Vercel cron endpoints publicly invokable — no CRON_SECRET/authorization check on the handler.

## O:9 — Protection Bypass: Deployment-protection bypass tokens committed to repos or shared in p…

Protection Bypass: Deployment-protection bypass tokens committed to repos or shared in plaintext.

## O:10 — Skew: Version-skew protection unconfigured — stale clients call mismatched serverless fu…

Skew: Version-skew protection unconfigured — stale clients call mismatched serverless functions after every deploy.

## O:11 — Spend: No spend management/usage alerts — traffic spikes (or attacks) convert directly i…

Spend: No spend management/usage alerts — traffic spikes (or attacks) convert directly into surprise bills.

## O:12 — Proxying: Rewrites/proxies forwarding internal headers or exposing origin hostnames to c…

Proxying: Rewrites/proxies forwarding internal headers or exposing origin hostnames to clients.

## O:13 — A request handler on ephemeral, horizontally scaled hosting uses the host filesystem as the store of record, so tenant records survive locally, vanish globally, and every read path still looks correct

**Statement.** A server-side route needs its writes to outlive a page navigation, and the smallest
change that appears to achieve it is a file under the working directory or the temp directory,
often introduced alongside a genuine fix and described as making the data "durable" or "persist
across refresh". On managed serverless or edge hosting the filesystem is per-instance and
ephemeral: a second concurrent instance never sees the write, a scale-to-zero or a redeploy
destroys it, and read-only build outputs may reject it outright — in which case the fallback chain
lands the store in the temp directory, where it looks even more like it works. The failure mode is
the worst available: writes are accepted, reads succeed for the instance that wrote them, and the
data is simply gone for everyone else, so the surface tests green in single-instance development
and loses records non-deterministically in production. Because the code is tenant-partitioned by
filename it reads as careful isolation, which raises reviewer confidence in exactly the wrong
direction.

**Detect.** Grep every server-side route and server module for filesystem writes — file writes,
directory creation, temp-directory helpers — and classify each: a build-time artifact and a
request-scoped scratch file are fine; anything holding a record the product later reads back is the
finding. A fallback chain of candidate directories is a strong tell, as is a filename derived from
a tenant identifier. Confirm by asking what the next read does when the file is absent: if the
answer is "the record does not exist" rather than "fetch it from the data plane", the filesystem
IS the store of record. Check whether a real datastore for the same records already exists — this
pattern is usually a placeholder that outlived its note.

**False positives.** Caches whose miss path re-fetches from the real store. Build-time generation
into the output directory. Genuinely request-scoped temp files deleted before the response.
Long-lived single-instance hosting (a dedicated VM, a stateful container with a mounted volume)
where the filesystem is a real durable store.
