import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../..");
const dsCoreUrl = pathToFileURL(path.resolve(repoRoot, "packages/ds-core/src/index.js")).href;

async function importTs(fileName) {
  const source = await fs.readFile(path.resolve(__dirname, fileName), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  });
  const outputText = transpiled.outputText.replace(/from\s+["']@starter-tokens\/ds-core["']/g, `from "${dsCoreUrl}"`);
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  return import(url);
}

const { getAvailableColorPresetSummaries, getSelectedColorPreset } = await importTs("color-presets.ts");

const summaries = getAvailableColorPresetSummaries();

assert.deepEqual(
  summaries.map((preset) => preset.id),
  ["tailwind", "material", "untitled-ui"],
  "web color selector exposes active ds-core presets only",
);
assert.deepEqual(
  summaries.map((preset) => preset.label),
  ["Tailwind", "Material", "Untitled Ui"],
  "web color selector displays preset labels from ds-core",
);
assert.equal(summaries.some((preset) => preset.id === "flowbite"), false);
assert.equal(summaries.some((preset) => preset.id === "shadcn"), false);
assert.equal(summaries.some((preset) => preset.id === "polaris"), false);

const tailwind = getSelectedColorPreset("tailwind");
assert.equal(tailwind.id, "tailwind");
assert.equal(tailwind.defaultNeutral, "gray");
assert.deepEqual(tailwind.neutralOptions, ["slate", "gray", "zinc", "neutral", "stone"]);
assert.ok(tailwind.previewPalettes.length > 0);

const material = getSelectedColorPreset("material");
assert.deepEqual(material.neutralOptions, ["neutral", "grey", "blue-grey"], "neutral selector uses the selected preset options");
assert.equal(material.defaultNeutral, "grey");

const fallback = getSelectedColorPreset("missing");
assert.equal(fallback.id, "tailwind", "unknown preset falls back to Tailwind for provisional UI");

console.log("web color preset domain tests passed.");
