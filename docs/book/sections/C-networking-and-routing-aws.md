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

## C:22 - A permissive network rule is replaced by "properly scoped" rules that enumerate only some of the principals that were riding it

**Statement.** Tightening a broad allow rule - a wide security-group rule, an endpoint policy, a
route, a NACL entry - is normally done by replacing it with narrow rules naming the specific sources
that need the access. The tightening is only safe if the set of narrow rules covers every principal
that was actually using the broad rule, and that set is almost never what the author believes: broad
rules accumulate unrecorded riders over time, and the obvious consumer named in the code comment is
frequently the *former* consumer, with the live workloads having been rebuilt behind different
groups or identities since. The replacement passes review because it looks strictly more secure, it
passes plan review because the diff shows a wildcard removed and specifics added, and it passes apply
because nothing validates reachability. The severed workloads then fail on the first path that needed
that access - often a management or control path such as agent connectivity, patching, or
telemetry, which is not exercised by functional traffic and so fails silently until someone tries to
use it. The failure surfaces as an operational incident hours later, at which point the tightening
change is rarely the first suspect.

**Detect.** Before accepting any rule-narrowing change, enumerate the live consumers of the rule
being removed from the provider API - resolve every attached workload, and for each, resolve which
security group or principal it actually carries right now rather than trusting the name in the code.
Diff that live set against the set named in the replacement rules; any member of the live set absent
from the replacement is a severance. For control-plane access specifically, verify reachability after
apply with an actual connection attempt from an affected workload rather than treating a clean apply
as proof. Treat a scoped rule that references a group with no current attachments as the signature of
this defect.

**False positives.** Rules whose only riders are demonstrably decommissioned resources; changes where
an equivalent path exists through another rule that the review verified; deliberate severance of
access as the point of the change, documented as such.

## C:23 — Listener forwards to an attached target group with zero registered or zero healthy targets

**Statement.** A load balancer listener's forwarding action points at a target group that is
attached and configured — health checks defined, ports set — but contains no registered targets at
all, or none that pass health checks. The front door is fully open: DNS resolves to the balancer,
the listener accepts the connection, and then the request black-holes (TCP hangs/resets on a network
balancer; 503s on an application balancer). The common producers are backends scaled to zero and
never scaled back (a parked service whose desired count went to zero while the balancer stayed up),
deregistration during an incident that was never reversed, and auto-scaling groups detached from the
target group during a migration. Because the balancer itself is healthy by every load-balancer
metric that defaults onto dashboards, the emptiness persists silently — the failure only exists from
the client's side.

**Detect.** For every target group, fetch its registered-target set and health states, and join
against listener rules to establish attachment — an EMPTY but ATTACHED group is the hit; an empty
unattached group is mere debris. Cross-check the backing service's desired/running counts: a
deliberate scale-to-zero behind a live listener is still a hit unless the listener is also disabled.
Graph or inventory tooling that only models the balancer→target-group edge misses registration
entirely — the target-health API is the only truth.

**False positives.** Blue/green or failover groups that are empty by design in the passive color
WHILE a routing policy verifiably keeps traffic off them; groups mid-deploy during instance refresh
(re-check after the deploy window); scale-to-zero-with-wakeup architectures where a documented
scale-up path triggers on demand and the listener's idle timeout accommodates it.

## C:24 — VPC: Default security group left with its default allow rules

**Statement.** A VPC's default security group still carries the rules AWS mints it with — the
self-referencing allow-all ingress and the allow-all egress. Nothing may reference the group today,
but the default SG is where every future launch, endpoint, or attachment lands when someone omits an
explicit group, so its rules are the account's silent fallback posture. The hardened shape is zero
rules in both directions: anything that then lands there by accident gets no connectivity and fails
loudly at deploy time instead of running silently open. The gap concentrates in VPCs created outside
IaC (console experiments, quick-setup wizards), because IaC-managed VPCs usually pin the default SG
empty with a dedicated resource while unmanaged ones keep the AWS default forever.

**Detect.** For every VPC in the account — explicitly including ones absent from the IaC tree —
describe the default SG's rule sets and count attached ENIs. Zero attachments plus default rules is
a free fix; attachments mean something is riding the fallback and needs an explicit group first.
Check the IaC tree for a resource that pins the default SG empty (e.g. an aws_default_security_group
with no rules); its absence for any VPC is the durable form of the defect.

**False positives.** A default SG already stripped to zero rules; VPCs mid-deletion; environments
where the default SG is deliberately used as THE segmentation mechanism with scoped rules and a
document saying so (rare, and usually still worth converting to explicit groups).

## C:25 — Near-duplicate security-group twins split the authority — rule resources target one while workloads (or nothing) attach the other

**Statement.** Two security groups with near-identical names exist in the same VPC — typically a
hand-created original and an IaC-created successor (or two generations of IaC naming). Discrete
rule resources in the IaC target one twin; the workload's interfaces (or no interfaces at all)
attach the other. Each side reads as authoritative in its own frame: the IaC plan manages rules
nothing enforces, while the attached (or orphaned) twin carries hand-era rules — often stale and
alarming-looking (world-open ports, residential /32 SSH) — that no plan can ever surface. When the
whole plane is dead (zero attachments on all twins), the debris additionally inflates every future
audit's surface.

**Detect.** Group the VPC's security groups by normalized name (strip prefixes/suffixes like
environment markers); for each group with >1 member, map (a) which member the IaC rule resources
target and (b) which member live ENIs attach. A mismatch is the finding. Zero ENIs across all
members plus no reference from any live rule's source field marks the plane deletable — confirm
against the service's desired/running counts before calling it dead.

**False positives.** Blue/green or migration windows where both twins are intentionally live and
tracked; name-similar groups that genuinely serve different planes (verify by attachment, not by
name).
## C:26 — A no-egress posture enforced at only one layer — SG rules over a subnet whose route table still offers a default route — is one edit away from exfiltration

**Statement.** A sensitive compute plane is declared "no internet" because its security group has
no egress rule reaching 0.0.0.0/0 — while its subnet's route table still carries a default route
to a NAT or internet gateway. The posture is real but single-layered: any future SG edit (a
debugging rule, a copy-pasted allow-all egress) instantly opens a WORKING internet path, because
the route layer was never closed. Depth for data-plane isolation means the route table itself
offers no internet route — then the mistaken SG rule leads nowhere. The regression pattern to
watch: a workload MOVES from a purpose-built isolated network (where no NAT existed at all) into a
shared VPC that has one. The SG posture survives the move; the route-layer guarantee silently does
not.

**Detect.** For each sensitive plane: subnet → route table → look for 0.0.0.0/0 or ::/0. Where
present, establish whether the workload needs it at all; if every dependency rides interface
endpoints and gateway-endpoint prefix lists (including OS updates via S3-hosted distro mirrors),
give the subnet a dedicated route table with only local + gateway-endpoint routes. Check the route
table's ASSOCIATIONS before editing — a table shared with internet-needing neighbors must be
split, not stripped.

**False positives.** Planes with a genuine, enumerated internet dependency — document the
destination class and prefer proxied egress; route tables shared by design where SG-only is a
documented accepted risk carrying a compensating detective control (flow-log alerting on the
plane's ENIs). An undocumented single lock is the finding; a documented one is a posture.
