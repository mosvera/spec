<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Governance

This document records how Mosvera makes decisions today and how the
project will transition its governance model as it grows. It is the
honest record of where the project actually is — not where it aspires
to be.

The decisions in this document are grounded in
[ADR-0004: Pre-public and First-release Governance](./docs/decisions/0004-governance.md).

## Current model: Benevolent Dictator (BDFL)

Mosvera is currently maintained by a single author who holds final
decision authority on the specification, the reference runtime, the
MCP surface, and the in-tree provider adapters. This is the honest,
comparable-class-recognized default for a project at this stage. We
do not claim a Technical Steering Committee that does not exist; we
do not claim a multi-vendor maintainer pool that does not exist; we
do not claim foundation hosting that we have not pursued.

This posture matches the earliest public phase of many comparable
open-standard projects: a clearly named maintainer, written decision
processes, and explicit criteria for adding more maintainers as real
contributors arrive.

## Decision-making process

During the single-maintainer phase:

- **Repository-architecture decisions** (license, layout, naming,
  governance changes) are recorded as
  [Architecture Decision Records](./docs/decisions/) using the Nygard
  format. Each ADR cites at least three authoritative sources per
  [Doctrine 5 (Research-first)](./CLAUDE.md#5-research-first).
- **Specification changes** go through the
  [Mosvera Enhancement Proposal (MEP)](./meps/) process defined
  in [ADR-0003](./docs/decisions/0003-rfc-and-proposal-format.md).
  MEPs are reviewed publicly by the maintainer. Once the maintainer pool
  has at least 2 active maintainers, MEPs require 2 maintainer approvals
  (raising to 4 once the maintainer pool exceeds 4), with a 7-day Final
  Comment Period before merge.
- **Provider adapter additions** are subject to the exclusion policy
  in [ADR-0008](./docs/decisions/0008-provider-adapter-pairing.md):
  no adapters against unofficial or reverse-engineered APIs.
- **Day-to-day technical decisions** are made by the maintainer with
  no formal process. Contributors may open issues or pull requests at
  any time.

## Becoming a maintainer

We welcome contributors. Becoming a maintainer is a deliberate step
documented in [MAINTAINERS.md](./MAINTAINERS.md). Criteria:

- Sustained contribution over at least 3 months (code, MEPs, ADRs,
  documentation, examples — any meaningful surface).
- Sponsored by an existing maintainer who can speak to the
  contributor's judgment and reliability.
- Approved by simple majority of existing maintainers (with the
  current single-maintainer state, that is the current maintainer's
  decision — this rule scales naturally as the pool grows).

There is no requirement to be employed by any particular organization.
There is no requirement to be present in any particular geography or
time zone. The criteria are about contribution and judgment, not
about identity.

## Contribution mechanism

Mosvera uses the [Developer Certificate of Origin (DCO)](https://developercertificate.org/),
not a Contributor License Agreement (CLA). Contributors sign each
commit with `git commit -s`, certifying they have the right to
contribute the work under the project's license.

Rationale: DCO is the lower-friction default for vendor-neutral
projects and aligns with the CNCF / Linux Foundation ecosystem
Mosvera will likely join. See
[ADR-0004](./docs/decisions/0004-governance.md) and
[CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

## Code of conduct

Mosvera adopts [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)
as its code of conduct. See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
for the full text and the reporting mechanism.

## Target model at 1.0

At the first public release (1.0), Mosvera will transition to a
small Technical Committee modeled on the
[OpenTelemetry Technical Committee](https://github.com/open-telemetry/community/blob/main/tech-committee-charter.md)
pattern, with the following adaptations for a smaller-pool project:

- **Minimum 3 members**, odd numbers preferred to avoid tied votes
- **No employer over 40%** of the committee (relaxed from OTel's 25%
  given the smaller pool)
- **2-year terms**, staggered so not all seats turn over at once
- **Consensus-first decisions**, with simple-majority fallback for
  unresolvable disagreements
- **Working Groups** for major surface areas as they emerge:
  `spec-wg`, `runtime-wg`, `providers-wg`, `mcp-wg`. Modeled on
  OpenTelemetry SIGs — autonomous within their scope; the TC
  adjudicates cross-cutting issues.

MEPs at that stage will require 2 TC approvals (raising to 4 once the
TC has 5 or more members).

## Foundation evaluation

Mosvera begins foundation-hosting evaluation during Phase 6 as a research
exercise only. Donation remains gated on having at least one external
provider implementation in production. Vendor-neutrality has to be true
before it is claimed — premature foundation hosting locks in governance
theater that the project has not yet earned.

Candidate foundations (in alphabetical order):

- [Cloud Native Computing Foundation (CNCF)](https://www.cncf.io/)
  — CloudEvents and OpenTelemetry precedent for spec-first
  interoperability projects.
- [Joint Development Foundation (JDF)](https://www.jointdevelopment.org/)
  — GraphQL's specific home; well-suited to spec-only projects.
- [Linux Foundation Projects](https://www.linuxfoundation.org/projects)
  — GraphQL and OpenAPI precedent for multi-vendor specifications.

## Transparency

This document, the ADRs, the MEPs, and the CHANGELOG are the
public-facing record of how Mosvera evolves. Nothing important
happens off-record. Decisions reversed or revised supersede prior
ADRs rather than rewriting them; the historical record stays intact.

## What this document does not claim

- That Mosvera has a TSC today.
- That Mosvera is foundation-hosted or seeking hosting imminently.
- That there is a multi-vendor maintainer pool today.

Honesty about the current reality is itself a credibility signal. This
document is structured so that any reader can see where the project is now
and where it intends to go, without being misled about either.
