const TOKEN_COLLECTIONS = ["primitives", "semantic", "components"];
const TOKEN_TYPES = ["COLOR", "FLOAT", "STRING"];
const TOKEN_MODES = ["light", "dark"];
const DEFAULT_SCHEMA_VERSION = "1.0.0";
const DEFAULT_SOURCE = "figma";

const TOKEN_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNCTION_COLOR_REGEX = /^(rgb|rgba|hsl|hsla)\((.*)\)$/i;

function isObjectLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeTokenSegment(input) {
  return String(input || "")
    .trim()
    .replace(/\./g, "/")
    .replace(/[^a-zA-Z0-9/-]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-+|-+$/g, "")
    .replace(/\/-+/g, "/")
    .replace(/-+\//g, "/")
    .toLowerCase();
}

function normalizeTokenName(input) {
  return normalizeTokenSegment(input)
    .split("/")
    .map((part) => part.replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("/");
}

function isSlashCaseTokenName(name) {
  return TOKEN_NAME_REGEX.test(name);
}

function isAliasValue(value) {
  return isObjectLike(value) && typeof value.alias === "string";
}

function normalizeAliasPath(aliasPath) {
  return normalizeTokenName(aliasPath);
}

function normalizeModeValue(type, value) {
  if (isAliasValue(value)) {
    return { alias: normalizeAliasPath(value.alias) };
  }

  if (type === "FLOAT") {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw new Error(`Invalid FLOAT value: ${String(value)}`);
    }
    return numeric;
  }

  if (type === "STRING") {
    if (typeof value !== "string") {
      throw new Error(`Invalid STRING value: ${String(value)}`);
    }
    return value.trim();
  }

  const candidate = String(value || "").trim();
  if (!candidate) {
    throw new Error("Invalid COLOR value: empty");
  }
  return candidate;
}

function validateColorValue(rawValue) {
  if (isAliasValue(rawValue)) return null;
  const value = String(rawValue || "").trim();
  if (HEX_COLOR_REGEX.test(value) || FUNCTION_COLOR_REGEX.test(value)) return null;
  return `Invalid COLOR format: ${value}`;
}

function validateAlias(rawValue) {
  if (!isAliasValue(rawValue)) return null;
  const normalized = normalizeAliasPath(rawValue.alias);
  if (!normalized.includes("/")) {
    return `Alias must include collection prefix: ${rawValue.alias}`;
  }
  const [collection, ...rest] = normalized.split("/");
  if (!TOKEN_COLLECTIONS.includes(collection)) {
    return `Alias collection must be one of ${TOKEN_COLLECTIONS.join(", ")}: ${rawValue.alias}`;
  }
  if (!rest.length || !isSlashCaseTokenName(rest.join("/"))) {
    return `Alias token path is invalid slash-case: ${rawValue.alias}`;
  }
  return null;
}

function validateModeValue(type, rawValue) {
  const aliasError = validateAlias(rawValue);
  if (aliasError) return aliasError;
  if (isAliasValue(rawValue)) return null;

  if (type === "FLOAT") {
    return Number.isFinite(Number(rawValue)) ? null : `Invalid FLOAT value: ${String(rawValue)}`;
  }
  if (type === "STRING") {
    return typeof rawValue === "string" && rawValue.trim().length > 0 ? null : "Invalid STRING value";
  }
  return validateColorValue(rawValue);
}

function normalizeTokenEntry(collection, entry) {
  const normalizedName = normalizeTokenName(entry.name);
  const normalizedType = String(entry.type || "").trim().toUpperCase();
  const values = isObjectLike(entry.values) ? entry.values : {};

  const normalizedValues = {};
  for (const mode of TOKEN_MODES) {
    normalizedValues[mode] = normalizeModeValue(normalizedType, values[mode]);
  }

  const scopes = Array.isArray(entry.scopes)
    ? Array.from(new Set(entry.scopes.map((scope) => String(scope || "").trim()).filter(Boolean)))
    : [];

  const normalized = {
    name: normalizedName,
    type: normalizedType,
    values: normalizedValues,
  };

  if (scopes.length) normalized.scopes = scopes;
  if (entry.meta && isObjectLike(entry.meta)) normalized.meta = entry.meta;
  if (entry.description && String(entry.description).trim()) normalized.description = String(entry.description).trim();
  normalized.collection = collection;
  return normalized;
}

function validateTokenBundle(bundle) {
  const errors = [];
  if (!isObjectLike(bundle)) {
    return { valid: false, errors: ["TokenBundle must be an object."] };
  }

  const schemaVersion = String(bundle.schemaVersion || "").trim();
  if (!schemaVersion) {
    errors.push("schemaVersion is required.");
  }

  const collections = isObjectLike(bundle.collections) ? bundle.collections : null;
  if (!collections) {
    errors.push("collections is required.");
  }

  const normalizedSeen = new Map();
  for (const collection of TOKEN_COLLECTIONS) {
    const tokens = collections ? collections[collection] : null;
    if (!Array.isArray(tokens)) {
      errors.push(`collections.${collection} must be an array.`);
      continue;
    }

    normalizedSeen.set(collection, new Set());
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (!isObjectLike(token)) {
        errors.push(`collections.${collection}[${index}] must be an object.`);
        continue;
      }

      const name = normalizeTokenName(token.name);
      if (!name || !isSlashCaseTokenName(name)) {
        errors.push(`collections.${collection}[${index}].name must be slash-case.`);
      } else {
        const seen = normalizedSeen.get(collection);
        if (seen.has(name)) {
          errors.push(`Duplicate token name in ${collection}: ${name}`);
        } else {
          seen.add(name);
        }
      }

      const type = String(token.type || "").trim().toUpperCase();
      if (!TOKEN_TYPES.includes(type)) {
        errors.push(`collections.${collection}[${index}].type must be one of ${TOKEN_TYPES.join(", ")}.`);
      }

      if (!isObjectLike(token.values)) {
        errors.push(`collections.${collection}[${index}].values must be an object.`);
        continue;
      }

      for (const mode of TOKEN_MODES) {
        if (!(mode in token.values)) {
          errors.push(`collections.${collection}[${index}].values.${mode} is required.`);
          continue;
        }
        if (TOKEN_TYPES.includes(type)) {
          const modeError = validateModeValue(type, token.values[mode]);
          if (modeError) {
            errors.push(`collections.${collection}[${index}].values.${mode}: ${modeError}`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function normalizeTokenBundle(input) {
  if (!isObjectLike(input)) {
    throw new Error("TokenBundle must be an object.");
  }

  const collections = isObjectLike(input.collections) ? input.collections : {};
  const normalizedCollections = {};
  for (const collection of TOKEN_COLLECTIONS) {
    const tokens = Array.isArray(collections[collection]) ? collections[collection] : [];
    normalizedCollections[collection] = tokens.map((entry) => normalizeTokenEntry(collection, entry)).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  const normalized = {
    schemaVersion: String(input.schemaVersion || DEFAULT_SCHEMA_VERSION),
    source: String(input.source || DEFAULT_SOURCE),
    generatedAt: input.generatedAt ? String(input.generatedAt) : undefined,
    collections: normalizedCollections,
  };

  const validation = validateTokenBundle(normalized);
  if (!validation.valid) {
    throw new Error(`TokenBundle validation failed: ${validation.errors.join(" | ")}`);
  }

  return normalized;
}

function toFlatTokenList(bundle) {
  const normalized = normalizeTokenBundle(bundle);
  const list = [];
  for (const collection of TOKEN_COLLECTIONS) {
    for (const token of normalized.collections[collection]) {
      list.push({
        collection,
        name: token.name,
        type: token.type,
        values: token.values,
        scopes: token.scopes || [],
        description: token.description || "",
      });
    }
  }
  return list;
}

function createPluginInputFromTokenBundle(bundle) {
  const normalized = normalizeTokenBundle(bundle);
  return {
    tokenBundle: normalized,
  };
}

export {
  DEFAULT_SCHEMA_VERSION,
  DEFAULT_SOURCE,
  TOKEN_COLLECTIONS,
  TOKEN_MODES,
  TOKEN_TYPES,
  createPluginInputFromTokenBundle,
  isSlashCaseTokenName,
  normalizeTokenBundle,
  normalizeTokenName,
  toFlatTokenList,
  validateTokenBundle,
};

export {
  buildBrandScale,
  colorWithAlpha,
  parseColorInput,
  rgbaToHex,
  sanitizeKebabSegment,
} from "./color-utils.js";

export { normalizePaletteKey } from "./naming.js";

export {
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
  pickSubset,
  resolveClosestPaletteStep,
  resolveBaseStep,
  sortPresetSteps,
} from "./palette-steps.js";
