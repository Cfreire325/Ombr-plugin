import { getColorPresetById, normalizePaletteKey } from "@starter-tokens/ds-core";

export type ProjectModeSetup = "light" | "light-dark";
export type ProjectPreset = "custom" | "starter";
export type ProjectSyncStatus = "not-connected" | "ready-for-handoff";
export type ProjectBaseColorKey = "baseWhite" | "baseBlack";
export type ProjectBrandColor = {
  id: string;
  name: string;
  color: string;
};

export type ProjectFoundations = {
  colors: {
    colorPresetId: string;
    neutralChoice: string;
    brandPrimary?: string;
    brands?: ProjectBrandColor[];
    selectedPalettes?: string[];
    baseWhite: string;
    baseBlack: string;
  };
};

export type LocalProject = {
  id: string;
  name: string;
  modeSetup: ProjectModeSetup;
  preset: ProjectPreset;
  syncStatus: ProjectSyncStatus;
  createdAt: string;
  updatedAt: string;
  foundations: ProjectFoundations;
};

export type CreateProjectInput = {
  name: string;
  modeSetup: ProjectModeSetup;
  preset: ProjectPreset;
  brandColor?: string;
};

const DEFAULT_BRAND_COLOR = "#3f6f5f";
const DEFAULT_BASE_WHITE = "#ffffff";
const DEFAULT_BASE_BLACK = "#171717";
const DEFAULT_COLOR_PRESET_ID = "tailwind";
export const MAX_PROJECT_BRANDS = 10;

function getSafeColorPreset(colorPresetId: string) {
  return getColorPresetById(colorPresetId) ?? getColorPresetById(DEFAULT_COLOR_PRESET_ID)!;
}

function getDefaultNeutralChoice(colorPresetId: string): string {
  const preset = getSafeColorPreset(colorPresetId);
  return preset.defaultNeutral || preset.neutralOptions[0] || "gray";
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function getDefaultSelectedPalettes(colorPresetId: string): string[] {
  const preset = getSafeColorPreset(colorPresetId);
  const fromPreview = preset.previewPalettes
    .map((palette) => palette.key || normalizePaletteKey(palette.name))
    .filter((paletteKey) => Boolean(preset.palettes[paletteKey]));

  return uniqueStrings(fromPreview.length ? fromPreview : [preset.defaultNeutral].filter((paletteKey) => Boolean(preset.palettes[paletteKey])));
}

function normalizeSelectedPalettes(colorPresetId: string, selectedPalettes: string[] | undefined): string[] {
  const preset = getSafeColorPreset(colorPresetId);
  if (!Array.isArray(selectedPalettes)) return getDefaultSelectedPalettes(preset.id);

  return uniqueStrings(selectedPalettes.map((paletteKey) => normalizePaletteKey(paletteKey)).filter((paletteKey) => Boolean(preset.palettes[paletteKey])));
}

function nowIso(): string {
  return new Date().toISOString();
}

function createProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `local-${crypto.randomUUID()}`;
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBrandId(brands: ProjectBrandColor[]): string {
  for (let index = brands.length + 1; index <= MAX_PROJECT_BRANDS + 1; index += 1) {
    const candidate = index === 1 ? "brand-primary" : `brand-${index}`;
    if (!brands.some((brand) => brand.id === candidate)) return candidate;
  }
  return `brand-${Date.now().toString(36)}`;
}

function normalizeBrandName(name: string | undefined, index: number): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return index === 0 ? "Primary" : `Brand ${index + 1}`;
}

function normalizeBrands(brands: ProjectBrandColor[] | undefined, legacyBrandPrimary: string | undefined): ProjectBrandColor[] {
  const source = Array.isArray(brands) && brands.length ? brands : [{ id: "brand-primary", name: "Primary", color: legacyBrandPrimary || DEFAULT_BRAND_COLOR }];
  return source.slice(0, MAX_PROJECT_BRANDS).map((brand, index) => ({
    id: brand.id || (index === 0 ? "brand-primary" : `brand-${index + 1}`),
    name: normalizeBrandName(brand.name, index),
    color: brand.color || legacyBrandPrimary || DEFAULT_BRAND_COLOR,
  }));
}

function withBrands(project: LocalProject, brands: ProjectBrandColor[]): LocalProject {
  const normalizedBrands = normalizeBrands(brands, project.foundations.colors.brandPrimary);

  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      colors: {
        ...project.foundations.colors,
        brandPrimary: normalizedBrands[0].color,
        brands: normalizedBrands,
      },
    },
  };
}

