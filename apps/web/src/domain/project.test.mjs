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
  getProjectColorModeAliases,
  getProjectRadiusScale,
  getProjectSelectedPalettes,
  getProjectSpacingScale,
  getProjectTypographyStyles,
  getModeCount,
  normalizeLocalProject,
  removeProjectBrand,
  updateProjectBaseColor,
  updateProjectBrand,
  updateProjectBrandColor,
  updateProjectColorModeAlias,
  updateProjectColorPreset,
  updateProjectRadiusStep,
  updateProjectNeutralChoice,
  updateProjectSelectedPalette,
  updateProjectSpacingStep,
  updateProjectTypographyStyle,
  validateProjectColors,
  validateProjectFoundations,
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
assert.deepEqual(
  getProjectTypographyStyles(project).map((style) => [style.id, style.fontFamily, style.fontSize, style.lineHeight, style.fontWeight]),
  [
    ["display", "Inter", 48, 56, 700],
    ["heading", "Inter", 32, 40, 700],
    ["body", "Inter", 16, 24, 400],
    ["label", "Inter", 14, 20, 600],
    ["caption", "Inter", 12, 16, 400],
  ],
);
assert.deepEqual(
  getProjectSpacingScale(project).map((step) => [step.id, step.value]),
  [
    ["0", 0],
    ["1", 4],
    ["2", 8],
    ["3", 12],
    ["4", 16],
    ["6", 24],
    ["8", 32],
    ["10", 40],
    ["12", 48],
    ["16", 64],
  ],
);
assert.deepEqual(
  getProjectRadiusScale(project).map((step) => [step.id, step.value]),
  [
    ["none", 0],
    ["xs", 2],
    ["sm", 4],
    ["md", 8],
    ["lg", 12],
    ["xl", 16],
    ["2xl", 24],
    ["full", 9999],
  ],
);
assert.deepEqual(getProjectBrands(project), [{ id: "brand-primary", name: "Primary", color: "#3f6f5f" }]);
assert.deepEqual(
  getProjectColorModeAliases(project).map((alias) => [alias.name, alias.light, alias.dark]),
  [
    ["color/text/primary", "colors/gray/900", "colors/gray/50"],
    ["color/background/primary", "colors/brand/50", "colors/brand/900"],
  ],
);
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

const invalidNeutralIgnored = updateProjectNeutralChoice(project, "not-a-neutral");
assert.equal(invalidNeutralIgnored.foundations.colors.neutralChoice, "gray");

const whiteUpdated = updateProjectBaseColor(project, "baseWhite", "#fdfdfc");
assert.equal(whiteUpdated.foundations.colors.baseWhite, "#fdfdfc");
assert.equal(whiteUpdated.foundations.colors.baseBlack, "#171717");

const blackUpdated = updateProjectBaseColor(project, "baseBlack", "#111111");
assert.equal(blackUpdated.foundations.colors.baseBlack, "#111111");
assert.equal(blackUpdated.foundations.colors.baseWhite, "#ffffff");

const colorModeUpdated = updateProjectColorModeAlias(project, "color/text/primary", {
  light: "colors/brand/600",
  dark: "colors/gray/100",
});
assert.deepEqual(getProjectColorModeAliases(colorModeUpdated)[0], {
  name: "color/text/primary",
  label: "Text primary",
  light: "colors/brand/600",
  dark: "colors/gray/100",
  scopes: ["TEXT_FILL"],
  description: "Primary text color mode.",
});
assert.equal(getProjectColorModeAliases(project)[0].light, "colors/gray/900");

const missingColorModes = normalizeLocalProject({
  ...project,
  foundations: {
    ...project.foundations,
    colorModes: undefined,
  },
});
assert.deepEqual(
  getProjectColorModeAliases(missingColorModes).map((alias) => [alias.name, alias.light, alias.dark]),
  [
    ["color/text/primary", "colors/gray/900", "colors/gray/50"],
    ["color/background/primary", "colors/brand/50", "colors/brand/900"],
  ],
);

const typographyUpdated = updateProjectTypographyStyle(project, "body", {
  fontFamily: "IBM Plex Sans",
  fontSize: 18,
  lineHeight: 28,
  fontWeight: 500,
});
const updatedBodyStyle = getProjectTypographyStyles(typographyUpdated).find((style) => style.id === "body");
assert.equal(updatedBodyStyle.fontFamily, "IBM Plex Sans");
assert.equal(updatedBodyStyle.fontSize, 18);
assert.equal(updatedBodyStyle.lineHeight, 28);
assert.equal(updatedBodyStyle.fontWeight, 500);
assert.equal(getProjectTypographyStyles(project).find((style) => style.id === "body").fontSize, 16);

