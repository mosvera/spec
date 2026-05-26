<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Aesthetic Packs

Portable `.mosvera.json` files for testing Mosvera import/export flows.

The canonical v0.1 gallery packs mirror the four live `mosvera.io`
demonstrator aesthetics. Each pack contains a named composition plus its
required base template:

- [`quiet-editorial.mosvera.json`](./quiet-editorial.mosvera.json)
- [`technical-manual.mosvera.json`](./technical-manual.mosvera.json)
- [`cinematic-lab.mosvera.json`](./cinematic-lab.mosvera.json)
- [`claymation-playful-builder.mosvera.json`](./claymation-playful-builder.mosvera.json)

## Claude Desktop

After installing the Mosvera MCP bundle, try:

```text
Use Mosvera to preview importing this aesthetic pack:
/path/to/claymation-playful-builder.mosvera.json
```

Then save it into your local registry:

```text
Use Mosvera to import this aesthetic pack into my registry:
/path/to/claymation-playful-builder.mosvera.json
```

The MCP server only imports local files today, so Claude may download the pack
first and then call Mosvera with the local `.mosvera.json` path.

After import, ask Mosvera to resolve and compile the named aesthetic:

```text
Use Mosvera to resolve claymation-playful-builder and compile it into CSS variables.
```

## Pack Boundary

V1 aesthetic packs carry templates, palettes, modifiers, composition
documents, and optional merge strategies. They do not carry assets, provider
manifests, credentials, secrets, remote URLs, or zip bundle contents.
