<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Mosvera Enhancement Proposals (MEPs)

MEPs are the mechanism for proposing changes to Mosvera's public
specification. The process is defined in
[ADR-0003](../docs/decisions/0003-rfc-and-proposal-format.md) and
modeled on OpenTelemetry Enhancement Proposals (OTEPs), which in
turn borrow from Rust RFCs and Kubernetes Enhancement Proposals.

**MEPs ≠ ADRs.** MEPs propose changes to the public spec. ADRs
record repository-architecture decisions. The two systems do not
overlap — see [ADR-0003](../docs/decisions/0003-rfc-and-proposal-format.md)
for the full distinction.

## Format

Use [`0000-template.md`](./0000-template.md). The template's seven
sections are: Motivation, Explanation, Internal details, Trade-offs
and mitigations, Prior art and alternatives, Open questions, and
Future possibilities.

## Numbering

MEPs are numbered by the **PR number at merge time**, four-digit
zero-padded (`MEP-0017`). Before merge, a discussion PR is
referenced by descriptive slug (`mep/inheritance-resolution.md`).

## Lifecycle

| State | Meaning |
|-------|---------|
| `provisional` | Open PR, under discussion. |
| `accepted` | PR merged, design agreed. |
| `implementable` | Accepted and ready for runtime / provider work. |
| `implemented` | Runtime and at least one provider ship it. |
| `final` | Promoted into the normative spec; immutable. |
| `deferred` | Paused, may resume. |
| `rejected` | Declined. |
| `withdrawn` | Author withdrew. |
| `superseded` | Replaced by a later MEP (carries `superseded-by: MEP-NNNN`). |

## Review

Review happens on the GitHub PR.

During the single-maintainer phase, the maintainer reviews the proposal
publicly, requests changes as needed, and records acceptance or rejection
on the PR. Once Mosvera has at least two active maintainers, MEPs require
**2 maintainer approvals** and a **7-day Final Comment Period before
merge** once approvals land. The approval threshold raises to 4 once the
maintainer pool exceeds 4, matching the OpenTelemetry pattern documented
in [ADR-0004](../docs/decisions/0004-governance.md).

The review bar is:

- The problem belongs in the public specification, not only in one
  runtime, adapter, or example.
- The proposal cites relevant prior art or provider behavior.
- The compatibility impact on schemas, conformance vectors, runtime
  behavior, and providers is explicit.
- Open questions are named rather than hidden.

## Submitting a proposal

1. Open a GitHub issue using the "Feature request or MEP proposal"
   template. Use the issue to test whether the problem belongs in the spec.
2. If the maintainer agrees a MEP is warranted, copy
   [`0000-template.md`](./0000-template.md) into a draft file and fill in
   the seven required sections.
3. Open a pull request. Keep the first version small enough to review.
4. Update conformance vectors, schemas, or examples in the same PR only
   when they are needed to make the proposal precise.

## Status

The foundational v0.1 MEP set is present. MEPs 0001-0003 define the
semantic model: composition, inheritance, and provider compilation.
MEP-0004 defines the MCP tool contract. All four remain provisional
until external implementer feedback proves the interfaces stable.

## Index

| MEP | Title | Status |
|-----|-------|--------|
| [0001](./0001-composition-semantics.md) | Composition Semantics | provisional |
| [0002](./0002-inheritance-rules.md) | Inheritance Rules | provisional |
| [0003](./0003-provider-compilation-contract.md) | Provider Compilation Contract | provisional |
| [0004](./0004-mcp-tool-contract.md) | MCP Tool Contract | draft / provisional |

The three foundational MEPs above define the full semantic model: how
aesthetic intent composes (0001), inherits (0002), and compiles to
provider payloads (0003). Together they take a declaration of aesthetic
intent all the way to a provider-ready request.
