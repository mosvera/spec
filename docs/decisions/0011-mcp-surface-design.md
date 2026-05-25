# ADR-0011: MCP Surface Design

**Status:** Accepted
**Date:** 2026-05-25
**Doctrines invoked:** Public-first, Adoption-over-convenience, Spec-neutrality, Research-first, Academic-grade documentation

## Context

Phase 3 ships the Mosvera MCP server (`@mosvera/mcp`), exposing the Phase 2
reference runtime as five MCP tools over stdio. The implementation required
six non-trivial design decisions whose rationale needs to be on record:

- **D1** — how the MCP package and the runtime package share types in a
  monorepo structured for an eventual repository split.
- **D2** — where the `unknown_reference` error belongs: at the MCP boundary
  or inside the runtime.
- **D3** — how merge-strategy declarations layer across three sources
  (schema defaults, project file, per-call inline).
- **D4** — whether `get_palette` resolves `$extends` chains in palettes.
- **D5** — what status the normative tool-contract MEP ships with.
- **D6** — that `compile_generation` is manifest-driven (rule engine only)
  with no provider HTTP call in Phase 3.

These decisions interact with ADR-0002 (repository split), ADR-0007
(TypeScript reference runtime), and the MEP-0001 / MEP-0003 semantic model.
Recording them here satisfies [Doctrine 6 (Academic-grade documentation)](../../CLAUDE.md#6-academic-grade-documentation)
and provides a durable reference for contributors who inherit this code.

## Research

**MCP ecosystem and TypeScript SDK.** The Model Context Protocol
specification ([spec.modelcontextprotocol.io](https://spec.modelcontextprotocol.io))
defines tools as structured operations with strict JSON-schema inputs and
outputs, invoked over a transport (stdio or HTTP/SSE). The MCP TypeScript SDK
([github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk))
is the reference implementation that shipped first and currently has the most
active conformance work; it is the SDK `@mosvera/mcp` depends on at v1.27.x.
[ADR-0007](./0007-reference-runtime-language.md) already established that the
reference MCP server should be TS-native and share types with the runtime in
one repo.

**npm workspaces.** npm workspaces
([docs.npmjs.com/cli/v10/using-npm/workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces))
allow multiple packages in one repository to reference each other by name
without publishing. They are the standard mechanism for a TypeScript monorepo
where two packages share types but are deployed independently. The workspace
root `package.json` is `private: true` and contains no publishable code; it
is build tooling for the JS surfaces only.

**Error taxonomy placement.** The decision of where to locate error codes —
inside the core library or at an adapter layer — is a recurring pattern in
layered systems. The principle documented in the Kubernetes API machinery
design is that errors emitted by a layer should reflect that layer's
*semantic contract*, not the implementation details of a lower layer
([Kubernetes API conventions, error types](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/api-conventions.md)).
Changing a lower layer's error taxonomy is a breaking change to its
conformance contract; if the fix can be localized to the adapter layer, it
should be.

**glTF required/optional extension model.** The criticality axis in
`compile_generation` (a construct can be `required` or `optional`) is
structurally identical to glTF's `extensionsRequired` vs `extensionsUsed`
split ([glTF specification §Extensions](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#specifying-extensions)):
a consumer that cannot handle a required extension MUST fail; a consumer that
cannot handle an optional extension SHOULD degrade gracefully. MEP-0003
applies the same model to aesthetic constructs.

## Decision

### D1 — Shared types via a private npm workspace root

The repository root carries a `private: true` `package.json` declaring an
npm workspace that includes `runtime/` and `mcp/`. The `@mosvera/mcp` package
declares `"@mosvera/runtime": "*"` as a dependency; during development this
resolves to the local `runtime/` package via the workspace link.

**Rationale.** Two TypeScript surfaces in one repository need to share types
without publishing. The workspace pattern is the npm-native solution; it
requires no tooling beyond npm ≥ 7 and works correctly with `tsc` project
references. When the [ADR-0002](./0002-top-level-repository-layout.md)
repository split happens, the workspace dependency becomes a published-version
dependency — the consumer-side code in `@mosvera/mcp` is unchanged.

**Alternative considered and rejected: `file:../runtime`.** A `file:`
dependency reference is brittle across package managers (Yarn, pnpm, Bun each
handle it differently) and does not benefit from workspace hoisting. npm
workspaces is the idiomatic solution for this pattern
([npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces)).

**Tension with ADR-0002.** ADR-0002 scopes `src/` per surface to preserve
polyglot extensibility (future Python runtime, Rust adapters). A private
workspace root mildly cuts against that principle because it adds a
JS-specific artifact at the repo root. The mitigation is that the root
`package.json` is `private: true` and contains no publishable code; it is
invisible to non-JS contributors and splits away cleanly with the JS surfaces
when ADR-0002's repository split occurs.

### D2 — `unknown_reference` emitted at the MCP boundary, not the runtime

When a composition references a template or modifier that is not in the
effective registry, the MCP layer pre-flights the references before calling
the runtime and returns `unknown_reference` directly. The runtime is not
invoked for a missing reference.

**Rationale.** In certain resolution code paths the runtime currently raises
`reference_cycle` when it traverses a missing reference (the absence of a
node causes a cycle-detection false positive). Rather than amend the runtime's
normative error set — which would (a) ripple into the 21 conformance vectors
in `spec/compliance/`, (b) obligate the Phase-7 Python port, and (c) require
new conformance test vectors — the MCP layer provides the clear, caller-
friendly `unknown_reference` code at the boundary where the information is
readily available (a registry lookup before any runtime work is done).

**Alternative considered and rejected: fix inside the runtime.** Promoting
`unknown_reference` into the runtime is the theoretically cleaner solution
and remains a future option if a *specification* reason (not mere ergonomics)
justifies it. At v0.1 the cost/benefit is unfavorable: the runtime's error
taxonomy is a normative contract tested by 21 vectors; patching it to
accommodate an MCP-layer convenience would be a breaking change to the
conformance surface for a non-semantic reason. The MCP boundary is the
appropriate home for caller-facing error translation in a layered architecture
(see Kubernetes API conventions in Research above).

### D3 — Three-layer merge-strategy precedence with a normative `merge-strategies.json`

Merge strategies are resolved in three layers, from lowest to highest
precedence:

1. **Schema-derived defaults** — the runtime `deriveStrategies` helper reads
   `x-mosvera-merge` annotations on field schemas and produces a base
   strategy table.
2. **Project strategies** — `merge-strategies.json` at the project directory
   root.
3. **Per-call inline** — the `merge_strategies` argument on
   `resolve_composition` and `compile_generation`.

`merge-strategies.json` MUST be a JSON object with field names as keys and
strategy objects `{ "strategy": "replace"|"append"|"merge_by", "key"?: "..." }`
as values. This file is a **normative project surface**, defined here and
referenced by [MEP-0004](../../spec/meps/0004-mcp-tool-contract.md).

**Rationale.** An aesthetic system author should be able to declare once, in
a project file, that `lights` merges by name — rather than repeating that
declaration on every call. The project file is stable configuration; the
per-call override is the escape hatch. Schema-derived defaults are the
floor that implementations can rely on even in the absence of either of the
upper layers.

**Stated limitation.** Because the Mosvera aesthetic vocabulary is open at
v0.1 (project authors may define arbitrary field names), two independently
authored projects MAY declare conflicting strategies for the same conceptual
field name. There is no cross-project reconciliation mechanism. This conflict
surface is bounded by the planned vocabulary freeze: when the aesthetic
vocabulary is stabilized in a later revision, `deriveStrategies` will be
authoritative for all vocabulary fields, eliminating ambiguity for the stable
fields.

**Alternative considered and rejected: single-layer per-call strategies only.**
Requiring callers to pass `merge_strategies` on every call places a burden on
integrators that is not appropriate for stable aesthetic-system configuration.
The project file exists precisely to avoid that repetition.

### D4 — Palette inheritance deferred; `get_palette` flags `inheritance_unresolved`

Palettes MAY declare `$extends` (the same inheritance directive used by
templates). At v0.1 the runtime resolves `$extends` only over the template
collection. Rather than generalize the inheritance resolver mid-phase
(expanding the conformance surface, potentially breaking the 21 test vectors,
and adding a Python-port obligation), `get_palette` returns the stored palette
document and includes `"inheritance_unresolved": true` in the response when
`$extends` is present.

**Rationale.** The explicit flag is in-band: callers know they are receiving
an un-resolved value and can make an informed decision (use it as-is, reject
it, or defer). The alternative — silently returning an incomplete palette with
no flag — would be a correctness bug masked by a missing feature. The flag is
a documented, clearly temporary accommodation.

**Alternative considered and rejected: resolve palette inheritance immediately.**
Generalizing the runtime resolver to cover palettes would be the complete
solution. It is deferred because (a) it expands the normative runtime contract
and requires new conformance vectors, (b) it is not needed for any Phase-3
use case, and (c) the cinematic-editorial reference example does not exercise
palette `$extends`. It remains a clearly tracked follow-on.

### D5 — MEP-0004 ships as Draft/Provisional

[MEP-0004](../../spec/meps/0004-mcp-tool-contract.md) carries status
`Draft/Provisional` rather than `Provisional` or `Accepted`.

**Rationale.** The tool contracts are implemented and tested (runtime: 38
tests, including the 21 conformance vectors in `spec/compliance/`; mcp: 36
tests; all green), but external integrators have not yet exercised them.
Freezing the interface before real usage data exists would be premature.
`Draft/Provisional` signals: the contracts are the intended normative target
and are consistent with the implementation, but they may be revised if
integrator experience reveals a design defect. This is in keeping with the
project's incubation posture per [ADR-0003](./0003-rfc-and-proposal-format.md).

**Alternative considered and rejected: mark MEP-0004 `Provisional` (same as
MEP-0001 through MEP-0003).** The existing MEPs describe the resolved semantic
model (composition algebra, inheritance, compilation contract) which is
validated by 21 conformance vectors. The tool contracts are an interface layer
one step further from those validated semantics; the additional `Draft` marker
signals the extra degree of uncertainty without undervaluing the specification
work already done.

### D6 — `compile_generation` is manifest-driven; Phase-3 boundary is the contract decision

`compile_generation` applies the MEP-0003 compilation rule engine against a
provider capability manifest and returns the contract decision (lowering
actions, warnings, the canonical model). It makes no provider HTTP call.

**Rationale.** The Phase-3 goal is to expose the runtime's semantic
capabilities over MCP. Actual provider calls introduce network dependencies,
API key management, rate limiting, and error surfaces that are orthogonal to
the semantic contract. Keeping the boundary at the contract decision makes the
Phase-3 tool deterministic, testable, and usable without any provider account.
The canonical model returned by `compile_generation` is the complete input to
any Phase-4 provider adapter, so the boundary is structurally clean.

**Relationship to the glTF required/optional model (see Research).** The
`criticality` input (`required` vs `optional`) maps directly to glTF's
`extensionsRequired` / `extensionsUsed` pattern: a required construct that
cannot be fulfilled returns `status: "error"` (compilation must fail); an
optional construct that cannot be fulfilled returns `status: "compiled"` with
a warning (graceful degradation). The rule engine is defined in MEP-0003.

**Alternative considered and rejected: include a provider HTTP call in Phase
3.** Adding a real provider call in Phase 3 would couple the MCP surface
specification to specific provider APIs before the adapter contract is
finalized in Phase 4. ADR-0008 selects OpenAI gpt-image-1 and FLUX.2 as the
first adapter targets; those adapters belong in Phase 4, not in the tool
contract layer.

## Consequences

- The workspace root `package.json` is `private: true` and MUST NOT be
  published. It is build tooling for the JS surfaces only.
- The MCP layer's `unknown_reference` pre-flight is the normative location
  for that error code. Promoting it into the runtime core remains an option
  for a future revision with a specification-level justification.
- `merge-strategies.json` is now a normative project surface, referenced by
  MEP-0004. Any project directory that declares strategies MUST conform to the
  shape defined in MEP-0004.
- `get_palette` consumers MUST check for `inheritance_unresolved: true` and
  handle unresolved palettes appropriately for their use case.
- `compile_generation` consumers who need an actual provider payload MUST
  wait for Phase 4.
- The Phase-3 test totals are: runtime 38 (including the 21 conformance
  vectors in `spec/compliance/`) and MCP 36 — 74 in total. New tests added in
  subsequent phases MUST NOT break these.

## Sources

1. [Model Context Protocol specification](https://spec.modelcontextprotocol.io) — normative MCP protocol definition; the protocol standard this ADR's implementation targets.
2. [MCP TypeScript SDK (GitHub)](https://github.com/modelcontextprotocol/typescript-sdk) — reference TS SDK for tool registration and stdio transport; the dependency `@mosvera/mcp` uses at v1.27.x.
3. [npm workspaces documentation](https://docs.npmjs.com/cli/v10/using-npm/workspaces) — the workspace mechanism used for D1 (shared types via private root `package.json`).
4. [Kubernetes API conventions — error types (SIG API Machinery)](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/api-conventions.md) — the principle that a layer's errors should reflect that layer's semantic contract, not lower-layer implementation details; informs D2 (unknown_reference at the MCP boundary).
5. [glTF 2.0 specification §Extensions (Khronos)](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#specifying-extensions) — the required/optional extension model that MEP-0003 and D6 apply to aesthetic constructs.
6. [ADR-0007: Reference Runtime Language](./0007-reference-runtime-language.md) — established the TS-first decision and the requirement that the MCP server share types with the runtime in one repo; D1 implements that requirement.
7. [ADR-0002: Top-Level Repository Layout](./0002-top-level-repository-layout.md) — defines the eventual repository split; D1's private workspace root is designed to split cleanly with the JS surfaces at that boundary.
