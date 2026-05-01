import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageSrcDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageSrcDir, "../../..");

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

async function importGenerationOptionsHarness() {
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
  globalThis.__colorUtilsForGenerationOptionsTest = await importTsModule(path.resolve(packageSrcDir, "presets/color-utils.ts"));
  globalThis.__typographyReferenceForGenerationOptionsTest = (
    await importTsModule(path.resolve(packageSrcDir, "presets/typography.generated.ts"))
  ).TYPOGRAPHY_REFERENCE;
  const dsCore = await import(pathToFileURL(path.resolve(repoRoot, "packages/ds-core/src/index.js")).href);
  globalThis.__normalizeTokenBundleForGenerationOptionsTest = dsCore.normalizeTokenBundle;
  globalThis.__validateTokenBundleForGenerationOptionsTest = dsCore.validateTokenBundle;
  globalThis.__builtinPresetsForGenerationOptionsTest = [
    {
      id: "tailwind",
      label: "Tailwind",
      description: "Test Tailwind preset",
      palettes: {
        gray: { 50: "#f9fafb", 100: "#f3f4f6", 500: "#6b7280" },
        red: { 500: "#ef4444" },
        blue: { 500: "#3b82f6" },
      },
      neutralOptions: ["gray"],
      defaultNeutral: "gray",
      steps: ["50", "100", "500"],
      previewPalettes: [],
    },
    {
      id: "material",
      label: "Material",
      description: "Test Material preset",
      palettes: {
        neutral: { black: "#000000", white: "#ffffff" },
        purple: { 500: "#9c27b0" },
      },
      neutralOptions: ["neutral"],
      defaultNeutral: "neutral",
      steps: ["black", "white", "500"],
      previewPalettes: [],
    },
  ];

  const codePath = path.resolve(packageSrcDir, "code.ts");
  const source = await fs.readFile(codePath, "utf8");
  const sourceWithoutImports = source.replace(/^import[\s\S]*?;\r?\n/gm, "");
  const harnessSource = `
const __html__ = "";
const { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } = globalThis.__colorUtilsForGenerationOptionsTest;
const TYPOGRAPHY_REFERENCE = globalThis.__typographyReferenceForGenerationOptionsTest;
const BUILTIN_PRESETS = globalThis.__builtinPresetsForGenerationOptionsTest;
const getPresetById = (presetId) => BUILTIN_PRESETS.find((preset) => preset.id === presetId);
const getPresetSummaries = () => [];
const TEXT_STYLE_TEMPLATES = [];
const normalizeTokenBundle = globalThis.__normalizeTokenBundleForGenerationOptionsTest;
const validateTokenBundle = globalThis.__validateTokenBundleForGenerationOptionsTest;
${sourceWithoutImports}
export {
  buildGenerationOptions,
  clampNumber,
  normalizeIconLibraryId,
  normalizeIconPackIds,
  normalizeIconStrokeId,
  normalizeNamingPattern,
  normalizeSemanticOverridesInput,
  normalizeTokenBundleInput,
  normalizeTokenLevel,
  normalizeUiMode,
  resolveIconSemanticTokenName,
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

const {
  buildGenerationOptions,
  clampNumber,
  normalizeIconLibraryId,
  normalizeIconPackIds,
  normalizeIconStrokeId,
  normalizeNamingPattern,
  normalizeSemanticOverridesInput,
  normalizeTokenBundleInput,
  normalizeTokenLevel,
  normalizeUiMode,
  resolveIconSemanticTokenName,
} = await importGenerationOptionsHarness();

const defaultFontSizes = {
  label: 10,
  "text-xs": 12,
  "text-sm": 14,
  "text-md": 16,
  "text-lg": 18,
  "text-xl": 20,
  "display-xs": 24,
  "display-sm": 30,
  "display-md": 36,
  "display-lg": 48,
  "display-xl": 60,
  "display-2xl": 72,
};
const defaultLineHeights = {
  label: 14,
  "text-xs": 18,
  "text-sm": 20,
  "text-md": 24,
  "text-lg": 28,
  "text-xl": 30,
  "display-xs": 32,
  "display-sm": 38,
  "display-md": 44,
  "display-lg": 60,
  "display-xl": 72,
  "display-2xl": 88,
};
const defaultLetterSpacings = Object.fromEntries(Object.keys(defaultFontSizes).map((key) => [key, 0]));

assertThrowsMessage(() => buildGenerationOptions(null), "Payload generation invalide.");
assertThrowsMessage(() => buildGenerationOptions("payload"), "Payload generation invalide.");

const defaults = buildGenerationOptions({});
assert.equal(defaults.tokenLevel, "foundations", "default token level is foundations");
assert.equal(defaults.uiMode, "light", "default UI mode is light");
assert.equal(defaults.presetId, "tailwind", "missing preset ID uses first builtin preset ID");
assert.equal(defaults.neutralChoice, "gray", "default neutral comes from selected preset");
assert.equal(defaults.namingPattern, "tailwind", "default naming pattern is tailwind");
assert.equal(defaults.shadeCount, 11, "default shade count is 11");
assert.equal(defaults.createTextStyles, true, "text styles default to enabled");
assert.equal(defaults.hasCustomBrand, false, "empty payload is not custom brand input");
assert.equal(defaults.baseWhite, "#ffffff", "default base white stays stable");
assert.equal(defaults.baseBlack, "#000000", "default base black stays stable");
assert.deepEqual(defaults.brands, [{ name: "brand-primary", color: "#82BE5C", contrast: undefined, scale: undefined }]);
assert.deepEqual(defaults.selectedPalettes, [], "default selected palettes are empty");
assert.deepEqual(defaults.paletteOverrides, {}, "default palette overrides are empty");
assert.deepEqual(defaults.semanticOverrides, {}, "default semantic overrides are empty");
assert.equal(defaults.tokenBundle, undefined, "default TokenBundle input is undefined");
assert.deepEqual(defaults.icons, {
  library: "lucide",
  includeStarterPack: true,
  packs: ["navigation", "actions"],
  size: 24,
  colorAlias: "icon/primary",
  stroke: "medium",
}, "default icon settings stay stable");
assert.deepEqual(defaults.typography, {
  displayFamily: "Roboto",
  bodyFamily: "Inter",
  fontSizes: defaultFontSizes,
  lineHeights: defaultLineHeights,
  letterSpacings: defaultLetterSpacings,
  styleFamilies: {},
  styleWeights: {},
}, "default typography payload stays stable");

assert.equal(normalizeTokenLevel("color-modes"), "color-modes");
assert.equal(normalizeTokenLevel("foundations"), "foundations");
assert.equal(normalizeTokenLevel("invalid"), "foundations");
assert.equal(normalizeTokenLevel(undefined), "foundations");
assert.equal(normalizeUiMode("dark"), "dark");
assert.equal(normalizeUiMode("both"), "both");
assert.equal(normalizeUiMode("light"), "light");
assert.equal(normalizeUiMode("invalid"), "light");
assert.equal(normalizeUiMode(undefined), "light");
assert.equal(normalizeNamingPattern("hundreds"), "hundreds");
assert.equal(normalizeNamingPattern("tailwind"), "tailwind");
assert.equal(normalizeNamingPattern("invalid"), "tailwind");
assert.equal(normalizeNamingPattern(undefined), "tailwind");

assert.equal(clampNumber(undefined, 6, 14, 11), 11, "undefined shade count uses fallback");
assert.equal(clampNumber(1, 6, 14, 11), 6, "shade count clamps below minimum");
assert.equal(clampNumber(20, 6, 14, 11), 14, "shade count clamps above maximum");
assert.equal(clampNumber("7.8", 6, 14, 11), 8, "string shade count is rounded");
assert.equal(clampNumber("oops", 6, 14, 11), 11, "invalid shade count uses fallback");
assert.equal(clampNumber(7.2, 6, 14, 11), 7, "decimal shade count rounds down when below .5");
assert.equal(clampNumber(7.8, 6, 14, 11), 8, "decimal shade count rounds up when .5 or above");
assert.equal(clampNumber(Number.NaN, 6, 14, 11), 11, "NaN shade count uses fallback");

const full = buildGenerationOptions({
  tokenLevel: "color-modes",
  uiMode: "both",
  presetId: "material",
  baseWhite: " #fefefe ",
  baseBlack: " #010101 ",
  neutralChoice: "neutral",
  namingPattern: "hundreds",
  shadeCount: "7.8",
  createTextStyles: false,
  brands: [
    { name: " Primary ", color: " #112233 ", contrast: "4.5", scale: { 500: " #112233 ", bad: "", 600: 123 } },
    { name: "Second", color: "#445566", contrast: "oops" },
  ],
  selectedPalettes: [" Red Palette! ", "", "blue"],
  paletteOverrides: {
    "Red Palette!": { 500: " #abcdef ", bad: "not-a-color", empty: "" },
    blue: { 500: "#123456" },
    empty: null,
  },
  semanticOverrides: {
    " Text/Primary ": " {gray/900} ",
    bad: "gray/900",
    empty: "",
    malformed: "{gray/900",
  },
  typography: {
    displayFamily: " Display Font ",
    bodyFamily: " Body Font ",
    fontSizes: { "text-md": "20", "text-lg": 0, custom: 99 },
    lineHeights: { "text-md": "30", "text-lg": "bad" },
    letterSpacings: { "text-md": "-0.25", "text-lg": "bad" },
    styleFamilies: { " text-md ": " Display Alt ", empty: "", bad: null },
    styleWeights: { " text-md ": [" Regular ", "", "Bold"], bad: "Regular", empty: [] },
  },
  icons: {
    library: "tabler",
    includeStarterPack: false,
    packs: ["navigation", "bad", "actions", "navigation"],
    size: "32.7",
    colorAlias: " {Semantic.Icon.Secondary} ",
    stroke: "bold",
  },
});
assert.equal(full.tokenLevel, "color-modes");
assert.equal(full.uiMode, "both");
assert.equal(full.presetId, "material");
assert.equal(full.neutralChoice, "neutral");
assert.equal(full.namingPattern, "hundreds");
assert.equal(full.shadeCount, 8);
assert.equal(full.createTextStyles, false);
assert.equal(full.hasCustomBrand, true);
assert.equal(full.baseWhite, "#fefefe");
assert.equal(full.baseBlack, "#010101");
assert.deepEqual(full.brands, [
  { name: "Primary", color: "#112233", contrast: 4.5, scale: { 500: "#112233" } },
  { name: "Second", color: "#445566", contrast: undefined, scale: undefined },
], "brand input trims strings, preserves only string custom scale values, and parses numeric contrast");
assert.deepEqual(full.selectedPalettes, ["red-palette", "blue"], "selected palettes are normalized and empty entries are removed");
assert.deepEqual(full.paletteOverrides, {
  "red-palette": { 500: "#abcdef" },
  blue: { 500: "#123456" },
}, "palette overrides keep valid colors and drop invalid entries");
assert.deepEqual(full.semanticOverrides, { "text/primary": "{gray/900}" }, "semantic overrides keep only brace-wrapped references");
assert.deepEqual(full.typography.fontSizes, { ...defaultFontSizes, "text-md": 20 }, "typography font sizes only accept default keys");
assert.deepEqual(full.typography.lineHeights, { ...defaultLineHeights, "text-md": 30 }, "typography line heights only accept valid default keys");
assert.deepEqual(full.typography.letterSpacings, { ...defaultLetterSpacings, "text-md": -0.25 }, "typography letter spacings accept finite values, including negative");
assert.deepEqual(full.typography.styleFamilies, { "text-md": "Display Alt" }, "style families trim keys and values");
assert.deepEqual(full.typography.styleWeights, { "text-md": ["Regular", "Bold"] }, "style weights keep nonempty arrays of trimmed labels");
assert.deepEqual(full.icons, {
  library: "tabler",
  includeStarterPack: false,
  packs: ["navigation", "bad", "actions", "navigation"],
  size: 33,
  colorAlias: "{semantic.icon.secondary}",
  stroke: "bold",
}, "buildGenerationOptions keeps raw icon library and pack IDs while normalizing size/color/stroke");

const invalidPreset = buildGenerationOptions({ presetId: "nope" });
assert.equal(invalidPreset.presetId, "nope", "invalid preset ID is preserved in options");
assert.equal(invalidPreset.neutralChoice, "gray", "invalid preset ID still uses first preset for defaults");
assertThrowsMessage(() => buildGenerationOptions({ baseWhite: "nope" }), "Unsupported color format: nope");
assertThrowsMessage(() => buildGenerationOptions({ brands: [{ color: "nope" }] }), "Unsupported color format: nope");
assert.deepEqual(buildGenerationOptions({ brands: [{ name: "Primary", color: "" }] }).brands, [
  { name: "Primary", color: "#82BE5C", contrast: undefined, scale: undefined },
], "missing primary brand color falls back to default brand color");

const validBundle = {
  schemaVersion: "1.0.0",
  source: "figma",
  collections: {
    primitives: [{ name: "Colors.Brand.500", type: "COLOR", values: { light: "#3366ff", dark: "#6690ff" } }],
    semantic: [{
      name: "Text.Primary",
      type: "COLOR",
      values: {
        light: { alias: "Primitives.Colors.Brand 500" },
        dark: { alias: "Primitives.Colors.Brand 500" },
      },
    }],
    components: [],
  },
};
const normalizedBundle = normalizeTokenBundleInput(validBundle);
assert.deepEqual(normalizedBundle.collections.primitives[0].name, "colors/brand/500");
assert.deepEqual(normalizedBundle.collections.semantic[0].values.light, { alias: "primitives/colors/brand-500" });
assert.equal(buildGenerationOptions({ tokenLevel: "color-modes", tokenBundle: validBundle }).tokenBundle.collections.semantic[0].name, "text/primary");
assert.equal(normalizeTokenBundleInput(undefined), undefined, "missing TokenBundle returns undefined");
assertThrowsMessage(
  () => normalizeTokenBundleInput({
    schemaVersion: "1.0.0",
    source: "figma",
    collections: {
      primitives: [{ name: "bad token", type: "COLOR", values: { light: "not-a-color", dark: "#fff" } }],
      semantic: [],
      components: [],
    },
  }),
  "TokenBundle invalide: collections.primitives[0].values.light: Invalid COLOR format: not-a-color",
);

assert.deepEqual(normalizeSemanticOverridesInput({
  " Text/Primary ": " {gray/900} ",
  bad: "gray/900",
  empty: "",
  malformed: "{gray/900",
  lower: " {BRAND/500} ",
}), {
  "text/primary": "{gray/900}",
  lower: "{BRAND/500}",
}, "semantic override normalization trims and lowercases keys but preserves reference casing");

assert.equal(normalizeIconLibraryId("tabler"), "tabler");
assert.equal(normalizeIconLibraryId("phosphor"), "phosphor");
assert.equal(normalizeIconLibraryId("iconoir"), "iconoir");
assert.equal(normalizeIconLibraryId("lucide"), "lucide");
assert.equal(normalizeIconLibraryId("bad"), "lucide");
assert.equal(normalizeIconLibraryId(" TABLER "), "tabler");
assert.equal(normalizeIconStrokeId("light"), "light");
assert.equal(normalizeIconStrokeId("regular"), "regular");
assert.equal(normalizeIconStrokeId("medium"), "medium");
assert.equal(normalizeIconStrokeId("bold"), "bold");
assert.equal(normalizeIconStrokeId("bad"), "medium");
assert.equal(normalizeIconStrokeId(" BOLD "), "bold");
assert.deepEqual(normalizeIconPackIds(["navigation", "bad", "actions", "navigation", " files-folders "]), [
  "navigation",
  "actions",
  "files-folders",
], "icon pack normalization filters invalid entries, trims, and deduplicates");
assert.deepEqual(normalizeIconPackIds(undefined), [], "missing icon packs normalize to empty array");
assert.equal(resolveIconSemanticTokenName("icon/primary"), "icon/primary");
assert.equal(resolveIconSemanticTokenName("semantic/icon/secondary"), "icon/secondary");
assert.equal(resolveIconSemanticTokenName("{semantic.icon.tertiary}"), "icon/tertiary");
assert.equal(resolveIconSemanticTokenName("primary"), "icon/primary");
assert.equal(resolveIconSemanticTokenName("foo/bar"), "icon/bar");
assert.equal(resolveIconSemanticTokenName(""), "icon/primary");

console.log("generation options normalization tests passed.");
