import type { PresetDefinition, PresetSummary } from "./types";
import { LOCAL_PRESETS } from "./local-presets.generated";

export const BUILTIN_PRESETS: PresetDefinition[] = LOCAL_PRESETS;

export function getPresetById(presetId: string): PresetDefinition | undefined {
  return BUILTIN_PRESETS.find((preset) => preset.id === presetId);
}

export function getPresetSummaries(): PresetSummary[] {
  return BUILTIN_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    description: preset.description,
    paletteCount: Object.keys(preset.palettes).length,
    neutralOptions: [...preset.neutralOptions],
    defaultNeutral: preset.defaultNeutral,
    steps: [...preset.steps],
    previewPalettes: preset.previewPalettes.map((palette) => ({
      name: palette.name,
      steps: [...palette.steps],
      colorsByStep: { ...palette.colorsByStep },
    })),
  }));
}
