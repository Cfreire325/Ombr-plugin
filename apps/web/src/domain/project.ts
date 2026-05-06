import {
  CANONICAL_PIXEL_TOKENS,
  CANONICAL_RADIUS_TOKENS,
  CANONICAL_SPACING_TOKENS,
  CANONICAL_TYPOGRAPHY_TOKENS,
  getColorPresetById,
  normalizePaletteKey,
  parseColorInput,
  type TokenEntry,
  type TokenModeValue,
} from "@starter-tokens/ds-core";

export type ProjectModeSetup = "light" | "light-dark";
export type ProjectPreset = "custom" | "starter";
export type ProjectSyncStatus = "not-connected" | "ready-for-handoff";
export type ProjectBaseColorKey = "baseWhite" | "baseBlack";
export type ProjectBrandColor = {
  id: string;
  name: string;
  color: string;
};
export type ProjectColorModeAlias = {
  name: string;
  label: string;
  light: string;
  dark: string;
  scopes: string[];
  description: string;
};
export type ProjectTypographyStyleId =
  | "display-2xl"
  | "display-xl"
  | "display-lg"
  | "display-md"
  | "display-sm"
  | "display-xs"
  | "text-xl"
  | "text-lg"
  | "text-md"
  | "text-sm"
  | "text-xs"
  | "label";
export type ProjectTypographyStyle = {
  id: ProjectTypographyStyleId;
  name: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
};
export type ProjectFoundationScaleStep = {
  id: string;
  name: string;
  value: number;
};

