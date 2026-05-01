import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

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

async function importJsonExportControllerHarness() {
  globalThis.__jsonExportControllerMessages = [];
  globalThis.__jsonExportControllerCalls = [];
  globalThis.figma = {
    showUI() {},
    ui: {
      postMessage(message) {
        globalThis.__jsonExportControllerMessages.push(message);
      },
      onmessage: null,
    },
    notify() {},
    variables: {},
    root: { children: [] },
  };
  globalThis.__colorUtilsForJsonExportControllerTest = await importTsModule(path.resolve(__dirname, "presets/color-utils.ts"));

  const codePath = path.resolve(__dirname, "code.ts");
  const source = await fs.readFile(codePath, "utf8");
  const sourceWithoutImports = source.replace(/^import[\s\S]*?;\r?\n/gm, "");
  const dsCoreHarnessUrl = pathToFileURL(path.resolve(__dirname, "../../ds-core/src/index.js")).href;
  const harnessSource = `
import { basePatternSteps, closestPresetStep, closestStep, deriveShadeSteps, extendSteps, fallbackPresetSteps, getPaletteSteps, nextShadeStep, normalizePaletteKey, normalizePresetSteps, parsePresetNumericStep, pickSubset, resolveBaseStep, resolveClosestPaletteStep, sortPresetSteps } from "${dsCoreHarnessUrl}";
const __html__ = "";
const { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } = globalThis.__colorUtilsForJsonExportControllerTest;
const exportTokenDefinitionsJson = (tokens, options) => {
  globalThis.__jsonExportControllerCalls.push({ tokens, options });
  return JSON.stringify({ tokens: tokens.map((token) => token.name), options }) + "\\n";
};
const BUILTIN_PRESETS = [];
const getPresetById = () => null;
const getPresetSummaries = () => [];
const TEXT_STYLE_TEMPLATES = [];
const TYPOGRAPHY_REFERENCE = {
  fontFamily: { display: "Roboto", body: "Inter" },
  fontSize: { "text-md": 16 },
  lineHeight: { "text-md": 24 },
  fontWeight: { regular: "Regular" },
};
const normalizeTokenBundle = (value) => value;
const validateTokenBundle = () => ({ valid: true, errors: [] });
${sourceWithoutImports}
export {
  clearLastGeneratedJsonExport,
  compactReportForUi,
  getLastGeneratedJsonExport,
  prepareGeneratedJsonExport,
};
`;
  const transpiled = ts.transpileModule(harnessSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
  });
  return import(`data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString("base64")}`);
}

const {
  clearLastGeneratedJsonExport,
  compactReportForUi,
  getLastGeneratedJsonExport,
  prepareGeneratedJsonExport,
} = await importJsonExportControllerHarness();

const raw = (value) => ({ kind: "raw", value });
const tokens = [
  {
    collection: "primitives",
    name: "colors/base/white",
    type: "COLOR",
    scopes: ["ALL_SCOPES"],
    value: raw("#ffffff"),
  },
  {
    collection: "1. color-modes",
    name: "text/primary",
    type: "COLOR",
    scopes: ["TEXT_FILL"],
    modeValues: {
      light: raw("#000000"),
      dark: raw("#ffffff"),
    },
  },
];

clearLastGeneratedJsonExport();
assert.deepEqual(
  getLastGeneratedJsonExport(),
  {
    type: "json-export-result",
    jsonReady: false,
    filename: null,
    bytes: 0,
    tokenCount: 0,
    json: null,
  },
  "empty controller state reports no JSON export",
);

await globalThis.figma.ui.onmessage({ type: "request-last-json-export" });
assert.deepEqual(
  globalThis.__jsonExportControllerMessages.pop(),
  {
    type: "json-export-result",
    jsonReady: false,
    filename: null,
    bytes: 0,
    tokenCount: 0,
    json: null,
  },
  "requesting JSON before export returns an empty controller result",
);

const metadata = prepareGeneratedJsonExport(tokens);
const expectedJson = JSON.stringify({ tokens: ["colors/base/white", "text/primary"] }) + "\n";
assert.deepEqual(globalThis.__jsonExportControllerCalls, [{ tokens, options: undefined }], "controller calls the pure TokenDefinition JSON bridge");
assert.deepEqual(
  metadata,
  {
    jsonReady: true,
    filename: "ombrstudio-token-bundle.json",
    bytes: new TextEncoder().encode(expectedJson).length,
    tokenCount: 2,
  },
  "controller metadata is compact and byte-counted",
);

assert.deepEqual(
  getLastGeneratedJsonExport(),
  {
    type: "json-export-result",
    ...metadata,
    json: expectedJson,
  },
  "controller stores the full JSON only for the explicit JSON request path",
);

await globalThis.figma.ui.onmessage({ type: "request-last-json-export" });
assert.deepEqual(
  globalThis.__jsonExportControllerMessages.pop(),
  {
    type: "json-export-result",
    ...metadata,
    json: expectedJson,
  },
  "request-last-json-export returns the last generated JSON separately from generation results",
);

const compactReport = compactReportForUi({
  created: 0,
  updated: 0,
  collisionsReplaced: 0,
  aliasApplied: 0,
  aliasMissing: 0,
  warnings: [],
  migrations: [],
  collections: [],
  exportJson: metadata,
});
assert.deepEqual(compactReport.exportJson, metadata, "generate-result report may include compact JSON export metadata");
assert.equal("json" in compactReport.exportJson, false, "generate-result metadata does not include the full JSON payload");

console.log("JSON export controller contract tests passed.");
