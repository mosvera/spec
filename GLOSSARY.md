<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Glossary

Canonical terms used across Mosvera's specification, runtime, MCP
surface, and provider adapters. This is `v0.1` — terminology will
firm up as the specification stabilizes through the MEP process. Each
term's definition is grounded against prior art where it exists,
following [Doctrine 5 (Research-first)](./CLAUDE.md#5-research-first).

For the conceptual framing behind these terms, see
[`MANIFESTO.md`](./MANIFESTO.md). For the structural decisions that
shaped the vocabulary, see
[`docs/decisions/`](./docs/decisions/) — especially
[ADR-0005](./docs/decisions/0005-schema-naming-conventions.md)
(naming) and
[ADR-0006](./docs/decisions/0006-prior-art-survey.md) (prior art).

## Do Not Collapse The Terms

Do not flatten Mosvera's language into a single generic word like
"theme" or "style." Those words are useful in product copy when they
match a host application's domain, but the Mosvera contract keeps
distinct layers:

- **Aesthetic** is the user-facing named intent.
- **Composition** is the technical document that resolves that intent.
- **Aesthetic pack** is the portable `.mosvera.json` exchange file.
- **Registry** is the local collection where documents live.
- **Tokens** and provider **payloads** are compiled outputs, not source
  documents.

## A

### Adapter

See [Provider adapter](#provider-adapter).

### Aesthetic

The user-facing named intent a person asks Mosvera to apply, such as
`executive-editorial` or `claymation-playful-builder`. In a registry,
a named aesthetic is usually backed by a
[Composition](#composition) document, but "aesthetic" is the preferred
beginner-facing noun because it names the effect a user wants rather
than the technical document that implements it.

### Aesthetic intent

The semantic meaning behind a generative call, expressed as a
structural model rather than as a free-text prompt. The unit Mosvera
operates on. Aesthetic intent is provider-neutral, language-neutral,
and composable.

### Aesthetic pack

A portable `.mosvera.json` exchange file containing one or more
Mosvera registry documents and an entrypoint named aesthetic. A pack
uses `kind: "mosvera.aesthetic_pack"` and is validated by the
`https://mosvera.io/schema/0.1/aesthetic-pack` schema. V1 packs carry
templates, palettes, modifiers, compositions, and optional merge
strategies only; they do not carry assets, provider manifests,
credentials, remote URLs, or zip-bundled content.

### Aesthetic primitive

A small, well-defined building block of aesthetic intent —
[Template](#template), [Palette](#palette), [Modifier](#modifier),
[Composition](#composition). The primitives are the nouns and verbs
of Mosvera's vocabulary; the specification defines them precisely
enough that two implementations produce the same canonical model from
the same input.

### ADR (Architecture Decision Record)

An immutable, retrospective record of a decision already made about
this repository's architecture, governance, or infrastructure. Format
per Michael Nygard's
[original definition](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html).
ADRs live in [`docs/decisions/`](./docs/decisions/) and are numbered
monotonically. ADRs are **not** the mechanism for proposing changes
to the public specification — that is what [MEPs](#mep) are for. See
[ADR-0003](./docs/decisions/0003-rfc-and-proposal-format.md) for the
two-document distinction.

## C

### Canonical model

The intermediate representation produced by Mosvera's runtime after
parsing a composition, resolving its inheritance chain, and merging
its modifiers. The canonical model is provider-neutral; provider
adapters compile *from* the canonical model into provider-specific
payloads. Conceptually analogous to an AST in a compiler: the source
material has been parsed and normalized, but no target-specific
emission has happened yet.

### Composition

A technical Mosvera document that resolves into a canonical aesthetic
model. A composition document names a base template, optional ordered
modifiers, and optional scoped overrides. It is the document shape
runtimes execute, version, validate, and exchange; for beginner-facing
language, prefer [Aesthetic](#aesthetic) when referring to the named
intent a user selects or asks an agent to apply.

### Compiler / Compilation

The translation from a canonical model into a provider-specific
payload (e.g., an OpenAI `gpt-image-1` request body or a Black Forest
Labs FLUX async polling request). Each provider adapter implements
the compilation contract defined by the
[Provider compilation MEP](./meps/). Conceptually analogous to
[Style Dictionary's transforms](https://github.com/style-dictionary/style-dictionary)
for design tokens, but with generative providers as the output
targets instead of CSS variables — see
[ADR-0006](./docs/decisions/0006-prior-art-survey.md).

### Conformance suite

A directory of language-agnostic JSON test cases (input schema,
expected resolved composition, expected compiled provider payload)
that any conforming runtime must pass. Established in Phase 1 per
[ADR-0007](./docs/decisions/0007-reference-runtime-language.md);
lives in [`spec/compliance/`](./compliance/).

## D

### DCO (Developer Certificate of Origin)

The lightweight contribution-attestation mechanism Mosvera adopted
per [ADR-0004](./docs/decisions/0004-governance.md). Contributors
sign commits with `git commit -s`, certifying they have the right to
contribute the code under the project's license. Adopted in
preference to a CLA to lower contribution friction and align with the
CNCF/Linux Foundation ecosystem norms. Reference:
[developercertificate.org](https://developercertificate.org/).

### DTCG (Design Tokens Community Group)

The W3C Community Group responsible for the
[Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/).
Closest prior art for Mosvera's primitives in the static design-token
lane. Mosvera aims for DTCG compatibility at the color-token export
boundary per
[ADR-0006](./docs/decisions/0006-prior-art-survey.md). Mosvera picks
up where DTCG stops: generative-target compilation, composition
semantics over the primitives, runtime evaluation.

## I

### Inheritance

The mechanism by which a template extends another template, picking
up its primitives and behavior. Resolution rules — how conflicts are
detected, how overrides take precedence, how cycles are prevented —
are defined in the inheritance MEP (Phase 1). Closest analog in
prior art is IBM Carbon's core-tokens / component-tokens / theme-
overrides pattern, which Mosvera's inheritance semantics will be
examined against rather than reinvented.

## M

### MCP (Model Context Protocol)

The Anthropic-defined protocol for AI-native systems to invoke
standardized tools. Mosvera ships an MCP server as a first-class
surface (Phase 3) so agents, editors, and automated pipelines can
call `list_templates`, `resolve_composition`, `compile_generation`,
`get_palette`, and `validate_schema` as tool calls. See the
[MCP specification](https://modelcontextprotocol.io/) for protocol
details.

### Modifier

An adjustment that can be applied to any template or composition — a
"rain-slick" modifier, a "magic-hour" modifier, a "soft-focus"
modifier. Modifiers merge into the canonical model through documented
rules; multiple modifiers can stack with predictable, specified
semantics rather than string-concatenation guesswork.

## P

### Palette

A structured set of color, light, and tonal relationships with
explicit semantic roles (e.g., "background", "accent", "highlight",
"shadow"). Palettes are first-class primitives; they can be defined
once and reused across templates. Where Palette content overlaps with
[DTCG color tokens](https://www.designtokens.org/tr/drafts/format/),
the export boundary is DTCG-compatible per
[ADR-0006](./docs/decisions/0006-prior-art-survey.md).

### Provider

A generative execution system that Mosvera can compile to — OpenAI,
Black Forest Labs (FLUX), Stability (SDXL), Runway, etc. Providers
have divergent parameter surfaces, transport models, moderation
policies, and modality coverage. Mosvera's value is that aesthetic
intent expressed in the canonical model can be compiled to any
conforming provider.

### Provider adapter

A package under [`providers/`](./providers/) that implements the
provider compilation contract for a specific provider. Adapters
translate the canonical model into provider-specific API calls.
Adapters do **not** leak provider vocabulary back into the spec; any
provider-specific behavior is handled inside the adapter. Phase 4
ships `providers/openai/` and `providers/flux/` per
[ADR-0008](./docs/decisions/0008-provider-adapter-pairing.md).

## R

### Registry

A local collection of named aesthetics and registry documents. A
registry usually contains templates, palettes, modifiers, composition
documents, optional capability manifests, and optional merge
strategies. The registry belongs to the user or project using Mosvera;
it is not hosted on `mosvera.io` by default.

### Reference runtime

The canonical implementation of Mosvera's parsing, resolution,
merging, composition, validation, and compilation behavior. The
reference runtime is in TypeScript per
[ADR-0007](./docs/decisions/0007-reference-runtime-language.md); a
Python port is committed-to as a binding follow-on. Other-language
runtimes are welcome from the community and must pass the conformance
suite to be called Mosvera-conforming.

### Resolution

The step in which Mosvera's runtime walks an inheritance chain,
detects cycles, merges modifiers, and produces the canonical model.
Resolution is deterministic; the same input always produces the same
canonical model.

## S

### Schema

A JSON Schema definition of one of Mosvera's aesthetic primitives.
Schemas are normative, machine-readable, and language-agnostic.
Schema field names use `snake_case` per
[ADR-0005](./docs/decisions/0005-schema-naming-conventions.md);
`$`-prefixed keys are reserved for spec directives, following JSON
Schema's own precedent. Schemas live in
[`spec/schemas/`](./schemas/).

### Specification

The normative prose definition of Mosvera's primitives, behavior, and
contracts. The specification is the long-term center of gravity per
the [Manifesto](./MANIFESTO.md). It is language-agnostic and ships
under CC-BY-4.0 per
[ADR-0001](./docs/decisions/0001-license-choice.md). Versioned drafts
live in [`spec/specification/`](./specification/).

## T

### Template

A reusable starting point for aesthetic compositions — e.g., a
"cinematic editorial" template, a "documentary realism" template, a
"dashboard minimalism" template. Templates can extend other templates
through [Inheritance](#inheritance) and can be combined with
[Modifiers](#modifier) inside a [Composition](#composition).

### MEP (Mosvera Enhancement Proposal)

A long-form proposal for a change to Mosvera's public specification.
Modeled on
[OpenTelemetry Enhancement Proposals (OTEPs)](https://github.com/open-telemetry/oteps),
which themselves borrow from
[Rust RFCs](https://rust-lang.github.io/rfcs/) and
[Kubernetes Enhancement Proposals](https://www.kubernetes.dev/resources/keps/).
MEPs live in [`spec/meps/`](./meps/) and follow the lifecycle
defined in
[ADR-0003](./docs/decisions/0003-rfc-and-proposal-format.md):
`provisional → accepted → implementable → implemented → final` (plus
`deferred / rejected / withdrawn / superseded`). MEPs are the
mechanism for changing the public spec; [ADRs](#adr-architecture-decision-record)
are the mechanism for recording repository-level decisions. The two
do not overlap.

## W

### Wire format

The on-the-wire serialization of Mosvera artifacts — JSON or YAML
documents conforming to the published schemas. Wire-format field
names use `snake_case` per
[ADR-0005](./docs/decisions/0005-schema-naming-conventions.md).
Runtimes are expected to expose idiomatic accessors per language
(camelCase in TypeScript, snake_case in Python, etc.) following
[Protocol Buffers' wire-vs-codegen convention](https://protobuf.dev/programming-guides/style/).
The wire format is the contract; idiomatic accessors are a
convenience.