export function createLocalProject(input: CreateProjectInput): LocalProject {
  const createdAt = nowIso();
  const name = input.name.trim() || "Untitled design system";
  const brandColor = input.brandColor || DEFAULT_BRAND_COLOR;

  return {
    id: createProjectId(),
    name,
    modeSetup: input.modeSetup,
    preset: input.preset,
    syncStatus: "not-connected",
    createdAt,
    updatedAt: createdAt,
    foundations: {
      colors: {
        colorPresetId: DEFAULT_COLOR_PRESET_ID,
        neutralChoice: getDefaultNeutralChoice(DEFAULT_COLOR_PRESET_ID),
        brandPrimary: brandColor,
        brands: [{ id: "brand-primary", name: "Primary", color: brandColor }],
        selectedPalettes: getDefaultSelectedPalettes(DEFAULT_COLOR_PRESET_ID),
        baseWhite: DEFAULT_BASE_WHITE,
        baseBlack: DEFAULT_BASE_BLACK,
      },
    },
  };
}

export function getModeCount(project: LocalProject): number {
  return project.modeSetup === "light-dark" ? 2 : 1;
}

export function getProjectBrands(project: LocalProject): ProjectBrandColor[] {
  return normalizeBrands(project.foundations.colors.brands, project.foundations.colors.brandPrimary);
}

export function getProjectSelectedPalettes(project: LocalProject): string[] {
  return normalizeSelectedPalettes(project.foundations.colors.colorPresetId, project.foundations.colors.selectedPalettes);
}

export function updateProjectBrandColor(project: LocalProject, brandColor: string): LocalProject {
  const brands = getProjectBrands(project);
  return withBrands(project, brands.map((brand, index) => (index === 0 ? { ...brand, color: brandColor } : brand)));
}

export function addProjectBrand(project: LocalProject): LocalProject {
  const brands = getProjectBrands(project);
  if (brands.length >= MAX_PROJECT_BRANDS) return project;

  return withBrands(project, [
    ...brands,
    {
      id: createBrandId(brands),
      name: `Brand ${brands.length + 1}`,
      color: brands[0]?.color || DEFAULT_BRAND_COLOR,
    },
  ]);
}

export function updateProjectBrand(project: LocalProject, brandId: string, patch: Partial<Pick<ProjectBrandColor, "name" | "color">>): LocalProject {
  const brands = getProjectBrands(project);
  const nextBrands = brands.map((brand, index) =>
    brand.id === brandId
      ? {
          ...brand,
          name: patch.name !== undefined ? normalizeBrandName(patch.name, index) : brand.name,
          color: patch.color !== undefined ? patch.color : brand.color,
        }
      : brand,
  );

  return withBrands(project, nextBrands);
}

export function removeProjectBrand(project: LocalProject, brandId: string): LocalProject {
  const brands = getProjectBrands(project);
  if (brands.length <= 1) return project;

  const nextBrands = brands.filter((brand) => brand.id !== brandId);
  if (nextBrands.length === brands.length || nextBrands.length === 0) return project;

  return withBrands(project, nextBrands);
}

export function updateProjectColorPreset(project: LocalProject, colorPresetId: string): LocalProject {
  const preset = getSafeColorPreset(colorPresetId);
  const currentNeutral = project.foundations.colors.neutralChoice;
  const neutralChoice = preset.neutralOptions.includes(currentNeutral) ? currentNeutral : getDefaultNeutralChoice(preset.id);
  const currentSelectedPalettes = getProjectSelectedPalettes(project);
  const previousDefaultSelectedPalettes = getDefaultSelectedPalettes(project.foundations.colors.colorPresetId);
  const selectedPalettesWereDefault = !Array.isArray(project.foundations.colors.selectedPalettes) || arraysEqual(currentSelectedPalettes, previousDefaultSelectedPalettes);
  const selectedPalettes = selectedPalettesWereDefault ? [] : normalizeSelectedPalettes(preset.id, project.foundations.colors.selectedPalettes);
  const nextSelectedPalettes = selectedPalettes.length ? selectedPalettes : getDefaultSelectedPalettes(preset.id);

  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      colors: {
        ...project.foundations.colors,
        colorPresetId: preset.id,
        neutralChoice,
        selectedPalettes: nextSelectedPalettes,
      },
    },
  };
}

export function updateProjectSelectedPalette(project: LocalProject, paletteKey: string, selected: boolean): LocalProject {
  const preset = getSafeColorPreset(project.foundations.colors.colorPresetId);
  const normalizedPaletteKey = normalizePaletteKey(paletteKey);
  if (!preset.palettes[normalizedPaletteKey]) return project;

  const selectedPalettes = getProjectSelectedPalettes(project);
  const nextSelectedPalettes = selected
    ? uniqueStrings([...selectedPalettes, normalizedPaletteKey])
    : selectedPalettes.filter((item) => item !== normalizedPaletteKey);

  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      colors: {
        ...project.foundations.colors,
        selectedPalettes: nextSelectedPalettes,
      },
    },
  };
}

export function updateProjectNeutralChoice(project: LocalProject, neutralChoice: string): LocalProject {
  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      colors: {
        ...project.foundations.colors,
        neutralChoice,
      },
    },
  };
}

export function updateProjectBaseColor(project: LocalProject, colorKey: ProjectBaseColorKey, colorValue: string): LocalProject {
  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      colors: {
        ...project.foundations.colors,
        [colorKey]: colorValue,
      },
    },
  };
}
