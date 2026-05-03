import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../..");
const dsCoreUrl = pathToFileURL(path.resolve(repoRoot, "packages/ds-core/src/index.js")).href;

async function importTs(filePath, replacements = {}) {
  const source = await fs.readFile(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  });
  let outputText = transpiled.outputText;
  for (const [from, to] of Object.entries(replacements)) {
    outputText = outputText.replace(new RegExp(`from\\s+["']${from}["']`, "g"), `from "${to}"`);
  }
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  return import(url);
}

const domainDir = path.resolve(__dirname, "../domain");
const projectUrl = pathToFileURL(path.resolve(domainDir, "project.ts")).href;
const storagePath = path.resolve(__dirname, "local-projects.ts");

const { createLocalProject } = await importTs(path.resolve(domainDir, "project.ts"), { "@starter-tokens/ds-core": dsCoreUrl });
const { loadProjects, saveProjects, upsertProject } = await importTs(storagePath, { "../domain/project": projectUrl });

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

const storage = createMemoryStorage();
assert.deepEqual(loadProjects(storage), []);

const project = createLocalProject({ name: "Core Retail DS", modeSetup: "light", preset: "custom" });
saveProjects([project], storage);
assert.equal(loadProjects(storage)[0].name, "Core Retail DS");

const updated = { ...project, name: "Core Retail System" };
const list = upsertProject(storage, updated);
assert.equal(list.length, 1);
assert.equal(loadProjects(storage)[0].name, "Core Retail System");

storage.setItem("ombr.web.projects.v1", "{broken");
assert.deepEqual(loadProjects(storage), []);

console.log("local project storage tests passed.");
