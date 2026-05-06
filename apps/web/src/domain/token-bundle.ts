import {
  buildBrandScale,
  getColorPresetById,
  normalizePresetSteps,
  normalizeTokenBundle,
  resolveBaseStep,
  resolveClosestPaletteStep,
  type ColorPresetDefinition,
  type TokenEntry,
  type TokenBundle,
  type TokenModeValue,
  type TokenType,
  type TokenBundleValidationResult,
} from "@starter-tokens/ds-core";
import {
  getProjectBrands,
  getProjectColorModeAliases,
  getProjectRadiusScale,
  getProjectSelectedPalettes,
  getProjectSpacingScale,
  getProjectTypographyStyles,
  normalizeLocalProject,
  validateProjectFoundations,
  type LocalProject,
  type ProjectBrandColor,
} from "./project";
import { DEFAULT_COLOR_PRESET_ID } from "./color-presets";

export type TokenBundleSummary = {
  primitiveCount: number;
  semanticCount: number;
  componentCount: number;
  tokenCount: number;
};

export type TokenBundleBuildResult = {
  bundle: TokenBundle | null;
  summary: TokenBundleSummary;
  validation: TokenBundleValidationResult;
};

const EMPTY_TOKEN_BUNDLE_SUMMARY: TokenBundleSummary = {
  primitiveCount: 0,
  semanticCount: 0,
  componentCount: 0,
  tokenCount: 0,
};

function rawColorToken(name: string, value: string, description: string): TokenEntry {
  return rawToken(name, "COLOR", value, ["ALL_SCOPES"], description);
}

function rawToken(name: string, type: TokenType, value: TokenModeValue, scopes: string[], description: string): TokenEntry {
  return {
    name,
    type,
    values: { light: value, dark: value },
    scopes,
    description,
  };
}

function aliasColorToken(name: string, aliasPath: string, description: string): TokenEntry {
  return {
    name,
    type: "COLOR",
    values: {
      light: { alias: aliasPath },
      dark: { alias: aliasPath },
    },
    scopes: ["ALL_SCOPES"],
    description,
  };
}

function getSafePreset(colorPresetId: string): ColorPresetDefinition {
  return getColorPresetById(colorPresetId) ?? getColorPresetById(DEFAULT_COLOR_PRESET_ID)!;
}

function getPresetStepsForPalette(preset: ColorPresetDefinition, paletteName: string): string[] {
  const palette = preset.palettes[paletteName];
  if (!palette) return [];
  const normalizedPresetSteps = normalizePresetSteps(preset);
  const paletteSteps = Object.keys(palette);
  return normalizedPresetSteps.filter((step) => paletteSteps.includes(step));
}

