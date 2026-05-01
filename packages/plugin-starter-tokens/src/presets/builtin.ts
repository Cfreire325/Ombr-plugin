import { normalizePaletteKey } from "../../../ds-core/src/index.js";
import type { PresetDefinition, PresetSummary } from "./types";
import { LOCAL_PRESETS } from "./local-presets.generated";
import { STATIC_PRESETS } from "./static-presets";

const EXCLUDED_PRESET_IDS = new Set(["polaris"]);

function mergePresets(staticPresets: PresetDefinition[], localPresets: PresetDefinition[]): PresetDefinition[] {
  const merged: PresetDefinition[] = staticPresets.filter((preset) => !EXCLUDED_PRESET_IDS.has(preset.id));
  const existingIds = new Set(merged.map((preset) => preset.id));
  for (const preset of localPresets) {
    if (EXCLUDED_PRESET_IDS.has(preset.id)) continue;
    if (existingIds.has(preset.id)) continue;
    merged.push(preset);
    existingIds.add(preset.id);
  }
  return merged;
}

export const BUILTIN_PRESETS: PresetDefinition[] = mergePresets(STATIC_PRESETS, LOCAL_PRESETS);

export function getPresetById(presetId: string): PresetDefinition | undefined {
  return BUILTIN_PRESETS.find((preset) => preset.id === presetId);
}

export function getPresetSummaries(): PresetSummary[] {
  return BUILTIN_PRESETS.map((preset) => {
    const paletteKeys = Object.keys(preset.palettes);
    return {
      id: preset.id,
      label: preset.label,
      description: preset.description,
      paletteCount: paletteKeys.length,
      neutralOptions: [...preset.neutralOptions],
      defaultNeutral: preset.defaultNeutral,
      steps: [...preset.steps],
      previewPalettes: preset.previewPalettes.map((palette, index) => ({
        key: palette.key || paletteKeys[index] || normalizePaletteKey(palette.name) || `palette-${index + 1}`,
        name: palette.name,
        steps: [...palette.steps],
        colorsByStep: { ...palette.colorsByStep },
      })),
    };
  });
}
