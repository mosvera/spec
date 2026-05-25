<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# ADR-0013: SDXL Adapter Surface

**Status:** Accepted
**Date:** 2026-05-25
**Doctrines invoked:** Public-first, Spec-neutrality, Research-first

## Context

Phase 5 adds the third image adapter: Stable Diffusion XL through Replicate.
ADR-0008 staged SDXL after OpenAI and FLUX because it exercises a different
provider axis: open weights behind a community/aggregator API. The adapter must
prove Mosvera can target that surface without putting SDXL-only concepts into
the canonical model prematurely.

The tension is that SDXL exposes several controls OpenAI `gpt-image-1` and BFL
`flux-2-pro` do not: negative prompts, schedulers, inference steps, guidance,
and refiner settings. Some are aesthetic; some are execution mechanics. The
adapter needs clear rules so Phase 5 does not blur canonical intent with
provider tuning.

## Research

Replicate's pinned `stability-ai/sdxl` version exposes an input schema with
`prompt`, `negative_prompt`, `width`, `height`, `scheduler`,
`num_inference_steps`, `guidance_scale`, `seed`, `refine`,
`high_noise_frac`, and output-format controls. The output schema is an array
of file URIs. The generic Replicate model docs show the JavaScript client
running models as `replicate.run(model, { input })`, and the current output
docs note that client library v1 returns file-like output objects rather than
plain URLs. The adapter must therefore handle both current file outputs and
older URL-shaped outputs defensively.

The existing Mosvera contract matters more than the transport details:
MEP-0003 says provider-specific passthroughs are allowed but fenced, and
ADR-0012 says provider transport and prompt compilation stay inside adapters.
SDXL-specific controls should only become canonical when they are shared
semantic intent, not merely because one adapter can express them.

## Decision

### D1: Negative Prompt

`negative_prompt` is adapter configuration in Phase 5, not a canonical
construct.

The default adapter value is:

```text
ugly, blurry, low quality, distorted, disfigured
```

This is deliberately conservative and overridable by constructing
`new SDXLAdapter({ default_negative_prompt })`. It remains visible in the
emitted payload so callers can audit it. If negative intent becomes a repeated
cross-provider concept, it should be promoted through a MEP as a canonical
construct with explicit unsupported behavior for providers that cannot express
it.

### D2: Scheduler, Steps, And Guidance

`scheduler`, `num_inference_steps`, and `guidance_scale` stay outside the
canonical model except for the existing `quality` construct.

`quality` lowers approximately to:

| Quality | `num_inference_steps` | `guidance_scale` |
|---------|------------------------|------------------|
| `low` | 20 | 5.0 |
| `medium` | 35 | 7.5 |
| `high` | 50 | 10.0 |

The scheduler default is `K_EULER` and is adapter configuration. This keeps
"how hard should SDXL sample" in the adapter while preserving Mosvera's
existing provider-neutral `quality` construct.

### D3: Refiner

`refine` and `high_noise_frac` are adapter configuration. Defaults:

```json
{
  "refine": "expert_ensemble_refiner",
  "high_noise_frac": 0.8
}
```

These settings describe SDXL pipeline mechanics, not portable aesthetic
intent. They are still emitted deterministically and can be overridden through
the adapter constructor.

### D4: Execution Shape

The adapter executes through the official `replicate` JavaScript package using
the pinned model identifier:

```text
stability-ai/sdxl:2a865c9a94c9992b6689365b75db2d678d5022505ed3f63a5f53929a31a46947
```

`execute()` requires `REPLICATE_API_TOKEN`. It accepts Replicate v1 file-output
objects and legacy URL/string outputs, then returns the standard Mosvera
`GenerationResult` with base64 PNG data.

## Consequences

- The canonical vocabulary does not grow in Phase 5. Dashboard minimalism and
  documentary realism are designed with existing constructs.
- SDXL's provider-only controls are inspectable in payloads but fenced in the
  adapter, preserving spec neutrality.
- `quality` is approximate on SDXL, native on OpenAI, and unsupported on hosted
  FLUX `pro`. The three-way manifest divergence is now an intentional test
  surface.
- The adapter can be used for deterministic emission without a Replicate token;
  live generation is gated on `REPLICATE_API_TOKEN`.

## Sources

- [Replicate `stability-ai/sdxl` version API schema](https://replicate.com/stability-ai/sdxl/versions/2a865c9a94c9992b6689365b75db2d678d5022505ed3f63a5f53929a31a46947/api)
- [Replicate: Run a model](https://replicate.com/docs/topics/models/run-a-model)
- [Replicate: Run a model from Node.js](https://replicate.com/docs/get-started/nodejs/)
- [Replicate: Output files](https://replicate.com/docs/topics/predictions/output-files)
- [MEP-0003: Provider Compilation Contract](../../spec/meps/0003-provider-compilation-contract.md)
- [ADR-0012: Adapter Emission Architecture](./0012-adapter-emission-architecture.md)
