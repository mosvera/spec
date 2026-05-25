<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Changelog

All notable changes to Mosvera are documented here. The format follows
[Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), and
this project will adhere to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html)
once it ships its first release.

For deeper context on architectural changes, see
[`docs/decisions/`](./docs/decisions/). For specification changes
once Phase 1 ships, see [`spec/meps/`](./meps/).

## [Unreleased]

### Added

- **Phase 6 — Public Unlock (package and contribution prep).** Prepared the
  local repository for public publication:
  - Public npm packages now build to `dist/` with JavaScript, source maps, and
    declaration files. Package manifests include repository metadata, keywords,
    public publish config, Node engine constraints, and `prepublishOnly`
    verification.
  - `@mosvera/runtime` bundles the canonical schemas into its published
    artifact so `createValidator()` and `deriveStrategies()` work outside the
    monorepo.
  - `@mosvera/mcp` exposes a built `mosvera-mcp` binary and bundles the
    `cinematic-editorial` registry as its default example for published use.
  - Added GitHub Actions for CI and manual npm publication, plus issue
    templates for bugs, documentation, MEP proposals, and provider requests.
  - Updated the canonical public domain to `mosvera.io` per
    [ADR-0014](./docs/decisions/0014-canonical-public-domain.md); v0.1 schema
    `$id`, `$schema`, and `$ref` values now use
    `https://mosvera.io/schema/0.1/...`.
  - Updated the public MEP submission process, security policy, and
    contributing guidance for the Phase 6 public-unlock path.

- **Phase 5 — Examples + Open-weights Adapter (implementation tranche).**
  Added the SDXL Replicate adapter and expanded the example corpus:
  - `@mosvera/provider-sdxl` emits deterministic `sdxl-replicate` payloads,
    executes through the official Replicate JavaScript client when
    `REPLICATE_API_TOKEN` is present, and keeps negative prompt, scheduler,
    seed, and refiner settings as adapter configuration per
    [ADR-0013](./docs/decisions/0013-sdxl-adapter-surface.md).
  - Added SDXL emission snapshots, two SDXL language-neutral emission vectors,
    and three-way cross-adapter structural tests for OpenAI, FLUX, and SDXL.
  - The reference MCP server now registers `sdxl-replicate` for
    `compile_generation` with `emit: true`.
  - Added `dashboard-minimalism` and `documentary-realism` worked systems
    under [`spec/examples/`](./examples/) plus gallery metadata under
    [`examples/`](./examples/). Both compile, emit, and generate through all
    three adapters.
  - Updated the cinematic-editorial gallery with the SDXL payload and generated
    SDXL image. Phase 5 now has OpenAI, FLUX, and SDXL gallery images for all
    three worked examples.

- **Phase 4 — Provider Adapters (implementation landed).** Added the
  reference provider adapter stack under [`providers/`](./providers/):
  - `@mosvera/provider-base` defines the Phase 4 adapter contract, lowering
    table schema, pure clause assembly engine, provenance, `EmissionError`,
    and optional `BaseAdapter`.
  - `@mosvera/provider-openai` emits deterministic `gpt-image-1` payloads and
    includes a manual `OPENAI_API_KEY` execution script.
  - `@mosvera/provider-flux` emits deterministic BFL `flux-2-pro` payloads,
    implements async polling execution with plain `fetch`, and treats
    `quality` as `unsupported` because hosted `flux-2-pro` exposes no
    quality knob. A Replicate-backed manual gallery runner is included for
    environments with `REPLICATE_API_TOKEN` but no direct `BFL_API_KEY`.
  - Added emission snapshots, assembler tests, cross-adapter structural tests,
    and language-neutral vectors in [`spec/compliance/emission/`](./compliance/emission/).
  - `compile_generation` now accepts `emit: true` when the MCP context has an
    adapter registry, returning payload, prompt, warnings, and provenance
    without making a provider HTTP call. The reference MCP server registers
    the Phase 4 OpenAI and FLUX adapters by default.
  - The `cinematic-editorial` example now carries image-generation fields and
    [`examples/cinematic-editorial/generated/metadata.json`](./examples/cinematic-editorial/generated/metadata.json)
    records the deterministic OpenAI and FLUX payloads. The first generated
    side-by-side image pair is checked in as `openai.png` and `flux.png`.

