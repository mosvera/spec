# ADR-0006: Prior Art Survey for Aesthetic Infrastructure

**Status:** Accepted
**Date:** 2026-05-24
**Doctrines invoked:** Public-first, Adoption-over-convenience, Spec-neutrality, Comparable-class framing, Research-first

## Context

Mosvera positions itself as a "declarative runtime for aesthetic intent in AI-native systems" — a provider-neutral spec that models aesthetic primitives (templates, palettes, modifiers, compositions), resolves inheritance and composition, and compiles a canonical model into provider-specific outputs across generative image, video, and multimodal APIs.

Before incubating a new standard, the doctrine requires honest mapping of adjacent territory. If existing standards already cover most of the surface, Mosvera should either narrow its claim, embrace prior art as a substrate, or articulate the specific gap with precision. This ADR surveys design-token specs, theming protocols, generative-art DSLs, prompt-engineering frameworks, brand-as-code systems, and image-API specs.

## Research

**Design tokens (closest adjacency).** The W3C Design Tokens Community Group published the first stable version of the Design Tokens Format Module (DTCG 2025.10) on 28 October 2025 — a vendor-neutral JSON file format for exchanging design tokens (color, dimension, typography, etc.) between tools, with adoption from Figma, Penpot, Sketch, Framer, Knapsack, Supernova, and others. The DTCG spec deliberately stops at *exchange of static design primitives*; it has no concept of provider-specific compilation, no notion of generative inheritance/composition beyond simple alias references, and no MCP or runtime semantics. Style Dictionary (Amazon, 2017) operationalizes that flow with a transform pipeline that compiles tokens into platform-specific outputs (iOS, Android, CSS, Sass, etc.) — structurally the closest analog to Mosvera's "canonical model → provider compilation" pattern, but the *output* side is deterministic UI styles, not generative-model parameter payloads. IBM Carbon's token architecture (core tokens → component tokens → theme overrides) is the most mature inheritance model in the design-system world, but again terminates at CSS/Sass variables.

**Theme schemas.** VS Code (`vscode://schemas/color-theme`) and JetBrains' `IntelliJPlatform.themeMetadata.json` define structured JSON for editor theming with named color keys and dotted-path namespacing. These are single-vendor, single-target schemas — no abstraction across editors.

**Generative-art DSLs.** Hydra (Olivia Jack) is a functional-composition DSL for live-coded visuals, embracing immutability and chainable transformations — a *programmatic* aesthetic surface but not a portable declarative spec; the runtime is the language. p5.js, OpenRNDR, and Disco Diffusion notebooks are similar: code-first, not schema-first, not provider-portable.

**Prompt engineering / declarative prompt frameworks.** Multiple efforts orbit this space without converging on a standard: DSPy (Stanford, ICLR 2024) compiles declarative LLM pipelines into optimized prompts with self-improvement loops; BAML formalizes typed behavioral APIs over LLM calls; LMQL adds constrained decoding via query syntax; the Open Prompt Specification (OPS) at op-foundation.org bills itself as a vendor-neutral standard for structured prompts; LangChain's PromptTemplate supports f-string, Jinja2, and Mustache. None of these are a standards-track specification, and all target *text LLMs*, not multimodal aesthetic intent. A recent arXiv paper ("Prompt Decorators," October 2025) explicitly frames this as a still-open design space.

**Image-generation API specs.** No provider-neutral OpenAPI-style specification exists for "generate an image." Each provider exposes its own parameter surface (OpenAI gpt-image-1: `size`, `quality`, `output_format`, `output_compression`, `moderation`; Flux: `steps`, `guidance`, `safety_tolerance`, `polling_url`; Runway Gen-4: `duration`, `aspect_ratio`, `length`, reference imagery; SDXL: `cfg_scale`, `denoising_strength`, `sampler_name`). Aggregator platforms (Replicate, Fal.ai, Together) normalize *transport* but not *semantic intent* — each model still ships its own schema.

**Brand-as-code / multimodal identity.** Carbon, Spectrum, Material Design Tokens express brand systems as code, but explicitly for UI consumption. There is no public spec we found that models a brand's *aesthetic intent* in a form that compiles to *generative model* prompts and parameters.

