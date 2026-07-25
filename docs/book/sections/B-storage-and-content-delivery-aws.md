---
section: B
title: "Storage & Content Delivery (AWS)"
group: aws-backend
---

# [B] Storage & Content Delivery (AWS)

## B:1 — S3: Bucket lacks explicit "Block Public Access" enforcement at the account or bucket level

S3: Bucket lacks explicit "Block Public Access" enforcement at the account or bucket level.

## B:2 — S3: Object Versioning is enabled but missing a strict Lifecycle Policy, resulting in inf…

S3: Object Versioning is enabled but missing a strict Lifecycle Policy, resulting in infinitely compounding storage cost bloat.

## B:3 — S3: Bucket Policy missing the aws:SecureTransport condition, allowing unencrypted plain…

S3: Bucket Policy missing the aws:SecureTransport condition, allowing unencrypted plain HTTP requests.

## B:4 — S3: Presigned URLs generated dynamically in code without strict, short-lived expiration…

S3: Presigned URLs generated dynamically in code without strict, short-lived expiration times and IP bounding.

## B:5 — EBS: Attached block volumes are unencrypted or using AWS-managed default keys instead of…

EBS: Attached block volumes are unencrypted or using AWS-managed default keys instead of a Customer Managed KMS Key (CMK).

## B:6 — CloudFront: Origin Access Control (OAC) is missing

CloudFront: Origin Access Control (OAC) is missing. The underlying S3 origin is directly reachable via the internet, bypassing the CDN/WAF.

## B:7 — CloudFront: Distribution Viewer Protocol Policy allows HTTP instead of forcing Redirect…

CloudFront: Distribution Viewer Protocol Policy allows HTTP instead of forcing Redirect HTTP to HTTPS.

## B:8 — CloudFront: Missing an attached AWS WAF WebACL to block malicious payloads at the edge

CloudFront: Missing an attached AWS WAF WebACL to block malicious payloads at the edge.

## B:9 — S3: Missing Object Lock or MFA Delete Policies

S3: Missing Object Lock or MFA Delete Policies. Critical business transaction records or regulatory compliance archives stored in buckets without Object Lock (WORM policy) or MFA Delete enabled, allowing compromised root or admin credentials to completely purge historical backups.

## B:10 — S3: Cross-Region Replication Without KMS Re-encryption

S3: Cross-Region Replication Without KMS Re-encryption. Replicating data to secondary disaster recovery regions while preserving original source KMS keys, creating cross-region key access complexities and single-point-of-failure decryption paths during regional outages.

## B:11 — CloudFront: Insecure Origin Response Timeout Limits

CloudFront: Insecure Origin Response Timeout Limits. Leaving the origin response timeout at the default configuration (30s) for long-running edge API requests, leading to serverless worker starvation and client-side 504 Gateway Timeout errors under high workloads.

## B:12 — S3: Presigned URL Signing with Long-Lived IAM User Keys

S3: Presigned URL Signing with Long-Lived IAM User Keys. Generating signed links utilizing static AWS Access Keys instead of scoped, temporary roles, ensuring that if those access keys are ever leaked or rotated, all active distributed URLs break instantly.

## B:13 — CloudFront: Missing Custom Error Pages for Origin Cloaking

CloudFront: Missing Custom Error Pages for Origin Cloaking. Distributing raw backend 5xx error stack traces or default S3 XML access-denied payloads directly to the public web browser rather than catching failures at the CDN layer and returning branded fallback documents.

## B:14 — S3: Default bucket encryption left at SSE-S3 where the data classification requires a Cu…

S3: Default bucket encryption left at SSE-S3 where the data classification requires a Customer Managed KMS Key.

## B:15 — S3: Object Ownership not set to BucketOwnerEnforced — legacy ACLs still active and grant…

S3: Object Ownership not set to BucketOwnerEnforced — legacy ACLs still active and grantable.

## B:16 — S3: Server access logging / CloudTrail data events absent on buckets holding sensitive o…