- **Phase 3 — MCP Surface (complete).** The `@mosvera/mcp` package
  ([`mcp/`](./mcp/)) exposes the Phase 2 runtime as a stdio MCP server
  via the TypeScript MCP SDK. It shares types with `@mosvera/runtime`
  through the npm workspace root (`package.json`), so both packages
  operate against a single set of schema and runtime types without
  duplication. Five tools, each with strict JSON Schema input definitions
  and clear structured errors:
  - `list_templates` — enumerate templates in the loaded registry.
  - `resolve_composition` — walk the inheritance chain and produce the
    resolved canonical model.
  - `get_palette` — retrieve a palette document from the registry.
  - `validate_schema` — validate an arbitrary document against a named
    Mosvera schema.
  - `compile_generation` — apply the MEP-0003 criticality × lowering-action
    rule engine against a supplied capability manifest and return the
    compilation decision (contract pass, structured warnings, or hard error)
    plus the canonical model. Makes **no** provider HTTP call; the
    Phase-4/provider boundary is respected (compilation is deterministic;
    generation is not).
  - **Merge-strategy resolution.** A new `deriveStrategies` runtime helper
    derives per-field merge strategies from `x-mosvera-merge` schema
    annotations. The MCP layer composes a three-layer strategy model:
    schema defaults ⊕ project-level `merge-strategies.json` ⊕ per-call
    inline overrides. The precedence order matches MEP-0001 intent.
  - **Filesystem registry loader + inline override.** On startup the server
    loads an aesthetic-system project directory (default:
    `spec/examples/cinematic-editorial/`) with on-load schema validation,
    so every tool call operates against a pre-validated registry. Tools also
    accept an inline `registry` argument merged per-collection by `id`,
    supporting ephemeral overrides without touching the filesystem state.
  - **`unknown_reference` pre-flight.** A registry-level pre-flight check
    emits a clear `unknown_reference` error before any resolution attempt
    when a reference target is absent. This is a MCP-layer guard only; the
    runtime's normative error set (the 21 conformance vectors) is untouched
    — no new conformance vectors are introduced.
  - **`cinematic-editorial` worked example.** `spec/examples/cinematic-editorial/`
    ships a complete aesthetic system: a base template and a
    noir-extends-base template, golden-hour and high-contrast modifiers, a
    palette, a full composition, `merge-strategies.json`, and an illustrative
    capability manifest. This also closes the Phase-1 "one worked aesthetic
    system in `spec/examples/`" gap that was deferred when Phase 1 shipped.
  - **Docs: MEP-0004 + ADR-0011.**
    [MEP-0004](./meps/0004-mcp-tool-contract.md) (MCP Tool Contract,
    status Draft/Provisional) specifies the normative contract for each tool.
    [ADR-0011](./docs/decisions/0011-mcp-surface-design.md) records the
    design decisions for the MCP surface (stdio-first, HTTP/SSE deferred,
    inline-override pattern, pre-flight guard placement). stdio transport is
    first; HTTP/SSE is deferred until external integrators request it.
  - **Test totals: 74, all green.** Runtime: **38** tests (including all 21
    conformance vectors). MCP: **36** tests. Both packages typecheck clean
    under strict TypeScript.

- **Namespace secured + schema `$id`s rooted at the domain.** Registered
  `mosvera.com`, `mosvera.io`, `mosvera.org` — `mosvera.io` is the
  canonical home. Schema `$id`s switched from interim URNs
  (`urn:mosvera:schema:0.1:*`) to https rooted at the domain
  (`https://mosvera.io/schema/0.1/*`), the comparable-class convention,
  now that a domain is owned. Clean prefix substitution across the six
  primitive schemas, the conformance vector meta-schema, and the runtime
  validator; re-verified (schemas meta-valid, cross-refs resolve in both
  ajv and Python jsonschema, 36 runtime tests green). Recorded in
  [ADR-0010](./docs/decisions/0010-schema-id-scheme.md).

