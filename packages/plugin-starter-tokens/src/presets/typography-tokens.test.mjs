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

async function importTypographyHarness() {
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
  globalThis.__colorUtilsForTypographyTest = await importTsModule(path.resolve(packageSrcDir, "presets/color-utils.ts"));
  globalThis.__typographyReferenceForTypographyTest = (
    await importTsModule(path.resolve(packageSrcDir, "presets/typography.generated.ts"))
  ).TYPOGRAPHY_REFERENCE;

  const codePath = path.resolve(packageSrcDir, "code.ts");
  const source = await fs.readFile(codePath, "utf8");
  const sourceWithoutImports = source.replace(/^import[\s\S]*?;\r?\n/gm, "");
  const harnessSource = `
const __html__ = "";
const { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } = globalThis.__colorUtilsForTypographyTest;
const TYPOGRAPHY_REFERENCE = globalThis.__typographyReferenceForTypographyTest;
const BUILTIN_PRESETS = [];
const getPresetById = () => null;
const getPresetSummaries = () => [];
const TEXT_STYLE_TEMPLATES = [];
const normalizeTokenBundle = (value) => value;
const validateTokenBundle = () => ({ valid: true, errors: [] });
${sourceWithoutImports}
export {
  TYPOGRAPHY_FAMILY_VARIABLES,
  DEFAULT_FONT_SIZES,
  DEFAULT_LINE_HEIGHTS,
  DEFAULT_LETTER_SPACINGS,
  DEFAULT_FONT_WEIGHT_STYLES,
  FONT_SIZE_ORDER,
  buildTypographyTokens,
  orderedTypographySizeKeys,
  resolveTypographyLineHeights,
  roundTo,
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

function rawToken(name, type, scopes, value) {
  return {
    collection: "6. Typography",
    name,
    type,
    scopes,
    value: { kind: "raw", value },
  };
}

function tokenByName(tokens) {
  return new Map(tokens.map((token) => [token.name, token]));
}

function makeOptions(typography = {}) {
  return {
    typography: {
      displayFamily: "Roboto",
      bodyFamily: "Inter",
      fontSizes: { ...DEFAULT_FONT_SIZES },
      lineHeights: { ...DEFAULT_LINE_HEIGHTS },
      letterSpacings: { ...DEFAULT_LETTER_SPACINGS },
      ...typography,
    },
  };
}

const {
  TYPOGRAPHY_FAMILY_VARIABLES,
  DEFAULT_FONT_SIZES,
  DEFAULT_LINE_HEIGHTS,
  DEFAULT_LETTER_SPACINGS,
  DEFAULT_FONT_WEIGHT_STYLES,
  FONT_SIZE_ORDER,
  buildTypographyTokens,
  orderedTypographySizeKeys,
  resolveTypographyLineHeights,
  roundTo,
} = await importTypographyHarness();

assert.deepEqual(TYPOGRAPHY_FAMILY_VARIABLES, {
  display: "font-family/font-family-display",
  body: "font-family/font-family-body",
}, "default typography family variable names stay stable");

assert.deepEqual(DEFAULT_FONT_SIZES, {
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
}, "default font sizes stay stable");

assert.deepEqual(DEFAULT_LINE_HEIGHTS, {
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
}, "default line heights stay stable, including the current display-2xl override to 88");

assert.deepEqual(DEFAULT_LETTER_SPACINGS, {
  label: 0,
  "text-xs": 0,
  "text-sm": 0,
  "text-md": 0,
  "text-lg": 0,
  "text-xl": 0,
  "display-xs": 0,
  "display-sm": 0,
  "display-md": 0,
  "display-lg": 0,
  "display-xl": 0,
  "display-2xl": 0,
}, "default letter spacings stay zero for every default size");

assert.deepEqual(DEFAULT_FONT_WEIGHT_STYLES, {
  regular: "Regular",
  "regular-italic": "Regular italic",
  medium: "Medium",
  "medium-italic": "Medium italic",
  semibold: "Semibold",
  "semibold-italic": "Semibold italic",
  bold: "Bold",
  "bold-italic": "Bold italic",
}, "default font weight styles stay stable");

assert.deepEqual(FONT_SIZE_ORDER, [
  "label",
  "text-xs",
  "text-sm",
  "text-md",
  "text-lg",
  "text-xl",
  "display-xs",
  "display-sm",
  "display-md",
  "display-lg",
  "display-xl",
  "display-2xl",
], "font size order stays stable");

assert.deepEqual(orderedTypographySizeKeys(DEFAULT_FONT_SIZES), FONT_SIZE_ORDER, "orderedTypographySizeKeys preserves known order");
assert.deepEqual(orderedTypographySizeKeys({ "text-md": 16, "display-xl": 60 }), ["text-md", "display-xl"], "orderedTypographySizeKeys keeps only present known keys");
assert.deepEqual(orderedTypographySizeKeys({ "custom-z": 9, "text-md": 16, "custom-a": 8 }), ["text-md", "custom-a", "custom-z"], "orderedTypographySizeKeys sorts extra keys after known keys");
assert.deepEqual(orderedTypographySizeKeys({ zzz: 1, aaa: 2 }), ["aaa", "zzz"], "orderedTypographySizeKeys sorts unknown-only keys deterministically");

assert.deepEqual(resolveTypographyLineHeights(DEFAULT_FONT_SIZES), DEFAULT_LINE_HEIGHTS, "default font sizes resolve to default line heights");
assert.deepEqual(resolveTypographyLineHeights({
  ...DEFAULT_FONT_SIZES,
  "text-md": 20,
  "display-2xl": 80,
  "custom-size": 10,
}), {
  label: 14,
  "text-xs": 18,
  "text-sm": 20,
  "text-md": 30,
  "text-lg": 28,
  "text-xl": 30,
  "display-xs": 32,
  "display-sm": 38,
  "display-md": 44,
  "display-lg": 60,
  "display-xl": 72,
  "display-2xl": 97.78,
  "custom-size": 14,
}, "custom font sizes preserve current default ratios and use 1.4 fallback for unknown keys");
assert.deepEqual(resolveTypographyLineHeights({
  "text-md": 0,
  "text-lg": -1,
  "text-xl": "oops",
  custom: 12,
}), {
  custom: 16.8,
}, "invalid custom font sizes are skipped and unknown valid keys use 1.4 fallback");

assert.equal(roundTo(12), 12, "roundTo keeps integers stable");
assert.equal(roundTo(12.3456, 2), 12.35, "roundTo rounds decimal values at precision 2");
assert.equal(roundTo(12.3456, 0), 12, "roundTo supports zero precision");
assert.equal(roundTo(-12.3456, 2), -12.35, "roundTo supports negative values");
assert.equal(roundTo(12.3456, 3), 12.346, "roundTo supports positive precision");
assert.equal(roundTo(12.3456, -1), 10, "roundTo currently supports negative precision through powers of ten");

const defaultTokens = buildTypographyTokens(makeOptions());
const defaultByName = tokenByName(defaultTokens);
assert.equal(defaultTokens.length, 46, "default typography token count stays stable");
assert.deepEqual(defaultByName.get("font-family/font-family-display"), rawToken("font-family/font-family-display", "STRING", ["FONT_FAMILY"], "Roboto"));
assert.deepEqual(defaultByName.get("font-family/font-family-body"), rawToken("font-family/font-family-body", "STRING", ["FONT_FAMILY"], "Inter"));
assert.deepEqual(defaultByName.get("font-size/label"), rawToken("font-size/label", "FLOAT", ["FONT_SIZE"], 10));
assert.deepEqual(defaultByName.get("font-size/text-md"), rawToken("font-size/text-md", "FLOAT", ["FONT_SIZE"], 16));
assert.deepEqual(defaultByName.get("font-size/display-2xl"), rawToken("font-size/display-2xl", "FLOAT", ["FONT_SIZE"], 72));
assert.deepEqual(defaultByName.get("line-height/label"), rawToken("line-height/label", "FLOAT", ["FONT_SIZE"], 14));
assert.deepEqual(defaultByName.get("line-height/text-md"), rawToken("line-height/text-md", "FLOAT", ["FONT_SIZE"], 24));
assert.deepEqual(defaultByName.get("line-height/display-2xl"), rawToken("line-height/display-2xl", "FLOAT", ["FONT_SIZE"], 88));
assert.deepEqual(defaultByName.get("letter-spacing/label"), rawToken("letter-spacing/label", "FLOAT", ["FONT_SIZE"], 0));
assert.deepEqual(defaultByName.get("letter-spacing/text-md"), rawToken("letter-spacing/text-md", "FLOAT", ["FONT_SIZE"], 0));
assert.deepEqual(defaultByName.get("font-weight/regular"), rawToken("font-weight/regular", "STRING", ["FONT_STYLE"], "Regular"));
assert.deepEqual(defaultByName.get("font-weight/bold-italic"), rawToken("font-weight/bold-italic", "STRING", ["FONT_STYLE"], "Bold italic"));

const customTokens = buildTypographyTokens(makeOptions({
  displayFamily: "Acme Display",
  bodyFamily: "Acme Body",
  fontSizes: {
    ...DEFAULT_FONT_SIZES,
    "text-md": 20,
    "custom-z": 9,
    bad: 0,
    nan: Number.NaN,
  },
  lineHeights: {
    ...DEFAULT_LINE_HEIGHTS,
    "text-md": 30,
    "custom-z": 13,
    bad: 0,
  },
  letterSpacings: {
    ...DEFAULT_LETTER_SPACINGS,
    "text-md": -0.25,
    "custom-z": 1.5,
    nan: Number.NaN,
  },
}));
const customByName = tokenByName(customTokens);
assert.equal(customTokens.length, 49, "custom typography token count stays stable with one valid custom size");
assert.deepEqual(customByName.get("font-family/font-family-display"), rawToken("font-family/font-family-display", "STRING", ["FONT_FAMILY"], "Acme Display"));
assert.deepEqual(customByName.get("font-family/font-family-body"), rawToken("font-family/font-family-body", "STRING", ["FONT_FAMILY"], "Acme Body"));
assert.deepEqual(customByName.get("font-size/text-md"), rawToken("font-size/text-md", "FLOAT", ["FONT_SIZE"], 20));
assert.deepEqual(customByName.get("font-size/custom-z"), rawToken("font-size/custom-z", "FLOAT", ["FONT_SIZE"], 9));
assert.equal(customByName.has("font-size/bad"), false, "zero font size is skipped");
assert.equal(customByName.has("font-size/nan"), false, "NaN font size is skipped");
assert.deepEqual(customByName.get("line-height/text-md"), rawToken("line-height/text-md", "FLOAT", ["FONT_SIZE"], 30));
assert.deepEqual(customByName.get("line-height/custom-z"), rawToken("line-height/custom-z", "FLOAT", ["FONT_SIZE"], 13));
assert.equal(customByName.has("line-height/bad"), false, "zero line height is skipped");
assert.deepEqual(customByName.get("letter-spacing/text-md"), rawToken("letter-spacing/text-md", "FLOAT", ["FONT_SIZE"], -0.25));
assert.deepEqual(customByName.get("letter-spacing/custom-z"), rawToken("letter-spacing/custom-z", "FLOAT", ["FONT_SIZE"], 1.5));
assert.equal(customByName.has("letter-spacing/nan"), false, "NaN letter spacing is skipped");

console.log("typography token fixture tests passed.");
