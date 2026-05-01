import { buildBrandScale, colorWithAlpha, parseColorInput, sanitizeKebabSegment } from "./presets/color-utils";
import { BUILTIN_PRESETS, getPresetById, getPresetSummaries } from "./presets/builtin";
import { TEXT_STYLE_TEMPLATES } from "./presets/text-styles.generated";
import { TYPOGRAPHY_REFERENCE } from "./presets/typography.generated";
import {
  basePatternSteps,
  closestPresetStep,
  closestStep,
  deriveShadeSteps,
  extendSteps,
  fallbackPresetSteps,
  getPaletteSteps,
  nextShadeStep,
  normalizePresetSteps,
  parsePresetNumericStep,
  normalizeTokenBundle,
  pickSubset,
  resolveClosestPaletteStep,
  resolveBaseStep,
  sortPresetSteps,
  validateTokenBundle,
} from "../../ds-core/src/index.js";
import type {
  BrandColorInput,
  GenerationOptions,
  GenerationReport,
  NamingPattern,
  PresetDefinition,
  TokenBundle,
  TokenBundleEntry,
  TokenLevel,
  TokenModeValue,
  UiMode,
} from "./presets/types";

const UI_WIDTH = 532;
const UI_HEIGHT = 700;
const UI_TITLE = "ombrstudio - Build your design system foundation";
let isGenerationRunning = false;

figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT, themeColors: true, title: UI_TITLE });

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
type RuntimeModeName = "default" | "light" | "dark";

type RuntimeTokenValue = { kind: "raw"; value: RawTokenValue } | { kind: "alias"; ref: string; collection: CollectionName };

