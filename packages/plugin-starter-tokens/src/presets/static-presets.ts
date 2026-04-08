import { TAILWIND_COLORS, TAILWIND_NEUTRALS, TAILWIND_STEPS } from "./tailwind-colors";
import type { PresetDefinition } from "./types";

function toTitle(input: string): string {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function tailwindPaletteToStringSteps(palette: Record<number, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const step of TAILWIND_STEPS) {
    const color = palette[step];
    if (!color) continue;
    out[String(step)] = color;
  }
  return out;
}

function buildTailwindPreset(): PresetDefinition {
  const palettes: Record<string, Record<string, string>> = {};
  for (const [paletteName, palette] of Object.entries(TAILWIND_COLORS)) {
    palettes[paletteName] = tailwindPaletteToStringSteps(palette);
  }

  const steps = TAILWIND_STEPS.map((step) => String(step));
  const previewPalettes = Object.entries(palettes).map(([name, colorsByStep]) => ({
    name: toTitle(name),
    steps,
    colorsByStep: { ...colorsByStep },
  }));

  return {
    id: "tailwind",
    label: "Tailwind",
    description: "Tailwind CSS full color system (all palettes, 50-950).",
    palettes,
    neutralOptions: [...TAILWIND_NEUTRALS],
    defaultNeutral: "gray",
    steps,
    previewPalettes,
  };
}

export const STATIC_PRESETS: PresetDefinition[] = [buildTailwindPreset()];
