<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Manifesto

Mosvera is a declarative runtime for aesthetic intent.

It is not a prompt manager. It is not an image generator. It is not a
branding tool, a creator app, or a single-vendor workflow. It is the
missing infrastructure layer between aesthetic intent and generative
execution.

This document explains why that layer needs to exist, what it has to
do, and why the prevailing approach — strings of free-text prompts
glued to vendor SDKs — cannot get the AI-native era where it needs to
go.

## The problem with prompts

Prompts are the assembly language of generative systems. They work,
and they are universal, but they are not a unit of meaning. A prompt
encodes intent and execution at the same time, in the same string,
under the same vendor's interpretation. Change the model, change the
provider, change the day, and the same prompt produces a different
result — sometimes catastrophically so.

Every team building on generative systems has shipped the same
workaround: a folder of `prompts.json` files, a slowly-mutating wiki
of "what works," a private spreadsheet of which model needs which
incantation. This is the state-of-the-art for aesthetic governance in
2026, and it is the same state we had for application configuration
before YAML, for infrastructure before Terraform, for observability
before OpenTelemetry, for type systems in API contracts before
OpenAPI and GraphQL.

The pattern is familiar. The fix is not new. What's been missing is
someone willing to define the layer.

## What "aesthetic intent" actually is

Aesthetic intent is not a prompt. It is the *meaning* behind a
prompt — the palette, the lighting, the composition, the modifiers,
the mood — expressed in a form that can be reasoned about, versioned,
inherited, composed, and compiled. It is the structural model of a
visual or multimodal identity that holds across providers, models,
and time.

Mosvera models aesthetic intent as a small set of primitives:

- **Templates** define reusable starting points (a cinematic editorial
  template, a documentary-realism template, a dashboard-minimalism
  template).
- **Palettes** define structured color, light, and tonal relationships
  with explicit semantic roles.
- **Modifiers** define adjustments — a "rain-slick" modifier, a
  "magic-hour" modifier, a "soft-focus" modifier — that can be applied
  to any template.
- **Compositions** combine templates and modifiers with inheritance,
  scoping, and overrides, the same way a stylesheet inherits and
  scopes design tokens.

These primitives are deliberately small. They are the nouns and verbs
of an aesthetic vocabulary, not a prefabricated brand system. A
single team's house style and a single film's look can both be
expressed in the same primitives.

## Why this requires infrastructure semantics

A few text fragments could express any of the above. What turns them
into *infrastructure* is the same set of properties that distinguish
Terraform from a folder of `terraform.tf` examples, or OpenAPI from a
collection of `swagger.json` files:

- **A specification** that defines the primitives and their semantics
  precisely enough that two independent implementations produce the
  same canonical model from the same input.
- **Inheritance and composition rules** that produce predictable
  behavior when modifiers stack, templates extend, and scopes nest.
- **Validation** that rejects malformed inputs at the boundary and
  surfaces the violated rule, not a runtime stack trace.
- **A compiler contract** that maps the canonical model into
  provider-specific outputs — OpenAI's `gpt-image-1` parameters,
  Black Forest Labs' FLUX async polling payload, Stability's SDXL
  surface, Runway's video controls — without leaking any provider's
  vocabulary back into the model.

This is what makes the difference between "I have some prompts" and
"my team's aesthetic system is a versioned, testable artifact that
any generative pipeline can target."

## Why provider portability matters

Generative providers are still differentiating along axes that
matter: open vs. closed weights, sync vs. async transport,
deterministic vs. moderated output, sampler exposure, modality
coverage. None of them is the universal winner, and binding a team's
aesthetic identity to one provider's prompt dialect is a worse
mistake every quarter that goes by.

The lesson from comparable open-standard projects is clear. The teams
that won the long run modeled their domain *above* the provider layer
and let the providers compete on execution beneath it. OpenAPI did
this for HTTP services. OpenTelemetry did this for instrumentation.
Terraform did this for infrastructure. CloudEvents did this for event
metadata. The shape of Mosvera is the same shape, applied to
aesthetic intent.

This is not theoretical. The same brand identity should be expressible
once and rendered through OpenAI, FLUX, SDXL, Imagen, or a
self-hosted diffusion pipeline without rewriting. That is what
provider portability buys.

## Why runtime composition matters

Static prompts compose poorly. You cannot meaningfully merge two
strings — you can concatenate them and hope, but the result is not a
defined operation. You cannot extend them — extension is mimicry, not
semantics. You cannot scope them — every prompt is a global.

