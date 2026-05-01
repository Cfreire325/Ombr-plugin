import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageSrcDir = path.resolve(__dirname, "..");

async function importTsModule(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const dsCoreUrl = pathToFileURL(path.resolve(packageSrcDir, "../../ds-core/src/index.js")).href;
  const outputText = transpiled.outputText.replace(/from\s+["']@starter-tokens\/ds-core["']/g, `from "${dsCoreUrl}"`);
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

async function importSpacingRadiusHarness() {
  globalThis.figma = {
    showUI() {},
    ui: {
      postMessage() {},
      onmessage: null,
    },
    notify() {},
    variables: {},
    root: { children: [] },
  };
  globalThis.__colorUtilsForSpacingRadiusTest = await importTsModule(path.resolve(packageSrcDir, "presets/color-utils.ts"));
  globalThis.__typographyReferenceForSpacingRadiusTest = (
    await importTsModule(path.resolve(packageSrcDir, "presets/typography.generated.ts"))
  ).TYPOGRAPHY_REFERENCE;

  const codePath = path.resolve(packageSrcDir, "code.ts");
  const source = await fs.readFile(codePath, "utf8");
  const sourceWithoutImports = source.replace(/^import[\s\S]*?;\r?\n/gm, "");
  const dsCoreHarnessUrl = pathToFileURL(path.resolve(packageSrcDir, "../../ds-core/src/index.js")).href;
  const harnessSource = `
import { basePatternSteps, closestPresetStep, closestStep, deriveShadeSteps, extendSteps, fallbackPresetSteps, getPaletteSteps, nextShadeStep, normalizePresetSteps, parsePresetNumericStep, pickSubset, resolveBaseStep, resolveClosestPaletteStep, sortPresetSteps } from "${dsCoreHarnessUrl}";
const __html__ = "";
const { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } = globalThis.__colorUtilsForSpacingRadiusTest;
const TYPOGRAPHY_REFERENCE = globalThis.__typographyReferenceForSpacingRadiusTest;
const BUILTIN_PRESETS = [];
const getPresetById = () => null;
const getPresetSummaries = () => [];
const TEXT_STYLE_TEMPLATES = [];
const normalizeTokenBundle = (value) => value;
const validateTokenBundle = () => ({ valid: true, errors: [] });
${sourceWithoutImports}
export {
  PIXEL_VALUES,
  RADIUS_ALIAS_MAP,
  SPACING_ALIAS_MAP,
  buildRadiusTokens,
  buildSpacingTokens,
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

function aliasToken(collection, name, scopes, ref) {
  return {
    collection,
    name,
    type: "FLOAT",
    scopes,
    value: {
      kind: "alias",
      ref,
      collection: "primitives",
    },
  };
}

const {
  PIXEL_VALUES,
  RADIUS_ALIAS_MAP,
  SPACING_ALIAS_MAP,
  buildRadiusTokens,
  buildSpacingTokens,
} = await importSpacingRadiusHarness();

assert.deepEqual(PIXEL_VALUES, [
  0,
  2,
  4,
  6,
  8,
  10,
  12,
  14,
  16,
  20,
  24,
  28,
  32,
  40,
  44,
  48,
  56,
  64,
  80,
  96,
  112,
  128,
  144,
  160,
  176,
  192,
  208,
  224,
  240,
  256,
], "pixel foundation values stay stable");
assert.equal(PIXEL_VALUES.includes(0), true, "pixel/0 value is present");
assert.equal(PIXEL_VALUES.includes(1), false, "pixel/1 value is not currently present");
assert.equal(PIXEL_VALUES.includes(8), true, "pixel/8 value is present");
assert.equal(PIXEL_VALUES.includes(16), true, "pixel/16 value is present");
assert.equal(PIXEL_VALUES.includes(256), true, "pixel/256 value is present");

assert.deepEqual(SPACING_ALIAS_MAP, [
  ["spacing-none", "0"],
  ["spacing-xxs", "2"],
  ["spacing-xs", "4"],
  ["spacing-sm", "6"],
  ["spacing-md", "8"],
  ["spacing-lg", "12"],
  ["spacing-xl", "16"],
  ["spacing-2xl", "20"],
  ["spacing-3xl", "24"],
  ["spacing-4xl", "32"],
  ["spacing-5xl", "40"],
  ["spacing-6xl", "48"],
  ["spacing-7xl", "64"],
  ["spacing-8xl", "80"],
  ["spacing-9xl", "96"],
  ["spacing-10xl", "128"],
  ["spacing-11xl", "160"],
], "spacing aliases and pixel refs stay stable");

assert.deepEqual(RADIUS_ALIAS_MAP, [
  ["radius-none", "0"],
  ["radius-xxs", "2"],
  ["radius-xs", "4"],
  ["radius-sm", "6"],
  ["radius-md", "8"],
  ["radius-lg", "10"],
  ["radius-xl", "12"],
  ["radius-2xl", "16"],
  ["radius-3xl", "20"],
  ["radius-4xl", "24"],
  ["radius-full", "full"],
], "radius aliases and pixel refs stay stable");

const spacingTokens = buildSpacingTokens();
const radiusTokens = buildRadiusTokens();
const spacingByName = new Map(spacingTokens.map((token) => [token.name, token]));
const radiusByName = new Map(radiusTokens.map((token) => [token.name, token]));

assert.equal(spacingTokens.length, 17, "spacing token count stays stable");
assert.equal(radiusTokens.length, 11, "radius token count stays stable");

for (const [name, pixelRef] of SPACING_ALIAS_MAP) {
  assert.deepEqual(
    spacingByName.get(name),
    aliasToken("2. spacing", name, ["GAP", "WIDTH_HEIGHT"], `pixel/${pixelRef}`),
    `${name} remains an alias to pixel/${pixelRef}`,
  );
}

for (const [name, pixelRef] of RADIUS_ALIAS_MAP) {
  assert.deepEqual(
    radiusByName.get(name),
    aliasToken("3. radius", name, ["CORNER_RADIUS"], `pixel/${pixelRef}`),
    `${name} remains an alias to pixel/${pixelRef}`,
  );
}

assert.deepEqual(spacingByName.get("spacing-none"), aliasToken("2. spacing", "spacing-none", ["GAP", "WIDTH_HEIGHT"], "pixel/0"));
assert.deepEqual(spacingByName.get("spacing-md"), aliasToken("2. spacing", "spacing-md", ["GAP", "WIDTH_HEIGHT"], "pixel/8"));
assert.deepEqual(spacingByName.get("spacing-xl"), aliasToken("2. spacing", "spacing-xl", ["GAP", "WIDTH_HEIGHT"], "pixel/16"));
assert.deepEqual(spacingByName.get("spacing-11xl"), aliasToken("2. spacing", "spacing-11xl", ["GAP", "WIDTH_HEIGHT"], "pixel/160"));
assert.equal(spacingByName.has("spacing-full"), false, "spacing/full is not currently generated");

assert.deepEqual(radiusByName.get("radius-none"), aliasToken("3. radius", "radius-none", ["CORNER_RADIUS"], "pixel/0"));
assert.deepEqual(radiusByName.get("radius-md"), aliasToken("3. radius", "radius-md", ["CORNER_RADIUS"], "pixel/8"));
assert.deepEqual(radiusByName.get("radius-2xl"), aliasToken("3. radius", "radius-2xl", ["CORNER_RADIUS"], "pixel/16"));
assert.deepEqual(radiusByName.get("radius-full"), aliasToken("3. radius", "radius-full", ["CORNER_RADIUS"], "pixel/full"));

console.log("spacing and radius token fixture tests passed.");
