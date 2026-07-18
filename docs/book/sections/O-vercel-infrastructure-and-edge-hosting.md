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
