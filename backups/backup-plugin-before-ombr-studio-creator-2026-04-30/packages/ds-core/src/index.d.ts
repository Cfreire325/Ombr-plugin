export type TokenCollection = "primitives" | "semantic" | "components";
export type TokenMode = "light" | "dark";
export type TokenType = "COLOR" | "FLOAT" | "STRING";

export type TokenModeValue = string | number | { alias: string };

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
