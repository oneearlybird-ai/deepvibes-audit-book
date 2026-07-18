---
section: C
title: "Networking & Routing (AWS)"
group: aws-backend
---

# [C] Networking & Routing (AWS)

## C:1 — VPC: Database or caching subnets configured with a direct route to an Internet Gateway (…

VPC: Database or caching subnets configured with a direct route to an Internet Gateway (IGW) instead of being isolated.

## C:2 — VPC: Missing VPC Flow Logs pushed to CloudWatch/S3 for network traffic anomaly detection…

VPC: Missing VPC Flow Logs pushed to CloudWatch/S3 for network traffic anomaly detection and compliance auditing.

## C:3 — Security Groups: Unrestricted inbound access (0.0.0.0/0) on management/database ports (2…

Security Groups: Unrestricted inbound access (0.0.0.0/0) on management/database ports (22, 3389, 5432, 3306, 27017).

## C:4 — Security Groups: Wildcard outbound egress rules instead of strictly scoped destination C…

Security Groups: Wildcard outbound egress rules instead of strictly scoped destination CIDRs, allowing data exfiltration.

## C:5 — VPC Endpoints: Missing Gateway Endpoints for S3/DynamoDB, resulting in internal API traf…

VPC Endpoints: Missing Gateway Endpoints for S3/DynamoDB, resulting in internal API traffic routing out to NAT Gateways (accruing massive bandwidth costs).

## C:6 — ELB (ALB): Dropping invalid HTTP headers is disabled, leaving the load balancer vulnerab…

ELB (ALB): Dropping invalid HTTP headers is disabled, leaving the load balancer vulnerable to HTTP Desync routing attacks.

## C:7 — VPC: Inadequate Subnet CIDR Sizing for Auto-Scaling Bursting

VPC: Inadequate Subnet CIDR Sizing for Auto-Scaling Bursting. Mapping microservice subnets with highly restrictive masks (e.g., /28), resulting in AWS IP address exhaustion during rapid compute autoscaling events and triggering deployment failures.

## C:8 — Route 53: Missing Failover Routing Policies (Active-Passive Geolocation)

Route 53: Missing Failover Routing Policies (Active-Passive Geolocation). Domain configurations routing 100% of global user traffic directly to a single AWS region without automated health checking or automated redirection to fallback static S3 error sites when the primary region fails.

## C:9 — NAT Gateway: Asymmetric Routing and Cross-AZ Traffic Surcharges

NAT Gateway: Asymmetric Routing and Cross-AZ Traffic Surcharges. Deploying a single NAT Gateway across multiple Availability Zones, causing instances in secondary AZs to route traffic across zone boundaries—severely inflating data transfer costs and adding latency.

## C:10 — Security Groups: Reusing Single Security Group for App, Database, and Cache

Security Groups: Reusing Single Security Group for App, Database, and Cache. Failing to establish discrete network isolation boundaries, allowing any component compromise (e.g., frontend compromise) to gain direct network line-of-sight into database listeners due to a shared perimeter group.

## C:11 — NACLs: Default allow-all relied upon everywhere — no defense-in-depth layer behind secur…

NACLs: Default allow-all relied upon everywhere — no defense-in-depth layer behind security groups for sensitive subnets.

## C:12 — TGW/Peering: Overly broad route propagation linking unrelated environments (dev can rout…

TGW/Peering: Overly broad route propagation linking unrelated environments (dev can route to prod CIDRs).

## C:13 — Route 53: Dangling DNS records pointing at deleted ELBs/S3 buckets/IPs — subdomain takeo…

Route 53: Dangling DNS records pointing at deleted ELBs/S3 buckets/IPs — subdomain takeover exposure.

## C:14 — ALB/NLB: TLS listeners using outdated security policies permitting TLS 1.0/1.1 or weak c…

ALB/NLB: TLS listeners using outdated security policies permitting TLS 1.0/1.1 or weak cipher suites.

## C:15 — ALB: Port 80 listener serving content instead of issuing an immediate 301 redirect to HT…

ALB: Port 80 listener serving content instead of issuing an immediate 301 redirect to HTTPS.

## C:16 — ALB: Target group deregistration delay misaligned with application drain time, killing i…

ALB: Target group deregistration delay misaligned with application drain time, killing in-flight requests on every deploy.

## C:17 — PrivateLink: Interface endpoints without endpoint policies — the full service API surfac…

PrivateLink: Interface endpoints without endpoint policies — the full service API surface reachable from the VPC.

## C:18 — Route 53: Registrar transfer lock or DNSSEC unconfigured on business-critical apex domains

Route 53: Registrar transfer lock or DNSSEC unconfigured on business-critical apex domains.

## C:19 — VPC: enableDnsSupport/enableDnsHostnames disabled, breaking private DNS for interface en…

VPC: enableDnsSupport/enableDnsHostnames disabled, breaking private DNS for interface endpoints in subtle ways.

## C:20 — Load Balancing: Client IP not preserved or X-Forwarded-For mis-parsed — rate limits and…

Load Balancing: Client IP not preserved or X-Forwarded-For mis-parsed — rate limits and audit logs key on the load balancer's IP.

## C:21 — IPv6: Dual-stack enabled without mirroring security group/NACL rules for ::/0, silently…

IPv6: Dual-stack enabled without mirroring security group/NACL rules for ::/0, silently opening an unfiltered path.