type TokenDefinition = {
  collection: CollectionName;
  name: string;
  type: VariableType;
  scopes: VariableScope[];
  value?: RuntimeTokenValue;
  modeValues?: Partial<Record<RuntimeModeName, RuntimeTokenValue>>;
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

const DEFAULT_BASE_WHITE = "#ffffff";
const DEFAULT_BASE_BLACK = "#000000";
const DEFAULT_BRAND = "#82BE5C";
const DEFAULT_DISPLAY_FAMILY = TYPOGRAPHY_REFERENCE.fontFamily.display || "Roboto";
const DEFAULT_BODY_FAMILY = TYPOGRAPHY_REFERENCE.fontFamily.body || "Inter";
const DEFAULT_ICON_LIBRARY = "lucide";
const DEFAULT_ICON_PACKS = ["navigation", "actions"] as const;
const LEGACY_ICONS_PAGE_NAME = "7. Icons";
const ICONS_PAGE_NAME = "Icons";
const ICON_COMPONENT_SET_NAME = "Icon";
const DEFAULT_ICON_SIZE = 24;
const DEFAULT_ICON_COLOR_ALIAS = "icon/primary";
const DEFAULT_ICON_STROKE = "medium";

type IconLibraryId = "lucide" | "tabler" | "phosphor" | "iconoir";
type IconPackId = "navigation" | "actions" | "status-feedback" | "files-folders";
type IconStrokeId = "light" | "regular" | "medium" | "bold";
type StarterIconId =
  | "search"
  | "close"
  | "plus"
  | "minus"
  | "check"
  | "chevron-down"
  | "chevron-up"
  | "chevron-left"
  | "chevron-right"
  | "ellipsis"
  | "ellipsis-vertical"
  | "user"
  | "mail"
  | "calendar"
  | "logout"
  | "filter"
  | "trash"
  | "edit"
  | "loader"
  | "settings"
  | "home"
  | "info"
  | "warning"
  | "folder"
  | "file"
  | "download"
  | "upload";

type IconLibraryConfig = {
  buildUrl: (iconName: string) => string;
};

const ICON_STROKE_WIDTHS: Record<IconStrokeId, number> = {
  light: 1.5,
  regular: 1.75,
  medium: 2,
  bold: 2.5,
};

const ICON_LIBRARY_CONFIG: Record<IconLibraryId, IconLibraryConfig> = {
  lucide: {
    buildUrl: (iconName) => `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/${iconName}.svg`,
  },
  tabler: {
    buildUrl: (iconName) => `https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/outline/${iconName}.svg`,
  },
  phosphor: {
    buildUrl: (iconName) => `https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/${iconName}.svg`,
  },
  iconoir: {
    buildUrl: (iconName) => `https://raw.githubusercontent.com/iconoir-icons/iconoir/main/icons/regular/${iconName}.svg`,
  },
};

const STARTER_ICON_PACK: StarterIconId[] = [
  "search",
  "close",
  "plus",
  "minus",
  "check",
  "chevron-down",
  "chevron-up",
  "chevron-left",
  "chevron-right",
  "ellipsis",
  "ellipsis-vertical",
  "user",
  "mail",
  "calendar",
  "logout",
  "filter",
  "trash",
  "edit",
  "loader",
  "settings",
  "home",
];

const ICON_PACK_DEFINITIONS: Record<IconPackId, StarterIconId[]> = {
  navigation: ["home", "search", "chevron-left", "chevron-right", "chevron-up", "chevron-down", "ellipsis", "ellipsis-vertical"],
  actions: ["plus", "minus", "check", "close", "edit", "trash", "filter", "settings"],
  "status-feedback": ["check", "info", "warning", "loader"],
  "files-folders": ["folder", "file", "upload", "download"],
};

const ICON_LIBRARY_NAME_MAP: Record<IconLibraryId, Record<StarterIconId, string>> = {
  lucide: {
    search: "search",
    close: "x",
    plus: "plus",
    minus: "minus",
    check: "check",
    "chevron-down": "chevron-down",
    "chevron-up": "chevron-up",
    "chevron-left": "chevron-left",
    "chevron-right": "chevron-right",
    ellipsis: "ellipsis",
    "ellipsis-vertical": "ellipsis-vertical",
    user: "user",
    mail: "mail",
    calendar: "calendar",
    logout: "log-out",
    filter: "list-filter",
    trash: "trash",
    edit: "pencil",
    loader: "loader",
    settings: "settings",
    home: "house",
    info: "circle-alert",
    warning: "triangle-alert",
    folder: "folder",
    file: "file",
    download: "download",
    upload: "upload",
  },
  tabler: {
    search: "search",
    close: "x",
    plus: "plus",
    minus: "minus",
    check: "check",
    "chevron-down": "chevron-down",
    "chevron-up": "chevron-up",
    "chevron-left": "chevron-left",
    "chevron-right": "chevron-right",
    ellipsis: "dots",
    "ellipsis-vertical": "dots-vertical",
    user: "user",
    mail: "mail",
    calendar: "calendar",
    logout: "logout",
    filter: "filter",
    trash: "trash",
    edit: "pencil",
    loader: "loader",
    settings: "settings",
    home: "home",
    info: "info-circle",
    warning: "alert-triangle",
    folder: "folder",
    file: "file",
    download: "download",
    upload: "upload",
  },
  phosphor: {
    search: "magnifying-glass",
    close: "x",
    plus: "plus",
    minus: "minus",
    check: "check",
    "chevron-down": "caret-down",
    "chevron-up": "caret-up",
    "chevron-left": "caret-left",
    "chevron-right": "caret-right",
    ellipsis: "dots-three",
    "ellipsis-vertical": "dots-three-vertical",
    user: "user",
    mail: "envelope",
    calendar: "calendar",
    logout: "sign-out",
    filter: "funnel",
    trash: "trash",
    edit: "pencil-simple",
    loader: "spinner-gap",
    settings: "gear",
    home: "house",
    info: "info",
    warning: "warning",
    folder: "folder",
    file: "file",
    download: "download",
    upload: "upload",
  },
  iconoir: {
    search: "search",
    close: "xmark",
    plus: "plus",
    minus: "minus",
    check: "check",
    "chevron-down": "nav-arrow-down",
    "chevron-up": "nav-arrow-up",
    "chevron-left": "nav-arrow-left",
    "chevron-right": "nav-arrow-right",
    ellipsis: "more-horiz",
    "ellipsis-vertical": "more-vert",
    user: "user",
    mail: "mail",
    calendar: "calendar",
    logout: "log-out",
    filter: "filter",
    trash: "trash",
    edit: "edit-pencil",
    loader: "refresh-double",
    settings: "settings",
    home: "home",
    info: "info-circle",
    warning: "warning-triangle",
    folder: "folder",
    file: "page",
    download: "download",
    upload: "upload",
  },
};

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

const DEFAULT_FONT_SIZES: Record<string, number> = { label: 10, ...TYPOGRAPHY_REFERENCE.fontSize };
const DEFAULT_LINE_HEIGHTS: Record<string, number> = { label: 14, ...TYPOGRAPHY_REFERENCE.lineHeight, "display-2xl": 88 };
const DEFAULT_LETTER_SPACINGS: Record<string, number> = Object.fromEntries(Object.keys(DEFAULT_FONT_SIZES).map((key) => [key, 0]));
const DEFAULT_FONT_WEIGHT_STYLES: Record<string, string> = { ...TYPOGRAPHY_REFERENCE.fontWeight };

const FONT_SIZE_ORDER = Object.keys(DEFAULT_FONT_SIZES);

const COLLECTION_LEGACY_NAMES: Record<CollectionName, string[]> = {
  [COLLECTIONS.primitives]: ["primitives", "_primitives", " _primitives"],
  [COLLECTIONS.colorModes]: ["1. color modes", "1. color-modes", "semantic", "color-modes"],
  [COLLECTIONS.spacing]: ["2. spacing", "spacing"],
  [COLLECTIONS.radius]: ["3. radius", "radius"],
  [COLLECTIONS.typography]: ["6. typography", "6. Typography", "typography", "6.typography", "6 Typography"],
};

function raw(value: RawTokenValue): RuntimeTokenValue {
  return { kind: "raw", value };
}

function alias(ref: string, collection: CollectionName): RuntimeTokenValue {
  return { kind: "alias", ref, collection };
}

function mapBundleAlias(aliasPath: string): { ref: string; collection: CollectionName } {
  const segments = String(aliasPath || "")
    .trim()
    .split("/")
    .filter(Boolean);
  if (segments.length < 2) {
    throw new Error(`Alias bundle invalide: ${aliasPath}`);
  }

  const [collectionSegment, ...tokenPath] = segments;
  const ref = tokenPath.join("/");

  if (collectionSegment === "primitives") {
    return { ref, collection: COLLECTIONS.primitives };
  }
  if (collectionSegment === "semantic" || collectionSegment === "components") {
    return { ref, collection: COLLECTIONS.colorModes };
  }
  throw new Error(`Collection alias non supportee dans TokenBundle: ${collectionSegment}`);
}

function bundleValueToRuntimeTokenValue(value: string | number | { alias: string }): RuntimeTokenValue {
  if (value && typeof value === "object" && "alias" in value) {
    const mapped = mapBundleAlias(String(value.alias || ""));
    return alias(mapped.ref, mapped.collection);
  }
  return raw(value as string | number);
}

function toVariableType(value: string): VariableType {
  if (value === "FLOAT" || value === "STRING") return value;
  return "COLOR";
}

function sanitizeBundleScopes(scopes: string[] | undefined, tokenName: string): VariableScope[] {
  if (!Array.isArray(scopes) || !scopes.length) {
    return semanticScopes(tokenName);
  }
  const allowed = new Set<VariableScope>([
    "ALL_SCOPES",
    "TEXT_CONTENT",
    "ALL_FILLS",
    "FRAME_FILL",
    "SHAPE_FILL",
    "TEXT_FILL",
    "STROKE_COLOR",
    "EFFECT_FLOAT",
    "EFFECT_COLOR",
    "FONT_SIZE",
    "LINE_HEIGHT",
    "LETTER_SPACING",
    "PARAGRAPH_SPACING",
    "PARAGRAPH_INDENT",
    "FONT_FAMILY",
    "FONT_STYLE",
    "FONT_WEIGHT",
    "OPACITY",
    "WIDTH_HEIGHT",
    "GAP",
    "STROKE_FLOAT",
    "CORNER_RADIUS",
  ]);

  const scoped = scopes
    .map((scope) => String(scope || "").trim())
    .filter((scope): scope is VariableScope => allowed.has(scope as VariableScope));
  return scoped.length ? scoped : semanticScopes(tokenName);
}

function buildColorModeTokensFromBundle(bundle: TokenBundle): TokenDefinition[] {
  const semanticEntries = Array.isArray(bundle.collections.semantic) ? bundle.collections.semantic : [];
  return semanticEntries.map((entry: TokenBundleEntry) => ({
    collection: COLLECTIONS.colorModes,
    name: entry.name,
    type: toVariableType(entry.type),
    scopes: sanitizeBundleScopes(entry.scopes, entry.name),
    modeValues: {
      light: bundleValueToRuntimeTokenValue(entry.values.light),
      dark: bundleValueToRuntimeTokenValue(entry.values.dark),
    },
  }));
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
  value: RuntimeTokenValue,
): TokenDefinition {
  return {
    collection,
    name,
    type,
    scopes,
    value,
  };
}

function normalizePaletteKey(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createModeToken(
  collection: CollectionName,
  name: string,
  type: VariableType,
  scopes: VariableScope[],
  modeValues: Partial<Record<RuntimeModeName, RuntimeTokenValue>>,
): TokenDefinition {
  return {
    collection,
    name,
    type,
    scopes,
    modeValues,
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

const DARK_INTENT_STEP_MAP_BG: Record<number, number> = {
  50: 100,
  100: 200,
  200: 300,
  300: 400,
  400: 500,
  500: 600,
  600: 700,
  700: 800,
  800: 900,
  900: 950,
  950: 1000,
  1000: 1100,
  1100: 1100,
};

const DARK_INTENT_STEP_MAP_FG: Record<number, number> = {
  50: 50,
  100: 50,
  200: 100,
  300: 200,
  400: 300,
  500: 400,
  600: 400,
  700: 500,
  800: 600,
  900: 700,
  950: 800,
  1000: 900,
  1100: 1000,
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

function colorModeFamilyFromTokenName(tokenName: string): ColorModesFamily | null {
  const family = tokenName.split("/")[0];
  if (family === "bg" || family === "text" || family === "icon" || family === "border") {
    return family;
  }
  return null;
}

function remapIntentStepForDark(step: number, family: ColorModesFamily): string {
  const table = family === "bg" ? DARK_INTENT_STEP_MAP_BG : DARK_INTENT_STEP_MAP_FG;
  if (table[step] !== undefined) {
    return String(table[step]);
  }

  const fallback = family === "bg" ? step + 100 : (step >= 550 ? step - 200 : step - 100);
  return String(Math.max(50, Math.min(1100, fallback)));
}

function resolveDarkStepForPalette(
  preset: PresetDefinition,
  paletteName: string,
  step: string,
  shadeSteps: number[],
): string {
  if (paletteName === "brand") {
    const numeric = parsePresetNumericStep(step);
    const target = numeric === null ? 500 : numeric;
    return String(closestStep(shadeSteps, target));
  }
  return resolveClosestPaletteStep(preset, paletteName, step);
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
  shadeSteps: number[],
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
  const paletteName = neutralMatch[1];
  const sourceStep = neutralMatch[2];

  if (paletteName !== neutralPalette) {
    const family = colorModeFamilyFromTokenName(tokenName);
    const isIntentOrAccent = Boolean(extractIntentFromTokenName(tokenName)) || isAccentToken(tokenName);
    if (!family || !isIntentOrAccent) return pluginReference;

    const stepNumeric = parsePresetNumericStep(sourceStep);
    if (stepNumeric === null) return pluginReference;

    const darkTarget = remapIntentStepForDark(stepNumeric, family);
    const darkStep = resolveDarkStepForPalette(preset, paletteName, darkTarget, shadeSteps);
    return `colors/${paletteName}/${darkStep}`;
  }

  const darkStep = remapNeutralStepForDarkFallback(preset, neutralPalette, sourceStep);
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
    return uiMode === "dark" ? applyDarkModeTransformForReference(tokenName, resolved, neutralPalette, preset, shadeSteps) : resolved;
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
  return applyDarkModeTransformForReference(tokenName, resolved, neutralPalette, preset, shadeSteps);
}

function createEmptyColorModes(): ColorModesTemplate {
  return {
    bg: {},
    text: {},
    icon: {},
    border: {},
  };
}

function normalizeSemanticOverridesInput(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const normalized: Record<string, string> = {};
  for (const [tokenName, rawReference] of Object.entries(value as Record<string, unknown>)) {
    const cleanTokenName = String(tokenName || "").trim().toLowerCase();
    const cleanReference = String(rawReference || "").trim();
    if (!cleanTokenName || !cleanReference) continue;
    if (!cleanReference.startsWith("{") || !cleanReference.endsWith("}")) continue;
    normalized[cleanTokenName] = cleanReference;
  }
  return normalized;
}

function generateColorModesTokens(
  uiMode: UiMode,
  preset: PresetDefinition,
  neutralChoice: string,
  shadeSteps: number[],
  useBrandForAccent: boolean,
  semanticOverrides: Record<string, string> = {},
): ColorModesTemplate {
  const neutralPalette = preset.palettes[neutralChoice] ? neutralChoice : preset.defaultNeutral;
  const generated = createEmptyColorModes();

  for (const family of COLOR_MODE_FAMILIES) {
    const templateEntries = KIGEN_COLOR_MODES_TEMPLATE[family];
    for (const [key, kigenRef] of Object.entries(templateEntries)) {
      const tokenName = `${family}/${key}`;
      const overrideReference = semanticOverrides[tokenName];
      generated[family][key] = convertKigenReferenceToPluginRef(
        tokenName,
        overrideReference || kigenRef,
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
  semanticOverrides: Record<string, string> = {},
): { tokens: TokenDefinition[]; missing: string[] } {
  if (uiMode === "both") {
    const generatedLight = generateColorModesTokens("light", preset, neutralChoice, shadeSteps, useBrandForAccent, semanticOverrides);
    const generatedDark = generateColorModesTokens("dark", preset, neutralChoice, shadeSteps, useBrandForAccent, semanticOverrides);
    const missing = Array.from(
      new Set([...compareColorModesStructure(generatedLight), ...compareColorModesStructure(generatedDark)]),
    );
    const tokens: TokenDefinition[] = [];

    for (const family of COLOR_MODE_FAMILIES) {
      const lightEntries = generatedLight[family];
      const darkEntries = generatedDark[family];

      for (const key of Object.keys(KIGEN_COLOR_MODES_TEMPLATE[family])) {
        const tokenName = `${family}/${key}`;
        const lightRef = lightEntries[key];
        const darkRef = darkEntries[key];
        if (!lightRef || !darkRef) continue;

        tokens.push(
          createModeToken(COLLECTIONS.colorModes, tokenName, "COLOR", semanticScopes(tokenName), {
            light: alias(lightRef, COLLECTIONS.primitives),
            dark: alias(darkRef, COLLECTIONS.primitives),
          }),
        );
      }
    }

    for (const [legacyName, sourceName] of LEGACY_COLOR_MODE_ALIASES) {
      tokens.push(
        createModeToken(COLLECTIONS.colorModes, legacyName, "COLOR", semanticScopes(legacyName), {
          light: alias(sourceName, COLLECTIONS.colorModes),
          dark: alias(sourceName, COLLECTIONS.colorModes),
        }),
      );
    }

    return { tokens, missing };
  }

  const generated = generateColorModesTokens(uiMode, preset, neutralChoice, shadeSteps, useBrandForAccent, semanticOverrides);
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
  const isBlocked = (value: string): boolean => reserved.has(value) || /^brand-\d+$/i.test(value);
  while (isBlocked(candidate) && i < 1000) {
    candidate = `${base}-token-${i}`;
    i += 1;
  }
  if (isBlocked(candidate)) {
    candidate = "brand-primary";
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
    prepared.push({ name: "brand-primary", color: DEFAULT_BRAND, scale: undefined });
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
  const lineHeights = options.typography.lineHeights && typeof options.typography.lineHeights === "object"
    ? { ...resolveTypographyLineHeights(fontSizes), ...options.typography.lineHeights }
    : resolveTypographyLineHeights(fontSizes);
  const letterSpacings = options.typography.letterSpacings && typeof options.typography.letterSpacings === "object"
    ? { ...DEFAULT_LETTER_SPACINGS, ...options.typography.letterSpacings }
    : { ...DEFAULT_LETTER_SPACINGS };
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

  for (const sizeKey of orderedTypographySizeKeys(letterSpacings)) {
    const value = Number(letterSpacings[sizeKey]);
    if (!Number.isFinite(value)) continue;
    tokens.push(createToken(COLLECTIONS.typography, `letter-spacing/${sizeKey}`, "FLOAT", ["FONT_SIZE"], raw(value)));
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
  const selectedPaletteSet =
    Array.isArray(options.selectedPalettes) && options.selectedPalettes.length
      ? new Set(options.selectedPalettes.map((palette) => normalizePaletteKey(palette)))
      : null;
  if (selectedPaletteSet && options.neutralChoice) {
    selectedPaletteSet.add(normalizePaletteKey(options.neutralChoice));
  }

  tokens.push(createToken(COLLECTIONS.primitives, "colors/base/white", "COLOR", ["ALL_SCOPES"], raw(options.baseWhite)));
  tokens.push(createToken(COLLECTIONS.primitives, "colors/base/black", "COLOR", ["ALL_SCOPES"], raw(options.baseBlack)));

  for (const [paletteName, palette] of Object.entries(preset.palettes)) {
    const paletteKey = normalizePaletteKey(paletteName);
    if (selectedPaletteSet && !selectedPaletteSet.has(paletteKey)) continue;
    const overridesByStep = options.paletteOverrides?.[paletteKey] ?? options.paletteOverrides?.[paletteName] ?? {};
    for (const step of presetSteps) {
      const value = overridesByStep[step] || palette[step];
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
  if (value === "dark") return "dark";
  if (value === "both") return "both";
  return "light";
}

function normalizeNamingPattern(value: unknown): NamingPattern {
  return value === "hundreds" ? "hundreds" : "tailwind";
}

function normalizeTokenBundleInput(value: unknown): TokenBundle | undefined {
  if (!value) return undefined;
  const validation = validateTokenBundle(value);
  if (!validation.valid) {
    throw new Error(`TokenBundle invalide: ${validation.errors.join(" | ")}`);
  }
  return normalizeTokenBundle(value) as TokenBundle;
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
  const tokenBundle = normalizeTokenBundleInput((input as { tokenBundle?: unknown }).tokenBundle);

  const baseWhite = String(input.baseWhite || DEFAULT_BASE_WHITE).trim();
  const baseBlack = String(input.baseBlack || DEFAULT_BASE_BLACK).trim();
  parseColorInput(baseWhite);
  parseColorInput(baseBlack);

  const candidateNeutral = String(input.neutralChoice || preset.defaultNeutral).trim().toLowerCase();
  const neutralChoice = preset.neutralOptions.includes(candidateNeutral) ? candidateNeutral : preset.defaultNeutral;

  const rawBrandsInput = Array.isArray(input.brands) ? input.brands : [];
  const selectedPalettesInput = Array.isArray((input as { selectedPalettes?: unknown }).selectedPalettes)
    ? ((input as { selectedPalettes?: unknown[] }).selectedPalettes ?? [])
    : [];
  const selectedPalettes = selectedPalettesInput
    .map((entry) => normalizePaletteKey(String(entry || "")))
    .filter(Boolean);

  const paletteOverridesInput = (input as { paletteOverrides?: unknown }).paletteOverrides;
  const paletteOverrides: Record<string, Record<string, string>> = {};
  if (paletteOverridesInput && typeof paletteOverridesInput === "object") {
    for (const [paletteName, stepValues] of Object.entries(paletteOverridesInput as Record<string, unknown>)) {
      if (!stepValues || typeof stepValues !== "object") continue;
      const normalizedPalette = normalizePaletteKey(paletteName);
      if (!normalizedPalette) continue;
      const overridesForPalette: Record<string, string> = {};
      for (const [step, rawValue] of Object.entries(stepValues as Record<string, unknown>)) {
        if (typeof rawValue !== "string") continue;
        const value = rawValue.trim();
        if (!value) continue;
        try {
          parseColorInput(value);
          overridesForPalette[String(step)] = value;
        } catch (_error) {
          // Ignore invalid override values from UI payload.
        }
      }
      if (Object.keys(overridesForPalette).length) {
        paletteOverrides[normalizedPalette] = overridesForPalette;
      }
    }
  }
  const semanticOverrides = normalizeSemanticOverridesInput((input as { semanticOverrides?: unknown }).semanticOverrides);
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
    brands.push({ name: "brand-primary", color: DEFAULT_BRAND, contrast: undefined, scale: undefined });
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
    for (const key of Object.keys(DEFAULT_FONT_SIZES)) {
      const candidate = Number(inputTypography.fontSizes[key]);
      if (Number.isFinite(candidate) && candidate > 0) {
        fontSizes[key] = candidate;
      }
    }
  }

  const lineHeights = { ...DEFAULT_LINE_HEIGHTS };
  if (inputTypography && inputTypography.lineHeights && typeof inputTypography.lineHeights === "object") {
    for (const key of Object.keys(DEFAULT_LINE_HEIGHTS)) {
      const candidate = Number(inputTypography.lineHeights[key]);
      if (Number.isFinite(candidate) && candidate > 0) {
        lineHeights[key] = candidate;
      }
    }
  }

  const letterSpacings = { ...DEFAULT_LETTER_SPACINGS };
  if (inputTypography && inputTypography.letterSpacings && typeof inputTypography.letterSpacings === "object") {
    for (const key of Object.keys(DEFAULT_LETTER_SPACINGS)) {
      const candidate = Number(inputTypography.letterSpacings[key]);
      if (Number.isFinite(candidate)) {
        letterSpacings[key] = candidate;
      }
    }
  }

  const styleFamilies =
    inputTypography && inputTypography.styleFamilies && typeof inputTypography.styleFamilies === "object"
      ? Object.entries(inputTypography.styleFamilies).reduce<Record<string, string>>((acc, [key, value]) => {
          const cleanKey = String(key || "").trim();
          const cleanValue = String(value || "").trim();
          if (cleanKey && cleanValue) acc[cleanKey] = cleanValue;
          return acc;
        }, {})
      : {};
  const styleWeights =
    inputTypography && inputTypography.styleWeights && typeof inputTypography.styleWeights === "object"
      ? Object.entries(inputTypography.styleWeights).reduce<Record<string, string[]>>((acc, [key, value]) => {
          if (!Array.isArray(value)) return acc;
          const cleanKey = String(key || "").trim();
          const cleanValues = value.map((entry) => String(entry || "").trim()).filter(Boolean);
          if (cleanKey && cleanValues.length) acc[cleanKey] = cleanValues;
          return acc;
        }, {})
      : {};

  const inputIcons = input.icons && typeof input.icons === "object" ? input.icons : undefined;
  const iconLibrary =
    inputIcons && typeof inputIcons.library === "string" && inputIcons.library.trim().length
      ? inputIcons.library.trim()
      : DEFAULT_ICON_LIBRARY;
  const includeStarterPack = !(inputIcons && inputIcons.includeStarterPack === false);
  const iconPacks = Array.isArray(inputIcons?.packs)
    ? inputIcons!.packs
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
    : [...DEFAULT_ICON_PACKS];
  const iconSizeCandidate = Number(inputIcons?.size);
  const iconSize = Number.isFinite(iconSizeCandidate) && iconSizeCandidate >= 12 && iconSizeCandidate <= 64 ? Math.round(iconSizeCandidate) : DEFAULT_ICON_SIZE;
  const iconColorAlias =
    inputIcons && typeof inputIcons.colorAlias === "string" && inputIcons.colorAlias.trim().length
      ? inputIcons.colorAlias.trim().toLowerCase()
      : DEFAULT_ICON_COLOR_ALIAS;
  const iconStroke = normalizeIconStrokeId(inputIcons?.stroke);

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
    selectedPalettes,
    paletteOverrides,
    semanticOverrides,
    tokenBundle,
    icons: {
      library: iconLibrary,
      includeStarterPack,
      packs: iconPacks,
      size: iconSize,
      colorAlias: iconColorAlias,
      stroke: iconStroke,
    },
    typography: {
      displayFamily,
      bodyFamily,
      fontSizes,
      lineHeights,
      letterSpacings,
      styleFamilies,
      styleWeights,
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

function ensureCollectionModes(
  collection: VariableCollection,
  requestedModes: RuntimeModeName[],
  report: GenerationReport,
): Partial<Record<RuntimeModeName, string>> {
  const desired = Array.from(new Set(requestedModes));
  let modeMap = buildModeMap(collection);

  for (const name of desired) {
    if (!modeMap[name]) {
      collection.addMode(name);
      report.migrations.push(`Mode ajoute (${collection.name}): ${name}`);
      modeMap = buildModeMap(collection);
    }
  }

  for (const mode of [...collection.modes]) {
    if (desired.includes(mode.name as RuntimeModeName)) continue;
    if (collection.modes.length > desired.length) {
      collection.removeMode(mode.modeId);
      report.migrations.push(`Mode supprime (${collection.name}): ${mode.name}`);
    }
  }

  modeMap = buildModeMap(collection);
  if (desired.length === 1 && !modeMap[desired[0]] && collection.modes.length === 1) {
    const previous = collection.modes[0].name;
    collection.renameMode(collection.modes[0].modeId, desired[0]);
    report.migrations.push(`Mode renomme (${collection.name}): ${previous} -> ${desired[0]}`);
    modeMap = buildModeMap(collection);
  }

  for (const name of desired) {
    if (!modeMap[name]) {
      collection.addMode(name);
      report.migrations.push(`Mode ajoute (${collection.name}): ${name}`);
      modeMap = buildModeMap(collection);
    }
  }

  const resolved: Partial<Record<RuntimeModeName, string>> = {};
  for (const name of desired) {
    if (!modeMap[name]) {
      throw new Error(`Impossible de definir le mode ${name} pour ${collection.name}`);
    }
    resolved[name] = modeMap[name];
  }
  return resolved;
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
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
    await withTimeout(figma.loadFontAsync(fontName), 10000, `loadFontAsync ${fontName.family}/${fontName.style}`);
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

function resolveTemplateLineHeight(template: TextStyleTemplateEntry, options: GenerationOptions, fontSize: number): number {
  const candidate = Number(options.typography.lineHeights?.[template.sizeToken]);
  if (Number.isFinite(candidate) && candidate > 0) return candidate;
  return roundTo(fontSize * template.lineHeightRatio);
}

function resolveTemplateLetterSpacing(template: TextStyleTemplateEntry, options: GenerationOptions): number {
  const candidate = Number(options.typography.letterSpacings?.[template.sizeToken]);
  if (Number.isFinite(candidate)) return candidate;
  return template.letterSpacingValue;
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
  progress?: (message: string) => void,
): Promise<void> {
  if (!TEXT_STYLE_TEMPLATES.length) {
    report.warnings.push("No typography style templates available.");
    return;
  }
  if (!typographyCollection) {
    report.warnings.push("Typography binding skipped: typography collection unavailable.");
    return;
  }

  progress?.("Typography: chargement des polices...");
  let availableFonts: Font[] = [];
  try {
    availableFonts = await withTimeout(figma.listAvailableFontsAsync(), 15000, "listAvailableFontsAsync");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    report.warnings.push(`Typography skipped: ${message}`);
    report.migrations.push("Text styles skipped (polices indisponibles ou timeout).");
    return;
  }
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
    const preferredFamily =
      options.typography.styleFamilies?.[template.sizeToken] ||
      (template.familyKind === "display" ? options.typography.displayFamily : options.typography.bodyFamily);
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
    style.lineHeight = { unit: "PIXELS", value: resolveTemplateLineHeight(template, options, fontSize) };
    style.letterSpacing =
      template.letterSpacingUnit === "PERCENT"
        ? { unit: "PERCENT", value: template.letterSpacingValue }
        : { unit: "PIXELS", value: resolveTemplateLetterSpacing(template, options) };
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

async function applyGeneration(options: GenerationOptions, progress?: (message: string) => void): Promise<GenerationReport> {
  const totalStart = Date.now();
  const preset = getPresetById(options.presetId);
  if (!preset) throw new Error(`Preset inconnu: ${options.presetId}`);

  progress?.("Préparation des tokens...");
  const tokenPhaseStart = Date.now();
  const shadeSteps = deriveShadeSteps(options.namingPattern, options.shadeCount);
  const baseStep = resolveBaseStep(shadeSteps);
  const brands = normalizeBrands(options.brands, preset, shadeSteps, baseStep);

  const tokens: TokenDefinition[] = [];
  tokens.push(...buildPrimitiveTokens(options, preset, brands, shadeSteps));
  tokens.push(...buildTypographyTokens(options));
  tokens.push(...buildSpacingTokens());
  tokens.push(...buildRadiusTokens());
  let bundleColorModeTokens: TokenDefinition[] = [];
  let colorModesResult: { tokens: TokenDefinition[]; missing: string[] } | null = null;
  if (options.tokenLevel === "color-modes") {
    if (options.tokenBundle) {
      bundleColorModeTokens = buildColorModeTokensFromBundle(options.tokenBundle);
      tokens.push(...bundleColorModeTokens);
    } else {
      colorModesResult = buildColorModeTokens(
        options.uiMode,
        preset,
        options.neutralChoice,
        shadeSteps,
        options.hasCustomBrand,
        options.semanticOverrides,
      );
      tokens.push(...colorModesResult.tokens);
    }
  }
  const tokenPhaseMs = Date.now() - tokenPhaseStart;
  progress?.(`Tokens préparés (${tokens.length}).`);

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

  if (bundleColorModeTokens.length) {
    report.migrations.push(`TokenBundle semantic branche: ${bundleColorModeTokens.length} tokens utilises.`);
  } else if (colorModesResult?.missing.length) {
    for (const tokenName of colorModesResult.missing) {
      const message = `Color modes token missing from generated structure: ${tokenName}`;
      report.warnings.push(message);
      console.warn(`[ombrstudio] ${message}`);
    }
  } else if (colorModesResult) {
    console.log("[ombrstudio] Color modes structure check: OK");
  }

  const localCollections = figma.variables.getLocalVariableCollections();
  const collectionsByName = new Map<CollectionName, VariableCollection>();
  for (const name of targetCollections) {
    collectionsByName.set(name, resolveCollection(name, localCollections, report));
  }

  const modeIdsByCollection = new Map<CollectionName, Partial<Record<RuntimeModeName, string>>>();
  for (const [name, collection] of collectionsByName.entries()) {
    const desiredModes: RuntimeModeName[] =
      name === COLLECTIONS.colorModes && (bundleColorModeTokens.length > 0 || options.uiMode === "both")
        ? ["light", "dark"]
        : ["default"];
    modeIdsByCollection.set(name, ensureCollectionModes(collection, desiredModes, report));
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
  let processedTokens = 0;
  progress?.("Écriture des variables...");
  const writePhaseStart = Date.now();
  for (const token of tokens) {
    const collection = collectionsByName.get(token.collection);
    if (!collection) continue;

    const variable = upsertVariable(collection, token.name, token.type, variableIndex, report);
    if (!variable) continue;
    variable.scopes = sanitizeScopes(token.scopes);

    const modeMap = modeIdsByCollection.get(token.collection);
    if (!modeMap) {
      report.warnings.push(`Mode map missing for ${collection.name}/${token.name}`);
      continue;
    }

    const resolvedModeValues: Array<[RuntimeModeName, RuntimeTokenValue]> = [];
    if (token.modeValues && Object.keys(token.modeValues).length) {
      for (const [modeName, modeValue] of Object.entries(token.modeValues) as Array<[RuntimeModeName, RuntimeTokenValue]>) {
        if (!modeValue) continue;
        resolvedModeValues.push([modeName, modeValue]);
      }
    } else if (token.value) {
      resolvedModeValues.push(["default", token.value]);
    } else {
      report.warnings.push(`Aucune valeur pour token: ${collection.name}/${token.name}`);
      continue;
    }

    for (const [modeName, tokenValue] of resolvedModeValues) {
      const modeId =
        modeMap[modeName] ??
        modeMap.default ??
        modeMap.light ??
        modeMap.dark;
      if (!modeId) {
        report.warnings.push(`Mode missing for ${collection.name}/${token.name} (${modeName})`);
        continue;
      }

      if (tokenValue.kind === "raw") {
        setRawValue(variable, modeId, token.type, tokenValue.value);
      } else {
        pendingAliases.push({
          variable,
          modeId,
          ref: tokenValue.ref,
          sourceCollectionId: collection.id,
          targetCollection: tokenValue.collection,
        });
      }
    }

    addAliasEntry(aliasIndex, variable);
    processedTokens += 1;
    if (progress && processedTokens % 250 === 0) {
      progress(`Écriture des variables... ${processedTokens}/${tokens.length}`);
    }
  }
  const writePhaseMs = Date.now() - writePhaseStart;

  progress?.("Résolution des alias...");
  const aliasPhaseStart = Date.now();
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
  const aliasPhaseMs = Date.now() - aliasPhaseStart;

  const typographyPhaseStart = Date.now();
  if (options.createTextStyles) {
    await applyTypographyTextStyles(options, report, collectionsByName.get(COLLECTIONS.typography) ?? null, variableIndex, progress);
  } else {
    report.migrations.push("Text styles skipped by user option.");
  }
  const typographyPhaseMs = Date.now() - typographyPhaseStart;
  const iconsPhaseStart = Date.now();
  await importIconLibraryStarterPack(
    options,
    report,
    preset,
    brands,
    shadeSteps,
    collectionsByName.get(COLLECTIONS.colorModes) ?? colorModesCleanupCollection ?? null,
    variableIndex,
    progress,
  );
  const iconsPhaseMs = Date.now() - iconsPhaseStart;
  const totalMs = Date.now() - totalStart;
  report.migrations.push(
    `Timing(ms): tokens=${tokenPhaseMs}, write=${writePhaseMs}, alias=${aliasPhaseMs}, typography=${typographyPhaseMs}, icons=${iconsPhaseMs}, total=${totalMs}`,
  );
  progress?.("Finalisation...");
  return report;
}

function compactReportForUi(report: GenerationReport): GenerationReport {
  const clampMessages = (items: string[], label: string): string[] => {
    const MAX_ITEMS = 120;
    if (!Array.isArray(items) || items.length <= MAX_ITEMS) return Array.isArray(items) ? items : [];
    const hidden = items.length - MAX_ITEMS;
    return [...items.slice(0, MAX_ITEMS), `... ${hidden} ${label} supplémentaires`];
  };

  return {
    ...report,
    warnings: clampMessages(report.warnings, "warnings"),
    migrations: clampMessages(report.migrations, "migrations"),
    collections: Array.isArray(report.collections) ? report.collections.slice(0, 32) : [],
  };
}

function normalizeIconLibraryId(input: string | undefined): IconLibraryId {
  const value = String(input || "").trim().toLowerCase();
  if (value === "tabler" || value === "phosphor" || value === "iconoir") return value;
  return "lucide";
}

function normalizeIconStrokeId(input: unknown): IconStrokeId {
  const value = String(input || "").trim().toLowerCase();
  if (value === "light" || value === "regular" || value === "bold") return value;
  return "medium";
}

function normalizeIconPackIds(input: string[] | undefined): IconPackId[] {
  if (!Array.isArray(input)) return [];
  const valid = new Set<IconPackId>(["navigation", "actions", "status-feedback", "files-folders"]);
  return Array.from(
    new Set(
      input
        .map((entry) => String(entry || "").trim() as IconPackId)
        .filter((entry): entry is IconPackId => valid.has(entry)),
    ),
  );
}

function resolveRequestedIconIds(
  library: IconLibraryId,
  includeStarterPack: boolean,
  packs: IconPackId[],
): Array<{ id: StarterIconId; sourceName: string }> {
  const ordered: StarterIconId[] = [];
  ordered.push(...STARTER_ICON_PACK);
  const requiredPacks: IconPackId[] = ["navigation", "actions", "status-feedback", "files-folders"];
  for (const packId of requiredPacks) {
    ordered.push(...ICON_PACK_DEFINITIONS[packId]);
  }

  const unique = Array.from(new Set(ordered));
  return unique
    .map((id) => ({
      id,
      sourceName: ICON_LIBRARY_NAME_MAP[library][id],
    }))
    .filter((entry) => Boolean(entry.sourceName));
}

async function fetchIconSvg(library: IconLibraryId, sourceName: string): Promise<string> {
  const url = ICON_LIBRARY_CONFIG[library].buildUrl(sourceName);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Impossible de charger ${sourceName} (${library}) [${response.status}]`);
  }
  return await response.text();
}

function ensureIconsPage(report: GenerationReport): PageNode {
  const existing = figma.root.children.find((node): node is PageNode => node.type === "PAGE" && node.name === ICONS_PAGE_NAME);
  if (existing) {
    return existing;
  }
  const legacy = figma.root.children.find((node): node is PageNode => node.type === "PAGE" && node.name === LEGACY_ICONS_PAGE_NAME);
  if (legacy) {
    legacy.name = ICONS_PAGE_NAME;
    report.migrations.push(`Page renommée: ${LEGACY_ICONS_PAGE_NAME} -> ${ICONS_PAGE_NAME}`);
    return legacy;
  }
  const page = figma.createPage();
  page.name = ICONS_PAGE_NAME;
  report.migrations.push(`Page créée: ${ICONS_PAGE_NAME}`);
  return page;
}

function centerNodeInComponent(component: ComponentNode, node: SceneNode): void {
  node.x = (component.width - node.width) / 2;
  node.y = (component.height - node.height) / 2;
}

function normalizeSvgIconMarkup(svg: string, size: number, strokeWidth: number, color: string): string {
  const safeSize = Math.max(12, Math.min(64, Math.round(size || DEFAULT_ICON_SIZE)));
  const safeStroke = Math.max(1, Math.min(4, Number(strokeWidth) || ICON_STROKE_WIDTHS.medium));
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : "#171717";
  return String(svg || "")
    .replace(/\bwidth="[^"]*"/i, `width="${safeSize}"`)
    .replace(/\bheight="[^"]*"/i, `height="${safeSize}"`)
    .replace(/\bstroke-width="[^"]*"/gi, `stroke-width="${safeStroke}"`)
    .replace(/\bstroke="currentColor"/gi, `stroke="${safeColor}"`)
    .replace(/\bfill="currentColor"/gi, `fill="${safeColor}"`);
}

function resolvePrimitiveColor(options: GenerationOptions, preset: PresetDefinition, brands: NormalizedBrand[], shadeSteps: number[]): string {
  const tokenName = resolveIconSemanticTokenName(options.icons?.colorAlias);
  const key = tokenName.startsWith("icon/") ? tokenName.slice("icon/".length) : "primary";
  const kigenRef = KIGEN_COLOR_MODES_TEMPLATE.icon[key] || KIGEN_COLOR_MODES_TEMPLATE.icon.primary;
  const neutralPalette = preset.palettes[options.neutralChoice] ? options.neutralChoice : preset.defaultNeutral;
  const primitiveRef = convertKigenReferenceToPluginRef(
    `icon/${key}`,
    options.semanticOverrides?.[`icon/${key}`] || kigenRef,
    options.uiMode === "dark" ? "dark" : "light",
    preset,
    neutralPalette,
    shadeSteps,
    brands.length > 0,
  );
  const segments = primitiveRef.split("/").filter(Boolean);
  if (segments[0] !== "colors") return "#171717";
  if (segments[1] === "base") {
    if (segments[2] === "white") return options.baseWhite;
    if (segments[2] === "black") return options.baseBlack;
  }
  if (segments[1] === "brand") {
    const step = Number(segments[2] || 500);
    const brand = brands[0];
    return brand?.scale[step] || brand?.baseColor || DEFAULT_BASE_BLACK;
  }
  const palette = preset.palettes[segments[1]];
  const value = palette?.[segments[2]];
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_BASE_BLACK;
}

function resolveIconSemanticTokenName(input: unknown): string {
  const value = String(input || DEFAULT_ICON_COLOR_ALIAS)
    .trim()
    .toLowerCase()
    .replace(/^\{/, "")
    .replace(/\}$/, "")
    .replace(/\./g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\//, "")
    .replace(/\/$/, "");

  if (value.startsWith("semantic/icon/")) return value.slice("semantic/".length);
  if (value.startsWith("icon/")) return value;
  const key = value.split("/").filter(Boolean).pop() || "primary";
  return `icon/${key}`;
}

function resolveIconSemanticVariable(
  colorModesCollection: VariableCollection | null,
  variableIndex: Map<string, Variable>,
  colorAlias: unknown,
): { tokenName: string; variable: Variable | null } {
  const tokenName = resolveIconSemanticTokenName(colorAlias);
  if (!colorModesCollection) return { tokenName, variable: null };

  const direct = getVariableFromIndex(variableIndex, colorModesCollection.id, tokenName);
  if (direct?.resolvedType === "COLOR") return { tokenName, variable: direct };

  const lookup = normalizeLookup(tokenName);
  for (const variable of variableIndex.values()) {
    if (
      variable.variableCollectionId === colorModesCollection.id &&
      variable.resolvedType === "COLOR" &&
      normalizeLookup(variable.name) === lookup
    ) {
      return { tokenName, variable };
    }
  }

  return { tokenName, variable: null };
}

type IconPaintBindingStats = {
  nodesVisited: number;
  fillPaintsBound: number;
  strokePaintsBound: number;
  bindFailures: number;
};

type IconStrokeWeightStats = {
  nodesVisited: number;
  nodesUpdated: number;
  updateFailures: number;
};

function isSolidVisiblePaint(paint: Paint): paint is SolidPaint {
  return paint.type === "SOLID" && paint.visible !== false;
}

function hasVisibleStrokePaints(paints: ReadonlyArray<Paint>): boolean {
  return paints.some((paint) => paint.visible !== false);
}

function bindPaintsToIconVariable(
  paints: ReadonlyArray<Paint> | PluginAPI["mixed"],
  variable: Variable,
  fallbackColor: RGBA,
): { paints: ReadonlyArray<Paint> | PluginAPI["mixed"]; bound: number; failures: number } {
  if (paints === figma.mixed || !Array.isArray(paints) || paints.length === 0) {
    return { paints, bound: 0, failures: 0 };
  }

  let bound = 0;
  let failures = 0;
  const nextPaints = paints.map((paint) => {
    if (!isSolidVisiblePaint(paint)) return paint;

    const fallbackPaint: SolidPaint = {
      ...paint,
      color: { r: fallbackColor.r, g: fallbackColor.g, b: fallbackColor.b },
      opacity: fallbackColor.a < 1 ? fallbackColor.a : paint.opacity,
    };

    try {
      const boundPaint = figma.variables.setBoundVariableForPaint(fallbackPaint, "color", variable);
      bound += 1;
      return boundPaint;
    } catch (_error) {
      failures += 1;
      return fallbackPaint;
    }
  });

  return { paints: nextPaints, bound, failures };
}

function applyIconVariableBinding(node: SceneNode, variable: Variable, fallbackHex: string): IconPaintBindingStats {
  const fallbackColor = parseColorInput(fallbackHex);
  const stats: IconPaintBindingStats = {
    nodesVisited: 0,
    fillPaintsBound: 0,
    strokePaintsBound: 0,
    bindFailures: 0,
  };

  const visit = (current: SceneNode): void => {
    stats.nodesVisited += 1;

    if ("fills" in current) {
      const result = bindPaintsToIconVariable(current.fills, variable, fallbackColor);
      if (result.paints !== current.fills) {
        current.fills = result.paints;
      }
      stats.fillPaintsBound += result.bound;
      stats.bindFailures += result.failures;
    }

    if ("strokes" in current) {
      const result = bindPaintsToIconVariable(current.strokes, variable, fallbackColor);
      if (result.paints !== figma.mixed) {
        current.strokes = result.paints;
      }
      stats.strokePaintsBound += result.bound;
      stats.bindFailures += result.failures;
    }

    if ("children" in current) {
      for (const child of current.children) {
        visit(child);
      }
    }
  };

  visit(node);
  return stats;
}

function applyIconStrokeWeight(node: SceneNode, strokeWidth: number): IconStrokeWeightStats {
  const safeStroke = Math.max(1, Math.min(4, Number(strokeWidth) || ICON_STROKE_WIDTHS.medium));
  const stats: IconStrokeWeightStats = {
    nodesVisited: 0,
    nodesUpdated: 0,
    updateFailures: 0,
  };

  const visit = (current: SceneNode): void => {
    stats.nodesVisited += 1;

    if ("strokes" in current && "strokeWeight" in current && Array.isArray(current.strokes) && hasVisibleStrokePaints(current.strokes)) {
      try {
        current.strokeWeight = safeStroke;
        stats.nodesUpdated += 1;
      } catch (_error) {
        stats.updateFailures += 1;
      }
    }

    if ("children" in current) {
      for (const child of current.children) {
        visit(child);
      }
    }
  };

  visit(node);
  return stats;
}

function addIconBindingStats(total: IconPaintBindingStats, current: IconPaintBindingStats): void {
  total.nodesVisited += current.nodesVisited;
  total.fillPaintsBound += current.fillPaintsBound;
  total.strokePaintsBound += current.strokePaintsBound;
  total.bindFailures += current.bindFailures;
}

function addIconStrokeWeightStats(total: IconStrokeWeightStats, current: IconStrokeWeightStats): void {
  total.nodesVisited += current.nodesVisited;
  total.nodesUpdated += current.nodesUpdated;
  total.updateFailures += current.updateFailures;
}

function createIconComponentFromSvg(
  svg: string,
  componentName: string,
  size: number,
  strokeWidth: number,
  color: string,
  colorVariable: Variable | null,
): { component: ComponentNode; bindingStats: IconPaintBindingStats | null; strokeWeightStats: IconStrokeWeightStats } {
  const safeSize = Math.max(12, Math.min(64, Math.round(size || DEFAULT_ICON_SIZE)));
  const imported = figma.createNodeFromSvg(normalizeSvgIconMarkup(svg, safeSize, strokeWidth, color));
  const component = figma.createComponent();
  component.name = componentName;
  component.resizeWithoutConstraints(safeSize, safeSize);
  component.fills = [];
  component.strokes = [];
  component.clipsContent = false;

  if ("children" in imported && imported.type === "FRAME" && imported.children.length === 1) {
    const child = imported.children[0];
    component.appendChild(child);
    centerNodeInComponent(component, child);
    imported.remove();
  } else {
    component.appendChild(imported);
    centerNodeInComponent(component, imported);
  }

  const strokeWeightStats = applyIconStrokeWeight(component, strokeWidth);
  const bindingStats = colorVariable ? applyIconVariableBinding(component, colorVariable, color) : null;
  return { component, bindingStats, strokeWeightStats };
}

function cleanupGeneratedIcons(page: PageNode): void {
  const legacyFrame = page.children.find((node): node is FrameNode => node.type === "FRAME" && node.name === "Imported icons");
  if (legacyFrame) {
    legacyFrame.remove();
  }

  const existingSet = page.children.find(
    (node): node is ComponentSetNode => node.type === "COMPONENT_SET" && node.name === ICON_COMPONENT_SET_NAME,
  );
  if (existingSet) {
    existingSet.remove();
  }

  page.children
    .filter((node): node is ComponentNode => node.type === "COMPONENT" && /^Icon\s*\/\s*/.test(node.name))
    .forEach((component) => component.remove());
}

async function importIconLibraryStarterPack(
  options: GenerationOptions,
  report: GenerationReport,
  preset: PresetDefinition,
  brands: NormalizedBrand[],
  shadeSteps: number[],
  colorModesCollection: VariableCollection | null,
  variableIndex: Map<string, Variable>,
  progress?: (message: string) => void,
): Promise<void> {
  const iconOptions = options.icons;
  if (!iconOptions) return;

  const library = normalizeIconLibraryId(iconOptions.library);
  const packs = normalizeIconPackIds(iconOptions.packs);
  const requestedIcons = resolveRequestedIconIds(library, iconOptions.includeStarterPack !== false, packs);
  if (!requestedIcons.length) {
    report.migrations.push("Import d'icônes ignoré: aucun starter pack ou pack sélectionné.");
    return;
  }

  progress?.(`Icons: import ${library}...`);
  const page = ensureIconsPage(report);
  cleanupGeneratedIcons(page);

  let importedCount = 0;
  const warningsBefore = report.warnings.length;
  const components: ComponentNode[] = [];
  const columns = 8;
  const cell = 56;
  const originX = 64;
  const originY = 64;
  const iconSize = Number(iconOptions.size) || DEFAULT_ICON_SIZE;
  const stroke = normalizeIconStrokeId(iconOptions.stroke);
  const strokeWidth = ICON_STROKE_WIDTHS[stroke];
  const color = resolvePrimitiveColor(options, preset, brands, shadeSteps);
  const { tokenName: iconColorTokenName, variable: iconColorVariable } = resolveIconSemanticVariable(
    colorModesCollection,
    variableIndex,
    iconOptions.colorAlias,
  );
  const bindingTotals: IconPaintBindingStats = {
    nodesVisited: 0,
    fillPaintsBound: 0,
    strokePaintsBound: 0,
    bindFailures: 0,
  };
  const strokeWeightTotals: IconStrokeWeightStats = {
    nodesVisited: 0,
    nodesUpdated: 0,
    updateFailures: 0,
  };
  let iconsWithoutBindablePaints = 0;

  if (!iconColorVariable) {
    report.warnings.push(
      `Icon variable binding skipped: ${COLLECTIONS.colorModes}/${iconColorTokenName} introuvable. Fallback hex applique (${color}).`,
    );
  }

  for (let index = 0; index < requestedIcons.length; index += 1) {
    const iconEntry = requestedIcons[index];
    try {
      const svg = await fetchIconSvg(library, iconEntry.sourceName);
      const { component, bindingStats, strokeWeightStats } = createIconComponentFromSvg(
        svg,
        `icon=${iconEntry.id}`,
        iconSize,
        strokeWidth,
        color,
        iconColorVariable,
      );
      addIconStrokeWeightStats(strokeWeightTotals, strokeWeightStats);
      if (bindingStats) {
        addIconBindingStats(bindingTotals, bindingStats);
        if (bindingStats.fillPaintsBound + bindingStats.strokePaintsBound === 0) {
          iconsWithoutBindablePaints += 1;
        }
      }
      page.appendChild(component);
      const col = components.length % columns;
      const row = Math.floor(components.length / columns);
      component.x = originX + col * cell;
      component.y = originY + row * cell;
      components.push(component);
      importedCount += 1;
      if (progress && importedCount % 8 === 0) {
        progress(`Icons: ${importedCount}/${requestedIcons.length}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.warnings.push(`Icon import skipped (${iconEntry.id}/${library}): ${message}`);
    }
  }

  if (!components.length) {
    report.warnings.push(`Import d'icônes ignoré: aucune icône ${library} n'a pu être importée.`);
    return;
  }

  let generatedNode: ComponentSetNode | ComponentNode;
  if (components.length === 1) {
    generatedNode = components[0];
    generatedNode.name = ICON_COMPONENT_SET_NAME;
  } else {
    const componentSet = figma.combineAsVariants(components, page);
    componentSet.name = ICON_COMPONENT_SET_NAME;
    generatedNode = componentSet;
  }

  generatedNode.x = originX;
  generatedNode.y = originY;
  report.migrations.push(`Icônes importées (${library}): ${importedCount}/${requestedIcons.length}`);
  report.migrations.push(`Composant généré: ${ICON_COMPONENT_SET_NAME} (${importedCount} variante${importedCount > 1 ? "s" : ""})`);
  report.migrations.push(`Icon strokeWeight applique (${stroke}=${strokeWidth}): ${strokeWeightTotals.nodesUpdated} node(s).`);
  if (strokeWeightTotals.updateFailures > 0) {
    report.warnings.push(`Icon strokeWeight: ${strokeWeightTotals.updateFailures} node(s) n'ont pas pu recevoir ${strokeWidth}.`);
  }
  if (iconColorVariable) {
    report.migrations.push(
      `Icônes liées à ${COLLECTIONS.colorModes}/${iconColorTokenName}: ${bindingTotals.fillPaintsBound} fills, ${bindingTotals.strokePaintsBound} strokes.`,
    );
    if (iconsWithoutBindablePaints > 0) {
      report.warnings.push(`Icon binding: ${iconsWithoutBindablePaints} icône(s) sans fill/stroke SOLID bindable.`);
    }
    if (bindingTotals.bindFailures > 0) {
      report.warnings.push(`Icon binding: ${bindingTotals.bindFailures} paint(s) n'ont pas pu être liés à ${iconColorTokenName}.`);
    }
  }
  if (report.warnings.length > warningsBefore) {
    report.migrations.push(`Import d'icônes avec warnings: ${report.warnings.length - warningsBefore}`);
  }
}

function postPresetList(): void {
  figma.ui.postMessage({
    type: "preset-list",
    presets: getPresetSummaries(),
  });
}

function sanitizeFontFamilyLabel(input: unknown): string {
  return String(input ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function postFontFamiliesList(): Promise<void> {
  try {
    const fonts = await withTimeout(figma.listAvailableFontsAsync(), 10000, "listAvailableFontsAsync(ui-ready)");
    const families = Array.from(
      new Set(
        fonts
          .map((font) => sanitizeFontFamilyLabel(font.fontName.family))
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    figma.ui.postMessage({
      type: "font-families-list",
      families,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[ombrstudio] Unable to load font families list: ${message}`);
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
      if (isGenerationRunning) {
        figma.ui.postMessage({
          type: "generate-error",
          message: "Une génération est déjà en cours. Attends la fin avant de relancer.",
        });
        return;
      }

      isGenerationRunning = true;
      const sendProgress = (message: string) => {
        figma.ui.postMessage({ type: "generate-progress", message });
      };
      try {
        sendProgress("Validation de la demande...");
        const options = buildGenerationOptions(payload.payload);
        sendProgress("Génération des variables...");
        const report = await applyGeneration(options, sendProgress);

        figma.notify(
          `ombrstudio: +${report.created} / ~${report.updated} / collisions ${report.collisionsReplaced}` +
            (report.aliasMissing ? ` / alias manquants ${report.aliasMissing}` : ""),
        );

        figma.ui.postMessage({
          type: "generate-result",
          report: compactReportForUi(report),
        });
      } finally {
        isGenerationRunning = false;
      }
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
