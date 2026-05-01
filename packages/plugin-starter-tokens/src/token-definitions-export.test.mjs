import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

import { normalizeTokenBundle } from "../../ds-core/src/index.js";
import { exportTokenBundleJson } from "../../exporters/src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function transpileTsModule(filePath, replacements = []) {
  const source = await fs.readFile(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
  });
  let outputText = transpiled.outputText;
  const dsCoreUrl = pathToFileURL(path.resolve(__dirname, "../../ds-core/src/index.js")).href;
  outputText = outputText.replace(/from\s+["']@starter-tokens\/ds-core["']/g, `from "${dsCoreUrl}"`);
  for (const [pattern, replacement] of replacements) {
    outputText = outputText.replace(pattern, replacement);
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}

const mapperUrl = await transpileTsModule(path.resolve(__dirname, "token-definitions-to-token-bundle.ts"));
const exporterUrl = pathToFileURL(path.resolve(__dirname, "../../exporters/src/index.js")).href;
const bridgeUrl = await transpileTsModule(path.resolve(__dirname, "token-definitions-export.ts"), [
  [/from\s+["']\.\/token-definitions-to-token-bundle["']/g, `from "${mapperUrl}"`],
  [/from\s+["']\.\.\/\.\.\/exporters\/src\/index\.js["']/g, `from "${exporterUrl}"`],
]);

const { exportTokenDefinitionsJson } = await import(bridgeUrl);
const { tokenDefinitionsToTokenBundle } = await import(mapperUrl);

const raw = (value) => ({ kind: "raw", value });
const alias = (ref, collection) => ({ kind: "alias", ref, collection });

const tokens = [
  {
    collection: "primitives",
    name: "colors/base/white",
    type: "COLOR",
    scopes: ["ALL_SCOPES"],
    value: raw("#ffffff"),
  },
  {
    collection: "2. spacing",
    name: "spacing-md",
    type: "FLOAT",
    scopes: ["GAP", "WIDTH_HEIGHT"],
    value: alias("pixel/8", "primitives"),
  },
  {
    collection: "6. Typography",
    name: "font-family/font-family-body",
    type: "STRING",
    scopes: ["FONT_FAMILY"],
    value: raw("Inter"),
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
];

const mapperOptions = {
  source: "test",
  generatedAt: "2026-05-01T00:00:00.000Z",
};
const output = exportTokenDefinitionsJson(tokens, { mapperOptions });

assert.equal(typeof output, "string", "TokenDefinition JSON bridge returns a string");
assert.equal(output.endsWith("\n"), true, "TokenDefinition JSON bridge preserves exporter final newline");

const parsed = JSON.parse(output);
const expectedBundle = tokenDefinitionsToTokenBundle(tokens, mapperOptions);
assert.deepEqual(parsed, normalizeTokenBundle(expectedBundle), "parsed JSON equals the normalized mapped TokenBundle");
assert.equal(output, exportTokenBundleJson(expectedBundle), "bridge output matches JSON TokenBundle exporter output");

const primitivesByName = new Map(parsed.collections.primitives.map((token) => [token.name, token]));
assert.deepEqual(primitivesByName.get("colors/base/white").values, {
  light: "#ffffff",
  dark: "#ffffff",
}, "primitive raw values are preserved");
assert.deepEqual(primitivesByName.get("spacing-md").values, {
  light: { alias: "primitives/pixel/8" },
  dark: { alias: "primitives/pixel/8" },
}, "spacing aliases remain alias objects");
assert.deepEqual(primitivesByName.get("font-family/font-family-body").values, {
  light: "Inter",
  dark: "Inter",
}, "typography raw values are preserved");

const semanticByName = new Map(parsed.collections.semantic.map((token) => [token.name, token]));
assert.deepEqual(semanticByName.get("text/primary").values, {
  light: { alias: "primitives/colors/base/black" },
  dark: { alias: "primitives/colors/base/white" },
}, "semantic light and dark values are preserved as aliases");

assert.equal(exportTokenDefinitionsJson(tokens, { mapperOptions }), exportTokenDefinitionsJson(tokens, { mapperOptions }), "TokenDefinition JSON bridge is deterministic");
assert.equal(
  exportTokenDefinitionsJson(tokens, { mapperOptions, jsonOptions: { finalNewline: false, space: 0 } }).endsWith("\n"),
  false,
  "JSON formatting options are passed through to the exporter",
);

console.log("TokenDefinition JSON export bridge tests passed.");
