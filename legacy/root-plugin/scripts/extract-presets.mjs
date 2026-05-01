import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasValueNode(node) {
  return isObject(node) && Object.prototype.hasOwnProperty.call(node, "$value");
}

function flattenLeaves(node, prefix = []) {
  const out = [];
  if (!isObject(node)) return out;

  if (hasValueNode(node)) {
    out.push({ name: prefix.join("/"), value: node.$value });
    return out;
  }

  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    out.push(...flattenLeaves(child, [...prefix, key]));
  }

  return out;
}

function canonicalizeTokenName(name) {
  return String(name).replace(/quarterary/g, "quaternary");
}

function canonicalizeRef(value) {
  if (typeof value !== "string") return value;
  return value.replace(/quarterary/g, "quaternary");
}

function entriesByName(leaves) {
  const map = new Map();
  for (const leaf of leaves) {
    map.set(canonicalizeTokenName(leaf.name), canonicalizeRef(leaf.value));
  }
  return map;
}

function buildPreset(filePath, id, label) {
  const raw = JSON.parse(readFileSync(filePath, "utf8"));

  const primitivesCollection = raw.find((entry) => Object.prototype.hasOwnProperty.call(entry, "_Primitives"))?._Primitives;
  const colorModesCollection = raw.find((entry) => Object.prototype.hasOwnProperty.call(entry, "1. Color modes"))["1. Color modes"];

  const styleColors = primitivesCollection?.modes?.Style?.Colors;
  const primitiveLeaves = flattenLeaves(styleColors, ["Colors"]).map((leaf) => ({
    name: canonicalizeTokenName(leaf.name),
    value: canonicalizeRef(leaf.value)
  }));

  const lightColors = flattenLeaves(colorModesCollection?.modes?.["Light mode"]?.Colors, ["Colors"]);
  const darkColors = flattenLeaves(colorModesCollection?.modes?.["Dark mode"]?.Colors, ["Colors"]);
  const lightMap = entriesByName(lightColors);
  const darkMap = entriesByName(darkColors);
  const semanticNames = Array.from(new Set([...lightMap.keys(), ...darkMap.keys()])).sort();
  const semantic = semanticNames.map((name) => ({
    name,
    light: lightMap.get(name) ?? darkMap.get(name) ?? "#000000",
    dark: darkMap.get(name) ?? lightMap.get(name) ?? "#000000"
  }));

  const lightComponents = flattenLeaves(colorModesCollection?.modes?.["Light mode"]?.["Component colors"], ["Component colors"]);
  const darkComponents = flattenLeaves(colorModesCollection?.modes?.["Dark mode"]?.["Component colors"], ["Component colors"]);
  const lightComponentsMap = entriesByName(lightComponents);
  const darkComponentsMap = entriesByName(darkComponents);
  const componentNames = Array.from(new Set([...lightComponentsMap.keys(), ...darkComponentsMap.keys()])).sort();
  const components = componentNames.map((name) => ({
    name,
    light: lightComponentsMap.get(name) ?? darkComponentsMap.get(name) ?? "#000000",
    dark: darkComponentsMap.get(name) ?? lightComponentsMap.get(name) ?? "#000000"
  }));

  const brandShades = primitiveLeaves
    .map((item) => {
      const m = item.name.match(/^Colors\/Brand\/(\d+)$/);
      return m ? Number(m[1]) : null;
    })
    .filter((v) => v !== null)
    .sort((a, b) => a - b);

  return {
    id,
    label,
    primitives: primitiveLeaves,
    semantic,
    components,
    brandShades
  };
}

const root = process.cwd();
const flowbite = buildPreset(resolve(root, "Flowbite variable.json"), "flowbite", "Flowbite");
const untitled = buildPreset(resolve(root, "Untitled ui react variable.json"), "untitled-ui", "Untitled UI");

const banner = "/* Auto-generated from local source JSON files. */";
const body = `\nexport const FLOWBITE_EXTRACTED = ${JSON.stringify(flowbite, null, 2)} as const;\n\nexport const UNTITLED_EXTRACTED = ${JSON.stringify(untitled, null, 2)} as const;\n`;

writeFileSync(resolve(root, "src/presets/extracted-data.ts"), `${banner}${body}`);
console.log("Generated src/presets/extracted-data.ts");
