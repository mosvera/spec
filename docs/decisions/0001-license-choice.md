# ADR-0001: License choice

**Status:** Accepted
**Date:** 2026-05-24
**Doctrines invoked:** Public-first, Adoption-over-convenience, Comparable-class framing, Research-first

## Context

Mosvera is a multi-surface project: a specification (provider-neutral semantic model for aesthetic intent), a reference runtime, an MCP server, provider adapters compiled from the canonical model, and examples. For an open standard to attract independent provider implementations — particularly from commercial AI providers (image, video, motion vendors) — the license must (a) be familiar to enterprise legal review, (b) carry an explicit patent grant, and (c) impose no copyleft obligation on downstream provider code that consumes or implements the spec.

Mosvera also has a spec/runtime split similar to the comparable class: the spec is normative prose + schemas; the runtime/MCP/providers are executable code. The decision must address whether to use a single license for the whole repository or split spec vs. code licenses, and whether to follow the CNCF dual-license convention (Apache-2.0 code + CC-BY-4.0 documentation) or the GraphQL OWFa pattern.

## Research

**Apache-2.0 dominates the comparable class for code.** Every comparable open-standard project surveyed licenses its reference code under Apache-2.0:

- OpenTelemetry — spec, collector, and language SDKs all Apache-2.0.
- OpenAPI Specification — Apache-2.0 for specification and code; documentation under CC-BY-4.0.
- CloudEvents (CNCF graduated) — Apache-2.0 at the repo root.
- AsyncAPI (Linux Foundation) — Apache-2.0.
- Kubernetes — Apache-2.0; founding CNCF project.

**The CNCF dual-license convention is the operational default** for projects that mix code and prose. The CNCF Foundation's `license-notices.md` codifies it: `SPDX-License-Identifier: Apache-2.0` for code, `SPDX-License-Identifier: CC-BY-4.0` for documentation, with mixed-content repos using `Apache-2.0 AND CC-BY-4.0` and the REUSE `/LICENSES/` directory pattern. CNCF's stated reason: "the greatest possible adoption of our projects by developers and users," reinforced by Apache-2.0's explicit patent grant.

**Patent grant matters and Apache-2.0 provides it explicitly.** Apache-2.0 grants a "perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable" patent license covering claims necessarily infringed by contributions. MIT contains no explicit patent grant — for a project whose adoption depends on commercial providers contributing adapters, that ambiguity is a real adoption tax. This is the central reason CNCF chose Apache-2.0 over MIT as its default.

**Outliers and what they teach us:**

- **GraphQL** uses OWFa 1.0 (Open Web Foundation Agreement, Patent and Copyright Grants) for the spec and MIT for graphql-js/Relay. The OWFa exists specifically to govern implementations of a standard across many vendors. It was chosen after Facebook's earlier patent-clause controversy; the article's author frames OWFa as "designed for collaborative open standards." OWFa is excellent for a multi-vendor working group, but it is unfamiliar to enterprise legal teams compared to Apache-2.0 and adds review friction for a project at Mosvera's stage.
- **JSON Schema** uses BSD-3-Clause + Academic Free License v3.0 (dual). This is a legacy IETF-adjacent pattern, not a model the modern comparable class follows.
- **Terraform** is the cautionary tale: relicensed from MPL-2.0 to BSL 1.1 in August 2023, immediately forked to OpenTofu under Linux Foundation. Source-available is not open-source and triggers ecosystem flight. Confirms that any non-OSI license — including BSL, SSPL, or "fair source" variants — is disqualifying for an open standard.

**Adoption signal in 2025.** MIT and Apache-2.0 dominate permissive licensing; MIT leads on raw count, Apache-2.0 dominates enterprise/foundation projects where patent protection is required. For a project explicitly courting commercial provider adoption (OpenAI, Black Forest Labs, Stability, Runway, Kling, etc.), Apache-2.0 is the legally-reviewed default already on file in those organizations.

## Decision

Mosvera adopts a **CNCF-style dual-license**:

