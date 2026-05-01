import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeKey(input) {
  return String(input || "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findSectionKey(root, expected) {
  const normalizedExpected = sanitizeKey(expected);
  for (const key of Object.keys(root || {})) {
    if (sanitizeKey(key) === normalizedExpected) return key;
  }
  return null;
}

function readTypedSection(sectionNode, typeHint) {
  const out = {};
  if (!isObject(sectionNode)) return out;

  for (const [key, node] of Object.entries(sectionNode)) {
    if (!isObject(node) || !("$value" in node)) continue;
    const value = node.$value;
    if (typeHint === "number") {
      const n = Number(value);
      if (Number.isFinite(n)) out[key] = n;
      continue;
    }
    out[key] = String(value ?? "").trim();
  }

  return out;
}

function main() {
  const root = process.cwd();
  const inputCandidates = [
    resolve(root, "Typography exemple.json"),
    resolve(root, "assets/figma/exports/Typography exemple.json"),
  ];
  const inputPath = inputCandidates.find((candidate) => existsSync(candidate));
  const outPath = resolve(root, "src/presets/typography.generated.ts");
  if (!inputPath) {
    if (existsSync(outPath)) {
      console.info(
        `[extract-typography-reference] Optional source not found; keeping existing ${outPath}. Expected one of: ${inputCandidates.join(" | ")}`,
      );
      return;
    }
    throw new Error(`Missing input file. Expected one of: ${inputCandidates.join(" | ")}`);
  }

  const raw = JSON.parse(readFileSync(inputPath, "utf8"));
  const modes = raw?.modes;
  if (!isObject(modes)) throw new Error("Invalid Typography exemple.json: missing `modes` object.");

  const firstModeKey = Object.keys(modes)[0];
  const modeNode = modes[firstModeKey];
  if (!isObject(modeNode)) throw new Error("Invalid Typography exemple.json: empty mode node.");

  const familyKey = findSectionKey(modeNode, "Font family");
  const sizeKey = findSectionKey(modeNode, "Font size");
  const weightKey = findSectionKey(modeNode, "Font weight");
  const lineHeightKey = findSectionKey(modeNode, "Line height");

  if (!familyKey || !sizeKey || !weightKey || !lineHeightKey) {
    throw new Error("Typography example is missing one of required sections: Font family, Font size, Font weight, Line height.");
  }

  const familiesRaw = readTypedSection(modeNode[familyKey], "string");
  const sizes = readTypedSection(modeNode[sizeKey], "number");
  const weights = readTypedSection(modeNode[weightKey], "string");
  const lineHeights = readTypedSection(modeNode[lineHeightKey], "number");

  const reference = {
    modeName: firstModeKey,
    fontFamily: {
      display: familiesRaw["font-family-display"] || "Roboto",
      body: familiesRaw["font-family-body"] || "Inter",
    },
    fontSize: sizes,
    fontWeight: weights,
    lineHeight: lineHeights,
  };

  const output = `/* Auto-generated from Typography exemple.json */\n\nexport const TYPOGRAPHY_REFERENCE = ${JSON.stringify(reference, null, 2)} as const;\n`;

  writeFileSync(outPath, output, "utf8");
  console.log(`[extract-typography-reference] Generated ${outPath}.`);
}

main();
