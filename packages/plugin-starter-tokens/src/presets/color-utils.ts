import { parseColorInput, rgbaToHex } from "@starter-tokens/ds-core";
import type { RGBA } from "@starter-tokens/ds-core";

export { colorWithAlpha, parseColorInput, rgbaToHex, sanitizeKebabSegment } from "@starter-tokens/ds-core";
export type { RGBA } from "@starter-tokens/ds-core";

type HSL = { h: number; s: number; l: number };
type OKLab = { l: number; a: number; b: number };
type OKLCH = { l: number; c: number; h: number };

const LIGHT_RATIO: Record<number, number> = {
  50: 0.95,
  100: 0.82,
  200: 0.66,
  300: 0.5,
  400: 0.3,
};

const DARK_RATIO: Record<number, number> = {
  600: 0.16,
  700: 0.34,
  800: 0.52,
  900: 0.7,
  950: 0.82,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function rgbToHsl(color: RGBA): HSL {
  const r = clamp01(color.r);
  const g = clamp01(color.g);
  const b = clamp01(color.b);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

function hslToRgb(color: HSL): RGBA {
  const h = ((color.h % 360) + 360) % 360;
  const s = clamp01(color.s);
  const l = clamp01(color.l);

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: clamp01(r + m),
    g: clamp01(g + m),
    b: clamp01(b + m),
    a: 1,
  };
}

function ratioForStep(step: number, table: Record<number, number>, isDark: boolean): number {
  if (table[step] !== undefined) return table[step];
  if (isDark) return clamp01((step - 500) / 450);
  return clamp01((500 - step) / 450);
}

function ratioForDynamicStep(step: number, minStep: number, baseStep: number, maxStep: number, isDark: boolean): number {
  if (step === baseStep) return 0;
  if (isDark) {
    const range = Math.max(1, maxStep - baseStep);
    return clamp01((step - baseStep) / range);
  }
  const range = Math.max(1, baseStep - minStep);
  return clamp01((baseStep - step) / range);
}

function ensureMonotone(lightnessByStep: Record<number, number>, sortedSteps: number[]): Record<number, number> {
  const result: Record<number, number> = {};
  let previous = 1.01;
  for (const step of sortedSteps) {
    let value = clamp01(lightnessByStep[step]);
    if (value >= previous) {
      value = Math.max(0.02, previous - 0.015);
    }
    result[step] = value;
    previous = value;
  }
  return result;
}

function srgbToLinear(value: number): number {
  const v = clamp01(value);
  if (v <= 0.04045) return v / 12.92;
  return ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  const v = Math.max(0, value);
  if (v <= 0.0031308) return 12.92 * v;
  return 1.055 * v ** (1 / 2.4) - 0.055;
}

function rgbToOkLab(color: RGBA): OKLab {
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lCube = Math.cbrt(Math.max(0, l));
  const mCube = Math.cbrt(Math.max(0, m));
  const sCube = Math.cbrt(Math.max(0, s));

  return {
    l: 0.2104542553 * lCube + 0.793617785 * mCube - 0.0040720468 * sCube,
    a: 1.9779984951 * lCube - 2.428592205 * mCube + 0.4505937099 * sCube,
    b: 0.0259040371 * lCube + 0.7827717662 * mCube - 0.808675766 * sCube,
  };
}

function okLabToRgb(color: OKLab): RGBA {
  const lCube = color.l + 0.3963377774 * color.a + 0.2158037573 * color.b;
  const mCube = color.l - 0.1055613458 * color.a - 0.0638541728 * color.b;
  const sCube = color.l - 0.0894841775 * color.a - 1.291485548 * color.b;

  const l = lCube ** 3;
  const m = mCube ** 3;
  const s = sCube ** 3;

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: linearToSrgb(rLin),
    g: linearToSrgb(gLin),
    b: linearToSrgb(bLin),
    a: 1,
  };
}