export type ProjectValidationIssue = {
  path: string;
  message: string;
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
  colorModes: {
    aliases: ProjectColorModeAlias[];
  };
  typography: {
    styles: ProjectTypographyStyle[];
  };
  spacing: {
    scale: ProjectFoundationScaleStep[];
  };
  radius: {
    scale: ProjectFoundationScaleStep[];
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
const TYPOGRAPHY_STYLE_ORDER: ProjectTypographyStyleId[] = [
  "display-2xl",
  "display-xl",
  "display-lg",
  "display-md",
  "display-sm",
  "display-xs",
  "text-xl",
  "text-lg",
  "text-md",
  "text-sm",
  "text-xs",
  "label",
];
const LEGACY_TYPOGRAPHY_STYLE_ID_MAP: Record<string, ProjectTypographyStyleId> = {
  display: "display-lg",
  heading: "display-sm",
  body: "text-md",
  label: "text-sm",
  caption: "text-xs",
};
const LEGACY_SPACING_ID_MAP: Record<string, string> = {
  "0": "none",
  "1": "xs",
  "2": "md",
  "3": "lg",
  "4": "xl",
  "6": "3xl",
  "8": "4xl",
  "10": "5xl",
  "12": "6xl",
  "16": "7xl",
};
const LEGACY_RADIUS_ID_MAP: Record<string, string> = {
  none: "none",
  xs: "xxs",
  sm: "xs",
  md: "md",
  lg: "xl",
  xl: "2xl",
  "2xl": "4xl",
  full: "full",
};
const DEFAULT_COLOR_MODE_ALIASES: ProjectColorModeAlias[] = [
  {
    name: "color/text/primary",
    label: "Text primary",
    light: "colors/gray/900",
    dark: "colors/gray/50",
    scopes: ["TEXT_FILL"],
    description: "Primary text color mode.",
  },
  {
    name: "color/background/primary",
    label: "Background primary",
    light: "colors/brand/50",
    dark: "colors/brand/900",
    scopes: ["FRAME_FILL"],
    description: "Primary background color mode.",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getFiniteNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function isAliasValue(value: TokenModeValue): value is { alias: string } {
  return typeof value === "object" && value !== null && "alias" in value && typeof value.alias === "string";
}

function getRawTokenValue(tokens: readonly TokenEntry[], name: string): string | number {
  const token = tokens.find((item) => item.name === name);
  const value = token?.values.light;
  if (value === undefined || isAliasValue(value)) {
    throw new Error(`Missing raw canonical token value: ${name}`);
  }
  return value;
}

function getCanonicalStringToken(name: string): string {
  return String(getRawTokenValue(CANONICAL_TYPOGRAPHY_TOKENS, name)).trim();
}

function getCanonicalNumberToken(name: string): number {
  const value = Number(getRawTokenValue(CANONICAL_TYPOGRAPHY_TOKENS, name));
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric canonical token value: ${name}`);
  }
  return value;
}

function getPixelValue(pixelTokenName: string): number {
  const value = Number(getRawTokenValue(CANONICAL_PIXEL_TOKENS, pixelTokenName));
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid canonical pixel token value: ${pixelTokenName}`);
  }
  return value;
}

function getAliasTarget(token: TokenEntry): string {
  const value = token.values.light;
  if (!value || !isAliasValue(value)) {
    throw new Error(`Missing canonical alias value: ${token.name}`);
  }
  return value.alias;
}

function getTokenId(tokenName: string, prefix: string): string {
  return tokenName.replace(prefix, "");
}

function formatTokenNameSegment(segment: string): string {
  return segment
    .split("-")
    .map((part) => {
      if (/^\d+xl$/i.test(part)) return part.toUpperCase();
      if (["xs", "sm", "md", "lg", "xl", "xxs"].includes(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function formatTypographyStyleName(styleId: ProjectTypographyStyleId): string {
  if (styleId === "label") return "Label";
  const [kind, ...rest] = styleId.split("-");
  return `${formatTokenNameSegment(kind)} ${formatTokenNameSegment(rest.join("-"))}`;
}

function formatScaleStepName(stepId: string): string {
  return formatTokenNameSegment(stepId);
}

const DEFAULT_DISPLAY_FONT_FAMILY = getCanonicalStringToken("font-family/display");
const DEFAULT_BODY_FONT_FAMILY = getCanonicalStringToken("font-family/body");
const DEFAULT_TYPOGRAPHY_STYLES: ProjectTypographyStyle[] = TYPOGRAPHY_STYLE_ORDER.map((id) => ({
  id,
  name: formatTypographyStyleName(id),
  fontFamily: id.startsWith("display-") ? DEFAULT_DISPLAY_FONT_FAMILY : DEFAULT_BODY_FONT_FAMILY,
  fontSize: getCanonicalNumberToken(`font-size/${id}`),
  lineHeight: getCanonicalNumberToken(`line-height/${id}`),
  fontWeight: 400,
}));
const DEFAULT_SPACING_SCALE: ProjectFoundationScaleStep[] = CANONICAL_SPACING_TOKENS.map((token) => {
  const pixelTokenName = getAliasTarget(token).replace(/^primitives\//, "");
  const id = getTokenId(token.name, "spacing/");
  return {
    id,
    name: formatScaleStepName(id),
    value: getPixelValue(pixelTokenName),
  };
});
const DEFAULT_RADIUS_SCALE: ProjectFoundationScaleStep[] = CANONICAL_RADIUS_TOKENS.map((token) => {
  const pixelTokenName = getAliasTarget(token).replace(/^primitives\//, "");
  const id = getTokenId(token.name, "radius/");
  return {
    id,
    name: formatScaleStepName(id),
    value: getPixelValue(pixelTokenName),
  };
});

function isProjectModeSetup(value: unknown): value is ProjectModeSetup {
  return value === "light" || value === "light-dark";
}

function isProjectPreset(value: unknown): value is ProjectPreset {
  return value === "custom" || value === "starter";
}

function isProjectSyncStatus(value: unknown): value is ProjectSyncStatus {
  return value === "not-connected" || value === "ready-for-handoff";
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && Number.isNaN(Date.parse(value)) === false;
}

function isValidColorValue(value: string): boolean {
  try {
    parseColorInput(value);
    return true;
  } catch {
    return false;
  }
}

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

function makeUniqueBrandId(preferredId: string, usedIds: Set<string>, index: number): string {
  const fallback = index === 0 ? "brand-primary" : `brand-${index + 1}`;
  const baseId = preferredId.trim() || fallback;
  let candidate = baseId;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function normalizeBrandName(name: string | undefined, index: number): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return index === 0 ? "Primary" : `Brand ${index + 1}`;
}

function normalizeBrands(brands: unknown, legacyBrandPrimary: unknown): ProjectBrandColor[] {
  const legacyColor = getOptionalString(legacyBrandPrimary)?.trim() || DEFAULT_BRAND_COLOR;
  const source = Array.isArray(brands) && brands.length ? brands : [{ id: "brand-primary", name: "Primary", color: legacyColor }];
  const usedIds = new Set<string>();

  return source.slice(0, MAX_PROJECT_BRANDS).map((brand, index) => {
    const rawBrand = isRecord(brand) ? brand : {};
    const color = getOptionalString(rawBrand.color)?.trim() || legacyColor;

    return {
      id: makeUniqueBrandId(getString(rawBrand.id, ""), usedIds, index),
      name: normalizeBrandName(getOptionalString(rawBrand.name), index),
      color,
    };
  });
}

function cloneTypographyStyles(styles: ProjectTypographyStyle[]): ProjectTypographyStyle[] {
  return styles.map((style) => ({ ...style }));
}

function cloneScale(scale: ProjectFoundationScaleStep[]): ProjectFoundationScaleStep[] {
  return scale.map((step) => ({ ...step }));
}

function cloneColorModeAliases(aliases: ProjectColorModeAlias[]): ProjectColorModeAlias[] {
  return aliases.map((alias) => ({ ...alias, scopes: [...alias.scopes] }));
}

function normalizeColorModeReference(value: unknown, fallback: string): string {
  const reference = getOptionalString(value)?.trim();
  if (!reference) return fallback;
  return reference.replace(/^primitives\//, "");
}

function normalizeColorModeAliases(input: unknown): ProjectColorModeAlias[] {
  const source = Array.isArray(input) ? input : [];

  return DEFAULT_COLOR_MODE_ALIASES.map((defaultAlias) => {
    const rawAlias = source.find((alias) => isRecord(alias) && alias.name === defaultAlias.name);
    if (!isRecord(rawAlias)) return { ...defaultAlias, scopes: [...defaultAlias.scopes] };

    return {
      ...defaultAlias,
      light: normalizeColorModeReference(rawAlias.light, defaultAlias.light),
      dark: normalizeColorModeReference(rawAlias.dark, defaultAlias.dark),
    };
  });
}

function findStyleById(source: Record<string, unknown>[], styleId: string): Record<string, unknown> | undefined {
  return source.find((style) => String(style.id) === styleId);
}

function findMigratedStyle(source: Record<string, unknown>[], canonicalStyleId: ProjectTypographyStyleId): Record<string, unknown> | undefined {
  const exact = findStyleById(source, canonicalStyleId);
  if (exact) return exact;

  const legacyEntry = Object.entries(LEGACY_TYPOGRAPHY_STYLE_ID_MAP).find(([, mappedStyleId]) => mappedStyleId === canonicalStyleId);
  return legacyEntry ? findStyleById(source, legacyEntry[0]) : undefined;
}

function getStyleFontFamily(style: Record<string, unknown> | undefined): string {
  return getString(style?.fontFamily, "").trim();
}

function getTypographyFallbackFamily(source: Record<string, unknown>[], kind: "display" | "body"): string {
  if (kind === "display") {
    return (
      getStyleFontFamily(findStyleById(source, "display")) ||
      getStyleFontFamily(findStyleById(source, "display-lg")) ||
      getStyleFontFamily(findStyleById(source, "display-2xl")) ||
      DEFAULT_DISPLAY_FONT_FAMILY
    );
  }

  return (
    getStyleFontFamily(findStyleById(source, "body")) ||
    getStyleFontFamily(findStyleById(source, "text-md")) ||
    getStyleFontFamily(findStyleById(source, "text-sm")) ||
    DEFAULT_BODY_FONT_FAMILY
  );
}

function normalizeTypographyStyles(input: unknown): ProjectTypographyStyle[] {
  const source = Array.isArray(input) ? input.filter(isRecord) : [];
  const displayFamily = getTypographyFallbackFamily(source, "display");
  const bodyFamily = getTypographyFallbackFamily(source, "body");

  return DEFAULT_TYPOGRAPHY_STYLES.map((defaultStyle) => {
    const rawStyle = findMigratedStyle(source, defaultStyle.id);
    const fallbackFamily = defaultStyle.id.startsWith("display-") ? displayFamily : bodyFamily;
    if (!rawStyle) {
      return {
        ...defaultStyle,
        fontFamily: fallbackFamily,
      };
    }

    const fontFamily = getString(rawStyle.fontFamily, "").trim() || fallbackFamily;
    const fontSize = getFiniteNumber(rawStyle.fontSize);
    const lineHeight = getFiniteNumber(rawStyle.lineHeight);
    const fontWeight = getFiniteNumber(rawStyle.fontWeight);

    return {
      id: defaultStyle.id,
      name: defaultStyle.name,
      fontFamily,
      fontSize: fontSize !== null && fontSize > 0 ? fontSize : defaultStyle.fontSize,
      lineHeight: lineHeight !== null && lineHeight > 0 ? lineHeight : defaultStyle.lineHeight,
      fontWeight: fontWeight !== null && fontWeight >= 1 && fontWeight <= 1000 ? Math.round(fontWeight) : defaultStyle.fontWeight,
    };
  });
}

function normalizeScale(
  input: unknown,
  defaults: ProjectFoundationScaleStep[],
  options: { allowFullKeyword?: boolean; idMigration?: Record<string, string> } = {},
): ProjectFoundationScaleStep[] {
  const source = Array.isArray(input) ? input : [];

  return defaults.map((defaultStep) => {
    const rawStep = source.find((step) => isRecord(step) && String(step.id) === defaultStep.id) ?? source.find((step) => {
      if (!isRecord(step)) return false;
      return options.idMigration?.[String(step.id)] === defaultStep.id;
    });
    if (!isRecord(rawStep)) return { ...defaultStep };

    const value = options.allowFullKeyword && rawStep.value === "full" ? defaultStep.value : getFiniteNumber(rawStep.value);
    return {
      ...defaultStep,
      value: value !== null && value >= 0 ? value : defaultStep.value,
    };
  });
}

function normalizeTypographyFoundation(input: unknown): ProjectFoundations["typography"] {
  const foundation = isRecord(input) ? input : {};
  return {
    styles: normalizeTypographyStyles(foundation.styles),
  };
}

function normalizeSpacingFoundation(input: unknown): ProjectFoundations["spacing"] {
  const foundation = isRecord(input) ? input : {};
  return {
    scale: normalizeScale(foundation.scale, DEFAULT_SPACING_SCALE, { idMigration: LEGACY_SPACING_ID_MAP }),
  };
}

function normalizeRadiusFoundation(input: unknown): ProjectFoundations["radius"] {
  const foundation = isRecord(input) ? input : {};
  return {
    scale: normalizeScale(foundation.scale, DEFAULT_RADIUS_SCALE, { allowFullKeyword: true, idMigration: LEGACY_RADIUS_ID_MAP }),
  };
}

function normalizeColorModesFoundation(input: unknown): ProjectFoundations["colorModes"] {
  const foundation = isRecord(input) ? input : {};
  return {
    aliases: normalizeColorModeAliases(foundation.aliases),
  };
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
      colorModes: {
        aliases: cloneColorModeAliases(DEFAULT_COLOR_MODE_ALIASES),
      },
      typography: {
        styles: cloneTypographyStyles(DEFAULT_TYPOGRAPHY_STYLES),
      },
      spacing: {
        scale: cloneScale(DEFAULT_SPACING_SCALE),
      },
      radius: {
        scale: cloneScale(DEFAULT_RADIUS_SCALE),
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

export function getProjectColorModeAliases(project: LocalProject): ProjectColorModeAlias[] {
  return normalizeColorModesFoundation(project.foundations.colorModes).aliases;
}

export function getProjectTypographyStyles(project: LocalProject): ProjectTypographyStyle[] {
  return normalizeTypographyFoundation(project.foundations.typography).styles;
}

export function getProjectSpacingScale(project: LocalProject): ProjectFoundationScaleStep[] {
  return normalizeSpacingFoundation(project.foundations.spacing).scale;
}

export function getProjectRadiusScale(project: LocalProject): ProjectFoundationScaleStep[] {
  return normalizeRadiusFoundation(project.foundations.radius).scale;
}

export function normalizeLocalProject(input: unknown): LocalProject | null {
  if (!isRecord(input)) return null;

  const now = nowIso();
  const foundations = isRecord(input.foundations) ? input.foundations : {};
  const colors = isRecord(foundations.colors) ? foundations.colors : {};
  const requestedColorPresetId = getString(colors.colorPresetId ?? colors.presetId, DEFAULT_COLOR_PRESET_ID);
  const preset = getSafeColorPreset(requestedColorPresetId);
  const requestedNeutral = normalizePaletteKey(getString(colors.neutralChoice ?? colors.neutralPaletteId, ""));
  const neutralChoice = preset.neutralOptions.includes(requestedNeutral) ? requestedNeutral : getDefaultNeutralChoice(preset.id);
  const rawSelectedPalettes = colors.selectedPalettes ?? colors.selectedPaletteIds;
  const selectedPalettes = Array.isArray(rawSelectedPalettes)
    ? normalizeSelectedPalettes(
        preset.id,
        rawSelectedPalettes.map((paletteKey) => getString(paletteKey, "")),
      )
    : getDefaultSelectedPalettes(preset.id);
  const brands = normalizeBrands(colors.brands, colors.brandPrimary);
  const name = getString(input.name, "").trim() || "Untitled design system";

  return {
    id: getString(input.id, "").trim() || createProjectId(),
    name,
    modeSetup: isProjectModeSetup(input.modeSetup) ? input.modeSetup : "light-dark",
    preset: isProjectPreset(input.preset) ? input.preset : "starter",
    syncStatus: isProjectSyncStatus(input.syncStatus) ? input.syncStatus : "not-connected",
    createdAt: isValidDateString(input.createdAt) ? input.createdAt : now,
    updatedAt: isValidDateString(input.updatedAt) ? input.updatedAt : now,
    foundations: {
      colors: {
        colorPresetId: preset.id,
        neutralChoice,
        brandPrimary: brands[0].color,
        brands,
        selectedPalettes,
        baseWhite: getOptionalString(colors.baseWhite)?.trim() || DEFAULT_BASE_WHITE,
        baseBlack: getOptionalString(colors.baseBlack)?.trim() || DEFAULT_BASE_BLACK,
      },
      colorModes: normalizeColorModesFoundation(foundations.colorModes),
      typography: normalizeTypographyFoundation(foundations.typography),
      spacing: normalizeSpacingFoundation(foundations.spacing),
      radius: normalizeRadiusFoundation(foundations.radius),
    },
  };
}

export function normalizeLocalProjects(input: unknown): LocalProject[] {
  if (!Array.isArray(input)) return [];
  return input.map((project) => normalizeLocalProject(project)).filter((project): project is LocalProject => Boolean(project));
}

export function validateProjectColors(project: LocalProject): ProjectValidationIssue[] {
  const issues: ProjectValidationIssue[] = [];
  const colors = project.foundations.colors;
  const preset = getColorPresetById(colors.colorPresetId);

  if (!preset) {
    issues.push({
      path: "foundations.colors.colorPresetId",
      message: `Unknown color preset: ${colors.colorPresetId}`,
    });
  } else {
    if (!preset.neutralOptions.includes(colors.neutralChoice)) {
      issues.push({
        path: "foundations.colors.neutralChoice",
        message: `Unknown neutral palette for ${preset.id}: ${colors.neutralChoice}`,
      });
    }

    const selectedPalettes = Array.isArray(colors.selectedPalettes) ? colors.selectedPalettes : [];
    for (const paletteKey of selectedPalettes) {
      const normalizedPaletteKey = normalizePaletteKey(paletteKey);
      if (!preset.palettes[normalizedPaletteKey]) {
        issues.push({
          path: "foundations.colors.selectedPalettes",
          message: `Unknown selected palette for ${preset.id}: ${paletteKey}`,
        });
      }
    }
  }

  if (!isValidColorValue(colors.baseWhite)) {
    issues.push({
      path: "foundations.colors.baseWhite",
      message: `Invalid base white color: ${colors.baseWhite}`,
    });
  }

  if (!isValidColorValue(colors.baseBlack)) {
    issues.push({
      path: "foundations.colors.baseBlack",
      message: `Invalid base black color: ${colors.baseBlack}`,
    });
  }

  getProjectBrands(project).forEach((brand, index) => {
    if (!isValidColorValue(brand.color)) {
      issues.push({
        path: `foundations.colors.brands[${index}].color`,
        message: `Invalid brand color for ${brand.name}: ${brand.color}`,
      });
    }
  });

  return issues;
}

export function validateProjectFoundations(project: LocalProject): ProjectValidationIssue[] {
  const issues = [...validateProjectColors(project)];
  const typographyStyles = Array.isArray(project.foundations.typography?.styles) ? project.foundations.typography.styles : [];
  const spacingScale = Array.isArray(project.foundations.spacing?.scale) ? project.foundations.spacing.scale : [];
  const radiusScale = Array.isArray(project.foundations.radius?.scale) ? project.foundations.radius.scale : [];

  typographyStyles.forEach((style, index) => {
    if (!style.fontFamily.trim()) {
      issues.push({
        path: `foundations.typography.styles[${index}].fontFamily`,
        message: `Typography style ${style.id} needs a font family.`,
      });
    }

    if (!Number.isFinite(Number(style.fontSize)) || Number(style.fontSize) <= 0) {
      issues.push({
        path: `foundations.typography.styles[${index}].fontSize`,
        message: `Typography style ${style.id} needs a positive font size.`,
      });
    }

    if (!Number.isFinite(Number(style.lineHeight)) || Number(style.lineHeight) <= 0) {
      issues.push({
        path: `foundations.typography.styles[${index}].lineHeight`,
        message: `Typography style ${style.id} needs a positive line height.`,
      });
    }

    if (!Number.isFinite(Number(style.fontWeight)) || Number(style.fontWeight) < 1 || Number(style.fontWeight) > 1000) {
      issues.push({
        path: `foundations.typography.styles[${index}].fontWeight`,
        message: `Typography style ${style.id} needs a font weight between 1 and 1000.`,
      });
    }
  });

  spacingScale.forEach((step, index) => {
    if (!Number.isFinite(Number(step.value)) || Number(step.value) < 0) {
      issues.push({
        path: `foundations.spacing.scale[${index}].value`,
        message: `Spacing step ${step.id} needs a value greater than or equal to 0.`,
      });
    }
  });

  radiusScale.forEach((step, index) => {
    if (!Number.isFinite(Number(step.value)) || Number(step.value) < 0) {
      issues.push({
        path: `foundations.radius.scale[${index}].value`,
        message: `Radius step ${step.id} needs a value greater than or equal to 0.`,
      });
    }
  });

  return issues;
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
  const preset = getSafeColorPreset(project.foundations.colors.colorPresetId);
  const normalizedNeutralChoice = normalizePaletteKey(neutralChoice);
  if (!preset.neutralOptions.includes(normalizedNeutralChoice)) return project;

  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      colors: {
        ...project.foundations.colors,
        neutralChoice: normalizedNeutralChoice,
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

export function updateProjectColorModeAlias(
  project: LocalProject,
  aliasName: string,
  patch: Partial<Pick<ProjectColorModeAlias, "light" | "dark">>,
): LocalProject {
  let matched = false;
  const aliases = getProjectColorModeAliases(project).map((alias) => {
    if (alias.name !== aliasName) return alias;
    matched = true;
    return {
      ...alias,
      light: patch.light !== undefined ? normalizeColorModeReference(patch.light, alias.light) : alias.light,
      dark: patch.dark !== undefined ? normalizeColorModeReference(patch.dark, alias.dark) : alias.dark,
    };
  });

  if (!matched) return project;

  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      colorModes: {
        aliases,
      },
    },
  };
}

function getEditableTypographyStyles(project: LocalProject): ProjectTypographyStyle[] {
  const rawStyles = Array.isArray(project.foundations.typography?.styles) ? project.foundations.typography.styles : [];
  return getProjectTypographyStyles(project).map((style) => {
    const rawStyle = rawStyles.find((item) => item.id === style.id);
    return rawStyle ? { ...style, ...rawStyle, id: style.id, name: style.name } : style;
  });
}

function getEditableScale(projectScale: ProjectFoundationScaleStep[] | undefined, normalizedScale: ProjectFoundationScaleStep[]): ProjectFoundationScaleStep[] {
  const rawScale = Array.isArray(projectScale) ? projectScale : [];
  return normalizedScale.map((step) => {
    const rawStep = rawScale.find((item) => item.id === step.id);
    return rawStep ? { ...step, ...rawStep, id: step.id, name: step.name } : step;
  });
}

export function updateProjectTypographyStyle(
  project: LocalProject,
  styleId: ProjectTypographyStyleId,
  patch: Partial<Pick<ProjectTypographyStyle, "fontFamily" | "fontSize" | "lineHeight" | "fontWeight">>,
): LocalProject {
  let matched = false;
  const styles = getEditableTypographyStyles(project).map((style) => {
    if (style.id !== styleId) return style;
    matched = true;
    return {
      ...style,
      ...patch,
    };
  });

  if (!matched) return project;

  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      typography: {
        styles,
      },
    },
  };
}

export function updateProjectSpacingStep(project: LocalProject, stepId: string, value: number): LocalProject {
  let matched = false;
  const scale = getEditableScale(project.foundations.spacing?.scale, getProjectSpacingScale(project)).map((step) => {
    if (step.id !== stepId) return step;
    matched = true;
    return {
      ...step,
      value,
    };
  });

  if (!matched) return project;

  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      spacing: {
        scale,
      },
    },
  };
}

export function updateProjectRadiusStep(project: LocalProject, stepId: string, value: number): LocalProject {
  let matched = false;
  const scale = getEditableScale(project.foundations.radius?.scale, getProjectRadiusScale(project)).map((step) => {
    if (step.id !== stepId) return step;
    matched = true;
    return {
      ...step,
      value,
    };
  });

  if (!matched) return project;

  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      radius: {
        scale,
      },
    },
  };
}
