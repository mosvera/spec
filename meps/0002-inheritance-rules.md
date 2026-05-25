<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# MEP-0002: Inheritance Rules

**Status:** provisional
**Author(s):** Founding maintainer
**Created:** 2026-05-24
**Updated:** 2026-05-24
**Tracking issue:** (assigned at PR merge; see [ADR-0003](../docs/decisions/0003-rfc-and-proposal-format.md))
**Superseded by:** —

> **Numbering note.** Provisional number `0002` during solo incubation,
> per the same convention as [MEP-0001](./0001-composition-semantics.md).
> Reconciled with the PR-based process at public unlock.

## Motivation

[MEP-0001](./0001-composition-semantics.md) defined **composition** — how a
use-site assembles a base template with an ordered list of modifiers at the
moment of generation. This MEP defines **inheritance** — how a template, at
definition time, builds on another template so that families of related
aesthetic systems can share a common lineage without repetition.

The two are distinct in *when* and *what* they combine:

- **Inheritance** (this MEP) is **definition-time** and **template-to-template**.
  A template declares `$extends: <parent>`, meaning "I am a more specific
  version of that template." It lets you define `documentary-realism` once and
  derive `documentary-realism-handheld` and `documentary-realism-archival`
  from it without copying the shared intent.
- **Composition** ([MEP-0001](./0001-composition-semantics.md)) is **use-time**
  and **assembly-level**. A composition picks a `base` template and layers
  modifiers and overrides for a specific generation.

Both reduce to the same underlying operation — the `merge` defined in
MEP-0001. Inheritance is, mechanically, "fold the ancestor lineage with
`merge` before the template is used." This MEP adds the lineage declaration
and resolution rules; it invents no new merge algebra.

This MEP does **not** define:

- The merge operation, list strategies, `$unset`/`$revert` directives, or the
  determinism/legibility guarantees — all defined in
  [MEP-0001](./0001-composition-semantics.md) and reused here unchanged.
- Provider compilation of the resolved model —
  [MEP-0003](./0003-provider-compilation-contract.md).
- Concrete template field schemas — [`spec/schemas/`](../schemas/).

## Explanation

### The `$extends` declaration

A template MAY declare a single parent template via the `$extends` directive
(a `$`-prefixed reserved key per
[ADR-0005](../docs/decisions/0005-schema-naming-conventions.md)):

```yaml
# template: documentary-realism-handheld
$schema: mosvera/template/v0.1
$extends: documentary-realism        # single parent reference
camera:
  stabilization: handheld            # overrides / adds to the parent
  grain: 0.4
```

`$extends` takes **one** template reference, not a list. Mosvera uses
**single inheritance**. The rationale and the explicit rejection of multiple
inheritance are in Trade-offs and Prior art; the short version is that
Mosvera already has a horizontal-reuse mechanism — composition — and a second
one with different (computed) precedence semantics would erode the legibility
guarantee MEP-0001 committed to.

### The inheritance chain

Because inheritance is single, a template's lineage is a **linear chain**, not
a graph: `self → parent → grandparent → … → root`. Resolving the template
folds this chain from the root (lowest precedence) up to the template itself
(highest precedence) using MEP-0001's `merge`:

```
resolve_template(T)
  = merge( … merge(merge(root, …), grandparent), parent ) then merged with T
  = reduce(merge, [root, …, grandparent, parent, T])
```

The child always wins over the parent, because the child is higher (later) in
the fold — the identical "later-wins" rule MEP-0001 established for modifiers.
A child template may use any MEP-0001 directive against inherited fields:
override a scalar by restating it, deep-merge a nested object, merge a keyed
list with `merge_by`, remove an inherited field with `$unset`, or roll back
the parent's contribution to a field with `$revert`.

The result is a **resolved template**: a fully-merged template with no
remaining `$extends`, semantically equivalent to one written by hand with the
whole lineage inlined.

### How inheritance and composition combine

A composition's `base` reference (MEP-0001) may point to a template that has
ancestors. Inheritance is resolved **first**, producing a resolved template;
that resolved template then enters the composition precedence chain as the
base. The full, single, total precedence order — lowest to highest — is:

```
[ root_ancestor, …, parent, self_template,   ← inheritance (MEP-0002)
  modifier₁, …, modifierₙ, overrides ]        ← composition (MEP-0001)
```

The entire thing is one left-fold via `merge`. Inheritance extends the
precedence chain leftward (the ancestor lineage, lower precedence); composition
extends it rightward (modifiers and overrides, higher precedence). There is
exactly one precedence order in the system, it is total, and — because single
inheritance keeps the lineage linear — every position in it corresponds to
something the author wrote, preserving MEP-0001's "the order you write is the
order that wins" guarantee.

### Cycle detection

