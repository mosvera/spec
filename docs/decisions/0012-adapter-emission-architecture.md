# ADR-0012: Adapter Emission Architecture

**Status:** Accepted
**Date:** 2026-05-25
**Doctrines invoked:** Public-first, Adoption-over-convenience, Spec-neutrality, Research-first, Academic-grade documentation

## Context

Phases 0-3 delivered the specification, reference runtime, and MCP surface.
The runtime can resolve a composition through its inheritance chain, merge
modifiers, validate against schemas, and run the MEP-0003 compilation rule
engine against a provider's capability manifest. What the runtime cannot yet
do is **emit a provider-ready payload** -- the actual HTTP request body that
produces an image. That emission step is the boundary where Phase 4 begins.

MEP-0003 defines the compilation *contract* (lowering actions, criticality
rules, determinism boundary, provenance) but deliberately defers the
*emission architecture*: the adapter interface, the prompt-compilation
strategy, the transport abstraction, cross-cutting modifier mapping, and the
testing contract. This ADR makes those five decisions.

The two Phase 4 providers are OpenAI `gpt-image-1` and BFL `flux-2-pro`,
per [ADR-0008](./0008-provider-adapter-pairing.md). Their APIs diverge on
every axis that matters: synchronous POST vs asynchronous polling, enum-coded
quality vs numeric `steps`/`guidance`, non-bypassable server-side moderation
vs client-tunable `safety_tolerance`, and `size` enum vs independent
`width`/`height` integers. The emission architecture must absorb all of
that divergence without leaking any of it into the canonical model.

