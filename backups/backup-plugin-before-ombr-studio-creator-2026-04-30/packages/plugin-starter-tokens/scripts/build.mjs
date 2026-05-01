import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
const srcUiPath = resolve(root, "src/ui.html");
const distUiPath = resolve(distDir, "ui.html");
mkdirSync(distDir, { recursive: true });

const generatedCodeBanner =
  "/* Generated from src/code.ts by packages/plugin-starter-tokens/scripts/build.mjs. Do not edit dist/code.js directly. */";
const generatedUiBanner =
  "<!-- Generated from src/ui.html by packages/plugin-starter-tokens/scripts/build.mjs. Do not edit dist/ui.html directly. Run npm run build after source changes. -->";

for (const scriptName of ["extract-preset-palettes.mjs", "extract-typography-reference.mjs", "extract-text-styles.mjs"]) {
  const extractResult = spawnSync(process.execPath, [resolve(root, `scripts/${scriptName}`)], { stdio: "inherit" });
  if (extractResult.status !== 0) {
    process.exit(extractResult.status ?? 1);
  }
}

await build({
  entryPoints: [resolve(root, "src/code.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2017",
  outfile: resolve(distDir, "code.js"),
  banner: {
    js: generatedCodeBanner,
  },
  logLevel: "info"
});

const uiSource = readFileSync(srcUiPath, "utf8").replace(/^\uFEFF/, "");
const uiOutput = uiSource.startsWith("<!doctype html>")
  ? uiSource.replace("<!doctype html>", `<!doctype html>\n${generatedUiBanner}`)
  : `${generatedUiBanner}\n${uiSource}`;
writeFileSync(distUiPath, uiOutput, "utf8");
console.log("Build complete: dist/code.js + dist/ui.html");
