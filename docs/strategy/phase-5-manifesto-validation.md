<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Phase 5 Manifesto Validation

**Date:** 2026-05-25

Phase 5 strengthens the manifesto's central claim: Mosvera is not a prompt
manager or an image generator; it is the deterministic layer between aesthetic
intent and provider execution.

The strongest evidence is now concrete:

- Three distinct aesthetic systems exist in schema form:
  `cinematic-editorial`, `dashboard-minimalism`, and `documentary-realism`.
- The same resolved canonical model emits deterministic payloads through three
  different provider surfaces: OpenAI `gpt-image-1`, BFL `flux-2-pro`, and
  SDXL via Replicate.
- Provider divergence is visible but contained in adapters: OpenAI owns native
  `quality`, FLUX owns native `safety`, and SDXL owns adapter-local negative
  prompt / sampler / refiner configuration.
- The MCP `compile_generation` surface can return emitted payloads for all
  three adapters without making provider HTTP calls.

The live-image evidence now exists too: all three examples have OpenAI, FLUX,
and SDXL rendered PNGs checked in beside deterministic metadata. The manifesto's
portability claim is therefore substantiated at both the compile/emit boundary
and the rendered-image boundary for the Phase 5 image surface.

Vocabulary pressure for Phase 6:

- `composition_framing` is useful but not yet proven enough to add; dashboard
  density and documentary observation were expressed through `subject`.
- `texture` and `depth_of_field` remain plausible documentary constructs, but
  neither was necessary to make the Phase 5 example compile meaningfully.
- `negative_intent` should stay out of the canonical model until a second
  provider makes it portable or examples show that adapter configuration is
  insufficient.

Conclusion: the manifesto framing still holds. The next public-unlock gate is
not more abstraction; it is a decision on whether the first vocabulary gaps
deserve Phase 6 MEPs.