The hardest open problem is **prompt compilation**: the canonical model
contains structured aesthetic constructs (`lighting`, `color_grade`,
`medium`, palette data, etc.) that must be lowered into a single natural-
language `prompt` string for both providers. No prior art exactly addresses
this transform. This ADR proposes a clause-assembly architecture with
documented, per-construct lowering rules -- the closest domain analog to
how LLVM target backends lower IR operations into machine instructions
via `TargetLowering` methods
([LLVM Code Generator](https://llvm.org/docs/CodeGenerator.html)).

## Research

### Compiler backends as structural precedent

LLVM's target-backend architecture
([Writing an LLVM Backend](https://llvm.org/docs/WritingAnLLVMBackend.html))
provides the load-bearing structural precedent. Each backend implements a
`TargetLowering` subclass that defines how to convert target-independent IR
operations into target-specific instructions. The key patterns Mosvera
adopts:

- **Per-construct lowering methods.** LLVM backends implement
  `lowerOperation(SDValue)` per IR node type. Mosvera adapters implement a
  `lowerConstruct(name, value, context)` method per canonical construct.
  The adapter is the authority on how a construct maps to its provider
  surface; the runtime calls lowering methods but never inspects their
  output.

- **A uniform lowering result type.** LLVM lowering methods return
  `SDValue` (a uniform IR node) regardless of how complex the lowering is.
  Mosvera lowering methods return a uniform `LoweringResult` carrying
  prompt clauses, parameter assignments, and warnings -- regardless of
  which provider they target.

- **Target-specific configuration as data, not code.** LLVM's `.td`
  (TableGen) files declare instruction patterns as data. Mosvera adapters
  declare their construct-to-prompt and construct-to-parameter mappings as
  structured data (a **lowering table**), not as imperative code scattered
  across the adapter. This makes the mapping inspectable, diffable, and
  testable without executing the full compilation pipeline.

### Style Dictionary transforms as domain analog

Style Dictionary's transform architecture
([Architecture](https://styledictionary.com/info/architecture/))
is the closest domain analog. It walks design tokens by category and applies
per-category transform functions to produce platform-specific output. The
key lesson: transforms are composable, ordered, and category-targeted. The
cautionary lesson: Style Dictionary silently passes unexpressible tokens
through unchanged. Mosvera follows the "warn, never silently pass" rule
established in MEP-0003.

### Provider API surfaces (current as of 2026-05-25)

**OpenAI `gpt-image-1`** (synchronous POST):
([Image Generation API](https://developers.openai.com/api/docs/guides/image-generation),
[API Reference](https://developers.openai.com/api/reference/resources/images/methods/generate))
Parameters: `model`, `prompt` (string), `n`, `size` (enum: `1024x1024`,
`1536x1024`, `1024x1536`, `auto`), `quality` (enum: `low`, `medium`,
`high`), `output_format` (`png`, `jpeg`, `webp`), `output_compression`
(0-100), `moderation` (enum: `auto`, `low`). Response is synchronous --
the image data (base64 or URL) is in the response body. Multimodal: accepts
image inputs alongside text. No negative prompts. No `steps`, `guidance`,
or `seed` exposure.

Note: OpenAI shipped `gpt-image-1.5` and `gpt-image-2` after ADR-0008 was
written. This ADR maintains the `gpt-image-1` target per ADR-0008. Adding
`gpt-image-2` (which introduces arbitrary resolution via `WIDTHxHEIGHT`
strings) is a follow-on adapter, not a change to this architecture.

**BFL `flux-2-pro`** (asynchronous polling):
([BFL API Integration Guide](https://docs.bfl.ml/api_integration/integration_guidelines),
[FLUX.2 Prompting Guide](https://docs.bfl.ai/guides/prompting_guide_flux2))
Parameters: `prompt` (string), `width` (int), `height` (int),
`output_format`, `safety_tolerance` (int 0-6), `seed` (optional, int).
The `steps` and `guidance` parameters are available on `flux-2-flex` but
**not exposed on `flux-2-pro`** -- the BFL hosted API fixes these
internally for `pro`. Transport: POST returns `{ id, polling_url }`; client
polls `polling_url` until `status: "Ready"`. No negative prompts. No
`quality` enum.

**Critical correction to ADR-0008 and MEP-0003.** ADR-0008 stated that
`flux-2-pro` exposes `steps` and `guidance` as numeric parameters. The
current BFL API documentation does not expose these parameters for the
`flux-2-pro` endpoint (they are available only on `flux-2-flex` and for
local-weight inference). This changes the `quality` lowering: the OpenAI
adapter maps `quality` natively to its enum; the FLUX `pro` adapter treats
`quality` as `unsupported` (the provider controls quality internally). The
compilation rule table in MEP-0003 handles this correctly -- an `optional`
construct hitting `unsupported` compiles with a warning, not an error.

### Prompt-compilation prior art gap

No existing system addresses the exact problem of compiling structured
aesthetic constructs into a natural-language prompt for image generation
APIs. Adjacent approaches:

- **ComfyUI** operates at the workflow level, not the semantic level.
  Prompts are strings authored by humans; ComfyUI routes them through
  node graphs but does not compile structured data into prompts
  ([ComfyUI docs](https://docs.comfy.org/tutorials/basic/text-to-image)).
- **DSPy/BAML** compile structured programs into LLM prompts for text
  generation, not image generation. The optimization loop (DSPy's
  teleprompters) is instructive but the target modality is different.
- **BFL's prompting guide** recommends a `Subject + Action + Style +
  Context` clause structure for effective FLUX prompts
  ([FLUX.2 Prompting Guide](https://docs.bfl.ai/guides/prompting_guide_flux2)).
  This is the closest practical guidance and directly informs the clause-
  assembly architecture below.

The gap is real: structured-to-prompt compilation for image generation is
genuinely novel territory. The architecture must be explicitly experimental
and marked for revision based on generation experience.

## Decision

### D1 -- Adapter interface

Each provider adapter MUST implement the `ProviderAdapter` interface:

```typescript
interface ProviderAdapter {
  /** Machine-readable adapter identity. */
  readonly id: string;
  readonly version: string;

  /** The capability manifest (MEP-0003). */
  manifest(): CapabilityManifest;

  /**
   * Emit a provider-ready payload from a canonical resolved composition.
   *
   * MUST be a deterministic pure function of its inputs (per MEP-0003
   * determinism boundary). The returned EmissionResult contains the
   * provider payload, structured warnings, and provenance map.
   *
   * MUST NOT make any network calls. Execution is a separate concern (D3).
   */
  emit(
    canonical: JsonObject,
    options?: EmitOptions,
  ): EmissionResult;

  /**
   * Submit a compiled payload and return a generation result.
   *
   * This is the non-deterministic boundary. Transport divergence (sync
   * POST, async polling) is entirely encapsulated here.
   */
  execute(payload: ProviderPayload): Promise<GenerationResult>;
}
```

**`emit` and `execute` are separate functions.** This mirrors Terraform's
`plan` vs `apply` split and LLVM's compilation vs code-emission separation.
The caller can inspect the emitted payload (the "plan") before committing
to the non-deterministic generation step.

The `EmissionResult` structure:

```typescript
interface EmissionResult {
  /** Provider-specific request body, ready for HTTP submission. */
  payload: ProviderPayload;

  /** The assembled prompt string (for inspection/debugging). */
  prompt: string;

  /** Structured warnings from the compilation rule table (MEP-0003). */
  warnings: CompileWarning[];

  /**
   * Provenance map: each payload field traces back to the canonical
   * construct and precedence layer that produced it.
   */
  provenance: Record<string, ProvenanceEntry>;
}
```

**Rationale.** The three-method interface (`manifest`, `emit`, `execute`)
maps directly to MEP-0003's three adapter obligations: capability
declaration, deterministic compilation, and execution. No additional
methods are needed; no fewer would satisfy the contract.

**Alternative considered and rejected: a single `generate()` method.**
Collapsing emit and execute prevents payload inspection and violates the
determinism boundary. Rejected outright.

### D2 -- Prompt-compilation strategy: clause assembly

Prompt compilation uses a **clause-assembly** architecture. Each canonical
construct that contributes to the prompt produces zero or more **prompt
clauses** -- short, self-contained natural-language fragments. The adapter
assembles clauses into a final prompt string by concatenating them in a
documented, deterministic order with a joining separator.

The architecture has three layers:

**Layer 1: Lowering table (data).** Each adapter declares a structured
lowering table that maps canonical construct names and values to prompt
clause templates and parameter assignments. The table is a JSON-serializable
data structure, not imperative code:

```typescript
interface LoweringRule {
  /** The canonical construct this rule handles. */
  construct: string;

  /** How the construct maps to prompt text. */
  prompt_clause?: ClauseTemplate;

  /** How the construct maps to API parameters. */
  parameters?: Record<string, ParameterMapping>;

  /** The lowering action from the capability manifest. */
  action: LoweringAction;
}
```

A `ClauseTemplate` is a string with `{value}` interpolation points:

```typescript
// Example lowering rules for the OpenAI adapter:
{
  construct: "medium",
  action: "native",
  prompt_clause: { template: "{value} style", order: 10 }
}
{
  construct: "lighting.mood",
  action: "approximate",
  prompt_clause: { template: "{value} lighting", order: 20 },
}
{
  construct: "color_grade.contrast",
  action: "approximate",
  prompt_clause: { template: "{value} contrast", order: 30 },
}
{
  construct: "color_grade.saturation",
  action: "approximate",
  prompt_clause: { template: "{value} saturation", order: 40 },
}
{
  construct: "palette.accent",
  action: "approximate",
  prompt_clause: { template: "accent color ({value})", order: 50 },
}
{
  construct: "subject",
  action: "native",
  prompt_clause: { template: "{value}", order: 0 },
}
```

**Layer 2: Clause assembly (runtime).** The adapter walks the canonical
model, applies matching lowering rules, collects prompt clauses, sorts
them by `order`, and joins them with `, ` (comma-space). The assembly
logic is shared infrastructure in `providers/_base/`; adapters supply the
lowering table, not the assembly code.

**Layer 3: Parameter mapping (adapter-specific).** Constructs that map to
API parameters (not prompt text) are handled by the `parameters` field
of the lowering rule. For example, OpenAI's `quality` construct maps to
the `quality` parameter directly; OpenAI's `aspect_ratio` maps to the
`size` parameter via a lookup table (`3:2` -> `1536x1024`).

**Worked example.** Given the canonical resolved composition:

```json
{
  "subject": "a lighthouse on a basalt cliff at dusk",
  "medium": "cinematic",
  "lighting": { "scheme": "three_point", "mood": "warm" },
  "color_grade": { "contrast": "high", "saturation": "desaturated" },
  "palette": { "accent": "#c0563a" },
  "aspect_ratio": "3:2",
  "quality": "high",
  "safety": "standard"
}
```

The OpenAI adapter's clause assembly produces:

```
Clauses (sorted by order):
  [0]  "a lighthouse on a basalt cliff at dusk"     (subject)
  [10] "cinematic style"                             (medium)
  [20] "warm lighting"                               (lighting.mood)
  [30] "high contrast"                               (color_grade.contrast)
  [40] "desaturated saturation"                      (color_grade.saturation)
  [50] "accent color (#c0563a)"                      (palette.accent)

Joined prompt:
  "a lighthouse on a basalt cliff at dusk, cinematic style, warm
   lighting, high contrast, desaturated saturation, accent color (#c0563a)"

Parameters (non-prompt):
  model: "gpt-image-1"
  size: "1536x1024"       (aspect_ratio 3:2 -> native lookup)
  quality: "high"          (quality -> native enum)
```

**Rationale.** Clause assembly is chosen over three alternatives:

1. **Template-string approach** (a single large prompt template with
   placeholders): rejected because it couples every construct's position
   in the prompt to every other construct's. Adding a new construct
   requires editing the template, not adding a rule. Brittle and
   non-composable.

2. **LLM-assisted prompt generation** (feed the canonical model to an LLM
   and ask it to write a prompt): rejected because it violates the
   determinism boundary. The emit step MUST be deterministic per MEP-0003.
   An LLM in the compilation path makes the payload non-reproducible.

3. **Free-form imperative code per adapter** (each adapter writes its own
   prompt-building logic): rejected because it makes the mapping
   uninspectable and untestable as data. The lowering table is diffable,
   serializable, and conformance-testable; imperative code is not.

**Stated limitation.** Clause assembly produces prompts that are
*structurally correct* but not necessarily *aesthetically optimal*.
A hand-crafted prompt by an expert may outperform a clause-assembled one.
This is an accepted tradeoff: the architecture prioritizes determinism,
portability, and inspectability over prompt-engineering artistry. The
lowering table is the tuning surface -- improving prompt quality means
improving clause templates and ordering, not rewriting adapter code.

### D3 -- Transport abstraction

The `execute()` method returns `Promise<GenerationResult>` regardless of
whether the provider is synchronous or asynchronous. Transport divergence
is entirely encapsulated inside the adapter:

```typescript
interface GenerationResult {
  /** Provider-assigned generation ID (for audit/retry). */
  id: string;

  /** The generated image(s). */
  images: GeneratedImage[];

  /** Provider-reported metadata (model version, seed if available). */
  metadata: Record<string, unknown>;
}

interface GeneratedImage {
  /** Base64-encoded image data. */
  data: string;

  /** MIME type of the image. */
  media_type: string;
}
```

- The **OpenAI adapter** makes a single POST, receives the response body
  containing base64 image data, and resolves the promise immediately.
- The **FLUX adapter** makes a POST that returns a `polling_url`, enters
  a poll loop with configurable interval and timeout, and resolves the
  promise when the generation completes (or rejects on timeout/error).

The runtime and MCP surface see only `Promise<GenerationResult>`. No
polling URL, no transport-specific retry logic, no provider-specific
error shape leaks above the adapter boundary.

**Rationale.** This is the Terraform provider model applied to transport:
the core orchestrator calls a provider function and gets a result; whether
that function makes one RPC or twenty is the provider's business
([Terraform Plugin Protocol](https://developer.hashicorp.com/terraform/plugin/terraform-plugin-protocol)).

Each adapter SHOULD sit on top of the provider's official SDK to inherit
error semantics and retry behavior, per ADR-0008.

### D4 -- Cross-cutting modifier mapping

Three canonical constructs require special treatment because they map to
fundamentally different provider surfaces:

**`quality`:**
- OpenAI: `quality` enum (`low`, `medium`, `high`). Lowering action:
  `native`. Direct parameter mapping.
- FLUX `pro`: No `quality` parameter exposed on the hosted API. Lowering
  action: `unsupported`. Emits a warning; the provider controls quality
  internally.

This is a correction from the ADR-0008/MEP-0003 worked examples, which
assumed FLUX exposes `steps`/`guidance` on the `pro` endpoint. The
compilation rule table handles this cleanly: `quality` is `optional` by
default, so `unsupported` produces a warning, not an error.

**`safety`:**
- OpenAI: `moderation` parameter (enum: `auto`, `low`). Server-side
  moderation is non-bypassable but tunable within a narrow range.
  Lowering action: `approximate`. Mapping: `standard` -> `auto`,
  `permissive` -> `low`.
- FLUX: `safety_tolerance` (int 0-6). Lowering action: `native`.
  Mapping: `standard` -> `2`, `permissive` -> `4`, `strict` -> `0`.

Both adapters declare the mapping in their lowering tables. The
canonical model uses semantic values (`standard`, `strict`,
`permissive`); the adapters map them to provider-native types.

**`aspect_ratio`:**
- OpenAI: `size` enum. Lowering action: `native`. Mapping via lookup
  table: `1:1` -> `1024x1024`, `3:2` -> `1536x1024`,
  `2:3` -> `1024x1536`. Ratios outside this set produce a compile error
  if the construct is `required`, or a warning-with-fallback-to-nearest
  if `optional`.
- FLUX: independent `width`/`height` integers. Lowering action: `native`.
  Mapping: resolve the ratio to pixel dimensions at the adapter's
  default resolution (e.g., `3:2` at 1MP -> `1536x1024`).

**Rationale.** Cross-cutting modifiers are modeled as construct-level
lowering rules, not as a separate "modifier mapping layer." This keeps
the architecture uniform: every construct -- whether it maps to prompt
text, an API parameter, or both -- goes through the same lowering-table
mechanism. Special-casing cross-cutting concerns into a separate system
would create a second code path that diverges from the primary one,
violating the single-mechanism principle.

### D5 -- Testing contract

"The abstraction holds" means three things, tested at three levels:

**Level 1: Deterministic emission (unit tests per adapter).**
Given a fixed canonical resolved composition, calling `emit()` MUST
produce a byte-identical `EmissionResult` (payload, prompt, warnings,
provenance). These are pure-function unit tests with no network calls.
This is the MEP-0003 determinism contract made concrete.

Test fixtures: a set of canonical compositions paired with expected
`EmissionResult` snapshots, checked into `providers/openai/test/` and
`providers/flux/test/`. Snapshot tests catch unintended regressions in
clause templates, parameter mappings, and warning generation.

**Level 2: Cross-adapter structural equivalence (integration tests).**
Given the same canonical composition, both adapters' `emit()` calls
MUST:

- Produce prompts that contain the same semantic content (the same
  subject, the same aesthetic modifiers) even though the clause ordering
  and phrasing may differ between providers.
- Map the same `required` constructs to payload fields (no `required`
  construct is silently dropped by either adapter).
- Produce compilation warnings that are structurally valid against the
  MEP-0003 rule table.

These tests run without network calls. They validate that the
*emission architecture* is provider-portable, not that the *generated
images* are visually similar.

**Level 3: End-to-end generation (manual, gated, not automated).**
Visual comparison of generated outputs is explicitly NOT part of the
automated test suite. Image generation is non-deterministic; pixel-level
or perceptual similarity metrics (SSIM, LPIPS) are unreliable for
evaluating whether aesthetic intent was preserved. End-to-end generation
tests are:

- Run manually during development and before releases.
- Documented as a gallery in `examples/` (generated images from both
  providers, side by side, with the canonical composition that produced
  them).
- Evaluated by human judgment, not automated metrics.

**Rationale.** Automated visual comparison was considered and rejected.
The non-determinism of image generation means that two runs of the
same payload against the same provider produce visibly different images.
Asserting pixel-level similarity would produce flaky tests; asserting
perceptual similarity (SSIM > 0.7) would encode a subjective threshold
as a hard gate. The correct boundary is: deterministic emission is
tested automatically; non-deterministic generation is evaluated by
humans. This matches Terraform's model: `plan` output is tested
automatically; `apply` results are validated by operators.

**Conformance vectors.** Phase 4 adds a new conformance vector category
in `spec/compliance/emission/` -- canonical composition + provider ID ->
expected emission result. These vectors are the cross-language
portability contract for the emission architecture: the Python port
(Phase 7) must pass them.

## Consequences

- The `compile()` function in `runtime/src/compile.ts` remains the
  rule engine (criticality x lowering action -> compile/warn/error).
  The new `emit()` function in each adapter handles payload construction.
  The runtime calls `compile()` first (pre-flight), then `emit()` if
  compilation succeeds.

- The public MCP surface exposes deterministic provider payload compilation
  through `compile_provider_payload`, superseding the prototype
  `compile_generation` / `emit: true` shape that existed during Phase 4.
  The tool returns the full `EmissionResult` (payload + prompt + provenance)
  instead of just the compilation decision; this is the "show me the plan"
  capability.

- Lowering tables are JSON-serializable data. They can be inspected by
  the MCP surface, diffed across adapter versions, and used to generate
  documentation automatically. This is a significant advantage over
  imperative prompt-building code.

- The prompt-compilation strategy (clause assembly) is explicitly
  experimental. Lowering-table clause templates are the primary tuning
  surface; improving prompt quality is a data-editing task, not a
  code-refactoring task. This is by design.

- The correction to FLUX `pro`'s parameter surface (`steps`/`guidance`
  not exposed) changes the `quality` lowering in the MEP-0003 worked
  example. The existing MEP-0003 text should be annotated with a
  reference to this ADR. The compilation rule table itself is unaffected
  -- `optional` + `unsupported` = warn, which was always the correct
  behavior.

- Provider SDKs (OpenAI Node SDK, BFL API via `fetch`) are runtime
  dependencies of the adapter packages, not the core runtime. The core
  runtime has zero provider dependencies.

- The `ProviderAdapter` interface is spec-neutral per Doctrine 3. The
  TypeScript interface defined here is the reference implementation; the
  Python port implements the same contract. The conformance vectors in
  `spec/compliance/emission/` are the language-neutral contract.

## Sources

1. [LLVM Code Generator](https://llvm.org/docs/CodeGenerator.html) -- `TargetLowering` per-operation lowering methods; `setOperationAction` dispatching; the compile-then-emit separation that Mosvera's `emit`/`execute` split mirrors.
2. [Writing an LLVM Backend](https://llvm.org/docs/WritingAnLLVMBackend.html) -- Backend implementation guide; `TargetLowering` subclass pattern; `LowerFormalArguments` / `LowerReturn` as the uniform lowering interface.
3. [Style Dictionary Architecture](https://styledictionary.com/info/architecture/) -- Per-category transform pipeline; composable, ordered transforms; cautionary silent-passthrough behavior that Mosvera avoids.
4. [OpenAI Image Generation API guide](https://developers.openai.com/api/docs/guides/image-generation) and [API Reference](https://developers.openai.com/api/reference/resources/images/methods/generate) -- Authoritative parameter surface for the OpenAI adapter: `prompt`, `size`, `quality`, `output_format`, `output_compression`, `moderation`, `n`; synchronous response; `gpt-image-2` arbitrary-resolution extension noted for future adapter.
5. [BFL FLUX.2 API Integration Guide](https://docs.bfl.ml/api_integration/integration_guidelines) -- Authoritative documentation of the async polling architecture, `prompt`, `width`, `height`, `output_format`, `safety_tolerance`; confirms `steps`/`guidance` are not exposed on `flux-2-pro`.
6. [BFL FLUX.2 Prompting Guide](https://docs.bfl.ai/guides/prompting_guide_flux2) -- `Subject + Action + Style + Context` clause structure; no negative prompts; practical guidance that directly informs the clause-assembly order.
7. [Terraform Plugin Protocol](https://developer.hashicorp.com/terraform/plugin/terraform-plugin-protocol) -- `GetProviderSchema` / `PlanResourceChange` / `ApplyResourceChange` as the three-phase contract that Mosvera's `manifest`/`emit`/`execute` mirrors; transport encapsulation inside provider plugins.
8. [MEP-0003: Provider Compilation Contract](../../spec/meps/0003-provider-compilation-contract.md) -- The normative compilation contract this ADR implements; determinism boundary; provenance requirements; lowering-action taxonomy.
9. [ADR-0008: Provider Adapter Pairing](./0008-provider-adapter-pairing.md) -- The OpenAI + FLUX pairing decision and surface-divergence analysis this ADR builds on; correction to FLUX `pro` parameter exposure noted.