const typographyInvalid = updateProjectTypographyStyle(project, "display", { fontFamily: "", fontSize: 0 });
assert.deepEqual(
  validateProjectFoundations(typographyInvalid)
    .filter((issue) => issue.path.startsWith("foundations.typography"))
    .map((issue) => issue.path),
  ["foundations.typography.styles[0].fontFamily", "foundations.typography.styles[0].fontSize"],
);

const typographyInvalidPreserved = updateProjectTypographyStyle(typographyInvalid, "display", { lineHeight: 60 });
assert.equal(typographyInvalidPreserved.foundations.typography.styles[0].fontFamily, "");
assert.equal(typographyInvalidPreserved.foundations.typography.styles[0].fontSize, 0);
assert.equal(typographyInvalidPreserved.foundations.typography.styles[0].lineHeight, 60);

const spacingUpdated = updateProjectSpacingStep(project, "4", 18);
assert.equal(getProjectSpacingScale(spacingUpdated).find((step) => step.id === "4").value, 18);
assert.equal(getProjectSpacingScale(project).find((step) => step.id === "4").value, 16);

const spacingInvalid = updateProjectSpacingStep(project, "4", -1);
assert.deepEqual(
  validateProjectFoundations(spacingInvalid)
    .filter((issue) => issue.path.startsWith("foundations.spacing"))
    .map((issue) => issue.path),
  ["foundations.spacing.scale[4].value"],
);

const spacingInvalidPreserved = updateProjectSpacingStep(spacingInvalid, "6", 26);
assert.equal(spacingInvalidPreserved.foundations.spacing.scale.find((step) => step.id === "4").value, -1);
assert.equal(spacingInvalidPreserved.foundations.spacing.scale.find((step) => step.id === "6").value, 26);

const radiusUpdated = updateProjectRadiusStep(project, "md", 10);
assert.equal(getProjectRadiusScale(radiusUpdated).find((step) => step.id === "md").value, 10);
assert.equal(getProjectRadiusScale(project).find((step) => step.id === "md").value, 8);

const radiusInvalid = updateProjectRadiusStep(project, "md", -1);
assert.deepEqual(
  validateProjectFoundations(radiusInvalid)
    .filter((issue) => issue.path.startsWith("foundations.radius"))
    .map((issue) => issue.path),
  ["foundations.radius.scale[3].value"],
);

const radiusInvalidPreserved = updateProjectRadiusStep(radiusInvalid, "lg", 14);
assert.equal(radiusInvalidPreserved.foundations.radius.scale.find((step) => step.id === "md").value, -1);
assert.equal(radiusInvalidPreserved.foundations.radius.scale.find((step) => step.id === "lg").value, 14);

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

const primaryRemoved = removeProjectBrand(brandEdited, "brand-primary");
assert.equal(getProjectBrands(primaryRemoved).length, 1);
assert.equal(getProjectBrands(primaryRemoved)[0].id, secondBrandId);
assert.equal(primaryRemoved.foundations.colors.brandPrimary, "#ff3366");

const lastBrandRemoveIgnored = removeProjectBrand(project, "brand-primary");
assert.equal(getProjectBrands(lastBrandRemoveIgnored).length, 1);
assert.equal(getProjectBrands(lastBrandRemoveIgnored)[0].id, "brand-primary");

let maxBrandProject = project;
for (let index = 0; index < 12; index += 1) {
  maxBrandProject = addProjectBrand(maxBrandProject);
}
assert.equal(getProjectBrands(maxBrandProject).length, 10);

