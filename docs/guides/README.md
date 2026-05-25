<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# docs/guides/

How-to guides and concept guides for Mosvera. Content lands as the
runtime, MCP server, and provider adapters ship — there's nothing
useful to guide a reader through until those exist.

## Planned guides (post-Phase-4)

- **Authoring an aesthetic template** — concepts, primitives, the
  composition file format.
- **Inheritance and modifier semantics** — the canonical model
  walkthrough.
- **Writing a provider adapter** — implementing the provider
  compilation contract.
- **Running the MCP server** — stdio setup, tool invocation from
  agents and editors.
- **Migrating from prompts to compositions** — how to express an
  existing prompt-based workflow as a Mosvera composition.

## What goes here vs elsewhere

- **Specification text** lives in [`spec/specification/`](../../specification/),
  not here.
- **Schemas** live in [`spec/schemas/`](../../schemas/), not here.
- **Architecture rationale** lives in [`docs/decisions/`](../decisions/),
  not here.
- **Roadmap and changelog** live at the [repository root](../../).

Guides explain *how to use* Mosvera. They do not redefine what
Mosvera is.
