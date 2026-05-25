# ADR-0002: Top-level repository layout

**Status:** Accepted
**Date:** 2026-05-24
**Doctrines invoked:** Public-first, Adoption-over-convenience, Comparable-class framing, Research-first

## Context

Mosvera's strategic plan calls for an eventual split into focused repositories (`/spec`, `/runtime`, `/mcp`, `/providers`, `/examples`) under an organization namespace. While in quiet incubation, all surfaces should live in one repository to enable fast, coordinated iteration on the abstraction. The layout chosen now must (a) be legible to a stranger landing on the repo for the first time, (b) match conventions of comparable open-standard projects so contributors arrive with the right mental model, and (c) decompose cleanly into separate repositories when the split happens — no rename churn, no path rewrites, no contributor confusion.

The provisional layout is `spec/ runtime/ mcp/ providers/ examples/ docs/`. This ADR validates that against research and adds the supporting structures the comparable class consistently uses.

## Research

**The comparable class consistently separates specification from implementation.** Three patterns recur:

- **CloudEvents/spec** (CNCF): top-level folders `cloudevents/`, `subscriptions/`, `cesql/`, `docs/`, `tools/`. Within `cloudevents/`: `spec.md` (core), `bindings/` (protocol bindings: HTTP, Kafka, MQTT, AMQP, NATS, WebSockets), `formats/` (JSON, Avro, Protobuf), `working-drafts/`. SDKs live in **separate repositories per language** under the same GitHub org.
- **OpenTelemetry-specification**: top-level `specification/` (normative spec text), `schemas/` (versioned schema definitions), `oteps/` (OpenTelemetry Enhancement Proposals — the RFC mechanism), `spec-compliance-matrix/`, `supplementary-guidelines/`. SDKs, collector, contrib, proto, semantic-conventions, operator, demo all in **separate repositories**.
- **AsyncAPI/spec**: top-level `spec/` (the spec.md source of truth), `examples/`, `assets/`, `scripts/`. JSON Schemas live in a **separate `spec-json-schemas` repo**.
- **OpenAPI-Specification**: top-level `versions/` (markdown sources per version), `proposals/`, `tests/`, `scripts/`, plus root-level governance files (`GOVERNANCE.md`, `EDITORS.md`, `IMPLEMENTATIONS.md`, `CONTRIBUTING.md`).
- **GraphQL/graphql-spec**: top-level `spec/`, `changelogs/`, `assets/`, `signed-agreements/`. Reference impls (graphql-js, Relay) live in **separate repos** in the same org.

**Universal patterns across all five:**

