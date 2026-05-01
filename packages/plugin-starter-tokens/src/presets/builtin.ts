import { BUILTIN_COLOR_PRESETS, getColorPresetById, getColorPresetSummaries } from "../../../ds-core/src/index.js";
import type { PresetDefinition, PresetSummary } from "./types";

export const BUILTIN_PRESETS: PresetDefinition[] = BUILTIN_COLOR_PRESETS;

export function getPresetById(presetId: string): PresetDefinition | undefined {
  return getColorPresetById(presetId);
}

export function getPresetSummaries(): PresetSummary[] {
  return getColorPresetSummaries();
}
