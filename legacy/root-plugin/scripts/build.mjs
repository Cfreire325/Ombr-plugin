import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
mkdirSync(distDir, { recursive: true });

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
  logLevel: "info"
});

copyFileSync(resolve(root, "src/ui.html"), resolve(distDir, "ui.html"));
console.log("Build complete: dist/code.js + dist/ui.html");