1. The normative specification lives in its own directory, not at the repo root. None of them have `spec.md` at the root.
2. Machine-readable schemas (JSON Schema, Protobuf, type definitions) are a first-class peer of the prose spec.
3. There is an explicit folder for enhancement proposals / RFCs (OTEPs, proposals/, working-drafts/).
4. Root-level governance files: `CONTRIBUTING.md`, `GOVERNANCE.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
5. **Reference implementations live in separate repositories from day one** for every project that has reached graduation/maturity. Spec-and-impl monorepos are an incubation-only pattern.

**OpenTelemetry-collector** is the model for an implementation that has internal pluggability matching what Mosvera's runtime+providers need: a multi-module Go repository with top-level `receiver/`, `processor/`, `exporter/`, `extension/`, `connector/` directories, plus a sibling `opentelemetry-collector-contrib` repository for community/third-party components. The core/contrib split is how the project enforces a small, stable core surface while letting the long tail of integrations move independently. Mosvera's `providers/` will hit the same dynamic: a small set of reference providers in core, an open-ended set of third-party providers eventually living in a `providers-contrib` companion repo.

**ADR/decision-record convention.** The dominant pattern is `docs/adr/` or `docs/decisions/`. Some teams favor "decisions" over "adr" because the directory naturally accretes non-architecture decisions (vendor, scheduling, naming) and the broader name invites broader use. ADRs are numbered monotonically (`0001-`, `0002-`), lowercase-dashed, present-tense imperative titles, Markdown. MADR (`adr.github.io/madr`) and Joel Parker Henderson's templates are the most cited references.

**Monorepo-to-multirepo transition.** The path that minimizes churn:

- Use directory names that match the eventual repo names. `spec/` becomes `mosvera-spec`, `runtime/` becomes `mosvera-runtime`, etc. Reverse is messy.
- Keep each surface self-contained: its own README, CHANGELOG, examples within `examples/` keyed by surface.
- Don't create cross-surface imports the runtime can't satisfy after a split (the runtime can read schemas from `spec/`, but should consume them via a published package once split, not via relative paths).
- Governance and decision records stay at the root throughout incubation and follow whichever repository becomes the "meta" repo at split time (typically the spec or a dedicated community/governance repo, following the CNCF and AsyncAPI pattern).

## Decision

Adopt this top-level layout:

```text
mosvera/
├── README.md                    # what Mosvera is, status, links to each surface
├── MANIFESTO.md                 # the why; the abstraction being defined
├── ROADMAP.md                   # phased plan; current status
├── GLOSSARY.md                  # canonical terms used across spec + runtime + providers
├── CONTRIBUTING.md
├── GOVERNANCE.md                # decision process during incubation
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── MAINTAINERS.md
├── CHANGELOG.md
├── LICENSE                      # Apache-2.0 (see ADR-0001)
├── LICENSES/                    # full Apache-2.0 + CC-BY-4.0 text per REUSE convention
│   ├── Apache-2.0.txt
│   └── CC-BY-4.0.txt
├── spec/                        # normative specification
│   ├── README.md
│   ├── specification/           # prose spec, versioned
│   │   ├── 0.1/
│   │   └── draft/
│   ├── schemas/                 # JSON Schema definitions (normative, machine-readable)
│   ├── teps/                    # Mosvera Enhancement Proposals (see ADR-0003)
│   │   ├── README.md            # MEP process
│   │   └── 0000-template.md
│   └── compliance/              # conformance matrix + test vectors
├── runtime/                     # reference runtime (parse, resolve, merge, compose, validate, compile)
│   ├── README.md
│   ├── src/
│   ├── tests/
│   └── examples/                # runtime-scoped examples
├── mcp/                         # MCP server exposing runtime tools
│   ├── README.md
│   ├── src/
│   └── tests/
├── providers/                   # reference provider adapters (in-tree, core set only)
│   ├── README.md                # provider contract, how to write one
│   └── <provider-name>/         # each provider self-contained
├── examples/                    # end-to-end examples spanning spec + runtime + providers
│   ├── README.md
│   └── <example-name>/
├── docs/                        # narrative docs, guides, design notes
│   ├── README.md
│   ├── decisions/               # ADRs — numbered, monotonic, lowercase-dashed
│   │   ├── README.md            # ADR process + index
│   │   ├── 0000-template.md
│   │   ├── 0001-license-choice.md
│   │   └── 0002-top-level-repository-layout.md
│   └── guides/                  # how-tos, concept guides
└── .github/                     # workflows, issue/PR templates, CODEOWNERS
```

**Specific choices and their rationale:**

- **`spec/` not `specification/` at root.** Three of five comparable projects use a short top-level name (`spec/`, `cloudevents/`); only OpenTelemetry uses the long form, and only because their repo is dedicated solely to the spec. For a multi-surface monorepo, `spec/` matches CloudEvents and AsyncAPI precedent and reads cleanly.
- **`spec/meps/` named "MEPs" (Mosvera Enhancement Proposals).** See [ADR-0003](./0003-rfc-and-proposal-format.md) for the rationale — modeled on OpenTelemetry's OTEPs, which in turn borrowed from Rust RFCs and Kubernetes KEPs. The directory name follows OTEP precedent (`oteps/` → `teps/`).
- **`spec/schemas/` as a first-class peer of prose.** Every comparable project either does this in-repo (OpenTelemetry) or splits schemas to a sibling repo (AsyncAPI's `spec-json-schemas`). In-repo at incubation; can split later without renaming.
- **`docs/decisions/` not `docs/adr/`.** Following the documented preference for the broader name. ADR-style format inside, but the folder accommodates non-architecture decisions (naming, governance, vendor) as the project grows.
- **`providers/` in-tree at incubation; reserve `mosvera-providers-contrib` for later.** Direct analog to opentelemetry-collector + opentelemetry-collector-contrib. Core providers ship with the runtime; long-tail community providers move to a contrib repo once the contract stabilizes.
- **`MANIFESTO.md`, `ROADMAP.md`, `GLOSSARY.md` at the root.** A stranger landing on the repo should reach the "what is this and why" in one hop. The glossary at root signals that terminology discipline is a first-class concern.
- **Directory names match anticipated repo names.** At split time: `mosvera-spec`, `mosvera-runtime`, `mosvera-mcp`, `mosvera-providers`, `mosvera-examples`, `mosvera-docs`. No directory renaming required — only relocation.

The provisional layout (`spec/ runtime/ mcp/ providers/ examples/ docs/`) is **validated** and adopted with the additions above (root governance files, `LICENSES/` directory, internal structure within `spec/` and `docs/`).

## Consequences

**Enables:**
- A new contributor can land on the repo and locate any surface in one directory hop. The structure is legible without a tour.
- Each surface (`spec/`, `runtime/`, `mcp/`, `providers/`) has its own README and can be extracted to its own repository by `git filter-repo` without path renames or import rewrites.
- Schemas and MEPs are first-class, signaling that the spec is not just prose.
- The ADR folder is in place from commit one, enabling the documentary-style decision record the project's tone policy already requires.
- The core/contrib split is pre-baked: providers in-tree are the reference/core set; future third-party providers go to a contrib repo without disturbing the canonical layout.

**Precludes:**
- A flat root with `spec.md`, `runtime.py`, etc. No comparable project does this; it doesn't scale past a single contributor.
- A `src/` at the root containing all code. Comparable projects scope `src/` to the surface (`runtime/src/`, `mcp/src/`), which makes the multi-language future (Python runtime + TypeScript MCP + Rust provider adapter, etc.) tractable.
- Mixing examples across surfaces in a single `examples/` without internal structure. End-to-end examples go in root `examples/`; surface-specific examples nest under that surface.

**Tradeoffs accepted:**
- More top-level directories than a typical app repo. This is correct for a multi-surface standards project and matches the comparable class.
- Some duplication during incubation (each surface has its own README, CHANGELOG). This is the cost of preparing for clean repo extraction; the alternative — a single sprawling README — produces painful merges and rewrites at split time.
- The runtime in incubation reads schemas via relative paths from `spec/schemas/`. At split time this must become a published-package dependency. Acceptable; flagged here so the future migration is intentional.

## Sources

1. [CloudEvents specification repository](https://github.com/cloudevents/spec) — Top-level structure (`cloudevents/`, `subscriptions/`, `cesql/`, `docs/`, `tools/`); bindings and formats as peers under the core spec folder; SDKs in separate repos.
2. [OpenTelemetry Specification repository](https://github.com/open-telemetry/opentelemetry-specification) — `specification/`, `schemas/`, `oteps/`, `spec-compliance-matrix/`, `supplementary-guidelines/`. Direct model for spec/schemas/RFCs/compliance separation.
3. [OpenTelemetry GitHub organization](https://github.com/open-telemetry) — Multi-repo split (spec, proto, collector, collector-contrib, language SDKs, semantic-conventions, operator, demo). Validates spec-monorepo → multi-repo as the maturity trajectory.
4. [AsyncAPI/spec repository](https://github.com/asyncapi/spec) — `spec/asyncapi.md`, `examples/`, `assets/`, `scripts/`; JSON schemas split to sibling `spec-json-schemas` repo. Confirms the schema-as-peer pattern and the eventual split.
5. [OpenAPI-Specification repository](https://github.com/OAI/OpenAPI-Specification) — `versions/`, `proposals/`, `tests/`, plus root-level `GOVERNANCE.md`, `EDITORS.md`, `IMPLEMENTATIONS.md`, `CONTRIBUTING.md`. Source for the governance-file root convention.
6. [OpenTelemetry Collector receiver README](https://github.com/open-telemetry/opentelemetry-collector/blob/main/receiver/README.md) — Core/contrib split (collector vs. collector-contrib) as model for mosvera's providers/ in-tree vs. eventual providers-contrib.
7. [joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record) — ADR templates, numbering convention (monotonic 0001-), lowercase-dashed filenames, present-tense imperative titles.
8. [MADR (Markdown ADR)](https://adr.github.io/madr/) — `docs/adr/` vs. `docs/decisions/` convention discussion; rationale for preferring "decisions" as the broader, more self-documenting name.
9. [npryce/adr-tools](https://github.com/npryce/adr-tools) — De facto tooling for ADR workflows; defaults to `doc/adr` but supports configuration, informing our `docs/decisions/` choice.
10. [GraphQL specification repository](https://github.com/graphql/graphql-spec) — `spec/`, `changelogs/`, `signed-agreements/`; reference impls (graphql-js, Relay) in separate repos. Confirms spec-only repo as the mature-state pattern.
