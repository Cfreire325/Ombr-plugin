import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../..");
const dsCoreUrl = pathToFileURL(path.resolve(repoRoot, "packages/ds-core/src/index.js")).href;

async function importTs(fileName) {
  const source = await fs.readFile(path.resolve(__dirname, fileName), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  });
  const colorPresetsUrl = pathToFileURL(path.resolve(__dirname, "color-presets.ts")).href;
  const outputText = transpiled.outputText
    .replace(/from\s+["']\.\/color-presets["']/g, `from "${colorPresetsUrl}"`)
    .replace(/from\s+["']@starter-tokens\/ds-core["']/g, `from "${dsCoreUrl}"`);
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  return import(url);
}

const {
  addProjectBrand,
  createLocalProject,
  getProjectBrands,
  getProjectSelectedPalettes,
  getModeCount,
  removeProjectBrand,
  updateProjectBaseColor,
  updateProjectBrand,
  updateProjectBrandColor,
  updateProjectColorPreset,
  updateProjectNeutralChoice,
  updateProjectSelectedPalette,
} = await importTs("project.ts");
const { getColorPresetById, normalizePaletteKey } = await import(dsCoreUrl);

function defaultSelectedPalettes(presetId) {
  const preset = getColorPresetById(presetId);
  return preset.previewPalettes.map((palette) => palette.key || normalizePaletteKey(palette.name)).filter((paletteKey) => preset.palettes[paletteKey]);
}

const project = createLocalProject({
  name: "Core Retail DS",
  modeSetup: "light-dark",
  preset: "starter",
  brandColor: "#3f6f5f",
});

assert.equal(project.name, "Core Retail DS");
assert.equal(project.modeSetup, "light-dark");
assert.equal(project.preset, "starter");
assert.equal(project.syncStatus, "not-connected");
assert.equal(project.foundations.colors.colorPresetId, "tailwind");
assert.equal(project.foundations.colors.neutralChoice, "gray");
assert.equal(project.foundations.colors.brandPrimary, "#3f6f5f");
assert.deepEqual(project.foundations.colors.brands, [{ id: "brand-primary", name: "Primary", color: "#3f6f5f" }]);
assert.deepEqual(getProjectBrands(project), [{ id: "brand-primary", name: "Primary", color: "#3f6f5f" }]);
assert.deepEqual(
  project.foundations.colors.selectedPalettes,
  defaultSelectedPalettes("tailwind"),
);
assert.deepEqual(getProjectSelectedPalettes(project), project.foundations.colors.selectedPalettes);
assert.equal(getModeCount(project), 2);
assert.ok(project.id.startsWith("local-"));
assert.ok(project.createdAt);
assert.ok(project.updatedAt);

const renamed = createLocalProject({ name: "   ", modeSetup: "light", preset: "custom" });
assert.equal(renamed.name, "Untitled design system");
assert.equal(getModeCount(renamed), 1);

const updated = updateProjectBrandColor(project, "#4b7f68");
assert.equal(updated.foundations.colors.brandPrimary, "#4b7f68");
assert.equal(getProjectBrands(updated)[0].color, "#4b7f68");
assert.equal(project.foundations.colors.brandPrimary, "#3f6f5f");

const presetUpdated = updateProjectColorPreset(project, "material");
assert.equal(presetUpdated.foundations.colors.colorPresetId, "material");
assert.equal(presetUpdated.foundations.colors.neutralChoice, "grey");
assert.deepEqual(presetUpdated.foundations.colors.selectedPalettes, defaultSelectedPalettes("material"));
assert.equal(presetUpdated.foundations.colors.baseWhite, project.foundations.colors.baseWhite);
assert.equal(presetUpdated.foundations.colors.baseBlack, project.foundations.colors.baseBlack);
assert.equal(presetUpdated.foundations.colors.brandPrimary, project.foundations.colors.brandPrimary);
assert.equal(project.foundations.colors.colorPresetId, "tailwind");

const neutralUpdated = updateProjectNeutralChoice(project, "slate");
assert.equal(neutralUpdated.foundations.colors.neutralChoice, "slate");
assert.equal(project.foundations.colors.neutralChoice, "gray");

const whiteUpdated = updateProjectBaseColor(project, "baseWhite", "#fdfdfc");
assert.equal(whiteUpdated.foundations.colors.baseWhite, "#fdfdfc");
assert.equal(whiteUpdated.foundations.colors.baseBlack, "#171717");

const blackUpdated = updateProjectBaseColor(project, "baseBlack", "#111111");
assert.equal(blackUpdated.foundations.colors.baseBlack, "#111111");
assert.equal(blackUpdated.foundations.colors.baseWhite, "#ffffff");

const materialWithMatchingNeutral = updateProjectNeutralChoice(project, "neutral");
const materialKeepsNeutral = updateProjectColorPreset(materialWithMatchingNeutral, "material");
assert.equal(materialKeepsNeutral.foundations.colors.colorPresetId, "material");
assert.equal(materialKeepsNeutral.foundations.colors.neutralChoice, "neutral");

const unknownPreset = updateProjectColorPreset(updateProjectNeutralChoice(project, "slate"), "missing");
assert.equal(unknownPreset.foundations.colors.colorPresetId, "tailwind");
assert.equal(unknownPreset.foundations.colors.neutralChoice, "slate");

const legacyPaletteProject = {
  ...project,
  foundations: {
    ...project.foundations,
    colors: {
      ...project.foundations.colors,
      selectedPalettes: undefined,
    },
  },
};
assert.deepEqual(getProjectSelectedPalettes(legacyPaletteProject), defaultSelectedPalettes("tailwind"));

const redRemoved = updateProjectSelectedPalette(project, "red", false);
assert.equal(getProjectSelectedPalettes(redRemoved).includes("red"), false);

const redAddedAgain = updateProjectSelectedPalette(redRemoved, "red", true);
assert.equal(getProjectSelectedPalettes(redAddedAgain).includes("red"), true);

let noPaletteProject = project;
for (const paletteKey of getProjectSelectedPalettes(project)) {
  noPaletteProject = updateProjectSelectedPalette(noPaletteProject, paletteKey, false);
}
assert.deepEqual(getProjectSelectedPalettes(noPaletteProject), []);

const invalidPaletteCleaned = updateProjectColorPreset(
  {
    ...project,
    foundations: {
      ...project.foundations,
      colors: {
        ...project.foundations.colors,
        selectedPalettes: ["slate"],
      },
    },
  },
  "material",
);
assert.deepEqual(invalidPaletteCleaned.foundations.colors.selectedPalettes, defaultSelectedPalettes("material"));

const matchingPaletteKept = updateProjectColorPreset(
  {
    ...project,
    foundations: {
      ...project.foundations,
      colors: {
        ...project.foundations.colors,
        selectedPalettes: ["red"],
      },
    },
  },
  "material",
);
assert.deepEqual(matchingPaletteKept.foundations.colors.selectedPalettes, ["red"]);

const legacyProject = {
  ...project,
  foundations: {
    ...project.foundations,
    colors: {
      ...project.foundations.colors,
      brandPrimary: "#112233",
      brands: undefined,
    },
  },
};
assert.deepEqual(getProjectBrands(legacyProject), [{ id: "brand-primary", name: "Primary", color: "#112233" }]);

const brandAdded = addProjectBrand(project);
assert.equal(getProjectBrands(brandAdded).length, 2);
assert.equal(getProjectBrands(brandAdded)[1].name, "Brand 2");
assert.equal(getProjectBrands(brandAdded)[1].color, "#3f6f5f");

const secondBrandId = getProjectBrands(brandAdded)[1].id;
const brandEdited = updateProjectBrand(brandAdded, secondBrandId, { name: "Accent", color: "#ff3366" });
assert.equal(getProjectBrands(brandEdited)[1].name, "Accent");
assert.equal(getProjectBrands(brandEdited)[1].color, "#ff3366");

const blankNameEdited = updateProjectBrand(brandEdited, secondBrandId, { name: "   " });
assert.equal(getProjectBrands(blankNameEdited)[1].name, "Brand 2");

const duplicateNameEdited = updateProjectBrand(blankNameEdited, secondBrandId, { name: "Primary" });
assert.equal(getProjectBrands(duplicateNameEdited)[0].name, "Primary");
assert.equal(getProjectBrands(duplicateNameEdited)[1].name, "Primary");

const brandRemoved = removeProjectBrand(duplicateNameEdited, secondBrandId);
assert.equal(getProjectBrands(brandRemoved).length, 1);
assert.equal(getProjectBrands(brandRemoved)[0].name, "Primary");

const lastBrandRemoveIgnored = removeProjectBrand(project, "brand-primary");
assert.equal(getProjectBrands(lastBrandRemoveIgnored).length, 1);
assert.equal(getProjectBrands(lastBrandRemoveIgnored)[0].id, "brand-primary");

let maxBrandProject = project;
for (let index = 0; index < 12; index += 1) {
  maxBrandProject = addProjectBrand(maxBrandProject);
}
assert.equal(getProjectBrands(maxBrandProject).length, 10);

console.log("project domain tests passed.");
