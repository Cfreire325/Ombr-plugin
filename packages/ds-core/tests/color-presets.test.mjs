import assert from "node:assert/strict";

import {
  BUILTIN_COLOR_PRESETS,
  getColorPresetById,
  getColorPresetSummaries,
  normalizePaletteKey,
} from "../src/index.js";

const presetIds = BUILTIN_COLOR_PRESETS.map((preset) => preset.id);

assert.deepEqual(presetIds, ["tailwind", "material", "untitled-ui"], "active color preset ids stay stable");
assert.equal(presetIds.includes("polaris"), false, "Polaris stays excluded from active color presets");
assert.equal(presetIds.includes("flowbite"), false, "Flowbite is not activated without a formal preset");
assert.equal(presetIds.includes("shadcn"), false, "Shadcn is not activated without a formal preset");

const tailwind = getColorPresetById("tailwind");
assert.equal(tailwind.label, "Tailwind");
assert.equal(tailwind.defaultNeutral, "gray");
assert.deepEqual(tailwind.neutralOptions, ["slate", "gray", "zinc", "neutral", "stone"]);
assert.deepEqual(tailwind.steps, ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]);
assert.equal(tailwind.palettes.slate["50"], "#f8fafc");
assert.equal(tailwind.palettes.blue["500"], "#3b82f6");
assert.ok(tailwind.previewPalettes.find((palette) => normalizePaletteKey(palette.name) === "slate"));

const material = getColorPresetById("material");
assert.equal(material.label, "Material");
assert.equal(material.defaultNeutral, "grey");
assert.deepEqual(material.neutralOptions, ["neutral", "grey", "blue-grey"]);
assert.equal(material.palettes.red["500"], "#f44336");
assert.ok(material.previewPalettes.length > 0, "Material exposes preview palettes");

const untitled = getColorPresetById("untitled-ui");
assert.equal(untitled.label, "Untitled Ui");
assert.equal(untitled.defaultNeutral, "base");
assert.ok(untitled.neutralOptions.includes("gray-light"));
assert.ok(untitled.neutralOptions.includes("base"));
assert.equal(untitled.palettes.base.white, "#ffffff");
assert.ok(untitled.previewPalettes.length > 0, "Untitled UI exposes preview palettes");

assert.equal(getColorPresetById("missing"), undefined, "missing preset id returns undefined");

const summaries = getColorPresetSummaries();
assert.deepEqual(
  summaries.map((summary) => summary.id),
  presetIds,
  "summaries preserve active preset order",
);

const tailwindSummary = summaries.find((summary) => summary.id === "tailwind");
assert.equal(tailwindSummary.label, "Tailwind");
assert.equal(tailwindSummary.paletteCount, Object.keys(tailwind.palettes).length);
assert.equal(tailwindSummary.defaultNeutral, tailwind.defaultNeutral);
assert.deepEqual(tailwindSummary.neutralOptions, tailwind.neutralOptions);
assert.deepEqual(tailwindSummary.steps, tailwind.steps);
assert.ok(tailwindSummary.previewPalettes.every((palette) => palette.key), "summary preview palettes expose stable keys");
assert.equal(tailwindSummary.previewPalettes[0].key, "slate");
assert.equal(tailwindSummary.previewPalettes[0].colorsByStep["500"], "#64748b");

tailwindSummary.neutralOptions.push("mutated");
assert.equal(getColorPresetById("tailwind").neutralOptions.includes("mutated"), false, "summary arrays are defensive copies");

console.log("color preset registry tests passed.");
