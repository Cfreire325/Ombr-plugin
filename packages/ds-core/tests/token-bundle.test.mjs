import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createPluginInputFromTokenBundle, normalizeTokenBundle, toFlatTokenList, validateTokenBundle } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, "../fixtures/token-bundle.sample.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeBundle(overrides = {}) {
  return {
    schemaVersion: "1.0.0",
    source: "figma",
    collections: {
      primitives: [],
      semantic: [],
      components: [],
      ...(overrides.collections || {}),
    },
    ...overrides,
  };
}

function makeToken(overrides = {}) {
  return {
    name: "colors/base/white",
    type: "COLOR",
    values: {
      light: "#ffffff",
      dark: "#ffffff",
    },
    ...overrides,
  };
}

function assertInvalid(bundle, expectedErrorFragment) {
  const result = validateTokenBundle(bundle);
  assert.equal(result.valid, false, "Expected TokenBundle to be invalid.");
  assert.ok(
    result.errors.some((error) => error.includes(expectedErrorFragment)),
    `Expected one validation error to include "${expectedErrorFragment}". Actual errors:\n${result.errors.join("\n")}`,
  );
}

const validation = validateTokenBundle(fixture);
assert.equal(validation.valid, true, validation.errors.join("\n"));

const normalized = normalizeTokenBundle(fixture);
assert.equal(normalized.schemaVersion, "1.0.0");
assert.equal(normalized.source, "figma");
assert.ok(Array.isArray(normalized.collections.primitives));
assert.ok(Array.isArray(normalized.collections.semantic));
assert.ok(Array.isArray(normalized.collections.components));
assert.ok(normalized.collections.semantic.find((token) => token.name === "text/primary"));

const normalizable = {
  schemaVersion: "1.0.0",
  source: "figma",
  collections: {
    primitives: [{ name: "Colors.Base.White", type: "COLOR", values: { light: "#fff", dark: "#fff" } }],
    semantic: [],
    components: [],
  },
};
// TODO(contract): docs say names are canonical slash-case, while current validation accepts raw names that normalize cleanly.
const normalizableResult = validateTokenBundle(normalizable);
assert.equal(normalizableResult.valid, true, normalizableResult.errors.join("\n"));
const normalizedFromLooseName = normalizeTokenBundle(normalizable);
assert.equal(normalizedFromLooseName.collections.primitives[0].name, "colors/base/white");

const invalid = {
  schemaVersion: "1.0.0",
  source: "figma",
  collections: {
    primitives: [{ name: "colors/base/white", type: "COLOR", values: { light: { alias: "missing-prefix" }, dark: "#fff" } }],
    semantic: [],
    components: [],
  },
};
const invalidResult = validateTokenBundle(invalid);
assert.equal(invalidResult.valid, false);

const duplicateNormalizedNames = makeBundle({
  collections: {
    primitives: [
      makeToken({ name: "Colors.Base.White" }),
      makeToken({ name: "colors/base/white", values: { light: "#000000", dark: "#000000" } }),
    ],
  },
});
assertInvalid(duplicateNormalizedNames, "Duplicate token name in primitives: colors/base/white");

for (const collection of ["primitives", "semantic", "components"]) {
  const missingCollection = clone(fixture);
  delete missingCollection.collections[collection];
  assertInvalid(missingCollection, `collections.${collection} must be an array.`);
}

assertInvalid(
  makeBundle({ collections: { primitives: [makeToken({ values: { dark: "#ffffff" } })] } }),
  "values.light is required.",
);
assertInvalid(
  makeBundle({ collections: { primitives: [makeToken({ values: { light: "#ffffff" } })] } }),
  "values.dark is required.",
);
assertInvalid(makeBundle({ collections: { primitives: [makeToken({ values: {} })] } }), "values.light is required.");

assertInvalid(
  makeBundle({ collections: { primitives: [makeToken({ values: { light: "not-a-color", dark: "#ffffff" } })] } }),
  "Invalid COLOR format: not-a-color",
);
assertInvalid(
  makeBundle({
    collections: {
      primitives: [makeToken({ type: "FLOAT", values: { light: "not-a-number", dark: 8 } })],
    },
  }),
  "Invalid FLOAT value: not-a-number",
);
assertInvalid(
  makeBundle({
    collections: {
      primitives: [makeToken({ type: "STRING", values: { light: "", dark: "Inter" } })],
    },
  }),
  "Invalid STRING value",
);