Runtime composition is what turns aesthetic intent from a string into
a tree. Templates inherit from templates. Modifiers apply at well-
defined scopes. Compositions resolve through documented rules.
Inheritance produces predictable conflicts that can be resolved
explicitly rather than swallowed silently.

The composition substrate has to be a runtime — not a build step,
not a code generator — because aesthetic systems are *evaluated* by
AI agents and creative tools at the moment of generation. The MCP
surface that exposes Mosvera's primitives to AI-native systems is
how aesthetic intent becomes addressable infrastructure: an agent
asks for a composition, the runtime resolves it, the compiler emits
the provider call, the execution happens. No string-glue in between.

## Why multimodal identity systems need declarative infrastructure

Aesthetic systems are multimodal by default in the AI-native era. A
brand is no longer just typography and color; it's a generative
disposition that has to render coherently across image, video,
motion, voice, and interactive UI. A documentary's look is no longer
just a LUT; it's a composition that should hold across stills, B-roll,
trailer cuts, social, and audience-facing AI-generated artifacts.

The only known way to make a multimodal identity coherent across
that surface is to declare it once, structurally, and compile it
per-modality. UI design systems learned this lesson with design
tokens; the W3C Design Tokens Format Module is the formalization of
that learning for the UI side. Mosvera is the equivalent move on the
*generative* side: a declarative representation of multimodal
aesthetic identity, with a compiler that emits the per-provider,
per-modality calls.

## Why AI-native systems require reusable aesthetic primitives

The AI-native systems being built right now — agents, copilots,
creative tools, automated content pipelines — share a structural
weakness: each of them rebuilds aesthetic governance from scratch.
Each integration with a generative provider is a fresh pile of
prompts and parameter tunings. Each handoff between teams is a fresh
loss of stylistic intent.

Reusable aesthetic primitives, addressable via a standard interface
(MCP), available in any language with a conforming runtime, let
those systems share an aesthetic vocabulary the way they already
share an authentication vocabulary, a logging vocabulary, an API
vocabulary. This is not glamorous infrastructure. It is necessary
infrastructure.

## Where Mosvera sits among adjacent work

Mosvera is being built with explicit awareness of adjacent prior art:

- The W3C Design Tokens Community Group (DTCG) formalizes a
  vendor-neutral exchange format for static design primitives. Where
  Mosvera's primitives overlap (color, dimension, typography),
  Mosvera aims to be DTCG-compatible at the export boundary. Mosvera
  picks up where DTCG stops: generative-target compilation,
  composition semantics over the primitives, runtime evaluation.
- Style Dictionary is the canonical pattern for "tokens → multi-
  platform transforms." Mosvera's compiler contract is structurally
  the same idea applied to generative provider payloads instead of
  CSS variables.
- DSPy, BAML, and the broader declarative-prompt research line cover
  composition and optimization for *text-LLM* pipelines. Mosvera
  intentionally does not redo this work; the target is multimodal
  aesthetic intent, not text-completion pipelines.

Mosvera's claim is narrow and specific: a provider-neutral, MCP-
native runtime for declarative aesthetic intent targeting generative
multimodal output. Nobody else is currently in that intersection.
The gap is real. The doctrine is to fill it without overclaiming.

## What this project is, and what it isn't

Mosvera is:

- A specification (long-term center of gravity)
- A reference runtime (TypeScript first; Python committed)
- An MCP server (first-class surface for AI-native integration)
- A provider adapter set (OpenAI, FLUX at minimum, more by community)
- A growing example corpus

Mosvera is not:

- A SaaS product
- A creator-facing UI
- A prompt manager
- An image generator
- A branding agency tool
- A single-vendor workflow

If you are looking for any of those, Mosvera is the substrate they
should be built on top of. It is not those things itself.

## What "done" looks like

Done is when an AI-native system, a creative pipeline, or an
independent generative tool can declare an aesthetic intent once,
target any conforming provider, and render coherently — and when a
second implementation of the runtime in a different language
produces identical canonical models from identical inputs. That is
when the layer has been defined.

Until then, this is incubation. The work is to define the
abstraction correctly, with research-grounded rigor, before any of
it is frozen by public exposure. The doctrines this project operates
under live in [`CLAUDE.md`](./CLAUDE.md). The phased plan lives in
[`ROADMAP.md`](./ROADMAP.md). The decisions made so far and the
research behind them live in [`docs/decisions/`](./docs/decisions/).

The position is patient and the goal is durable. The pattern is the
same one that produced every infrastructure standard the AI-native
era is going to depend on. The category is real. The work is to make
it precise.
