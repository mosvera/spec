<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Phase 6G Closeout: Public Runtime Surface

Phase 6G closes the mechanical public unlock by making Mosvera usable from
the public repositories, package registries, and Claude Desktop without
private context.

## Shipped Surface

The first public runtime surface is live:

| Surface | Public version |
|---------|----------------|
| TypeScript/JavaScript runtime | `@mosvera/runtime@0.1.2` |
| Python runtime | `mosvera@0.1.2` |
| MCP bridge | `@mosvera/mcp@0.1.7` |
| Provider adapters | `@mosvera/provider-base@0.1.3`, `@mosvera/provider-*@0.1.1`, and Phase 6L providers at `0.1.2` |
| Claude Desktop bundle | `mosvera-mcp-0.1.7.mcpb` |
| Schema host | `https://mosvera.io/schema/0.1/*` |

The scope included terminology cleanup, the aesthetic pack exchange schema,
TypeScript and Python runtime parity, MCP import/export/write tools, the
Claude Desktop bundle, public schema hosting, cross-surface smoke tests, and
Phase 6L multi-modal provider package publication.

## What Is Now True

- The spec repository is the canonical contract: schemas, MEPs, glossary,
  conformance vectors, and public examples live here.
- TypeScript and Python runtimes both validate, resolve, compile design
  tokens, persist project registries, and pass the shared conformance suite.
- The MCP bridge can list, resolve, compile, draft, save, delete, export, and
  import named aesthetics from a user-owned local registry.
- Aesthetic packs use the `.mosvera.json` exchange format and carry portable
  registry documents only; they do not carry secrets, credentials, assets,
  remote URLs, provider manifests, or zip contents in v1.
- `mosvera.io` hosts the schemas, links to the public packages, and runs a
  static demonstrator that shows one page switching across the four v1 demo
  aesthetics.
- Phase 6L provider packages add compile/optional-execute adapters for
  Google Gemini/Veo, Runway, ElevenLabs, Adobe Firefly, and Meshy. MCP remains
  compile-only for provider payloads.

## Verification Record

Closeout verification covered:

- Local runtime CI for `mosvera/runtime`, `mosvera/python`, and `mosvera/mcp`.
- GitHub Actions on the current `main` branches for the runtime, Python
  runtime, MCP bridge, and spec repositories.
- Clean npm install/import smoke for `@mosvera/runtime`, all reference
  provider packages, and `@mosvera/mcp`.
- Tiny live provider smoke passed for Google, Runway, ElevenLabs, and Meshy;
  Firefly smoke was skipped because no Firefly credential was present.
- Clean PyPI virtualenv install/import smoke for `mosvera`.
- MCP stdio smoke for tool annotations, read/write/destructive buckets,
  saving deterministic JSON, pack preview/import, read-only mode, and
  structured operational errors.
- Schema endpoint checks for every v0.1 hosted schema `$id`.
- `mosvera.io` link checks for npm, PyPI, GitHub, and the Claude Desktop
  `.mcpb` bundle.
- Redirect checks for `mosvera.com`, `mosvera.org`, and `mosvera.dev` to
  `https://mosvera.io`.

## Remaining Boundaries

This closeout does not make the v0.1 interfaces final. The next useful work is
first-user onboarding and pack-gallery polish: make the first 10 minutes with
Mosvera obvious, collect real feedback, and only then harden the interfaces
toward a broader release.