- **Phase 2 — Reference runtime (in progress).** The TypeScript reference
  runtime ([`runtime/`](./runtime/)), per
  [ADR-0007](./docs/decisions/0007-reference-runtime-language.md). A pure,
  zero-runtime-dependency semantic core: `merge` (the MEP-0001 algebra —
  deep merge, `replace`/`append`/`merge_by` list strategies, `$unset`/
  `$revert`), `resolve` (MEP-0002 single-inheritance chains + cycle
  detection), `compose` (the precedence-chain fold), and `compile` (the
  MEP-0003 criticality × lowering-action rule engine). A conformance runner
  loads every vector from [`spec/compliance/`](./compliance/) and the
  runtime **passes all 21**, under a strict TypeScript typecheck. This is
  independent cross-implementation agreement: the TS runtime reproduces the
  same canonical models and compilation outcomes that the reference oracle
  produced during vector authoring — the ADR-0007 cross-language contract.
  Tooling: TypeScript + vitest; semantic core has no runtime dependencies so
  the committed Python port is a translation.
  - **Parser + validator boundary modules.** `parse` (JSON/YAML/object →
    document, binds `yaml`) and `createValidator` (validates documents
    against the canonical [`spec/schemas/`](./schemas/) via `ajv`
    2020-12). These are boundary bindings, deliberately outside the
    zero-dependency semantic core — each language port swaps in its native
    JSON Schema validator. The validator agrees with `ajv` on every ADR-0005
    enforcement case that Python `jsonschema` rejected during schema
    authoring (cross-validator agreement). 15 added unit tests; 36 total
    runtime tests green under strict typecheck.


- **Phase 1 — Specification Genesis (in progress).** Specification
  proposals:
  - [MEP-0001: Composition Semantics](./meps/0001-composition-semantics.md)
    — defines the core merge algebra (deep-merge object model, schema-declared
    keyed list merging via `merge_by`, `$unset`/`$revert` directives), the
    total precedence chain (base → ordered modifiers → inline overrides),
    mandatory DAG/cycle detection for references, and the determinism +
    legibility guarantees. Grounded in a cited survey of CSS cascade, JSON
    Merge Patch (RFC 7396), JSON Patch (RFC 6902), Kubernetes Strategic Merge
    Patch, DTCG, Tailwind, Sass, and Terraform. Status: provisional.
  - [MEP-0002: Inheritance Rules](./meps/0002-inheritance-rules.md)
    — defines the `$extends` mechanism as **single inheritance** (one parent),
    resolved as a linear ancestor chain folded with MEP-0001's `merge` (child
    wins). Extends cycle detection to the inheritance graph. Unifies
    inheritance + composition into one total precedence order
    (`ancestors → self → modifiers → overrides`). Multiple inheritance + C3
    linearization reserved as a gated future possibility. Grounded in a cited
    survey of C3/Python MRO, Jinja2/Twig/JS prototype chains, Scala/Ruby/PHP
    traits, JSON Schema `allOf`, CUE unification, Dhall, and the
    composition-over-inheritance doctrine. Status: provisional.
  - [MEP-0003: Provider Compilation Contract](./meps/0003-provider-compilation-contract.md)
    — defines how the canonical model compiles to provider payloads. Each
    adapter ships a machine-readable **capability manifest** declaring a
    **lowering action** per construct (`native` / `approximate` / `emulate` /
    `unsupported`); every canonical construct carries a **criticality**
    (`required` / `optional`). Compilation rule: `required` + `unsupported`
    → hard error before any provider call; everything lossy → compile +
    structured warning; **loss is never silent**. Determinism boundary at the
    payload-emission line (compilation deterministic; generation not).
    Provenance map traces payload fields back to canonical constructs. Worked
    example: one composition compiling to both OpenAI gpt-image-1 and FLUX.2-pro
    per ADR-0008. Grounded in a cited survey of LLVM, glTF, Terraform,
    OpenTelemetry, Style Dictionary, Pandoc, and SQLAlchemy. Status: provisional.

    **The three foundational MEPs (0001–0003) now define the complete semantic
    model:** aesthetic intent composes, inherits, and compiles to provider-ready
    requests.
  - **Conformance suite** in [`spec/compliance/`](./compliance/): 21
    language-agnostic JSON vectors (+ `vector.schema.json` meta-schema)
    covering the normative behaviors of all three foundational MEPs —
    deep/scalar/type-mismatch merge, the three list strategies,
    `$unset`/`$revert`, the precedence chain, single inheritance,
    multi-level chains, the inheritance/composition seam, `$revert` and
    `merge_by` across the inheritance boundary, inheritance-cycle and
    multiple-inheritance rejection, and the full compilation
    criticality × lowering-action rule table. Each vector verified during
    authoring against an independent reference oracle, the vector
    meta-schema, and the Mosvera primitive schemas. This is the
    cross-language correctness contract ADR-0007 requires; the Phase 2
    runtime will be the first implementation checked against it.
  - **v0.1 JSON Schemas** in [`spec/schemas/`](./schemas/) encoding the
    three MEPs + ADR-0005 naming: `common` (shared `$defs`), `composition`,
    `template`, `modifier`, `palette`, and `capability-manifest`. JSON Schema
    2020-12 dialect, URN-style `$id`s, snake_case enforcement, `$`-directives
    (`$extends`/`$unset`/`$revert`) permitted and unknown `$`-keys rejected.
    The aesthetic vocabulary is left open at v0.1 by design. All six validate
    against the 2020-12 meta-schema; verified with positive/negative document
    tests (valid composition accepted; hyphenated/uppercase/unknown-directive/
    missing-required documents rejected; capability manifest requires a `note`
    on `approximate`/`emulate` mappings).