The inheritance relation MUST be acyclic: a template MUST NOT transitively
extend itself. With single inheritance, the inheritance graph is a set of
linked lists, so cycle detection is a simple chain walk. This is the same
conformance posture MEP-0001 mandates for reference cycles, extended to the
`$extends` relation: a conforming runtime MUST detect an inheritance cycle,
report an error identifying the cycle, and MUST NOT emit a resolved template.

## Internal details

### Resolution algorithm (normative)

A conforming runtime MUST resolve a template as follows:

1. Parse the template and validate it against its schema.
2. Walk the `$extends` chain, collecting ancestors. If the same template is
   encountered twice on the walk, an inheritance cycle exists: error and stop.
3. Construct the inheritance chain `[root, …, parent, self]` (root lowest
   precedence, `self` highest).
4. Left-fold the chain with `merge` (MEP-0001), applying list-merge
   strategies and `$unset`/`$revert` directives. The `$extends` directive
   itself is consumed during resolution and MUST NOT appear in the resolved
   template.
5. Emit the resolved template.

When a composition references such a template as its `base`, the runtime MUST
resolve the template (steps 1–5) before constructing the composition
precedence chain defined in MEP-0001.

### `$revert` across an inheritance boundary

`$revert: [field]` in a child template rolls that field back to the value it
held **before the child's layer** — i.e. the parent's resolved value for that
field — without disturbing ancestors above the parent. This is the
layer-local partial rollback MEP-0001 defines, applied at the inheritance
seam. It lets a child say "ignore my own contribution to `field` and keep what
I inherited," which differs from `$unset` (remove the field outright) and from
restating the parent's value (which couples the child to a value it does not
own).

### Interaction with `merge_by` keyed lists

When a parent and child both contribute to a `merge_by`-keyed list, elements
are correlated by key across the inheritance boundary exactly as MEP-0001
specifies for any merge: a child list element whose key matches an inherited
element deep-merges onto it; a child element with a new key is appended. A
child MAY remove an inherited list element via the list's `$unset`-by-key form
(deferred to the schema-level directive design; flagged in Open questions).

### Determinism and legibility (normative)

Both guarantees are inherited verbatim from MEP-0001 and extended to cover
inheritance resolution:

- **Determinism.** Given the same template and the same ancestor templates, a
  conforming runtime MUST produce a byte-identical resolved template,
  independent of implementation language or incidental factors. Single
  inheritance contributes no nondeterminism: the chain is linear and the fold
  is deterministic. (This is a concrete dividend of choosing single
  inheritance: there is no linearization algorithm whose cross-language
  byte-equivalence would otherwise have to be guaranteed.)
- **Legibility.** A conforming runtime SHOULD be able to report, for any field
  in the resolved template, which template in the lineage set its final value
  — the same provenance tracing MEP-0001 asks of composition.

## Trade-offs and mitigations

- **Single inheritance, not multiple.** A template extends exactly one parent.
  Some users will want a template to descend from two lineages at once
  (`$extends: [a, b]`). Mosvera refuses, for a structural reason: it already
  has composition (MEP-0001) as its multi-source combiner, and the closest
  domain precedents (Jinja2, Twig, JavaScript) all pair single inheritance
  with a separate horizontal-reuse mechanism rather than adopting multiple
  inheritance. **Mitigation:** the multi-source case is expressed at use-time
  through composition (`base: a` with `modifiers: [b]`), or — if a reusable
  combined template is genuinely needed — by defining a new template that
  extends one parent and inlines the other's intent. Multiple inheritance is
  reserved as a future possibility (below), gated on a real recurring case
  composition cannot express.

- **Inheritance is definition-time; composition is use-time.** Two mechanisms
  that both fold via `merge` could be seen as redundant. They are kept
  distinct because they answer different questions: inheritance is "what is
  this template a more-specific kind of?" (a durable is-a relationship baked
  into the definition); composition is "what do I want for this one
  generation?" (an ephemeral assembly). **Mitigation:** the precedence chain
  unifies them into a single total order, so there is one mental model
  (later-wins fold) even though there are two authoring surfaces.

- **Deep inheritance chains risk fragile-base coupling.** A template deep in a
  lineage depends on ancestor intent it did not author, the classic
  fragile-base-class problem (GoF; Bloch, *Effective Java* Item 18).
  **Mitigation:** the guidance (non-normative) is to keep lineages shallow and
  reserve `$extends` for genuine is-a relationships; reach for composition for
  mix-and-match variation. A future linter SHOULD flag inheritance chains
  beyond a configurable depth.

- **No multiple inheritance means no diamond, no linearization, no
  inconsistent-hierarchy errors.** This is the deliberate payoff. Every
  conforming runtime avoids implementing and byte-matching a C3 linearization;
  authors never encounter "cannot create a consistent ordering" errors. The
  cost — inability to descend from two lineages — is absorbed by the
  composition layer.

