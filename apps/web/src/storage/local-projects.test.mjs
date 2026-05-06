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
  return { module: await import(url), url };
}

const domainDir = path.resolve(__dirname, "../domain");
const storagePath = path.resolve(__dirname, "local-projects.ts");

const projectImport = await importTs(path.resolve(domainDir, "project.ts"), { "@starter-tokens/ds-core": dsCoreUrl });
const { createLocalProject, getProjectColorModeAliases, getProjectRadiusScale, getProjectSpacingScale, getProjectTypographyStyles } = projectImport.module;
const { loadProjects, saveProjects, upsertProject } = (await importTs(storagePath, { "../domain/project": projectImport.url })).module;

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

storage.setItem(
  "ombr.web.projects.v1",
  JSON.stringify([
    {
      id: "stored-broken",
      name: "",
      modeSetup: "wrong",
      preset: "wrong",
      syncStatus: "wrong",
      foundations: {
        typography: {
          styles: [{ id: "display", fontFamily: "Acme", fontSize: "60", lineHeight: "68", fontWeight: "800" }],
        },
        spacing: {
          scale: [{ id: "4", value: "20" }],
        },
        radius: {
          scale: [{ id: "full", value: "full" }],
        },
        colors: {
          colorPresetId: "missing",
          neutralChoice: "missing",
          selectedPalettes: ["red", "missing"],
          brands: [
            { id: "dup", name: "", color: "#112233" },
            { id: "dup", name: "Accent", color: "#445566" },
          ],
          baseWhite: "#fff",
          baseBlack: "#000",
        },
      },
    },
    "not-a-project",
  ]),
);
const repaired = loadProjects(storage);
assert.equal(repaired.length, 1);
assert.equal(repaired[0].name, "Untitled design system");
assert.equal(repaired[0].modeSetup, "light-dark");
assert.equal(repaired[0].preset, "starter");
assert.equal(repaired[0].syncStatus, "not-connected");
assert.equal(repaired[0].foundations.colors.colorPresetId, "tailwind");
assert.equal(repaired[0].foundations.colors.neutralChoice, "gray");
assert.deepEqual(repaired[0].foundations.colors.selectedPalettes, ["red"]);
assert.equal(repaired[0].foundations.colors.brands[0].name, "Primary");
assert.notEqual(repaired[0].foundations.colors.brands[0].id, repaired[0].foundations.colors.brands[1].id);
assert.deepEqual(
  getProjectColorModeAliases(repaired[0]).map((alias) => [alias.name, alias.light, alias.dark]),
  [
    ["color/text/primary", "colors/gray/900", "colors/gray/50"],
    ["color/background/primary", "colors/brand/50", "colors/brand/900"],
  ],
);
assert.equal(getProjectTypographyStyles(repaired[0]).find((style) => style.id === "display-lg").fontFamily, "Acme");
assert.equal(getProjectTypographyStyles(repaired[0]).find((style) => style.id === "display-lg").fontSize, 60);
assert.equal(getProjectTypographyStyles(repaired[0]).find((style) => style.id === "display-2xl").fontFamily, "Acme");
assert.equal(getProjectTypographyStyles(repaired[0]).find((style) => style.id === "display-2xl").fontSize, 72);
assert.equal(getProjectSpacingScale(repaired[0]).find((step) => step.id === "xl").value, 20);
assert.equal(getProjectSpacingScale(repaired[0]).find((step) => step.id === "11xl").value, 160);
assert.equal(getProjectRadiusScale(repaired[0]).find((step) => step.id === "full").value, 9999);

console.log("local project storage tests passed.");