function okLabToOklch(color: OKLab): OKLCH {
  const c = Math.hypot(color.a, color.b);
  let h = (Math.atan2(color.b, color.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: color.l, c, h };
}

function oklchToOkLab(color: OKLCH): OKLab {
  const radians = (color.h * Math.PI) / 180;
  return {
    l: color.l,
    a: color.c * Math.cos(radians),
    b: color.c * Math.sin(radians),
  };
}

function isInGamut(rgb: RGBA): boolean {
  return rgb.r >= 0 && rgb.r <= 1 && rgb.g >= 0 && rgb.g <= 1 && rgb.b >= 0 && rgb.b <= 1;
}

function oklchToGamutRgb(color: OKLCH): RGBA {
  let candidate = color.c;
  for (let i = 0; i < 14; i += 1) {
    const rgb = okLabToRgb(oklchToOkLab({ ...color, c: candidate }));
    if (isInGamut(rgb)) {
      return {
        r: clamp01(rgb.r),
        g: clamp01(rgb.g),
        b: clamp01(rgb.b),
        a: 1,
      };
    }
    candidate *= 0.86;
  }
  const fallback = okLabToRgb(oklchToOkLab({ ...color, c: 0 }));
  return {
    r: clamp01(fallback.r),
    g: clamp01(fallback.g),
    b: clamp01(fallback.b),
    a: 1,
  };
}

function buildBrandScaleWithHsl(baseColor: string, steps: number[], baseStep: number): Record<number, string> {
  const sortedSteps = [...new Set(steps)].sort((a, b) => a - b);
  if (!sortedSteps.length) return {};
  if (!sortedSteps.includes(baseStep)) {
    throw new Error(`Base step ${baseStep} missing in scale.`);
  }

  const base = parseColorInput(baseColor);
  const baseHsl = rgbToHsl(base);
  const rawLightness: Record<number, number> = {};
  const saturationByStep: Record<number, number> = {};
  const minStep = sortedSteps[0];
  const maxStep = sortedSteps[sortedSteps.length - 1];

  for (const step of sortedSteps) {
    if (step === baseStep) {
      rawLightness[step] = baseHsl.l;
      saturationByStep[step] = baseHsl.s;
      continue;
    }

    if (step < baseStep) {
      const ratio = baseStep === 500 ? ratioForStep(step, LIGHT_RATIO, false) : ratioForDynamicStep(step, minStep, baseStep, maxStep, false);
      rawLightness[step] = baseHsl.l + (0.98 - baseHsl.l) * ratio;
      saturationByStep[step] = clamp01(baseHsl.s * (1 - ratio * 0.22));
      continue;
    }

    const ratio = baseStep === 500 ? ratioForStep(step, DARK_RATIO, true) : ratioForDynamicStep(step, minStep, baseStep, maxStep, true);
    rawLightness[step] = baseHsl.l - (baseHsl.l - 0.08) * ratio;
    saturationByStep[step] = clamp01(baseHsl.s * (1 - ratio * 0.1));
  }

  const monotone = ensureMonotone(rawLightness, sortedSteps);
  const scale: Record<number, string> = {};

  for (const step of sortedSteps) {
    if (step === baseStep) {
      scale[step] = rgbaToHex({
        r: base.r,
        g: base.g,
        b: base.b,
        a: 1,
      });
      continue;
    }

    const color = hslToRgb({
      h: baseHsl.h,
      s: saturationByStep[step] ?? baseHsl.s,
      l: monotone[step],
    });
    scale[step] = rgbaToHex(color);
  }

  return scale;
}

function buildBrandScaleWithOklch(baseColor: string, steps: number[], baseStep: number): Record<number, string> {
  const sortedSteps = [...new Set(steps)].sort((a, b) => a - b);
  if (!sortedSteps.length) return {};
  if (!sortedSteps.includes(baseStep)) {
    throw new Error(`Base step ${baseStep} missing in scale.`);
  }

  const minStep = sortedSteps[0];
  const maxStep = sortedSteps[sortedSteps.length - 1];
  const base = parseColorInput(baseColor);
  const baseLch = okLabToOklch(rgbToOkLab(base));

  const rawLightness: Record<number, number> = {};
  const chromaByStep: Record<number, number> = {};

  for (const step of sortedSteps) {
    if (step === baseStep) {
      rawLightness[step] = baseLch.l;
      chromaByStep[step] = baseLch.c;
      continue;
    }

    if (step < baseStep) {
      const ratio = baseStep === 500 ? ratioForStep(step, LIGHT_RATIO, false) : ratioForDynamicStep(step, minStep, baseStep, maxStep, false);
      rawLightness[step] = baseLch.l + (0.985 - baseLch.l) * ratio;
      chromaByStep[step] = Math.max(0, baseLch.c * (1 - ratio * 0.72));
      continue;
    }

    const ratio = baseStep === 500 ? ratioForStep(step, DARK_RATIO, true) : ratioForDynamicStep(step, minStep, baseStep, maxStep, true);
    rawLightness[step] = baseLch.l - (baseLch.l - 0.12) * ratio;
    chromaByStep[step] = Math.max(0, baseLch.c * (1 - ratio * 0.35));
  }

  const monotone = ensureMonotone(rawLightness, sortedSteps);
  const scale: Record<number, string> = {};

  for (const step of sortedSteps) {
    if (step === baseStep) {
      scale[step] = rgbaToHex({
        r: base.r,
        g: base.g,
        b: base.b,
        a: 1,
      });
      continue;
    }

    const rgb = oklchToGamutRgb({
      l: clamp01(monotone[step]),
      c: chromaByStep[step] ?? baseLch.c,
      h: baseLch.h,
    });
    scale[step] = rgbaToHex(rgb);
  }

  return scale;
}

export function buildBrandScale(baseColor: string, steps: number[], baseStep = 500): Record<number, string> {
  try {
    return buildBrandScaleWithOklch(baseColor, steps, baseStep);
  } catch {
    return buildBrandScaleWithHsl(baseColor, steps, baseStep);
  }
}
