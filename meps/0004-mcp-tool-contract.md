<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# MEP-0004: MCP Tool Contract

**Status:** Draft/Provisional
**Author(s):** Founding maintainer
**Created:** 2026-05-25
**Updated:** 2026-05-25
**Tracking issue:** (assigned at PR merge; see [ADR-0003](../docs/decisions/0003-rfc-and-proposal-format.md))
**Superseded by:** —

> **Status note.** This MEP ships as Draft/Provisional in keeping with the
> project's incubation posture: the tool contracts are implemented and tested
> but should not be treated as frozen before external integrators have
> exercised them. Interfaces marked MUST here are the intended normative target;
> they MAY be revised in a follow-on MEP if integrator experience reveals a
> design defect. Per [ADR-0003](../docs/decisions/0003-rfc-and-proposal-format.md),
> provisional numbering during solo incubation will be reconciled with the
> PR-based process at public unlock.

## Motivation

[MEP-0001](./0001-composition-semantics.md) through
[MEP-0003](./0003-provider-compilation-contract.md) define a composition
algebra, a template inheritance model, and a provider compilation contract.
Those specifications operate at the runtime level. For the Mosvera runtime to
be useful to AI-native systems — agents, copilots, content pipelines,
automated toolchains — it must expose its capabilities over a protocol those
systems already speak. The Model Context Protocol (MCP;
[spec.modelcontextprotocol.io](https://spec.modelcontextprotocol.io)) has
emerged as the standard interface for AI agents to call structured tools with
typed inputs and outputs
([MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)).

This MEP defines the normative contract for the five MCP tools that expose
the Mosvera runtime. It specifies:

- The five tool names and their input/output schemas.
- The closed error taxonomy returned by tools when a call cannot be satisfied.
- The registry-source model: how an aesthetic-system project directory is
  loaded and how per-call inline overrides are merged into it.
- The `merge-strategies.json` surface: its location, shape, and three-layer
  precedence.

This MEP does **not** define:

- The composition algebra, inheritance resolution, or list merge strategies —
  [MEP-0001](./0001-composition-semantics.md).
- Template inheritance rules — [MEP-0002](./0002-inheritance-rules.md).
- The provider compilation contract rule engine —
  [MEP-0003](./0003-provider-compilation-contract.md).
- Provider payload emission (the wire-level API calls) — Phase 4.
- Transport binding beyond stdio; HTTP/SSE transport is deferred to a later
  MEP once external integrators request it.

## Explanation

### Five tools, one registry

The Mosvera MCP server exposes five tools. All five operate against a
**registry** — the in-memory representation of the loaded aesthetic-system
project. The server loads a project directory at startup (see Registry source
model below). A caller MAY supply an inline `registry` argument to any tool;
those entries are merged on top of the loaded project, keyed by document `id`,
with inline entries taking precedence.

The five tools, with their responsibilities:

1. **`list_templates`** — enumerate templates in the effective registry.
2. **`resolve_composition`** — resolve a composition into its canonical
   aesthetic model (MEP-0001).
3. **`get_palette`** — return a named palette's semantic color roles.
4. **`validate_schema`** — validate a document against a Mosvera schema kind.
5. **`compile_generation`** — resolve a composition and apply the MEP-0003
   compilation contract against a provider capability manifest.

### What a tool call looks like

All tools follow the same structural pattern:

1. Parse and validate the caller's input. Malformed input returns an
   `invalid_document` error before any runtime work is done.
2. Pre-flight any registry references. Unknown references return
   `unknown_reference` without invoking the runtime.
3. Invoke the runtime.
4. Return the result as a structured JSON object, or a structured error from
   the closed taxonomy.

Errors are **data** (a JSON object with an `error` field), never thrown across
the MCP boundary. A validation failure from `validate_schema` is a successful
call with `valid: false`, not an error response.

### Documents may be objects or strings

Any argument that accepts a Mosvera document (e.g. `composition`, `document`)
MUST accept either:

- A parsed JSON object.
- A YAML or JSON string; the server parses it before processing.

This allows callers to pass documents read from files without a separate parse
step.

## Internal details

### Tool: `list_templates`

**Input schema**

```json
{
  "registry": { "type": "object", "description": "Inline registry override merged on top of the loaded project, keyed by collection then document id." }
}
```

All properties are optional.

**Output schema**

```json
[
  {
    "name": { "type": "string", "description": "The template id." },
    "extends": { "type": "string", "description": "The $extends parent id, if any." }
  }
]
```

`extends` is present if and only if the template document contains an
`$extends` directive.

**Normative behavior**

A conforming server MUST enumerate every template in the effective registry
(loaded project merged with any inline override). The output order is not
specified; callers MUST NOT depend on ordering.

---

### Tool: `resolve_composition`

**Input schema**

```json
{
  "composition": { "oneOf": [{ "type": "object" }, { "type": "string" }], "description": "Composition document (object or YAML/JSON string)." },
  "registry": { "type": "object" },
  "merge_strategies": { "type": "object", "description": "Per-call inline merge-strategy overrides (third layer; see Merge-strategy precedence)." }
}
```

`composition` is required.

**Output schema — success**

```json
{ "canonical": { "type": "object", "description": "The canonical resolved composition (MEP-0001)." } }
```

**Output schema — error**

See Error taxonomy.

**Normative behavior**

A conforming server MUST:

1. Parse and validate `composition` against `https://mosvera.io/schema/0.1/composition`.
2. Pre-flight all references (`base`, `modifiers` entries) in the effective
   registry; return `unknown_reference` if any are absent.
3. Invoke the runtime composition resolver (MEP-0001) with the composed
   merge strategies (see Merge-strategy precedence).
4. Return `{ "canonical": <result> }` on success.

A conforming server MUST propagate `reference_cycle`, `inheritance_cycle`,
and `multiple_inheritance_unsupported` errors from the runtime without
alteration.

---

### Tool: `get_palette`

**Input schema**

```json
{
  "name": { "type": "string", "description": "The palette id to retrieve." },
  "registry": { "type": "object" }
}
```

`name` is required.

**Output schema — success**

```json
{
  "palette": { "type": "object", "description": "The palette document." },
  "inheritance_unresolved": { "type": "boolean", "description": "Present and true when the palette declares $extends. Palette inheritance is deferred at v0.1." }
}
```

**Output schema — error**

See Error taxonomy (`unknown_reference` when the palette is not found).

**Normative behavior**

A conforming server MUST return the palette document as stored. If the palette
contains an `$extends` directive, the server MUST NOT attempt to resolve the
inheritance chain (palette inheritance is deferred; see
[ADR-0011 §D4](../docs/decisions/0011-mcp-surface-design.md)). Instead,
the server MUST include `"inheritance_unresolved": true` in the response.

---

### Tool: `validate_schema`

**Input schema**

```json
{
  "document": { "oneOf": [{ "type": "object" }, { "type": "string" }], "description": "Document to validate (object or YAML/JSON string)." },
  "kind": {
    "type": "string",
    "enum": ["composition", "template", "modifier", "palette", "capability-manifest"],
    "description": "The Mosvera schema kind to validate against."
  }
}
```

Both properties are required.

**Output schema**

```json
{
  "valid": { "type": "boolean" },
  "errors": {
    "type": "array",
    "items": {
      "path": { "type": "string", "description": "JSON Pointer to the failing location." },
      "message": { "type": "string" }
    }
  }
}
```

**Normative behavior**

A conforming server MUST validate the document against the JSON schema
identified by `kind`, mapped to the canonical schema URI
`https://mosvera.io/schema/0.1/<kind>`. A validation failure MUST be
returned as `{ "valid": false, "errors": [...] }` — a successful call result.
The server MUST NOT return an error response for a structurally invalid
document; `invalid_document` errors are reserved for cases where the document
cannot be parsed at all (e.g. malformed YAML/JSON string).

---

### Tool: `compile_generation`

**Input schema**

```json
{
  "composition":     { "oneOf": [{ "type": "object" }, { "type": "string" }] },
  "provider":        { "type": "string", "description": "Provider id; matched against loaded manifests." },
  "registry":        { "type": "object" },
  "manifest":        { "type": "object", "description": "Inline capability manifest; overrides the loaded manifest for this provider." },
  "criticality":     { "type": "object", "additionalProperties": { "enum": ["required", "optional"] }, "description": "Per-construct criticality override." },
  "merge_strategies": { "type": "object" },
  "emit":             { "type": "boolean", "description": "When true, return deterministic adapter emission for a registered provider." }
}
```

`composition` and `provider` are required. All other properties are optional.

**Output schema — compiled**

```json
{
  "status":   { "const": "compiled" },
  "warnings": { "type": "array", "items": { "construct": "string", "action": "string" } },
  "canonical": { "type": "object" }
}
```

**Output schema — emitted**

```json
{
  "status":   { "const": "compiled" },
  "canonical": { "type": "object" },
  "emission": {
    "type": "object",
    "properties": {
      "payload": { "type": "object" },
      "prompt": { "type": "string" },
      "warnings": { "type": "array" },
      "provenance": { "type": "object" }
    }
  }
}
```

**Output schema — required construct unsupported**

```json
{
  "status":    { "const": "error" },
  "error":     { "const": "required_unsupported" },
  "construct": { "type": "string", "description": "The construct that could not be fulfilled." },
  "canonical": { "type": "object" }
}
```

**Output schema — error**

See Error taxonomy.

**Normative behavior**

A conforming server MUST:

1. Parse and validate `composition`.
2. Pre-flight all references.
3. Resolve the manifest: use `manifest` if supplied inline; otherwise look up
   `provider` in the loaded project manifests, then in the registered adapter
   manifest when available. Return `unknown_provider` if neither is available.
4. Validate the resolved manifest against
   `https://mosvera.io/schema/0.1/capability-manifest`.
5. Resolve the composition to a canonical model.
6. Apply the MEP-0003 compilation contract rule engine.
7. If `emit` is false or absent, return the contract decision (compiled or
   error) plus the canonical model.
8. If `emit` is true, require a registered adapter for `provider`, call
   `adapter.emit(canonical, { criticality })`, and return the deterministic
   `EmissionResult` plus the canonical model.

The reference server MUST register the Phase 4 adapters
`openai-gpt-image-1` and `bfl-flux-2-pro` in its default context.

A conforming server MUST NOT make any provider HTTP call. The tool boundary is
deterministic compile/emit; provider execution remains outside MCP.

---

### Registry source model

An aesthetic-system **project directory** provides the default registry for
all tool calls. At startup, the server reads every document file in the
directory, classifies each by its `$schema` identifier (with a filename-prefix
fallback of `template.*`, `modifier.*`, `palette.*`, and `*.manifest.*`),
validates it against the corresponding schema kind, and indexes it by its own
`id` field. The document `id` — not any segment of the filename — is the
registry key. Specifically, the server loads:

- Template documents into the template collection, keyed by `id`.
- Modifier documents into the modifier collection, keyed by `id`.
- Palette documents into the palette collection, keyed by `id`.
- Capability manifests (conventionally under a `manifests/` subdirectory) into
  the manifest collection, keyed by `provider`.
- The file `merge-strategies.json` at the directory root, if present, as the
  project-level strategy declarations.

A conforming server MUST validate each document on load and fail loudly,
naming the offending file, if any document is invalid. It MUST hold the loaded
result in memory for the lifetime of the server. Per-call `registry` arguments
MUST be merged on top of the loaded collections, keyed by document `id`;
inline entries take precedence over loaded files.

The default project directory for the reference implementation is
`spec/examples/cinematic-editorial/` (resolved relative to the server
binary). It MAY be overridden with `--registry <dir>` at launch.

---

### Merge-strategy precedence

Merge strategies resolve in three layers, applied in order from lowest to
highest precedence:

1. **Schema-derived defaults** — the `deriveStrategies` helper reads
   `x-mosvera-merge` annotations from the field schemas and produces a
   base strategy table. Fields without an annotation default to `replace`.
2. **Project strategies** — `merge-strategies.json` at the project
   directory root declares project-level overrides. It MUST be a JSON object
   with field names as keys and strategy objects as values.
3. **Per-call inline** — the `merge_strategies` argument on
   `resolve_composition` and `compile_generation` provides the highest-
   priority override, applied only to that call.

**`merge-strategies.json` shape**

```json
{
  "<field-name>": { "strategy": "replace" | "append" | "merge_by", "key": "<key-field>" }
}
```

`key` is required when `strategy` is `merge_by` and MUST name a field
present in each list element. For `replace` and `append`, `key` is
ignored.

**Example**

```json
{
  "lights": { "strategy": "merge_by", "key": "name" }
}
```

This declares that the `lights` field (an array of light-descriptor objects)
MUST be merged by the `name` key rather than replaced wholesale.

**Limitation.** Because the Mosvera aesthetic vocabulary is open at v0.1
(project authors may define arbitrary field names), two projects MAY declare
conflicting strategies for the same conceptual field. There is currently no
cross-project reconciliation mechanism. When the aesthetic vocabulary is
frozen in a later revision, `deriveStrategies` will become authoritative for
all vocabulary fields, eliminating the conflict surface for those fields.

---

### Error taxonomy

The closed set of error codes returned by Mosvera MCP tools. All errors are
returned as data (`{ "error": "<code>", "detail": { … } }`), never as
exceptions.

| Code | Cause | `detail` fields |
|------|-------|----------------|
| `invalid_document` | A document failed schema validation or could not be parsed. | `errors`: array of `{ path, message }` |
| `unknown_reference` | One or more `base` or modifier references are not in the effective registry. | `missing`: array of reference ids |
| `unknown_provider` | The named provider has no manifest in the loaded registry and none was supplied inline. | `provider`: the unknown id |
| `inheritance_cycle` | A template `$extends` chain forms a directed cycle. | (none required) |
| `reference_cycle` | A composition reference graph contains a directed cycle. | (none required) |
| `multiple_inheritance_unsupported` | A template declares more than one `$extends` parent. | (none required) |

The code `required_unsupported` is a compilation outcome returned by
`compile_generation` with `status: "error"`, not a call-level error; it is
not part of the closed taxonomy above.

A conforming server MUST NOT return any error code outside this set for a
call-level error.

## Trade-offs and mitigations

- **Closed error taxonomy.** The taxonomy is small and fixed, which limits
  expressiveness but ensures callers can handle every possible error without
  open-ended pattern matching. **Mitigation:** `detail` carries structured
  supplementary data (e.g. `missing` reference ids) without expanding the
  taxonomy.

- **`unknown_reference` at the MCP layer.** The runtime currently raises
  `reference_cycle` for a missing reference in some code paths; rather than
  change the runtime's normative error set (which would propagate to the
  Python port and conformance vectors), the MCP layer pre-flights references
  and emits the clearer `unknown_reference` code before invoking the runtime.
  See [ADR-0011 §D2](../docs/decisions/0011-mcp-surface-design.md) for the
  full decision record.

- **Palette inheritance deferred.** `get_palette` flags unresolved `$extends`
  with `inheritance_unresolved: true` rather than resolving it, because the
  runtime's inheritance resolver operates only over the template collection at
  v0.1. Callers receive the stored palette immediately and can make an
  informed decision. **Mitigation:** the flag is explicit and in-band; callers
  are not silently handed an incomplete value.

- **stdio only.** HTTP/SSE transport is deferred. This is appropriate for
  editor and agent integrations (the primary initial consumers) but limits
  deployment options. **Mitigation:** the MCP SDK separation between transport
  and server logic means adding HTTP/SSE transport is an additive change that
  does not alter the tool contracts defined here.

- **Execution boundary in `compile_generation`.** The tool may emit a provider
  payload when `emit: true`, but it never executes that payload. Callers
  working toward actual generation still cross a separate adapter `execute()`
  boundary. This keeps the MCP response deterministic and inspectable.

## Prior art and alternatives

The five-tool surface was designed by analogy with MCP tool design guidance
([MCP specification](https://spec.modelcontextprotocol.io)) and the principle
stated in [ADR-0007](../docs/decisions/0007-reference-runtime-language.md)
that "small, composable tools with strict schemas and clear errors" are
preferred over broad do-everything calls.

**Alternative considered: single-tool `aesthetic` dispatcher.** A single tool
accepting a `method` discriminator would reduce the MCP manifest size but
would make input/output schemas dependent on the runtime value of `method` —
a pattern the MCP specification's strict-schema requirement disfavors
([MCP TypeScript SDK §tool registration](https://github.com/modelcontextprotocol/typescript-sdk)).
Rejected in favor of one tool per distinct operation.

**Alternative considered: stateless registry (no loaded project).** Tools
could require a full inline `registry` on every call, removing server-side
state. This would eliminate the `--registry <dir>` flag but increase call
payload sizes significantly and force callers to manage the registry
themselves. The stateful loaded-project model is the pattern used by
comparable tool servers (language servers, build servers) and matches how
aesthetic systems are actually authored — as project directories.
([npm workspaces documentation](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
provides the workspace composition model that informed the registry-plus-
override approach.)

**Alternative considered: per-call `merge-strategies.json` path.** Rather
than a project-level `merge-strategies.json` loaded at startup, strategies
could be passed per-call. Rejected: project-level strategy declarations are
the stable contract for a given aesthetic system. Per-call strategies are the
override mechanism; they are already supported as the third layer. The
project-level file exists precisely to avoid callers needing to repeat stable
declarations on every call.

Per [Doctrine 5 (Research-first)](../CLAUDE.md#5-research-first), at least
three authoritative sources informed this design:

1. The MCP specification defines the tool-call pattern (strict schemas, typed
   responses) that this MEP targets.
   ([Model Context Protocol specification](https://spec.modelcontextprotocol.io))
2. The MCP TypeScript SDK provides the reference tool-registration API and
   transport model against which this MEP is implemented.
   ([MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk))
3. npm workspaces informed the registry-plus-override composition model, where
   a root project declares stable configuration and per-call overrides act as
   a workspace-local layer.
   ([npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces))

## Open questions

1. **HTTP/SSE transport.** When should an HTTP/SSE transport variant ship —
   demand-driven (first external integrator request) or proactively in a
   follow-on minor? The stdio-first approach is appropriate for editor/agent
   integrations; it becomes a limitation for server-deployed pipelines.
2. **Streaming responses.** `resolve_composition` and `compile_generation`
   are currently request/response. If registries grow large enough that
   resolution takes perceptible time, streaming progress events may be
   valuable. Deferred until an actual performance case appears.
3. **Provenance in `resolve_composition`.** MEP-0001 §Legibility guarantee
   notes that a conforming runtime SHOULD be able to report which layer set
   each field. Should `resolve_composition` expose an optional `provenance`
   output alongside `canonical`? This would satisfy the legibility guarantee
   at the tool layer. Deferred to a follow-on revision after integrator
   experience.
4. **Palette inheritance.** The `inheritance_unresolved` flag is a temporary
   accommodation. When the runtime resolver is generalized to operate over
   palette collections as well as template collections, `get_palette` SHOULD
   resolve `$extends` transparently and drop the flag. A follow-on runtime
   minor is the appropriate vehicle.

## Future possibilities

- **HTTP/SSE transport** (additive; no tool-contract change required).
- **`resolve_composition` provenance mode** — report which layer in the
  precedence chain set each field in the canonical model (MEP-0001 legibility
  guarantee).
- **`explain_compilation` tool** — return the full lowering-action table for
  every construct in the canonical model against a given provider, without
  requiring a composition.
- **Palette inheritance resolution** in `get_palette` once the runtime
  resolver generalizes beyond templates.
- **Registry caching / hot-reload** — the loaded project is currently fixed
  at startup; a follow-on feature could support reloading on signal for
  development workflows.

## Sources

1. [Model Context Protocol specification](https://spec.modelcontextprotocol.io) — normative MCP protocol definition; defines the tool-call pattern, strict-schema requirement, and transport model this MEP targets.
2. [MCP TypeScript SDK (GitHub)](https://github.com/modelcontextprotocol/typescript-sdk) — reference implementation of the tool registration API and stdio transport; the SDK this MEP is implemented against.
3. [npm workspaces documentation](https://docs.npmjs.com/cli/v10/using-npm/workspaces) — informed the registry-plus-override composition model: a root loaded project with per-call overrides as the higher-precedence layer.
4. [MEP-0001: Composition Semantics](./0001-composition-semantics.md) — defines the merge algebra, list-merge strategies, and precedence chain that `resolve_composition` implements.
5. [MEP-0003: Provider Compilation Contract](./0003-provider-compilation-contract.md) — defines the rule engine that `compile_generation` applies against a capability manifest.
6. [ADR-0007: Reference Runtime Language](../docs/decisions/0007-reference-runtime-language.md) — records the TS-first decision and the "small, composable tools with strict schemas and clear errors" design directive.
7. [ADR-0011: MCP Surface Design](../docs/decisions/0011-mcp-surface-design.md) — records the six design decisions (D1–D5 plus manifest-driven compilation) behind the Phase-3 MCP implementation.
