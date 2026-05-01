import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PRESET_DIR_CANDIDATES = ["Colors - Preset Palette", "Colors -  Preset Palette"];
const PREFERRED_NEUTRALS = ["slate", "gray", "grey", "neutral", "zinc", "stone", "blue-grey", "blue-gray", "base"];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function toHexByte(value01) {
  return Math.round(clamp01(value01) * 255)
    .toString(16)
    .padStart(2, "0");
}

function normalizeChannel(value) {
  if (!Number.isFinite(value)) return 0;
  return value > 1 ? value / 255 : value;
}

function toCssColor(value) {
  if (typeof value === "string") {
    const text = value.trim();
    return text ? text : null;
  }

  if (!isObject(value)) return null;
  if (!["r", "g", "b"].every((key) => Number.isFinite(value[key]))) return null;

  const r = clamp01(normalizeChannel(Number(value.r)));
  const g = clamp01(normalizeChannel(Number(value.g)));
  const b = clamp01(normalizeChannel(Number(value.b)));
  const a = clamp01(normalizeChannel(Number.isFinite(value.a) ? Number(value.a) : 1));

  if (a < 0.999) {
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Number(a.toFixed(4))})`;
  }

  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

function extractColorFromToken(token) {
  if (typeof token === "string") return toCssColor(token);
  if (!isObject(token)) return null;
  if (Object.prototype.hasOwnProperty.call(token, "$value")) {
    return toCssColor(token.$value);
  }
  if (["r", "g", "b"].every((key) => Number.isFinite(token[key]))) {
    return toCssColor(token);
  }
  return null;
}

function parseStepNumber(step) {
  if (!/^-?\d+(?:\.\d+)?$/.test(step)) return null;
  const numeric = Number(step);
  return Number.isFinite(numeric) ? numeric : null;
}

function sortStepKeys(steps) {
  return [...new Set(steps)].sort((a, b) => {
    const na = parseStepNumber(a);
    const nb = parseStepNumber(b);
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return String(a).localeCompare(String(b));
  });
}

function sanitizeSlug(input) {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function formatTitle(input) {
  return String(input || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function paletteDisplayName(name) {
  const title = formatTitle(name);
  return title || "Palette";
}

function extractPaletteFromNode(node) {
  if (!isObject(node)) return null;
  const colorsByStep = {};

  for (const [step, token] of Object.entries(node)) {
    const color = extractColorFromToken(token);
    if (!color) continue;
    colorsByStep[String(step)] = color;
  }

  const steps = sortStepKeys(Object.keys(colorsByStep));
  if (!steps.length) return null;

  return {
    steps,
    colorsByStep,
  };
}

function extractPalettes(container) {
  if (!isObject(container)) return [];

  const palettes = [];
  for (const [name, node] of Object.entries(container)) {
    const parsed = extractPaletteFromNode(node);
    if (!parsed) continue;
    palettes.push({ rawName: name, ...parsed });
  }

  return palettes;
}

function detectPaletteCollection(raw) {
  const defaultMode = raw?.modes?.Default ?? raw?.modes?.default;
  const candidates = [];

  if (isObject(defaultMode)) {
    candidates.push(defaultMode);
    for (const child of Object.values(defaultMode)) {
      if (isObject(child)) candidates.push(child);
    }
  }

  if (isObject(raw)) {
    candidates.push(raw);
    for (const child of Object.values(raw)) {
      if (isObject(child)) candidates.push(child);
    }
  }

  let best = [];
  for (const candidate of candidates) {
    const palettes = extractPalettes(candidate);
    if (palettes.length > best.length) {
      best = palettes;
    }
  }

  return best;
}

function buildFallbackPreset() {
  const preview = [
    {
      name: "Gray",
      steps: ["50", "500", "900"],
      colorsByStep: {
        "50": "#f8fafc",
        "500": "#64748b",
        "900": "#0f172a",
      },
    },
  ];

  return {
    id: "default",
    label: "Default",
    description: "Fallback preset when no local JSON preset is available.",
    palettes: {
      gray: {
        "50": "#f8fafc",
        "500": "#64748b",
        "900": "#0f172a",
      },
    },
    neutralOptions: ["gray"],
    defaultNeutral: "gray",
    steps: ["50", "500", "900"],
    previewPalettes: preview,
  };
}

function findPresetDir(root) {
  for (const name of PRESET_DIR_CANDIDATES) {
    const candidate = resolve(root, name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function chooseNeutralOptions(paletteKeys) {
  const lowered = paletteKeys.map((key) => key.toLowerCase());
  const detected = lowered.filter((key) => /(slate|gray|grey|neutral|zinc|stone)/.test(key));

  if (!detected.length && lowered.includes("base")) {
    detected.push("base");
  }

  let defaultNeutral = PREFERRED_NEUTRALS.find((name) => lowered.includes(name));
  if (!defaultNeutral) {
    defaultNeutral = detected[0] || lowered[0] || "gray";
  }

  const options = Array.from(new Set([...detected, defaultNeutral])).filter(Boolean);
  if (!options.length) {
    return { neutralOptions: ["gray"], defaultNeutral: "gray" };
  }

  return { neutralOptions: options, defaultNeutral };
}

function buildPresetFromFile(filePath, fileName) {
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  const palettesRaw = detectPaletteCollection(raw);
  if (!palettesRaw.length) return null;

  const baseName = fileName.replace(/\.json$/i, "").replace(/\s*-\s*colors?$/i, "").trim();
  const idBase = sanitizeSlug(baseName) || "preset";
  const label = formatTitle(baseName) || "Preset";

  const previewPalettes = [];
  const palettes = {};
  const paletteKeys = [];
  const usedPaletteKeys = new Set();

  for (const palette of palettesRaw) {
    const baseKey = sanitizeSlug(palette.rawName) || "palette";
    let paletteKey = baseKey;
    let suffix = 2;
    while (usedPaletteKeys.has(paletteKey)) {
      paletteKey = `${baseKey}-${suffix}`;
      suffix += 1;
    }
    usedPaletteKeys.add(paletteKey);

    const colorsByStep = {};
    for (const step of palette.steps) {
      colorsByStep[step] = palette.colorsByStep[step];
    }

    palettes[paletteKey] = colorsByStep;
    previewPalettes.push({
      name: paletteDisplayName(palette.rawName),
      steps: [...palette.steps],
      colorsByStep,
    });
    paletteKeys.push(paletteKey);
  }

  const allSteps = sortStepKeys(previewPalettes.flatMap((palette) => palette.steps));
  const { neutralOptions, defaultNeutral } = chooseNeutralOptions(paletteKeys);

  return {
    id: idBase,
    label,
    description: `Local preset loaded from ${fileName}.`,
    palettes,
    neutralOptions,
    defaultNeutral,
    steps: allSteps,
    previewPalettes,
  };
}

function generate() {
  const root = process.cwd();
  const presetDir = findPresetDir(root);
  const presets = [];

  if (presetDir) {
    const files = readdirSync(presetDir)
      .filter((file) => file.toLowerCase().endsWith(".json"))
      .sort((a, b) => a.localeCompare(b));

    const usedPresetIds = new Set();

    for (const file of files) {
      const preset = buildPresetFromFile(resolve(presetDir, file), file);
      if (!preset) continue;

      let id = preset.id;
      let suffix = 2;
      while (usedPresetIds.has(id)) {
        id = `${preset.id}-${suffix}`;
        suffix += 1;
      }
      usedPresetIds.add(id);
      preset.id = id;

      presets.push(preset);
    }
  }

  if (!presets.length) {
    presets.push(buildFallbackPreset());
  }

  const outPath = resolve(root, "src/presets/local-presets.generated.ts");
  const body = `/* Auto-generated from local JSON preset files. */\nimport type { PresetDefinition } from "./types";\n\nexport const LOCAL_PRESETS: PresetDefinition[] = ${JSON.stringify(
    presets,
    null,
    2,
  )};\n`;

  writeFileSync(outPath, body, "utf8");
  console.log(`[extract-preset-palettes] Generated ${outPath} with ${presets.length} preset(s).`);
}

generate();
