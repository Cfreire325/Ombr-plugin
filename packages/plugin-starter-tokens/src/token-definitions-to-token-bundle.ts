import { normalizeTokenBundle } from "@starter-tokens/ds-core";
import type { TokenBundle, TokenCollection, TokenEntry, TokenModeValue, TokenType } from "@starter-tokens/ds-core";

type RuntimeModeName = "default" | "light" | "dark";
type RawTokenValue = string | number;

type RuntimeTokenValue =
  | { kind: "raw"; value: RawTokenValue }
  | { kind: "alias"; ref: string; collection: string };

export type TokenDefinitionForBundle = {
  collection: string;
  name: string;
  type: TokenType;
  scopes?: string[];
  value?: RuntimeTokenValue;
  modeValues?: Partial<Record<RuntimeModeName, RuntimeTokenValue>>;
};

export type TokenDefinitionsToTokenBundleOptions = {
  schemaVersion?: string;
  source?: string;
  generatedAt?: string;
};

const PRIMITIVE_RUNTIME_COLLECTIONS = new Set(["primitives", "2. spacing", "3. radius", "6. Typography"]);
const SEMANTIC_RUNTIME_COLLECTIONS = new Set(["1. color-modes"]);

function mapRuntimeCollection(collection: string): TokenCollection | null {
  if (PRIMITIVE_RUNTIME_COLLECTIONS.has(collection)) return "primitives";
  if (SEMANTIC_RUNTIME_COLLECTIONS.has(collection)) return "semantic";
  return null;
}

function mapAliasCollection(collection: string): TokenCollection {
  const mapped = mapRuntimeCollection(collection);
  if (!mapped) {
    throw new Error(`Unsupported TokenDefinition alias collection: ${collection}`);
  }
  return mapped;
}

function mapRuntimeValue(value: RuntimeTokenValue): TokenModeValue {
  if (value.kind === "raw") return value.value;
  return { alias: `${mapAliasCollection(value.collection)}/${value.ref}` };
}

function resolveModeValue(token: TokenDefinitionForBundle, mode: "light" | "dark"): TokenModeValue | null {
  if (token.modeValues && Object.keys(token.modeValues).length) {
    const direct = token.modeValues[mode];
    if (direct !== undefined) return mapRuntimeValue(direct);
    const fallback = token.modeValues.default ?? token.modeValues.light ?? token.modeValues.dark;
    return fallback === undefined ? null : mapRuntimeValue(fallback);
  }

  return token.value === undefined ? null : mapRuntimeValue(token.value);
}

function mapTokenDefinition(token: TokenDefinitionForBundle): { collection: TokenCollection; entry: TokenEntry } | null {
  const collection = mapRuntimeCollection(token.collection);
  if (!collection) return null;

  const light = resolveModeValue(token, "light");
  const dark = resolveModeValue(token, "dark");
  if (light === null || dark === null) {
    throw new Error(`TokenDefinition missing values: ${token.collection}/${token.name}`);
  }

  const entry: TokenEntry = {
    name: token.name,
    type: token.type,
    values: { light, dark },
  };

  if (Array.isArray(token.scopes) && token.scopes.length) {
    entry.scopes = token.scopes;
  }

  return { collection, entry };
}

export function tokenDefinitionsToTokenBundle(
  tokens: TokenDefinitionForBundle[],
  options: TokenDefinitionsToTokenBundleOptions = {},
): TokenBundle {
  const collections: Record<TokenCollection, TokenEntry[]> = {
    primitives: [],
    semantic: [],
    components: [],
  };

  for (const token of tokens) {
    const mapped = mapTokenDefinition(token);
    if (!mapped) continue;
    collections[mapped.collection].push(mapped.entry);
  }

  return normalizeTokenBundle({
    schemaVersion: options.schemaVersion || "1.0.0",
    source: options.source || "figma",
    generatedAt: options.generatedAt,
    collections,
  });
}
