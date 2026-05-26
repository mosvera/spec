<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Mosvera Specification

**A declarative runtime for aesthetic intent in AI-native systems.**

This is the flagship Mosvera repository: schemas, specification prose,
Mosvera Enhancement Proposals (MEPs), conformance vectors, governance, and
worked aesthetic systems.

Mosvera models aesthetic intent as portable primitives such as templates,
palettes, modifiers, and compositions. Reference runtimes and provider
adapters compile that provider-neutral model into execution surfaces such as
OpenAI, FLUX, and SDXL without making prompts the source of truth.

## Start Here

- [`schemas/`](./schemas/) — v0.1 JSON Schemas rooted at
  `https://mosvera.io/schema/0.1/...`.
- [`meps/`](./meps/) — proposal process and foundational specification MEPs.
- [`compliance/`](./compliance/) — language-neutral conformance vectors.
- [`examples/`](./examples/) — three worked aesthetic systems.
- [`MANIFESTO.md`](./MANIFESTO.md) — conceptual frame.
- [`ROADMAP.md`](./ROADMAP.md) — current phase and future work.

## Which Package Do I Need?

Use `@mosvera/runtime` when your app needs to validate Mosvera documents,
resolve templates/modifiers/compositions, or produce the canonical model from
a JavaScript or TypeScript environment.

```bash
npm install @mosvera/runtime
```

Use `mosvera` when you need the same runtime contract from Python.

```bash
pip install mosvera
```

Use provider packages when you want to compile resolved Mosvera intent into
provider payloads:

```bash
npm install @mosvera/provider-openai
npm install @mosvera/provider-flux
npm install @mosvera/provider-sdxl
```

Use `@mosvera/mcp` when you want Mosvera exposed as MCP tools for agents,
editors, or automation:

```bash
npm install -g @mosvera/mcp
mosvera-mcp
```

Claude Desktop users should prefer the `.mcpb` bundle attached to
[`mosvera/mcp` releases](https://github.com/mosvera/mcp/releases).

Use this spec repository when you are implementing Mosvera in another language,
checking the schemas/conformance vectors, or proposing changes to the public
contract.

## Status

Mosvera is in Phase 6 mechanical public unlock. Phases 0-5 are complete:
the v0.1 schemas, conformance vectors, TypeScript runtime, Python runtime,
MCP surface, OpenAI adapter, FLUX adapter, SDXL adapter, and three worked
examples are in place. The v0.1 interfaces remain provisional until external
implementer feedback proves them stable.

## Repositories

| Repository | Purpose |
|------------|---------|
| [`mosvera/spec`](https://github.com/mosvera/spec) | Specification, schemas, MEPs, conformance vectors, governance. |
| [`mosvera/runtime`](https://github.com/mosvera/runtime) | TypeScript reference runtime. |
| [`mosvera/python`](https://github.com/mosvera/python) | Python peer runtime. |
| [`mosvera/providers`](https://github.com/mosvera/providers) | Reference provider adapters. |
| [`mosvera/mcp`](https://github.com/mosvera/mcp) | MCP server exposing runtime tools. |
| [`mosvera/examples`](https://github.com/mosvera/examples) | Generated galleries and metadata. |
| [`mosvera/mosvera.io`](https://github.com/mosvera/mosvera.io) | Public website and schema hosting. |

## Contributing

Specification changes go through the MEP process in [`meps/`](./meps/).
Repository architecture and governance decisions are recorded in
[`docs/decisions/`](./docs/decisions/). See
[`CONTRIBUTING.md`](./CONTRIBUTING.md) and
[`GOVERNANCE.md`](./GOVERNANCE.md) before opening a proposal.

All commits must include a DCO `Signed-off-by` trailer.

## License

Dual-licensed per [ADR-0001](./docs/decisions/0001-license-choice.md):

- Code and schemas: Apache-2.0.
- Documentation, specification prose, ADRs, MEPs, and READMEs: CC-BY-4.0.

Per-file SPDX headers identify which license applies.
