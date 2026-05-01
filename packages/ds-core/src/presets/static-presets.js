import { TAILWIND_COLORS, TAILWIND_NEUTRALS, TAILWIND_STEPS } from "./tailwind-colors.js";

function toTitle(input) {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function tailwindPaletteToStringSteps(palette) {
  const out = {};
  for (const step of TAILWIND_STEPS) {
    const color = palette[step];
    if (!color) continue;
    out[String(step)] = color;
  }
  return out;
}

function buildTailwindPreset() {
  const palettes = {};
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

const STATIC_COLOR_PRESETS = [buildTailwindPreset()];

export { STATIC_COLOR_PRESETS };
