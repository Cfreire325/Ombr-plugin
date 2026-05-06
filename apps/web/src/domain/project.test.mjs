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

const CANONICAL_TYPOGRAPHY_DEFAULTS = [
  ["display-2xl", "Roboto", 72, 88],
  ["display-xl", "Roboto", 60, 72],
  ["display-lg", "Roboto", 48, 60],
  ["display-md", "Roboto", 36, 44],
  ["display-sm", "Roboto", 30, 38],
  ["display-xs", "Roboto", 24, 32],
  ["text-xl", "Inter", 20, 30],
  ["text-lg", "Inter", 18, 28],
  ["text-md", "Inter", 16, 24],
  ["text-sm", "Inter", 14, 20],
  ["text-xs", "Inter", 12, 16],
  ["label", "Inter", 10, 14],
];

const CANONICAL_SPACING_DEFAULTS = [
  ["none", 0],
  ["xxs", 2],
  ["xs", 4],
  ["sm", 6],
  ["md", 8],
  ["lg", 12],
  ["xl", 16],
  ["2xl", 20],
  ["3xl", 24],
  ["4xl", 32],
  ["5xl", 40],
  ["6xl", 48],
  ["7xl", 64],
  ["8xl", 80],
  ["9xl", 96],
  ["10xl", 128],
  ["11xl", 160],
];

