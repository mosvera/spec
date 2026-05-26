<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# 10-Minute Quickstart

Use this guide to prove Mosvera works before you learn the whole spec. The
paths are ordered from easiest to most code-oriented:

1. Claude Desktop bundle
2. npm MCP server
3. TypeScript runtime
4. Python runtime

Mosvera runs locally against a user-owned registry. It does not call image
providers, send provider HTTP requests, store API keys, or put secrets in
aesthetic packs.

The sample pack used below is
[`claymation-playful-builder.mosvera.json`](https://github.com/mosvera/examples/blob/main/packs/claymation-playful-builder.mosvera.json).
You can download the full public pack gallery from
[`mosvera/examples`](https://github.com/mosvera/examples/tree/main/packs) or browse it on
[mosvera.io](https://mosvera.io/).

## Claude Desktop

Use this path if you want Mosvera tools inside Claude Desktop without touching
the command line.

1. Download `mosvera-mcp-0.1.9.mcpb` from the latest
   [`mosvera/mcp` release](https://github.com/mosvera/mcp/releases/latest).
2. Install it in Claude Desktop by opening the bundle or using Settings →
   Extensions → Advanced settings → Install Extension.
3. Leave the registry directory blank to use the platform default, or choose a
   folder where your local Mosvera registry should live.
4. Start a new Claude Desktop chat and ask:

```text
Use Mosvera to show server_status.
```

Expected success: the server reports a registry path, whether writes are
enabled, package/runtime versions, and document counts.

Then ask:

```text
Use Mosvera to list my aesthetics.
```

Expected success: you see the four seeded v1 aesthetics:
`cinematic-lab`, `claymation-playful-builder`, `quiet-editorial`, and
`technical-manual`.

Download the sample pack from:

```text
https://raw.githubusercontent.com/mosvera/examples/main/packs/claymation-playful-builder.mosvera.json
```

Then ask Claude to preview and import the local file:

```text
Use Mosvera to preview importing this aesthetic pack: /path/to/claymation-playful-builder.mosvera.json
```

```text
Use Mosvera to import this aesthetic pack into my local registry: /path/to/claymation-playful-builder.mosvera.json
```

Expected success: preview shows a valid import plan, and import reports the
installed entrypoint aesthetic.

Finally ask:

```text
Use Mosvera to resolve claymation-playful-builder and compile it into CSS variables.
```

Expected success: Claude can show a resolved canonical model and compiled CSS
variables such as `--mosvera-palette-background`.

## npm/MCP

Use this path if you want to run the same MCP server from npm for another MCP
host, editor, or automation setup.

```bash
npm install -g @mosvera/mcp
mkdir -p ./mosvera-registry
mosvera-mcp --registry ./mosvera-registry
```

For MCP hosts that use a command/args config, the shape is:

```json
{
  "mcpServers": {
    "mosvera": {
      "command": "mosvera-mcp",
      "args": ["--registry", "./mosvera-registry"]
    }
  }
}
```

Expected success: the host can call `server_status`, `list_aesthetics`,
`preview_aesthetic_import`, `import_aesthetic_pack`, `resolve_aesthetic`, and
`compile_design_tokens`.

The same first prompts from the Claude Desktop section work here:

```text
Use Mosvera to list my aesthetics.
Use Mosvera to preview importing /path/to/claymation-playful-builder.mosvera.json.
Use Mosvera to import /path/to/claymation-playful-builder.mosvera.json.
Use Mosvera to resolve claymation-playful-builder and compile it into CSS variables.
```

## TypeScript Runtime

Use this path if your JavaScript or TypeScript application wants to call the
runtime directly instead of going through MCP.

```bash
mkdir mosvera-ts-quickstart
cd mosvera-ts-quickstart
npm init -y
npm pkg set type=module
npm install @mosvera/runtime
curl -fsS -o claymation-playful-builder.mosvera.json \
  https://raw.githubusercontent.com/mosvera/examples/main/packs/claymation-playful-builder.mosvera.json
```

Create `quickstart.mjs`:

```js
import { readFileSync } from "node:fs";
import {
  compileDesignTokens,
  importAestheticPack,
  resolveAesthetic,
  toCssVariables,
  validateAestheticPack,
} from "@mosvera/runtime";

const pack = JSON.parse(readFileSync("claymation-playful-builder.mosvera.json", "utf8"));
const diagnostics = validateAestheticPack(pack);

if (diagnostics.length > 0) {
  console.error(diagnostics);
  process.exit(1);
}

const imported = importAestheticPack(
  { templates: {}, palettes: {}, modifiers: {}, compositions: {} },
  pack,
);

const id = imported.plan.installed_entrypoint.id;
const canonical = resolveAesthetic(id, imported.registry, imported.strategies);
const tokens = compileDesignTokens(canonical);
const cssVariables = toCssVariables(tokens);

console.log(id);
console.log(cssVariables["--mosvera-palette-background"]);
```

Run it:

```bash
node quickstart.mjs
```

Expected success: it prints `claymation-playful-builder` and a CSS color value.

## Python Runtime

Use this path if your Python application wants the peer runtime against the
same Mosvera spec contract.

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install mosvera
curl -fsS -o claymation-playful-builder.mosvera.json \
  https://raw.githubusercontent.com/mosvera/examples/main/packs/claymation-playful-builder.mosvera.json
```

Create `quickstart.py`:

```python
import json

from mosvera import (
    compile_design_tokens,
    import_aesthetic_pack,
    resolve_aesthetic,
    to_css_variables,
    validate_aesthetic_pack,
)

with open("claymation-playful-builder.mosvera.json", encoding="utf8") as handle:
    pack = json.load(handle)

diagnostics = validate_aesthetic_pack(pack)
if diagnostics:
    raise SystemExit(diagnostics)

imported = import_aesthetic_pack(
    {"templates": {}, "palettes": {}, "modifiers": {}, "compositions": {}},
    pack,
)

id = imported["plan"]["installed_entrypoint"]["id"]
canonical = resolve_aesthetic(id, imported["registry"], imported["strategies"])
tokens = compile_design_tokens(canonical)
css_variables = to_css_variables(tokens)

print(id)
print(css_variables["--mosvera-palette-background"])
```

Run it:

```bash
python quickstart.py
```

Expected success: it prints `claymation-playful-builder` and a CSS color value.

## What You Proved

You validated a portable aesthetic pack, imported it into a local registry,
resolved a named aesthetic into Mosvera's canonical model, and compiled that
model into portable tokens. Claude Desktop and other MCP hosts do this through
tools; TypeScript and Python apps do it by importing the runtime directly.

For a plain-language diagram of this flow, see the
[`What just happened?` explainer on mosvera.io](https://mosvera.io/#what-just-happened).
