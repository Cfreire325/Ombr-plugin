import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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
const dsCoreUrl = pathToFileURL(path.resolve(__dirname, "../../../ds-core/src/index.js")).href;
const outputText = transpiled.outputText.replace(/from\s+["']@starter-tokens\/ds-core["']/g, `from "${dsCoreUrl}"`);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
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

assert.deepEqual(buildBrandScale("#777777", defaultSteps), {
  50: "#f3f3f3",
  100: "#e1e1e1",
  200: "#cbcbcb",
  300: "#b6b6b6",
  400: "#9c9c9c",
  500: "#777777",
  600: "#626262",
  700: "#4c4c4c",
  800: "#373737",
  900: "#232323",
  950: "#161616",
}, "buildBrandScale keeps grayscale base output stable");

assert.deepEqual(buildBrandScale("#7a7874", defaultSteps), {
  50: "#f4f3f2",
  100: "#e2e1df",
  200: "#cdccca",
  300: "#b8b7b4",
  400: "#9f9d9a",
  500: "#7a7874",
  600: "#65635f",
  700: "#4e4d49",
  800: "#393734",
  900: "#242320",
  950: "#171614",
}, "buildBrandScale keeps near-gray base output stable");

assert.deepEqual(buildBrandScale("#ff0000", defaultSteps), {
  50: "#fff1ee",
  100: "#fddcd7",
  200: "#f9c3ba",
  300: "#fca698",
  400: "#f98171",
  500: "#ff0000",
  600: "#db0000",
  700: "#b40000",
  800: "#8e0000",
  900: "#690000",
  950: "#510000",
}, "buildBrandScale keeps saturated red output and current gamut behavior stable");

assert.deepEqual(buildBrandScale("#0000ff", defaultSteps), {
  50: "#ebf1fe",
  100: "#c9dbfe",
  200: "#a2bffa",
  300: "#7ba2f4",
  400: "#4a7cef",
  500: "#0000ff",
  600: "#0400e2",
  700: "#0a00c3",
  800: "#0f00a4",
  900: "#110086",
  950: "#120073",
}, "buildBrandScale keeps saturated blue output and current gamut behavior stable");

assert.deepEqual(buildBrandScale("#00ff00", defaultSteps), {
  50: "#ecfeea",
  100: "#defeda",
  200: "#c7fec2",
  300: "#affea8",
  400: "#97fb90",
  500: "#00ff00",
  600: "#00d400",
  700: "#00a600",
  800: "#007900",
  900: "#004f00",
  950: "#003400",
}, "buildBrandScale keeps saturated green output and current gamut behavior stable");

assert.deepEqual(buildBrandScale("#05070a", defaultSteps), {
  50: "#eaecee",
  100: "#c6c8ca",
  200: "#9a9c9f",
  300: "#717377",
  400: "#414447",
  500: "#05070a",
  600: "#05070a",
  700: "#050709",
  800: "#050609",
  900: "#050608",
  950: "#050608",
}, "buildBrandScale keeps very dark base output stable");

assert.deepEqual(buildBrandScale("#f8fbff", defaultSteps), {
  50: "#f9fafb",
  100: "#f4f5f7",
  200: "#eff0f2",
  300: "#e9ebee",
  400: "#e4e6e9",
  500: "#f8fbff",
  600: "#cbcdd1",
  700: "#9a9c9f",
  800: "#6c6e70",
  900: "#414245",
  950: "#26282a",
}, "buildBrandScale keeps very light base output stable");

assert.deepEqual(buildBrandScale("#82BE5C", [100, 300, 500, 700], 100), {
  100: "#82be5c",
  300: "#4b7c27",
  500: "#183f00",
  700: "#000b00",
}, "buildBrandScale keeps base step 100 output stable");

assert.deepEqual(buildBrandScale("#82BE5C", [100, 300, 500, 700, 900], 700), {
  100: "#f3feed",
  300: "#caebb9",
  500: "#a6d48b",
  700: "#82be5c",
  900: "#000b00",
}, "buildBrandScale keeps base step 700 output stable");

assert.deepEqual(buildBrandScale("#82BE5C", [100, 300, 500, 700, 900], 900), {
  100: "#f3feed",
  300: "#d3f0c4",
  500: "#b8e0a2",
  700: "#9dcf80",
  900: "#82be5c",
}, "buildBrandScale keeps base step 900 output stable");

const unsortedDuplicateStepScale = buildBrandScale("#336699", [500, 100, 500, 50, 900, 100]);
assert.deepEqual(Object.keys(unsortedDuplicateStepScale), ["50", "100", "500", "900"], "buildBrandScale sorts and deduplicates step keys");
assert.deepEqual(unsortedDuplicateStepScale, {
  50: "#eaf3fd",
  100: "#cae0f8",
  500: "#336699",
  900: "#001e3f",
}, "buildBrandScale keeps unsorted duplicate step output stable");

const extendedStepScale = buildBrandScale("#336699", [0, 25, 50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 975, 1000]);
assert.deepEqual(Object.keys(extendedStepScale), [
  "0",
  "25",
  "50",
  "75",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
  "975",
  "1000",
], "buildBrandScale keeps extended shade keys stable");
assert.deepEqual(extendedStepScale, {
  0: "#f7fbff",
  25: "#eff6fe",
  50: "#eaf3fd",
  75: "#e7f3ff",
  100: "#cae0f8",
  200: "#acc7e5",
  300: "#8eafd3",
  400: "#6991bb",
  500: "#336699",
  600: "#255583",
  700: "#15426c",
  800: "#052f55",
  900: "#001e3f",
  950: "#001331",
  975: "#00041d",
  1000: "#000219",
}, "buildBrandScale keeps extended shade output stable");

assert.deepEqual(buildBrandScale("#336699", [100, 200, 300, 400, 500, 600, 700, 800, 900]), {
  100: "#cae0f8",
  200: "#acc7e5",
  300: "#8eafd3",
  400: "#6991bb",
  500: "#336699",
  600: "#255583",
  700: "#15426c",
  800: "#052f55",
  900: "#001e3f",
}, "buildBrandScale keeps direct hundreds-pattern output stable");

assert.deepEqual(buildBrandScale("#ggg", defaultSteps), {
  50: "#NaNNaNNaN",
  100: "#NaNNaNNaN",
  200: "#NaNNaNNaN",
  300: "#NaNNaNNaN",
  400: "#NaNNaNNaN",
  500: "#NaNNaNNaN",
  600: "#NaNNaNNaN",
  700: "#NaNNaNNaN",
  800: "#NaNNaNNaN",
  900: "#NaNNaNNaN",
  950: "#NaNNaNNaN",
}, "buildBrandScale currently preserves NaN hex output for non-hex #rgb input");

assert.deepEqual(buildBrandScale("rgb(foo, 0, 0)", defaultSteps), {
  50: "#NaNNaNNaN",
  100: "#NaNNaNNaN",
  200: "#NaNNaNNaN",
  300: "#NaNNaNNaN",
  400: "#NaNNaNNaN",
  500: "#NaN0000",
  600: "#NaNNaNNaN",
  700: "#NaNNaNNaN",
  800: "#NaNNaNNaN",
  900: "#NaNNaNNaN",
  950: "#NaNNaNNaN",
}, "buildBrandScale currently preserves NaN output for nonnumeric rgb channels");

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