const repairedProject = normalizeLocalProject({
  id: "stored-1",
  name: "   ",
  modeSetup: "broken",
  preset: "unknown",
  syncStatus: "bad-sync",
  createdAt: "not-a-date",
  updatedAt: "",
  foundations: {
    typography: {
      styles: [
        { id: "display", fontFamily: "  Acme Display  ", fontSize: "64", lineHeight: "72", fontWeight: "800" },
        { id: "body", fontFamily: "", fontSize: -1, lineHeight: "bad", fontWeight: 0 },
        { id: "extra", fontFamily: "Nope", fontSize: 1, lineHeight: 1, fontWeight: 100 },
      ],
    },
    spacing: {
      scale: [
        { id: "0", value: "0" },
        { id: "4", value: "18" },
        { id: "16", value: -4 },
        { id: "extra", value: 999 },
      ],
    },
    radius: {
      scale: [
        { id: "none", value: "0" },
        { id: "md", value: "10" },
        { id: "full", value: "full" },
        { id: "extra", value: 999 },
      ],
    },
    colors: {
      colorPresetId: "missing-preset",
      neutralChoice: "missing-neutral",
      brandPrimary: "#112233",
      brands: [
        { id: "dup", name: "   ", color: "#112233" },
        { id: "dup", name: "Accent", color: "#445566" },
      ],
      selectedPalettes: ["red", "missing", "Red"],
      baseWhite: "#fff",
      baseBlack: "#000",
    },
  },
});
assert.ok(repairedProject);
assert.equal(repairedProject.id, "stored-1");
assert.equal(repairedProject.name, "Untitled design system");
assert.equal(repairedProject.modeSetup, "light-dark");
assert.equal(repairedProject.preset, "starter");
assert.equal(repairedProject.syncStatus, "not-connected");
assert.equal(repairedProject.foundations.colors.colorPresetId, "tailwind");
assert.equal(repairedProject.foundations.colors.neutralChoice, "gray");
assert.equal(repairedProject.foundations.colors.brandPrimary, "#112233");
assert.deepEqual(
  getProjectBrands(repairedProject).map((brand) => brand.name),
  ["Primary", "Accent"],
);
assert.notEqual(getProjectBrands(repairedProject)[0].id, getProjectBrands(repairedProject)[1].id);
assert.deepEqual(repairedProject.foundations.colors.selectedPalettes, ["red"]);
assert.equal(repairedProject.foundations.colors.baseWhite, "#fff");
assert.equal(repairedProject.foundations.colors.baseBlack, "#000");
assert.deepEqual(
  getProjectColorModeAliases(repairedProject).map((alias) => [alias.name, alias.light, alias.dark]),
  [
    ["color/text/primary", "colors/gray/900", "colors/gray/50"],
    ["color/background/primary", "colors/brand/50", "colors/brand/900"],
  ],
);
assert.deepEqual(getProjectTypographyStyles(repairedProject)[0], {
  id: "display",
  name: "Display",
  fontFamily: "Acme Display",
  fontSize: 64,
  lineHeight: 72,
  fontWeight: 800,
});
assert.deepEqual(getProjectTypographyStyles(repairedProject)[2], {
  id: "body",
  name: "Body",
  fontFamily: "Inter",
  fontSize: 16,
  lineHeight: 24,
  fontWeight: 400,
});
assert.equal(getProjectSpacingScale(repairedProject).find((step) => step.id === "4").value, 18);
assert.equal(getProjectSpacingScale(repairedProject).find((step) => step.id === "16").value, 64);
assert.equal(getProjectRadiusScale(repairedProject).find((step) => step.id === "md").value, 10);
assert.equal(getProjectRadiusScale(repairedProject).find((step) => step.id === "full").value, 9999);
assert.equal(Number.isNaN(Date.parse(repairedProject.createdAt)), false);
assert.equal(Number.isNaN(Date.parse(repairedProject.updatedAt)), false);

assert.equal(normalizeLocalProject(null), null);
assert.equal(normalizeLocalProject("not-a-project"), null);

const invalidColorIssues = validateProjectColors({
  ...project,
  foundations: {
    ...project.foundations,
    colors: {
      ...project.foundations.colors,
      baseWhite: "white-ish",
      baseBlack: "black-ish",
      brands: [{ id: "brand-primary", name: "Primary", color: "not-a-color" }],
    },
  },
});
assert.deepEqual(
  invalidColorIssues.map((issue) => issue.path),
  ["foundations.colors.baseWhite", "foundations.colors.baseBlack", "foundations.colors.brands[0].color"],
);

const invalidFoundationIssues = validateProjectFoundations({
  ...project,
  foundations: {
    ...project.foundations,
    typography: {
      styles: [
        { id: "display", name: "Display", fontFamily: "", fontSize: 0, lineHeight: -1, fontWeight: 1200 },
        ...getProjectTypographyStyles(project).slice(1),
      ],
    },
    spacing: {
      scale: [{ id: "0", value: -1 }, ...getProjectSpacingScale(project).slice(1)],
    },
    radius: {
      scale: [{ id: "none", value: -1 }, ...getProjectRadiusScale(project).slice(1)],
    },
  },
});
assert.deepEqual(
  invalidFoundationIssues.map((issue) => issue.path),
  [
    "foundations.typography.styles[0].fontFamily",
    "foundations.typography.styles[0].fontSize",
    "foundations.typography.styles[0].lineHeight",
    "foundations.typography.styles[0].fontWeight",
    "foundations.spacing.scale[0].value",
    "foundations.radius.scale[0].value",
  ],
);

console.log("project domain tests passed.");
