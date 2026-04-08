import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeTokenBundle, validateTokenBundle } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, "../fixtures/token-bundle.sample.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const validation = validateTokenBundle(fixture);
assert.equal(validation.valid, true, validation.errors.join("\n"));

const normalized = normalizeTokenBundle(fixture);
assert.equal(normalized.schemaVersion, "1.0.0");
assert.equal(normalized.source, "figma");
assert.ok(Array.isArray(normalized.collections.primitives));
assert.ok(Array.isArray(normalized.collections.semantic));
assert.ok(Array.isArray(normalized.collections.components));
assert.ok(normalized.collections.semantic.find((token) => token.name === "text/primary"));

const invalid = {
  schemaVersion: "1.0.0",
  source: "figma",
  collections: {
    primitives: [{ name: "Colors.Base.White", type: "COLOR", values: { light: "#fff", dark: "#fff" } }],
    semantic: [],
    components: [],
  },
};
const invalidResult = validateTokenBundle(invalid);
assert.equal(invalidResult.valid, false);

console.log("ds-core token bundle tests passed.");
