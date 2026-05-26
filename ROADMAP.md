<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Mosvera Roadmap

Phased plan for Mosvera's incubation through first public release.
This roadmap is the living revision of the project plan first written
during Phase 0 and updated against the research-grounded decisions
recorded in [`docs/decisions/`](./docs/decisions/).

For the strategic framing this plan implements, see
[`docs/strategy/strategic-plan.md`](./docs/strategy/strategic-plan.md).
For the project's operating doctrines, see
[`CLAUDE.md`](./CLAUDE.md#primary-doctrines).

## Status

Phases 0-5 are **complete** (as of 2026-05-25). Phase 0 established doctrine
and ADRs. Phase 1 defined the v0.1 schema and conformance vector foundation.
Phase 2 shipped the TypeScript reference runtime. Phase 3 shipped the stdio
MCP surface. Phase 4 shipped OpenAI and FLUX provider adapters. Phase 5
shipped the SDXL adapter, ADR-0013, three example systems, three-provider
deterministic emissions, MCP adapter registration, and checked-in gallery
images for all three example systems.

Phase 6 is **complete through Phase 6M**. The public repo split is live, the
TypeScript and Python runtimes are published, provider packages are published,
`@mosvera/mcp@0.1.8` is published, and the `mosvera-mcp-0.1.8.mcpb` Claude
Desktop bundle is attached to the latest MCP release. Phase 6L expanded the
provider layer beyond still images with Google, Runway, ElevenLabs, Adobe
Firefly, and Meshy provider packages. Phase 6M reconciled the public package,
deployment, and roadmap surface after that release.

Current verification: runtime, Python runtime, providers, and MCP pass their
strict local suites; MCP GitHub Actions is green; npm clean install/import
passes for the runtime, providers, and MCP; live provider smoke passed for
Google, Runway, ElevenLabs, and Meshy, with Firefly skipped until credentials
exist. `@mosvera/provider-heygen@0.1.1` is published and installable.

## Phases

### Phase 0a — Doctrine and Research (complete)

Locked the operating constitution and produced the research-grounded
decisions that gate every structural choice.

Outputs:
- `CLAUDE.md` with the five Primary Doctrines at the top
- Eight ADRs in `docs/decisions/` (0001–0008)
- Gitignored private working layer under `.local/`

### Phase 0b — Foundation deliverables (complete)

Scaffolding the repository per [ADR-0002](./docs/decisions/0002-top-level-repository-layout.md)
and standing up the governance, license, and contribution surface per
[ADR-0001](./docs/decisions/0001-license-choice.md) and
[ADR-0004](./docs/decisions/0004-governance.md).

Outputs:
- `MANIFESTO.md`, `ROADMAP.md`, `GLOSSARY.md`, `README.md` at root
- `LICENSE` (Apache-2.0) + `LICENSES/` dual-license texts (Apache-2.0,
  CC-BY-4.0) per REUSE convention
- `CONTRIBUTING.md`, `GOVERNANCE.md`, `MAINTAINERS.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`
- Scaffold directories with stub READMEs: `spec/`, `runtime/`, `mcp/`,
  `providers/`, `examples/`, `docs/`
- `spec/meps/` with the MEP template and process README per
  [ADR-0003](./docs/decisions/0003-rfc-and-proposal-format.md)

### Phase 1 — Specification Genesis (complete)

The specification is Mosvera's long-term center of gravity. Phase 1
defines the primitives, the inheritance and composition semantics,
and the provider compilation contract — before any reference runtime
locks behavior.

Outputs in `spec/`:
- `spec/specification/draft/` — prose specification, language-agnostic
  per [Doctrine 3](./CLAUDE.md#3-spec-neutrality)
- `spec/schemas/` — first JSON Schemas, snake_case wire format per
  [ADR-0005](./docs/decisions/0005-schema-naming-conventions.md):
  - `aesthetic-template.schema.json`
  - `palette.schema.json`
  - `modifier.schema.json`
  - `composition.schema.json`
- `spec/meps/` — initial MEPs covering composition semantics,
  inheritance rules, and the provider compilation contract
- `spec/compliance/` — conformance test vectors in JSON, runnable
  against any conforming runtime (foundation for the cross-language
  portability requirement in [ADR-0007](./docs/decisions/0007-reference-runtime-language.md))
- `spec/examples/` — one worked aesthetic system expressed entirely
  in schema form, with no runtime dependency

Specification must validate against itself (meta-schema check). DTCG
compatibility at color-token export boundary is a target, per
[ADR-0006](./docs/decisions/0006-prior-art-survey.md).

### Phase 2 — Reference Runtime (TypeScript) (complete)

Smallest runtime that exercises the Phase 1 spec end-to-end: parse,
resolve inheritance, merge modifiers, compose primitives, validate
structures. No providers yet.

Outputs in `runtime/`:
- `runtime/src/parser` — load and validate spec documents
- `runtime/src/resolver` — walk inheritance chains, detect cycles
- `runtime/src/merger` — modifier merge semantics per MEP
- `runtime/src/composer` — produce a canonical composition object
- `runtime/src/validator` — runtime-level structural validation
- Test coverage on inheritance, merge, cycle detection, validation
- Implementation passes the Phase 1 conformance suite

Architectural constraint from [ADR-0007](./docs/decisions/0007-reference-runtime-language.md):
semantic logic stays as pure functions, separable from TS-idiomatic
glue, so the Python port is a translation rather than a rewrite. No
clever TS-only patterns in the semantic core.

### Phase 3 — MCP Prototype Surface (complete)

Expose Phase 2 runtime capabilities as a strict MCP server. Aligns
Mosvera with AI-native orchestration from day one.

Outputs in `mcp/`:
- `mcp/src/server` — MCP server skeleton (TS SDK), shares types with
  `runtime/`
- Tool surface, each with strict JSON schemas and clear errors:
  - `list_templates`
  - `resolve_composition`
  - `compile_generation`
  - `get_palette`
  - `validate_schema`
- stdio transport first; HTTP/SSE deferred until external integrators
  ask
- `mcp/examples/` — sample client calls demonstrating each tool

### Phase 4 — Provider Adapters (complete)

Two adapters from the start to prove the abstraction is real. Same
composition object → two genuinely different execution surfaces.
Specifies the pairing locked in
[ADR-0008](./docs/decisions/0008-provider-adapter-pairing.md).

Outputs in `providers/`:
- `providers/_base/` — shared adapter contract, lowering-table schema,
  pure clause assembly engine, and optional `BaseAdapter`
- `providers/openai/` — `gpt-image-1` adapter (sync SDK call, enum-coded
  quality, `size`, `moderation`)
- `providers/flux/` — `flux-2-pro` adapter via the BFL hosted API
  (async polling, computed `width`/`height`, `safety_tolerance`; hosted
  `pro` exposes no quality knob)
- Compiler contract handles the divergence axes the two providers
  surface: sync vs async transport, enum vs unsupported quality,
  divergent moderation models, different image-input semantics
- Snapshot-tested deterministic emission, cross-adapter structural tests,
  and language-neutral emission vectors under `spec/compliance/emission/`
- MCP `compile_generation` supports `emit: true` when a provider adapter is
  registered, returning the emitted payload/prompt/warnings/provenance without
  making a provider HTTP call; the reference MCP server registered OpenAI and
  FLUX by default in Phase 4 and adds SDXL in Phase 5
- `examples/cinematic-editorial/` documents the shared prompt and emitted
  payload metadata; `generated/openai.png` and `generated/flux.png` provide
  the first side-by-side generated image pair

### Phase 5 — Examples + Open-weights Adapter

Adoption happens through worked examples. Each example must
demonstrate composition + portability across the reference image adapters.
Adds the open-weights axis via SDXL.

Outputs in `examples/` and `providers/`:
- `examples/cinematic-editorial/` — checked-in OpenAI, FLUX, and SDXL images
- `examples/dashboard-minimalism/` — deterministic OpenAI, FLUX, and SDXL
  emissions and checked-in generated images
- `examples/documentary-realism/` — deterministic OpenAI, FLUX, and SDXL
  emissions and checked-in generated images
- Each example: a Mosvera composition file, a README explaining the
  aesthetic intent, and rendered outputs from at least two providers
  showing the abstraction holds
- `providers/sdxl/` — SDXL via Replicate, the first open-weights /
  aggregator adapter (per ADR-0008 staging), with the surface decision
  recorded in ADR-0013

### Phase 6 — Public Unlock (complete through Phase 6M)

Triggered now that Phases 1-5 are durable enough to expose. The strategic
plan's Phase 2/3 sequence.

Outputs:
- Namespace acquisition: `github.com/mosvera` exists; `mosvera.io` is live;
  `mosvera.com`, `mosvera.org`, and `mosvera.dev` redirect to `.io`
- Manifesto publication on a separate public surface ("Infrastructure-
  as-Style")
- Transfer this repo (or split) into `github.com/mosvera/spec` first
  as the public flagship
- `runtime`, `mcp`, `providers`, `examples` follow as separate repos
  per the eventual split signaled in ADR-0002
- Publish `@mosvera/runtime`, `@mosvera/mcp`, `@mosvera/provider-base`,
  `@mosvera/provider-openai`, `@mosvera/provider-flux`,
  `@mosvera/provider-sdxl`, `@mosvera/provider-heygen`,
  `@mosvera/provider-google`,
  `@mosvera/provider-runway`, `@mosvera/provider-elevenlabs`,
  `@mosvera/provider-firefly`, and `@mosvera/provider-meshy` to npm as
  installable JavaScript packages; ship a `.mcpb` desktop bundle for
  non-command-line Claude Desktop users
- Open MEP process — `spec/meps/` becomes externally contributable
- Governance transition: BDFL → small Technical Committee per
  [ADR-0004](./docs/decisions/0004-governance.md)
- Foundation evaluation begins (CNCF / Linux Foundation / Joint
  Development Foundation candidates), gated on having at least one
  external provider implementation in production

### Phase 7 — First External Implementer Feedback

The Python runtime port originally planned for a later phase shipped early as
`mosvera@0.1.2`, alongside `@mosvera/runtime`. The next phase is no longer a
language-port milestone; it is a feedback and hardening loop around first
external users.

Outputs:
- collect first-user friction from Claude Desktop, npm/MCP, TypeScript, and
  Python quickstart paths
- tighten MCP result text where structured tool output is not visible enough in
  real clients
- decide whether HTTP/SSE transport is justified by an external integration
  request
- graduate any common provider concepts discovered in Phase 6L into MEPs

### Phase 8 — Motion Surface MEPs

Runway now exists as a provider adapter, but the language-neutral spec still
needs to decide which motion and temporal concepts belong in Mosvera itself.
Phase 8 is the MEP work that separates provider-specific video options from
portable motion primitives.

## What this roadmap does not promise

Per [Doctrine 1](./CLAUDE.md#1-public-first), no aspirational
marketing. The roadmap states what's planned, not what's claimed.

- No timeline commitments. Phases ship when their criteria are met.
- No multi-language SDKs claimed before they exist. The Python runtime now
  exists and is documented; future runtime ports should follow the same rule.
- No foundation hosting claimed before it is signed.
- No provider adapters claimed before they ship.

## Living document

This roadmap is revised in place as decisions evolve. The chronological
record of changes lives in [`CHANGELOG.md`](./CHANGELOG.md). The full
research-grounded decision history lives in
[`docs/decisions/`](./docs/decisions/).