S3: Server access logging / CloudTrail data events absent on buckets holding sensitive objects.

## B:17 — S3: Bucket CORS rules with wildcard origins on buckets serving authenticated user content

S3: Bucket CORS rules with wildcard origins on buckets serving authenticated user content.

## B:18 — S3: Lifecycle rules missing AbortIncompleteMultipartUpload, accumulating invisible billa…

S3: Lifecycle rules missing AbortIncompleteMultipartUpload, accumulating invisible billable storage from failed uploads.

## B:19 — S3: Event notifications fanning into non-idempotent consumers (S3 may deliver duplicate…

S3: Event notifications fanning into non-idempotent consumers (S3 may deliver duplicate events).

## B:20 — S3: Unknown access patterns never evaluated for Intelligent-Tiering or storage-class ana…

S3: Unknown access patterns never evaluated for Intelligent-Tiering or storage-class analysis — paying Standard rates for cold data.

## B:21 — CloudFront: Missing Response Headers Policy (HSTS, X-Content-Type-Options, Referrer-Poli…

CloudFront: Missing Response Headers Policy (HSTS, X-Content-Type-Options, Referrer-Policy) applied at the edge.

## B:22 — CloudFront: Signed URLs/cookies using legacy root-account CloudFront key pairs instead o…

CloudFront: Signed URLs/cookies using legacy root-account CloudFront key pairs instead of key groups with rotatable keys.

## B:23 — CloudFront: Authenticated API responses cached because Authorization/Cookie headers are…

CloudFront: Authenticated API responses cached because Authorization/Cookie headers are not part of the cache key policy.

## B:24 — CloudFront: No origin failover group for static assets — a single-origin hard dependency

CloudFront: No origin failover group for static assets — a single-origin hard dependency.

## B:25 — EFS: File systems mounted without Access Points enforcing POSIX identity and root-direct…

EFS: File systems mounted without Access Points enforcing POSIX identity and root-directory scoping.

## B:26 — EBS: No Data Lifecycle Manager snapshot policies — manual snapshots only, on an untested…

EBS: No Data Lifecycle Manager snapshot policies — manual snapshots only, on an untested cadence.

## B:27 — S3: Replication configuration missing explicit delete-marker replication decisions, sile…

S3: Replication configuration missing explicit delete-marker replication decisions, silently diverging source and replica.

## B:28 — CloudFront: Edge logs capturing sensitive query strings (tokens, emails) shipped into wi…

CloudFront: Edge logs capturing sensitive query strings (tokens, emails) shipped into wide-read analytics buckets.
## B:29 - Managed rule group attached but constituent rules overridden to count, degrading the control while inventory shows it present

**Statement.** A managed protection rule group is associated with the resource - so every inventory,
compliance scan, and architecture diagram records the protection as present - while individual rules
inside it carry per-rule action overrides to count/log, or the group itself carries a group-level
override, so the overridden rules observe and never block. The override is typically added once to
clear a false positive during a launch push and then outlives the reason: there is no expiry, the
overridden rule name appears only in the infrastructure code, and the resource-level view reports the
group as attached and healthy. The result is a control whose coverage is strictly smaller than its
name implies, and the gap is invisible to anyone who checks attachment rather than effective action.

**Detect.** For each associated rule group, enumerate per-rule action overrides and any group-level
override, and list which specific rules are non-blocking; compare that list against the threat the
group was attached to address. Read effective action from the live resource, not the module inputs -
overrides are frequently applied out of band. For each override, look for a dated justification and an
expiry; an override with neither is the finding. Check the counted rule's metric: sustained non-zero
counts on a rule left in count mode quantify exactly what is passing through.

**False positives.** Overrides with a documented false-positive analysis, a dated revisit, and a
compensating control covering the same class; rules counted deliberately during an initial tuning
window that is still open and tracked; rules irrelevant to the workload's actual data plane where the
override is a documented noise-reduction decision rather than a weakened control.
