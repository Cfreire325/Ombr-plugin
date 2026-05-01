export type TokenLevel = "foundations" | "color-modes";

export type UiMode = "light" | "dark";

export type NamingPattern = "tailwind" | "hundreds";

export interface BrandColorInput {
  name: string;
  color: string;
  contrast?: number;
  scale?: Record<string, string>;
}

export interface PresetPalettePreview {
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
  typography: {
    displayFamily: string;
    bodyFamily: string;
    fontSizes: Record<string, number>;
  };
}

export interface CollectionReport {
  name: string;
  created: number;
  updated: number;
  collisionsReplaced: number;
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
}
