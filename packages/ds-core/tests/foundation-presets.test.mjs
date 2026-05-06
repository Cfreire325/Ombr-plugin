import assert from "node:assert/strict";

import {
  CANONICAL_PIXEL_TOKENS,
  CANONICAL_RADIUS_TOKENS,
  CANONICAL_SPACING_TOKENS,
  CANONICAL_TYPOGRAPHY_TOKENS,
  isSlashCaseTokenName,
  normalizeTokenBundle,
  validateTokenBundle,
} from "../src/index.js";

function byName(tokens) {
  return new Map(tokens.map((token) => [token.name, token]));
}

function assertRawToken(token, name, type, value) {
  assert.deepEqual(token, {
    name,
    type,
    values: {
      light: value,
      dark: value,
    },
  });
}

function assertAliasToken(token, name, alias) {
  assert.deepEqual(token, {
    name,
    type: "FLOAT",
    values: {
      light: { alias },
      dark: { alias },
    },
  });
}

const expectedPixels = [
  ["pixel/0", 0],
  ["pixel/2", 2],
  ["pixel/4", 4],
  ["pixel/6", 6],
  ["pixel/8", 8],
  ["pixel/10", 10],
  ["pixel/12", 12],
  ["pixel/16", 16],
  ["pixel/20", 20],
  ["pixel/24", 24],
  ["pixel/32", 32],
  ["pixel/40", 40],
  ["pixel/48", 48],
  ["pixel/64", 64],
  ["pixel/80", 80],
  ["pixel/96", 96],
  ["pixel/128", 128],
  ["pixel/160", 160],
  ["pixel/full", 9999],
];
assert.deepEqual(
  CANONICAL_PIXEL_TOKENS.map((token) => [token.name, token.values.light]),
  expectedPixels,
  "canonical pixel tokens expose the exact expected values in order",
);
const pixelByName = byName(CANONICAL_PIXEL_TOKENS);
for (const [name, value] of expectedPixels) {
  assertRawToken(pixelByName.get(name), name, "FLOAT", value);
}

const expectedSpacing = [
  ["spacing/none", "primitives/pixel/0"],
  ["spacing/xxs", "primitives/pixel/2"],
  ["spacing/xs", "primitives/pixel/4"],
  ["spacing/sm", "primitives/pixel/6"],
  ["spacing/md", "primitives/pixel/8"],
  ["spacing/lg", "primitives/pixel/12"],
  ["spacing/xl", "primitives/pixel/16"],
  ["spacing/2xl", "primitives/pixel/20"],
  ["spacing/3xl", "primitives/pixel/24"],
  ["spacing/4xl", "primitives/pixel/32"],
  ["spacing/5xl", "primitives/pixel/40"],
  ["spacing/6xl", "primitives/pixel/48"],
  ["spacing/7xl", "primitives/pixel/64"],
  ["spacing/8xl", "primitives/pixel/80"],
  ["spacing/9xl", "primitives/pixel/96"],
  ["spacing/10xl", "primitives/pixel/128"],
  ["spacing/11xl", "primitives/pixel/160"],
];
assert.deepEqual(
  CANONICAL_SPACING_TOKENS.map((token) => [token.name, token.values.light.alias]),
  expectedSpacing,
  "canonical spacing tokens expose exact aliases in order",
);
const spacingByName = byName(CANONICAL_SPACING_TOKENS);
for (const [name, alias] of expectedSpacing) {
  assertAliasToken(spacingByName.get(name), name, alias);
}

const expectedRadius = [
  ["radius/none", "primitives/pixel/0"],
  ["radius/xxs", "primitives/pixel/2"],
  ["radius/xs", "primitives/pixel/4"],
  ["radius/sm", "primitives/pixel/6"],
  ["radius/md", "primitives/pixel/8"],
  ["radius/lg", "primitives/pixel/10"],
  ["radius/xl", "primitives/pixel/12"],
  ["radius/2xl", "primitives/pixel/16"],
  ["radius/3xl", "primitives/pixel/20"],
  ["radius/4xl", "primitives/pixel/24"],
  ["radius/full", "primitives/pixel/full"],
];
assert.deepEqual(
  CANONICAL_RADIUS_TOKENS.map((token) => [token.name, token.values.light.alias]),
  expectedRadius,
  "canonical radius tokens expose exact aliases in order",
);
const radiusByName = byName(CANONICAL_RADIUS_TOKENS);
for (const [name, alias] of expectedRadius) {
  assertAliasToken(radiusByName.get(name), name, alias);
}

