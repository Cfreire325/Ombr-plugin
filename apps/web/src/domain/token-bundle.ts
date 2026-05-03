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
} from "@starter-tokens/ds-core";
import { getProjectBrands, getProjectSelectedPalettes, type LocalProject, type ProjectBrandColor } from "./project";
import { DEFAULT_COLOR_PRESET_ID } from "./color-presets";

export type TokenBundleSummary = {
  primitiveCount: number;
  semanticCount: number;
  componentCount: number;
  tokenCount: number;
};

function rawColorToken(name: string, value: string, description: string): TokenEntry {
  return {
    name,
    type: "COLOR",
    values: { light: value, dark: value },
    scopes: ["ALL_SCOPES"],
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

export function buildMinimalTokenBundle(project: LocalProject): TokenBundle {
  return normalizeTokenBundle({
    schemaVersion: "1.0.0",
    source: "web",
    generatedAt: project.updatedAt,
    collections: {
      primitives: buildColorPrimitiveTokens(project),
      semantic: [
        {
          name: "text/primary",
          type: "COLOR",
          values: {
            light: { alias: "primitives/colors/base/black" },
            dark: project.modeSetup === "light-dark" ? { alias: "primitives/colors/base/white" } : { alias: "primitives/colors/base/black" },
          },
          scopes: ["TEXT_FILL"],
          description: "Primary text color.",
        },
        {
          name: "bg/canvas",
          type: "COLOR",
          values: {
            light: { alias: "primitives/colors/base/white" },
            dark: project.modeSetup === "light-dark" ? { alias: "primitives/colors/base/black" } : { alias: "primitives/colors/base/white" },
          },
          scopes: ["FRAME_FILL"],
          description: "Canvas background color.",
        },
      ],
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
