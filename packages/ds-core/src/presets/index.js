import { normalizePaletteKey } from "../naming.js";
import { LOCAL_PRESETS } from "./local-presets.generated.js";
import { STATIC_COLOR_PRESETS } from "./static-presets.js";

const EXCLUDED_COLOR_PRESET_IDS = new Set(["polaris"]);

function mergeColorPresets(staticPresets, localPresets) {
  const merged = staticPresets.filter((preset) => !EXCLUDED_COLOR_PRESET_IDS.has(preset.id));
  const existingIds = new Set(merged.map((preset) => preset.id));
  for (const preset of localPresets) {
    if (EXCLUDED_COLOR_PRESET_IDS.has(preset.id)) continue;
    if (existingIds.has(preset.id)) continue;
    merged.push(preset);
    existingIds.add(preset.id);
  }
  return merged;
}

function clonePreviewPalette(palette, fallbackKey) {
  return {
    key: palette.key || fallbackKey || normalizePaletteKey(palette.name),
    name: palette.name,
    steps: [...palette.steps],
    colorsByStep: { ...palette.colorsByStep },
  };
}

function summarizeColorPreset(preset) {
  const paletteKeys = Object.keys(preset.palettes);
  return {
    id: preset.id,
    label: preset.label,
    description: preset.description,
    paletteCount: paletteKeys.length,
    neutralOptions: [...preset.neutralOptions],
    defaultNeutral: preset.defaultNeutral,
    steps: [...preset.steps],
    previewPalettes: preset.previewPalettes.map((palette, index) =>
      clonePreviewPalette(palette, paletteKeys[index] || `palette-${index + 1}`),
    ),
  };
}

const BUILTIN_COLOR_PRESETS = mergeColorPresets(STATIC_COLOR_PRESETS, LOCAL_PRESETS);

function getColorPresetById(presetId) {
  return BUILTIN_COLOR_PRESETS.find((preset) => preset.id === presetId);
}

function getColorPresetSummaries() {
  return BUILTIN_COLOR_PRESETS.map((preset) => summarizeColorPreset(preset));
}

export { BUILTIN_COLOR_PRESETS, getColorPresetById, getColorPresetSummaries };
