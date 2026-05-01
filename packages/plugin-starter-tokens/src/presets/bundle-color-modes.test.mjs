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

async function importBundleColorModesHarness() {
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
  globalThis.__colorUtilsForBundleColorModesTest = await importTsModule(path.resolve(packageSrcDir, "presets/color-utils.ts"));
  globalThis.__typographyReferenceForBundleColorModesTest = (
    await importTsModule(path.resolve(packageSrcDir, "presets/typography.generated.ts"))
  ).TYPOGRAPHY_REFERENCE;

  const codePath = path.resolve(packageSrcDir, "code.ts");
  const source = await fs.readFile(codePath, "utf8");
  const sourceWithoutImports = source.replace(/^import[\s\S]*?;\r?\n/gm, "");
  const dsCoreHarnessUrl = pathToFileURL(path.resolve(packageSrcDir, "../../ds-core/src/index.js")).href;
  const harnessSource = `
import { basePatternSteps, closestPresetStep, closestStep, deriveShadeSteps, extendSteps, fallbackPresetSteps, getPaletteSteps, nextShadeStep, normalizePaletteKey, normalizePresetSteps, parsePresetNumericStep, pickSubset, resolveBaseStep, resolveClosestPaletteStep, sortPresetSteps } from "${dsCoreHarnessUrl}";
const __html__ = "";
const { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } = globalThis.__colorUtilsForBundleColorModesTest;
const TYPOGRAPHY_REFERENCE = globalThis.__typographyReferenceForBundleColorModesTest;
const BUILTIN_PRESETS = [];
const getPresetById = () => null;
const getPresetSummaries = () => [];
const TEXT_STYLE_TEMPLATES = [];
const normalizeTokenBundle = (value) => value;
const validateTokenBundle = () => ({ valid: true, errors: [] });
${sourceWithoutImports}
export {
  buildColorModeTokensFromBundle,
  bundleValueToRuntimeTokenValue,
  mapBundleAlias,
  sanitizeBundleScopes,
  toVariableType,
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

function assertThrowsMessage(fn, message) {
  assert.throws(fn, (error) => error instanceof Error && error.message === message);
}

function rawValue(value) {
  return { kind: "raw", value };
}

function aliasValue(ref, collection) {
  return { kind: "alias", ref, collection };
}

const {
  buildColorModeTokensFromBundle,
  bundleValueToRuntimeTokenValue,
  mapBundleAlias,
  sanitizeBundleScopes,
  toVariableType,
} = await importBundleColorModesHarness();

assert.deepEqual(mapBundleAlias("primitives/colors/brand/500"), {
  ref: "colors/brand/500",
  collection: "primitives",
}, "primitive aliases target the primitives runtime collection");
assert.deepEqual(mapBundleAlias("semantic/text/primary"), {
  ref: "text/primary",
  collection: "1. color-modes",
}, "semantic aliases target the current color-modes runtime collection");
assert.deepEqual(mapBundleAlias("components/button/bg"), {
  ref: "button/bg",
  collection: "1. color-modes",
}, "component aliases currently target the color-modes runtime collection");
assertThrowsMessage(() => mapBundleAlias("colors"), "Alias bundle invalide: colors");
assertThrowsMessage(() => mapBundleAlias("theme/colors/brand/500"), "Collection alias non supportee dans TokenBundle: theme");
assertThrowsMessage(() => mapBundleAlias("{primitives/colors/brand/500}"), "Collection alias non supportee dans TokenBundle: {primitives");
assertThrowsMessage(() => mapBundleAlias("primitives.colors.brand.500"), "Alias bundle invalide: primitives.colors.brand.500");

assert.deepEqual(bundleValueToRuntimeTokenValue("#ffffff"), rawValue("#ffffff"), "hex color values stay raw");
assert.deepEqual(bundleValueToRuntimeTokenValue("rgb(1, 2, 3)"), rawValue("rgb(1, 2, 3)"), "rgb values stay raw");
assert.deepEqual(bundleValueToRuntimeTokenValue("rgba(1, 2, 3, 0.5)"), rawValue("rgba(1, 2, 3, 0.5)"), "rgba values stay raw");
assert.deepEqual(bundleValueToRuntimeTokenValue(8), rawValue(8), "numeric values stay raw");
assert.deepEqual(bundleValueToRuntimeTokenValue("8"), rawValue("8"), "numeric strings stay raw strings");
assert.deepEqual(bundleValueToRuntimeTokenValue("Regular"), rawValue("Regular"), "string values stay raw");
assert.deepEqual(bundleValueToRuntimeTokenValue({ alias: "semantic/text/primary" }), aliasValue("text/primary", "1. color-modes"));
assertThrowsMessage(() => bundleValueToRuntimeTokenValue({ alias: "" }), "Alias bundle invalide: ");
assertThrowsMessage(() => bundleValueToRuntimeTokenValue({ alias: "bad/x" }), "Collection alias non supportee dans TokenBundle: bad");

assert.equal(toVariableType("COLOR"), "COLOR");
assert.equal(toVariableType("FLOAT"), "FLOAT");
assert.equal(toVariableType("STRING"), "STRING");
assert.equal(toVariableType("color"), "COLOR", "lowercase color currently falls back to COLOR");
assert.equal(toVariableType("WEIRD"), "COLOR", "unknown types currently fall back to COLOR");
assert.equal(toVariableType(""), "COLOR", "empty type currently falls back to COLOR");

assert.deepEqual(sanitizeBundleScopes(["TEXT_FILL", "STROKE_COLOR"], "text/primary"), ["TEXT_FILL", "STROKE_COLOR"]);
assert.deepEqual(sanitizeBundleScopes(["BAD", ""], "text/primary"), ["TEXT_FILL"], "invalid scopes fall back to semantic scopes");
assert.deepEqual(sanitizeBundleScopes(undefined, "bg/primary"), ["FRAME_FILL", "SHAPE_FILL"], "missing bg scopes use semantic fallback");
assert.deepEqual(sanitizeBundleScopes([], "border/primary"), ["STROKE_COLOR"], "empty border scopes use semantic fallback");
assert.deepEqual(sanitizeBundleScopes(undefined, "icon/primary"), ["STROKE_COLOR", "SHAPE_FILL"], "missing icon scopes use semantic fallback");
assert.deepEqual(sanitizeBundleScopes(undefined, "alpha/custom"), ["ALL_FILLS"], "missing alpha scopes use semantic fallback");
assert.deepEqual(sanitizeBundleScopes(["ALL_SCOPES", "TEXT_FILL"], "text/primary"), ["ALL_SCOPES", "TEXT_FILL"], "bundle scope sanitizer does not collapse ALL_SCOPES");
assert.deepEqual(sanitizeBundleScopes(["TEXT_FILL", "BAD", " TEXT_FILL ", ""], "text/primary"), ["TEXT_FILL", "TEXT_FILL"], "bundle scope sanitizer trims but does not deduplicate");

const bundle = {
  schemaVersion: "1.0.0",
  source: "test",
  collections: {
    primitives: [
      { name: "colors/brand/500", type: "COLOR", values: { light: "#3366ff", dark: "#6690ff" } },
      { name: "spacing/8", type: "FLOAT", values: { light: 8, dark: 8 } },
      { name: "font/body", type: "STRING", values: { light: "Inter", dark: "Inter" } },
    ],
    semantic: [
      {
        name: "text/primary",
        type: "COLOR",
        scopes: ["TEXT_FILL", "BAD", " TEXT_FILL ", ""],
        description: "Ignored description",
        meta: { ignored: true },
        values: {
          light: { alias: "primitives/colors/brand/500" },
          dark: "#ffffff",
        },
      },
      {
        name: "bg/surface",
        type: "WEIRD",
        values: {
          light: "rgb(1, 2, 3)",
          dark: { alias: "semantic/bg/primary" },
        },
      },
      {
        name: "border/default",
        type: "FLOAT",
        scopes: ["STROKE_FLOAT", "NOPE"],
        values: {
          light: 1,
          dark: "2",
        },
      },
      {
        name: "icon/primary",
        type: "STRING",
        scopes: ["FONT_STYLE"],
        values: {
          light: "Regular",
          dark: { alias: "components/icon/primary" },
        },
      },
      {
        name: "alpha/custom",
        type: "COLOR",
        scopes: [],
        values: {
          light: "rgba(1, 2, 3, 0.5)",
          dark: { alias: "components/button/bg" },
        },
      },
      {
        name: "misc/no-scope",
        type: "FLOAT",
        values: {
          light: 12,
          dark: { alias: "primitives/spacing/8" },
        },
      },
    ],
    components: [
      {
        name: "button/bg",
        type: "COLOR",
        values: {
          light: { alias: "semantic/bg/surface" },
          dark: "#000000",
        },
      },
      {
        name: "button/radius",
        type: "FLOAT",
        values: {
          light: 8,
          dark: 8,
        },
      },
    ],
  },
};

const tokens = buildColorModeTokensFromBundle(bundle);
assert.equal(tokens.length, 6, "only semantic entries are emitted as runtime color-mode tokens");
assert.deepEqual(tokens.map((token) => token.name), [
  "text/primary",
  "bg/surface",
  "border/default",
  "icon/primary",
  "alpha/custom",
  "misc/no-scope",
], "semantic token order and names are preserved");
assert.equal(tokens.some((token) => token.name === "colors/brand/500"), false, "primitive entries are not emitted directly");
assert.equal(tokens.some((token) => token.name === "button/bg"), false, "component entries are not emitted directly");

assert.deepEqual(tokens[0], {
  collection: "1. color-modes",
  name: "text/primary",
  type: "COLOR",
  scopes: ["TEXT_FILL", "TEXT_FILL"],
  modeValues: {
    light: aliasValue("colors/brand/500", "primitives"),
    dark: rawValue("#ffffff"),
  },
}, "semantic alias to primitives maps into the color-modes token shape");
assert.equal("description" in tokens[0], false, "description is not preserved in mapped runtime tokens");
assert.equal("meta" in tokens[0], false, "meta is not preserved in mapped runtime tokens");

assert.deepEqual(tokens[1], {
  collection: "1. color-modes",
  name: "bg/surface",
  type: "COLOR",
  scopes: ["FRAME_FILL", "SHAPE_FILL"],
  modeValues: {
    light: rawValue("rgb(1, 2, 3)"),
    dark: aliasValue("bg/primary", "1. color-modes"),
  },
}, "unknown TokenBundle type falls back to COLOR and semantic alias targets color modes");

assert.deepEqual(tokens[2], {
  collection: "1. color-modes",
  name: "border/default",
  type: "FLOAT",
  scopes: ["STROKE_FLOAT"],
  modeValues: {
    light: rawValue(1),
    dark: rawValue("2"),
  },
}, "FLOAT mode values are passed through without numeric string coercion");

assert.deepEqual(tokens[3], {
  collection: "1. color-modes",
  name: "icon/primary",
  type: "STRING",
  scopes: ["FONT_STYLE"],
  modeValues: {
    light: rawValue("Regular"),
    dark: aliasValue("icon/primary", "1. color-modes"),
  },
}, "STRING values and component aliases map to runtime token values");

assert.deepEqual(tokens[4], {
  collection: "1. color-modes",
  name: "alpha/custom",
  type: "COLOR",
  scopes: ["ALL_FILLS"],
  modeValues: {
    light: rawValue("rgba(1, 2, 3, 0.5)"),
    dark: aliasValue("button/bg", "1. color-modes"),
  },
}, "empty scopes fall back by semantic token name and component aliases target color modes");

assert.deepEqual(tokens[5], {
  collection: "1. color-modes",
  name: "misc/no-scope",
  type: "FLOAT",
  scopes: ["ALL_SCOPES"],
  modeValues: {
    light: rawValue(12),
    dark: aliasValue("spacing/8", "primitives"),
  },
}, "unknown semantic token names fall back to ALL_SCOPES");

assert.deepEqual(buildColorModeTokensFromBundle({
  schemaVersion: "1.0.0",
  source: "test",
  collections: { primitives: [], semantic: [], components: [{ name: "button/bg", type: "COLOR", values: { light: "#fff", dark: "#000" } }] },
}), [], "component-only TokenBundles currently produce no color-mode runtime tokens");

assertThrowsMessage(
  () => buildColorModeTokensFromBundle({
    schemaVersion: "1.0.0",
    source: "test",
    collections: {
      primitives: [],
      semantic: [{ name: "text/bad", type: "COLOR", values: { light: { alias: "theme/colors/brand/500" }, dark: "#fff" } }],
      components: [],
    },
  }),
  "Collection alias non supportee dans TokenBundle: theme",
);

console.log("TokenBundle color-mode mapping tests passed.");
