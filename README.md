<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Mosvera Specification

**A declarative runtime for aesthetic intent in AI-native systems.**

This is the canonical Mosvera contract: schemas, specification prose,
Mosvera Enhancement Proposals (MEPs), conformance vectors, terminology,
governance, and portable example packs.

Mosvera lets teams name an aesthetic, store it as portable JSON documents,
resolve it into a canonical model, and compile that model into tokens or
provider payloads inside their own tools. The public website demonstrates the
idea, but production users bring Mosvera into their own apps, agents, design
systems, and build pipelines.

## Start Here

- [`docs/guides/10-minute-quickstart.md`](./docs/guides/10-minute-quickstart.md) — prove Mosvera works with Claude Desktop, npm/MCP, TypeScript, or Python.
- [`schemas/`](./schemas/) — v0.1 JSON Schemas rooted at
  `https://mosvera.io/schema/0.1/...`.
- [`GLOSSARY.md`](./GLOSSARY.md) — canonical terminology for aesthetics,
  composition documents, packs, registries, tokens, and payloads.
- [`meps/`](./meps/) — proposal process and foundational specification MEPs.
- [`compliance/`](./compliance/) — language-neutral conformance vectors.
- [`examples/`](./examples/) — small spec-side sample packs and worked systems.
- [`mosvera/examples`](https://github.com/mosvera/examples/tree/main/packs) — canonical public aesthetic pack gallery.
- [`MANIFESTO.md`](./MANIFESTO.md) — conceptual frame.
- [`ROADMAP.md`](./ROADMAP.md) — current phase and future work.

## Which Package Do I Need?

Use `@mosvera/runtime` when your app needs to validate Mosvera documents,
load a local registry, resolve a named aesthetic, and compile portable design
tokens from a JavaScript or TypeScript environment.

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
npm install @mosvera/provider-google
npm install @mosvera/provider-runway
npm install @mosvera/provider-elevenlabs
npm install @mosvera/provider-firefly
npm install @mosvera/provider-meshy
```

Use `@mosvera/mcp` when you want Mosvera exposed as MCP tools for agents,
editors, or automation. It runs locally, reads and writes a user-owned local
registry, and lets tools such as Claude Desktop list, resolve, save, export,
and import named aesthetics:

```bash
npm install -g @mosvera/mcp
mosvera-mcp
```

Claude Desktop users should prefer the `.mcpb` bundle attached to
[`mosvera/mcp` releases](https://github.com/mosvera/mcp/releases).

Use this spec repository when you are implementing Mosvera in another language,
checking schemas/conformance vectors, importing a sample aesthetic pack, or
proposing changes to the public contract.

## Status

Phase 6M is complete: the first public runtime surface is available, the
provider layer now spans image, video, audio, and 3D payload compilation, and
the release surface has been reconciled after publication. The
v0.1 schemas, conformance vectors, TypeScript runtime, Python runtime, MCP
bridge, OpenAI adapter, FLUX adapter, SDXL adapter, HeyGen adapter, Google
adapter, Runway adapter, ElevenLabs adapter, Firefly adapter, Meshy adapter,
Claude Desktop bundle, schema hosting, and canonical sample aesthetic pack are
in place. The v0.1 interfaces remain provisional until external implementer
feedback proves them stable.

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
