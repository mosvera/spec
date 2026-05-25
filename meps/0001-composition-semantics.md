<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# MEP-0001: Composition Semantics

**Status:** provisional
**Author(s):** Founding maintainer
**Created:** 2026-05-24
**Updated:** 2026-05-24
**Tracking issue:** (assigned at PR merge; see [ADR-0003](../docs/decisions/0003-rfc-and-proposal-format.md))
**Superseded by:** —

> **Numbering note.** Per [ADR-0003](../docs/decisions/0003-rfc-and-proposal-format.md),
> MEPs are numbered by PR number at merge time. During solo incubation
> this MEP is committed directly and carries the provisional number
> `0001` (matching the roadmap's reference to composition-semantics as
> the first specification proposal). The number will be reconciled with
> the PR-based process at public unlock.

## Motivation

Mosvera models aesthetic intent as a small set of primitives — templates,
palettes, modifiers, and compositions (see [`GLOSSARY.md`](../GLOSSARY.md)).
These primitives are only useful if they **combine** predictably. A
composition is the assembly of a base template with an ordered set of
modifiers; the runtime must resolve that assembly into a single canonical
model that a provider adapter can compile (deferred to
[MEP-0003](./0003-provider-compilation-contract.md)).

Composition is the foundational operation of the entire system. Inheritance
between templates (deferred to
[MEP-0002](./0002-inheritance-rules.md)) reuses the same merge algebra
defined here. Provider compilation consumes the canonical model this MEP
produces. Every downstream surface — runtime, MCP, providers, examples —
binds to the semantics defined in this document. Getting it right, and
getting it precise, is the highest-leverage decision in the specification.

The free-text-prompt status quo composes poorly: you cannot meaningfully
merge two prompt strings, you cannot express "remove this aspect," and you
cannot reason about which fragment wins when two conflict. This MEP defines
a merge algebra with explicit, total, legible precedence so that aesthetic
intent becomes a structural artifact rather than a string.

This MEP does **not** define:

- How templates inherit from other templates (the `$extends` mechanism) —
  that is [MEP-0002](./0002-inheritance-rules.md), which reuses the merge
  operation defined here.
- How a resolved composition compiles to provider-specific payloads — that
  is [MEP-0003](./0003-provider-compilation-contract.md).
- The concrete field schemas of templates, palettes, and modifiers — those
  live in [`spec/schemas/`](../schemas/) and reference the merge-strategy
  declarations this MEP requires.

## Explanation

### The aesthetic object

Every Mosvera primitive is, at the structural level, a JSON/YAML object
with `snake_case` field names and `$`-prefixed directive keys, per
[ADR-0005](../docs/decisions/0005-schema-naming-conventions.md). The
composition semantics operate on these objects without privileged
knowledge of any specific field — composition is structural, and the field
*meanings* live in the schemas.

### The composition document

A composition references a base template and an ordered list of modifiers,
and may carry inline overrides:

```yaml
# composition document (illustrative; field schemas are defined elsewhere)
$schema: mosvera/composition/v0.1
base: cinematic-editorial          # reference to a template
modifiers:                         # ordered; later entries take precedence
  - magic-hour
  - rain-slick
overrides:                         # highest precedence; inline
  palette:
    accent: "#c0563a"
```

