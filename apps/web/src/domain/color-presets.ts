import { getColorPresetById, getColorPresetSummaries, type ColorPresetDefinition, type ColorPresetSummary } from "@starter-tokens/ds-core";

export const DEFAULT_COLOR_PRESET_ID = "tailwind";

export function getAvailableColorPresetSummaries(): ColorPresetSummary[] {
  return getColorPresetSummaries();
}

export function getSelectedColorPreset(colorPresetId: string): ColorPresetDefinition {
  return getColorPresetById(colorPresetId) ?? getColorPresetById(DEFAULT_COLOR_PRESET_ID)!;
}
