<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# MEP-0003: Provider Compilation Contract

**Status:** provisional
**Author(s):** Founding maintainer
**Created:** 2026-05-24
**Updated:** 2026-05-24
**Tracking issue:** (assigned at PR merge; see [ADR-0003](../docs/decisions/0003-rfc-and-proposal-format.md))
**Superseded by:** —

> **Numbering note.** Provisional number `0003` during solo incubation, per
> the convention established in [MEP-0001](./0001-composition-semantics.md).

## Motivation

[MEP-0001](./0001-composition-semantics.md) and
[MEP-0002](./0002-inheritance-rules.md) define how aesthetic intent resolves
into a single, deterministic, provider-neutral **canonical resolved
composition**. This MEP closes the loop: it defines how that canonical model
is **compiled into provider-specific payloads** by provider adapters —
turning intent into an actual OpenAI or FLUX request.

This is the contract that makes Mosvera's central claim falsifiable. The
project asserts that one declaration of aesthetic intent can target multiple
genuinely different execution surfaces. The proof is a worked compilation of
the same canonical composition to two providers whose APIs diverge on every
axis: transport (OpenAI's synchronous POST vs FLUX's asynchronous
polling-URL), quality control (OpenAI's `quality` enum vs FLUX's numeric
`steps`+`guidance`), moderation (OpenAI's non-bypassable server-side
moderation vs FLUX's client-tunable `safety_tolerance`), and image input
(OpenAI's multimodal input vs FLUX's `input_image`). These divergences are
documented in [ADR-0008](../docs/decisions/0008-provider-adapter-pairing.md).
If a single canonical model compiles cleanly to both, the abstraction is
real; if it only works for one, Mosvera is an OpenAI wrapper with extra steps.

The hard problem this MEP must solve is **lossy compilation**: the canonical
model can express intent a given provider cannot exactly fulfill. The contract
must define, precisely and in the spec rather than per-implementer, what
happens then — map, approximate, emulate, warn, or error — so that loss is
never silent.

This MEP does **not** define:

- The merge algebra, inheritance, or how the canonical model is produced —
  [MEP-0001](./0001-composition-semantics.md) and
  [MEP-0002](./0002-inheritance-rules.md).
- The concrete field schemas of aesthetic primitives —
  [`spec/schemas/`](../schemas/).
- The wire-level details of any specific provider API beyond what the worked
  example requires; those live in each adapter under
  `providers/`.

## Explanation

### The adapter and its three obligations

A **provider adapter** is the unit that knows how to turn canonical aesthetic
intent into one provider's API calls. Every adapter MUST provide three things:

1. **A capability manifest** — a machine-readable declaration of which
   canonical constructs the adapter can represent, and how (the *lowering
   action* for each).
2. **A compile function** — `compile(canonical_composition) → compiled_artifact`,
   a deterministic pure function from the canonical model to a provider payload
   plus warnings and provenance.
3. **An execution interface** — a uniform way for the runtime to submit the
   compiled payload and retrieve a result, hiding whether the provider is
   synchronous or asynchronous underneath.

The canonical model carries **semantics**; the adapter carries **rendering**.
This is the boundary discipline that every clean comparable system enforces
(LLVM's target-independent IR vs target lowering; OpenTelemetry's semantic
conventions vs exporters; Style Dictionary's token model vs platform
transforms). No provider name, parameter, or prompt fragment ever appears in
the canonical model. Per
[ADR-0006](../docs/decisions/0006-prior-art-survey.md) and the
[provider principles in CLAUDE.md](../CLAUDE.md#provider-principles), this
is non-negotiable: provider-specific behavior lives exclusively in adapters.

### Lowering actions

For each canonical construct it handles, an adapter declares one **lowering
action** from a closed set, modeled on LLVM's `setOperationAction`
([LLVM Code Generator](https://llvm.org/docs/CodeGenerator.html)):

- **`native`** — a direct 1:1 mapping. (Canonical `aspect_ratio: "3:2"` →
  OpenAI `size: "1536x1024"`.)
- **`approximate`** — a faithful but inexact coercion. (Canonical
  `quality: high` → FLUX `steps: 50, guidance: 3.5` — a tuned profile that
  approximates "high quality" on a provider with no quality enum.)
- **`emulate`** — decompose the construct into a sequence the provider *can*
  do (LLVM's "Expand"). Reserved for constructs that have no single mapping
  but can be reconstructed from primitives the provider supports.
- **`unsupported`** — the adapter cannot represent the construct at all.

A construct an adapter does not mention in its manifest is treated as
`unsupported`. There is no silent fallthrough — the manifest is the complete,
authoritative statement of what the adapter can do, the way a Terraform
provider's schema is the complete statement of what it supports
([Terraform Schemas](https://developer.hashicorp.com/terraform/plugin/framework/handling-data/schemas)).

### Construct criticality

Every canonical construct carries a **criticality**, modeled on glTF's
required-vs-optional extension declarations
([glTF Extensions README](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md)):

- **`required`** — the aesthetic intent is meaningless or wrong without this
  construct. (A brand's locked accent color; an explicitly mandated subject.)
- **`optional`** — the construct refines intent but the result is still valid
  aesthetic output without it. (A subtle film-grain modifier.)

Criticality has a schema-declared default per construct type. A composition
MAY elevate an optional construct to required (the directive form is deferred;
see Open questions). glTF's design directive applies here too: *optional is
preferred unless there is a good reason to require failure*, because a
provider that can't do an optional thing should degrade, not refuse.

### The compilation rule (the crux)

Compilation walks the canonical resolved composition and, for each construct,
crosses its **criticality** with the adapter's **lowering action**:

| | `native` | `approximate` / `emulate` | `unsupported` |
|---|---|---|---|
| **`required`** | compile | compile + **warn** (approximation noted) | **hard error**, no payload emitted |
| **`optional`** | compile | compile + **warn** | compile + **warn** (construct dropped) |

The two rules that matter most:

- **A `required` construct the adapter cannot represent is a hard compile
  error**, raised *before any provider call is made*. This is the
  Terraform/glTF posture: validate against the declared capability surface and
  fail early and cleanly, rather than discovering the gap mid-generation.
- **Loss is never silent.** Every approximation, emulation, or drop emits a
  structured warning in the compiled artifact. This is the explicit lesson
  from the systems that got it wrong — Style Dictionary silently passes
  unexpressible tokens through unchanged, and Pandoc has a recurring class of
  bugs where raw blocks vanish without notice
  ([Pandoc #6797](https://github.com/jgm/pandoc/issues/6797)). OpenTelemetry,
  by contrast, specifies coercion-then-drop in normative SHOULD/MUST terms
  ([OTel Prometheus compatibility](https://opentelemetry.io/docs/specs/otel/compatibility/prometheus_and_openmetrics/));
  Mosvera follows OTel.

### The compiled artifact

`compile` returns not just a payload but a structured **compiled artifact** —
the Terraform `plan` analog, inspectable before the (non-deterministic)
generation step:

```
compiled_artifact:
  payload:     <provider-ready request body>
  warnings:    [ { construct, action, detail }, … ]   # approximations, drops
  provenance:  { payload_field → { canonical_construct, won_from } }
```

The `provenance` map traces each emitted payload field back to the canonical
construct that produced it and the precedence layer that won it (the modifier
or ancestor, per MEP-0001's legible precedence order). Like LLVM's debug-info
channel, which marks a variable location "unavailable" once it is folded away
([LLVM Source Level Debugging](https://llvm.org/docs/SourceLevelDebugging.html)),
the provenance map MUST record where a construct was approximated or dropped,
so loss is auditable rather than invisible.

## Internal details

### Capability manifest (normative)

Each adapter MUST publish a machine-readable capability manifest enumerating,
per canonical construct it handles, its lowering action. The runtime uses the
manifest for pre-flight validation (below). An adapter MUST NOT claim a
lowering action it does not implement; the manifest is a contract, not a hint.

Capability claims MUST NOT be silently inherited. If adapters are organized
with any inheritance or shared-base structure, each concrete adapter
re-declares its manifest. This follows SQLAlchemy's deliberate refusal to
inherit `supports_statement_cache` across dialect superclasses
([SQLAlchemy Connections](https://docs.sqlalchemy.org/en/20/core/connections.html)):
a silently inherited capability claim is a footgun, because a sub-adapter may
not actually implement what its parent declared.

### Pre-flight validation (normative)

A conforming runtime MUST be able to validate a resolved composition against a
named adapter's manifest **before** compilation, and report:

- a **hard error** for every `required` construct the adapter marks
  `unsupported`;
- a **warning** for every `optional` construct that is `unsupported`, and for
  every construct (required or optional) that is `approximate`/`emulate`.

This is surfaced through the MCP `validate_document` / `resolve_aesthetic`
surface (see `mcp/`) so an AI-native caller can check
provider-fit before requesting generation, mirroring Terraform's
`GetProviderSchema`-before-plan validation
([Terraform Plugin Protocol](https://developer.hashicorp.com/terraform/plugin/terraform-plugin-protocol)).

### Determinism boundary (normative)

The determinism boundary sits precisely at the **payload emission line**:

- **Compilation MUST be deterministic.** Given the same canonical resolved
  composition, the same adapter version, and the same capability manifest, a
  conforming adapter MUST emit a byte-identical payload (modulo fields the
  provider API requires to be unique per request, which MUST be confined to a
  documented, enumerated set). This is the SQLAlchemy posture, which *enforces*
  deterministic compilation by forbidding hardcoded literals in the compiler
  so that compiled SQL is cacheable
  ([SQLAlchemy Connections](https://docs.sqlalchemy.org/en/20/core/connections.html)).
- **Generation is explicitly NOT deterministic.** Once the payload is
  submitted, the provider's model, seed handling, sampler, and server-side
  moderation govern the output. That non-determinism is outside Mosvera's
  guarantee and is the provider's domain.

The compiled artifact (payload + warnings + provenance) is therefore a
deterministic, inspectable function of the inputs, even though the image it
ultimately produces is not.

### Execution interface (normative shape)

The runtime submits a compiled payload through a uniform execution interface
that abstracts transport. Whether the provider is synchronous (OpenAI: POST,
response carries the image) or asynchronous (FLUX: POST returns a polling URL,
the client polls until ready) is **entirely the adapter's concern**. The
runtime sees one interface: submit a compiled artifact, receive a result (or a
handle that resolves to one). Transport divergence MUST NOT leak into the
canonical model or the runtime's composition logic. This is why transport
appears nowhere in MEP-0001/0002 — it is a rendering concern, fenced inside the
adapter, exactly as LLVM keeps calling-convention and scheduling details inside
the target backend.

### Escape hatch (provider-specific passthrough)

When a provider has a capability with no canonical representation and the
project does not (yet) want to model it canonically, an adapter MAY expose a
fenced, provider-tagged passthrough construct — modeled on Pandoc's
format-tagged raw blocks
([Pandoc Manual](https://pandoc.org/MANUAL.html)). Such a construct:

1. MUST be explicitly tagged with the target provider it applies to.
2. MUST be treated as opaque by the canonical merge (MEP-0001) — it
   participates in precedence but its contents are never interpreted by the
   core.
3. MUST be consumed only by the matching adapter and MUST emit a warning if it
   reaches a non-matching adapter (never silently dropped — the exact Pandoc
   bug to avoid).

Escape hatches are a controlled concession, not an encouraged pattern. Their
existence MUST NOT become a reason to leave intent unmodeled; recurring use of
a passthrough is a signal to promote that capability into the canonical model
via a MEP.

## Worked example: one composition, two providers

The canonical resolved composition (illustrative; produced by resolving a
template + modifiers per MEP-0001/0002):

```yaml
# canonical resolved composition (provider-neutral)
subject: "a lighthouse on a basalt cliff at dusk"   # required
aspect_ratio: "3:2"                                  # required
palette:                                             # required (brand-locked)
  accent: "#c0563a"
quality: high                                        # optional
safety: standard                                     # optional
```

### Compiled to OpenAI `gpt-image-1`

```jsonc
// payload
{
  "model": "gpt-image-1",
  "prompt": "a lighthouse on a basalt cliff at dusk, warm amber accent (#c0563a)",
  "size": "1536x1024",        // aspect_ratio 3:2 → native
  "quality": "high"           // quality high → native (enum exists)
                              // safety: standard → moderation is server-side,
                              //   non-bypassable; no payload field. WARN (optional, dropped-to-default)
}
// warnings: [ { construct: "safety", action: "unsupported",
//              detail: "OpenAI moderation is server-side and non-tunable" } ]
```

### Compiled to BFL `flux-2-pro`

> **Correction (ADR-0012, 2026-05-25).** The `steps` and `guidance`
> parameters are not exposed on the `flux-2-pro` hosted API endpoint.
> The `quality` construct is therefore `unsupported` (not `approximate`)
> for this adapter. The compilation rule table handles this correctly:
> `optional` + `unsupported` = warn + drop. See
> [ADR-0012](../docs/decisions/0012-adapter-emission-architecture.md)
> for the corrected mapping.

```jsonc
// payload (submitted async; adapter handles the polling URL)
{
  "model": "flux-2-pro",
  "prompt": "a lighthouse on a basalt cliff at dusk, warm amber accent (#c0563a)",
  "width": 1536, "height": 1024,   // aspect_ratio 3:2 → native
  "safety_tolerance": 2            // safety standard → native (numeric knob)
}
// warnings: [ { construct: "quality", action: "unsupported",
//              detail: "flux-2-pro hosted API does not expose quality controls" } ]
```

The same `subject`, `aspect_ratio`, and `palette.accent` (all `required`)
compile to both with no error — the abstraction holds. The divergence is
entirely absorbed by the adapters: `quality` is `native` on OpenAI and
`approximate` on FLUX; `safety` is `unsupported` on OpenAI (server-side
moderation) and `native` on FLUX. Both losses are `optional` constructs, so
both compile with warnings rather than errors. Had `palette.accent` been
`unsupported` by an adapter, that would be a `required` construct hitting
`unsupported` — a hard error before any call, because a brand-locked color is
not negotiable.

## Trade-offs and mitigations

- **Mandatory capability manifests add authoring burden to adapters.** An
  adapter author must enumerate every construct and its lowering action, not
  just write mapping code. **Mitigation:** this is the cost that buys
  pre-flight validation and clean errors — the difference between "fails
  cleanly before any API call" and "fails halfway through generation." Every
  comparable system that lacks a manifest (OTel, Pandoc, Style Dictionary)
  pays for it with loss discovered too late.

- **`approximate` mappings are subjective.** "quality: high → steps=50,
  guidance=3.5" is a judgment call by the adapter author; another author might
  choose different numbers. **Mitigation:** the approximation is declared,
  warned, and traceable in provenance, so it is auditable and tunable rather
  than hidden. Approximation profiles SHOULD be documented in the adapter and
  MAY become conformance-tested against reference outputs over time.

- **The determinism guarantee covers compilation, not output.** A user might
  expect "same composition → same image." It will not, because generation is
  non-deterministic. **Mitigation:** the guarantee is precisely scoped and
  documented — same composition → same *payload*. Reproducible *images* depend
  on provider seed support, which the adapter MAY expose but the spec does not
  guarantee.

- **Escape hatches risk becoming a dumping ground.** A provider-tagged
  passthrough could be abused to avoid modeling intent canonically.
  **Mitigation:** passthroughs are fenced, warned on mismatch, and explicitly
  flagged as a signal to promote the capability via a MEP — not a sanctioned
  long-term home for unmodeled intent.

## Prior art and alternatives

Full survey and citations in the project research record; the load-bearing
precedents:

- **LLVM IR + target backends** — the canonical one-IR-many-targets compiler.
  Source of the enumerated lowering-action model (`setOperationAction`:
  Expand/Promote/Custom → Mosvera's `native`/`approximate`/`emulate`/`unsupported`),
  the queryable target-capability description, the semantics-vs-rendering
  boundary, and the debug-info provenance channel that honestly marks where
  traceability degrades.
  ([LLVM Code Generator](https://llvm.org/docs/CodeGenerator.html),
  [LLVM Source Level Debugging](https://llvm.org/docs/SourceLevelDebugging.html))
- **glTF extension declarations** — source of the required-vs-optional
  criticality model and the rule that a *required* unsupported capability MUST
  fail to load while an *optional* one safely degrades.
  ([glTF Extensions README](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md))
- **Terraform provider contract** — source of the machine-readable
  schema-as-capability-manifest validated *before* execution
  (`GetProviderSchema` at plan time), and the `plan` artifact as inspectable
  preview. Also the strongest boundary discipline: process/gRPC separation so
  core cannot embed provider code.
  ([Terraform Schemas](https://developer.hashicorp.com/terraform/plugin/framework/handling-data/schemas),
  [Plugin Protocol](https://developer.hashicorp.com/terraform/plugin/terraform-plugin-protocol))
- **OpenTelemetry exporters + semantic conventions** — the project's namesake.
  Source of "define the canonical model against a lossless reference (OTLP),
  not the lowest-common-denominator backend," and of normative SHOULD-coerce /
  MUST-drop loss rules. Mosvera improves on OTel by making the capability
  manifest machine-readable rather than prose-only.
  ([OTel Semantic Conventions](https://opentelemetry.io/docs/concepts/semantic-conventions/),
  [Collector](https://opentelemetry.io/docs/collector/),
  [OTLP](https://opentelemetry.io/docs/specs/otlp/))
- **Style Dictionary transforms & formats** — the closest domain analog
  (design tokens → divergent platform outputs), proving the
  neutral-model/platform-transform split works in an aesthetic domain. Also a
  cautionary case: it silently passes unexpressible tokens through unchanged.
  Mosvera does the opposite — no silent passthrough.
  ([Style Dictionary Transforms](https://styledictionary.com/reference/hooks/transforms/))
- **Pandoc** — source of honest-degradation discipline (format-tagged raw
  passthrough, warn-on-drop) and a cautionary case of silent raw-block drops
  when target-matching is fuzzy. Mosvera's escape hatch adopts the fenced,
  warned form and requires exact target matching.
  ([Pandoc Manual](https://pandoc.org/MANUAL.html),
  [Pandoc #6797](https://github.com/jgm/pandoc/issues/6797))
- **SQLAlchemy dialect compilation** — source of per-target compilation
  dispatch with explicit unsupported-construct rejection
  (`UnsupportedCompilationError`), the enforced-deterministic-compilation
  requirement, and the "don't silently inherit capability claims" rule.
  ([SQLAlchemy Compiler Extension](https://docs.sqlalchemy.org/en/20/core/compiler.html),
  [Connections](https://docs.sqlalchemy.org/en/20/core/connections.html))

**Alternative considered and rejected: shrink the canonical model to the
intersection of supported providers.** This would guarantee every construct
compiles everywhere with no loss — and would gut the abstraction, because the
canonical model could express only what the least-capable provider supports.
OpenTelemetry's lesson is decisive: define the model against a lossless
reference and let weaker targets be lossy consumers. Mosvera models the full
aesthetic intent and lets adapters degrade, with declared criticality
governing whether degradation is an error or a warning.

**Alternative considered and rejected: silent best-effort compilation.** The
simplest implementation maps what it can and ignores the rest. Rejected
outright — it is the single most-cited failure mode across the survey (Style
Dictionary, Pandoc), and it violates the legibility commitment Mosvera made in
MEP-0001. Loss must always be visible.

## Open questions

1. **Composition-level criticality override.** This MEP says a composition MAY
   elevate an optional construct to required. The directive form (e.g.
   `$require: [field, …]`) and its interaction with the MEP-0001 merge need a
   worked example before being specified normatively.
2. **Approximation-profile conformance.** Should `approximate` mappings (e.g.
   the quality→steps/guidance profile) be conformance-tested against reference
   outputs, or left to adapter authors? Likely a later, separate MEP once
   there is generation experience.
3. **Capability-manifest format.** The manifest is required to be
   machine-readable; its concrete schema (a JSON Schema in
   [`spec/schemas/`](../schemas/)) is deferred to the schema work.
4. **Multi-image / batch and editing flows.** OpenAI multimodal image input
   and FLUX `input_image` editing are noted but not fully modeled here; how
   input imagery enters the canonical model is an open design question.
5. **Cost/latency surfacing.** Should the compiled artifact carry an estimated
   cost/latency per provider (a planning aid, Terraform-plan-like)? Deferred.

## Future possibilities

- **Conformance vectors** in [`spec/compliance/`](../compliance/) for the
  compilation rule table: required+unsupported → error; optional+unsupported →
  warn+drop; approximate → warn; native → clean. Plus the worked
  OpenAI/FLUX example as a golden compilation test, so any adapter and any
  runtime can be validated against identical expected artifacts.
- **`compile_provider_payload` with provenance** in the MCP surface: return the full
  compiled artifact (payload + warnings + provenance), not just the payload,
  satisfying the legibility guarantee end to end.
- **A third, open-weights adapter (SDXL via Replicate)** per
  [ADR-0008](../docs/decisions/0008-provider-adapter-pairing.md) Phase 5,
  which adds the sampler/scheduler-exposure axis and further stress-tests the
  lowering-action model.
- **A motion/temporal provider (Runway)** per ADR-0008 Phase 8, which will
  test whether the compilation contract survives a provider whose output is
  temporal rather than a still image — the strongest test of the abstraction's
  reach.

## Sources

1. [LLVM Code Generator](https://llvm.org/docs/CodeGenerator.html) — target-independent vs target-specific split; `setOperationAction` lowering actions (Expand/Promote/Custom); `TargetMachine` capability description.
2. [LLVM Source Level Debugging](https://llvm.org/docs/SourceLevelDebugging.html) — debug-info provenance channel; explicit marking of locations made "unavailable" by transforms.
3. [glTF Extensions README (Khronos)](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md) — `extensionsUsed` vs `extensionsRequired`; required→must-fail, optional→safe-fallback; "optional preferred" directive.
4. [Terraform Plugin Schemas](https://developer.hashicorp.com/terraform/plugin/framework/handling-data/schemas) and [Plugin Protocol](https://developer.hashicorp.com/terraform/plugin/terraform-plugin-protocol) — `GetProviderSchema` validation before execution; schema as authoritative capability surface; gRPC process separation as boundary enforcement.
5. [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/concepts/semantic-conventions/), [Collector](https://opentelemetry.io/docs/collector/), [OTLP](https://opentelemetry.io/docs/specs/otlp/), [Prometheus compatibility](https://opentelemetry.io/docs/specs/otel/compatibility/prometheus_and_openmetrics/) — neutral model against a lossless reference; normative coerce/drop rules.
6. [Style Dictionary — Transforms](https://styledictionary.com/reference/hooks/transforms/) — closest domain analog; neutral token model vs platform transforms; cautionary silent-passthrough behavior.
7. [Pandoc Manual](https://pandoc.org/MANUAL.html) and [issue #6797](https://github.com/jgm/pandoc/issues/6797) — honest degradation; format-tagged raw passthrough; cautionary silent-drop bugs.
8. [SQLAlchemy Compiler Extension](https://docs.sqlalchemy.org/en/20/core/compiler.html) and [Engines & Connections](https://docs.sqlalchemy.org/en/20/core/connections.html) — per-dialect compilation dispatch; `UnsupportedCompilationError`; enforced deterministic compilation; non-inheriting capability flags.
9. [ADR-0008: Provider Adapter Pairing](../docs/decisions/0008-provider-adapter-pairing.md) — the OpenAI gpt-image-1 + FLUX.2-pro divergence axes this contract must reconcile.
