import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeTokenBundle } from "@starter-tokens/ds-core";
import { exportTokenBundleJson } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, "../../ds-core/fixtures/token-bundle.sample.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const output = exportTokenBundleJson(fixture);
assert.equal(typeof output, "string", "JSON TokenBundle export returns a string");
assert.equal(output.endsWith("\n"), true, "JSON TokenBundle export includes a final newline");

const parsed = JSON.parse(output);
const normalized = normalizeTokenBundle(fixture);
assert.deepEqual(parsed, normalized, "JSON TokenBundle export equals the normalized TokenBundle");

const semanticToken = parsed.collections.semantic.find((token) => token.name === "text/primary");
assert.deepEqual(semanticToken.values.light, { alias: "primitives/colors/base/black" }, "aliases remain alias objects");

const metadataBundle = {
  schemaVersion: "1.0.0",
  source: "figma",
  collections: {
    primitives: [
      {
        name: "Colors.Base.White",
        type: "COLOR",
        values: { light: "#ffffff", dark: "#ffffff" },
        scopes: ["ALL_SCOPES", "TEXT_FILL", "ALL_SCOPES"],
        description: "  Base white  ",
        meta: { origin: "test", export: { stable: true } },
      },
    ],
    semantic: [],
    components: [],
  },
};
const metadataOutput = exportTokenBundleJson(metadataBundle);
const metadataParsed = JSON.parse(metadataOutput);
assert.deepEqual(metadataParsed.collections.primitives[0].scopes, ["ALL_SCOPES", "TEXT_FILL"], "scopes are preserved after normalization");
assert.equal(metadataParsed.collections.primitives[0].description, "Base white", "descriptions are preserved after normalization");
assert.deepEqual(metadataParsed.collections.primitives[0].meta, { origin: "test", export: { stable: true } }, "metadata is preserved");

assert.equal(exportTokenBundleJson(fixture), exportTokenBundleJson(fixture), "JSON TokenBundle export is deterministic across repeated calls");
assert.equal(exportTokenBundleJson(fixture, { finalNewline: false }).endsWith("\n"), false, "final newline can be disabled explicitly");

console.log("JSON TokenBundle exporter tests passed.");
