import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importTs(fileName) {
  const source = await fs.readFile(path.resolve(__dirname, fileName), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  });
  const url = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString("base64")}`;
  return import(url);
}

const { createLocalProject, getModeCount, updateProjectBrandColor } = await importTs("project.ts");

const project = createLocalProject({
  name: "Core Retail DS",
  modeSetup: "light-dark",
  preset: "starter",
  brandColor: "#3f6f5f",
});

assert.equal(project.name, "Core Retail DS");
assert.equal(project.modeSetup, "light-dark");
assert.equal(project.preset, "starter");
assert.equal(project.syncStatus, "not-connected");
assert.equal(project.foundations.colors.brandPrimary, "#3f6f5f");
assert.equal(getModeCount(project), 2);
assert.ok(project.id.startsWith("local-"));
assert.ok(project.createdAt);
assert.ok(project.updatedAt);

const renamed = createLocalProject({ name: "   ", modeSetup: "light", preset: "custom" });
assert.equal(renamed.name, "Untitled design system");
assert.equal(getModeCount(renamed), 1);

const updated = updateProjectBrandColor(project, "#4b7f68");
assert.equal(updated.foundations.colors.brandPrimary, "#4b7f68");
assert.equal(project.foundations.colors.brandPrimary, "#3f6f5f");

console.log("project domain tests passed.");
