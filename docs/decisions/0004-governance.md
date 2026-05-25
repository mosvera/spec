# ADR-0004: Pre-public and First-release Governance

**Status:** Accepted
**Date:** 2026-05-24
**Doctrines invoked:** Public-first, Adoption-over-convenience, Comparable-class framing, Research-first

## Context

Mosvera is in quiet incubation, currently maintained by a single author, but architected to attract multi-vendor provider implementations (OpenAI, Flux, SDXL, Kling, Runway adapters) and multi-language runtime implementations (TS, Python, Rust). For such a project, governance is not decoration — it's a credibility signal to potential implementers. The wrong claim ("we have a Technical Steering Committee" with one person) is worse than the honest claim ("BDFL during incubation, formalizing at 1.0").

Two questions:
1. What governance posture does Mosvera adopt *now*, during pre-public incubation?
2. What is the target posture at the first public release (1.0)?

The corollary question — *when* to seek foundation hosting — also needs an answer, even if the answer is "not yet".

## Research

**Benevolent Dictator / BDFL** is the historical default for solo-authored open-source projects. Python ran this way under Guido van Rossum until 2018; the Linux kernel still runs under Linus Torvalds. The Open Source Guide is explicit: *"smaller projects naturally default to BDFL structures initially, then evolve as contributor communities develop."* It also notes there is *"no right time to write down your project's governance"* but that early documentation of contributor expectations helps. [1][2]

**GraphQL Foundation + TSC** is the canonical pattern for a spec-first, multi-vendor project at maturity. The Technical Steering Committee has **10 elected members plus the Executive Director**, **two-year terms with staggered annual elections**, governed by a Technical Charter under the Joint Development Foundation. Decisions are consensus-first with formal voting fallback (simple majority / Condorcet / STV depending on choice type). [3][4]

**OpenTelemetry** uses a split Governance Committee (strategy) + Technical Committee (technical direction) structure, with SIGs running individual language implementations. The TC has a minimum of four members, no term limits, an over-representation cap (no employer >25%), and explicit attendance requirements (members below 25% meeting attendance over 6 months are removed). SIGs have significant autonomy; the TC adjudicates cross-cutting decisions. [5][6]

**CloudEvents** is the closest comparable for a spec-first interoperability project: hosted at CNCF, **sandbox 2018 → incubator 2019 (v1.0 release) → graduated 2024**, with 340+ contributors from 122 organizations by graduation. Foundation donation happened **early** (sandbox at month-one), but graduation took six years and required demonstrated multi-vendor production adoption. [7][8]

**CNCF graduation criteria** require a GOVERNANCE.md, a MAINTAINERS.md with explicit maintainer criteria and offboarding rules, the CNCF Code of Conduct, and committers from multiple organizations. Adoption is verified, not asserted. [9]

**DCO vs CLA.** The Linux Foundation / CNCF ecosystem has converged on **DCO** (Developer Certificate of Origin, `git commit -s`) as the lower-friction default. Docker, OpenStack (as of 2025), Kubernetes, Prometheus, Envoy all use DCO. CLAs are appropriate when a single company plans to retain commercial relicensing rights or operates in a regulated domain. For a vendor-neutral spec project that wants maximum drive-by contribution velocity, DCO wins. [10][11]

**Foundation donation timing.** CloudEvents donated to CNCF sandbox very early (before 1.0). GraphQL donated to the Linux Foundation in 2018, three years after Facebook open-sourced the spec. OpenTelemetry was a CNCF project from inception (formed by merging OpenTracing and OpenCensus, both already CNCF). The pattern: **donate when you need vendor-neutrality to be credible**, which is typically when you start courting your first non-author implementers — not when you publish a README.

## Decision

**Posture during incubation (now → first public release):**

- **BDFL with a written succession path.** The author holds final decision authority. This is the honest, comparable-class-recognized default for solo-maintained projects. Do not claim a TSC that doesn't exist.
- **GOVERNANCE.md ships from day one** stating: (a) current model is BDFL, (b) the project is architected to transition to a multi-maintainer technical committee at 1.0, (c) the criteria for becoming a maintainer.
- **DCO from day one** (`git commit -s`). Aligns with the CNCF ecosystem Mosvera will likely join; zero friction for drive-by contributors; preserves contributor copyright.
- **CONTRIBUTING.md** documents the MEP process (ADR-0003), the DCO requirement, and the review expectations.
- **Code of Conduct:** Contributor Covenant v2.1, the de facto standard.
- **MAINTAINERS.md** with the single current maintainer listed; explicit criteria for adding new maintainers ("sustained contribution over 3+ months, sponsored by an existing maintainer, approved by simple majority of existing maintainers").
- **No foundation donation during incubation.** Premature donation locks in governance theater before the abstraction has been proven.

**Target posture at first public release (1.0):**

