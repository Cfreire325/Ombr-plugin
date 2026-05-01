import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../..");
const dsCoreUrl = pathToFileURL(path.resolve(repoRoot, "packages/ds-core/src/index.js")).href;
const exporterPath = path.resolve(repoRoot, "packages/exporters/src/index.js");

async function importTs(fileName) {
  const source = await fs.readFile(path.resolve(__dirname, fileName), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  });
  const projectUrl = pathToFileURL(path.resolve(__dirname, "project.ts")).href;
  const outputText = transpiled.outputText
    .replace(/from\s+["']\.\/project["']/g, `from "${projectUrl}"`)
    .replace(/from\s+["']@starter-tokens\/ds-core["']/g, `from "${dsCoreUrl}"`);
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  return import(url);
}

async function importExporter() {
  const source = await fs.readFile(exporterPath, "utf8");
  const outputText = source.replace(/from\s+["']@starter-tokens\/ds-core["']/g, `from "${dsCoreUrl}"`);
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  return import(url);
}

const { createLocalProject } = await importTs("project.ts");
const { buildMinimalTokenBundle, summarizeTokenBundle } = await importTs("token-bundle.ts");
const { validateTokenBundle } = await import(dsCoreUrl);
const { exportTokenBundleJson } = await importExporter();

const project = createLocalProject({
  name: "Core Retail DS",
  modeSetup: "light-dark",
  preset: "starter",
  brandColor: "#3f6f5f",
});

const bundle = buildMinimalTokenBundle(project);
const validation = validateTokenBundle(bundle);
assert.equal(validation.valid, true, validation.errors.join(" | "));
assert.equal(bundle.source, "web");
assert.equal(bundle.collections.primitives.length, 3);
assert.equal(bundle.collections.semantic.length, 2);
assert.equal(bundle.collections.components.length, 0);

const brand = bundle.collections.primitives.find((token) => token.name === "colors/brand/500");
assert.deepEqual(brand.values, { light: "#3f6f5f", dark: "#3f6f5f" });

const textPrimary = bundle.collections.semantic.find((token) => token.name === "text/primary");
assert.deepEqual(textPrimary.values.light, { alias: "primitives/colors/base/black" });
assert.deepEqual(textPrimary.values.dark, { alias: "primitives/colors/base/white" });

const summary = summarizeTokenBundle(bundle);
assert.deepEqual(summary, { primitiveCount: 3, semanticCount: 2, componentCount: 0, tokenCount: 5 });

const exported = exportTokenBundleJson(bundle);
assert.equal(JSON.parse(exported).collections.semantic.length, 2);

console.log("token bundle domain tests passed.");
