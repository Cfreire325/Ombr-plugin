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

async function importPrimitiveTokenHarness() {
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
  globalThis.__colorUtilsForPrimitiveTokenTest = await importTsModule(path.resolve(packageSrcDir, "presets/color-utils.ts"));

  const codePath = path.resolve(packageSrcDir, "code.ts");
  const source = await fs.readFile(codePath, "utf8");
  const sourceWithoutImports = source.replace(/^import[\s\S]*?;\r?\n/gm, "");
  const dsCoreHarnessUrl = pathToFileURL(path.resolve(packageSrcDir, "../../ds-core/src/index.js")).href;
  const harnessSource = `
import { basePatternSteps, closestStep, deriveShadeSteps, extendSteps, nextShadeStep, pickSubset, resolveBaseStep } from "${dsCoreHarnessUrl}";
const __html__ = "";
const { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } = globalThis.__colorUtilsForPrimitiveTokenTest;
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
export { buildPrimitiveTokens, deriveShadeSteps, normalizeBrands, resolveBaseStep };
`;
  const transpiled = ts.transpileModule(harnessSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
  });
  return import(`data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString("base64")}`);
}

function palette(values) {
  return {
    50: values[0],
    100: values[1],
    200: values[2],
    300: values[3],
    400: values[4],
    500: values[5],
    600: values[6],
    700: values[7],
    800: values[8],
    900: values[9],
    950: values[10],
  };
}

function tokenByName(tokens) {
  return new Map(tokens.map((token) => [token.name, token]));
}

function rawToken(collection, name, type, scopes, value) {
  return {
    collection,
    name,
    type,
    scopes,
    value: { kind: "raw", value },
  };
}

function aliasToken(collection, name, type, scopes, ref, refCollection) {
  return {
    collection,
    name,
    type,
    scopes,
    value: { kind: "alias", ref, collection: refCollection },
  };
}

const { buildPrimitiveTokens, deriveShadeSteps, normalizeBrands, resolveBaseStep } = await importPrimitiveTokenHarness();

const preset = {
  id: "fixture",
  label: "Fixture",
  description: "Primitive token generation fixture",
  palettes: {
    slate: palette(["#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0f172a", "#020617"]),
    red: palette(["#fef2f2", "#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#450a0a"]),
    blue: palette(["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"]),
  },
  neutralOptions: ["slate"],
  defaultNeutral: "slate",
  steps: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"],
  previewPalettes: [],
};

const options = {
  baseWhite: "#ffffff",
  baseBlack: "#000000",
  neutralChoice: "slate",
  selectedPalettes: ["red"],
  paletteOverrides: {},
  brands: [{ name: "Acme Primary", color: "#82BE5C" }],
};

const shadeSteps = deriveShadeSteps("tailwind", 11);
const baseStep = resolveBaseStep(shadeSteps);
const brands = normalizeBrands(options.brands, preset, shadeSteps, baseStep);
const tokens = buildPrimitiveTokens(options, preset, brands, shadeSteps);
const byName = tokenByName(tokens);

assert.equal(tokens.length, 145, "primitive token count stays stable for selected red + neutral slate + one brand");
assert.deepEqual(shadeSteps, [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], "tailwind shade steps stay stable");
assert.equal(baseStep, 500, "tailwind base step stays at 500");

assert.deepEqual(byName.get("colors/base/white"), rawToken("primitives", "colors/base/white", "COLOR", ["ALL_SCOPES"], "#ffffff"));
assert.deepEqual(byName.get("colors/base/black"), rawToken("primitives", "colors/base/black", "COLOR", ["ALL_SCOPES"], "#000000"));

assert.deepEqual(byName.get("colors/red/500"), rawToken("primitives", "colors/red/500", "COLOR", ["ALL_SCOPES"], "#ef4444"));
assert.deepEqual(byName.get("colors/slate/500"), rawToken("primitives", "colors/slate/500", "COLOR", ["ALL_SCOPES"], "#64748b"));
assert.equal(byName.has("colors/blue/500"), false, "unselected non-neutral preset palettes are not generated");

