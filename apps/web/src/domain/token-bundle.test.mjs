import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../..");
const dsCoreUrl = pathToFileURL(path.resolve(repoRoot, "packages/ds-core/src/index.js")).href;
const exporterPath = path.resolve(repoRoot, "packages/exporters/src/index.js");
const colorPresetsUrl = pathToFileURL(path.resolve(__dirname, "color-presets.ts")).href;

async function importTs(fileName) {
  const source = await fs.readFile(path.resolve(__dirname, fileName), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  });
  const projectUrl = pathToFileURL(path.resolve(__dirname, "project.ts")).href;
  const outputText = transpiled.outputText
    .replace(/from\s+["']\.\/project["']/g, `from "${projectUrl}"`)
    .replace(/from\s+["']\.\/color-presets["']/g, `from "${colorPresetsUrl}"`)
    .replace(/from\s+["']@starter-tokens\/ds-core["']/g, `from "${dsCoreUrl}"`);
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  return import(url);
}

async function importExporter() {
  const source = await fs.readFile(exporterPath, "utf8");
  const outputText = source.replace(/from\s+["']@starter-tokens\/ds-core["']/g, `from "${dsCoreUrl}"`);
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  return import(url);
}

const { createLocalProject } = await importTs("project.ts");
const { buildMinimalTokenBundle, summarizeTokenBundle } = await importTs("token-bundle.ts");
const { buildBrandScale, validateTokenBundle } = await import(dsCoreUrl);
const { exportTokenBundleJson } = await importExporter();

function tokenByName(bundle, collection, name) {
  return bundle.collections[collection].find((token) => token.name === name);
}

const project = createLocalProject({
  name: "Core Retail DS",
  modeSetup: "light-dark",
  preset: "starter",
  brandColor: "#3f6f5f",
});

const bundle = buildMinimalTokenBundle(project);
const validation = validateTokenBundle(bundle);
assert.equal(validation.valid, true, validation.errors.join(" | "));
assert.equal(bundle.source, "web");
assert.ok(bundle.collections.primitives.length > 20, "color primitives include base, neutral, gray aliases, and brand scale");
assert.equal(bundle.collections.semantic.length, 2);
assert.equal(bundle.collections.components.length, 0);

assert.deepEqual(tokenByName(bundle, "primitives", "colors/base/white").values, { light: "#ffffff", dark: "#ffffff" });
assert.deepEqual(tokenByName(bundle, "primitives", "colors/base/black").values, { light: "#171717", dark: "#171717" });

assert.deepEqual(tokenByName(bundle, "primitives", "colors/gray/50").values, { light: "#f9fafb", dark: "#f9fafb" });
assert.deepEqual(tokenByName(bundle, "primitives", "colors/gray/950").values, { light: "#030712", dark: "#030712" });

const brandScale = buildBrandScale("#3f6f5f", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], 500);
assert.deepEqual(tokenByName(bundle, "primitives", "colors/brand/500").values, { light: brandScale[500], dark: brandScale[500] });
assert.deepEqual(tokenByName(bundle, "primitives", "colors/brand/50").values, { light: brandScale[50], dark: brandScale[50] });
assert.deepEqual(tokenByName(bundle, "primitives", "colors/brand/950").values, { light: brandScale[950], dark: brandScale[950] });

const textPrimary = tokenByName(bundle, "semantic", "text/primary");
assert.deepEqual(textPrimary.values.light, { alias: "primitives/colors/base/black" });
assert.deepEqual(textPrimary.values.dark, { alias: "primitives/colors/base/white" });

const summary = summarizeTokenBundle(bundle);
assert.equal(summary.primitiveCount, bundle.collections.primitives.length);
assert.equal(summary.semanticCount, 2);
assert.equal(summary.componentCount, 0);
assert.equal(summary.tokenCount, bundle.collections.primitives.length + 2);

const exported = exportTokenBundleJson(bundle);
assert.equal(JSON.parse(exported).collections.semantic.length, 2);

const materialProject = {
  ...project,
  foundations: {
    ...project.foundations,
    colors: {
      ...project.foundations.colors,
      colorPresetId: "material",
      neutralChoice: "grey",
    },
  },
};
const materialBundle = buildMinimalTokenBundle(materialProject);
const materialValidation = validateTokenBundle(materialBundle);
assert.equal(materialValidation.valid, true, materialValidation.errors.join(" | "));
assert.deepEqual(
  tokenByName(materialBundle, "primitives", "colors/gray/50").values,
  {
    light: { alias: "primitives/colors/grey/50" },
    dark: { alias: "primitives/colors/grey/50" },
  },
  "gray aliases update when preset and neutral change",
);
assert.ok(tokenByName(materialBundle, "primitives", "colors/grey/500"), "selected Material neutral palette tokens are generated");
assert.equal(tokenByName(materialBundle, "primitives", "colors/neutral/500"), undefined, "unselected Material neutral palette is not generated");

const parsedMaterialExport = JSON.parse(exportTokenBundleJson(materialBundle));
assert.equal(parsedMaterialExport.collections.primitives.some((token) => token.name === "colors/brand/500"), true);

const multiBrandProject = {
  ...project,
  foundations: {
    ...project.foundations,
    colors: {
      ...project.foundations.colors,
      brandPrimary: "#3f6f5f",
      brands: [
        { id: "brand-primary", name: "Primary", color: "#111111" },
        { id: "brand-accent", name: "Accent Color", color: "#ff3366" },
        { id: "brand-accent-duplicate", name: "Accent Color", color: "#00aaee" },
      ],
    },
  },
};
const multiBrandBundle = buildMinimalTokenBundle(multiBrandProject);
const multiBrandValidation = validateTokenBundle(multiBrandBundle);
assert.equal(multiBrandValidation.valid, true, multiBrandValidation.errors.join(" | "));

const primaryFromFirstBrandScale = buildBrandScale("#111111", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], 500);
assert.deepEqual(tokenByName(multiBrandBundle, "primitives", "colors/brand/500").values, {
  light: primaryFromFirstBrandScale[500],
  dark: primaryFromFirstBrandScale[500],
});

const accentScale = buildBrandScale("#ff3366", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], 500);
const accentDuplicateScale = buildBrandScale("#00aaee", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], 500);
assert.deepEqual(tokenByName(multiBrandBundle, "primitives", "colors/brand-accent-color/500").values, {
  light: accentScale[500],
  dark: accentScale[500],
});
assert.deepEqual(tokenByName(multiBrandBundle, "primitives", "colors/brand-accent-color-2/500").values, {
  light: accentDuplicateScale[500],
  dark: accentDuplicateScale[500],
});

const legacyBrandBundle = buildMinimalTokenBundle({
  ...project,
  foundations: {
    ...project.foundations,
    colors: {
      ...project.foundations.colors,
      brandPrimary: "#8844ff",
      brands: undefined,
    },
  },
});
const legacyBrandScale = buildBrandScale("#8844ff", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], 500);
assert.deepEqual(tokenByName(legacyBrandBundle, "primitives", "colors/brand/500").values, {
  light: legacyBrandScale[500],
  dark: legacyBrandScale[500],
});

const parsedMultiBrandExport = JSON.parse(exportTokenBundleJson(multiBrandBundle));
assert.equal(parsedMultiBrandExport.collections.primitives.some((token) => token.name === "colors/brand-accent-color/500"), true);

const selectedPaletteProject = {
  ...project,
  foundations: {
    ...project.foundations,
    colors: {
      ...project.foundations.colors,
      selectedPalettes: ["red"],
    },
  },
};
const selectedPaletteBundle = buildMinimalTokenBundle(selectedPaletteProject);
const selectedPaletteValidation = validateTokenBundle(selectedPaletteBundle);
assert.equal(selectedPaletteValidation.valid, true, selectedPaletteValidation.errors.join(" | "));
assert.ok(tokenByName(selectedPaletteBundle, "primitives", "colors/red/500"), "selected preset palettes are generated");
assert.ok(tokenByName(selectedPaletteBundle, "primitives", "colors/gray/500"), "neutral palette is forced even when not explicitly selected");
assert.equal(tokenByName(selectedPaletteBundle, "primitives", "colors/blue/500"), undefined, "unselected preset palettes are not generated");

const noSelectedPaletteProject = {
  ...project,
  foundations: {
    ...project.foundations,
    colors: {
      ...project.foundations.colors,
      selectedPalettes: [],
    },
  },
};
const noSelectedPaletteBundle = buildMinimalTokenBundle(noSelectedPaletteProject);
const noSelectedPaletteValidation = validateTokenBundle(noSelectedPaletteBundle);
assert.equal(noSelectedPaletteValidation.valid, true, noSelectedPaletteValidation.errors.join(" | "));
assert.ok(tokenByName(noSelectedPaletteBundle, "primitives", "colors/gray/500"), "neutral remains generated when no palettes are selected");
assert.equal(tokenByName(noSelectedPaletteBundle, "primitives", "colors/red/500"), undefined);

const materialSelectedPaletteProject = {
  ...project,
  foundations: {
    ...project.foundations,
    colors: {
      ...project.foundations.colors,
      colorPresetId: "material",
      neutralChoice: "grey",
      selectedPalettes: ["red"],
    },
  },
};
const materialSelectedPaletteBundle = buildMinimalTokenBundle(materialSelectedPaletteProject);
const materialSelectedPaletteValidation = validateTokenBundle(materialSelectedPaletteBundle);
assert.equal(materialSelectedPaletteValidation.valid, true, materialSelectedPaletteValidation.errors.join(" | "));
assert.ok(tokenByName(materialSelectedPaletteBundle, "primitives", "colors/red/500"));
assert.ok(tokenByName(materialSelectedPaletteBundle, "primitives", "colors/grey/500"));
assert.deepEqual(tokenByName(materialSelectedPaletteBundle, "primitives", "colors/gray/500").values, {
  light: { alias: "primitives/colors/grey/500" },
  dark: { alias: "primitives/colors/grey/500" },
});

const parsedSelectedPaletteExport = JSON.parse(exportTokenBundleJson(selectedPaletteBundle));
assert.equal(parsedSelectedPaletteExport.collections.primitives.some((token) => token.name === "colors/red/500"), true);

console.log("token bundle domain tests passed.");