const typographyByName = byName(CANONICAL_TYPOGRAPHY_TOKENS);
assert.equal(CANONICAL_TYPOGRAPHY_TOKENS.length, 46, "typography token count covers families, sizes, line heights, letter spacing, and weights");
assertRawToken(typographyByName.get("font-family/display"), "font-family/display", "STRING", "Roboto");
assertRawToken(typographyByName.get("font-family/body"), "font-family/body", "STRING", "Inter");
assertRawToken(typographyByName.get("font-size/label"), "font-size/label", "FLOAT", 10);
assertRawToken(typographyByName.get("font-size/text-md"), "font-size/text-md", "FLOAT", 16);
assertRawToken(typographyByName.get("font-size/display-2xl"), "font-size/display-2xl", "FLOAT", 72);
assertRawToken(typographyByName.get("line-height/label"), "line-height/label", "FLOAT", 14);
assertRawToken(typographyByName.get("line-height/text-xs"), "line-height/text-xs", "FLOAT", 16);
assertRawToken(typographyByName.get("line-height/display-2xl"), "line-height/display-2xl", "FLOAT", 88);
assertRawToken(typographyByName.get("letter-spacing/label"), "letter-spacing/label", "FLOAT", 0);
assertRawToken(typographyByName.get("letter-spacing/text-xl"), "letter-spacing/text-xl", "FLOAT", 0);
assertRawToken(typographyByName.get("letter-spacing/display-2xl"), "letter-spacing/display-2xl", "FLOAT", 0);
assertRawToken(typographyByName.get("font-weight/regular"), "font-weight/regular", "STRING", "Regular");
assertRawToken(typographyByName.get("font-weight/semibold"), "font-weight/semibold", "STRING", "Semibold");
assertRawToken(typographyByName.get("font-weight/bold-italic"), "font-weight/bold-italic", "STRING", "Bold italic");

const canonicalTokens = [
  ...CANONICAL_PIXEL_TOKENS,
  ...CANONICAL_SPACING_TOKENS,
  ...CANONICAL_RADIUS_TOKENS,
  ...CANONICAL_TYPOGRAPHY_TOKENS,
];
assert.equal(canonicalTokens.length, 93, "canonical foundation token count stays stable");
for (const token of canonicalTokens) {
  assert.equal(isSlashCaseTokenName(token.name), true, `${token.name} is slash-case`);
}

const canonicalNames = canonicalTokens.map((token) => token.name);
for (const flatName of ["spacing-md", "spacing-2xl", "radius-2xl", "font-family-font-family-display"]) {
  assert.equal(canonicalNames.includes(flatName), false, `${flatName} is not emitted as a canonical token name`);
}

const canonicalBundle = {
  schemaVersion: "1.0.0",
  source: "ds-core",
  collections: {
    primitives: canonicalTokens,
    semantic: [],
    components: [],
  },
};
const validation = validateTokenBundle(canonicalBundle);
assert.equal(validation.valid, true, validation.errors.join("\n"));
const normalized = normalizeTokenBundle(canonicalBundle);
assert.equal(normalized.collections.primitives.length, canonicalTokens.length);
assert.deepEqual(
  byName(normalized.collections.primitives).get("spacing/md").values,
  {
    light: { alias: "primitives/pixel/8" },
    dark: { alias: "primitives/pixel/8" },
  },
  "canonical spacing aliases survive TokenBundle normalization",
);
assert.equal(byName(normalized.collections.primitives).get("font-weight/bold").type, "STRING");

console.log("ds-core canonical foundation preset tests passed.");
