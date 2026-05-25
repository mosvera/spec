# ADR-0014: Canonical Public Domain

**Status:** Accepted
**Date:** 2026-05-25
**Doctrines invoked:** Public-first, Adoption-over-convenience, Spec-neutrality

## Context

[ADR-0010](./0010-schema-id-scheme.md) selected `mosvera.dev` as the
canonical domain for schema `$id`s and future documentation hosting. That
decision was made before the public web presence was live.

The live public namespace is now different:

- The GitHub organization exists at `https://github.com/mosvera`.
- `https://mosvera.io/` is the live public site.
- `https://mosvera.com/`, `https://mosvera.org/`, and
  `https://mosvera.dev/` redirect to `https://mosvera.io/`.

The schema `$id` scheme is explicitly rooted at the canonical public domain,
so leaving v0.1 schemas under `mosvera.dev` would create a permanent split
between the public site and the specification namespace. Because there are no
external v0.1 consumers yet, this is the right moment to correct the root.

## Decision

`mosvera.io` is the canonical public domain for Mosvera.

The v0.1 schema namespace is:

```text
https://mosvera.io/schema/0.1/<name>
```

The repository updates all live `$id`, `$schema`, and `$ref` references from
`https://mosvera.dev/schema/0.1/` to
`https://mosvera.io/schema/0.1/`. Runtime validation maps document kinds to
the `mosvera.io` schema identifiers. Package `homepage` metadata also points
to `https://mosvera.io`.

`mosvera.dev`, `mosvera.com`, and `mosvera.org` remain useful owned redirects,
but they are not the canonical namespace.

## Consequences

- Public-facing links and package metadata point to the domain users actually
  land on.
- Schema identifiers stay aligned with the public site before external
  consumers pin v0.1 identifiers.
- ADR-0010 remains the historical record of the previous domain-rooting
  decision, but its live decision is superseded by this ADR.
- `mosvera.io/schema/0.1/...` still does not need to be dereferenceable for
  validators to work. Static schema hosting at that path remains a Phase 6
  publication task.

## Sources

1. [GitHub organization: mosvera](https://github.com/mosvera) — verifies the
   organization namespace exists.
2. [Mosvera public site](https://mosvera.io/) — verifies the live canonical
   public site.
3. `curl -I` verification on 2026-05-25 — verified that `mosvera.com`,
   `mosvera.org`, and `mosvera.dev` return HTTP 301 redirects to
   `https://mosvera.io/`.