## Prior art and alternatives

The full survey and citations are preserved in the project's research record;
the load-bearing precedents:

- **C3 linearization (Python MRO)** — the canonical multiple-inheritance
  ordering algorithm, guaranteeing consistency with local precedence order,
  monotonicity, and EPG-consistency, and **refusing to resolve inconsistent
  hierarchies** (a `TypeError` at class creation). Mosvera does not adopt
  multiple inheritance, so it does not need C3 — but if multiple inheritance
  is ever added, it MUST use C3 (the only monotonic option) with hard errors
  on inconsistent hierarchies.
  ([Python MRO HOWTO](https://docs.python.org/3/howto/mro.html); Barrett et
  al., *A Monotonic Superclass Linearization for Dylan*, OOPSLA 1996,
  [ACM DL 10.1145/236337.236343](https://dl.acm.org/doi/10.1145/236337.236343))
- **Jinja2 / Twig / JavaScript prototype chain** — single-inheritance systems
  in Mosvera's nearest neighborhood (templating, delegation). Jinja2 and Twig
  each allow exactly one effective `extends` parent and provide a *separate*
  horizontal-reuse mechanism (Twig's `use`, Jinja's includes/macros). This is
  the precise shape Mosvera adopts: single `$extends` + composition as the
  horizontal-reuse layer.
  ([Jinja Template Inheritance](https://jinja.palletsprojects.com/en/stable/templates/#template-inheritance);
  [Twig extends](https://twig.symfony.com/doc/3.x/tags/extends.html);
  [MDN: Prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain))
- **Scala / Ruby / PHP traits and mixins** — the multi-source systems. Scala
  and Ruby compute a linearization/ancestor chain for the author; PHP forces
  the author to resolve every collision explicitly (`insteadof`/`as`) and
  errors otherwise. The cross-lesson: there are only two coherent multi-source
  policies — compute a deterministic order, or make the author state it — and
  the trap is an implicit, underspecified middle.
  ([Scala Spec §5.1.2](https://www.scala-lang.org/files/archive/spec/2.13/05-classes-and-objects.html);
  [Ruby Module#ancestors](https://ruby-doc.org/core/Module.html#method-i-ancestors);
  [PHP Traits](https://www.php.net/manual/en/language.oop5.traits.php))
- **JSON Schema `allOf`** — proves you cannot fake inheritance with
  constraint-conjunction: `allOf` is intersection (AND), has no override (a
  child cannot relax a parent constraint), and the `additionalProperties`
  interaction makes naïve `allOf`-as-extends actively broken. Mosvera
  inheritance is a *merge* with override (child wins), not a validation
  intersection.
  ([JSON Schema: Combining](https://json-schema.org/understanding-json-schema/reference/combining))
- **CUE unification** — the order-independent alternative: values combine by a
  commutative/associative/idempotent lattice meet, conflicts are errors, and
  there is **no override**. Order-independence is purchased precisely by giving
  up override. MEP-0001 already chose override (later-wins), so Mosvera has
  structurally rejected the CUE model — but CUE is the rigorous proof that *if
  you don't need override, you don't need linearization either*, which is why
  single inheritance keeps the system simple.
  ([CUE Spec](https://cuelang.org/docs/references/spec/);
  [The Logic of CUE](https://cuelang.org/docs/concept/the-logic-of-cue/))
- **Dhall record merge** — shows inheritance-with-override can be expressed as
  a named merge over a re-bound base (`let base in base // overrides`) rather
  than a distinct primitive, reinforcing that single `$extends` is a thin,
  cheap layer over MEP-0001's merge.
  ([Dhall built-in operators](https://github.com/dhall-lang/dhall-lang/wiki/Built-in-types,-functions,-and-operators))
- **"Composition over inheritance" (GoF; Bloch, *Effective Java* Item 18)** —
  the design doctrine that inheritance suits genuine is-a relationships while
  composition suits mix-and-match variation, and that *multiple* inheritance
  is the highest-risk construct. Since Mosvera already has composition, the
  bar for adding multiple inheritance ("a genuine is-a composition cannot
  express") is not met.
  ([python-patterns.guide: Composition over inheritance](https://python-patterns.guide/gang-of-four/composition-over-inheritance/))

**Alternative considered and rejected: multiple inheritance with C3.** It is a
solved problem with a proven algorithm and a clean failure mode, and some
aesthetic systems do have orthogonal definition-time lineages. Rejected for
now because (a) composition already combines multiple sources, with *better*
ergonomics (written-order precedence vs C3-computed order); (b) it would erode
MEP-0001's legibility guarantee by replacing written order with computed
order; (c) it imposes a cross-language linearization-byte-equivalence burden
on the determinism guarantee; and (d) GoF/Bloch single it out as the
highest-risk construct and the doctrine bar is unmet. See Future possibilities
for the conditions under which it would be revisited.

**Alternative considered and rejected: order-independent unification (CUE).**
Rejected because it abolishes override, and aesthetic modifiers fundamentally
need to say "this layer wins." MEP-0001 already committed to override.

## Open questions

1. **`$unset`/`$revert` of a single keyed list element across inheritance.**
   Removing or reverting one element of a `merge_by` list (rather than the
   whole field) needs a dedicated directive form. Deferred to the schema-level
   directive design; a worked example should drive it.
2. **Inheritance-chain depth limit.** Should there be a normative maximum
   depth, or is this purely a linter concern? Leaning linter-only, but runtime
   experience should confirm.
3. **Cross-primitive inheritance.** This MEP defines template-extends-template.
   Whether palettes or modifiers may also `$extends` their own kind is left
   open; the merge machinery would support it, but the use cases are unproven.
4. **`$extends` of a not-yet-resolved reference vs an inline template.** This
   MEP assumes `$extends` names a registered template by reference. Whether an
   inline anonymous parent is permitted is deferred.

## Future possibilities

- **Multiple inheritance (`$extends: [a, b]`) with C3.** Reserved, not
  adopted. Would be revisited only on evidence of a recurring is-a case that
  composition demonstrably cannot express. If ever adopted, it MUST use C3
  (monotonic) linearization with hard errors on inconsistent hierarchies, and
  the determinism guarantee MUST be extended to require byte-identical
  linearization across conforming runtimes. It MUST NOT use an implicit or
  non-monotonic order.
- **Conformance vectors** in [`spec/compliance/`](../compliance/) for every
  normative MUST here: single-chain resolution, child-overrides-parent,
  `$revert` at the inheritance seam, `merge_by` across the boundary, and
  cycle-detection error cases.
- **Lineage-aware `resolve_composition`** in the MCP surface: report the full
  precedence chain (ancestors + modifiers + overrides) and per-field
  provenance, satisfying the legibility guarantee end to end.
- **Linter rules**: warn on deep inheritance chains and on `$extends` used
  where composition would be the better fit (mix-and-match variation rather
  than is-a).

## Sources

1. [Python — The Python 2.3 Method Resolution Order](https://docs.python.org/3/howto/mro.html) — C3 algorithm, the three guaranteed properties, and the inconsistent-hierarchy refusal (`TypeError`).
2. [Python tutorial — Multiple Inheritance](https://docs.python.org/3/tutorial/classes.html#multiple-inheritance) — why all multiple inheritance is a diamond (universal root).
3. [Barrett et al., *A Monotonic Superclass Linearization for Dylan*, OOPSLA 1996 (ACM DL)](https://dl.acm.org/doi/10.1145/236337.236343) — the original C3 paper; provenance for monotonicity.
4. [Jinja — Template Inheritance](https://jinja.palletsprojects.com/en/stable/templates/#template-inheritance) — single effective `extends`, block override, `super()`.
5. [Twig — extends](https://twig.symfony.com/doc/3.x/tags/extends.html) — "Twig does not support multiple inheritance"; `use` as the separate horizontal-reuse mechanism.
6. [MDN — Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain) — single delegation, property shadowing (first-match-wins).
7. [Scala Language Specification §5 — Classes and Objects](https://www.scala-lang.org/files/archive/spec/2.13/05-classes-and-objects.html) — trait linearization (right-biased), single class + multiple traits.
8. [Ruby — Module#ancestors](https://ruby-doc.org/core/Module.html#method-i-ancestors) — `include`/`prepend` ancestor-chain flattening.
9. [PHP Manual — Traits](https://www.php.net/manual/en/language.oop5.traits.php) — fatal error on unresolved conflict; `insteadof`/`as`; class > trait > inherited precedence.
10. [JSON Schema — Combining (allOf)](https://json-schema.org/understanding-json-schema/reference/combining) and [Object: Extending Closed Schemas](https://json-schema.org/understanding-json-schema/reference/object) — `allOf` is intersection, not inheritance; `additionalProperties` pitfall.
11. [CUE Spec](https://cuelang.org/docs/references/spec/) and [The Logic of CUE](https://cuelang.org/docs/concept/the-logic-of-cue/) — unification, order-independence, no-override; the proof that no-override ⇒ no-linearization.
12. [Dhall — Built-in types, functions, and operators](https://github.com/dhall-lang/dhall-lang/wiki/Built-in-types,-functions,-and-operators) — `//` right-biased merge, `let` reuse; inheritance as sugar over composition.
13. [python-patterns.guide — Composition over inheritance (GoF)](https://python-patterns.guide/gang-of-four/composition-over-inheritance/) — the doctrine; multiple inheritance as highest-risk construct.
