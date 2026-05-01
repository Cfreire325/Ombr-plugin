import { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } from "./presets/color-utils";
import { BUILTIN_PRESETS, getPresetById, getPresetSummaries } from "./presets/builtin";
import { TEXT_STYLE_TEMPLATES } from "./presets/text-styles.generated";
import { TYPOGRAPHY_REFERENCE } from "./presets/typography.generated";
import type { BrandColorInput, GenerationOptions, GenerationReport, NamingPattern, PresetDefinition, TokenLevel, UiMode } from "./presets/types";

const UI_WIDTH = 532;
const UI_HEIGHT = 700;

figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT, themeColors: true });

const COLLECTIONS = {
  primitives: "primitives",
  colorModes: "1. color-modes",
  spacing: "2. spacing",
  radius: "3. radius",
  typography: "6. Typography",
} as const;

type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
type VariableType = "COLOR" | "FLOAT" | "STRING";
type RawTokenValue = string | number;

type TokenModeValue = { kind: "raw"; value: RawTokenValue } | { kind: "alias"; ref: string; collection: CollectionName };

type TokenDefinition = {
  collection: CollectionName;
  name: string;
  type: VariableType;
  scopes: VariableScope[];
  value: TokenModeValue;
};

type PendingAlias = {
  variable: Variable;
  modeId: string;
  ref: string;
  sourceCollectionId: string;
  targetCollection: CollectionName;
};

type AliasIndex = {
  global: Map<string, Variable>;
  byCollectionId: Map<string, Map<string, Variable>>;
  byCollectionName: Map<string, Map<string, Variable>>;
  collectionNameById: Map<string, string>;
};

type NormalizedBrand = {
  tokenName: string;
  opacityName: string;
  baseColor: string;
  scale: Record<number, string>;
};

const DEFAULT_MODE = "default";
const DEFAULT_BASE_WHITE = "#ffffff";
const DEFAULT_BASE_BLACK = "#000000";
const DEFAULT_BRAND = "#82BE5C";
const DEFAULT_DISPLAY_FAMILY = TYPOGRAPHY_REFERENCE.fontFamily.display || "Roboto";
const DEFAULT_BODY_FAMILY = TYPOGRAPHY_REFERENCE.fontFamily.body || "Inter";

const PRESET_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const OPACITY_STEPS = [4, 6, 8, 9, 10, 15, 20, 28, 30, 36, 40, 48, 50, 60, 70, 75, 80, 90, 100] as const;
const PIXEL_VALUES = [
  0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 44, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208,
  224, 240, 256,
] as const;

const SPACING_ALIAS_MAP: Array<[string, string]> = [
  ["spacing-none", "0"],
  ["spacing-xxs", "2"],
  ["spacing-xs", "4"],
  ["spacing-sm", "6"],
  ["spacing-md", "8"],
  ["spacing-lg", "12"],
  ["spacing-xl", "16"],
  ["spacing-2xl", "20"],
  ["spacing-3xl", "24"],
  ["spacing-4xl", "32"],
  ["spacing-5xl", "40"],
  ["spacing-6xl", "48"],
  ["spacing-7xl", "64"],
  ["spacing-8xl", "80"],
  ["spacing-9xl", "96"],
  ["spacing-10xl", "128"],
  ["spacing-11xl", "160"],
];

const RADIUS_ALIAS_MAP: Array<[string, string]> = [
  ["radius-none", "0"],
  ["radius-xxs", "2"],
  ["radius-xs", "4"],
  ["radius-sm", "6"],
  ["radius-md", "8"],
  ["radius-lg", "10"],
  ["radius-xl", "12"],
  ["radius-2xl", "16"],
  ["radius-3xl", "20"],
  ["radius-4xl", "24"],
  ["radius-full", "full"],
];

const DEFAULT_FONT_SIZES: Record<string, number> = { ...TYPOGRAPHY_REFERENCE.fontSize };
const DEFAULT_LINE_HEIGHTS: Record<string, number> = { ...TYPOGRAPHY_REFERENCE.lineHeight };
const DEFAULT_FONT_WEIGHT_STYLES: Record<string, string> = { ...TYPOGRAPHY_REFERENCE.fontWeight };

const FONT_SIZE_ORDER = Object.keys(DEFAULT_FONT_SIZES);

const COLLECTION_LEGACY_NAMES: Record<CollectionName, string[]> = {
  [COLLECTIONS.primitives]: ["primitives", "_primitives", " _primitives"],
  [COLLECTIONS.colorModes]: ["1. color modes", "1. color-modes", "semantic", "color-modes"],
  [COLLECTIONS.spacing]: ["2. spacing", "spacing"],
  [COLLECTIONS.radius]: ["3. radius", "radius"],
  [COLLECTIONS.typography]: ["6. typography", "6. Typography", "typography", "6.typography", "6 Typography"],
};

function raw(value: RawTokenValue): TokenModeValue {
  return { kind: "raw", value };
}

function alias(ref: string, collection: CollectionName): TokenModeValue {
  return { kind: "alias", ref, collection };
}

