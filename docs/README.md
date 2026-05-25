<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# docs/

Narrative documentation, guides, and decision records for Mosvera.

The substantive root-level documents — `MANIFESTO.md`, `ROADMAP.md`,
`GLOSSARY.md`, `README.md`, and the governance files (`CONTRIBUTING`,
`GOVERNANCE`, `MAINTAINERS`, `CODE_OF_CONDUCT`, `SECURITY`,
`CHANGELOG`) — live at the repository root for legibility per
[ADR-0002](./decisions/0002-top-level-repository-layout.md). This
directory holds the longer-form supporting material.

## Layout

| Directory | Purpose |
|-----------|---------|
| `decisions/` | [Architecture Decision Records (ADRs)](./decisions/) — immutable, retrospective records of decisions made about repository architecture, governance, license, layout, and naming. |
| `guides/` | How-tos and concept guides. Lands content as the runtime, MCP server, and provider adapters ship. |
| `strategy/` | The strategic plan and other long-form strategy documents. |

## Document types

| Type | Location | Purpose | Mutability |
|------|----------|---------|------------|
| **ADR** | `docs/decisions/` | Repo architecture decisions | Immutable once accepted |
| **MEP** | [`spec/meps/`](../meps/) | Spec changes | Tracked through a lifecycle |
| **Guide** | `docs/guides/` | How-tos and concept guides for users | Living, updated as software evolves |

The MEP/ADR distinction is binding — see
[ADR-0003](./decisions/0003-rfc-and-proposal-format.md).

## License

Documentation is CC-BY-4.0 per
[ADR-0001](./decisions/0001-license-choice.md). Quote and remix with
attribution.
