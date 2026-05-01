export type TokenCollection = "primitives" | "semantic" | "components";
export type TokenMode = "light" | "dark";
export type TokenType = "COLOR" | "FLOAT" | "STRING";

export type TokenModeValue = string | number | { alias: string };

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface TokenEntry {
  collection?: TokenCollection;
  name: string;
  type: TokenType;
  values: Record<TokenMode, TokenModeValue>;
  scopes?: string[];
  description?: string;
  meta?: Record<string, unknown>;
}

export interface TokenBundle {
  schemaVersion: string;
  source: string;
  generatedAt?: string;
  collections: Record<TokenCollection, TokenEntry[]>;
}

export interface TokenBundleValidationResult {
  valid: boolean;
  errors: string[];
}

export const TOKEN_COLLECTIONS: readonly TokenCollection[];
export const TOKEN_MODES: readonly TokenMode[];
export const TOKEN_TYPES: readonly TokenType[];
export const DEFAULT_SCHEMA_VERSION: "1.0.0";
export const DEFAULT_SOURCE: "figma";

export function normalizeTokenName(input: unknown): string;
export function isSlashCaseTokenName(name: string): boolean;
export function validateTokenBundle(bundle: unknown): TokenBundleValidationResult;
export function normalizeTokenBundle(input: unknown): TokenBundle;
export function toFlatTokenList(bundle: unknown): Array<{
  collection: TokenCollection;
  name: string;
  type: TokenType;
  values: Record<TokenMode, TokenModeValue>;
  scopes: string[];
  description: string;
}>;
export function createPluginInputFromTokenBundle(bundle: unknown): { tokenBundle: TokenBundle };
export function parseColorInput(value: string): RGBA;
export function rgbaToHex(value: RGBA): string;
export function colorWithAlpha(baseColor: string, alphaPct: number): string;
export function sanitizeKebabSegment(input: string, fallback?: string): string;
export function buildBrandScale(baseColor: string, steps: number[], baseStep?: number): Record<number, string>;
export function basePatternSteps(pattern: string): number[];
export function pickSubset(baseSteps: number[], count: number): number[];
export function nextShadeStep(previous: number): number;
export function extendSteps(baseSteps: number[], count: number): number[];
export function deriveShadeSteps(pattern: string, shadeCount: unknown): number[];
export function resolveBaseStep(shadeSteps: number[]): number;
export function closestStep(steps: number[], target: number): number;
export function parsePresetNumericStep(step: string): number | null;
export function sortPresetSteps(steps: string[]): string[];
export function fallbackPresetSteps(): string[];
export function getPaletteSteps(preset: { palettes: Record<string, Record<string, string>> }, paletteName: string): string[];
export function resolveClosestPaletteStep(
  preset: { palettes: Record<string, Record<string, string>> },
  paletteName: string,
  requestedStep: string,
): string;
export function normalizePresetSteps(preset: { steps: Array<string | number> }): string[];
export function closestPresetStep(steps: string[], target: number): string;