const validAliases = makeBundle({
  collections: {
    primitives: [
      makeToken({
        name: "colors/brand/500",
        values: { light: "#3366ff", dark: "#6690ff" },
      }),
    ],
    semantic: [
      makeToken({
        name: "border/focus",
        values: {
          light: { alias: "primitives/colors/brand/500" },
          dark: { alias: "primitives/colors/brand/500" },
        },
      }),
    ],
    components: [
      makeToken({
        name: "input/border/focus",
        values: {
          light: { alias: "semantic/border/focus" },
          dark: { alias: "components/input/border/focus" },
        },
      }),
    ],
  },
});
const validAliasesResult = validateTokenBundle(validAliases);
assert.equal(validAliasesResult.valid, true, validAliasesResult.errors.join("\n"));

for (const alias of ["colors/base/black", "random/input/focus", "semantic\\border\\focus"]) {
  assertInvalid(
    makeBundle({
      collections: {
        semantic: [
          makeToken({
            name: "text/primary",
            values: { light: { alias }, dark: "#111111" },
          }),
        ],
      },
    }),
    alias === "semantic\\border\\focus" ? "Alias must include collection prefix" : "Alias collection must be one of",
  );
}

const normalizedAliasBundle = normalizeTokenBundle(
  makeBundle({
    collections: {
      semantic: [
        makeToken({
          name: "border/focus",
          values: {
            light: { alias: "Primitives.Colors.Brand 500" },
            dark: { alias: "Semantic.Border.Focus" },
          },
        }),
      ],
    },
  }),
);
assert.deepEqual(normalizedAliasBundle.collections.semantic[0].values, {
  light: { alias: "primitives/colors/brand-500" },
  dark: { alias: "semantic/border/focus" },
});

const sorted = normalizeTokenBundle(
  makeBundle({
    collections: {
      primitives: [
        makeToken({ name: "spacing/8", type: "FLOAT", values: { light: 8, dark: 8 } }),
        makeToken({ name: "colors/base/white" }),
        makeToken({ name: "colors/base/black", values: { light: "#000000", dark: "#000000" } }),
      ],
    },
  }),
);
assert.deepEqual(
  sorted.collections.primitives.map((token) => token.name),
  ["colors/base/black", "colors/base/white", "spacing/8"],
);

const metadataBundle = normalizeTokenBundle(
  makeBundle({
    collections: {
      primitives: [
        makeToken({
          scopes: ["ALL_SCOPES", "TEXT_FILL", "ALL_SCOPES", ""],
          description: "  Base white  ",
          meta: { origin: "test", preset: "custom" },
        }),
      ],
    },
  }),
);
assert.deepEqual(metadataBundle.collections.primitives[0].scopes, ["ALL_SCOPES", "TEXT_FILL"]);
assert.equal(metadataBundle.collections.primitives[0].description, "Base white");
assert.deepEqual(metadataBundle.collections.primitives[0].meta, { origin: "test", preset: "custom" });

const flatList = toFlatTokenList(fixture);
assert.ok(flatList.length >= 5);
assert.deepEqual(flatList[0], {
  collection: "primitives",
  name: "colors/base/black",
  type: "COLOR",
  values: { light: "#000000", dark: "#000000" },
  scopes: ["ALL_SCOPES"],
  description: "",
});
assert.ok(flatList.find((token) => token.collection === "semantic" && token.name === "text/primary"));

const pluginInput = createPluginInputFromTokenBundle(fixture);
assert.deepEqual(Object.keys(pluginInput), ["tokenBundle"]);
assert.equal(pluginInput.tokenBundle.schemaVersion, "1.0.0");
assert.equal(pluginInput.tokenBundle.source, "figma");
assert.ok(Array.isArray(pluginInput.tokenBundle.collections.primitives));
assert.ok(pluginInput.tokenBundle.collections.semantic.find((token) => token.name === "text/primary"));

console.log("ds-core token bundle tests passed.");
