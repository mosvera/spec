<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Aesthetic Packs

Portable `.mosvera.json` files for testing Mosvera import/export flows.

The canonical v0.1 sample is
[`claymation-playful-builder.mosvera.json`](./claymation-playful-builder.mosvera.json).
It mirrors the live `mosvera.io` demonstrator aesthetic and contains the named
composition plus its required base template.

## Claude Desktop

After installing the Mosvera MCP bundle, try:

```text
Use Mosvera to preview importing this aesthetic pack:
https://raw.githubusercontent.com/mosvera/spec/main/examples/packs/claymation-playful-builder.mosvera.json
```

Then save it into your local registry:

```text
Use Mosvera to import this aesthetic pack into my registry:
https://raw.githubusercontent.com/mosvera/spec/main/examples/packs/claymation-playful-builder.mosvera.json
```

The MCP server only imports local files today, so Claude may download the pack
first and then call Mosvera with the local `.mosvera.json` path.

## Pack Boundary

V1 aesthetic packs carry templates, palettes, modifiers, composition
documents, and optional merge strategies. They do not carry assets, provider
manifests, credentials, secrets, remote URLs, or zip bundle contents.
