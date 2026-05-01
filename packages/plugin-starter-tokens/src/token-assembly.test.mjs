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

async function importTokenAssemblyHarness() {
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
  globalThis.__colorUtilsForTokenAssemblyTest = await importTsModule(path.resolve(__dirname, "presets/color-utils.ts"));

  const codePath = path.resolve(__dirname, "code.ts");
  const source = await fs.readFile(codePath, "utf8");
  const sourceWithoutImports = source.replace(/^import[\s\S]*?;\r?\n/gm, "");
  const dsCoreHarnessUrl = pathToFileURL(path.resolve(__dirname, "../../ds-core/src/index.js")).href;
  const harnessSource = `
import { basePatternSteps, closestPresetStep, closestStep, deriveShadeSteps, extendSteps, fallbackPresetSteps, getPaletteSteps, nextShadeStep, normalizePaletteKey, normalizePresetSteps, parsePresetNumericStep, pickSubset, resolveBaseStep, resolveClosestPaletteStep, sortPresetSteps } from "${dsCoreHarnessUrl}";
const __html__ = "";
const { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } = globalThis.__colorUtilsForTokenAssemblyTest;
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
  buildColorModeTokens,
  buildColorModeTokensFromBundle,
  buildGeneratedTokenDefinitions,
  buildPrimitiveTokens,
  buildRadiusTokens,
  buildSpacingTokens,
  buildTypographyTokens,
  deriveShadeSteps,
  normalizeBrands,
  resolveBaseStep,
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

function palette(prefix) {
  return Object.fromEntries(
    ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950", "1000", "1100"].map((step, index) => [
      step,
      `${prefix}${String(index).padStart(2, "0")}`,
    ]),
  );
}

function makeOptions(overrides = {}) {
  return {
    tokenLevel: "foundations",
    uiMode: "both",
    presetId: "fixture",
    hasCustomBrand: true,
    baseWhite: "#ffffff",
    baseBlack: "#000000",
    neutralChoice: "slate",
    namingPattern: "tailwind",
    shadeCount: 11,
    createTextStyles: false,
    selectedPalettes: ["red"],
    paletteOverrides: {},
    semanticOverrides: {},
    brands: [{ name: "Acme Primary", color: "#82BE5C" }],
    typography: {
      displayFamily: "Roboto",
      bodyFamily: "Inter",
      fontSizes: { "text-md": 16 },
      lineHeights: { "text-md": 24 },
      letterSpacings: { "text-md": 0 },
    },
    ...overrides,
  };
}

const {
  buildColorModeTokens,
  buildColorModeTokensFromBundle,
  buildGeneratedTokenDefinitions,
  buildPrimitiveTokens,
  buildRadiusTokens,
  buildSpacingTokens,
  buildTypographyTokens,
  deriveShadeSteps,
  normalizeBrands,
  resolveBaseStep,
} = await importTokenAssemblyHarness();

const preset = {
  id: "fixture",
  label: "Fixture",
  description: "Token assembly fixture",
  palettes: {
    slate: palette("#s"),
    red: palette("#r"),
    emerald: palette("#e"),
    amber: palette("#a"),
    sky: palette("#i"),
    fuchsia: palette("#f"),
  },
  neutralOptions: ["slate"],
  defaultNeutral: "slate",
  steps: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950", "1000", "1100"],
  previewPalettes: [],
};

const shadeSteps = deriveShadeSteps("tailwind", 11);
const baseStep = resolveBaseStep(shadeSteps);
const brands = normalizeBrands(makeOptions().brands, preset, shadeSteps, baseStep);

const foundationsOptions = makeOptions();
const foundationsResult = buildGeneratedTokenDefinitions(foundationsOptions, preset, brands, shadeSteps);
const expectedFoundations = [
  ...buildPrimitiveTokens(foundationsOptions, preset, brands, shadeSteps),
  ...buildTypographyTokens(foundationsOptions),
  ...buildSpacingTokens(),
  ...buildRadiusTokens(),
];
assert.deepEqual(foundationsResult.tokens, expectedFoundations, "foundation assembly matches the previous manual token concatenation");
assert.deepEqual(foundationsResult.bundleColorModeTokens, [], "foundation assembly has no TokenBundle color-mode tokens");
assert.equal(foundationsResult.colorModesResult, null, "foundation assembly has no generated color-mode result");

const colorModeOptions = makeOptions({ tokenLevel: "color-modes" });
const colorModeResult = buildGeneratedTokenDefinitions(colorModeOptions, preset, brands, shadeSteps);
const expectedColorModes = buildColorModeTokens("both", preset, "slate", shadeSteps, true, {});
assert.deepEqual(colorModeResult.tokens, [...expectedFoundations, ...expectedColorModes.tokens], "color-mode assembly appends generated semantic tokens");
assert.deepEqual(colorModeResult.bundleColorModeTokens, [], "generated color-mode assembly does not use TokenBundle branch");
assert.deepEqual(colorModeResult.colorModesResult, expectedColorModes, "generated color-mode assembly exposes the existing structure result");

const inputBundle = {
  schemaVersion: "1.0.0",
  source: "test",
  collections: {
    primitives: [],
    semantic: [
      {
        name: "text/primary",
        type: "COLOR",
        scopes: ["TEXT_FILL"],
        values: {
          light: { alias: "primitives/colors/base/black" },
          dark: { alias: "primitives/colors/base/white" },
        },
      },
    ],
    components: [],
  },
};
const bundleOptions = makeOptions({ tokenLevel: "color-modes", tokenBundle: inputBundle });
const bundleResult = buildGeneratedTokenDefinitions(bundleOptions, preset, brands, shadeSteps);
const expectedBundleColorModes = buildColorModeTokensFromBundle(inputBundle);
assert.deepEqual(bundleResult.tokens, [...expectedFoundations, ...expectedBundleColorModes], "TokenBundle assembly appends current bundle color-mode tokens");
assert.deepEqual(bundleResult.bundleColorModeTokens, expectedBundleColorModes, "TokenBundle assembly exposes bundle color-mode tokens for reports");
assert.equal(bundleResult.colorModesResult, null, "TokenBundle assembly does not generate semantic color modes");

console.log("token assembly seam tests passed.");
