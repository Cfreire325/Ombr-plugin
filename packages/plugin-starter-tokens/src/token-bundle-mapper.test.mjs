import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

import { normalizeTokenBundle } from "../../ds-core/src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importTsModule(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const dsCoreUrl = pathToFileURL(path.resolve(__dirname, "../../ds-core/src/index.js")).href;
  const outputText = transpiled.outputText.replace(/from\s+["']@starter-tokens\/ds-core["']/g, `from "${dsCoreUrl}"`);
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const { tokenDefinitionsToTokenBundle } = await importTsModule(path.resolve(__dirname, "token-definitions-to-token-bundle.ts"));

const raw = (value) => ({ kind: "raw", value });
const alias = (ref, collection) => ({ kind: "alias", ref, collection });

const tokens = [
  {
    collection: "primitives",
    name: "colors/base/white",
    type: "COLOR",
    scopes: ["ALL_SCOPES"],
    value: raw("#ffffff"),
    figmaVariable: { id: "VariableID:1" },
  },
  {
    collection: "primitives",
    name: "pixel/8",
    type: "FLOAT",
    scopes: ["GAP", "WIDTH_HEIGHT"],
    value: raw(8),
  },
  {
    collection: "2. spacing",
    name: "spacing-md",
    type: "FLOAT",
    scopes: ["GAP", "WIDTH_HEIGHT"],
    value: alias("pixel/8", "primitives"),
  },
  {
    collection: "3. radius",
    name: "radius-full",
    type: "FLOAT",
    scopes: ["CORNER_RADIUS"],
    value: alias("pixel/full", "primitives"),
  },
  {
    collection: "6. Typography",
    name: "font-family/font-family-body",
    type: "STRING",
    scopes: ["FONT_FAMILY"],
    value: raw("Inter"),
  },
  {
    collection: "6. Typography",
    name: "font-size/text-md",
    type: "FLOAT",
    scopes: ["FONT_SIZE"],
    value: raw(16),
  },
  {
    collection: "1. color-modes",
    name: "text/primary",
    type: "COLOR",
    scopes: ["TEXT_FILL"],
    modeValues: {
      light: alias("colors/base/black", "primitives"),
      dark: alias("colors/base/white", "primitives"),
    },
  },
  {
    collection: "1. color-modes",
    name: "text/brand",
    type: "COLOR",
    scopes: ["TEXT_FILL"],
    modeValues: {
      light: alias("text/accent-primary", "1. color-modes"),
      dark: alias("text/accent-primary", "1. color-modes"),
    },
  },
  {
    collection: "runtime-icons",
    name: "icon-node/search",
    type: "STRING",
    scopes: ["ALL_SCOPES"],
    value: raw("runtime-only"),
    figmaNode: { id: "NodeID:1" },
  },
];

const bundle = tokenDefinitionsToTokenBundle(tokens, {
  source: "test",
  generatedAt: "2026-05-01T00:00:00.000Z",
});

assert.equal(bundle.schemaVersion, "1.0.0");
assert.equal(bundle.source, "test");
assert.equal(bundle.generatedAt, "2026-05-01T00:00:00.000Z");
assert.deepEqual(Object.keys(bundle.collections), ["primitives", "semantic", "components"]);
assert.deepEqual(bundle.collections.components, [], "components collection is present and empty for current generated foundations");

const primitivesByName = new Map(bundle.collections.primitives.map((token) => [token.name, token]));
assert.deepEqual(primitivesByName.get("colors/base/white")?.values, {
  light: "#ffffff",
  dark: "#ffffff",
}, "primitive raw values map to both TokenBundle modes");
assert.deepEqual(primitivesByName.get("pixel/8")?.values, {
  light: 8,
  dark: 8,
}, "primitive pixel values map to both TokenBundle modes");
assert.deepEqual(primitivesByName.get("spacing-md")?.values, {
  light: { alias: "primitives/pixel/8" },
  dark: { alias: "primitives/pixel/8" },
}, "spacing aliases remain aliases to primitives");
assert.deepEqual(primitivesByName.get("radius-full")?.values, {
  light: { alias: "primitives/pixel/full" },
  dark: { alias: "primitives/pixel/full" },
}, "radius aliases remain aliases to primitives");
assert.deepEqual(primitivesByName.get("font-family/font-family-body")?.values, {
  light: "Inter",
  dark: "Inter",
}, "typography string tokens map to primitives");
assert.deepEqual(primitivesByName.get("font-size/text-md")?.values, {
  light: 16,
  dark: 16,
}, "typography float tokens map to primitives");

const semanticByName = new Map(bundle.collections.semantic.map((token) => [token.name, token]));
assert.deepEqual(semanticByName.get("text/primary")?.values, {
  light: { alias: "primitives/colors/base/black" },
  dark: { alias: "primitives/colors/base/white" },
}, "semantic light and dark mode aliases remain aliases");
assert.deepEqual(semanticByName.get("text/brand")?.values, {
  light: { alias: "semantic/text/accent-primary" },
  dark: { alias: "semantic/text/accent-primary" },
}, "semantic-to-semantic aliases remain aliases");

assert.deepEqual(primitivesByName.get("colors/base/white")?.scopes, ["ALL_SCOPES"], "scopes are preserved");
assert.equal(primitivesByName.has("icon-node/search"), false, "unsupported runtime-only token collections are excluded");
assert.equal(JSON.stringify(bundle).includes("figmaVariable"), false, "Figma variable objects are not leaked");
assert.equal(JSON.stringify(bundle).includes("figmaNode"), false, "Figma node objects are not leaked");

assert.deepEqual(bundle, normalizeTokenBundle(bundle), "mapper output is already normalized and deterministic");
assert.deepEqual(tokenDefinitionsToTokenBundle(tokens, { source: "test" }), tokenDefinitionsToTokenBundle(tokens, { source: "test" }));

console.log("TokenDefinition to TokenBundle mapper tests passed.");
