<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# spec/specification/

Normative prose specification for Mosvera, versioned per the
comparable-class pattern (OpenAPI's `versions/`, OpenTelemetry's
`specification/`).

## Layout

| Directory | Purpose |
|-----------|---------|
| `draft/` | Work-in-progress next version. The current draft is the one MEPs target when they reach `accepted` status. |
| `0.1/`, `0.2/`, … | Ratified, immutable versioned specifications. Once a version is cut, its directory contents do not change except for non-normative editorial fixes. |

## Status

Phase 0b. Scaffold only. Phase 1 (Specification Genesis) populates
`draft/` with the prose specification covering aesthetic primitives,
inheritance semantics, composition rules, validation behavior, and
the provider compilation contract — see
[`ROADMAP.md`](../ROADMAP.md#phase-1--specification-genesis).

## License

CC-BY-4.0 per
[ADR-0001](../docs/decisions/0001-license-choice.md). The
specification is documentation, not code; downstream tutorials,
books, and ecosystem documentation can quote and remix the spec
with attribution.