function slugBrandName(name: string, fallback: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function getAdditionalBrandTokenPrefix(brand: ProjectBrandColor, brandIndex: number, usedPrefixes: Set<string>): string {
  const basePrefix = `brand-${slugBrandName(brand.name, `brand-${brandIndex + 1}`)}`;
  let prefix = basePrefix;
  let suffix = 2;

  while (usedPrefixes.has(prefix)) {
    prefix = `${basePrefix}-${suffix}`;
    suffix += 1;
  }

  usedPrefixes.add(prefix);
  return prefix;
}

function pushBrandScaleTokens(tokens: TokenEntry[], prefix: string, brand: ProjectBrandColor, brandSteps: number[], baseStep: number): void {
  const brandScale = buildBrandScale(brand.color, brandSteps, baseStep);

  for (const step of brandSteps) {
    const value = brandScale[step];
    if (!value) continue;
    tokens.push(rawColorToken(`colors/${prefix}/${step}`, value, `${brand.name} brand color ${step}.`));
  }
}

function buildColorPrimitiveTokens(project: LocalProject): TokenEntry[] {
  const { baseWhite, baseBlack, colorPresetId, neutralChoice } = project.foundations.colors;
  const brands = getProjectBrands(project);
  const selectedPalettes = getProjectSelectedPalettes(project);
  const preset = getSafePreset(colorPresetId);
  const neutralPalette = preset.palettes[neutralChoice] ? neutralChoice : preset.defaultNeutral;
  const neutralSteps = getPresetStepsForPalette(preset, neutralPalette);
  const numericBrandSteps = neutralSteps.map((step) => Number(step)).filter((step) => Number.isFinite(step));
  const brandSteps = numericBrandSteps.length ? numericBrandSteps : [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const baseStep = resolveBaseStep(brandSteps);

  const tokens: TokenEntry[] = [
    rawColorToken("colors/base/white", baseWhite, "Base white color."),
    rawColorToken("colors/base/black", baseBlack, "Base black color."),
  ];

  const paletteKeysToGenerate = new Set([...selectedPalettes, neutralPalette]);
  for (const paletteKey of paletteKeysToGenerate) {
    if (!preset.palettes[paletteKey]) continue;
    if (paletteKey === "gray" && neutralPalette !== "gray") continue;

    for (const step of getPresetStepsForPalette(preset, paletteKey)) {
      const value = preset.palettes[paletteKey]?.[step];
      if (!value) continue;
      tokens.push(rawColorToken(`colors/${paletteKey}/${step}`, value, `${preset.label} ${paletteKey} ${step}.`));
    }
  }

  if (neutralPalette !== "gray") {
    for (const step of neutralSteps) {
      const neutralStep = resolveClosestPaletteStep(preset, neutralPalette, step);
      tokens.push(
        aliasColorToken(
          `colors/gray/${step}`,
          `primitives/colors/${neutralPalette}/${neutralStep}`,
          `Neutral gray alias for ${neutralPalette} ${neutralStep}.`,
        ),
      );
    }
  }

  const [primaryBrand, ...additionalBrands] = brands;
  pushBrandScaleTokens(tokens, "brand", primaryBrand, brandSteps, baseStep);

  const usedBrandPrefixes = new Set<string>(["brand"]);
  for (let index = 0; index < additionalBrands.length; index += 1) {
    const brand = additionalBrands[index];
    const prefix = getAdditionalBrandTokenPrefix(brand, index + 1, usedBrandPrefixes);
    pushBrandScaleTokens(tokens, prefix, brand, brandSteps, baseStep);
  }

  return tokens;
}

export function getProjectColorPrimitiveReferences(project: LocalProject): string[] {
  const normalizedProject = normalizeLocalProject(project);
  if (!normalizedProject) return [];

  try {
    return buildColorPrimitiveTokens(normalizedProject)
      .filter((token) => token.type === "COLOR")
      .map((token) => token.name);
  } catch {
    return [];
  }
}

function buildTypographyPrimitiveTokens(project: LocalProject): TokenEntry[] {
  const tokens: TokenEntry[] = [];

  for (const style of getProjectTypographyStyles(project)) {
    tokens.push(rawToken(`font-family/${style.id}`, "STRING", style.fontFamily, ["FONT_FAMILY"], `${style.name} font family.`));
    tokens.push(rawToken(`font-size/${style.id}`, "FLOAT", style.fontSize, ["FONT_SIZE"], `${style.name} font size.`));
    tokens.push(rawToken(`line-height/${style.id}`, "FLOAT", style.lineHeight, ["FONT_SIZE"], `${style.name} line height.`));
    tokens.push(rawToken(`font-weight/${style.id}`, "FLOAT", style.fontWeight, ["ALL_SCOPES"], `${style.name} font weight.`));
  }

  return tokens;
}

function buildSpacingPrimitiveTokens(project: LocalProject): TokenEntry[] {
  return getProjectSpacingScale(project).map((step) =>
    rawToken(`spacing/${step.id}`, "FLOAT", step.value, ["GAP"], `${step.name} spacing value.`),
  );
}

function buildRadiusPrimitiveTokens(project: LocalProject): TokenEntry[] {
  return getProjectRadiusScale(project).map((step) =>
    rawToken(`radius/${step.id}`, "FLOAT", step.value, ["CORNER_RADIUS"], `${step.name} radius value.`),
  );
}

function buildPrimitiveTokens(project: LocalProject): TokenEntry[] {
  return [
    ...buildColorPrimitiveTokens(project),
    ...buildTypographyPrimitiveTokens(project),
    ...buildSpacingPrimitiveTokens(project),
    ...buildRadiusPrimitiveTokens(project),
  ];
}

function toPrimitiveAliasPath(reference: string): string {
  return reference.startsWith("primitives/") ? reference : `primitives/${reference}`;
}

function normalizePrimitiveReference(reference: string): string {
  return reference.replace(/^primitives\//, "");
}

function validateColorModeReferences(project: LocalProject, primitiveTokens: TokenEntry[]) {
  const primitiveNames = new Set(primitiveTokens.filter((token) => token.type === "COLOR").map((token) => token.name));
  const issues: string[] = [];

  for (const alias of getProjectColorModeAliases(project)) {
    const references: Array<["light" | "dark", string]> = [["light", alias.light]];
    if (project.modeSetup === "light-dark") references.push(["dark", alias.dark]);

    for (const [modeName, reference] of references) {
      const normalizedReference = normalizePrimitiveReference(reference);
      if (!primitiveNames.has(normalizedReference)) {
        issues.push(`Color mode ${alias.label} ${modeName} reference must point to an existing color primitive: ${reference}`);
      }
    }
  }

  return issues;
}

function buildSemanticColorTokens(project: LocalProject, primitiveTokens: TokenEntry[]): TokenEntry[] {
  const primitiveNames = new Set(primitiveTokens.map((token) => token.name));

  return getProjectColorModeAliases(project).map((alias) => {
    const lightReference = normalizePrimitiveReference(alias.light);
    const darkReference = project.modeSetup === "light-dark" ? normalizePrimitiveReference(alias.dark) : lightReference;

    if (!primitiveNames.has(lightReference)) {
      throw new Error(`Color mode ${alias.name} light reference does not match a primitive: ${alias.light}`);
    }

    if (!primitiveNames.has(darkReference)) {
      throw new Error(`Color mode ${alias.name} dark reference does not match a primitive: ${alias.dark}`);
    }

    return {
      name: alias.name,
      type: "COLOR",
      values: {
        light: { alias: toPrimitiveAliasPath(lightReference) },
        dark: { alias: toPrimitiveAliasPath(darkReference) },
      },
      scopes: alias.scopes,
      description: alias.description,
    };
  });
}

export function buildMinimalTokenBundle(project: LocalProject): TokenBundle {
  const primitives = buildPrimitiveTokens(project);

  return normalizeTokenBundle({
    schemaVersion: "1.0.0",
    source: "web",
    generatedAt: project.updatedAt,
    collections: {
      primitives,
      semantic: buildSemanticColorTokens(project, primitives),
      components: [],
    },
  });
}

export function summarizeTokenBundle(bundle: TokenBundle): TokenBundleSummary {
  const primitiveCount = bundle.collections.primitives.length;
  const semanticCount = bundle.collections.semantic.length;
  const componentCount = bundle.collections.components.length;

  return {
    primitiveCount,
    semanticCount,
    componentCount,
    tokenCount: primitiveCount + semanticCount + componentCount,
  };
}

export function buildTokenBundleResult(project: LocalProject): TokenBundleBuildResult {
  try {
    const normalizedProject = normalizeLocalProject(project);
    if (!normalizedProject) {
      return {
        bundle: null,
        summary: EMPTY_TOKEN_BUNDLE_SUMMARY,
        validation: {
          valid: false,
          errors: ["Invalid local project."],
        },
      };
    }

    const projectIssues = [...validateProjectFoundations(project), ...validateProjectFoundations(normalizedProject)];
    if (projectIssues.length) {
      return {
        bundle: null,
        summary: EMPTY_TOKEN_BUNDLE_SUMMARY,
        validation: {
          valid: false,
          errors: projectIssues.map((issue) => issue.message),
        },
      };
    }

    const primitiveTokens = buildPrimitiveTokens(normalizedProject);
    const colorModeReferenceErrors = validateColorModeReferences(normalizedProject, primitiveTokens);
    if (colorModeReferenceErrors.length) {
      return {
        bundle: null,
        summary: EMPTY_TOKEN_BUNDLE_SUMMARY,
        validation: {
          valid: false,
          errors: colorModeReferenceErrors,
        },
      };
    }

    const bundle = normalizeTokenBundle({
      schemaVersion: "1.0.0",
      source: "web",
      generatedAt: normalizedProject.updatedAt,
      collections: {
        primitives: primitiveTokens,
        semantic: buildSemanticColorTokens(normalizedProject, primitiveTokens),
        components: [],
      },
    });
    return {
      bundle,
      summary: summarizeTokenBundle(bundle),
      validation: { valid: true, errors: [] },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      bundle: null,
      summary: EMPTY_TOKEN_BUNDLE_SUMMARY,
      validation: {
        valid: false,
        errors: [`TokenBundle generation failed: ${message}`],
      },
    };
  }
}