**Academic literature.** CHI/SIGGRAPH/NeurIPS have a strong literature on neural style transfer and aesthetic evaluation (e.g., arXiv 2309.12338 on AI aesthetic judgment; arXiv 2512.11883 on universal aesthetic alignment narrowing artistic expression), but these are model-side or evaluation-side contributions — not declarative composition specifications.

## Decision

We acknowledge substantial prior art in the **static design-token** lane (DTCG, Style Dictionary, Carbon) and the **declarative prompt** lane (DSPy, BAML, OPS), and we will treat both as design-influences and potential interop targets rather than competitors. We will not attempt to redefine what DTCG already standardizes for UI tokens, nor what DSPy already does for LLM pipeline optimization.

The **specific gap Mosvera proposes to fill** is the intersection none of the above projects occupy:

1. A **provider-neutral semantic model for aesthetic intent** targeting *generative multimodal output* (image, video, audio, motion) rather than UI styles or text completions.
2. **Inheritance + composition semantics over aesthetic primitives** (templates, palettes, modifiers, compositions) that survive compilation into divergent provider parameter surfaces.
3. **A compiler contract** that maps canonical aesthetic intent into provider-specific payloads (OpenAI gpt-image-1, Flux, SDXL, Runway, Kling) — analogous to Style Dictionary's transforms, but generative.
4. **First-class MCP surface** so AI-native systems can resolve, validate, and compile aesthetic compositions as standardized tool calls.

This is honestly a *narrow* gap. DTCG + Style Dictionary cover ~40% of the structural pattern (named primitives, transforms to multiple outputs). DSPy/BAML cover ~20% of the composition/optimization pattern. The remaining ~40% is the multimodal-generative target surface and the MCP-native runtime contract — that is Mosvera's claimed contribution. The spec must be written to make this claim defensible.

## Consequences

- The spec's introduction must explicitly position Mosvera *with respect to* DTCG and Style Dictionary, not in ignorance of them. Reviewers will check.
- The Colors module of Mosvera should consider DTCG color-token compatibility as a strict export target — interop, not invention.
- The composition/inheritance model should be examined against Carbon's core-tokens / component-tokens / theme-overrides pattern before inventing new terminology.
- We must not market Mosvera as the "first" anything; the spec should claim only the specific gap above.
- If during incubation we discover that DTCG + a small MCP wrapper plus a Style-Dictionary-style transform layer covers our use case, we should fold into those ecosystems rather than ship a competing spec. The doctrine prefers adoption over invention.

## Sources

1. [Design Tokens Format Module 2025.10 (DTCG)](https://www.designtokens.org/tr/drafts/format/) — first stable version of the W3C Community Group spec for exchanging design tokens; defines the closest prior-art surface for our primitives.
2. [Design Tokens specification reaches first stable version (W3C, Oct 2025)](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) — confirms DTCG is a Community Group report, not a W3C standards-track deliverable, and lists adopting tools.
3. [Style Dictionary (Amazon, GitHub)](https://github.com/style-dictionary/style-dictionary) — the canonical "tokens → multi-platform transforms" reference architecture; structurally the closest analog to Mosvera's compiler contract.
4. [Carbon Design System color tokens](https://carbondesignsystem.com/elements/color/tokens/) — most mature core-tokens / component-tokens / theme inheritance pattern in production; informs our composition semantics.
5. [DSPy: Compiling Declarative Language Model Calls (ICLR 2024)](https://arxiv.org/pdf/2310.03714) — closest prior art for "declarative composition compiled into provider-specific outputs," but scoped to text LLM pipelines.
6. [Prompt Decorators: A Declarative and Composable Syntax for LLMs (arXiv 2510.19850)](https://arxiv.org/html/2510.19850v1) — confirms declarative-prompt standardization is still an open design space in late 2025.
7. [Hydra livecoding visual synth (GitHub)](https://github.com/hydra-synth/hydra) — functional-composition DSL for visuals; demonstrates the chainable-transformation pattern but is runtime-as-language, not a portable spec.
8. [Black Forest Labs FLUX API integration guide](https://docs.bfl.ml/api_integration/integration_guidelines) and [OpenAI Image Generation API](https://developers.openai.com/api/docs/guides/image-generation) — confirmation that no provider-neutral image-generation API spec exists; each provider ships its own parameter surface.