- **Project named: Mosvera.** The project was renamed from its original
  working name "Tessera" to **Mosvera**, selected through a full
  brand-availability process (web search for commercial collisions +
  domains + GitHub org + npm scope + social handles). "Tessera" was
  unusable for an open standard — every relevant domain and the GitHub
  org were taken and the word is a brand across many industries.
  "Mosvera" is clean across `.com`/`.io`/`.dev`/`.org`, the GitHub org,
  the npm scope, and Bluesky, with no commercial brand collision. The
  rename touched the whole repo: prose, schema `$id` URNs
  (`urn:tessera:` → `urn:mosvera:`), and the enhancement-proposal series
  (**TEP → MEP**, `spec/teps/` → `spec/meps/`, vector field `tep` →
  `mep`). The project remains in quiet incubation; only the name is now
  settled. Recorded in
  [ADR-0009](./docs/decisions/0009-project-name-selection.md), which also
  documents the methodology lesson: run the full availability process
  before building on a name, not a domain DNS lookup after the fact.

- **Phase 0b — Foundation deliverables.** Standing up the repository
  per [ADR-0002](./docs/decisions/0002-top-level-repository-layout.md):
  - Root-level `MANIFESTO.md`, `ROADMAP.md`, `GLOSSARY.md`, `README.md`.
  - Root-level governance files: `GOVERNANCE.md`, `CONTRIBUTING.md`,
    `MAINTAINERS.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1),
    `SECURITY.md`, `CHANGELOG.md`.
  - Dual licensing per [ADR-0001](./docs/decisions/0001-license-choice.md):
    root `LICENSE` (Apache-2.0), and `LICENSES/` directory with the
    full Apache-2.0 and CC-BY-4.0 texts per REUSE convention.
  - Scaffold directories with stub READMEs: `spec/`, `spec/meps/`,
    `spec/schemas/`, `spec/specification/`, `spec/compliance/`,
    `runtime/`, `mcp/`, `providers/`, `examples/`, `docs/`,
    `docs/guides/`, `docs/strategy/`.
  - Strategic plan relocated from repo root to
    `docs/strategy/strategic-plan.md`.

- **Phase 0a — Doctrine + research deposit.** Eight Architecture
  Decision Records under [`docs/decisions/`](./docs/decisions/)
  validating every structural choice with at least three
  authoritative sources each:
  - [ADR-0001](./docs/decisions/0001-license-choice.md) — License
    choice (Apache-2.0 + CC-BY-4.0).
  - [ADR-0002](./docs/decisions/0002-top-level-repository-layout.md)
    — Top-level repository layout.
  - [ADR-0003](./docs/decisions/0003-rfc-and-proposal-format.md) —
    RFC / specification proposal format (MEPs + ADRs).
  - [ADR-0004](./docs/decisions/0004-governance.md) — Pre-public
    and first-release governance.
  - [ADR-0005](./docs/decisions/0005-schema-naming-conventions.md)
    — Schema field naming conventions (snake_case).
  - [ADR-0006](./docs/decisions/0006-prior-art-survey.md) — Prior
    art survey.
  - [ADR-0007](./docs/decisions/0007-reference-runtime-language.md)
    — Reference runtime language (TypeScript first, Python
    committed).
  - [ADR-0008](./docs/decisions/0008-provider-adapter-pairing.md)
    — Phase 4 provider adapter pairing (OpenAI + FLUX.2-pro).

- **Five Primary Doctrines** at the top of [`CLAUDE.md`](./CLAUDE.md):
  Public-first, Adoption-over-convenience, Spec-neutrality,
  Comparable-class framing, Research-first.

- **Private working-layer convention.** `.local/` added to
  `.gitignore` to give contributors a gitignored space for
  per-contributor notes and personal-tooling integrations that must
  not reach the public repo.

- **Initial commit.** Strategic ecosystem plan and agent guidance.

---

The `[Unreleased]` section captures work since the most recent
release tag. Once Mosvera ships its first release, entries will
graduate into dated, semver-tagged sections.
