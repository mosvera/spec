# ADR-0010: Schema `$id` Scheme — https rooted at the canonical domain

**Status:** Superseded by ADR-0014
**Date:** 2026-05-24
**Doctrines invoked:** Comparable-class framing, Adoption-over-convenience

## Context

The v0.1 JSON Schemas were authored with URN-style `$id`s
(`urn:mosvera:schema:0.1:<name>`). That choice was deliberate and
conditional: at authoring time the project had no registered domain (and
the prior name "Tessera" was unacquirable), so a domain-rooted https `$id`
would have implied association with a domain we did not control. A URN is a
valid, domain-independent namespace identifier and was the correct interim
choice.

The project now owns its canonical domain. The registered domains are
`mosvera.com`, `mosvera.dev`, and `mosvera.org`, with **`mosvera.dev`
selected as the canonical home** (developer-tooling convention; the docs
portal will live there; `.com` and `.org` redirect to it). This removes the
condition that motivated the URN.

## Research

The comparable class roots schema `$id`s at an https URL under the project's
own domain:

- **JSON Schema** itself uses `https://json-schema.org/draft/2020-12/schema`.
- **OpenAPI / json-schema.org / CloudEvents** schemas use https `$id`s under
  their canonical domains.
- JSON Schema is explicit that `$id` is an identifier, **not necessarily a
  dereferenceable URL** — it need not resolve to a fetchable document; it is
  a stable namespace. (This is what made the URN acceptable interim, and what
  makes the https form safe even before a schema-hosting endpoint exists.)

URN `$id`s are valid and resolve correctly in conforming validators (ajv,
Python `jsonschema`/`referencing`), but they are off-convention for the
comparable class and read as "we didn't have a home yet."

## Decision

Schema `$id`s use **https rooted at the canonical domain**:

```
https://mosvera.dev/schema/0.1/<name>
```

The change was a clean prefix substitution
(`urn:mosvera:schema:0.1:` → `https://mosvera.dev/schema/0.1/`) applied to
all `$id` and `$ref` occurrences across the six primitive schemas, the
conformance vector meta-schema, and the runtime validator's id map. The
`$id` is a stable namespace identifier and is not required to be
dereferenceable; a schema-hosting endpoint at that path is a later, optional
convenience.

Done now rather than deferred because the schemas are at v0.1 with no
external consumers, so the substitution is cheap; deferring would mean
rewriting more downstream `$ref`s later.

## Consequences

- Schema identifiers now match comparable-class convention and read as a
  settled project with a home.
- The `0.1` version segment in the path leaves room for versioned schema
  evolution (`/schema/0.2/…`) without colliding.
- A future static endpoint serving the schemas at
  `https://mosvera.dev/schema/0.1/<name>` would make `$id`s dereferenceable,
  but nothing requires it; resolution is local in every conforming runtime
  (schemas are registered, not fetched).
- The historical URN form is preserved in the rename record
  ([ADR-0009](./0009-project-name-selection.md)) and CHANGELOG as accurate
  history; it is not a live identifier anywhere.

## Sources

1. [JSON Schema 2020-12 — the `$id` keyword](https://json-schema.org/understanding-json-schema/structuring#id) — `$id` is an identifier/namespace, need not be dereferenceable; https rooted at the project domain is the idiomatic form.
2. [JSON Schema meta-schema `$id`](https://json-schema.org/draft/2020-12/schema) — the canonical example of an https `$id` under a project's own domain.
3. [ADR-0009: Project name selection — Mosvera](./0009-project-name-selection.md) — establishes the name and the rename that the URN form belonged to.