function normalizeLookup(input: string): string {
  return String(input)
    .trim()
    .replace(/^\{/, "")
    .replace(/\}$/, "")
    .toLowerCase()
    .replace(/\./g, "/")
    .replace(/\s+/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\//, "")
    .replace(/\/$/, "");
}

function aliasCandidates(reference: string): string[] {
  const trimmed = reference.trim().replace(/^\{/, "").replace(/\}$/, "").trim();
  return [trimmed, trimmed.replace(/\./g, "/"), trimmed.replace(/\//g, ".")];
}

function normalizeCollectionLookup(name: string): string {
  return String(name).trim().toLowerCase().replace(/\s+/g, " ");
}

function sanitizeScopes(scopes: VariableScope[]): VariableScope[] {
  const unique = Array.from(new Set(scopes));
  if (unique.includes("ALL_SCOPES")) return ["ALL_SCOPES"];
  if (!unique.includes("ALL_FILLS")) return unique;
  return unique.filter((scope) => scope === "ALL_FILLS" || !["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL"].includes(scope));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function buildModeMap(collection: VariableCollection): Record<string, string> {
  const map: Record<string, string> = {};
  for (const mode of collection.modes) {
    map[mode.name] = mode.modeId;
  }
  return map;
}

function addAliasEntry(index: AliasIndex, variable: Variable): void {
  const normalized = [normalizeLookup(variable.name), normalizeLookup(variable.name.replace(/\//g, "."))].filter(Boolean);

  if (!index.byCollectionId.has(variable.variableCollectionId)) {
    index.byCollectionId.set(variable.variableCollectionId, new Map());
  }
  const byCollectionId = index.byCollectionId.get(variable.variableCollectionId)!;

  const collectionName = index.collectionNameById.get(variable.variableCollectionId);
  if (collectionName && !index.byCollectionName.has(collectionName)) {
    index.byCollectionName.set(collectionName, new Map());
  }
  const byCollectionName = collectionName ? index.byCollectionName.get(collectionName) : undefined;

  for (const key of normalized) {
    if (!index.global.has(key)) index.global.set(key, variable);
    if (!byCollectionId.has(key)) byCollectionId.set(key, variable);
    if (byCollectionName && !byCollectionName.has(key)) byCollectionName.set(key, variable);
  }
}

function resolveAlias(index: AliasIndex, reference: string, fallbackCollectionId: string, targetCollection: CollectionName): Variable | null {
  const fallbackCollection = index.byCollectionId.get(fallbackCollectionId);

  for (const candidate of aliasCandidates(reference)) {
    const lookup = normalizeLookup(candidate);
    if (!lookup) continue;

    const targetMap = index.byCollectionName.get(targetCollection);
    if (targetMap?.has(lookup)) return targetMap.get(lookup)!;

    if (fallbackCollection?.has(lookup)) return fallbackCollection.get(lookup)!;
    if (index.global.has(lookup)) return index.global.get(lookup)!;
  }

  return null;
}

function makeAlias(variable: Variable): VariableAlias {
  if (figma.variables.createVariableAlias) {
    return figma.variables.createVariableAlias(variable);
  }
  return { type: "VARIABLE_ALIAS", id: variable.id };
}

function getCollectionReport(report: GenerationReport, name: string) {
  let found = report.collections.find((entry) => entry.name === name);
  if (!found) {
    found = { name, created: 0, updated: 0, collisionsReplaced: 0 };
    report.collections.push(found);
  }
  return found;
}

function upsertVariable(
  collection: VariableCollection,
  variableName: string,
  type: VariableType,
  variableIndex: Map<string, Variable>,
  report: GenerationReport,
): Variable | null {
  const key = `${collection.id}::${variableName}`;
  const existing = variableIndex.get(key);

  if (existing) {
    if (existing.resolvedType !== type) {
      report.warnings.push(
        `Type conflict on ${collection.name}/${variableName}: existing=${existing.resolvedType}, expected=${type}`,
      );
      return null;
    }

    report.updated += 1;
    report.collisionsReplaced += 1;
    const collectionReport = getCollectionReport(report, collection.name);
    collectionReport.updated += 1;
    collectionReport.collisionsReplaced += 1;
    return existing;
  }

  const created = figma.variables.createVariable(variableName, collection.id, type);
  variableIndex.set(key, created);

  report.created += 1;
  const collectionReport = getCollectionReport(report, collection.name);
  collectionReport.created += 1;
  return created;
}

function setRawValue(variable: Variable, modeId: string, type: VariableType, value: RawTokenValue): void {
  if (type === "COLOR") {
    if (typeof value !== "string") throw new Error(`Invalid color value on ${variable.name}`);
    variable.setValueForMode(modeId, parseColorInput(value));
    return;
  }

  if (type === "FLOAT") {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) throw new Error(`Invalid float value on ${variable.name}: ${value}`);
    variable.setValueForMode(modeId, numeric);
    return;
  }

  variable.setValueForMode(modeId, String(value));
}

function createToken(
  collection: CollectionName,
  name: string,
  type: VariableType,
  scopes: VariableScope[],
  value: TokenModeValue,
): TokenDefinition {
  return {
    collection,
    name,
    type,
    scopes,
    value,
  };
}

function semanticScopes(name: string): VariableScope[] {
  if (name.startsWith("text/")) return ["TEXT_FILL"];
  if (name.startsWith("bg/")) return ["FRAME_FILL", "SHAPE_FILL"];
  if (name.startsWith("border/")) return ["STROKE_COLOR"];
  if (name.startsWith("icon/")) return ["STROKE_COLOR", "SHAPE_FILL"];
  if (name.startsWith("alpha/")) return ["ALL_FILLS"];
  return ["ALL_SCOPES"];
}

function closestStep(steps: number[], target: number): number {
  if (!steps.length) return target;
  let best = steps[0];
  let delta = Math.abs(best - target);
  for (const step of steps) {
    const current = Math.abs(step - target);
    if (current < delta) {
      best = step;
      delta = current;
    }
  }
  return best;
}

function parsePresetNumericStep(step: string): number | null {
  if (!/^-?\d+(?:\.\d+)?$/.test(step)) return null;
  const numeric = Number(step);
  return Number.isFinite(numeric) ? numeric : null;
}

function sortPresetSteps(steps: string[]): string[] {
  return [...new Set(steps)].sort((a, b) => {
    const na = parsePresetNumericStep(a);
    const nb = parsePresetNumericStep(b);
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return a.localeCompare(b);
  });
}

function fallbackPresetSteps(): string[] {
  return PRESET_STEPS.map((step) => String(step));
}

function getPaletteSteps(preset: PresetDefinition, paletteName: string): string[] {
  const palette = preset.palettes[paletteName];
  if (!palette) return [];
  return sortPresetSteps(Object.keys(palette));
}

function resolveClosestPaletteStep(preset: PresetDefinition, paletteName: string, requestedStep: string): string {
  const palette = preset.palettes[paletteName];
  if (!palette) return requestedStep;
  if (palette[requestedStep]) return requestedStep;

  const steps = getPaletteSteps(preset, paletteName);
  if (!steps.length) return requestedStep;

  const exactCaseInsensitive = steps.find((step) => step.toLowerCase() === requestedStep.toLowerCase());
  if (exactCaseInsensitive) return exactCaseInsensitive;

  const requestedNumeric = parsePresetNumericStep(requestedStep);
  if (requestedNumeric !== null) {
    const numericPairs = steps
      .map((step) => ({ step, numeric: parsePresetNumericStep(step) }))
      .filter((entry): entry is { step: string; numeric: number } => entry.numeric !== null);
    if (numericPairs.length) {
      let best = numericPairs[0];
      let delta = Math.abs(best.numeric - requestedNumeric);
      for (const pair of numericPairs) {
        const currentDelta = Math.abs(pair.numeric - requestedNumeric);
        if (currentDelta < delta) {
          best = pair;
          delta = currentDelta;
        }
      }
      return best.step;
    }
  }

  return steps.includes("500") ? "500" : steps[0];
}

function basePatternSteps(pattern: NamingPattern): number[] {
  if (pattern === "hundreds") {
    return [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  }
  return [...PRESET_STEPS];
}

function pickSubset(baseSteps: number[], count: number): number[] {
  if (count >= baseSteps.length) return [...baseSteps];
  if (count <= 1) return [baseSteps[Math.floor(baseSteps.length / 2)]];

  const points = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    points.add(Math.round((i * (baseSteps.length - 1)) / (count - 1)));
  }

  const base500Index = baseSteps.indexOf(500);
  if (base500Index >= 0 && !points.has(base500Index) && count >= 3) {
    const sorted = Array.from(points);
    let replace = sorted[0];
    let distance = Math.abs(replace - base500Index);
    for (const point of sorted) {
      if (point === 0 || point === baseSteps.length - 1) continue;
      const delta = Math.abs(point - base500Index);
      if (delta < distance) {
        replace = point;
        distance = delta;
      }
    }
    points.delete(replace);
    points.add(base500Index);
  }

  return Array.from(points)
    .sort((a, b) => a - b)
    .map((index) => baseSteps[index]);
}

function nextShadeStep(previous: number): number {
  return previous === 950 ? 1000 : previous + 100;
}

function extendSteps(baseSteps: number[], count: number): number[] {
  const unique = Array.from(new Set(baseSteps)).sort((a, b) => a - b);
  while (unique.length < count) {
    unique.push(nextShadeStep(unique[unique.length - 1]));
  }
  return unique.slice(0, count);
}

function deriveShadeSteps(pattern: NamingPattern, shadeCount: number): number[] {
  const base = basePatternSteps(pattern);
  const requested = clampNumber(shadeCount, 6, 14, 11);
  if (requested <= base.length) return pickSubset(base, requested);
  return extendSteps(base, requested);
}

function resolveBaseStep(shadeSteps: number[]): number {
  if (shadeSteps.includes(500)) return 500;
  const midpoint = (shadeSteps[0] + shadeSteps[shadeSteps.length - 1]) / 2;
  return closestStep(shadeSteps, midpoint);
}

type ColorModesIntent = "error" | "success" | "warning" | "info" | "offer";
type ColorModesFamily = "bg" | "text" | "icon" | "border";
type ColorModesTemplate = {
  bg: Record<string, string>;
  text: Record<string, string>;
  icon: Record<string, string>;
  border: Record<string, string>;
};

const COLOR_MODE_FAMILIES: ColorModesFamily[] = ["bg", "text", "icon", "border"];

const KIGEN_ALPHA_OPACITY_STEPS: Record<string, number> = {
  "00": 100,
  "50": 6,
  "100": 9,
  "200": 20,
  "300": 28,
  "400": 36,
  "500": 48,
  "600": 60,
  "700": 70,
  "800": 75,
  "900": 80,
  "1000": 100,
};

const KIGEN_COLOR_MODES_TEMPLATE: ColorModesTemplate = {
  bg: {
    primary: "{b&w/white}",
    secondary: "{slate/50}",
    tertiary: "{slate/100}",
    quartiary: "{slate/300}",
    "primary-hover": "{slate/50}",
    "secondary-hover": "{slate/100}",
    "tertiary-hover": "{slate/200}",
    "quartiary-hover": "{slate/400}",
    "black-solid": "{slate/900}",
    "black-solid-hover": "{slate/800}",
    disabled: "{slate/300}",
    "disabled-alt": "{slate/100}",
    "accent-primary": "{purple/50}",
    "accent-primary-hover": "{purple/100}",
    "accent-solid": "{purple/500}",
    "accent-solid-hover": "{purple/600}",
    "error-primary": "{red/50}",
    "error-primary-hover": "{red/100}",
    "error-secondary": "{red/600}",
    "error-secondary-hover": "{red/700}",
    "success-primary": "{green/100}",
    "success-primary-hover": "{green/200}",
    "success-secondary": "{green/600}",
    "success-secondary-hover": "{green/700}",
    "warning-primary": "{orange/100}",
    "warning-primary-hover": "{orange/200}",
    "warning-secondary": "{orange/600}",
    "warning-secondary-hover": "{orange/700}",
    "info-primary": "{blue/50}",
    "info-primary-hover": "{blue/100}",
    "info-secondary": "{blue/600}",
    "info-secondary-hover": "{blue/700}",
    "offer-primary": "{green/100}",
    "offer-primary-hover": "{green/200}",
    "offer-secondary": "{green/600}",
    "offer-secondary-hover": "{green/700}",
    "overlay-alpha-primary": "{alpha/light/200}",
    "overlay-alpha-secondary": "{alpha/light/500}",
    "overlay-alpha-white-primary": "{alpha/dark/300}",
    "overlay-alpha-white-secondary": "{alpha/dark/500}",
  },
  text: {
    primary: "{slate/900}",
    secondary: "{slate/600}",
    tertiary: "{slate/500}",
    "primary-hover": "{slate/800}",
    "secondary-hover": "{slate/700}",
    "tertiary-hover": "{slate/600}",
    disabled: "{slate/400}",
    "disabled-alt": "{slate/300}",
    placeholder: "{slate/400}",
    white: "{b&w/white}",
    "on-dark-color": "{b&w/white}",
    "accent-primary": "{purple/500}",
    "accent-secondary": "{purple/300}",
    "accent-primary-hover": "{purple/600}",
    "accent-secondary-hover": "{purple/400}",
    "error-primary": "{red/600}",
    "error-secondary": "{red/400}",
    "error-primary-hover": "{red/700}",
    "error-secondary-hover": "{red/500}",
    "success-primary": "{green/600}",
    "success-secondary": "{green/400}",
    "success-primary-hover": "{green/700}",
    "success-secondary-hover": "{green/700}",
    "warning-primary": "{orange/600}",
    "warning-secondary": "{orange/400}",
    "warning-primary-hover": "{orange/700}",
    "warning-secondary-hover": "{orange/500}",
    "info-primary": "{blue/600}",
    "info-secondary": "{blue/400}",
    "info-primary-hover": "{blue/700}",
    "info-secondary-hover": "{blue/500}",
    "offer-primary": "{green/600}",
    "offer-secondary": "{green/500}",
    "offer-primary-hover": "{green/700}",
    "offer-secondary-hover": "{green/600}",
  },
  icon: {
    primary: "{slate/900}",
    secondary: "{slate/600}",
    tertiary: "{slate/400}",
    "primary-hover": "{slate/800}",
    "secondary-hover": "{slate/700}",
    "tertiary-hover": "{slate/600}",
    disabled: "{slate/400}",
    "disabled-alt": "{slate/300}",
    placeholder: "{slate/400}",
    white: "{b&w/white}",
    "on-dark-color": "{b&w/white}",
    "accent-primary": "{purple/500}",
    "accent-secondary": "{purple/300}",
    "accent-primary-hover": "{purple/600}",
    "accent-secondary-hover": "{purple/400}",
    "error-primary": "{red/600}",
    "error-secondary": "{red/300}",
    "error-primary-hover": "{red/600}",
    "error-secondary-hover": "{red/500}",
    "success-primary": "{green/600}",
    "success-secondary": "{green/200}",
    "success-primary-hover": "{green/700}",
    "success-secondary-hover": "{green/300}",
    "warning-primary": "{orange/600}",
    "warning-secondary": "{orange/400}",
    "warning-primary-hover": "{orange/700}",
    "warning-secondary-hover": "{orange/500}",
    "info-primary": "{blue/600}",
    "info-secondary": "{blue/400}",
    "info-primary-hover": "{blue/700}",
    "info-secondary-hover": "{blue/500}",
    "offer-primary": "{green/600}",
    "offer-secondary": "{green/400}",
    "offer-primary-hover": "{green/700}",
    "offer-secondary-hover": "{green/500}",
  },
  border: {
    primary: "{slate/300}",
    secondary: "{slate/200}",
    tertiary: "{slate/100}",
    "primary-solid": "{slate/900}",
    disabled: "{slate/300}",
    "disabled-alt": "{slate/200}",
    "accent-primary": "{purple/500}",
    "accent-secondary": "{purple/100}",
    "error-primary": "{red/500}",
    "error-secondary": "{red/300}",
    "success-primary": "{green/500}",
    "success-secondary": "{green/300}",
    "warning-primary": "{orange/500}",
    "warning-secondary": "{orange/300}",
    "info-primary": "{blue/500}",
    "info-secondary": "{blue/300}",
    "offer-primary": "{green/500}",
    "offer-secondary": "{green/300}",
  },
};

const DARK_NEUTRAL_STEP_MAP: Record<number, number> = {
  50: 900,
  100: 800,
  200: 700,
  300: 600,
  400: 500,
  500: 400,
  600: 300,
  700: 200,
  800: 100,
  900: 50,
  950: 50,
};

const INTENT_PALETTE_CANDIDATES: Record<ColorModesIntent, string[]> = {
  error: ["error", "red", "rose", "danger"],
  success: ["success", "emerald", "green", "moss"],
  warning: ["warning", "amber", "orange", "yellow"],
  info: ["info", "sky", "blue", "azure", "cyan"],
  offer: ["offer", "fuchsia", "pink", "purple", "magenta"],
};

const PALETTE_SYNONYMS: Record<string, string[]> = {
  blue: ["sky", "indigo"],
  green: ["emerald", "teal", "lime"],
  orange: ["amber", "yellow"],
  purple: ["violet", "fuchsia", "pink"],
};

const LEGACY_COLOR_MODE_ALIASES: Array<[string, string]> = [
  ["text/brand", "text/accent-primary"],
  ["text/on-brand", "text/white"],
  ["text/muted", "text/tertiary"],
  ["text/inverse", "text/white"],
  ["bg/canvas", "bg/primary"],
  ["bg/surface", "bg/secondary"],
  ["bg/muted", "bg/tertiary"],
  ["bg/overlay", "bg/overlay-alpha-secondary"],
  ["bg/brand", "bg/accent-solid"],
  ["border/default", "border/primary"],
  ["border/muted", "border/secondary"],
  ["border/strong", "border/primary-solid"],
  ["border/brand", "border/accent-primary"],
  ["border/focus", "border/accent-primary"],
  ["icon/brand", "icon/accent-primary"],
  ["icon/on-brand", "icon/white"],
  ["text/danger", "text/error-primary"],
  ["bg/danger", "bg/error-secondary"],
  ["border/danger", "border/error-primary"],
  ["icon/danger", "icon/error-primary"],
];

function resolvePaletteFromCandidates(preset: PresetDefinition, candidates: string[], fallback: string): string {
  for (const candidate of candidates) {
    if (preset.palettes[candidate]) return candidate;
  }
  return preset.palettes[fallback] ? fallback : Object.keys(preset.palettes)[0] || fallback;
}

function resolvePaletteWithSynonyms(preset: PresetDefinition, paletteName: string, fallback: string): string {
  if (preset.palettes[paletteName]) return paletteName;
  const lower = paletteName.toLowerCase();
  const candidates = [lower, ...(PALETTE_SYNONYMS[lower] || [])];
  return resolvePaletteFromCandidates(preset, candidates, fallback);
}

function resolveIntentPalette(preset: PresetDefinition, intent: ColorModesIntent): string {
  return resolvePaletteFromCandidates(preset, INTENT_PALETTE_CANDIDATES[intent], INTENT_PALETTE_CANDIDATES[intent][0]);
}

function parseKigenReference(reference: string): string[] {
  const cleaned = reference.trim().replace(/^\{/, "").replace(/\}$/, "").trim();
  if (!cleaned) return [];
  return cleaned.split("/").map((segment) => segment.trim().toLowerCase()).filter(Boolean);
}

function extractIntentFromTokenName(tokenName: string): ColorModesIntent | null {
  const match = tokenName.match(/\/(error|success|warning|info|offer)-/);
  return match ? (match[1] as ColorModesIntent) : null;
}

function isAccentToken(tokenName: string): boolean {
  return /\/accent-/.test(tokenName);
}

function remapStepForBrand(stepInput: string, shadeSteps: number[]): string {
  const step = Number(stepInput);
  if (!Number.isFinite(step)) return shadeSteps.includes(500) ? "500" : String(resolveBaseStep(shadeSteps));
  return String(closestStep(shadeSteps, step));
}

function resolveOpacityStepFromAlphaKey(alphaKey: string): number {
  const mapped = KIGEN_ALPHA_OPACITY_STEPS[alphaKey];
  if (!Number.isFinite(mapped)) return 50;
  if (OPACITY_STEPS.includes(mapped as (typeof OPACITY_STEPS)[number])) return mapped;
  return closestStep([...OPACITY_STEPS], mapped);
}

function remapNeutralStepForDark(step: number): string {
  if (DARK_NEUTRAL_STEP_MAP[step] !== undefined) {
    return String(DARK_NEUTRAL_STEP_MAP[step]);
  }
  if (step <= 100) return "900";
  if (step >= 900) return "50";
  if (step === 500) return "400";
  return String(step < 500 ? 900 - step : 500 - Math.round((step - 500) * 0.8));
}

function resolveDarkNeutralStep(preset: PresetDefinition, neutralPalette: string, sourceStep: string): string {
  const paletteSteps = getPaletteSteps(preset, neutralPalette);
  if (!paletteSteps.length) return sourceStep;

  const numericEntries = paletteSteps
    .map((step) => ({ step, numeric: parsePresetNumericStep(step) }))
    .filter((entry): entry is { step: string; numeric: number } => entry.numeric !== null);

  if (!numericEntries.length) {
    return paletteSteps[0];
  }

  const sourceNumeric = parsePresetNumericStep(sourceStep);
  if (sourceNumeric === null) {
    return paletteSteps[paletteSteps.length - 1] || paletteSteps[0];
  }

  const exact = numericEntries.find((entry) => entry.numeric === sourceNumeric);
  const baseStep = exact?.step ?? resolveClosestPaletteStep(preset, neutralPalette, sourceStep);
  const baseIndex = numericEntries.findIndex((entry) => entry.step === baseStep);
  if (baseIndex < 0) return baseStep;

  const mirrored = numericEntries[numericEntries.length - 1 - baseIndex];
  return mirrored.step;
}

function resolvePrimitivePaletteStep(
  preset: PresetDefinition,
  paletteName: string,
  requestedStep: string,
  shadeSteps: number[],
): string {
  if (paletteName === "brand") return remapStepForBrand(requestedStep, shadeSteps);
  return resolveClosestPaletteStep(preset, paletteName, requestedStep);
}

function normalizePresetSteps(preset: PresetDefinition): string[] {
  if (preset.steps.length) return sortPresetSteps(preset.steps.map((step) => String(step)));
  return fallbackPresetSteps();
}

function closestPresetStep(steps: string[], target: number): string {
  const numeric = steps
    .map((step) => ({ step, numeric: parsePresetNumericStep(step) }))
    .filter((entry): entry is { step: string; numeric: number } => entry.numeric !== null);
  if (!numeric.length) return steps[0] || "950";
  return String(closestStep(numeric.map((entry) => entry.numeric), target));
}

function ensureNeutralStepExists(preset: PresetDefinition, neutralPalette: string, step: string): string {
  return resolveClosestPaletteStep(preset, neutralPalette, step);
}

function remapNeutralStepForDarkFallback(preset: PresetDefinition, neutralPalette: string, step: string): string {
  const stepNumeric = parsePresetNumericStep(step);
  if (stepNumeric === null) return resolveDarkNeutralStep(preset, neutralPalette, step);
  const darkTarget = remapNeutralStepForDark(stepNumeric);
  return ensureNeutralStepExists(preset, neutralPalette, darkTarget);
}

function applyDarkModeTransformForReference(
  tokenName: string,
  pluginReference: string,
  neutralPalette: string,
  preset: PresetDefinition,
): string {
  if (tokenName.startsWith("alpha/")) return pluginReference;
  if (tokenName.includes("/white") || tokenName.includes("on-dark-color")) return pluginReference;

  if (pluginReference === "colors/base/white" && tokenName.startsWith("bg/")) {
    const darkest = resolveDarkNeutralStep(preset, neutralPalette, "50");
    return `colors/${neutralPalette}/${darkest}`;
  }
  if (pluginReference === "colors/base/black" && (tokenName.startsWith("text/") || tokenName.startsWith("icon/"))) {
    return "colors/base/white";
  }

  const neutralMatch = pluginReference.match(/^colors\/([^/]+)\/([^/]+)$/);
  if (!neutralMatch) return pluginReference;
  if (neutralMatch[1] !== neutralPalette) return pluginReference;

  const darkStep = remapNeutralStepForDarkFallback(preset, neutralPalette, neutralMatch[2]);
  return `colors/${neutralPalette}/${darkStep}`;
}

function convertKigenReferenceToPluginRef(
  tokenName: string,
  kigenReference: string,
  uiMode: UiMode,
  preset: PresetDefinition,
  neutralPalette: string,
  shadeSteps: number[],
  useBrandForAccent: boolean,
): string {
  const segments = parseKigenReference(kigenReference);
  if (!segments.length) return "colors/base/black";

  if (segments[0] === "alpha") {
    const alphaMode = segments[1] === "dark" ? "dark" : "light";
    const alphaKey = segments[2] || "500";
    const opacityStep = resolveOpacityStepFromAlphaKey(alphaKey);
    const tone = alphaMode === "dark" ? "white" : "black";
    return `opacity/${tone}/${opacityStep}`;
  }

  if (segments[0] === "b&w") {
    const tone = segments[1] === "black" ? "black" : "white";
    const resolved = `colors/base/${tone}`;
    return uiMode === "dark" ? applyDarkModeTransformForReference(tokenName, resolved, neutralPalette, preset) : resolved;
  }

  const sourcePalette = segments[0];
  const sourceStep = segments[1] || "500";

  let palette = sourcePalette;
  const tokenIntent = extractIntentFromTokenName(tokenName);
  if (isAccentToken(tokenName)) {
    palette = useBrandForAccent ? "brand" : resolvePaletteWithSynonyms(preset, "purple", "purple");
  } else if (tokenIntent) {
    palette = resolveIntentPalette(preset, tokenIntent);
  } else if (["slate", "gray", "zinc", "neutral", "stone"].includes(sourcePalette)) {
    palette = neutralPalette;
  } else {
    palette = resolvePaletteWithSynonyms(preset, sourcePalette, sourcePalette);
  }

  const step = resolvePrimitivePaletteStep(preset, palette, sourceStep, shadeSteps);
  const resolved = `colors/${palette}/${step}`;
  if (uiMode !== "dark") return resolved;
  return applyDarkModeTransformForReference(tokenName, resolved, neutralPalette, preset);
}

function createEmptyColorModes(): ColorModesTemplate {
  return {
    bg: {},
    text: {},
    icon: {},
    border: {},
  };
}

function generateColorModesTokens(
  uiMode: UiMode,
  preset: PresetDefinition,
  neutralChoice: string,
  shadeSteps: number[],
  useBrandForAccent: boolean,
): ColorModesTemplate {
  const neutralPalette = preset.palettes[neutralChoice] ? neutralChoice : preset.defaultNeutral;
  const generated = createEmptyColorModes();

  for (const family of COLOR_MODE_FAMILIES) {
    const templateEntries = KIGEN_COLOR_MODES_TEMPLATE[family];
    for (const [key, kigenRef] of Object.entries(templateEntries)) {
      const tokenName = `${family}/${key}`;
      generated[family][key] = convertKigenReferenceToPluginRef(
        tokenName,
        kigenRef,
        uiMode,
        preset,
        neutralPalette,
        shadeSteps,
        useBrandForAccent,
      );
    }
  }

  return generated;
}

function compareColorModesStructure(generated: ColorModesTemplate): string[] {
  const missing: string[] = [];

  for (const family of COLOR_MODE_FAMILIES) {
    const templateEntries = KIGEN_COLOR_MODES_TEMPLATE[family];
    for (const key of Object.keys(templateEntries)) {
      if (!generated[family][key]) {
        missing.push(`${family}/${key}`);
      }
    }
  }

  return missing;
}

function buildColorModeTokens(
  uiMode: UiMode,
  preset: PresetDefinition,
  neutralChoice: string,
  shadeSteps: number[],
  useBrandForAccent: boolean,
): { tokens: TokenDefinition[]; missing: string[] } {
  const generated = generateColorModesTokens(uiMode, preset, neutralChoice, shadeSteps, useBrandForAccent);
  const missing = compareColorModesStructure(generated);
  const tokens: TokenDefinition[] = [];

  for (const family of COLOR_MODE_FAMILIES) {
    const generatedEntries = generated[family];
    for (const [key, reference] of Object.entries(generatedEntries)) {
      const tokenName = `${family}/${key}`;
      tokens.push(createToken(COLLECTIONS.colorModes, tokenName, "COLOR", semanticScopes(tokenName), alias(reference, COLLECTIONS.primitives)));
    }
  }

  for (const [legacyName, sourceName] of LEGACY_COLOR_MODE_ALIASES) {
    tokens.push(createToken(COLLECTIONS.colorModes, legacyName, "COLOR", semanticScopes(legacyName), alias(sourceName, COLLECTIONS.colorModes)));
  }

  return { tokens, missing };
}

function sanitizePrimaryName(input: string, preset: PresetDefinition): string {
  const reserved = new Set([
    ...Object.keys(preset.palettes).map((name) => name.toLowerCase()),
    "base",
    "gray",
    "brand",
    "pixel",
    "opacity",
    "font-family",
    "font-size",
  ]);

  const base = sanitizeKebabSegment(input || "brand-primary", "brand-primary");
  let candidate = base;
  let i = 1;
  while (reserved.has(candidate) || /^brand-\d+$/i.test(candidate)) {
    candidate = `${base}-${i}`;
    i += 1;
  }
  return candidate;
}

function extractCustomBrandScale(scaleInput: unknown, shadeSteps: number[]): Record<number, string> | null {
  if (!scaleInput || typeof scaleInput !== "object") return null;
  const input = scaleInput as Record<string, unknown>;
  const normalized: Record<number, string> = {};

  for (const step of shadeSteps) {
    const raw = input[String(step)];
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value) continue;
    try {
      parseColorInput(value);
      normalized[step] = value;
    } catch (_error) {
      // Ignore invalid custom shades and fallback to generated scale.
    }
  }

  return Object.keys(normalized).length === shadeSteps.length ? normalized : null;
}

function normalizeBrands(
  brandsInput: BrandColorInput[],
  preset: PresetDefinition,
  shadeSteps: number[],
  baseStep: number,
): NormalizedBrand[] {
  const prepared = brandsInput
    .slice(0, 10)
    .map((brand) => ({
      name: String(brand?.name || "").trim(),
      color: String(brand?.color || "").trim(),
      scale: brand?.scale,
    }))
    .filter((brand, index) => index === 0 || brand.color.length > 0);

  if (!prepared.length) {
    prepared.push({ name: "brand-primary", color: DEFAULT_BRAND });
  }
  if (!prepared[0].color) {
    prepared[0].color = DEFAULT_BRAND;
  }

  for (const brand of prepared) {
    parseColorInput(brand.color);
  }

  const primaryName = sanitizePrimaryName(prepared[0].name, preset);

  return prepared.map((brand, index) => {
    const tokenName = index === 0 ? primaryName : `brand-${index + 1}`;
    const opacityName = `brand-${index + 1}`;
    const customScale = extractCustomBrandScale(brand.scale, shadeSteps);
    const scale = customScale ? customScale : buildBrandScale(brand.color, shadeSteps, baseStep);
    const baseColor = scale[baseStep] || brand.color;
    return { tokenName, opacityName, baseColor, scale };
  });
}

const TYPOGRAPHY_FAMILY_VARIABLES = {
  display: "font-family/font-family-display",
  body: "font-family/font-family-body",
} as const;

function orderedTypographySizeKeys(fontSizes: Record<string, number>): string[] {
  const known = FONT_SIZE_ORDER.filter((key) => Object.prototype.hasOwnProperty.call(fontSizes, key));
  const extras = Object.keys(fontSizes)
    .filter((key) => !known.includes(key))
    .sort((a, b) => a.localeCompare(b));
  return [...known, ...extras];
}

function resolveTypographyLineHeights(fontSizes: Record<string, number>): Record<string, number> {
  const lineHeights: Record<string, number> = {};
  const allKeys = new Set<string>([...Object.keys(fontSizes), ...Object.keys(DEFAULT_LINE_HEIGHTS)]);

  for (const key of allKeys) {
    const size = Number(fontSizes[key]);
    if (!Number.isFinite(size) || size <= 0) continue;
    const baseSize = Number(DEFAULT_FONT_SIZES[key]);
    const baseLine = Number(DEFAULT_LINE_HEIGHTS[key]);
    const ratio =
      Number.isFinite(baseSize) && baseSize > 0 && Number.isFinite(baseLine) && baseLine > 0 ? baseLine / baseSize : 1.4;
    lineHeights[key] = roundTo(size * ratio, 2);
  }

  return lineHeights;
}

function buildTypographyTokens(options: GenerationOptions): TokenDefinition[] {
  const tokens: TokenDefinition[] = [];
  const fontSizes = options.typography.fontSizes;
  const lineHeights = resolveTypographyLineHeights(fontSizes);
  const sizeKeys = orderedTypographySizeKeys(fontSizes);

  tokens.push(createToken(COLLECTIONS.typography, TYPOGRAPHY_FAMILY_VARIABLES.display, "STRING", ["FONT_FAMILY"], raw(options.typography.displayFamily)));
  tokens.push(createToken(COLLECTIONS.typography, TYPOGRAPHY_FAMILY_VARIABLES.body, "STRING", ["FONT_FAMILY"], raw(options.typography.bodyFamily)));

  for (const sizeKey of sizeKeys) {
    const value = Number(fontSizes[sizeKey]);
    if (!Number.isFinite(value) || value <= 0) continue;
    tokens.push(createToken(COLLECTIONS.typography, `font-size/${sizeKey}`, "FLOAT", ["FONT_SIZE"], raw(value)));
  }

  for (const sizeKey of orderedTypographySizeKeys(lineHeights)) {
    const value = Number(lineHeights[sizeKey]);
    if (!Number.isFinite(value) || value <= 0) continue;
    tokens.push(createToken(COLLECTIONS.typography, `line-height/${sizeKey}`, "FLOAT", ["FONT_SIZE"], raw(value)));
  }

  for (const [weightKey, weightLabel] of Object.entries(DEFAULT_FONT_WEIGHT_STYLES)) {
    tokens.push(createToken(COLLECTIONS.typography, `font-weight/${weightKey}`, "STRING", ["FONT_STYLE"], raw(weightLabel)));
  }

  return tokens;
}

function buildPrimitiveTokens(
  options: GenerationOptions,
  preset: PresetDefinition,
  brands: NormalizedBrand[],
  shadeSteps: number[],
): TokenDefinition[] {
  const tokens: TokenDefinition[] = [];
  const presetSteps = normalizePresetSteps(preset);
  const neutralPaletteSteps = getPaletteSteps(preset, options.neutralChoice);

  tokens.push(createToken(COLLECTIONS.primitives, "colors/base/white", "COLOR", ["ALL_SCOPES"], raw(options.baseWhite)));
  tokens.push(createToken(COLLECTIONS.primitives, "colors/base/black", "COLOR", ["ALL_SCOPES"], raw(options.baseBlack)));

  for (const [paletteName, palette] of Object.entries(preset.palettes)) {
    for (const step of presetSteps) {
      const value = palette[step];
      if (!value) continue;
      tokens.push(createToken(COLLECTIONS.primitives, `colors/${paletteName}/${step}`, "COLOR", ["ALL_SCOPES"], raw(value)));
    }
  }

  const grayAliasSteps = neutralPaletteSteps.length ? neutralPaletteSteps : presetSteps;
  for (const step of grayAliasSteps) {
    const neutralStep = resolveClosestPaletteStep(preset, options.neutralChoice, step);
    tokens.push(
      createToken(
        COLLECTIONS.primitives,
        `colors/gray/${step}`,
        "COLOR",
        ["ALL_SCOPES"],
        alias(`colors/${options.neutralChoice}/${neutralStep}`, COLLECTIONS.primitives),
      ),
    );
  }

  const primary = brands[0];
  for (const brand of brands) {
    for (const step of shadeSteps) {
      const value = brand.scale[step];
      if (!value) continue;
      tokens.push(
        createToken(COLLECTIONS.primitives, `colors/${brand.tokenName}/${step}`, "COLOR", ["ALL_SCOPES"], raw(value)),
      );
    }
  }
  for (const step of shadeSteps) {
    tokens.push(
      createToken(
        COLLECTIONS.primitives,
        `colors/brand/${step}`,
        "COLOR",
        ["ALL_SCOPES"],
        alias(`colors/${primary.tokenName}/${step}`, COLLECTIONS.primitives),
      ),
    );
  }

  for (const value of PIXEL_VALUES) {
    tokens.push(
      createToken(
        COLLECTIONS.primitives,
        `pixel/${value}`,
        "FLOAT",
        ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"],
        raw(value),
      ),
    );
  }
  tokens.push(createToken(COLLECTIONS.primitives, "pixel/full", "FLOAT", ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"], raw(9999)));

  for (const pct of OPACITY_STEPS) {
    tokens.push(createToken(COLLECTIONS.primitives, `opacity/white/${pct}`, "COLOR", ["ALL_FILLS"], raw(colorWithAlpha(options.baseWhite, pct))));
    tokens.push(createToken(COLLECTIONS.primitives, `opacity/black/${pct}`, "COLOR", ["ALL_FILLS"], raw(colorWithAlpha(options.baseBlack, pct))));
  }

  for (const brand of brands) {
    for (const pct of OPACITY_STEPS) {
      tokens.push(
        createToken(
          COLLECTIONS.primitives,
          `opacity/${brand.opacityName}/${pct}`,
          "COLOR",
          ["ALL_FILLS"],
          raw(colorWithAlpha(brand.baseColor, pct)),
        ),
      );
    }
  }

  return tokens;
}

function buildSpacingTokens(): TokenDefinition[] {
  return SPACING_ALIAS_MAP.map(([name, pixelRef]) =>
    createToken(COLLECTIONS.spacing, name, "FLOAT", ["GAP", "WIDTH_HEIGHT"], alias(`pixel/${pixelRef}`, COLLECTIONS.primitives)),
  );
}

function buildRadiusTokens(): TokenDefinition[] {
  return RADIUS_ALIAS_MAP.map(([name, pixelRef]) =>
    createToken(COLLECTIONS.radius, name, "FLOAT", ["CORNER_RADIUS"], alias(`pixel/${pixelRef}`, COLLECTIONS.primitives)),
  );
}

function normalizeTokenLevel(value: unknown): TokenLevel {
  return value === "color-modes" ? "color-modes" : "foundations";
}

function normalizeUiMode(value: unknown): UiMode {
  return value === "dark" ? "dark" : "light";
}

function normalizeNamingPattern(value: unknown): NamingPattern {
  return value === "hundreds" ? "hundreds" : "tailwind";
}

function buildGenerationOptions(rawPayload: unknown): GenerationOptions {
  if (!rawPayload || typeof rawPayload !== "object") {
    throw new Error("Payload generation invalide.");
  }

  const input = rawPayload as Partial<GenerationOptions>;
  const presetId = String(input.presetId || BUILTIN_PRESETS[0]?.id || "default");
  const preset = getPresetById(presetId) || BUILTIN_PRESETS[0];
  if (!preset) throw new Error("Aucun preset interne disponible.");

  const tokenLevel = normalizeTokenLevel(input.tokenLevel);
  const uiMode = normalizeUiMode(input.uiMode);
  const namingPattern = normalizeNamingPattern(input.namingPattern);
  const shadeCount = clampNumber(input.shadeCount, 6, 14, 11);
  const createTextStyles = input.createTextStyles !== false;

  const baseWhite = String(input.baseWhite || DEFAULT_BASE_WHITE).trim();
  const baseBlack = String(input.baseBlack || DEFAULT_BASE_BLACK).trim();
  parseColorInput(baseWhite);
  parseColorInput(baseBlack);

  const candidateNeutral = String(input.neutralChoice || preset.defaultNeutral).trim().toLowerCase();
  const neutralChoice = preset.neutralOptions.includes(candidateNeutral) ? candidateNeutral : preset.defaultNeutral;

  const rawBrandsInput = Array.isArray(input.brands) ? input.brands : [];
  const hasCustomBrand = rawBrandsInput.some(
    (entry) => Boolean(entry) && typeof entry === "object" && String((entry as Partial<BrandColorInput>).color || "").trim().length > 0,
  );
  const brands = rawBrandsInput
    .slice(0, 10)
    .filter((entry): entry is BrandColorInput => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      name: String(entry.name || "").trim(),
      color: String(entry.color || "").trim(),
      contrast: Number.isFinite(Number(entry.contrast)) ? Number(entry.contrast) : undefined,
      scale:
        entry.scale && typeof entry.scale === "object"
          ? Object.entries(entry.scale).reduce<Record<string, string>>((acc, [key, value]) => {
              if (typeof value !== "string") return acc;
              const trimmed = value.trim();
              if (!trimmed) return acc;
              acc[String(key)] = trimmed;
              return acc;
            }, {})
          : undefined,
    }));
  if (!brands.length) {
    brands.push({ name: "brand-primary", color: DEFAULT_BRAND });
  }
  if (!brands[0].color) {
    brands[0].color = DEFAULT_BRAND;
  }
  for (const brand of brands) {
    if (!brand.color) continue;
    parseColorInput(brand.color);
  }

  const inputTypography = input.typography && typeof input.typography === "object" ? input.typography : undefined;
  const displayFamily =
    inputTypography && typeof inputTypography.displayFamily === "string" && inputTypography.displayFamily.trim().length
      ? inputTypography.displayFamily.trim()
      : DEFAULT_DISPLAY_FAMILY;
  const bodyFamily =
    inputTypography && typeof inputTypography.bodyFamily === "string" && inputTypography.bodyFamily.trim().length
      ? inputTypography.bodyFamily.trim()
      : DEFAULT_BODY_FAMILY;

  const fontSizes = { ...DEFAULT_FONT_SIZES };
  if (inputTypography && inputTypography.fontSizes && typeof inputTypography.fontSizes === "object") {
    for (const key of FONT_SIZE_ORDER) {
      const candidate = Number(inputTypography.fontSizes[key]);
      if (Number.isFinite(candidate) && candidate > 0) {
        fontSizes[key] = candidate;
      }
    }
  }

  return {
    tokenLevel,
    uiMode,
    presetId,
    hasCustomBrand,
    baseWhite,
    baseBlack,
    neutralChoice,
    namingPattern,
    shadeCount,
    createTextStyles,
    brands,
    typography: {
      displayFamily,
      bodyFamily,
      fontSizes,
    },
  };
}

function findCollectionByNames(collections: VariableCollection[], names: string[]): VariableCollection | null {
  const lookups = new Set(names.map((name) => normalizeCollectionLookup(name)));
  for (const collection of collections) {
    if (lookups.has(normalizeCollectionLookup(collection.name))) {
      return collection;
    }
  }
  return null;
}

function resolveCollection(canonicalName: CollectionName, collections: VariableCollection[], report: GenerationReport): VariableCollection {
  const canonicalMatch = findCollectionByNames(collections, [canonicalName]);
  if (canonicalMatch) {
    if (canonicalMatch.name !== canonicalName) {
      const previous = canonicalMatch.name;
      canonicalMatch.name = canonicalName;
      report.migrations.push(`Collection renommÃ©e: ${previous} -> ${canonicalName}`);
    }
    return canonicalMatch;
  }

  const legacyNames = COLLECTION_LEGACY_NAMES[canonicalName].filter(
    (name) => normalizeCollectionLookup(name) !== normalizeCollectionLookup(canonicalName),
  );
  const legacyMatch = findCollectionByNames(collections, legacyNames);
  if (legacyMatch) {
    const previous = legacyMatch.name;
    legacyMatch.name = canonicalName;
    report.migrations.push(`Collection migrÃ©e: ${previous} -> ${canonicalName}`);
    return legacyMatch;
  }

  const created = figma.variables.createVariableCollection(canonicalName);
  collections.push(created);
  report.migrations.push(`Collection crÃ©Ã©e: ${canonicalName}`);
  return created;
}

function ensureSingleDefaultMode(collection: VariableCollection, report: GenerationReport): string {
  let modeMap = buildModeMap(collection);

  if (!modeMap[DEFAULT_MODE]) {
    if (collection.modes.length === 1) {
      const previous = collection.modes[0].name;
      collection.renameMode(collection.modes[0].modeId, DEFAULT_MODE);
      report.migrations.push(`Mode renommÃ© (${collection.name}): ${previous} -> ${DEFAULT_MODE}`);
    } else {
      collection.addMode(DEFAULT_MODE);
      report.migrations.push(`Mode ajoutÃ© (${collection.name}): ${DEFAULT_MODE}`);
    }
  }

  for (const mode of [...collection.modes]) {
    if (mode.name !== DEFAULT_MODE && collection.modes.length > 1) {
      collection.removeMode(mode.modeId);
      report.migrations.push(`Mode supprimÃ© (${collection.name}): ${mode.name}`);
    }
  }

  modeMap = buildModeMap(collection);
  if (!modeMap[DEFAULT_MODE] && collection.modes.length === 1) {
    const previous = collection.modes[0].name;
    collection.renameMode(collection.modes[0].modeId, DEFAULT_MODE);
    report.migrations.push(`Mode renommÃ© (${collection.name}): ${previous} -> ${DEFAULT_MODE}`);
    modeMap = buildModeMap(collection);
  }

  const modeId = modeMap[DEFAULT_MODE];
  if (!modeId) {
    throw new Error(`Impossible de dÃ©finir le mode ${DEFAULT_MODE} pour ${collection.name}`);
  }
  return modeId;
}

function removeDeprecatedVariablesByPrefix(
  collection: VariableCollection | null,
  prefixes: string[],
  report: GenerationReport,
): void {
  if (!collection) return;
  const allVariables = figma.variables.getLocalVariables();
  const toRemove = allVariables.filter(
    (variable) => variable.variableCollectionId === collection.id && prefixes.some((prefix) => variable.name.startsWith(prefix)),
  );
  for (const variable of toRemove) {
    report.migrations.push(`Variable supprimee: ${collection.name}/${variable.name}`);
    variable.remove();
  }
}

type TextStyleTemplateEntry = (typeof TEXT_STYLE_TEMPLATES)[number];

const TEXT_CASE_VALUES = new Set<TextCase>(["ORIGINAL", "UPPER", "LOWER", "TITLE", "SMALL_CAPS", "SMALL_CAPS_FORCED"]);
const TEXT_DECORATION_VALUES = new Set<TextDecoration>(["NONE", "UNDERLINE", "STRIKETHROUGH"]);

function normalizeFontLookup(input: string): string {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function roundTo(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function resolveTextCase(value: string): TextCase {
  return TEXT_CASE_VALUES.has(value as TextCase) ? (value as TextCase) : "ORIGINAL";
}

function resolveTextDecoration(value: string): TextDecoration {
  return TEXT_DECORATION_VALUES.has(value as TextDecoration) ? (value as TextDecoration) : "NONE";
}

function buildFontCatalog(fonts: Font[]): Map<string, { family: string; styles: string[] }> {
  const catalog = new Map<string, { family: string; styles: string[] }>();
  for (const font of fonts) {
    const key = normalizeFontLookup(font.fontName.family);
    if (!key) continue;
    if (!catalog.has(key)) {
      catalog.set(key, { family: font.fontName.family, styles: [] });
    }
    const entry = catalog.get(key)!;
    if (!entry.styles.includes(font.fontName.style)) {
      entry.styles.push(font.fontName.style);
    }
  }
  return catalog;
}

function resolveFamilyName(catalog: Map<string, { family: string; styles: string[] }>, requested: string): string | null {
  const direct = catalog.get(normalizeFontLookup(requested));
  if (direct) return direct.family;
  return null;
}

function preferredStyleCandidates(weight: number, italic: boolean): string[] {
  const base =
    weight >= 700
      ? ["Bold", "Semi Bold", "SemiBold", "Medium", "Regular"]
      : weight >= 600
        ? ["Semi Bold", "SemiBold", "Demi Bold", "DemiBold", "Bold", "Medium", "Regular"]
        : weight >= 500
          ? ["Medium", "Regular", "Semi Bold", "SemiBold", "Bold"]
          : ["Regular", "Book", "Roman", "Medium"];

  if (!italic) return base;
  const italicized = base.flatMap((candidate) => [`${candidate} Italic`, candidate]);
  return ["Italic", ...italicized];
}

function resolveFontStyle(
  availableStyles: string[],
  preferredStyle: string,
  fallbackWeight: number,
  italic: boolean,
): string {
  if (!availableStyles.length) return "Regular";

  const normalizedMap = new Map(availableStyles.map((style) => [normalizeFontLookup(style), style]));
  const lookupPreferred = normalizeFontLookup(preferredStyle);
  if (lookupPreferred && normalizedMap.has(lookupPreferred)) {
    return normalizedMap.get(lookupPreferred)!;
  }

  const candidates = [...preferredStyleCandidates(fallbackWeight, italic), preferredStyle].filter(Boolean);
  for (const candidate of candidates) {
    const lookup = normalizeFontLookup(candidate);
    if (lookup && normalizedMap.has(lookup)) {
      return normalizedMap.get(lookup)!;
    }
  }

  if (italic) {
    const italicMatch = availableStyles.find((style) => /italic/i.test(style));
    if (italicMatch) return italicMatch;
  }

  const regularMatch = availableStyles.find((style) => /^regular$/i.test(style));
  if (regularMatch) return regularMatch;
  return availableStyles[0];
}

async function ensureFontLoaded(fontName: FontName, loaded: Set<string>, report: GenerationReport): Promise<boolean> {
  const key = `${fontName.family}::${fontName.style}`;
  if (loaded.has(key)) return true;
  try {
    await figma.loadFontAsync(fontName);
    loaded.add(key);
    return true;
  } catch (_error) {
    report.warnings.push(`Font missing: ${fontName.family}/${fontName.style}`);
    return false;
  }
}

function resolveTemplateFontSize(template: TextStyleTemplateEntry, options: GenerationOptions): number {
  const candidate = Number(options.typography.fontSizes[template.sizeToken]);
  if (Number.isFinite(candidate) && candidate > 0) return candidate;
  return template.baseSize;
}

function upsertTextStyleByName(name: string, index: Map<string, TextStyle>): { style: TextStyle; created: boolean } {
  const existing = index.get(name);
  if (existing) return { style: existing, created: false };
  const created = figma.createTextStyle();
  created.name = name;
  index.set(name, created);
  return { style: created, created: true };
}

function variableIndexKey(collectionId: string, variableName: string): string {
  return `${collectionId}::${variableName}`;
}

function getVariableFromIndex(variableIndex: Map<string, Variable>, collectionId: string, variableName: string): Variable | null {
  return variableIndex.get(variableIndexKey(collectionId, variableName)) ?? null;
}

function tryBindTextStyleVariable(
  style: TextStyle,
  field: VariableBindableTextField,
  variable: Variable | null,
  report: GenerationReport,
  styleName: string,
): void {
  try {
    style.setBoundVariable(field, variable);
  } catch (_error) {
    const variableLabel = variable ? `${variable.name} (${variable.resolvedType})` : "null";
    report.warnings.push(`Text style bind failed: ${styleName} -> ${field} with ${variableLabel}`);
  }
}

async function applyTypographyTextStyles(
  options: GenerationOptions,
  report: GenerationReport,
  typographyCollection: VariableCollection | null,
  variableIndex: Map<string, Variable>,
): Promise<void> {
  if (!TEXT_STYLE_TEMPLATES.length) {
    report.warnings.push("No typography style templates available.");
    return;
  }
  if (!typographyCollection) {
    report.warnings.push("Typography binding skipped: typography collection unavailable.");
    return;
  }

  const availableFonts = await figma.listAvailableFontsAsync();
  const catalog = buildFontCatalog(availableFonts);
  const localStyles = figma.getLocalTextStyles();
  const styleIndex = new Map(localStyles.map((style) => [style.name, style]));
  const loadedFonts = new Set<string>();
  const warnedMissingVars = new Set<string>();
  const typographyCollectionId = typographyCollection.id;
  const displayFamilyVar = getVariableFromIndex(variableIndex, typographyCollectionId, TYPOGRAPHY_FAMILY_VARIABLES.display);
  const bodyFamilyVar = getVariableFromIndex(variableIndex, typographyCollectionId, TYPOGRAPHY_FAMILY_VARIABLES.body);

  let created = 0;
  let updated = 0;

  for (const template of TEXT_STYLE_TEMPLATES) {
    const preferredFamily = template.familyKind === "display" ? options.typography.displayFamily : options.typography.bodyFamily;
    const family =
      resolveFamilyName(catalog, preferredFamily) ??
      resolveFamilyName(catalog, template.familyKind === "display" ? "Roboto" : "Inter");

    if (!family) {
      report.warnings.push(`Font family missing for text style: ${template.name}`);
      continue;
    }

    const familyEntry = catalog.get(normalizeFontLookup(family));
    if (!familyEntry || !familyEntry.styles.length) {
      report.warnings.push(`No styles found for font family: ${family}`);
      continue;
    }

    const styleName = resolveFontStyle(
      familyEntry.styles,
      template.preferredFontStyle,
      template.fallbackWeight,
      template.italic,
    );
    const fontName: FontName = { family: familyEntry.family, style: styleName };
    if (!(await ensureFontLoaded(fontName, loadedFonts, report))) continue;

    const { style, created: justCreated } = upsertTextStyleByName(template.name, styleIndex);
    style.name = template.name;
    style.fontName = fontName;

    const fontSize = resolveTemplateFontSize(template, options);
    style.fontSize = fontSize;
    style.lineHeight = { unit: "PIXELS", value: roundTo(fontSize * template.lineHeightRatio) };
    style.letterSpacing =
      template.letterSpacingUnit === "PERCENT"
        ? { unit: "PERCENT", value: template.letterSpacingValue }
        : { unit: "PIXELS", value: template.letterSpacingValue };
    style.paragraphSpacing = roundTo(fontSize * template.paragraphSpacingRatio);
    style.paragraphIndent = template.paragraphIndent;
    style.textCase = resolveTextCase(template.textCase);
    style.textDecoration = resolveTextDecoration(template.textDecoration);

    const familyVariable = template.familyKind === "display" ? displayFamilyVar : bodyFamilyVar;
    if (familyVariable && familyVariable.resolvedType === "STRING") {
      tryBindTextStyleVariable(style, "fontFamily", familyVariable, report, template.name);
    } else {
      const key = `fontFamily:${template.familyKind}`;
      if (!warnedMissingVars.has(key)) {
        warnedMissingVars.add(key);
        report.warnings.push(`Missing STRING variable for text style binding: ${TYPOGRAPHY_FAMILY_VARIABLES[template.familyKind]}`);
      }
    }

    const sizeVariableName = `font-size/${template.sizeToken}`;
    const sizeVariable = getVariableFromIndex(variableIndex, typographyCollectionId, sizeVariableName);
    if (sizeVariable && sizeVariable.resolvedType === "FLOAT") {
      tryBindTextStyleVariable(style, "fontSize", sizeVariable, report, template.name);
    } else if (!warnedMissingVars.has(sizeVariableName)) {
      warnedMissingVars.add(sizeVariableName);
      report.warnings.push(`Missing FLOAT variable for text style binding: ${sizeVariableName}`);
    }

    const lineHeightVariableName = `line-height/${template.sizeToken}`;
    const lineHeightVariable = getVariableFromIndex(variableIndex, typographyCollectionId, lineHeightVariableName);
    if (lineHeightVariable && lineHeightVariable.resolvedType === "FLOAT") {
      tryBindTextStyleVariable(style, "lineHeight", lineHeightVariable, report, template.name);
    } else if (!warnedMissingVars.has(lineHeightVariableName)) {
      warnedMissingVars.add(lineHeightVariableName);
      report.warnings.push(`Missing FLOAT variable for text style binding: ${lineHeightVariableName}`);
    }

    const styleVariant = template.name.split("/")[1] || template.preferredFontStyle;
    const variantLookup = styleVariant.toLowerCase();
    let weightKey = "regular";
    if (variantLookup.includes("semi")) weightKey = "semibold";
    else if (variantLookup.includes("bold")) weightKey = "bold";
    else if (variantLookup.includes("medium")) weightKey = "medium";
    if (variantLookup.includes("italic")) {
      weightKey = `${weightKey}-italic`;
    }

    const weightVariableName = `font-weight/${weightKey}`;
    const weightVariable = getVariableFromIndex(variableIndex, typographyCollectionId, weightVariableName);
    if (weightVariable && weightVariable.resolvedType === "STRING") {
      tryBindTextStyleVariable(style, "fontStyle", weightVariable, report, template.name);
    } else if (!warnedMissingVars.has(weightVariableName)) {
      warnedMissingVars.add(weightVariableName);
      report.warnings.push(`Missing STRING variable for text style binding: ${weightVariableName}`);
    }

    if (justCreated) created += 1;
    else updated += 1;
  }

  report.migrations.push(`Text styles: ${created} created, ${updated} updated (family/size/weight/line-height linked).`);
}

async function applyGeneration(options: GenerationOptions): Promise<GenerationReport> {
  const preset = getPresetById(options.presetId);
  if (!preset) throw new Error(`Preset inconnu: ${options.presetId}`);

  const shadeSteps = deriveShadeSteps(options.namingPattern, options.shadeCount);
  const baseStep = resolveBaseStep(shadeSteps);
  const brands = normalizeBrands(options.brands, preset, shadeSteps, baseStep);

  const tokens: TokenDefinition[] = [];
  tokens.push(...buildPrimitiveTokens(options, preset, brands, shadeSteps));
  tokens.push(...buildTypographyTokens(options));
  tokens.push(...buildSpacingTokens());
  tokens.push(...buildRadiusTokens());
  let colorModesResult: { tokens: TokenDefinition[]; missing: string[] } | null = null;
  if (options.tokenLevel === "color-modes") {
    colorModesResult = buildColorModeTokens(
      options.uiMode,
      preset,
      options.neutralChoice,
      shadeSteps,
      options.hasCustomBrand,
    );
    tokens.push(...colorModesResult.tokens);
  }

  const targetCollections: CollectionName[] = [COLLECTIONS.primitives, COLLECTIONS.typography, COLLECTIONS.spacing, COLLECTIONS.radius];
  if (options.tokenLevel === "color-modes") {
    targetCollections.push(COLLECTIONS.colorModes);
  }

  const report: GenerationReport = {
    created: 0,
    updated: 0,
    collisionsReplaced: 0,
    aliasApplied: 0,
    aliasMissing: 0,
    warnings: [],
    migrations: [],
    collections: targetCollections.map((name) => ({ name, created: 0, updated: 0, collisionsReplaced: 0 })),
  };

  if (colorModesResult?.missing.length) {
    for (const tokenName of colorModesResult.missing) {
      const message = `Color modes token missing from generated structure: ${tokenName}`;
      report.warnings.push(message);
      console.warn(`[Starter Tokens] ${message}`);
    }
  } else if (colorModesResult) {
    console.log("[Starter Tokens] Color modes structure check: OK");
  }

  const localCollections = figma.variables.getLocalVariableCollections();
  const collectionsByName = new Map<CollectionName, VariableCollection>();
  for (const name of targetCollections) {
    collectionsByName.set(name, resolveCollection(name, localCollections, report));
  }

  const modeIdsByCollection = new Map<CollectionName, string>();
  for (const [name, collection] of collectionsByName.entries()) {
    modeIdsByCollection.set(name, ensureSingleDefaultMode(collection, report));
  }

  removeDeprecatedVariablesByPrefix(
    collectionsByName.get(COLLECTIONS.primitives) ?? null,
    ["colors/alpha/", "font-family/", "font-size/", "font-weight/", "line-height/"],
    report,
  );
  const colorModesCleanupCollection =
    collectionsByName.get(COLLECTIONS.colorModes) ??
    findCollectionByNames(localCollections, [COLLECTIONS.colorModes, ...COLLECTION_LEGACY_NAMES[COLLECTIONS.colorModes]]);
  removeDeprecatedVariablesByPrefix(colorModesCleanupCollection, ["alpha/"], report);

  const localVariables = figma.variables.getLocalVariables();
  const variableIndex = new Map(localVariables.map((variable) => [`${variable.variableCollectionId}::${variable.name}`, variable]));

  const refreshedCollections = figma.variables.getLocalVariableCollections();
  const aliasIndex: AliasIndex = {
    global: new Map(),
    byCollectionId: new Map(),
    byCollectionName: new Map(),
    collectionNameById: new Map(refreshedCollections.map((collection) => [collection.id, collection.name])),
  };
  for (const variable of localVariables) {
    addAliasEntry(aliasIndex, variable);
  }

  const pendingAliases: PendingAlias[] = [];
  for (const token of tokens) {
    const collection = collectionsByName.get(token.collection);
    if (!collection) continue;

    const variable = upsertVariable(collection, token.name, token.type, variableIndex, report);
    if (!variable) continue;
    variable.scopes = sanitizeScopes(token.scopes);

    const modeId = modeIdsByCollection.get(token.collection);
    if (!modeId) {
      report.warnings.push(`Mode missing for ${collection.name}/${token.name}`);
      continue;
    }

    if (token.value.kind === "raw") {
      setRawValue(variable, modeId, token.type, token.value.value);
    } else {
      pendingAliases.push({
        variable,
        modeId,
        ref: token.value.ref,
        sourceCollectionId: collection.id,
        targetCollection: token.value.collection,
      });
    }

    addAliasEntry(aliasIndex, variable);
  }

  for (const pending of pendingAliases) {
    const target = resolveAlias(aliasIndex, pending.ref, pending.sourceCollectionId, pending.targetCollection);
    if (!target) {
      report.aliasMissing += 1;
      report.warnings.push(`Alias unresolved: ${pending.variable.name} -> ${pending.ref}`);
      continue;
    }
    pending.variable.setValueForMode(pending.modeId, makeAlias(target));
    report.aliasApplied += 1;
  }

  if (options.createTextStyles) {
    await applyTypographyTextStyles(options, report, collectionsByName.get(COLLECTIONS.typography) ?? null, variableIndex);
  } else {
    report.migrations.push("Text styles skipped by user option.");
  }
  return report;
}

function postPresetList(): void {
  figma.ui.postMessage({
    type: "preset-list",
    presets: getPresetSummaries(),
  });
}

async function postFontFamiliesList(): Promise<void> {
  try {
    const fonts = await figma.listAvailableFontsAsync();
    const families = Array.from(new Set(fonts.map((font) => font.fontName.family).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
    figma.ui.postMessage({
      type: "font-families-list",
      families,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Starter Tokens] Unable to load font families list: ${message}`);
    figma.ui.postMessage({
      type: "font-families-list",
      families: [],
    });
  }
}

figma.ui.onmessage = async (msg: unknown) => {
  const payload = msg as { type?: string; payload?: unknown };

  try {
    if (payload.type === "ui-ready") {
      postPresetList();
      await postFontFamiliesList();
      return;
    }

    if (payload.type === "generate-variables") {
      const options = buildGenerationOptions(payload.payload);
      const report = await applyGeneration(options);

      figma.notify(
        `Starter Tokens V3: +${report.created} / ~${report.updated} / collisions ${report.collisionsReplaced}` +
          (report.aliasMissing ? ` / alias manquants ${report.aliasMissing}` : ""),
      );

      figma.ui.postMessage({
        type: "generate-result",
        report,
      });
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Erreur: ${message}`, { error: true });
    figma.ui.postMessage({
      type: "generate-error",
      message,
    });
  }
};
