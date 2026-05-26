<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# ADR-0011: MCP Surface Design

**Status:** Accepted
**Date:** 2026-05-25
**Updated:** 2026-05-26

## Context

The first MCP prototype exposed five developer-shaped tools over stdio. That
proved the runtime could be reached through MCP, but it was not the right
public surface for immediate desktop use. Phase 6F reframes `@mosvera/mcp` as
the practical agent bridge: Claude Desktop and other MCP clients should be able
to install Mosvera, inspect a local aesthetic registry, compile portable
tokens, and save new aesthetics without knowing npm, JSON-RPC, or repository
layout details.

## Decision

`@mosvera/mcp` is a local stdio MCP server distributed in two forms:

- MCPB (`.mcpb`) for Claude Desktop and non-command-line users.
- npm (`@mosvera/mcp`) for developers, automation, and other MCP hosts.

The public tool surface is aesthetic-first:

- `server_status`
- `list_aesthetics`
- `get_registry_document`
- `validate_document`
- `validate_registry`
- `resolve_aesthetic`
- `compile_design_tokens`
- `compile_provider_payload`
- `draft_aesthetic`
- `save_aesthetic`
- `save_registry_document`
- `delete_registry_document`
- `write_merge_strategies`

The server registers write tools by default when the active registry is
writable. It uses MCP annotations to communicate read/write/destructive
semantics instead of hiding writes behind a bespoke `--allow-write` flag. A
standard `--read-only` mode suppresses persistence tools for locked-down
installs.

The server creates a user-owned local registry on first run and seeds the four
public demo aesthetics from `mosvera.io`. It never writes into packaged example
directories. If the registry cannot be created or loaded, the server falls
back to packaged examples in read-only mode and reports that state through
`server_status`.

## Rationale

MCP clients already have a vocabulary for tool risk: `readOnlyHint`,
`destructiveHint`, `idempotentHint`, and `openWorldHint`. Using those
annotations keeps Mosvera aligned with the protocol and avoids making every
desktop user learn command-line guard flags before saving a local aesthetic.

MCPB is the primary desktop installation path because it bundles dependencies
and exposes a settings UI. npm remains important, but it is a developer path,
not the first public user experience.

The registry is local user data. `mosvera.io` hosts schemas, docs, examples,
and the live aesthetic demonstrator; production users bring Mosvera into their
own systems rather than pointing their runtime work at the public website.

## Consequences

- Tool results carry `structuredContent` plus text summaries.
- Tool failures return `isError: true` with structured detail, while schema
  validation checks may return `{ "valid": false }` as successful results.
- Write tools are constrained to the active registry root and use the runtime's
  safe-path and deterministic JSON persistence rules where available.
- Provider payload compilation remains deterministic and local. Provider HTTP
  execution, API keys, slide generation, HTML report generation, and remote
  hosted registry behavior remain out of scope.

## References

- [MEP-0004: MCP Tool Contract](../../meps/0004-mcp-tool-contract.md)
- [MCP tool schema and annotations](https://modelcontextprotocol.io/specification/2025-11-25/schema)
- [Claude MCPB build documentation](https://claude.com/docs/connectors/building/mcpb)
- [MCPB repository](https://github.com/modelcontextprotocol/mcpb)
