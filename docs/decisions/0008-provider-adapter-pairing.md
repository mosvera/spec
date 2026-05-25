# ADR-0008: Phase-4 Provider Adapter Pairing

**Status:** Accepted
**Date:** 2026-05-24
**Doctrines invoked:** Public-first, Adoption-over-convenience, Spec-neutrality, Research-first

## Context

Mosvera Phase 4 ships two provider adapters as the first interoperability proof. The purpose of the pair is to demonstrate that a single canonical aesthetic composition compiles cleanly into two genuinely different provider parameter surfaces — i.e., to prove the abstraction is real and not an OpenAI-shaped DSL with extra steps.

Selection criteria:
- **Surface divergence** — the two providers should expose meaningfully different parameter shapes so the modifier/inheritance model is stressed.
- **Contributor friction** — API access, documentation quality, sane error responses, no waitlist or enterprise-only gating.
- **License safety** — terms of service must allow shipping a public adapter that exercises the API on contributors' own keys.
- **Open/closed mix** — pairing a closed-weights API with an open-weights model exposes a useful axis (local vs. hosted, deterministic seeding vs. server-side moderation, etc.).

Provisional pick: OpenAI + Flux. This ADR validates the pairing against the 2026 generative image API landscape.

## Research

**The 2026 landscape:**

- **OpenAI gpt-image-1** (replaced DALL·E 3 as the production image API). Documented parameters: `prompt`, `n`, `size` (`1024x1024`, `1536x1024`, `1024x1536`, `auto`), `quality` (`low | medium | high`), `output_format` (`png | jpeg | webp`), `output_compression`, `moderation` (`auto`), `stream`. Multimodal — accepts image inputs as well as text. Closed model, strong tooling, OpenAI Python and Node SDKs are reference-quality. Server-side moderation is non-bypassable.

- **Black Forest Labs FLUX.2** (blog post November 2025; `flux-2-pro`, `flux-2-flex`, `flux-2-klein`). Async polling architecture (`api.bfl.ai` issues a request, returns `polling_url`, client polls until ready). Documented parameters: `prompt`, `width`, `height`, `steps`, `guidance` (CFG scale), `seed`, `safety_tolerance`, `output_format`, `input_image` (editing). Regional endpoints (`api.us.bfl.ai`, `api.eu.bfl.ai`). FLUX.2 `klein` is open-weights under Apache 2.0; `pro` is closed-API. Native image editing via `input_image` on all FLUX.2 endpoints.

- **Stability AI** ships SDXL, SD3, and Stable Image API via `platform.stability.ai`. SDXL weights are under CreativeML Open RAIL++-M (commercial-allowed with use-based restrictions); SDXL Turbo is non-commercial. The official API surface is well-documented but Stability's product roadmap has been turbulent. SDXL via Replicate is the path-of-least-resistance for an open-weights demo.

- **Runway Gen-4** focuses on video; image generation is a secondary capability. Parameters skew toward video-native concerns (`duration`, `length`, camera-control directives, reference imagery). Strong API docs at `docs.dev.runwayml.com`. Excellent stress test for "the abstraction must survive temporal dimensions," but premature for Phase 4 image-first proof.

- **Midjourney** has no broadly available public API as of March 2026; access is restricted to Enterprise applicants. Unofficial third-party APIs risk account bans. **Excluded for licensing reasons** — we cannot ship a public adapter against an unofficial endpoint and remain in good standing.

- **Google Imagen, Adobe Firefly** — gated behind cloud accounts (GCP, Adobe Creative Cloud) with non-trivial onboarding friction; bad fit for "stranger clones the repo, runs the demo."

- **Aggregators (Replicate, Fal.ai, Together AI)** — useful as transport but provide *less* surface divergence per provider, since the aggregator normalizes a lot. Good as a fallback path to SDXL/SD3, not as the primary demonstration.

**Surface-divergence analysis** between candidate pairs:
- OpenAI vs. FLUX: differs on transport (sync POST vs async polling), parameter naming (`quality` enum vs `steps`+`guidance` numerics), output controls (`output_format`+`output_compression` vs `output_format` alone), moderation model (server-enforced vs `safety_tolerance` numeric), and image-input semantics (multimodal input vs `input_image` edit param). Strong divergence on every axis.
- OpenAI vs. SDXL-via-Replicate: differs on closed-vs-open weights, sampler/scheduler exposure (SDXL exposes them, OpenAI hides them), seed determinism (SDXL deterministic; OpenAI not). Strong divergence but Replicate's normalization layer dilutes the demonstration somewhat.
- FLUX vs. SDXL: both are diffusion-family; the divergence is smaller (both expose `steps`, `guidance`, `seed`).

**Licensing safety:**
- OpenAI: terms allow building applications against the API; no obstacle to a public adapter that runs on the contributor's own key.
- FLUX (BFL hosted API): TOS permits API integration; FLUX.2 `klein` weights are Apache 2.0; FLUX.1 dev weights are non-commercial. Adapter targeting the *hosted API* avoids weight-license issues entirely.
- SDXL CreativeML Open RAIL++-M: commercial OK with use-based restrictions; adapter is fine.
- Midjourney: blocked, see above.