assert.deepEqual(byName.get("colors/gray/50"), aliasToken("primitives", "colors/gray/50", "COLOR", ["ALL_SCOPES"], "colors/slate/50", "primitives"));
assert.deepEqual(byName.get("colors/gray/500"), aliasToken("primitives", "colors/gray/500", "COLOR", ["ALL_SCOPES"], "colors/slate/500", "primitives"));
assert.deepEqual(byName.get("colors/gray/950"), aliasToken("primitives", "colors/gray/950", "COLOR", ["ALL_SCOPES"], "colors/slate/950", "primitives"));

const expectedBrandScale = {
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
};
assert.deepEqual(brands, [{
  tokenName: "acme-primary",
  opacityName: "brand-1",
  baseColor: "#82be5c",
  scale: expectedBrandScale,
}], "normalized brand name, opacity name, base color, and generated scale stay stable");

for (const step of shadeSteps) {
  assert.deepEqual(
    byName.get(`colors/acme-primary/${step}`),
    rawToken("primitives", `colors/acme-primary/${step}`, "COLOR", ["ALL_SCOPES"], expectedBrandScale[step]),
    `generated brand scale token ${step} stays stable`,
  );
  assert.deepEqual(
    byName.get(`colors/brand/${step}`),
    aliasToken("primitives", `colors/brand/${step}`, "COLOR", ["ALL_SCOPES"], `colors/acme-primary/${step}`, "primitives"),
    `brand alias token ${step} stays stable`,
  );
}

assert.deepEqual(byName.get("opacity/white/4"), rawToken("primitives", "opacity/white/4", "COLOR", ["ALL_FILLS"], "rgba(255, 255, 255, 0.04)"));
assert.deepEqual(byName.get("opacity/white/50"), rawToken("primitives", "opacity/white/50", "COLOR", ["ALL_FILLS"], "rgba(255, 255, 255, 0.5)"));
assert.deepEqual(byName.get("opacity/white/100"), rawToken("primitives", "opacity/white/100", "COLOR", ["ALL_FILLS"], "rgba(255, 255, 255, 1)"));
assert.deepEqual(byName.get("opacity/black/4"), rawToken("primitives", "opacity/black/4", "COLOR", ["ALL_FILLS"], "rgba(0, 0, 0, 0.04)"));
assert.deepEqual(byName.get("opacity/black/50"), rawToken("primitives", "opacity/black/50", "COLOR", ["ALL_FILLS"], "rgba(0, 0, 0, 0.5)"));
assert.deepEqual(byName.get("opacity/black/100"), rawToken("primitives", "opacity/black/100", "COLOR", ["ALL_FILLS"], "rgba(0, 0, 0, 1)"));
assert.deepEqual(byName.get("opacity/brand-1/4"), rawToken("primitives", "opacity/brand-1/4", "COLOR", ["ALL_FILLS"], "rgba(130, 190, 92, 0.04)"));
assert.deepEqual(byName.get("opacity/brand-1/50"), rawToken("primitives", "opacity/brand-1/50", "COLOR", ["ALL_FILLS"], "rgba(130, 190, 92, 0.5)"));
assert.deepEqual(byName.get("opacity/brand-1/100"), rawToken("primitives", "opacity/brand-1/100", "COLOR", ["ALL_FILLS"], "rgba(130, 190, 92, 1)"));

assert.deepEqual(byName.get("pixel/0"), rawToken("primitives", "pixel/0", "FLOAT", ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"], 0));
assert.deepEqual(byName.get("pixel/8"), rawToken("primitives", "pixel/8", "FLOAT", ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"], 8));
assert.deepEqual(byName.get("pixel/256"), rawToken("primitives", "pixel/256", "FLOAT", ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"], 256));
assert.deepEqual(byName.get("pixel/full"), rawToken("primitives", "pixel/full", "FLOAT", ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"], 9999));

console.log("primitive token fixture tests passed.");