- **Transition to a small Technical Committee** modeled on OpenTelemetry's TC (smaller scale): minimum 3 members, odd numbers preferred, no employer >40% (relaxed from OTel's 25% given smaller pool), term length 2 years staggered. Decisions consensus-first, simple majority fallback.
- **Working Groups** for major surface areas as they emerge: `spec-wg`, `runtime-wg`, `providers-wg`, `mcp-wg`. Modeled on OTel SIGs — autonomous within scope, TC adjudicates cross-cutting issues.
- **MEPs require 2 TC approvals** during the early TC phase (raising to 4 once TC ≥5, matching OTel).
- **Foundation evaluation at 1.0.** Candidates: CNCF (CloudEvents/OpenTelemetry precedent), Linux Foundation projects (GraphQL/OpenAPI precedent), Joint Development Foundation (GraphQL's specific home, useful for spec-only projects). Defer the actual donation until at least one external provider implementation is in production — vendor-neutrality has to be true before it's claimed.

**What this ADR does *not* claim:**

- That Mosvera has a TSC today.
- That Mosvera is foundation-hosted or seeking hosting imminently.
- That there is a multi-vendor maintainer pool today.

Honesty about the incubation reality is itself a credibility signal; manufactured governance is a well-known anti-pattern.

## Consequences

- The GOVERNANCE.md text is short, honest, and reads as "we know what good looks like and we're walking toward it" rather than "we've already arrived". This is the right signal for incubation.
- DCO from day one means there's no migration pain later — CNCF and Linux Foundation paths stay open. Switching from CLA → DCO post-hoc is a known-painful migration (OpenStack just did it in 2025).
- The succession-path-in-writing means the first external contributor with sustained presence has a documented path to maintainership; no informal-power dynamics.
- The 1.0-triggered foundation evaluation means Mosvera defers a one-way decision until evidence (provider adoption) makes it the right call.
- Risk: BDFL governance can repel some corporate contributors who require a foundation-hosted CLA-or-DCO arrangement before contributing. Mitigation: GOVERNANCE.md explicitly names the transition trigger, so corporate evaluators can see the target end-state.

## Sources

1. [Open Source Guide — Leadership and Governance](https://opensource.guide/leadership-and-governance/) — Validated that BDFL is the comparable-class default for solo-maintained early projects, and that early written governance (even if BDFL) is the recommended posture.
2. [OSS Watch — Benevolent Dictator Governance Model](http://oss-watch.ac.uk/resources/benevolentdictatorgovernancemodel) — Defined the BDFL pattern Mosvera is honestly adopting for incubation.
3. [GraphQL Project Governance](https://graphql.org/community/contribute/governance/) — Source of the TSC pattern (10 elected + Executive Director, two-year staggered terms) that Mosvera's 1.0 target adapts at smaller scale.
4. [GraphQL TSC Charter](https://github.com/graphql/graphql-wg/blob/main/GraphQL-TSC.md) — Detailed decision-making mechanics (consensus / majority / Condorcet / STV) and quorum rules informing Mosvera's voting fallback.
5. [OpenTelemetry Technical Committee Charter](https://github.com/open-telemetry/community/blob/main/tech-committee-charter.md) — Source of the minimum-4, odd-numbered, no-employer-over-25%, attendance-requirement pattern Mosvera adapts (relaxed to 40% for smaller pool).
6. [Behind the scenes of the OpenTelemetry Governance Committee](https://opentelemetry.io/blog/2024/otel-governance/) — Confirmed the split GC (strategy) + TC (technical) model and the SIG autonomy pattern Mosvera's future Working Groups will mirror.
7. [CNCF — CloudEvents Graduation Announcement](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) — Showed the realistic sandbox(2018) → incubator/v1.0(2019) → graduated(2024) timeline for a spec-first interop project; informed the "don't donate prematurely" posture.
8. [InfoQ — CloudEvents 1.0 Release](https://www.infoq.com/news/2019/11/cncf-cloudevents-1-0-version/) — Documented the multi-vendor adoption profile (340+ contributors, 122 orgs) that justified CloudEvents' foundation path.
9. [CNCF Graduation Criteria](https://github.com/cncf/toc/blob/main/process/graduation_criteria.md) — Source of the GOVERNANCE.md / MAINTAINERS.md / Code of Conduct / multi-org-committer requirements Mosvera pre-positions for during incubation.
10. [Opensource.com — CLA vs DCO](https://opensource.com/article/18/3/cla-vs-dco-whats-difference) — Comparison of legal/process tradeoffs that drove the DCO-from-day-one decision.
11. [OpenStack TC Resolution — Replace CLA with DCO (2025)](https://governance.openstack.org/tc/resolutions/20250520-replace-the-cla-with-dco-for-all-contributions.html) — Evidence of recent industry direction-of-travel away from CLAs, reinforcing DCO as the future-safe default.
