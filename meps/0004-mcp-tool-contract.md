<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# MEP-0004: MCP Tool Contract

**Status:** Draft/Provisional
**Author(s):** Founding maintainer
**Created:** 2026-05-25
**Updated:** 2026-05-26
**Tracking issue:** assigned at PR merge
**Superseded by:** —

## Summary

This MEP defines the public Model Context Protocol surface for Mosvera. The
MCP server is an agent-facing bridge over the language-neutral Mosvera spec and
the reference runtimes. It lets AI-native clients inspect, resolve, compile,
draft, save, and delete local aesthetic registry documents without calling
image providers or hosting user registries on `mosvera.io`.

The contract is intentionally local-first:

- Transport is stdio.
- The normal desktop distribution is an MCP Bundle (`.mcpb`).
- npm remains the developer and automation distribution path.
- Registry files are user-owned local data.
- Provider HTTP execution is out of scope.

## Tool Set

The public server exposes thirteen tools. Implementations MAY omit write tools
when started in read-only mode.

| Tool | Mode | Purpose |
|------|------|---------|
| `server_status` | Read | Registry path, write mode, versions, document counts, diagnostics. |
| `list_aesthetics` | Read | List named composition aesthetics in the active registry. |
| `get_registry_document` | Read | Fetch a template, modifier, palette, composition, or capability manifest. |
| `validate_document` | Read | Validate one document against a Mosvera schema kind. |
| `validate_registry` | Read | Validate the active registry and return diagnostics. |
| `resolve_aesthetic` | Read | Resolve a named or inline aesthetic to a canonical Mosvera model. |
| `compile_design_tokens` | Read | Compile canonical output into portable design tokens and CSS variables. |
| `compile_provider_payload` | Read | Deterministically compile a provider payload; no provider HTTP call. |
| `draft_aesthetic` | Read | Draft a composition document without saving it. |
| `save_aesthetic` | Write | Create or update a named composition aesthetic. |
| `save_registry_document` | Write | Create or update a registry document or capability manifest. |
| `delete_registry_document` | Destructive write | Delete a registry document or capability manifest. |
| `write_merge_strategies` | Write | Replace `merge-strategies.json` with deterministic JSON. |

Legacy names from the Phase 3 prototype (`list_templates`,
`resolve_composition`, `get_palette`, `validate_schema`,
`compile_generation`) are not part of this public v0.1 MCP contract.

## MCP Semantics

Every tool MUST define:

- A strict input schema.
- An output schema.
- MCP tool annotations.
- `structuredContent` in tool results.
- A short text content summary for clients that render only text.

Read tools MUST declare:

```json
{ "readOnlyHint": true, "destructiveHint": false, "openWorldHint": false }
```

Write tools MUST declare:

```json
{ "readOnlyHint": false, "destructiveHint": false, "idempotentHint": true, "openWorldHint": false }
```

Delete tools MUST declare:

```json
{ "readOnlyHint": false, "destructiveHint": true, "idempotentHint": true, "openWorldHint": false }
```

Operational failures such as invalid documents, unsafe filenames, missing
references, unknown providers, unwritable registries, and schema failures MUST
return a tool result with `isError: true` and structured error detail.
Validation-result tools MAY return successful results with `valid: false`.

## Registry Model

The MCP server loads a local Mosvera project registry. On first run, a writable
default registry is created and seeded with public demo aesthetics:

- `quiet-editorial`
- `technical-manual`
- `cinematic-lab`
- `claymation-playful-builder`

Default registry locations:

| Platform | Default registry |
|----------|------------------|
| macOS | `~/Library/Application Support/Mosvera/registry` |
| Windows | `%APPDATA%/Mosvera/registry` |
| Linux/dev | `~/.config/mosvera/registry` |

The server MUST support `--registry`, `MOSVERA_REGISTRY_DIR`, `--read-only`,
and `MOSVERA_MCP_READ_ONLY`. MCPB packages SHOULD expose registry directory
and read-only mode as user configuration.

The server reads JSON and YAML, but writes deterministic JSON only:

```text
template.<id>.json
modifier.<id>.json
palette.<id>.json
composition.<id>.json
manifests/<provider>.manifest.json
merge-strategies.json
```

Implementations MUST reject absolute paths, dotfiles, path traversal, unknown
kinds, and ids that are not valid Mosvera references.

## Boundaries

The MCP server MAY compile deterministic provider payloads using reference
provider adapters. It MUST NOT execute provider network calls, manage provider
API keys, generate PowerPoint decks, generate HTML reports, or behave as a
remote hosted registry. Artifact adapters and provider execution are separate
surfaces that consume runtime output.

## Status

This MEP is Draft/Provisional because the MCP surface is intended for immediate
use but may evolve after external client feedback. The semantics of resolution,
merge behavior, registry diagnostics, design-token compilation, and provider
compilation are defined by the runtimes and the conformance suite; this MEP
defines only the MCP packaging and tool contract.