References (`base`, entries in `modifiers`) name other primitives. They are
resolved lazily into a canonical model (see Internal details), following the
Design Tokens Community Group precedent of preserving references until the
value is actually needed ([DTCG §7.2](https://www.designtokens.org/tr/drafts/format/)).

### What resolution produces

Resolving a composition yields a **canonical resolved composition**: a
single, fully-merged aesthetic object with every reference resolved and
every modifier applied, in deterministic precedence order. This canonical
model is the contract handed to provider adapters in
[MEP-0003](./0003-provider-compilation-contract.md).

### The precedence chain

Resolution establishes a **total precedence order**, lowest to highest:

1. The base template.
2. Each modifier, in the order declared in the `modifiers` list. A modifier
   later in the list has higher precedence than one earlier.
3. The composition's inline `overrides` block (highest precedence).

This mirrors the two systems that get precedence right by leaving nothing
undefined: the CSS cascade's total sort order
([CSS Cascading and Inheritance Level 4 §6.1](https://www.w3.org/TR/css-cascade-4/#cascade-sort))
and Terraform's documented variable-precedence ladder
([Terraform Input Variables](https://developer.hashicorp.com/terraform/language/values/variables)).
The tiebreaker — declared list order — is explicit and total: there is never
a case where "which modifier wins" is undefined.

**The order you write is the order that wins.** A modifier declared later
overrides one declared earlier; the inline `overrides` block overrides every
modifier. This is a deliberate, load-bearing guarantee (see Trade-offs):
composition precedence is *local* and *legible*, derivable entirely from the
document in front of you, in the order you wrote it. This is the opposite of
Tailwind's decoupling of authoring order from output precedence (which
spawned the `tailwind-merge` workaround,
[tailwind-merge](https://github.com/dcastil/tailwind-merge)) and Sass
`@extend`'s action-at-a-distance precedence
([Sass @extend](https://sass-lang.com/documentation/at-rules/extend/)).

### No un-overridable importance flag

Mosvera deliberately provides **no** `!important`-equivalent — no flag that
makes a value win regardless of precedence. CSS's `!important` short-circuits
specificity and produces escalation wars where the only way to beat
`!important` is more `!important`
([MDN: Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade)).
Precedence in Mosvera is always determined by position in the chain, which is
always overridable by a later position. There is no escape hatch, by design.

## Internal details

### The merge operation

The core of the algebra is a single binary operation, `merge(base, overlay)`,
producing a result. Resolution folds the precedence chain left-to-right with
this operation:

```
resolve(chain) = reduce(merge, chain)
              = merge(merge(merge(template, mod₁), mod₂), …, overrides)
```

The fold is left-associative and the chain order is the declared precedence
order, so the result is deterministic.

`merge(base, overlay)` is defined recursively. For each key present in
`overlay`:

1. **Directive keys** (`$`-prefixed) are interpreted, not merged (see
   Directives below).
2. **Key absent from `base`** → the overlay's key/value is added to the
   result.
3. **Both values are objects** → recurse: `merge(base[key], overlay[key])`.
4. **Both values are lists** → apply the list-merge strategy declared for
   that field (see List merge).
5. **Otherwise** (scalar, or a type mismatch between base and overlay) → the
   overlay value **replaces** the base value.

Keys present in `base` but absent from `overlay` are preserved unchanged.
This is the deep-merge model of JSON Merge Patch
([RFC 7396 §2](https://datatracker.ietf.org/doc/html/rfc7396)), refined with
schema-aware list handling and explicit deletion (below) to avoid that
format's two documented weaknesses: array blindness and `null`-overloading.

### List merge

Lists are where merge algebras most often fail (see Prior art). Mosvera
requires that the merge behavior of every list-valued field be **explicitly
determined by its schema** — never inferred, never silently defaulted in a
way the author cannot see. This follows the Kubernetes Strategic Merge Patch
lesson: merge semantics belong in the schema, and the failure mode to avoid
is silent fallback to "replace the whole list" when metadata is missing
([Kubernetes SMP](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/strategic-merge-patch.md)).

A schema MUST declare one of three strategies for each list-valued field:

- **`replace`** — the overlay list replaces the base list entirely. This is
  the **default** when a schema does not declare otherwise. The default is
  total and documented (here); it is not a contingent or invisible fallback.
- **`append`** — the overlay list's elements are appended to the base list,
  in order. No deduplication.
- **`merge_by: <key>`** — elements are correlated by the value of `<key>`.
  An overlay element whose key matches a base element is deep-merged onto it
  via `merge`; an overlay element with a new key value is appended. This is
  identity-based, **not** index-based, so it is stable under reordering —
  the central improvement of Strategic Merge Patch over JSON Patch's
  positional operations
  ([RFC 6902 §4.1](https://datatracker.ietf.org/doc/html/rfc6902)).

Implementations MUST NOT merge list elements by position. Index-based merge
corrupts silently when a list shifts, which is precisely why Kubernetes moved
to keyed merging.

### Deletion and rollback directives

Deletion requires a dedicated primitive. Mosvera does **not** overload any
legal aesthetic value (e.g. `null`) as a deletion sentinel — RFC 7396 did,
and had to warn in its own text that the format is "not appropriate" for
documents that use real `null`
([RFC 7396 §1](https://datatracker.ietf.org/doc/html/rfc7396)). Instead:

- **`$unset`** — an overlay object MAY contain `$unset: [field_name, …]`. Each
  named field is removed from the result of merging that object. `$unset`
  is evaluated after the object's other keys are merged.
- **`$revert`** — an overlay object MAY contain `$revert: [field_name, …]`,
  which rolls a field back to the value it had **before this overlay layer**
  contributed — a partial rollback of just this layer's effect, modeled on
  CSS `revert`
  ([CSS Cascading and Inheritance Level 4 §7.3.4](https://www.w3.org/TR/css-cascade-4/#valdef-all-revert)).
  `$revert` removes the current layer's contribution to the named field
  without disturbing lower layers, distinct from `$unset` (which removes the
  field entirely) and from a total reset to a schema default.

Directive keys are reserved by [ADR-0005](../docs/decisions/0005-schema-naming-conventions.md);
user-defined fields MUST NOT begin with `$`.

### Reference resolution and the DAG requirement

`base` and `modifiers` entries are references to other primitives. The
runtime resolves them lazily into the canonical model rather than eagerly
flattening at authoring time, preserving aesthetic intent symbolically
across the toolchain (DTCG lazy-resolution model,
[DTCG §7.2](https://www.designtokens.org/tr/drafts/format/)).

The reference graph MUST be a directed acyclic graph. Cycle detection is a
**conformance requirement, not a quality-of-implementation nicety**: if a
composition's reference graph contains a cycle, a conforming runtime MUST
report an error identifying the cycle and MUST NOT emit a canonical model.
DTCG makes the same requirement of design-token references
([DTCG §7.2.3](https://www.designtokens.org/tr/drafts/format/)): circular
references render the affected values undefined and MUST error.

### Resolution algorithm (normative)

A conforming runtime MUST resolve a composition as follows:

1. Parse the composition document and validate it against its schema.
2. Resolve all references (`base`, `modifiers`), constructing the reference
   graph. If a cycle is detected, error and stop.
3. Construct the precedence chain: `[base, modifier₁, …, modifierₙ, overrides]`,
   omitting `overrides` if absent.
4. Left-fold the chain with `merge`, applying list-merge strategies and
   `$unset`/`$revert` directives as defined above.
5. Emit the canonical resolved composition.

### Determinism guarantee (normative)

Given the same composition document and the same set of referenced
primitives, a conforming runtime MUST produce a byte-identical canonical
resolved composition, independent of implementation language, iteration
order over object keys, or any other incidental factor. The precedence order
is total and the fold is deterministic; there is no permitted source of
nondeterminism.

### Legibility guarantee (normative)

A conforming runtime SHOULD be able to report, for any field in the canonical
resolved composition, which layer in the precedence chain set its final value
— analogous to the CSS computed-value model that lets a developer trace *why*
a property has the value it does. Legible composition is a first-class goal:
the resolved value of any field MUST be derivable from the inputs the author
can see, applied in the order they wrote them.

## Trade-offs and mitigations

- **Declarative-shape merge over operation-based patches.** Modifiers are
  partial aesthetic objects deep-merged onto the base (the RFC 7396 / DTCG
  shape), not sequences of operations (the RFC 6902 shape). This optimizes
  for *legibility* — a modifier reads as "the aesthetic delta it represents"
  — at the cost of the fine-grained positional control operation-based
  patches offer. **Mitigation:** the `merge_by` keyed-list strategy and the
  `$unset`/`$revert` directives recover the expressiveness that plain
  declarative-shape merge (RFC 7396) lacks, without inheriting JSON Patch's
  positional fragility.

- **Default list strategy is `replace`.** A reader who expects two lists to
  merge element-wise will be surprised if the schema did not declare
  `merge_by`. **Mitigation:** the default is documented and total (not a
  silent contingent fallback), and schema authors are directed to declare
  `merge_by` for any list with element identity. A future linting rule
  SHOULD warn when a list field plausibly wants `merge_by` but declares none.

- **No `!important` escape hatch.** Some users will want "this value wins no
  matter what." Mosvera refuses, because that flag is an escalation weapon
  (the CSS `!important` war). **Mitigation:** precedence is always
  expressible by position — put the value in a later modifier or in
  `overrides`. There is no scenario requiring an un-overridable flag.

- **Strict DAG / mandatory cycle errors.** A composition author who
  accidentally introduces a reference cycle gets a hard error, not a
  best-effort partial result. **Mitigation:** this is the correct behavior;
  a silent or partial resolution of a cyclic graph produces undefined
  aesthetic intent. The error MUST identify the cycle to make it fixable.

- **Composition order is load-bearing.** Reordering the `modifiers` list can
  change the result. This is intended (later wins), but it means order is
  semantically significant and authors must understand it. **Mitigation:**
  the rule is the simplest possible ("later wins, locally") and is the same
  intuition every developer already has from CSS source order and JSON Merge
  Patch — minus the surprises Tailwind and Sass introduced by *breaking*
  that intuition.

## Prior art and alternatives

This design is a synthesis of seven battle-tested declarative systems,
surveyed in depth. The full comparison and citations are preserved in the
project's research record; the load-bearing precedents:

- **CSS Cascade & Inheritance** — the canonical aesthetic composition system.
  Mosvera adopts its commitment to a *total* precedence order with an explicit
  final tiebreaker, and its `revert`-style partial rollback. Mosvera
  deliberately rejects its `!important` escalation mechanism.
  ([CSS Cascading and Inheritance Level 4](https://www.w3.org/TR/css-cascade-4/),
  [Selectors Level 4 §15](https://www.w3.org/TR/selectors-4/#specificity-rules))
- **JSON Merge Patch (RFC 7396)** — the deep-merge object model Mosvera's
  `merge` operation is built on. Mosvera rejects its two documented
  weaknesses: array blindness (cannot edit list elements) and `null`
  overloading (deletion sentinel collides with real `null`).
  ([RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396))
- **JSON Patch (RFC 6902)** — the operation-based alternative. Mosvera does
  not adopt its imperative model (less legible for aesthetic deltas) but
  takes the lesson that positional list edits are fragile.
  ([RFC 6902](https://datatracker.ietf.org/doc/html/rfc6902))
- **Kubernetes Strategic Merge Patch** — the source of `merge_by` keyed list
  merging and the principle that merge strategy belongs in the schema, never
  inferred. Mosvera adopts both, and heeds the cautionary failure: SMP
  silently replaces whole lists when schema metadata is missing.
  ([Kubernetes SMP](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/strategic-merge-patch.md))
- **Design Tokens Format Module (DTCG)** — Mosvera's nearest domain neighbor.
  Source of lazy reference resolution and mandatory cycle detection. Mosvera
  aims for DTCG compatibility at the palette/color-token boundary per
  [ADR-0006](../docs/decisions/0006-prior-art-survey.md).
  ([DTCG Format Module](https://www.designtokens.org/tr/drafts/format/))
- **Tailwind CSS** — a cautionary case: composition order decoupled from
  output precedence required the `tailwind-merge` band-aid. Mosvera
  guarantees authoring order *is* precedence order.
  ([Tailwind states](https://tailwindcss.com/docs/hover-focus-and-other-states),
  [tailwind-merge](https://github.com/dcastil/tailwind-merge))
- **Sass `@extend`** — a cautionary case: non-local, action-at-a-distance
  precedence. Mosvera keeps composition local — the result depends only on
  the inputs you can see, in the order you provide them.
  ([Sass @extend](https://sass-lang.com/documentation/at-rules/extend/))
- **Terraform** — source of the "total, documented precedence ladder with
  explicit tiebreakers" model, and the warning that hidden overrides
  (`override.tf`) hurt legibility even when deterministic.
  ([Terraform Input Variables](https://developer.hashicorp.com/terraform/language/values/variables),
  [Terraform Override Files](https://developer.hashicorp.com/terraform/language/files/override))

**Alternative considered: operation-based modifiers (JSON Patch shape).**
Rejected because aesthetic deltas are more legible as declarative shapes than
as operation sequences, and legibility is a first-class goal
([Doctrine 6](../CLAUDE.md#6-academic-grade-documentation)). The keyed-list
and directive mechanisms recover the needed expressiveness.

**Alternative considered: specificity-based resolution (CSS shape).**
Rejected because specificity is a function of selector structure, and Mosvera
compositions have no selector layer — precedence by explicit position is
simpler and sufficient, and avoids reproducing CSS's specificity-war dynamics.

## Open questions

1. **Default for `merge_by` absence.** This MEP defaults undeclared list
   fields to `replace`. Should the schema linter (a future tool) treat a
   list-of-objects with a plausible identity field but no `merge_by`
   declaration as a warning, an error, or neither? Deferred to the linter's
   own design.
2. **Type-mismatch handling.** When `base[key]` is a scalar and
   `overlay[key]` is an object (or vice versa), this MEP specifies "overlay
   replaces." Should a conforming runtime additionally *warn* on type
   mismatch, since it often indicates an authoring error? Likely yes;
   spec'd as SHOULD in a later revision after runtime experience.
3. **`$revert` interaction with `merge_by` lists.** The semantics of
   reverting a single keyed list element (rather than a whole field) need a
   worked example and possibly a dedicated directive form. Deferred until a
   concrete example exercises it.
4. **Palette/color interpolation.** Some aesthetic merges may want to *blend*
   values (e.g. interpolate between two colors) rather than replace. This MEP
   defines replace-on-conflict only. Whether a blending strategy belongs in
   the merge algebra or in a provider-compilation transform is an open
   question for [MEP-0003](./0003-provider-compilation-contract.md).

## Future possibilities

- **MEP-0002 (Inheritance Rules)** reuses `merge` to define how templates
  extend other templates, adding the `$extends` mechanism and inheritance-
  chain resolution. The DAG requirement and cycle detection defined here
  extend naturally to the inheritance graph.
- **MEP-0003 (Provider Compilation Contract)** consumes the canonical
  resolved composition this MEP produces and defines the mapping to provider
  payloads, including how canonical `quality`/`safety` modifiers map across
  divergent provider surfaces (per
  [ADR-0008](../docs/decisions/0008-provider-adapter-pairing.md)).
- A **conformance test vector** in [`spec/compliance/`](../compliance/) for
  every normative MUST in this MEP, so any runtime (TypeScript reference,
  Python port, community implementations) can be checked against identical
  expected canonical models (per
  [ADR-0007](../docs/decisions/0007-reference-runtime-language.md)).
- A **`merge`-explain mode** in the runtime and MCP surface (`resolve_composition`
  with provenance), satisfying the legibility guarantee by reporting which
  layer set each field.

## Sources

1. [CSS Cascading and Inheritance Level 4 (W3C)](https://www.w3.org/TR/css-cascade-4/) — total cascade sort order (§6.1), importance, `revert`/`unset` keywords (§7.3); model for total precedence and partial rollback.
2. [Selectors Level 4 §15 — Specificity (W3C)](https://www.w3.org/TR/selectors-4/#specificity-rules) — specificity arithmetic; considered and rejected as a resolution basis.
3. [RFC 7396 — JSON Merge Patch (IETF)](https://datatracker.ietf.org/doc/html/rfc7396) — recursive deep-merge object model; documented array blindness and `null`-overloading weaknesses Mosvera avoids.
4. [RFC 6902 — JSON Patch (IETF)](https://datatracker.ietf.org/doc/html/rfc6902) — operation-based merge; positional-edit fragility lesson.
5. [Kubernetes Strategic Merge Patch (SIG API-machinery)](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/strategic-merge-patch.md) — keyed list merging (`patchMergeKey`), schema-declared strategy, silent-replace-fallback cautionary failure.
6. [Design Tokens Format Module (DTCG)](https://www.designtokens.org/tr/drafts/format/) — lazy reference resolution (§7.2), mandatory cycle detection (§7.2.3); nearest domain prior art.
7. [Tailwind CSS — Hover, focus & other states](https://tailwindcss.com/docs/hover-focus-and-other-states) and [tailwind-merge](https://github.com/dcastil/tailwind-merge) — cautionary case: authoring order decoupled from output precedence.
8. [Sass — @extend (Sass docs)](https://sass-lang.com/documentation/at-rules/extend/) — cautionary case: non-local, action-at-a-distance precedence.
9. [Terraform — Input Variables](https://developer.hashicorp.com/terraform/language/values/variables) and [Override Files](https://developer.hashicorp.com/terraform/language/files/override) — total precedence ladder with explicit tiebreakers; hidden-override legibility warning.