- **Code** (runtime, MCP server, provider adapters, tooling, examples): **Apache-2.0**.
- **Documentation and specification prose** (spec text, RFCs, glossary, narrative docs, READMEs, decision records): **CC-BY-4.0**.
- **Schemas** (JSON Schema definitions, type definitions, normative machine-readable artifacts): **Apache-2.0**, because they will be embedded into and shipped by implementations.

Repository declares `SPDX-License-Identifier: Apache-2.0 AND CC-BY-4.0` at the root. Both full license texts ship in a `LICENSES/` directory per the REUSE convention. Per-file SPDX headers on code; per-file SPDX headers on Markdown where practical.

A single OWFa-style spec license is **rejected**. OWFa is purpose-built for multi-vendor standards bodies but is unfamiliar to commercial legal review and undersells the project's posture at the incubation stage. If Mosvera later forms a formal working group with multiple vendor members co-authoring the spec, OWFa can be revisited as a non-breaking re-license of the spec text only (CC-BY-4.0 → OWFa would be a directional change worth re-deciding).

## Consequences

**Enables:**
- Commercial providers can ship Mosvera adapters without copyleft contagion.
- Apache-2.0 patent grant removes a category of adoption objection from enterprise legal review.
- CC-BY-4.0 on spec prose matches CNCF/OpenAPI convention; downstream documentation sites, books, and tutorials can quote and remix the spec with attribution.
- Future donation to a foundation (CNCF, Linux Foundation, OpenJS) is friction-free — licensing already matches their defaults.

**Precludes:**
- Copyleft strategies (AGPL, MPL) that would force provider implementations to open-source. This is intentional: aesthetic providers will not adopt a copyleft standard.
- Any "fair source" or BSL-style hybrid. Source-available is not open and would foreclose foundation hosting and serious provider adoption.

**Tradeoffs accepted:**
- Apache-2.0 requires NOTICE file propagation and modified-file marking, slightly heavier than MIT. This is the cost of the patent grant and is standard for the comparable class.
- Two licenses in one repository requires SPDX hygiene; the REUSE convention handles this cleanly.
- We forgo the GraphQL OWFa pattern's signaling that "this is a multi-vendor standard." That signal is premature in incubation; we will revisit if and when multi-vendor co-authorship materializes.

## Sources

1. [CNCF license-notices.md (cncf/foundation)](https://github.com/cncf/foundation/blob/main/license-notices.md) — Canonical SPDX guidance: `Apache-2.0` for code, `CC-BY-4.0` for documentation, `Apache-2.0 AND CC-BY-4.0` for mixed-content repos, REUSE `/LICENSES/` directory pattern.
2. [Why CNCF recommends Apache-2.0 (CNCF blog)](https://www.cncf.io/blog/2017/02/01/cncf-recommends-aslv2/) — Stated rationale: maximum adoption, explicit patent protection, uniformity to reduce legal-review friction.
3. [OpenTelemetry Specification LICENSE](https://github.com/open-telemetry/opentelemetry-specification/blob/main/LICENSE) — Apache-2.0 for the spec repository; confirms the comparable-class pattern.
4. [OpenAPI Specification governance](https://www.openapis.org/participatehow-to-contribute/governance) — Spec and code Apache-2.0; documentation CC-BY-4.0. Direct precedent for the split we adopt.
5. [Relicensing the GraphQL Specification (Lee Byron)](https://leebyron.com/relicensing-the-graphql-specification/) — Rationale for OWFa on the spec and MIT on the reference impl; informs why we explicitly defer OWFa to a later multi-vendor stage.
6. [Spacelift — Terraform License Change (BSL)](https://spacelift.io/blog/terraform-license-change) — The OpenTofu fork as evidence that any non-OSI license disqualifies a project from serving as an open standard.
7. [choosealicense.com — Apache 2.0](https://choosealicense.com/licenses/apache-2.0/) — Confirms the explicit patent grant and the obligations (NOTICE preservation, change documentation) we are accepting.
8. [JSON Schema specification repository](https://github.com/json-schema-org/json-schema-spec) — Legacy BSD-3-Clause + AFL-3.0 dual-license pattern, surveyed and rejected as not representative of the modern comparable class.
