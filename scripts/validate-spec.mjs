// SPDX-License-Identifier: Apache-2.0

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const root = new URL("..", import.meta.url).pathname;
const ajv = new Ajv2020({ allErrors: true, strict: false });

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (entry.name.endsWith(".json")) out.push(path);
  }
  return out;
}

for (const file of walk(join(root, "schemas"))) {
  ajv.addSchema(readJson(file));
}
ajv.addSchema(readJson(join(root, "compliance", "vector.schema.json")));

for (const file of walk(join(root, "schemas"))) {
  const schema = readJson(file);
  if (!ajv.validateSchema(schema)) {
    throw new Error(`${file}: ${ajv.errorsText(ajv.errors)}`);
  }
}
const vectorSchema = readJson(join(root, "compliance", "vector.schema.json"));
if (!ajv.validateSchema(vectorSchema)) {
  throw new Error(`compliance/vector.schema.json: ${ajv.errorsText(ajv.errors)}`);
}

for (const file of walk(join(root, "examples"))) {
  const doc = readJson(file);
  if (typeof doc.$schema !== "string") continue;
  const validate = ajv.getSchema(doc.$schema);
  if (!validate) throw new Error(`${file}: schema not registered: ${doc.$schema}`);
  if (!validate(doc)) {
    throw new Error(`${file}: ${ajv.errorsText(validate.errors)}`);
  }
}

const validateVector = ajv.getSchema("https://mosvera.io/schema/0.1/compliance-vector");
if (!validateVector) throw new Error("compliance vector schema not registered");
for (const file of [
  ...walk(join(root, "compliance", "resolution")),
  ...walk(join(root, "compliance", "compilation")),
]) {
  const doc = readJson(file);
  if (!validateVector(doc)) {
    throw new Error(`${file}: ${ajv.errorsText(validateVector.errors)}`);
  }
}

for (const file of walk(join(root, "compliance", "emission"))) {
  readJson(file);
}

console.log("Mosvera spec validation passed");
