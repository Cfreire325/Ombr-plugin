import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcePath = path.resolve(__dirname, "color-utils.ts");
const source = await fs.readFile(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2020,
    target: ts.ScriptTarget.ES2020,
  },
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString("base64")}`;
const { buildBrandScale, colorWithAlpha, parseColorInput, rgbaToHex, sanitizeKebabSegment } = await import(moduleUrl);

function assertColorAlmostEqual(actual, expected, message) {
  for (const channel of ["r", "g", "b", "a"]) {
    assert.ok(
      Math.abs(actual[channel] - expected[channel]) < 1e-12,
      `${message}: expected ${channel}=${expected[channel]}, got ${actual[channel]}`,
    );
  }
}

function assertThrowsWithMessage(fn, expectedMessage) {
  assert.throws(fn, (error) => error instanceof Error && error.message === expectedMessage);
}

assertColorAlmostEqual(parseColorInput("#abc"), {
  r: 170 / 255,
  g: 187 / 255,
  b: 204 / 255,
  a: 1,
}, "#rgb expands single hex digits");

assertColorAlmostEqual(parseColorInput("#abcd"), {
  r: 170 / 255,
  g: 187 / 255,
  b: 204 / 255,
  a: 221 / 255,
}, "#rgba expands single hex digits including alpha");

assertColorAlmostEqual(parseColorInput("#336699"), {
  r: 0.2,
  g: 0.4,
  b: 0.6,
  a: 1,
}, "#rrggbb parses byte pairs");

assertColorAlmostEqual(parseColorInput("#336699cc"), {
  r: 0.2,
  g: 0.4,
  b: 0.6,
  a: 0.8,
}, "#rrggbbaa parses byte pairs including alpha");

assertColorAlmostEqual(parseColorInput("rgb(255, 128, 0)"), {
  r: 1,
  g: 128 / 255,
  b: 0,
  a: 1,
}, "rgb parses numeric channels");

assertColorAlmostEqual(parseColorInput("rgba(255, 128, 0, 0.25)"), {
  r: 1,
  g: 128 / 255,
  b: 0,
  a: 0.25,
}, "rgba parses numeric channels and alpha");

assertColorAlmostEqual(parseColorInput("  rgba( 255 , 128 , 0 , 0.25 )  "), {
  r: 1,
  g: 128 / 255,
  b: 0,
  a: 0.25,
}, "rgb/rgba supports outer and inner whitespace");

assertColorAlmostEqual(parseColorInput("rgba(100%, 50%, 0%, 125%)"), {
  r: 1,
  g: 0.5,
  b: 0,
  a: 1,
}, "rgb/rgba supports percentages and clamps high alpha");

assertColorAlmostEqual(parseColorInput("rgba(-10, 300, 128, -0.5)"), {
  r: 0,
  g: 1,
  b: 128 / 255,
  a: 0,
}, "rgb/rgba clamps channels and low alpha");

assertThrowsWithMessage(() => parseColorInput("#12"), "Invalid HEX color: #12");
assertThrowsWithMessage(() => parseColorInput("rgb(1, 2)"), "Invalid RGB color: rgb(1, 2)");
assertThrowsWithMessage(() => parseColorInput("hsl(120, 50%, 50%)"), "Unsupported color format: hsl(120, 50%, 50%)");

const nonHex = parseColorInput("#ggg");
assert.ok(Number.isNaN(nonHex.r), "non-hex #rgb currently produces NaN red channel");
assert.ok(Number.isNaN(nonHex.g), "non-hex #rgb currently produces NaN green channel");
assert.ok(Number.isNaN(nonHex.b), "non-hex #rgb currently produces NaN blue channel");
assert.equal(nonHex.a, 1);

const nonNumericRgb = parseColorInput("rgb(foo, 0, 0)");
assert.ok(Number.isNaN(nonNumericRgb.r), "nonnumeric rgb channel currently produces NaN");
assert.equal(nonNumericRgb.g, 0);
assert.equal(nonNumericRgb.b, 0);
assert.equal(nonNumericRgb.a, 1);

assert.equal(rgbaToHex({ r: 0, g: 0, b: 0, a: 1 }), "#000000", "rgbaToHex formats black");
assert.equal(rgbaToHex({ r: 1, g: 1, b: 1, a: 1 }), "#ffffff", "rgbaToHex formats white");
assert.equal(rgbaToHex({ r: 0.5, g: 0.501, b: 0.502, a: 0.1 }), "#808080", "rgbaToHex rounds mid channels");
assert.equal(rgbaToHex({ r: -1, g: 2, b: 0.25, a: 1 }), "#00ff40", "rgbaToHex clamps out-of-range channels");
assert.equal(rgbaToHex({ r: 1, g: 0, b: 0, a: 0 }), "#ff0000", "rgbaToHex ignores alpha");

assert.equal(colorWithAlpha("#336699", 50), "rgba(51, 102, 153, 0.5)", "colorWithAlpha formats hex input");
assert.equal(colorWithAlpha("rgb(10, 20, 30)", 50), "rgba(10, 20, 30, 0.5)", "colorWithAlpha formats rgb input");
assert.equal(colorWithAlpha("rgba(10, 20, 30, 0.25)", 50), "rgba(10, 20, 30, 0.5)", "colorWithAlpha replaces rgba input alpha");
assert.equal(colorWithAlpha("#336699", 0), "rgba(51, 102, 153, 0)", "colorWithAlpha supports alpha 0 percent");
assert.equal(colorWithAlpha("#336699", 0.5), "rgba(51, 102, 153, 0.005)", "colorWithAlpha treats 0.5 as percent input");
assert.equal(colorWithAlpha("#336699", 1), "rgba(51, 102, 153, 0.01)", "colorWithAlpha treats 1 as percent input");
assert.equal(colorWithAlpha("#336699", -10), "rgba(51, 102, 153, 0)", "colorWithAlpha clamps low alpha percent");
assert.equal(colorWithAlpha("#336699", 250), "rgba(51, 102, 153, 1)", "colorWithAlpha clamps high alpha percent");

assert.equal(sanitizeKebabSegment("brand primary"), "brand-primary", "sanitizeKebabSegment handles simple words");
assert.equal(sanitizeKebabSegment("Brand Primary"), "brand-primary", "sanitizeKebabSegment lowercases uppercase input");
assert.equal(sanitizeKebabSegment("  brand   primary  "), "brand-primary", "sanitizeKebabSegment collapses spaces");
assert.equal(sanitizeKebabSegment("brand.primary/primary!"), "brand-primary-primary", "sanitizeKebabSegment replaces punctuation");
assert.equal(sanitizeKebabSegment("Déjà Vu"), "deja-vu", "sanitizeKebabSegment removes accents");
assert.equal(sanitizeKebabSegment("brand---primary___500"), "brand-primary-500", "sanitizeKebabSegment collapses repeated separators");
assert.equal(sanitizeKebabSegment("", "fallback-name"), "fallback-name", "sanitizeKebabSegment returns fallback for empty input");
assert.equal(sanitizeKebabSegment(2026), "2026", "sanitizeKebabSegment supports numeric input through string coercion");

const defaultSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
assert.deepEqual(buildBrandScale("#82BE5C", defaultSteps), {
  50: "#e9fedf",
  100: "#dbf5cd",
  200: "#c9eab8",
  300: "#b8e0a2",
  400: "#a2d287",
  500: "#82be5c",
  600: "#679e43",
  700: "#497b26",
  800: "#2e5904",
  900: "#133a00",
  950: "#022600",
}, "buildBrandScale keeps the current default brand scale stable");

const customBaseStepScale = buildBrandScale("#82BE5C", [100, 300, 500, 700], 300);
assert.deepEqual(Object.keys(customBaseStepScale), ["100", "300", "500", "700"], "buildBrandScale preserves requested steps");
assert.equal(customBaseStepScale[300], "#82be5c", "buildBrandScale preserves the base color at a custom base step");
assert.deepEqual(customBaseStepScale, {
  100: "#f3feed",
  300: "#82be5c",
  500: "#315d08",
  700: "#000b00",
}, "buildBrandScale keeps custom base-step output stable");

assert.deepEqual(buildBrandScale("#82BE5C", []), {}, "buildBrandScale returns an empty scale for empty steps");
assertThrowsWithMessage(
  () => buildBrandScale("#82BE5C", [100, 300, 700], 500),
  "Base step 500 missing in scale.",
);
assertThrowsWithMessage(
  () => buildBrandScale("not-a-color", defaultSteps),
  "Unsupported color format: not-a-color",
);

console.log("color utility behavior tests passed.");
