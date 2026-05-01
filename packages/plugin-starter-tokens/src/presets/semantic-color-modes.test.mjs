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

async function importSemanticHarness() {
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
  globalThis.__colorUtilsForSemanticTest = await importTsModule(path.resolve(packageSrcDir, "presets/color-utils.ts"));

  const codePath = path.resolve(packageSrcDir, "code.ts");
  const source = await fs.readFile(codePath, "utf8");
  const sourceWithoutImports = source.replace(/^import[\s\S]*?;\r?\n/gm, "");
  const dsCoreHarnessUrl = pathToFileURL(path.resolve(packageSrcDir, "../../ds-core/src/index.js")).href;
  const harnessSource = `
import { basePatternSteps, closestStep, deriveShadeSteps, extendSteps, nextShadeStep, pickSubset, resolveBaseStep } from "${dsCoreHarnessUrl}";
const __html__ = "";
const { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } = globalThis.__colorUtilsForSemanticTest;
const BUILTIN_PRESETS = [];
const getPresetById = () => null;
const getPresetSummaries = () => [];
const TEXT_STYLE_TEMPLATES = [];
const TYPOGRAPHY_REFERENCE = {
  fontFamily: { display: "Roboto", body: "Inter" },
  fontSize: {},
  lineHeight: {},
  fontWeight: {},
};
const normalizeTokenBundle = (value) => value;
const validateTokenBundle = () => ({ valid: true, errors: [] });
${sourceWithoutImports}
export {
  applyDarkModeTransformForReference,
  buildColorModeTokens,
  colorModeFamilyFromTokenName,
  compareColorModesStructure,
  convertKigenReferenceToPluginRef,
  extractIntentFromTokenName,
  generateColorModesTokens,
  isAccentToken,
  parseKigenReference,
  remapIntentStepForDark,
  remapNeutralStepForDark,
  remapNeutralStepForDarkFallback,
  remapStepForBrand,
  resolveDarkNeutralStep,
  resolveDarkStepForPalette,
  resolveOpacityStepFromAlphaKey,
  resolvePrimitivePaletteStep,
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

function aliasValue(ref, collection = "primitives") {
  return { kind: "alias", ref, collection };
}

function modeToken(name, scopes, lightRef, darkRef) {
  return {
    collection: "1. color-modes",
    name,
    type: "COLOR",
    scopes,
    modeValues: {
      light: aliasValue(lightRef),
      dark: aliasValue(darkRef),
    },
  };
}

function legacyModeToken(name, scopes, ref) {
  return {
    collection: "1. color-modes",
    name,
    type: "COLOR",
    scopes,
    modeValues: {
      light: aliasValue(ref, "1. color-modes"),
      dark: aliasValue(ref, "1. color-modes"),
    },
  };
}

const {
  applyDarkModeTransformForReference,
  buildColorModeTokens,
  colorModeFamilyFromTokenName,
  compareColorModesStructure,
  convertKigenReferenceToPluginRef,
  extractIntentFromTokenName,
  generateColorModesTokens,
  isAccentToken,
  parseKigenReference,
  remapIntentStepForDark,
  remapNeutralStepForDark,
  remapNeutralStepForDarkFallback,
  remapStepForBrand,
  resolveDarkNeutralStep,
  resolveDarkStepForPalette,
  resolveOpacityStepFromAlphaKey,
  resolvePrimitivePaletteStep,
} = await importSemanticHarness();

const preset = {
  palettes: {
    slate: palette("#s"),
    red: palette("#r"),
    emerald: palette("#e"),
    amber: palette("#a"),
    sky: palette("#k"),
    fuchsia: palette("#f"),
    purple: palette("#p"),
    brand: palette("#b"),
  },
  steps: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950", "1000", "1100"],
  neutralOptions: ["slate"],
  defaultNeutral: "slate",
};
const sparsePreset = {
  palettes: {
    slate: { 50: "#s50", 500: "#s500", 950: "#s950" },
    red: { 50: "#r50", 500: "#r500", 950: "#r950" },
  },
  steps: ["50", "500", "950"],
  neutralOptions: ["slate"],
  defaultNeutral: "slate",
};
const shadeSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

assert.deepEqual(parseKigenReference("{slate/500}"), ["slate", "500"], "parseKigenReference parses palette step refs");
assert.deepEqual(parseKigenReference(" { alpha / dark / 300 } "), ["alpha", "dark", "300"], "parseKigenReference trims segment whitespace");
assert.deepEqual(parseKigenReference("{b&w/white}"), ["b&w", "white"], "parseKigenReference parses base white refs");
assert.deepEqual(parseKigenReference("not/wrapped"), ["not", "wrapped"], "parseKigenReference does not require braces");
assert.deepEqual(parseKigenReference("{}"), [], "parseKigenReference returns empty array for empty braces");
assert.deepEqual(parseKigenReference("   "), [], "parseKigenReference returns empty array for whitespace");

assert.equal(extractIntentFromTokenName("text/error-primary"), "error", "extractIntentFromTokenName finds text intent");
assert.equal(extractIntentFromTokenName("bg/success-secondary"), "success", "extractIntentFromTokenName finds background intent");
assert.equal(extractIntentFromTokenName("border/warning-primary"), "warning", "extractIntentFromTokenName finds border intent");
assert.equal(extractIntentFromTokenName("icon/info-primary"), "info", "extractIntentFromTokenName finds icon intent");
assert.equal(extractIntentFromTokenName("focus/error-ring"), "error", "extractIntentFromTokenName matches focus-like names even though no focus family is generated");
assert.equal(extractIntentFromTokenName("shadow/error-soft"), "error", "extractIntentFromTokenName matches shadow-like names even though no shadow family is generated");
assert.equal(extractIntentFromTokenName("component/button/error-bg"), "error", "extractIntentFromTokenName matches component-like paths");
assert.equal(extractIntentFromTokenName("text/danger"), null, "extractIntentFromTokenName does not treat danger as an intent alias");
assert.equal(extractIntentFromTokenName("text/accent-primary"), null, "extractIntentFromTokenName does not treat accent as an intent");

assert.equal(isAccentToken("text/accent-primary"), true, "isAccentToken matches slash accent dash");
assert.equal(isAccentToken("bg/accent-solid"), true, "isAccentToken matches background accent token");
assert.equal(isAccentToken("icon/brand"), false, "isAccentToken does not treat brand as accent");
assert.equal(isAccentToken("text/brand-accent"), false, "isAccentToken does not match brand-accent");
assert.equal(isAccentToken("border/noaccent-primary"), false, "isAccentToken requires /accent-");
assert.equal(isAccentToken("text/accent"), false, "isAccentToken requires trailing dash");

assert.equal(resolveOpacityStepFromAlphaKey("00"), 100, "alpha key 00 maps to opacity 100");
assert.equal(resolveOpacityStepFromAlphaKey("50"), 6, "alpha key 50 maps to opacity 6");
assert.equal(resolveOpacityStepFromAlphaKey("500"), 48, "alpha key 500 maps to opacity 48");
assert.equal(resolveOpacityStepFromAlphaKey("1000"), 100, "alpha key 1000 maps to opacity 100");
assert.equal(resolveOpacityStepFromAlphaKey("999"), 50, "unknown numeric alpha key falls back to 50");
assert.equal(resolveOpacityStepFromAlphaKey("42"), 50, "unsupported numeric alpha key falls back to 50");
assert.equal(resolveOpacityStepFromAlphaKey(""), 50, "empty alpha key falls back to 50");

assert.equal(colorModeFamilyFromTokenName("text/primary"), "text", "text family detected");
assert.equal(colorModeFamilyFromTokenName("bg/primary"), "bg", "background family detected");
assert.equal(colorModeFamilyFromTokenName("border/primary"), "border", "border family detected");
assert.equal(colorModeFamilyFromTokenName("icon/primary"), "icon", "icon family detected");
assert.equal(colorModeFamilyFromTokenName("foreground/primary"), null, "foreground family is not currently supported");
assert.equal(colorModeFamilyFromTokenName("focus/ring"), null, "focus ring family is not currently supported");
assert.equal(colorModeFamilyFromTokenName("shadow/default"), null, "shadow family is not currently supported");
assert.equal(colorModeFamilyFromTokenName("button/bg"), null, "component color family is not currently supported");

assert.equal(remapStepForBrand("abc", shadeSteps), "500", "brand nonnumeric step falls back to 500 when available");
assert.equal(remapStepForBrand("50", shadeSteps), "50", "brand exact step is preserved");
assert.equal(remapStepForBrand("475", shadeSteps), "500", "brand step maps to closest generated shade");
assert.equal(remapStepForBrand("999", shadeSteps), "950", "brand step maps to upper boundary");

assert.equal(remapNeutralStepForDark(50), "900", "neutral 50 maps to 900 in dark mode");
assert.equal(remapNeutralStepForDark(100), "800", "neutral 100 maps to 800 in dark mode");
assert.equal(remapNeutralStepForDark(250), "650", "neutral custom light step uses formula");
assert.equal(remapNeutralStepForDark(500), "400", "neutral 500 maps to 400 in dark mode");
assert.equal(remapNeutralStepForDark(700), "200", "neutral 700 maps to 200 in dark mode");
assert.equal(remapNeutralStepForDark(1000), "50", "neutral high custom step clamps to 50");

assert.equal(remapIntentStepForDark(50, "bg"), "100", "bg intent dark remap uses bg table");
assert.equal(remapIntentStepForDark(500, "bg"), "600", "bg intent 500 maps to 600");
assert.equal(remapIntentStepForDark(1200, "bg"), "1100", "bg intent fallback clamps high");
assert.equal(remapIntentStepForDark(50, "text"), "50", "foreground intent dark remap uses foreground table");
assert.equal(remapIntentStepForDark(600, "text"), "400", "foreground intent 600 maps to 400");
assert.equal(remapIntentStepForDark(1200, "text"), "1000", "foreground intent fallback clamps high");

assert.equal(resolveDarkStepForPalette(preset, "brand", "475", shadeSteps), "500", "dark brand step maps to closest generated shade");
assert.equal(resolveDarkStepForPalette(preset, "red", "650", shadeSteps), "600", "dark palette step maps to closest preset step");
assert.equal(resolveDarkStepForPalette(sparsePreset, "red", "600", shadeSteps), "500", "dark sparse palette step maps to closest available preset step");
assert.equal(resolveDarkStepForPalette(sparsePreset, "missing", "600", shadeSteps), "600", "dark missing palette returns requested step");
assert.equal(resolveDarkNeutralStep(sparsePreset, "slate", "50"), "950", "dark neutral sparse 50 mirrors to 950");
assert.equal(resolveDarkNeutralStep(sparsePreset, "slate", "nope"), "950", "dark neutral nonnumeric source returns last available step");
assert.equal(resolvePrimitivePaletteStep(preset, "brand", "475", shadeSteps), "500", "primitive brand step maps to generated shade");
assert.equal(resolvePrimitivePaletteStep(preset, "red", "650", shadeSteps), "600", "primitive palette step maps to closest preset step");
assert.equal(resolvePrimitivePaletteStep(preset, "missing", "650", shadeSteps), "650", "primitive missing palette returns requested step");
assert.equal(remapNeutralStepForDarkFallback(sparsePreset, "slate", "50"), "950", "neutral dark fallback resolves remapped step to existing sparse palette step");
assert.equal(remapNeutralStepForDarkFallback(sparsePreset, "slate", "250"), "500", "neutral dark fallback maps custom step to closest existing sparse palette step");
assert.equal(remapNeutralStepForDarkFallback(sparsePreset, "slate", "nope"), "950", "neutral dark fallback nonnumeric source uses mirrored fallback");

assert.equal(
  applyDarkModeTransformForReference("bg/primary", "colors/base/white", "slate", preset, shadeSteps),
  "colors/slate/1100",
  "dark bg base white maps to darkest neutral step available",
);
assert.equal(
  applyDarkModeTransformForReference("text/primary", "colors/base/black", "slate", preset, shadeSteps),
  "colors/base/white",
  "dark text base black maps to base white",
);
assert.equal(
  applyDarkModeTransformForReference("border/primary", "colors/slate/300", "slate", preset, shadeSteps),
  "colors/slate/600",
  "dark neutral border step remaps through neutral fallback",
);
assert.equal(
  applyDarkModeTransformForReference("bg/error-primary", "colors/red/50", "slate", preset, shadeSteps),
  "colors/red/100",
  "dark bg intent remaps intent palette step",
);
assert.equal(
  applyDarkModeTransformForReference("text/error-primary", "colors/red/600", "slate", preset, shadeSteps),
  "colors/red/400",
  "dark text intent remaps intent palette step",
);
assert.equal(
  applyDarkModeTransformForReference("text/accent-primary", "colors/brand/500", "slate", preset, shadeSteps),
  "colors/brand/400",
  "dark accent remaps brand step",
);
assert.equal(
  applyDarkModeTransformForReference("alpha/foo", "opacity/black/50", "slate", preset, shadeSteps),
  "opacity/black/50",
  "alpha token references are not transformed",
);
assert.equal(
  applyDarkModeTransformForReference("shadow/error-soft", "colors/red/500", "slate", preset, shadeSteps),
  "colors/red/500",
  "shadow-like token is not transformed because it is not a supported color-mode family",
);

assert.equal(convertKigenReferenceToPluginRef("text/primary", "{slate/900}", "light", preset, "slate", shadeSteps, true), "colors/slate/900");
assert.equal(convertKigenReferenceToPluginRef("text/primary", "{slate/900}", "dark", preset, "slate", shadeSteps, true), "colors/slate/50");
assert.equal(convertKigenReferenceToPluginRef("bg/primary", "{b&w/white}", "dark", preset, "slate", shadeSteps, true), "colors/slate/1100");
assert.equal(convertKigenReferenceToPluginRef("text/primary", "{b&w/black}", "dark", preset, "slate", shadeSteps, true), "colors/base/white");
assert.equal(convertKigenReferenceToPluginRef("bg/overlay-alpha-primary", "{alpha/light/200}", "light", preset, "slate", shadeSteps, true), "opacity/black/20");
assert.equal(convertKigenReferenceToPluginRef("bg/overlay-alpha-white-primary", "{alpha/dark/300}", "dark", preset, "slate", shadeSteps, true), "opacity/white/28");
assert.equal(convertKigenReferenceToPluginRef("text/accent-primary", "{purple/500}", "light", preset, "slate", shadeSteps, true), "colors/brand/500");
assert.equal(convertKigenReferenceToPluginRef("text/accent-primary", "{purple/500}", "light", preset, "slate", shadeSteps, false), "colors/purple/500");
assert.equal(convertKigenReferenceToPluginRef("bg/error-primary", "{red/50}", "dark", preset, "slate", shadeSteps, true), "colors/red/100");
assert.equal(convertKigenReferenceToPluginRef("bg/warning-primary", "{orange/100}", "dark", preset, "slate", shadeSteps, true), "colors/amber/200");
assert.equal(convertKigenReferenceToPluginRef("text/success-primary", "{green/600}", "dark", preset, "slate", shadeSteps, true), "colors/emerald/400");
assert.equal(convertKigenReferenceToPluginRef("icon/info-primary", "{blue/600}", "dark", preset, "slate", shadeSteps, true), "colors/sky/400");
assert.equal(convertKigenReferenceToPluginRef("border/offer-primary", "{green/500}", "dark", preset, "slate", shadeSteps, true), "colors/fuchsia/400");
assert.equal(convertKigenReferenceToPluginRef("text/primary", "{unknown/123}", "light", preset, "slate", shadeSteps, true), "colors/slate/100");
assert.equal(convertKigenReferenceToPluginRef("text/primary", "badref", "light", preset, "slate", shadeSteps, true), "colors/slate/500");
assert.equal(convertKigenReferenceToPluginRef("text/primary", "", "light", preset, "slate", shadeSteps, true), "colors/base/black");

const generatedLight = generateColorModesTokens("light", preset, "slate", shadeSteps, true);
const generatedDark = generateColorModesTokens("dark", preset, "slate", shadeSteps, true);
assert.deepEqual(
  {
    textPrimary: generatedLight.text.primary,
    textAccent: generatedLight.text["accent-primary"],
    bgPrimary: generatedLight.bg.primary,
    bgOverlay: generatedLight.bg["overlay-alpha-primary"],
    borderPrimary: generatedLight.border.primary,
    iconInfo: generatedLight.icon["info-primary"],
  },
  {
    textPrimary: "colors/slate/900",
    textAccent: "colors/brand/500",
    bgPrimary: "colors/base/white",
    bgOverlay: "opacity/black/20",
    borderPrimary: "colors/slate/300",
    iconInfo: "colors/sky/600",
  },
  "representative light semantic refs stay stable",
);
assert.deepEqual(
  {
    textPrimary: generatedDark.text.primary,
    textAccent: generatedDark.text["accent-primary"],
    bgPrimary: generatedDark.bg.primary,
    bgError: generatedDark.bg["error-primary"],
    borderPrimary: generatedDark.border.primary,
    iconInfo: generatedDark.icon["info-primary"],
  },
  {
    textPrimary: "colors/slate/50",
    textAccent: "colors/brand/400",
    bgPrimary: "colors/slate/1100",
    bgError: "colors/red/100",
    borderPrimary: "colors/slate/600",
    iconInfo: "colors/sky/400",
  },
  "representative dark semantic refs stay stable",
);
assert.deepEqual(Object.keys(generatedLight), ["bg", "text", "icon", "border"], "only current color-mode families are generated");
assert.equal(generatedLight.focus, undefined, "focus rings are not generated by current semantic color-mode template");
assert.equal(generatedLight.shadow, undefined, "shadows/effects are not generated by current semantic color-mode template");
assert.equal(generatedLight.foreground, undefined, "foreground family is not generated by current semantic color-mode template");

assert.deepEqual(compareColorModesStructure(generatedLight), [], "complete generated structure has no missing tokens");
assert.deepEqual(compareColorModesStructure({ ...generatedLight, text: { ...generatedLight.text, primary: "" } }), ["text/primary"], "structure comparison detects empty required token");
assert.deepEqual(compareColorModesStructure({ ...generatedLight, text: { ...generatedLight.text, extra: "x" } }), [], "structure comparison ignores extra tokens");
assert.deepEqual(compareColorModesStructure({ ...generatedLight, text: { ...generatedLight.text, primary: "changed" } }), [], "structure comparison ignores changed values");

const builtBoth = buildColorModeTokens("both", preset, "slate", shadeSteps, true);
const builtLight = buildColorModeTokens("light", preset, "slate", shadeSteps, true);
assert.equal(builtBoth.tokens.length, 148, "both-mode semantic token count includes generated and legacy aliases");
assert.deepEqual(builtBoth.missing, [], "both-mode semantic generation reports no missing tokens");
assert.equal(builtLight.tokens.length, 148, "single-mode semantic token count includes generated and legacy aliases");
assert.deepEqual(builtLight.missing, [], "single-mode semantic generation reports no missing tokens");

const builtByName = new Map(builtBoth.tokens.map((token) => [token.name, token]));
assert.deepEqual(builtByName.get("text/primary"), modeToken("text/primary", ["TEXT_FILL"], "colors/slate/900", "colors/slate/50"));
assert.deepEqual(builtByName.get("text/accent-primary"), modeToken("text/accent-primary", ["TEXT_FILL"], "colors/brand/500", "colors/brand/400"));
assert.deepEqual(builtByName.get("bg/primary"), modeToken("bg/primary", ["FRAME_FILL", "SHAPE_FILL"], "colors/base/white", "colors/slate/1100"));
assert.deepEqual(builtByName.get("bg/error-primary"), modeToken("bg/error-primary", ["FRAME_FILL", "SHAPE_FILL"], "colors/red/50", "colors/red/100"));
assert.deepEqual(builtByName.get("border/primary"), modeToken("border/primary", ["STROKE_COLOR"], "colors/slate/300", "colors/slate/600"));
assert.deepEqual(builtByName.get("icon/info-primary"), modeToken("icon/info-primary", ["STROKE_COLOR", "SHAPE_FILL"], "colors/sky/600", "colors/sky/400"));
assert.deepEqual(builtByName.get("text/brand"), legacyModeToken("text/brand", ["TEXT_FILL"], "text/accent-primary"));
assert.deepEqual(builtByName.get("bg/brand"), legacyModeToken("bg/brand", ["FRAME_FILL", "SHAPE_FILL"], "bg/accent-solid"));
assert.deepEqual(builtByName.get("border/focus"), legacyModeToken("border/focus", ["STROKE_COLOR"], "border/accent-primary"));
assert.deepEqual(builtByName.get("icon/brand"), legacyModeToken("icon/brand", ["STROKE_COLOR", "SHAPE_FILL"], "icon/accent-primary"));

console.log("semantic color-mode fixture tests passed.");