## Decision

**Phase 4 ships two adapters: OpenAI (`gpt-image-1`) and Black Forest Labs (`flux-2-pro` via the hosted BFL API).**

This pairing is confirmed because:

1. **Maximum surface divergence among the practical candidates.** Sync request/response vs async polling-URL transport, enum-coded quality vs numeric steps/guidance, fundamentally different moderation models, different image-input semantics. The compiler must reconcile genuinely different shapes — exactly the stress the abstraction needs.
2. **Lowest contributor friction.** Both providers have self-service API keys, no waitlist, sane error responses, official documentation, and first-party Python + TS SDKs the adapters can sit on top of.
3. **No licensing obstacles.** Both adapter implementations target hosted APIs under standard commercial TOS that explicitly permits programmatic use.
4. **Useful market coverage.** OpenAI is the default for AI-native app developers; FLUX is the strongest non-OpenAI hosted image API in late 2025 / 2026 and the credible alternative for teams who explicitly want non-OpenAI lineage. Demonstrating Mosvera against both addresses the two largest hosted-image audiences.
5. **Open-weights coverage deferred but not abandoned.** SDXL via Replicate will land as the **first community adapter** post-Phase-4 (target: Phase 5), giving us the closed/open axis without overloading Phase 4. FLUX.2 `klein` (Apache 2.0) is a candidate for a future *local-weights* adapter, which would let Mosvera demonstrate the same composition compiling to a self-hosted execution surface.
6. **Runway Gen-4 deferred to Phase 6 (motion).** Runway is the natural adapter for when Mosvera introduces motion/temporal primitives. Adding it in Phase 4 would dilute the image-generation demonstration.
7. **Midjourney explicitly excluded** until/unless a broadly available official API ships. Unofficial integrations are a license-doctrine violation.

The provisional OpenAI + Flux pick **survives research, with FLUX.2-pro specified as the FLUX target** (not FLUX.1-pro) since FLUX.2 is the current generation as of the November 2025 launch and ships an image-editing surface (`input_image`) that's interesting to model in the spec.

## Consequences

- The Phase 4 compiler contract must abstract over **sync vs async transport** — this is a real shape the spec needs to address, not hand-wave.
- The Phase 4 compiler contract must abstract over **moderation models** — server-side enum vs client-tunable numeric. We'll need a canonical `safety` modifier with documented per-provider mapping.
- The Phase 4 compiler contract must abstract over **quality controls** — enum (OpenAI) vs numeric pair (`steps`, `guidance` in Flux). We'll need a canonical `quality` modifier with documented compilation rules.
- Adapter implementations should sit on top of each provider's official SDK, not raw HTTP, to inherit error semantics and retry behavior.
- Examples in the Phase 4 release must include at least one composition that compiles successfully to *both* adapters with visibly comparable output, to make the abstraction claim concretely demonstrable.
- The Phase 5 plan should land the SDXL-via-Replicate adapter to introduce the open-weights / community-aggregator axis.
- The Phase 6 plan should land the Runway adapter once Mosvera's motion primitives are designed.
- We must add a documented exclusion policy: Mosvera will not accept provider adapters that rely on unofficial / reverse-engineered APIs (closes the door on Midjourney via third parties).

## Sources

1. [OpenAI Image Generation API guide](https://developers.openai.com/api/docs/guides/image-generation) and [GPT Image 1 model reference](https://developers.openai.com/api/docs/models/gpt-image-1) — authoritative parameter surface for the OpenAI adapter (`size`, `quality`, `output_format`, `output_compression`, `moderation`, `n`, `stream`).
2. [Black Forest Labs FLUX API integration guide](https://docs.bfl.ml/api_integration/integration_guidelines) — authoritative documentation of the async polling architecture, regional endpoints, and parameter surface for the Flux adapter.
3. [FLUX.2: Frontier Visual Intelligence (BFL blog)](https://bfl.ai/blog/flux-2) — confirms FLUX.2 is the current generation (pro / flex / klein), Apache 2.0 for `klein`, and the unified `input_image` editing surface.
4. [Does Midjourney Have an API? (10b.ai, 2026)](https://10b.ai/blog/does-midjourney-have-an-api) — confirms Midjourney has no broadly available public API and unofficial APIs violate TOS, supporting the exclusion decision.
5. [Stable Diffusion XL license (Hugging Face)](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md) — CreativeML Open RAIL++-M, commercial-allowed with use-based restrictions; supports the Phase 5 deferral of SDXL via Replicate.
6. [Runway Gen-4 API documentation](https://docs.dev.runwayml.com/) and [Runway Gen-4 research announcement](https://runwayml.com/research/introducing-runway-gen-4) — confirms Runway's video-primary surface and `duration`/`length`/reference-imagery parameter shape, justifying deferral to a future motion-primitives phase.
7. [Replicate SDXL API reference](https://replicate.com/stability-ai/sdxl) — practical access path for the future SDXL community adapter once Phase 5 lands.