const CANONICAL_RADIUS_DEFAULTS = [
  ["none", 0],
  ["xxs", 2],
  ["xs", 4],
  ["sm", 6],
  ["md", 8],
  ["lg", 10],
  ["xl", 12],
  ["2xl", 16],
  ["3xl", 20],
  ["4xl", 24],
  ["full", 9999],
];

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
  CANONICAL_TYPOGRAPHY_DEFAULTS.map(([id, family, fontSize, lineHeight]) => [id, family, fontSize, lineHeight, 400]),
);
assert.deepEqual(
  getProjectSpacingScale(project).map((step) => [step.id, step.value]),
  CANONICAL_SPACING_DEFAULTS,
);
assert.deepEqual(
  getProjectRadiusScale(project).map((step) => [step.id, step.value]),
  CANONICAL_RADIUS_DEFAULTS,
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

const typographyUpdated = updateProjectTypographyStyle(project, "text-md", {
  fontFamily: "IBM Plex Sans",
  fontSize: 18,
  lineHeight: 28,
  fontWeight: 500,
});
const updatedBodyStyle = getProjectTypographyStyles(typographyUpdated).find((style) => style.id === "text-md");
assert.equal(updatedBodyStyle.fontFamily, "IBM Plex Sans");
assert.equal(updatedBodyStyle.fontSize, 18);
assert.equal(updatedBodyStyle.lineHeight, 28);
assert.equal(updatedBodyStyle.fontWeight, 500);
assert.equal(getProjectTypographyStyles(project).find((style) => style.id === "text-md").fontSize, 16);

const typographyInvalid = updateProjectTypographyStyle(project, "display-lg", { fontFamily: "", fontSize: 0 });
assert.deepEqual(
  validateProjectFoundations(typographyInvalid)
    .filter((issue) => issue.path.startsWith("foundations.typography"))
    .map((issue) => issue.path),
  ["foundations.typography.styles[2].fontFamily", "foundations.typography.styles[2].fontSize"],
);

const typographyInvalidPreserved = updateProjectTypographyStyle(typographyInvalid, "display-lg", { lineHeight: 62 });
assert.equal(typographyInvalidPreserved.foundations.typography.styles[2].fontFamily, "");
assert.equal(typographyInvalidPreserved.foundations.typography.styles[2].fontSize, 0);
assert.equal(typographyInvalidPreserved.foundations.typography.styles[2].lineHeight, 62);

const spacingUpdated = updateProjectSpacingStep(project, "xl", 18);
assert.equal(getProjectSpacingScale(spacingUpdated).find((step) => step.id === "xl").value, 18);
assert.equal(getProjectSpacingScale(project).find((step) => step.id === "xl").value, 16);

const spacingInvalid = updateProjectSpacingStep(project, "xl", -1);
assert.deepEqual(
  validateProjectFoundations(spacingInvalid)
    .filter((issue) => issue.path.startsWith("foundations.spacing"))
    .map((issue) => issue.path),
  ["foundations.spacing.scale[6].value"],
);

const spacingInvalidPreserved = updateProjectSpacingStep(spacingInvalid, "3xl", 26);
assert.equal(spacingInvalidPreserved.foundations.spacing.scale.find((step) => step.id === "xl").value, -1);
assert.equal(spacingInvalidPreserved.foundations.spacing.scale.find((step) => step.id === "3xl").value, 26);

const radiusUpdated = updateProjectRadiusStep(project, "md", 10);
assert.equal(getProjectRadiusScale(radiusUpdated).find((step) => step.id === "md").value, 10);
assert.equal(getProjectRadiusScale(project).find((step) => step.id === "md").value, 8);

const radiusInvalid = updateProjectRadiusStep(project, "md", -1);
assert.deepEqual(
  validateProjectFoundations(radiusInvalid)
    .filter((issue) => issue.path.startsWith("foundations.radius"))
    .map((issue) => issue.path),
  ["foundations.radius.scale[4].value"],
);

const radiusInvalidPreserved = updateProjectRadiusStep(radiusInvalid, "xl", 14);
assert.equal(radiusInvalidPreserved.foundations.radius.scale.find((step) => step.id === "md").value, -1);
assert.equal(radiusInvalidPreserved.foundations.radius.scale.find((step) => step.id === "xl").value, 14);

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
        { id: "heading", fontFamily: "Acme Heading", fontSize: "34", lineHeight: "42", fontWeight: "700" },
        { id: "body", fontFamily: "", fontSize: -1, lineHeight: "bad", fontWeight: 0 },
        { id: "label", fontFamily: "Acme Label", fontSize: "15", lineHeight: "21", fontWeight: "600" },
        { id: "caption", fontFamily: "Acme Caption", fontSize: "11", lineHeight: "15", fontWeight: "500" },
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
  id: "display-2xl",
  name: "Display 2XL",
  fontFamily: "Acme Display",
  fontSize: 72,
  lineHeight: 88,
  fontWeight: 400,
});
assert.deepEqual(getProjectTypographyStyles(repairedProject).find((style) => style.id === "display-lg"), {
  id: "display-lg",
  name: "Display LG",
  fontFamily: "Acme Display",
  fontSize: 64,
  lineHeight: 72,
  fontWeight: 800,
});
assert.deepEqual(getProjectTypographyStyles(repairedProject).find((style) => style.id === "display-sm"), {
  id: "display-sm",
  name: "Display SM",
  fontFamily: "Acme Heading",
  fontSize: 34,
  lineHeight: 42,
  fontWeight: 700,
});
assert.deepEqual(getProjectTypographyStyles(repairedProject).find((style) => style.id === "text-md"), {
  id: "text-md",
  name: "Text MD",
  fontFamily: "Inter",
  fontSize: 16,
  lineHeight: 24,
  fontWeight: 400,
});
assert.deepEqual(getProjectTypographyStyles(repairedProject).find((style) => style.id === "text-sm"), {
  id: "text-sm",
  name: "Text SM",
  fontFamily: "Acme Label",
  fontSize: 15,
  lineHeight: 21,
  fontWeight: 600,
});
assert.deepEqual(getProjectTypographyStyles(repairedProject).find((style) => style.id === "text-xs"), {
  id: "text-xs",
  name: "Text XS",
  fontFamily: "Acme Caption",
  fontSize: 11,
  lineHeight: 15,
  fontWeight: 500,
});
assert.equal(getProjectSpacingScale(repairedProject).find((step) => step.id === "xl").value, 18);
assert.equal(getProjectSpacingScale(repairedProject).find((step) => step.id === "7xl").value, 64);
assert.equal(getProjectSpacingScale(repairedProject).find((step) => step.id === "xxs").value, 2);
assert.equal(getProjectSpacingScale(repairedProject).find((step) => step.id === "11xl").value, 160);
assert.equal(getProjectRadiusScale(repairedProject).find((step) => step.id === "md").value, 10);
assert.equal(getProjectRadiusScale(repairedProject).find((step) => step.id === "xl").value, 12);
assert.equal(getProjectRadiusScale(repairedProject).find((step) => step.id === "4xl").value, 24);
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
        { id: "display-2xl", name: "Display 2XL", fontFamily: "", fontSize: 0, lineHeight: -1, fontWeight: 1200 },
        ...getProjectTypographyStyles(project).slice(1),
      ],
    },
    spacing: {
      scale: [{ id: "none", value: -1 }, ...getProjectSpacingScale(project).slice(1)],
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
