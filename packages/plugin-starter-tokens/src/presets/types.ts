export type TokenLevel = "foundations" | "color-modes";

export type UiMode = "light" | "dark" | "both";

export type NamingPattern = "tailwind" | "hundreds";

export type TokenCollection = "primitives" | "semantic" | "components";
export type TokenMode = "light" | "dark";
export type TokenVariableType = "COLOR" | "FLOAT" | "STRING";

export type TokenModeValue = string | number | { alias: string };

export interface TokenBundleEntry {
  name: string;
  type: TokenVariableType;
  values: Record<TokenMode, TokenModeValue>;
  scopes?: string[];
  description?: string;
  meta?: Record<string, unknown>;
}

export interface TokenBundle {
  schemaVersion: string;
  source: string;
  generatedAt?: string;
  collections: Record<TokenCollection, TokenBundleEntry[]>;
}

export interface BrandColorInput {
  name: string;
  color: string;
  contrast?: number;
  scale?: Record<string, string>;
}

export interface PresetPalettePreview {
  key?: string;
  name: string;
  steps: string[];
  colorsByStep: Record<string, string>;
}

export interface PresetDefinition {
  id: string;
  label: string;
  description: string;
  palettes: Record<string, Record<string, string>>;
  neutralOptions: string[];
  defaultNeutral: string;
  steps: string[];
  previewPalettes: PresetPalettePreview[];
}

export interface PresetSummary {
  id: string;
  label: string;
  description: string;
  paletteCount: number;
  neutralOptions: string[];
  defaultNeutral: string;
  steps: string[];
  previewPalettes: PresetPalettePreview[];
}

export interface GenerationOptions {
  tokenLevel: TokenLevel;
  uiMode: UiMode;
  presetId: string;
  hasCustomBrand: boolean;
  baseWhite: string;
  baseBlack: string;
  neutralChoice: string;
  namingPattern: NamingPattern;
  shadeCount: number;
  createTextStyles: boolean;
  brands: BrandColorInput[];
  selectedPalettes?: string[];
  paletteOverrides?: Record<string, Record<string, string>>;
  semanticOverrides?: Record<string, string>;
  tokenBundle?: TokenBundle;
  exportJson?: boolean;
  icons?: {
    library: string;
    includeStarterPack?: boolean;
    packs?: string[];
    size?: number;
    colorAlias?: string;
    stroke?: string;
  };
  typography: {
    displayFamily: string;
    bodyFamily: string;
    fontSizes: Record<string, number>;
    lineHeights?: Record<string, number>;
    letterSpacings?: Record<string, number>;
    styleFamilies?: Record<string, string>;
    styleWeights?: Record<string, string[]>;
  };
}

export interface CollectionReport {
  name: string;
  created: number;
  updated: number;
  collisionsReplaced: number;
}

export interface JsonExportMetadata {
  jsonReady: true;
  filename: string;
  bytes: number;
  tokenCount: number;
}

export interface GenerationReport {
  created: number;
  updated: number;
  collisionsReplaced: number;
  aliasApplied: number;
  aliasMissing: number;
  warnings: string[];
  migrations: string[];
  collections: CollectionReport[];
  exportJson?: JsonExportMetadata;
}
