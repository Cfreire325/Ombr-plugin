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

async function importPaletteStepHarness() {
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
  globalThis.__colorUtilsForPaletteStepTest = await importTsModule(path.resolve(packageSrcDir, "presets/color-utils.ts"));

  const codePath = path.resolve(packageSrcDir, "code.ts");
  const source = await fs.readFile(codePath, "utf8");
  const sourceWithoutImports = source.replace(/^import[\s\S]*?;\r?\n/gm, "");
  const dsCoreHarnessUrl = pathToFileURL(path.resolve(packageSrcDir, "../../ds-core/src/index.js")).href;
  const harnessSource = `
import { basePatternSteps, closestStep, deriveShadeSteps, extendSteps, nextShadeStep, pickSubset, resolveBaseStep } from "${dsCoreHarnessUrl}";
const __html__ = "";
const { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } = globalThis.__colorUtilsForPaletteStepTest;
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
  basePatternSteps,
  closestPresetStep,
  closestStep,
  deriveShadeSteps,
  extendSteps,
  fallbackPresetSteps,
  getPaletteSteps,
  nextShadeStep,
  normalizePaletteKey,
  normalizePresetSteps,
  parsePresetNumericStep,
  pickSubset,
  resolveBaseStep,
  resolveClosestPaletteStep,
  resolveIntentPalette,
  resolvePaletteFromCandidates,
  resolvePaletteWithSynonyms,
  sortPresetSteps,
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
  basePatternSteps,
  closestPresetStep,
  closestStep,
  deriveShadeSteps,
  extendSteps,
  fallbackPresetSteps,
  getPaletteSteps,
  nextShadeStep,
  normalizePaletteKey,
  normalizePresetSteps,
  parsePresetNumericStep,
  pickSubset,
  resolveBaseStep,
  resolveClosestPaletteStep,
  resolveIntentPalette,
  resolvePaletteFromCandidates,
  resolvePaletteWithSynonyms,
  sortPresetSteps,
} = await importPaletteStepHarness();

const tailwindSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const hundredsSteps = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

assert.deepEqual(basePatternSteps("tailwind"), tailwindSteps, "tailwind pattern uses Tailwind-like steps");
assert.deepEqual(basePatternSteps("hundreds"), hundredsSteps, "hundreds pattern uses 100-1000 steps");
assert.deepEqual(basePatternSteps("unknown"), tailwindSteps, "unknown pattern falls back to Tailwind-like steps");

assert.deepEqual(deriveShadeSteps("tailwind", 11), tailwindSteps, "tailwind count 11 keeps all base steps");
assert.deepEqual(deriveShadeSteps("tailwind", 1), [50, 200, 500, 600, 800, 950], "shade count below min clamps to 6");
assert.deepEqual(
  deriveShadeSteps("tailwind", 20),
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000, 1100, 1200],
  "shade count above max clamps to 14 and extends from 950",
);
assert.deepEqual(deriveShadeSteps("hundreds", 6), [100, 300, 500, 600, 800, 1000], "hundreds subset includes 500");
assert.deepEqual(deriveShadeSteps("hundreds", 10), hundredsSteps, "hundreds count 10 keeps all base steps");
assert.deepEqual(
  deriveShadeSteps("hundreds", 14),
  [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400],
  "hundreds extended shade count continues by 100",
);
assert.deepEqual(deriveShadeSteps("unknown", 7), [50, 200, 300, 500, 700, 800, 950], "unknown pattern derives from Tailwind-like steps");
assert.deepEqual(deriveShadeSteps("tailwind", "oops"), tailwindSteps, "invalid shade count falls back to 11");

assert.deepEqual(pickSubset([100, 200, 300, 400, 500, 600, 700], 4), [100, 300, 500, 700], "pickSubset preserves 500 when possible");
assert.deepEqual(pickSubset([100, 200, 300, 400, 500], 1), [300], "pickSubset count 1 chooses midpoint index");
assert.deepEqual(pickSubset([100, 200, 300, 400, 500], 0), [300], "pickSubset count 0 currently behaves like count 1");
assert.equal(nextShadeStep(950), 1000, "nextShadeStep special-cases 950 to 1000");
assert.equal(nextShadeStep(1000), 1100, "nextShadeStep otherwise adds 100");
assert.deepEqual(extendSteps(tailwindSteps, 14), [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000, 1100, 1200]);
assert.deepEqual(extendSteps([500, 100, 100, 950], 6), [100, 500, 950, 1000, 1100, 1200], "extendSteps sorts and deduplicates before extending");

assert.equal(resolveBaseStep([100, 300, 500, 700]), 500, "resolveBaseStep returns 500 when present");
assert.equal(resolveBaseStep(["100", "300", "500", "700"]), "700", "resolveBaseStep does not treat string 500 as numeric 500");
assert.equal(resolveBaseStep([100, 300, 700, 900]), 300, "resolveBaseStep chooses closest to midpoint when 500 is missing");
assert.equal(resolveBaseStep(["100", "300", "700"]), "700", "resolveBaseStep currently returns a string for string-only arrays without 500");
assert.ok(Number.isNaN(resolveBaseStep([])), "resolveBaseStep returns NaN for an empty step list");
assert.equal(resolveBaseStep(["sm", "lg"]), "sm", "resolveBaseStep returns the first nonnumeric string when midpoint is NaN");

assert.equal(closestStep([100, 300, 500], 300), 300, "closestStep exact match");
assert.equal(closestStep([100, 300], 200), 100, "closestStep keeps the lower earlier step on a tie");
assert.equal(closestStep([100, 300, 500], 260), 300, "closestStep chooses nearest higher step when closer");
assert.equal(closestStep([100, 300, 500], -20), 100, "closestStep lower boundary");
assert.equal(closestStep([100, 300, 500], 999), 500, "closestStep upper boundary");
assert.equal(closestStep([], 450), 450, "closestStep returns target for an empty list");

assert.equal(normalizePaletteKey("Brand Primary"), "brand-primary", "normalizePaletteKey lowercases uppercase input");
assert.equal(normalizePaletteKey(" brand.primary/Primary! "), "brand-primary-primary", "normalizePaletteKey replaces punctuation");
assert.equal(normalizePaletteKey(""), "", "normalizePaletteKey keeps empty values empty");
assert.equal(normalizePaletteKey("Brand Primary"), normalizePaletteKey("brand_primary"), "different inputs can normalize to the same key");

assert.equal(parsePresetNumericStep("500"), 500, "parsePresetNumericStep parses integers");
assert.equal(parsePresetNumericStep("050"), 50, "parsePresetNumericStep parses leading-zero numbers");
assert.equal(parsePresetNumericStep("10.5"), 10.5, "parsePresetNumericStep parses decimals");
assert.equal(parsePresetNumericStep("-10"), -10, "parsePresetNumericStep parses negative numbers");
assert.equal(parsePresetNumericStep("sm"), null, "parsePresetNumericStep rejects nonnumeric steps");
assert.equal(parsePresetNumericStep("500px"), null, "parsePresetNumericStep rejects mixed unit strings");
assert.equal(parsePresetNumericStep(""), null, "parsePresetNumericStep rejects empty strings");

assert.deepEqual(sortPresetSteps(["500", "50", "100", "50"]), ["50", "100", "500"], "sortPresetSteps sorts numeric steps and deduplicates");
assert.deepEqual(
  sortPresetSteps(["lg", "100", "sm", "050", "10.5", "LG", "500"]),
  ["10.5", "050", "100", "500", "lg", "LG", "sm"],
  "sortPresetSteps orders numeric steps before locale-sorted nonnumeric steps",
);
assert.deepEqual(sortPresetSteps(["beta", "Alpha", "alpha"]), ["alpha", "Alpha", "beta"], "sortPresetSteps nonnumeric order is localeCompare-based");
assert.deepEqual(fallbackPresetSteps(), ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]);

const preset = {
  palettes: {
    slate: { 50: "#f8fafc", 100: "#f1f5f9", 500: "#64748b", 950: "#020617" },
    mixed: { sm: "#a", 500: "#b", 100: "#c", LG: "#d", "050": "#e", "10.5": "#f" },
    alpha: { low: "#1", High: "#2" },
    red: {},
    emerald: {},
    fuchsia: {},
  },
  steps: ["500", "100", "sm", "050", "LG", "10.5"],
  neutralOptions: ["slate"],
  defaultNeutral: "slate",
};
const emptyPreset = { palettes: {}, steps: [], neutralOptions: [], defaultNeutral: "slate" };

assert.deepEqual(getPaletteSteps(preset, "slate"), ["50", "100", "500", "950"], "getPaletteSteps returns sorted existing palette steps");
assert.deepEqual(getPaletteSteps(preset, "mixed"), ["10.5", "050", "100", "500", "LG", "sm"], "getPaletteSteps sorts mixed steps");
assert.deepEqual(getPaletteSteps(preset, "missing"), [], "getPaletteSteps returns empty list for missing palette");
assert.deepEqual(normalizePresetSteps(preset), ["10.5", "050", "100", "500", "LG", "sm"], "normalizePresetSteps uses preset.steps when present");
assert.deepEqual(normalizePresetSteps({ ...preset, steps: [] }), fallbackPresetSteps(), "normalizePresetSteps falls back when preset.steps is empty");

assert.equal(resolveClosestPaletteStep(preset, "mixed", "500"), "500", "resolveClosestPaletteStep returns exact step");
assert.equal(resolveClosestPaletteStep(preset, "mixed", "lg"), "LG", "resolveClosestPaletteStep supports case-insensitive exact match");
assert.equal(resolveClosestPaletteStep(preset, "mixed", "75"), "050", "resolveClosestPaletteStep chooses closest numeric step");
assert.equal(resolveClosestPaletteStep(preset, "slate", "300"), "100", "resolveClosestPaletteStep keeps earlier numeric step on a tie");
assert.equal(resolveClosestPaletteStep(preset, "mixed", "nope"), "500", "resolveClosestPaletteStep falls back to 500 for nonnumeric missing steps");
assert.equal(resolveClosestPaletteStep(preset, "missing", "777"), "777", "resolveClosestPaletteStep returns requested step for missing palette");
assert.equal(closestPresetStep(["50", "100", "500"], 260), "100", "closestPresetStep returns closest numeric value as a string");
assert.equal(closestPresetStep(["sm", "lg"], 260), "sm", "closestPresetStep returns first step when no numeric steps exist");
assert.equal(closestPresetStep(["sm", "100", "500"], 260), "100", "closestPresetStep ignores nonnumeric steps when numeric steps exist");
assert.equal(closestPresetStep([], 260), "950", "closestPresetStep falls back to 950 for an empty list");

assert.equal(resolvePaletteFromCandidates(preset, ["blue", "red", "emerald"], "slate"), "red", "resolvePaletteFromCandidates returns first valid candidate");
assert.equal(resolvePaletteFromCandidates(preset, ["blue"], "slate"), "slate", "resolvePaletteFromCandidates returns fallback when present");
assert.equal(
  resolvePaletteFromCandidates({ palettes: { zeta: {}, alpha: {} }, steps: [] }, ["blue"], "missing"),
  "zeta",
  "resolvePaletteFromCandidates falls back to first palette when fallback is missing",
);
assert.equal(resolvePaletteFromCandidates(emptyPreset, ["blue"], "missing"), "missing", "resolvePaletteFromCandidates returns fallback when no palettes exist");
assert.equal(resolvePaletteWithSynonyms(preset, "green", "slate"), "emerald", "resolvePaletteWithSynonyms resolves known synonym candidates");
assert.equal(resolvePaletteWithSynonyms(preset, "cyan", "slate"), "slate", "resolvePaletteWithSynonyms uses fallback for missing synonym");
assert.equal(resolvePaletteWithSynonyms(preset, "red", "slate"), "red", "resolvePaletteWithSynonyms keeps direct palette match");
assert.equal(resolveIntentPalette(preset, "success"), "emerald", "resolveIntentPalette finds first valid success palette");
assert.equal(resolveIntentPalette(preset, "offer"), "fuchsia", "resolveIntentPalette finds first valid offer palette");
assert.equal(resolveIntentPalette(preset, "info"), "slate", "resolveIntentPalette falls back to first palette when intent candidates are absent");

console.log("palette step and preset lookup tests passed.");
