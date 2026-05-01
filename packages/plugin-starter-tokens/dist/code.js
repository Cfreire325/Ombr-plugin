/* Generated from src/code.ts by packages/plugin-starter-tokens/scripts/build.mjs. Do not edit dist/code.js directly. */
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/presets/color-utils.ts
  var LIGHT_RATIO = {
    50: 0.95,
    100: 0.82,
    200: 0.66,
    300: 0.5,
    400: 0.3
  };
  var DARK_RATIO = {
    600: 0.16,
    700: 0.34,
    800: 0.52,
    900: 0.7,
    950: 0.82
  };
  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }
  function pairToByte(chunk) {
    return parseInt(chunk.length === 1 ? `${chunk}${chunk}` : chunk, 16);
  }
  function parseHex(value) {
    const clean = value.trim().replace(/^#/, "");
    if (![3, 4, 6, 8].includes(clean.length)) {
      throw new Error(`Invalid HEX color: ${value}`);
    }
    if (clean.length === 3 || clean.length === 4) {
      return {
        r: pairToByte(clean[0]) / 255,
        g: pairToByte(clean[1]) / 255,
        b: pairToByte(clean[2]) / 255,
        a: clean.length === 4 ? pairToByte(clean[3]) / 255 : 1
      };
    }
    return {
      r: pairToByte(clean.slice(0, 2)) / 255,
      g: pairToByte(clean.slice(2, 4)) / 255,
      b: pairToByte(clean.slice(4, 6)) / 255,
      a: clean.length === 8 ? pairToByte(clean.slice(6, 8)) / 255 : 1
    };
  }
  function parseRgb(value) {
    const match = value.trim().match(/^rgba?\((.+)\)$/i);
    if (!match) {
      throw new Error(`Invalid RGB color: ${value}`);
    }
    const parts = match[1].split(",").map((entry) => entry.trim());
    if (parts.length !== 3 && parts.length !== 4) {
      throw new Error(`Invalid RGB color: ${value}`);
    }
    const parseChannel = (input) => {
      if (input.endsWith("%")) return clamp01(Number(input.slice(0, -1)) / 100);
      return clamp01(Number(input) / 255);
    };
    const alphaInput = parts[3];
    const alpha = alphaInput ? alphaInput.endsWith("%") ? clamp01(Number(alphaInput.slice(0, -1)) / 100) : clamp01(Number(alphaInput)) : 1;
    return {
      r: parseChannel(parts[0]),
      g: parseChannel(parts[1]),
      b: parseChannel(parts[2]),
      a: alpha
    };
  }
  function toHexChannel(value) {
    return Math.round(clamp01(value) * 255).toString(16).padStart(2, "0");
  }
  function rgbToHsl(color) {
    const r = clamp01(color.r);
    const g = clamp01(color.g);
    const b = clamp01(color.b);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta !== 0) {
      if (max === r) h = (g - b) / delta % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    return { h, s, l };
  }
  function hslToRgb(color) {
    const h = (color.h % 360 + 360) % 360;
    const s = clamp01(color.s);
    const l = clamp01(color.l);
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(h / 60 % 2 - 1));
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
      a: 1
    };
  }
  function ratioForStep(step, table, isDark) {
    if (table[step] !== void 0) return table[step];
    if (isDark) return clamp01((step - 500) / 450);
    return clamp01((500 - step) / 450);
  }
  function ratioForDynamicStep(step, minStep, baseStep, maxStep, isDark) {
    if (step === baseStep) return 0;
    if (isDark) {
      const range2 = Math.max(1, maxStep - baseStep);
      return clamp01((step - baseStep) / range2);
    }
    const range = Math.max(1, baseStep - minStep);
    return clamp01((baseStep - step) / range);
  }
  function ensureMonotone(lightnessByStep, sortedSteps) {
    const result = {};
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
  function parseColorInput(value) {
    const text = value.trim();
    if (text.startsWith("#")) return parseHex(text);
    if (/^rgba?\(/i.test(text)) return parseRgb(text);
    throw new Error(`Unsupported color format: ${value}`);
  }
  function sanitizeKebabSegment(input, fallback = "brand") {
    const source = String(input || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const sanitized = source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
    return sanitized || fallback;
  }
  function rgbaToHex(value) {
    return `#${toHexChannel(value.r)}${toHexChannel(value.g)}${toHexChannel(value.b)}`;
  }
  function colorWithAlpha(baseColor, alphaPct) {
    const parsed = parseColorInput(baseColor);
    const alpha = clamp01(alphaPct / 100);
    const r = Math.round(parsed.r * 255);
    const g = Math.round(parsed.g * 255);
    const b = Math.round(parsed.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  function srgbToLinear(value) {
    const v = clamp01(value);
    if (v <= 0.04045) return v / 12.92;
    return ((v + 0.055) / 1.055) ** 2.4;
  }
  function linearToSrgb(value) {
    const v = Math.max(0, value);
    if (v <= 31308e-7) return 12.92 * v;
    return 1.055 * v ** (1 / 2.4) - 0.055;
  }
  function rgbToOkLab(color) {
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
      b: 0.0259040371 * lCube + 0.7827717662 * mCube - 0.808675766 * sCube
    };
  }
  function okLabToRgb(color) {
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
      a: 1
    };
  }
  function okLabToOklch(color) {
    const c = Math.hypot(color.a, color.b);
    let h = Math.atan2(color.b, color.a) * 180 / Math.PI;
    if (h < 0) h += 360;
    return { l: color.l, c, h };
  }
  function oklchToOkLab(color) {
    const radians = color.h * Math.PI / 180;
    return {
      l: color.l,
      a: color.c * Math.cos(radians),
      b: color.c * Math.sin(radians)
    };
  }
  function isInGamut(rgb) {
    return rgb.r >= 0 && rgb.r <= 1 && rgb.g >= 0 && rgb.g <= 1 && rgb.b >= 0 && rgb.b <= 1;
  }
  function oklchToGamutRgb(color) {
    let candidate = color.c;
    for (let i = 0; i < 14; i += 1) {
      const rgb = okLabToRgb(oklchToOkLab(__spreadProps(__spreadValues({}, color), { c: candidate })));
      if (isInGamut(rgb)) {
        return {
          r: clamp01(rgb.r),
          g: clamp01(rgb.g),
          b: clamp01(rgb.b),
          a: 1
        };
      }
      candidate *= 0.86;
    }
    const fallback = okLabToRgb(oklchToOkLab(__spreadProps(__spreadValues({}, color), { c: 0 })));
    return {
      r: clamp01(fallback.r),
      g: clamp01(fallback.g),
      b: clamp01(fallback.b),
      a: 1
    };
  }
  function buildBrandScaleWithHsl(baseColor, steps, baseStep) {
    var _a;
    const sortedSteps = [...new Set(steps)].sort((a, b) => a - b);
    if (!sortedSteps.length) return {};
    if (!sortedSteps.includes(baseStep)) {
      throw new Error(`Base step ${baseStep} missing in scale.`);
    }
    const base = parseColorInput(baseColor);
    const baseHsl = rgbToHsl(base);
    const rawLightness = {};
    const saturationByStep = {};
    const minStep = sortedSteps[0];
    const maxStep = sortedSteps[sortedSteps.length - 1];
    for (const step of sortedSteps) {
      if (step === baseStep) {
        rawLightness[step] = baseHsl.l;
        saturationByStep[step] = baseHsl.s;
        continue;
      }
      if (step < baseStep) {
        const ratio2 = baseStep === 500 ? ratioForStep(step, LIGHT_RATIO, false) : ratioForDynamicStep(step, minStep, baseStep, maxStep, false);
        rawLightness[step] = baseHsl.l + (0.98 - baseHsl.l) * ratio2;
        saturationByStep[step] = clamp01(baseHsl.s * (1 - ratio2 * 0.22));
        continue;
      }
      const ratio = baseStep === 500 ? ratioForStep(step, DARK_RATIO, true) : ratioForDynamicStep(step, minStep, baseStep, maxStep, true);
      rawLightness[step] = baseHsl.l - (baseHsl.l - 0.08) * ratio;
      saturationByStep[step] = clamp01(baseHsl.s * (1 - ratio * 0.1));
    }
    const monotone = ensureMonotone(rawLightness, sortedSteps);
    const scale = {};
    for (const step of sortedSteps) {
      if (step === baseStep) {
        scale[step] = rgbaToHex({
          r: base.r,
          g: base.g,
          b: base.b,
          a: 1
        });
        continue;
      }
      const color = hslToRgb({
        h: baseHsl.h,
        s: (_a = saturationByStep[step]) != null ? _a : baseHsl.s,
        l: monotone[step]
      });
      scale[step] = rgbaToHex(color);
    }
    return scale;
  }
  function buildBrandScaleWithOklch(baseColor, steps, baseStep) {
    var _a;
    const sortedSteps = [...new Set(steps)].sort((a, b) => a - b);
    if (!sortedSteps.length) return {};
    if (!sortedSteps.includes(baseStep)) {
      throw new Error(`Base step ${baseStep} missing in scale.`);
    }
    const minStep = sortedSteps[0];
    const maxStep = sortedSteps[sortedSteps.length - 1];
    const base = parseColorInput(baseColor);
    const baseLch = okLabToOklch(rgbToOkLab(base));
    const rawLightness = {};
    const chromaByStep = {};
    for (const step of sortedSteps) {
      if (step === baseStep) {
        rawLightness[step] = baseLch.l;
        chromaByStep[step] = baseLch.c;
        continue;
      }
      if (step < baseStep) {
        const ratio2 = baseStep === 500 ? ratioForStep(step, LIGHT_RATIO, false) : ratioForDynamicStep(step, minStep, baseStep, maxStep, false);
        rawLightness[step] = baseLch.l + (0.985 - baseLch.l) * ratio2;
        chromaByStep[step] = Math.max(0, baseLch.c * (1 - ratio2 * 0.72));
        continue;
      }
      const ratio = baseStep === 500 ? ratioForStep(step, DARK_RATIO, true) : ratioForDynamicStep(step, minStep, baseStep, maxStep, true);
      rawLightness[step] = baseLch.l - (baseLch.l - 0.12) * ratio;
      chromaByStep[step] = Math.max(0, baseLch.c * (1 - ratio * 0.35));
    }
    const monotone = ensureMonotone(rawLightness, sortedSteps);
    const scale = {};
    for (const step of sortedSteps) {
      if (step === baseStep) {
        scale[step] = rgbaToHex({
          r: base.r,
          g: base.g,
          b: base.b,
          a: 1
        });
        continue;
      }
      const rgb = oklchToGamutRgb({
        l: clamp01(monotone[step]),
        c: (_a = chromaByStep[step]) != null ? _a : baseLch.c,
        h: baseLch.h
      });
      scale[step] = rgbaToHex(rgb);
    }
    return scale;
  }
  function buildBrandScale(baseColor, steps, baseStep = 500) {
    try {
      return buildBrandScaleWithOklch(baseColor, steps, baseStep);
    } catch (e) {
      return buildBrandScaleWithHsl(baseColor, steps, baseStep);
    }
  }

  // src/presets/local-presets.generated.ts
  var LOCAL_PRESETS = [
    {
      "id": "material",
      "label": "Material",
      "description": "Local preset loaded from Material - colors.json.",
      "palettes": {
        "neutral": {
          "black": "#000000",
          "white": "#ffffff"
        },
        "red": {
          "50": "#ffebee",
          "100": "#ffcdd2",
          "200": "#ef9a9a",
          "300": "#e57373",
          "400": "#ef5350",
          "500": "#f44336",
          "600": "#e53935",
          "700": "#d32f2f",
          "800": "#c62828",
          "900": "#b71c1c",
          "A100": "#ff8a80",
          "A200": "#ff5252",
          "A400": "#ff1744",
          "A700": "#d50000"
        },
        "pink": {
          "50": "#fce4ec",
          "100": "#f8bbd0",
          "200": "#f48fb1",
          "300": "#f06292",
          "400": "#ec407a",
          "500": "#e91e63",
          "600": "#d81b60",
          "700": "#c2185b",
          "800": "#ad1457",
          "900": "#880e4f",
          "A100": "#ff80ab",
          "A200": "#ff4081",
          "A400": "#f50057",
          "A700": "#c51162"
        },
        "purple": {
          "50": "#f3e5f5",
          "100": "#e1bee7",
          "200": "#ce93d8",
          "300": "#ba68c8",
          "400": "#ab47bc",
          "500": "#9c27b0",
          "600": "#8e24aa",
          "700": "#7b1fa2",
          "800": "#6a1b9a",
          "900": "#4a148c",
          "A100": "#ea80fc",
          "A200": "#e040fb",
          "A400": "#d500f9",
          "A700": "#aa00ff"
        },
        "deep-purple": {
          "50": "#ede7f6",
          "100": "#d1c4e9",
          "200": "#b39ddb",
          "300": "#9575cd",
          "400": "#7e57c2",
          "500": "#673ab7",
          "600": "#5e35b1",
          "700": "#512da8",
          "800": "#4527a0",
          "900": "#311b92",
          "A100": "#b388ff",
          "A200": "#7c4dff",
          "A400": "#651fff",
          "A700": "#6200ea"
        },
        "indigo": {
          "50": "#e8eaf6",
          "100": "#c5cae9",
          "200": "#9fa8da",
          "300": "#7986cb",
          "400": "#5c6bc0",
          "500": "#3f51b5",
          "600": "#3949ab",
          "700": "#303f9f",
          "800": "#283593",
          "900": "#1a237e",
          "A100": "#8c9eff",
          "A200": "#536dfe",
          "A400": "#3d5afe",
          "A700": "#304ffe"
        },
        "blue": {
          "50": "#e3f2fd",
          "100": "#bbdefb",
          "200": "#90caf9",
          "300": "#64b5f6",
          "400": "#42a5f5",
          "500": "#2196f3",
          "600": "#1e88e5",
          "700": "#1976d2",
          "800": "#1565c0",
          "900": "#0d47a1",
          "A100": "#82b1ff",
          "A200": "#448aff",
          "A400": "#2979ff",
          "A700": "#2962ff"
        },
        "light-blue": {
          "50": "#e1f5fe",
          "100": "#b3e5fc",
          "200": "#81d4fa",
          "300": "#4fc3f7",
          "400": "#29b6f6",
          "500": "#03a9f4",
          "600": "#039be5",
          "700": "#0288d1",
          "800": "#0277bd",
          "900": "#01579b",
          "A100": "#80d8ff",
          "A200": "#40c4ff",
          "A400": "#00b0ff",
          "A700": "#0091ea"
        },
        "cyan": {
          "50": "#e0f7fa",
          "100": "#b2ebf2",
          "200": "#80deea",
          "300": "#4dd0e1",
          "400": "#26c6da",
          "500": "#00bcd4",
          "600": "#00acc1",
          "700": "#0097a7",
          "800": "#00838f",
          "900": "#006064",
          "A100": "#84ffff",
          "A200": "#18ffff",
          "A400": "#00e5ff",
          "A700": "#00b8d4"
        },
        "teal": {
          "50": "#e0f2f1",
          "100": "#b2dfdb",
          "200": "#80cbc4",
          "300": "#4db6ac",
          "400": "#26a69a",
          "500": "#009688",
          "600": "#00897b",
          "700": "#00796b",
          "800": "#00695c",
          "900": "#004d40",
          "A100": "#a7ffeb",
          "A200": "#64ffda",
          "A400": "#1de9b6",
          "A700": "#00bfa5"
        },
        "green": {
          "50": "#e8f5e9",
          "100": "#c8e6c9",
          "200": "#a5d6a7",
          "300": "#81c784",
          "400": "#66bb6a",
          "500": "#4caf50",
          "600": "#43a047",
          "700": "#388e3c",
          "800": "#2e7d32",
          "900": "#1b5e20",
          "A100": "#b9f6ca",
          "A200": "#69f0ae",
          "A400": "#00e676",
          "A700": "#00c853"
        },
        "light-green": {
          "50": "#f1f8e9",
          "100": "#dcedc8",
          "200": "#c5e1a5",
          "300": "#aed581",
          "400": "#9ccc65",
          "500": "#8bc34a",
          "600": "#7cb342",
          "700": "#689f38",
          "800": "#558b2f",
          "900": "#33691e",
          "A100": "#ccff90",
          "A200": "#b2ff59",
          "A400": "#76ff03",
          "A700": "#64dd17"
        },
        "lime": {
          "50": "#f9fbe7",
          "100": "#f0f4c3",
          "200": "#e6ee9c",
          "300": "#dce775",
          "400": "#d4e157",
          "500": "#cddc39",
          "600": "#c0ca33",
          "700": "#afb42b",
          "800": "#9e9d24",
          "900": "#827717",
          "A100": "#f4ff81",
          "A200": "#eeff41",
          "A400": "#c6ff00",
          "A700": "#aeea00"
        },
        "yellow": {
          "50": "#fffde7",
          "100": "#fff9c4",
          "200": "#fff59d",
          "300": "#fff176",
          "400": "#ffee58",
          "500": "#ffeb3b",
          "600": "#fdd835",
          "700": "#fbc02d",
          "800": "#f9a825",
          "900": "#f57f17",
          "A100": "#ffff8d",
          "A200": "#ffff00",
          "A400": "#ffea00",
          "A700": "#ffd600"
        },
        "amber": {
          "50": "#fff8e1",
          "100": "#ffecb3",
          "200": "#ffe082",
          "300": "#ffd54f",
          "400": "#ffca28",
          "500": "#ffc107",
          "600": "#ffb300",
          "700": "#ffa000",
          "800": "#ff8f00",
          "900": "#ff6f00",
          "A100": "#ffe57f",
          "A200": "#ffd740",
          "A400": "#ffc400",
          "A700": "#ffab00"
        },
        "orange": {
          "50": "#fff3e0",
          "100": "#ffe0b2",
          "200": "#ffcc80",
          "300": "#ffb74d",
          "400": "#ffa726",
          "500": "#ff9800",
          "600": "#fb8c00",
          "700": "#f57c00",
          "800": "#ef6c00",
          "900": "#e65100",
          "A100": "#ffd180",
          "A200": "#ffab40",
          "A400": "#ff9100",
          "A700": "#ff6d00"
        },
        "deep-orange": {
          "50": "#fbe9e7",
          "100": "#ffccbc",
          "200": "#ffab91",
          "300": "#ff8a65",
          "400": "#ff7043",
          "500": "#ff5722",
          "600": "#f4511e",
          "700": "#e64a19",
          "800": "#d84315",
          "900": "#bf360c",
          "A100": "#ff9e80",
          "A200": "#ff6e40",
          "A400": "#ff3d00",
          "A700": "#dd2c00"
        },
        "brown": {
          "50": "#efebe9",
          "100": "#d7ccc8",
          "200": "#bcaaa4",
          "300": "#a1887f",
          "400": "#8d6e63",
          "500": "#795548",
          "600": "#6d4c41",
          "700": "#5d4037",
          "800": "#4e342e",
          "900": "#3e2723"
        },
        "grey": {
          "50": "#fafafa",
          "100": "#f5f5f5",
          "200": "#eeeeee",
          "300": "#e0e0e0",
          "400": "#bdbdbd",
          "500": "#9e9e9e",
          "600": "#757575",
          "700": "#616161",
          "800": "#424242",
          "900": "#212121"
        },
        "blue-grey": {
          "50": "#eceff1",
          "100": "#cfd8dc",
          "200": "#b0bec5",
          "300": "#90a4ae",
          "400": "#78909c",
          "500": "#607d8b",
          "600": "#546e7a",
          "700": "#455a64",
          "800": "#37474f",
          "900": "#263238"
        }
      },
      "neutralOptions": [
        "neutral",
        "grey",
        "blue-grey"
      ],
      "defaultNeutral": "grey",
      "steps": [
        "50",
        "100",
        "200",
        "300",
        "400",
        "500",
        "600",
        "700",
        "800",
        "900",
        "A100",
        "A200",
        "A400",
        "A700",
        "black",
        "white"
      ],
      "previewPalettes": [
        {
          "name": "Neutral",
          "steps": [
            "black",
            "white"
          ],
          "colorsByStep": {
            "black": "#000000",
            "white": "#ffffff"
          }
        },
        {
          "name": "Red",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#ffebee",
            "100": "#ffcdd2",
            "200": "#ef9a9a",
            "300": "#e57373",
            "400": "#ef5350",
            "500": "#f44336",
            "600": "#e53935",
            "700": "#d32f2f",
            "800": "#c62828",
            "900": "#b71c1c",
            "A100": "#ff8a80",
            "A200": "#ff5252",
            "A400": "#ff1744",
            "A700": "#d50000"
          }
        },
        {
          "name": "Pink",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#fce4ec",
            "100": "#f8bbd0",
            "200": "#f48fb1",
            "300": "#f06292",
            "400": "#ec407a",
            "500": "#e91e63",
            "600": "#d81b60",
            "700": "#c2185b",
            "800": "#ad1457",
            "900": "#880e4f",
            "A100": "#ff80ab",
            "A200": "#ff4081",
            "A400": "#f50057",
            "A700": "#c51162"
          }
        },
        {
          "name": "Purple",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#f3e5f5",
            "100": "#e1bee7",
            "200": "#ce93d8",
            "300": "#ba68c8",
            "400": "#ab47bc",
            "500": "#9c27b0",
            "600": "#8e24aa",
            "700": "#7b1fa2",
            "800": "#6a1b9a",
            "900": "#4a148c",
            "A100": "#ea80fc",
            "A200": "#e040fb",
            "A400": "#d500f9",
            "A700": "#aa00ff"
          }
        },
        {
          "name": "Deep Purple",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#ede7f6",
            "100": "#d1c4e9",
            "200": "#b39ddb",
            "300": "#9575cd",
            "400": "#7e57c2",
            "500": "#673ab7",
            "600": "#5e35b1",
            "700": "#512da8",
            "800": "#4527a0",
            "900": "#311b92",
            "A100": "#b388ff",
            "A200": "#7c4dff",
            "A400": "#651fff",
            "A700": "#6200ea"
          }
        },
        {
          "name": "Indigo",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#e8eaf6",
            "100": "#c5cae9",
            "200": "#9fa8da",
            "300": "#7986cb",
            "400": "#5c6bc0",
            "500": "#3f51b5",
            "600": "#3949ab",
            "700": "#303f9f",
            "800": "#283593",
            "900": "#1a237e",
            "A100": "#8c9eff",
            "A200": "#536dfe",
            "A400": "#3d5afe",
            "A700": "#304ffe"
          }
        },
        {
          "name": "Blue",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#e3f2fd",
            "100": "#bbdefb",
            "200": "#90caf9",
            "300": "#64b5f6",
            "400": "#42a5f5",
            "500": "#2196f3",
            "600": "#1e88e5",
            "700": "#1976d2",
            "800": "#1565c0",
            "900": "#0d47a1",
            "A100": "#82b1ff",
            "A200": "#448aff",
            "A400": "#2979ff",
            "A700": "#2962ff"
          }
        },
        {
          "name": "Light Blue",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#e1f5fe",
            "100": "#b3e5fc",
            "200": "#81d4fa",
            "300": "#4fc3f7",
            "400": "#29b6f6",
            "500": "#03a9f4",
            "600": "#039be5",
            "700": "#0288d1",
            "800": "#0277bd",
            "900": "#01579b",
            "A100": "#80d8ff",
            "A200": "#40c4ff",
            "A400": "#00b0ff",
            "A700": "#0091ea"
          }
        },
        {
          "name": "Cyan",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#e0f7fa",
            "100": "#b2ebf2",
            "200": "#80deea",
            "300": "#4dd0e1",
            "400": "#26c6da",
            "500": "#00bcd4",
            "600": "#00acc1",
            "700": "#0097a7",
            "800": "#00838f",
            "900": "#006064",
            "A100": "#84ffff",
            "A200": "#18ffff",
            "A400": "#00e5ff",
            "A700": "#00b8d4"
          }
        },
        {
          "name": "Teal",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#e0f2f1",
            "100": "#b2dfdb",
            "200": "#80cbc4",
            "300": "#4db6ac",
            "400": "#26a69a",
            "500": "#009688",
            "600": "#00897b",
            "700": "#00796b",
            "800": "#00695c",
            "900": "#004d40",
            "A100": "#a7ffeb",
            "A200": "#64ffda",
            "A400": "#1de9b6",
            "A700": "#00bfa5"
          }
        },
        {
          "name": "Green",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#e8f5e9",
            "100": "#c8e6c9",
            "200": "#a5d6a7",
            "300": "#81c784",
            "400": "#66bb6a",
            "500": "#4caf50",
            "600": "#43a047",
            "700": "#388e3c",
            "800": "#2e7d32",
            "900": "#1b5e20",
            "A100": "#b9f6ca",
            "A200": "#69f0ae",
            "A400": "#00e676",
            "A700": "#00c853"
          }
        },
        {
          "name": "Light Green",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#f1f8e9",
            "100": "#dcedc8",
            "200": "#c5e1a5",
            "300": "#aed581",
            "400": "#9ccc65",
            "500": "#8bc34a",
            "600": "#7cb342",
            "700": "#689f38",
            "800": "#558b2f",
            "900": "#33691e",
            "A100": "#ccff90",
            "A200": "#b2ff59",
            "A400": "#76ff03",
            "A700": "#64dd17"
          }
        },
        {
          "name": "Lime",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#f9fbe7",
            "100": "#f0f4c3",
            "200": "#e6ee9c",
            "300": "#dce775",
            "400": "#d4e157",
            "500": "#cddc39",
            "600": "#c0ca33",
            "700": "#afb42b",
            "800": "#9e9d24",
            "900": "#827717",
            "A100": "#f4ff81",
            "A200": "#eeff41",
            "A400": "#c6ff00",
            "A700": "#aeea00"
          }
        },
        {
          "name": "Yellow",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#fffde7",
            "100": "#fff9c4",
            "200": "#fff59d",
            "300": "#fff176",
            "400": "#ffee58",
            "500": "#ffeb3b",
            "600": "#fdd835",
            "700": "#fbc02d",
            "800": "#f9a825",
            "900": "#f57f17",
            "A100": "#ffff8d",
            "A200": "#ffff00",
            "A400": "#ffea00",
            "A700": "#ffd600"
          }
        },
        {
          "name": "Amber",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#fff8e1",
            "100": "#ffecb3",
            "200": "#ffe082",
            "300": "#ffd54f",
            "400": "#ffca28",
            "500": "#ffc107",
            "600": "#ffb300",
            "700": "#ffa000",
            "800": "#ff8f00",
            "900": "#ff6f00",
            "A100": "#ffe57f",
            "A200": "#ffd740",
            "A400": "#ffc400",
            "A700": "#ffab00"
          }
        },
        {
          "name": "Orange",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#fff3e0",
            "100": "#ffe0b2",
            "200": "#ffcc80",
            "300": "#ffb74d",
            "400": "#ffa726",
            "500": "#ff9800",
            "600": "#fb8c00",
            "700": "#f57c00",
            "800": "#ef6c00",
            "900": "#e65100",
            "A100": "#ffd180",
            "A200": "#ffab40",
            "A400": "#ff9100",
            "A700": "#ff6d00"
          }
        },
        {
          "name": "Deep Orange",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A400",
            "A700"
          ],
          "colorsByStep": {
            "50": "#fbe9e7",
            "100": "#ffccbc",
            "200": "#ffab91",
            "300": "#ff8a65",
            "400": "#ff7043",
            "500": "#ff5722",
            "600": "#f4511e",
            "700": "#e64a19",
            "800": "#d84315",
            "900": "#bf360c",
            "A100": "#ff9e80",
            "A200": "#ff6e40",
            "A400": "#ff3d00",
            "A700": "#dd2c00"
          }
        },
        {
          "name": "Brown",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900"
          ],
          "colorsByStep": {
            "50": "#efebe9",
            "100": "#d7ccc8",
            "200": "#bcaaa4",
            "300": "#a1887f",
            "400": "#8d6e63",
            "500": "#795548",
            "600": "#6d4c41",
            "700": "#5d4037",
            "800": "#4e342e",
            "900": "#3e2723"
          }
        },
        {
          "name": "Grey",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900"
          ],
          "colorsByStep": {
            "50": "#fafafa",
            "100": "#f5f5f5",
            "200": "#eeeeee",
            "300": "#e0e0e0",
            "400": "#bdbdbd",
            "500": "#9e9e9e",
            "600": "#757575",
            "700": "#616161",
            "800": "#424242",
            "900": "#212121"
          }
        },
        {
          "name": "Blue Grey",
          "steps": [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900"
          ],
          "colorsByStep": {
            "50": "#eceff1",
            "100": "#cfd8dc",
            "200": "#b0bec5",
            "300": "#90a4ae",
            "400": "#78909c",
            "500": "#607d8b",
            "600": "#546e7a",
            "700": "#455a64",
            "800": "#37474f",
            "900": "#263238"
          }
        }
      ]
    },
    {
      "id": "untitled-ui",
      "label": "Untitled Ui",
      "description": "Local preset loaded from Untitled ui - colors.json.",
      "palettes": {
        "base": {
          "black": "#000000",
          "transparent": "rgba(255, 255, 255, 0)",
          "white": "#ffffff"
        },
        "brand": {
          "25": "#fcfaff",
          "50": "#f9f5ff",
          "100": "#f4ebff",
          "200": "#e9d7fe",
          "300": "#d6bbfb",
          "400": "#b692f6",
          "500": "#9e77ed",
          "600": "#7f56d9",
          "700": "#6941c6",
          "800": "#53389e",
          "900": "#42307d",
          "950": "#2c1c5f"
        },
        "error": {
          "25": "#fffbfa",
          "50": "#fef3f2",
          "100": "#fee4e2",
          "200": "#fecdca",
          "300": "#fda29b",
          "400": "#f97066",
          "500": "#f04438",
          "600": "#d92d20",
          "700": "#b42318",
          "800": "#912018",
          "900": "#7a271a",
          "950": "#55160c"
        },
        "warning": {
          "25": "#fffcf5",
          "50": "#fffaeb",
          "100": "#fef0c7",
          "200": "#fedf89",
          "300": "#fec84b",
          "400": "#fdb022",
          "500": "#f79009",
          "600": "#dc6803",
          "700": "#b54708",
          "800": "#93370d",
          "900": "#7a2e0e",
          "950": "#4e1d09"
        },
        "success": {
          "25": "#f6fef9",
          "50": "#ecfdf3",
          "100": "#dcfae6",
          "200": "#abefc6",
          "300": "#75e0a7",
          "400": "#47cd89",
          "500": "#17b26a",
          "600": "#079455",
          "700": "#067647",
          "800": "#085d3a",
          "900": "#074d31",
          "950": "#053321"
        },
        "moss": {
          "25": "#fafdf7",
          "50": "#f5fbee",
          "100": "#e6f4d7",
          "200": "#ceeab0",
          "300": "#acdc79",
          "400": "#86cb3c",
          "500": "#669f2a",
          "600": "#4f7a21",
          "700": "#3f621a",
          "800": "#335015",
          "900": "#2b4212",
          "950": "#1a280b"
        },
        "green-light": {
          "25": "#fafef5",
          "50": "#f3fee7",
          "100": "#e3fbcc",
          "200": "#d0f8ab",
          "300": "#a6ef67",
          "400": "#85e13a",
          "500": "#66c61c",
          "600": "#4ca30d",
          "700": "#3b7c0f",
          "800": "#326212",
          "900": "#2b5314",
          "950": "#15290a"
        },
        "green": {
          "25": "#f6fef9",
          "50": "#edfcf2",
          "100": "#d3f8df",
          "200": "#aaf0c4",
          "300": "#73e2a3",
          "400": "#3ccb7f",
          "500": "#16b364",
          "600": "#099250",
          "700": "#087443",
          "800": "#095c37",
          "900": "#084c2e",
          "950": "#052e1c"
        },
        "teal": {
          "25": "#f6fefc",
          "50": "#f0fdf9",
          "100": "#ccfbef",
          "200": "#99f6e0",
          "300": "#5fe9d0",
          "400": "#2ed3b7",
          "500": "#15b79e",
          "600": "#0e9384",
          "700": "#107569",
          "800": "#125d56",
          "900": "#134e48",
          "950": "#0a2926"
        },
        "cyan": {
          "25": "#f5feff",
          "50": "#ecfdff",
          "100": "#cff9fe",
          "200": "#a5f0fc",
          "300": "#67e3f9",
          "400": "#22ccee",
          "500": "#06aed4",
          "600": "#088ab2",
          "700": "#0e7090",
          "800": "#155b75",
          "900": "#164c63",
          "950": "#0d2d3a"
        },
        "blue-light": {
          "25": "#f5fbff",
          "50": "#f0f9ff",
          "100": "#e0f2fe",
          "200": "#b9e6fe",
          "300": "#7cd4fd",
          "400": "#36bffa",
          "500": "#0ba5ec",
          "600": "#0086c9",
          "700": "#026aa2",
          "800": "#065986",
          "900": "#0b4a6f",
          "950": "#062c41"
        },
        "blue": {
          "25": "#f5faff",
          "50": "#eff8ff",
          "100": "#d1e9ff",
          "200": "#b2ddff",
          "300": "#84caff",
          "400": "#53b1fd",
          "500": "#2e90fa",
          "600": "#1570ef",
          "700": "#175cd3",
          "800": "#1849a9",
          "900": "#194185",
          "950": "#102a56"
        },
        "blue-dark": {
          "25": "#f5f8ff",
          "50": "#eff4ff",
          "100": "#d1e0ff",
          "200": "#b2ccff",
          "300": "#84adff",
          "400": "#528bff",
          "500": "#2970ff",
          "600": "#155eef",
          "700": "#004eeb",
          "800": "#0040c1",
          "900": "#00359e",
          "950": "#002266"
        },
        "indigo": {
          "25": "#f5f8ff",
          "50": "#eef4ff",
          "100": "#e0eaff",
          "200": "#c7d7fe",
          "300": "#a4bcfd",
          "400": "#8098f9",
          "500": "#6172f3",
          "600": "#444ce7",
          "700": "#3538cd",
          "800": "#2d31a6",
          "900": "#2d3282",
          "950": "#1f235b"
        },
        "violet": {
          "25": "#fbfaff",
          "50": "#f5f3ff",
          "100": "#ece9fe",
          "200": "#ddd6fe",
          "300": "#c3b5fd",
          "400": "#a48afb",
          "500": "#875bf7",
          "600": "#7839ee",
          "700": "#6927da",
          "800": "#5720b7",
          "900": "#491c96",
          "950": "#2e125e"
        },
        "purple": {
          "25": "#fafaff",
          "50": "#f4f3ff",
          "100": "#ebe9fe",
          "200": "#d9d6fe",
          "300": "#bdb4fe",
          "400": "#9b8afb",
          "500": "#7a5af8",
          "600": "#6938ef",
          "700": "#5925dc",
          "800": "#4a1fb8",
          "900": "#3e1c96",
          "950": "#27115f"
        },
        "fuchsia": {
          "25": "#fefaff",
          "50": "#fdf4ff",
          "100": "#fbe8ff",
          "200": "#f6d0fe",
          "300": "#eeaafd",
          "400": "#e478fa",
          "500": "#d444f1",
          "600": "#ba24d5",
          "700": "#9f1ab1",
          "800": "#821890",
          "900": "#6f1877",
          "950": "#47104c"
        },
        "pink": {
          "25": "#fef6fb",
          "50": "#fdf2fa",
          "100": "#fce7f6",
          "200": "#fcceee",
          "300": "#faa7e0",
          "400": "#f670c7",
          "500": "#ee46bc",
          "600": "#dd2590",
          "700": "#c11574",
          "800": "#9e165f",
          "900": "#851651",
          "950": "#4e0d30"
        },
        "rose": {
          "25": "#fff5f6",
          "50": "#fff1f3",
          "100": "#ffe4e8",
          "200": "#fecdd6",
          "300": "#fea3b4",
          "400": "#fd6f8e",
          "500": "#f63d68",
          "600": "#e31b54",
          "700": "#c01048",
          "800": "#a11043",
          "900": "#89123e",
          "950": "#510b24"
        },
        "orange-dark": {
          "25": "#fff9f5",
          "50": "#fff4ed",
          "100": "#ffe6d5",
          "200": "#ffd6ae",
          "300": "#ff9c66",
          "400": "#ff692e",
          "500": "#ff4405",
          "600": "#e62e05",
          "700": "#bc1b06",
          "800": "#97180c",
          "900": "#771a0d",
          "950": "#57130a"
        },
        "orange": {
          "25": "#fefaf5",
          "50": "#fef6ee",
          "100": "#fdead7",
          "200": "#f9dbaf",
          "300": "#f7b27a",
          "400": "#f38744",
          "500": "#ef6820",
          "600": "#e04f16",
          "700": "#b93815",
          "800": "#932f19",
          "900": "#772917",
          "950": "#511c10"
        },
        "yellow": {
          "25": "#fefdf0",
          "50": "#fefbe8",
          "100": "#fef7c3",
          "200": "#feee95",
          "300": "#fde272",
          "400": "#fac515",
          "500": "#eaaa08",
          "600": "#ca8504",
          "700": "#a15c07",
          "800": "#854a0e",
          "900": "#713b12",
          "950": "#542c0d"
        },
        "gray-light": {
          "25": "#fdfdfd",
          "50": "#fafafa",
          "100": "#f5f5f5",
          "200": "#e9eaeb",
          "300": "#d5d7da",
          "400": "#a4a7ae",
          "500": "#717680",
          "600": "#535862",
          "700": "#414651",
          "800": "#252b37",
          "900": "#181d27",
          "950": "#0a0d12"
        },
        "gray-blue": {
          "25": "#fcfcfd",
          "50": "#f8f9fc",
          "100": "#eaecf5",
          "200": "#d5d9eb",
          "300": "#b3b8db",
          "400": "#717bbc",
          "500": "#4e5ba6",
          "600": "#3e4784",
          "700": "#363f72",
          "800": "#293056",
          "900": "#101323",
          "950": "#0d0f1c"
        },
        "gray-cool": {
          "25": "#fcfcfd",
          "50": "#f9f9fb",
          "100": "#eff1f5",
          "200": "#dcdfea",
          "300": "#b9c0d4",
          "400": "#7d89b0",
          "500": "#5d6b98",
          "600": "#4a5578",
          "700": "#404968",
          "800": "#30374f",
          "900": "#111322",
          "950": "#0e101b"
        },
        "gray-modern": {
          "25": "#fcfcfd",
          "50": "#f8fafc",
          "100": "#eef2f6",
          "200": "#e3e8ef",
          "300": "#cdd5df",
          "400": "#9aa4b2",
          "500": "#697586",
          "600": "#4b5565",
          "700": "#364152",
          "800": "#202939",
          "900": "#121926",
          "950": "#0d121c"
        },
        "gray-neutral": {
          "25": "#fcfcfd",
          "50": "#f9fafb",
          "100": "#f3f4f6",
          "200": "#e5e7eb",
          "300": "#d2d6db",
          "400": "#9da4ae",
          "500": "#6c737f",
          "600": "#4d5761",
          "700": "#384250",
          "800": "#1f2a37",
          "900": "#111927",
          "950": "#0d121c"
        },
        "gray-iron": {
          "25": "#fcfcfc",
          "50": "#fafafa",
          "100": "#f4f4f5",
          "200": "#e4e4e7",
          "300": "#d1d1d6",
          "400": "#a0a0ab",
          "500": "#70707b",
          "600": "#51525c",
          "700": "#3f3f46",
          "800": "#26272b",
          "900": "#1a1a1e",
          "950": "#131316"
        },
        "gray-true": {
          "25": "#fcfcfc",
          "50": "#f7f7f7",
          "100": "#f5f5f5",
          "200": "#e5e5e5",
          "300": "#d6d6d6",
          "400": "#a3a3a3",
          "500": "#737373",
          "600": "#525252",
          "700": "#424242",
          "800": "#292929",
          "900": "#141414",
          "950": "#0f0f0f"
        },
        "gray-warm": {
          "25": "#fdfdfc",
          "50": "#fafaf9",
          "100": "#f5f5f4",
          "200": "#e7e5e4",
          "300": "#d7d3d0",
          "400": "#a9a29d",
          "500": "#79716b",
          "600": "#57534e",
          "700": "#44403c",
          "800": "#292524",
          "900": "#1c1917",
          "950": "#171412"
        }
      },
      "neutralOptions": [
        "gray-light",
        "gray-blue",
        "gray-cool",
        "gray-modern",
        "gray-neutral",
        "gray-iron",
        "gray-true",
        "gray-warm",
        "base"
      ],
      "defaultNeutral": "base",
      "steps": [
        "25",
        "50",
        "100",
        "200",
        "300",
        "400",
        "500",
        "600",
        "700",
        "800",
        "900",
        "950",
        "black",
        "transparent",
        "white"
      ],
      "previewPalettes": [
        {
          "name": "Base",
          "steps": [
            "black",
            "transparent",
            "white"
          ],
          "colorsByStep": {
            "black": "#000000",
            "transparent": "rgba(255, 255, 255, 0)",
            "white": "#ffffff"
          }
        },
        {
          "name": "Brand",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fcfaff",
            "50": "#f9f5ff",
            "100": "#f4ebff",
            "200": "#e9d7fe",
            "300": "#d6bbfb",
            "400": "#b692f6",
            "500": "#9e77ed",
            "600": "#7f56d9",
            "700": "#6941c6",
            "800": "#53389e",
            "900": "#42307d",
            "950": "#2c1c5f"
          }
        },
        {
          "name": "Error",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fffbfa",
            "50": "#fef3f2",
            "100": "#fee4e2",
            "200": "#fecdca",
            "300": "#fda29b",
            "400": "#f97066",
            "500": "#f04438",
            "600": "#d92d20",
            "700": "#b42318",
            "800": "#912018",
            "900": "#7a271a",
            "950": "#55160c"
          }
        },
        {
          "name": "Warning",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fffcf5",
            "50": "#fffaeb",
            "100": "#fef0c7",
            "200": "#fedf89",
            "300": "#fec84b",
            "400": "#fdb022",
            "500": "#f79009",
            "600": "#dc6803",
            "700": "#b54708",
            "800": "#93370d",
            "900": "#7a2e0e",
            "950": "#4e1d09"
          }
        },
        {
          "name": "Success",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#f6fef9",
            "50": "#ecfdf3",
            "100": "#dcfae6",
            "200": "#abefc6",
            "300": "#75e0a7",
            "400": "#47cd89",
            "500": "#17b26a",
            "600": "#079455",
            "700": "#067647",
            "800": "#085d3a",
            "900": "#074d31",
            "950": "#053321"
          }
        },
        {
          "name": "Moss",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fafdf7",
            "50": "#f5fbee",
            "100": "#e6f4d7",
            "200": "#ceeab0",
            "300": "#acdc79",
            "400": "#86cb3c",
            "500": "#669f2a",
            "600": "#4f7a21",
            "700": "#3f621a",
            "800": "#335015",
            "900": "#2b4212",
            "950": "#1a280b"
          }
        },
        {
          "name": "Green Light",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fafef5",
            "50": "#f3fee7",
            "100": "#e3fbcc",
            "200": "#d0f8ab",
            "300": "#a6ef67",
            "400": "#85e13a",
            "500": "#66c61c",
            "600": "#4ca30d",
            "700": "#3b7c0f",
            "800": "#326212",
            "900": "#2b5314",
            "950": "#15290a"
          }
        },
        {
          "name": "Green",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#f6fef9",
            "50": "#edfcf2",
            "100": "#d3f8df",
            "200": "#aaf0c4",
            "300": "#73e2a3",
            "400": "#3ccb7f",
            "500": "#16b364",
            "600": "#099250",
            "700": "#087443",
            "800": "#095c37",
            "900": "#084c2e",
            "950": "#052e1c"
          }
        },
        {
          "name": "Teal",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#f6fefc",
            "50": "#f0fdf9",
            "100": "#ccfbef",
            "200": "#99f6e0",
            "300": "#5fe9d0",
            "400": "#2ed3b7",
            "500": "#15b79e",
            "600": "#0e9384",
            "700": "#107569",
            "800": "#125d56",
            "900": "#134e48",
            "950": "#0a2926"
          }
        },
        {
          "name": "Cyan",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#f5feff",
            "50": "#ecfdff",
            "100": "#cff9fe",
            "200": "#a5f0fc",
            "300": "#67e3f9",
            "400": "#22ccee",
            "500": "#06aed4",
            "600": "#088ab2",
            "700": "#0e7090",
            "800": "#155b75",
            "900": "#164c63",
            "950": "#0d2d3a"
          }
        },
        {
          "name": "Blue Light",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#f5fbff",
            "50": "#f0f9ff",
            "100": "#e0f2fe",
            "200": "#b9e6fe",
            "300": "#7cd4fd",
            "400": "#36bffa",
            "500": "#0ba5ec",
            "600": "#0086c9",
            "700": "#026aa2",
            "800": "#065986",
            "900": "#0b4a6f",
            "950": "#062c41"
          }
        },
        {
          "name": "Blue",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#f5faff",
            "50": "#eff8ff",
            "100": "#d1e9ff",
            "200": "#b2ddff",
            "300": "#84caff",
            "400": "#53b1fd",
            "500": "#2e90fa",
            "600": "#1570ef",
            "700": "#175cd3",
            "800": "#1849a9",
            "900": "#194185",
            "950": "#102a56"
          }
        },
        {
          "name": "Blue Dark",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#f5f8ff",
            "50": "#eff4ff",
            "100": "#d1e0ff",
            "200": "#b2ccff",
            "300": "#84adff",
            "400": "#528bff",
            "500": "#2970ff",
            "600": "#155eef",
            "700": "#004eeb",
            "800": "#0040c1",
            "900": "#00359e",
            "950": "#002266"
          }
        },
        {
          "name": "Indigo",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#f5f8ff",
            "50": "#eef4ff",
            "100": "#e0eaff",
            "200": "#c7d7fe",
            "300": "#a4bcfd",
            "400": "#8098f9",
            "500": "#6172f3",
            "600": "#444ce7",
            "700": "#3538cd",
            "800": "#2d31a6",
            "900": "#2d3282",
            "950": "#1f235b"
          }
        },
        {
          "name": "Violet",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fbfaff",
            "50": "#f5f3ff",
            "100": "#ece9fe",
            "200": "#ddd6fe",
            "300": "#c3b5fd",
            "400": "#a48afb",
            "500": "#875bf7",
            "600": "#7839ee",
            "700": "#6927da",
            "800": "#5720b7",
            "900": "#491c96",
            "950": "#2e125e"
          }
        },
        {
          "name": "Purple",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fafaff",
            "50": "#f4f3ff",
            "100": "#ebe9fe",
            "200": "#d9d6fe",
            "300": "#bdb4fe",
            "400": "#9b8afb",
            "500": "#7a5af8",
            "600": "#6938ef",
            "700": "#5925dc",
            "800": "#4a1fb8",
            "900": "#3e1c96",
            "950": "#27115f"
          }
        },
        {
          "name": "Fuchsia",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fefaff",
            "50": "#fdf4ff",
            "100": "#fbe8ff",
            "200": "#f6d0fe",
            "300": "#eeaafd",
            "400": "#e478fa",
            "500": "#d444f1",
            "600": "#ba24d5",
            "700": "#9f1ab1",
            "800": "#821890",
            "900": "#6f1877",
            "950": "#47104c"
          }
        },
        {
          "name": "Pink",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fef6fb",
            "50": "#fdf2fa",
            "100": "#fce7f6",
            "200": "#fcceee",
            "300": "#faa7e0",
            "400": "#f670c7",
            "500": "#ee46bc",
            "600": "#dd2590",
            "700": "#c11574",
            "800": "#9e165f",
            "900": "#851651",
            "950": "#4e0d30"
          }
        },
        {
          "name": "Rose",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fff5f6",
            "50": "#fff1f3",
            "100": "#ffe4e8",
            "200": "#fecdd6",
            "300": "#fea3b4",
            "400": "#fd6f8e",
            "500": "#f63d68",
            "600": "#e31b54",
            "700": "#c01048",
            "800": "#a11043",
            "900": "#89123e",
            "950": "#510b24"
          }
        },
        {
          "name": "Orange Dark",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fff9f5",
            "50": "#fff4ed",
            "100": "#ffe6d5",
            "200": "#ffd6ae",
            "300": "#ff9c66",
            "400": "#ff692e",
            "500": "#ff4405",
            "600": "#e62e05",
            "700": "#bc1b06",
            "800": "#97180c",
            "900": "#771a0d",
            "950": "#57130a"
          }
        },
        {
          "name": "Orange",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fefaf5",
            "50": "#fef6ee",
            "100": "#fdead7",
            "200": "#f9dbaf",
            "300": "#f7b27a",
            "400": "#f38744",
            "500": "#ef6820",
            "600": "#e04f16",
            "700": "#b93815",
            "800": "#932f19",
            "900": "#772917",
            "950": "#511c10"
          }
        },
        {
          "name": "Yellow",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fefdf0",
            "50": "#fefbe8",
            "100": "#fef7c3",
            "200": "#feee95",
            "300": "#fde272",
            "400": "#fac515",
            "500": "#eaaa08",
            "600": "#ca8504",
            "700": "#a15c07",
            "800": "#854a0e",
            "900": "#713b12",
            "950": "#542c0d"
          }
        },
        {
          "name": "Gray Light",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fdfdfd",
            "50": "#fafafa",
            "100": "#f5f5f5",
            "200": "#e9eaeb",
            "300": "#d5d7da",
            "400": "#a4a7ae",
            "500": "#717680",
            "600": "#535862",
            "700": "#414651",
            "800": "#252b37",
            "900": "#181d27",
            "950": "#0a0d12"
          }
        },
        {
          "name": "Gray Blue",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fcfcfd",
            "50": "#f8f9fc",
            "100": "#eaecf5",
            "200": "#d5d9eb",
            "300": "#b3b8db",
            "400": "#717bbc",
            "500": "#4e5ba6",
            "600": "#3e4784",
            "700": "#363f72",
            "800": "#293056",
            "900": "#101323",
            "950": "#0d0f1c"
          }
        },
        {
          "name": "Gray Cool",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fcfcfd",
            "50": "#f9f9fb",
            "100": "#eff1f5",
            "200": "#dcdfea",
            "300": "#b9c0d4",
            "400": "#7d89b0",
            "500": "#5d6b98",
            "600": "#4a5578",
            "700": "#404968",
            "800": "#30374f",
            "900": "#111322",
            "950": "#0e101b"
          }
        },
        {
          "name": "Gray Modern",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fcfcfd",
            "50": "#f8fafc",
            "100": "#eef2f6",
            "200": "#e3e8ef",
            "300": "#cdd5df",
            "400": "#9aa4b2",
            "500": "#697586",
            "600": "#4b5565",
            "700": "#364152",
            "800": "#202939",
            "900": "#121926",
            "950": "#0d121c"
          }
        },
        {
          "name": "Gray Neutral",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fcfcfd",
            "50": "#f9fafb",
            "100": "#f3f4f6",
            "200": "#e5e7eb",
            "300": "#d2d6db",
            "400": "#9da4ae",
            "500": "#6c737f",
            "600": "#4d5761",
            "700": "#384250",
            "800": "#1f2a37",
            "900": "#111927",
            "950": "#0d121c"
          }
        },
        {
          "name": "Gray Iron",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fcfcfc",
            "50": "#fafafa",
            "100": "#f4f4f5",
            "200": "#e4e4e7",
            "300": "#d1d1d6",
            "400": "#a0a0ab",
            "500": "#70707b",
            "600": "#51525c",
            "700": "#3f3f46",
            "800": "#26272b",
            "900": "#1a1a1e",
            "950": "#131316"
          }
        },
        {
          "name": "Gray True",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fcfcfc",
            "50": "#f7f7f7",
            "100": "#f5f5f5",
            "200": "#e5e5e5",
            "300": "#d6d6d6",
            "400": "#a3a3a3",
            "500": "#737373",
            "600": "#525252",
            "700": "#424242",
            "800": "#292929",
            "900": "#141414",
            "950": "#0f0f0f"
          }
        },
        {
          "name": "Gray Warm",
          "steps": [
            "25",
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "950"
          ],
          "colorsByStep": {
            "25": "#fdfdfc",
            "50": "#fafaf9",
            "100": "#f5f5f4",
            "200": "#e7e5e4",
            "300": "#d7d3d0",
            "400": "#a9a29d",
            "500": "#79716b",
            "600": "#57534e",
            "700": "#44403c",
            "800": "#292524",
            "900": "#1c1917",
            "950": "#171412"
          }
        }
      ]
    }
  ];

  // src/presets/tailwind-colors.ts
  var TAILWIND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  var TAILWIND_NEUTRALS = ["slate", "gray", "zinc", "neutral", "stone"];
  var TAILWIND_COLORS = {
    "slate": {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617"
    },
    "gray": {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
      950: "#030712"
    },
    "zinc": {
      50: "#fafafa",
      100: "#f4f4f5",
      200: "#e4e4e7",
      300: "#d4d4d8",
      400: "#a1a1aa",
      500: "#71717a",
      600: "#52525b",
      700: "#3f3f46",
      800: "#27272a",
      900: "#18181b",
      950: "#09090b"
    },
    "neutral": {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
      950: "#0a0a0a"
    },
    "stone": {
      50: "#fafaf9",
      100: "#f5f5f4",
      200: "#e7e5e4",
      300: "#d6d3d1",
      400: "#a8a29e",
      500: "#78716c",
      600: "#57534e",
      700: "#44403c",
      800: "#292524",
      900: "#1c1917",
      950: "#0c0a09"
    },
    "red": {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a"
    },
    "orange": {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
      950: "#431407"
    },
    "amber": {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
      950: "#451a03"
    },
    "yellow": {
      50: "#fefce8",
      100: "#fef9c3",
      200: "#fef08a",
      300: "#fde047",
      400: "#facc15",
      500: "#eab308",
      600: "#ca8a04",
      700: "#a16207",
      800: "#854d0e",
      900: "#713f12",
      950: "#422006"
    },
    "lime": {
      50: "#f7fee7",
      100: "#ecfccb",
      200: "#d9f99d",
      300: "#bef264",
      400: "#a3e635",
      500: "#84cc16",
      600: "#65a30d",
      700: "#4d7c0f",
      800: "#3f6212",
      900: "#365314",
      950: "#1a2e05"
    },
    "green": {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
      950: "#052e16"
    },
    "emerald": {
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
      950: "#022c22"
    },
    "teal": {
      50: "#f0fdfa",
      100: "#ccfbf1",
      200: "#99f6e4",
      300: "#5eead4",
      400: "#2dd4bf",
      500: "#14b8a6",
      600: "#0d9488",
      700: "#0f766e",
      800: "#115e59",
      900: "#134e4a",
      950: "#042f2e"
    },
    "cyan": {
      50: "#ecfeff",
      100: "#cffafe",
      200: "#a5f3fc",
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4",
      600: "#0891b2",
      700: "#0e7490",
      800: "#155e75",
      900: "#164e63",
      950: "#083344"
    },
    "sky": {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
      950: "#082f49"
    },
    "blue": {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
      950: "#172554"
    },
    "indigo": {
      50: "#eef2ff",
      100: "#e0e7ff",
      200: "#c7d2fe",
      300: "#a5b4fc",
      400: "#818cf8",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
      900: "#312e81",
      950: "#1e1b4b"
    },
    "violet": {
      50: "#f5f3ff",
      100: "#ede9fe",
      200: "#ddd6fe",
      300: "#c4b5fd",
      400: "#a78bfa",
      500: "#8b5cf6",
      600: "#7c3aed",
      700: "#6d28d9",
      800: "#5b21b6",
      900: "#4c1d95",
      950: "#2e1065"
    },
    "purple": {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7e22ce",
      800: "#6b21a8",
      900: "#581c87",
      950: "#3b0764"
    },
    "fuchsia": {
      50: "#fdf4ff",
      100: "#fae8ff",
      200: "#f5d0fe",
      300: "#f0abfc",
      400: "#e879f9",
      500: "#d946ef",
      600: "#c026d3",
      700: "#a21caf",
      800: "#86198f",
      900: "#701a75",
      950: "#4a044e"
    },
    "pink": {
      50: "#fdf2f8",
      100: "#fce7f3",
      200: "#fbcfe8",
      300: "#f9a8d4",
      400: "#f472b6",
      500: "#ec4899",
      600: "#db2777",
      700: "#be185d",
      800: "#9d174d",
      900: "#831843",
      950: "#500724"
    },
    "rose": {
      50: "#fff1f2",
      100: "#ffe4e6",
      200: "#fecdd3",
      300: "#fda4af",
      400: "#fb7185",
      500: "#f43f5e",
      600: "#e11d48",
      700: "#be123c",
      800: "#9f1239",
      900: "#881337",
      950: "#4c0519"
    }
  };
  var TAILWIND_PALETTES = Object.keys(TAILWIND_COLORS);

  // src/presets/static-presets.ts
  function toTitle(input) {
    return input.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (m) => m.toUpperCase());
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
      colorsByStep: __spreadValues({}, colorsByStep)
    }));
    return {
      id: "tailwind",
      label: "Tailwind",
      description: "Tailwind CSS full color system (all palettes, 50-950).",
      palettes,
      neutralOptions: [...TAILWIND_NEUTRALS],
      defaultNeutral: "gray",
      steps,
      previewPalettes
    };
  }
  var STATIC_PRESETS = [buildTailwindPreset()];

  // src/presets/builtin.ts
  var EXCLUDED_PRESET_IDS = /* @__PURE__ */ new Set(["polaris"]);
  function mergePresets(staticPresets, localPresets) {
    const merged = staticPresets.filter((preset) => !EXCLUDED_PRESET_IDS.has(preset.id));
    const existingIds = new Set(merged.map((preset) => preset.id));
    for (const preset of localPresets) {
      if (EXCLUDED_PRESET_IDS.has(preset.id)) continue;
      if (existingIds.has(preset.id)) continue;
      merged.push(preset);
      existingIds.add(preset.id);
    }
    return merged;
  }
  function normalizePaletteKey(input) {
    return String(input || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  var BUILTIN_PRESETS = mergePresets(STATIC_PRESETS, LOCAL_PRESETS);
  function getPresetById(presetId) {
    return BUILTIN_PRESETS.find((preset) => preset.id === presetId);
  }
  function getPresetSummaries() {
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
          colorsByStep: __spreadValues({}, palette.colorsByStep)
        }))
      };
    });
  }

  // src/presets/text-styles.generated.ts
  var TEXT_STYLE_TEMPLATES = [
    {
      "name": "Display 2xl/Bold",
      "familyKind": "display",
      "sizeToken": "display-2xl",
      "baseSize": 72,
      "lineHeightRatio": 1.25,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Display 2xl/Medium",
      "familyKind": "display",
      "sizeToken": "display-2xl",
      "baseSize": 72,
      "lineHeightRatio": 1.25,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Display 2xl/Regular",
      "familyKind": "display",
      "sizeToken": "display-2xl",
      "baseSize": 72,
      "lineHeightRatio": 1.25,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Display 2xl/Semibold",
      "familyKind": "display",
      "sizeToken": "display-2xl",
      "baseSize": 72,
      "lineHeightRatio": 1.25,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "SemiBold",
      "fallbackWeight": 600,
      "italic": false
    },
    {
      "name": "Display lg/Bold",
      "familyKind": "display",
      "sizeToken": "display-lg",
      "baseSize": 48,
      "lineHeightRatio": 1.25,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Display lg/Medium",
      "familyKind": "display",
      "sizeToken": "display-lg",
      "baseSize": 48,
      "lineHeightRatio": 1.25,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Display lg/Regular",
      "familyKind": "display",
      "sizeToken": "display-lg",
      "baseSize": 48,
      "lineHeightRatio": 1.25,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Display lg/Semibold",
      "familyKind": "display",
      "sizeToken": "display-lg",
      "baseSize": 48,
      "lineHeightRatio": 1.25,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "SemiBold",
      "fallbackWeight": 600,
      "italic": false
    },
    {
      "name": "Display md/Bold",
      "familyKind": "display",
      "sizeToken": "display-md",
      "baseSize": 36,
      "lineHeightRatio": 1.2222,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Display md/Medium",
      "familyKind": "display",
      "sizeToken": "display-md",
      "baseSize": 36,
      "lineHeightRatio": 1.2222,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Display md/Regular",
      "familyKind": "display",
      "sizeToken": "display-md",
      "baseSize": 36,
      "lineHeightRatio": 1.2222,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Display md/Semibold",
      "familyKind": "display",
      "sizeToken": "display-md",
      "baseSize": 36,
      "lineHeightRatio": 1.2222,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "SemiBold",
      "fallbackWeight": 600,
      "italic": false
    },
    {
      "name": "Display sm/Bold",
      "familyKind": "display",
      "sizeToken": "display-sm",
      "baseSize": 30,
      "lineHeightRatio": 1.2667,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Display sm/Medium",
      "familyKind": "display",
      "sizeToken": "display-sm",
      "baseSize": 30,
      "lineHeightRatio": 1.2667,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Display sm/Medium italic",
      "familyKind": "display",
      "sizeToken": "display-sm",
      "baseSize": 30,
      "lineHeightRatio": 1.2667,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium Italic",
      "fallbackWeight": 500,
      "italic": true
    },
    {
      "name": "Display sm/Regular",
      "familyKind": "display",
      "sizeToken": "display-sm",
      "baseSize": 30,
      "lineHeightRatio": 1.2667,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Display sm/Semibold",
      "familyKind": "display",
      "sizeToken": "display-sm",
      "baseSize": 30,
      "lineHeightRatio": 1.2667,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "SemiBold",
      "fallbackWeight": 600,
      "italic": false
    },
    {
      "name": "Display xl/Bold",
      "familyKind": "display",
      "sizeToken": "display-xl",
      "baseSize": 60,
      "lineHeightRatio": 1.2,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Display xl/Medium",
      "familyKind": "display",
      "sizeToken": "display-xl",
      "baseSize": 60,
      "lineHeightRatio": 1.2,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Display xl/Regular",
      "familyKind": "display",
      "sizeToken": "display-xl",
      "baseSize": 60,
      "lineHeightRatio": 1.2,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Display xl/Semibold",
      "familyKind": "display",
      "sizeToken": "display-xl",
      "baseSize": 60,
      "lineHeightRatio": 1.2,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": -2,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "SemiBold",
      "fallbackWeight": 600,
      "italic": false
    },
    {
      "name": "Display xs/Bold",
      "familyKind": "display",
      "sizeToken": "display-xs",
      "baseSize": 24,
      "lineHeightRatio": 1.3333,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Display xs/Medium",
      "familyKind": "display",
      "sizeToken": "display-xs",
      "baseSize": 24,
      "lineHeightRatio": 1.3333,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Display xs/Medium italic",
      "familyKind": "display",
      "sizeToken": "display-xs",
      "baseSize": 24,
      "lineHeightRatio": 1.3333,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium Italic",
      "fallbackWeight": 500,
      "italic": true
    },
    {
      "name": "Display xs/Regular",
      "familyKind": "display",
      "sizeToken": "display-xs",
      "baseSize": 24,
      "lineHeightRatio": 1.3333,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Display xs/Semibold",
      "familyKind": "display",
      "sizeToken": "display-xs",
      "baseSize": 24,
      "lineHeightRatio": 1.3333,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "SemiBold",
      "fallbackWeight": 600,
      "italic": false
    },
    {
      "name": "Text lg/Bold",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text lg/Bold italic",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold Italic",
      "fallbackWeight": 700,
      "italic": true
    },
    {
      "name": "Text lg/Medium",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Text lg/Medium italic",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium Italic",
      "fallbackWeight": 500,
      "italic": true
    },
    {
      "name": "Text lg/Medium underlined",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "UNDERLINE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Text lg/Regular",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Text lg/Regular italic",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Italic",
      "fallbackWeight": 400,
      "italic": true
    },
    {
      "name": "Text lg/Regular underlined",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "UNDERLINE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Text lg/Semibold",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Semi Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text lg/Semibold italic",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Semi Bold Italic",
      "fallbackWeight": 700,
      "italic": true
    },
    {
      "name": "Text lg/Semibold underlined",
      "familyKind": "body",
      "sizeToken": "text-lg",
      "baseSize": 18,
      "lineHeightRatio": 1.5556,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "UNDERLINE",
      "preferredFontStyle": "Semi Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text md/Bold",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text md/Bold italic",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold Italic",
      "fallbackWeight": 700,
      "italic": true
    },
    {
      "name": "Text md/Medium",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Text md/Medium italic",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium Italic",
      "fallbackWeight": 500,
      "italic": true
    },
    {
      "name": "Text md/Medium underlined",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "UNDERLINE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Text md/Regular",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Text md/Regular italic",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Italic",
      "fallbackWeight": 400,
      "italic": true
    },
    {
      "name": "Text md/Regular underlined",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "UNDERLINE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Text md/Semibold",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Semi Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text md/Semibold italic",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Semi Bold Italic",
      "fallbackWeight": 700,
      "italic": true
    },
    {
      "name": "Text md/Semibold underlined",
      "familyKind": "body",
      "sizeToken": "text-md",
      "baseSize": 16,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "UNDERLINE",
      "preferredFontStyle": "Semi Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text sm/Bold",
      "familyKind": "body",
      "sizeToken": "text-sm",
      "baseSize": 14,
      "lineHeightRatio": 1.4286,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text sm/Medium",
      "familyKind": "body",
      "sizeToken": "text-sm",
      "baseSize": 14,
      "lineHeightRatio": 1.4286,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Text sm/Medium underlined",
      "familyKind": "body",
      "sizeToken": "text-sm",
      "baseSize": 14,
      "lineHeightRatio": 1.4286,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "UNDERLINE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Text sm/Regular",
      "familyKind": "body",
      "sizeToken": "text-sm",
      "baseSize": 14,
      "lineHeightRatio": 1.4286,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Text sm/Regular underlined",
      "familyKind": "body",
      "sizeToken": "text-sm",
      "baseSize": 14,
      "lineHeightRatio": 1.4286,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "UNDERLINE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Text sm/Semibold",
      "familyKind": "body",
      "sizeToken": "text-sm",
      "baseSize": 14,
      "lineHeightRatio": 1.4286,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Semi Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text sm/Semibold underlined",
      "familyKind": "body",
      "sizeToken": "text-sm",
      "baseSize": 14,
      "lineHeightRatio": 1.4286,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "UNDERLINE",
      "preferredFontStyle": "Semi Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text xl/Bold",
      "familyKind": "body",
      "sizeToken": "text-xl",
      "baseSize": 20,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text xl/Bold italic",
      "familyKind": "body",
      "sizeToken": "text-xl",
      "baseSize": 20,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold Italic",
      "fallbackWeight": 700,
      "italic": true
    },
    {
      "name": "Text xl/Medium",
      "familyKind": "body",
      "sizeToken": "text-xl",
      "baseSize": 20,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Text xl/Medium italic",
      "familyKind": "body",
      "sizeToken": "text-xl",
      "baseSize": 20,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium Italic",
      "fallbackWeight": 500,
      "italic": true
    },
    {
      "name": "Text xl/Regular",
      "familyKind": "body",
      "sizeToken": "text-xl",
      "baseSize": 20,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Text xl/Regular italic",
      "familyKind": "body",
      "sizeToken": "text-xl",
      "baseSize": 20,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Italic",
      "fallbackWeight": 400,
      "italic": true
    },
    {
      "name": "Text xl/Regular underlined",
      "familyKind": "body",
      "sizeToken": "text-xl",
      "baseSize": 20,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "UNDERLINE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Text xl/Semibold",
      "familyKind": "body",
      "sizeToken": "text-xl",
      "baseSize": 20,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Semi Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text xl/Semibold italic",
      "familyKind": "body",
      "sizeToken": "text-xl",
      "baseSize": 20,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Semi Bold Italic",
      "fallbackWeight": 700,
      "italic": true
    },
    {
      "name": "Text xs/Bold",
      "familyKind": "body",
      "sizeToken": "text-xs",
      "baseSize": 12,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Bold",
      "fallbackWeight": 700,
      "italic": false
    },
    {
      "name": "Text xs/Medium",
      "familyKind": "body",
      "sizeToken": "text-xs",
      "baseSize": 12,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Medium",
      "fallbackWeight": 500,
      "italic": false
    },
    {
      "name": "Text xs/Regular",
      "familyKind": "body",
      "sizeToken": "text-xs",
      "baseSize": 12,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Regular",
      "fallbackWeight": 400,
      "italic": false
    },
    {
      "name": "Text xs/Semibold",
      "familyKind": "body",
      "sizeToken": "text-xs",
      "baseSize": 12,
      "lineHeightRatio": 1.5,
      "paragraphSpacingRatio": 1,
      "paragraphIndent": 0,
      "letterSpacingUnit": "PERCENT",
      "letterSpacingValue": 0,
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "preferredFontStyle": "Semi Bold",
      "fallbackWeight": 700,
      "italic": false
    }
  ];

  // src/presets/typography.generated.ts
  var TYPOGRAPHY_REFERENCE = {
    "modeName": "Value",
    "fontFamily": {
      "display": "Roboto",
      "body": "Inter"
    },
    "fontSize": {
      "text-xs": 12,
      "text-sm": 14,
      "text-md": 16,
      "text-lg": 18,
      "text-xl": 20,
      "display-xs": 24,
      "display-sm": 30,
      "display-md": 36,
      "display-lg": 48,
      "display-xl": 60,
      "display-2xl": 72
    },
    "fontWeight": {
      "regular": "Regular",
      "regular-italic": "Regular italic",
      "medium": "Medium",
      "medium-italic": "Medium italic",
      "semibold": "Semibold",
      "semibold-italic": "Semibold italic",
      "bold": "Bold",
      "bold-italic": "Bold italic"
    },
    "lineHeight": {
      "text-xs": 18,
      "text-sm": 20,
      "text-md": 24,
      "text-lg": 28,
      "text-xl": 30,
      "display-xs": 32,
      "display-sm": 38,
      "display-md": 44,
      "display-lg": 60,
      "display-xl": 72,
      "display-2xl": 90
    }
  };

  // ../ds-core/src/index.js
  var TOKEN_COLLECTIONS = ["primitives", "semantic", "components"];
  var TOKEN_TYPES = ["COLOR", "FLOAT", "STRING"];
  var TOKEN_MODES = ["light", "dark"];
  var DEFAULT_SCHEMA_VERSION = "1.0.0";
  var DEFAULT_SOURCE = "figma";
  var TOKEN_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
  var HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  var FUNCTION_COLOR_REGEX = /^(rgb|rgba|hsl|hsla)\((.*)\)$/i;
  function isObjectLike(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
  function normalizeTokenSegment(input) {
    return String(input || "").trim().replace(/\./g, "/").replace(/[^a-zA-Z0-9/-]+/g, "-").replace(/--+/g, "-").replace(/\/+/g, "/").replace(/^-+|-+$/g, "").replace(/\/-+/g, "/").replace(/-+\//g, "/").toLowerCase();
  }
  function normalizeTokenName(input) {
    return normalizeTokenSegment(input).split("/").map((part) => part.replace(/^-+|-+$/g, "")).filter(Boolean).join("/");
  }
  function isSlashCaseTokenName(name) {
    return TOKEN_NAME_REGEX.test(name);
  }
  function isAliasValue(value) {
    return isObjectLike(value) && typeof value.alias === "string";
  }
  function normalizeAliasPath(aliasPath) {
    return normalizeTokenName(aliasPath);
  }
  function normalizeModeValue(type, value) {
    if (isAliasValue(value)) {
      return { alias: normalizeAliasPath(value.alias) };
    }
    if (type === "FLOAT") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        throw new Error(`Invalid FLOAT value: ${String(value)}`);
      }
      return numeric;
    }
    if (type === "STRING") {
      if (typeof value !== "string") {
        throw new Error(`Invalid STRING value: ${String(value)}`);
      }
      return value.trim();
    }
    const candidate = String(value || "").trim();
    if (!candidate) {
      throw new Error("Invalid COLOR value: empty");
    }
    return candidate;
  }
  function validateColorValue(rawValue) {
    if (isAliasValue(rawValue)) return null;
    const value = String(rawValue || "").trim();
    if (HEX_COLOR_REGEX.test(value) || FUNCTION_COLOR_REGEX.test(value)) return null;
    return `Invalid COLOR format: ${value}`;
  }
  function validateAlias(rawValue) {
    if (!isAliasValue(rawValue)) return null;
    const normalized = normalizeAliasPath(rawValue.alias);
    if (!normalized.includes("/")) {
      return `Alias must include collection prefix: ${rawValue.alias}`;
    }
    const [collection, ...rest] = normalized.split("/");
    if (!TOKEN_COLLECTIONS.includes(collection)) {
      return `Alias collection must be one of ${TOKEN_COLLECTIONS.join(", ")}: ${rawValue.alias}`;
    }
    if (!rest.length || !isSlashCaseTokenName(rest.join("/"))) {
      return `Alias token path is invalid slash-case: ${rawValue.alias}`;
    }
    return null;
  }
  function validateModeValue(type, rawValue) {
    const aliasError = validateAlias(rawValue);
    if (aliasError) return aliasError;
    if (isAliasValue(rawValue)) return null;
    if (type === "FLOAT") {
      return Number.isFinite(Number(rawValue)) ? null : `Invalid FLOAT value: ${String(rawValue)}`;
    }
    if (type === "STRING") {
      return typeof rawValue === "string" && rawValue.trim().length > 0 ? null : "Invalid STRING value";
    }
    return validateColorValue(rawValue);
  }
  function normalizeTokenEntry(collection, entry) {
    const normalizedName = normalizeTokenName(entry.name);
    const normalizedType = String(entry.type || "").trim().toUpperCase();
    const values = isObjectLike(entry.values) ? entry.values : {};
    const normalizedValues = {};
    for (const mode of TOKEN_MODES) {
      normalizedValues[mode] = normalizeModeValue(normalizedType, values[mode]);
    }
    const scopes = Array.isArray(entry.scopes) ? Array.from(new Set(entry.scopes.map((scope) => String(scope || "").trim()).filter(Boolean))) : [];
    const normalized = {
      name: normalizedName,
      type: normalizedType,
      values: normalizedValues
    };
    if (scopes.length) normalized.scopes = scopes;
    if (entry.meta && isObjectLike(entry.meta)) normalized.meta = entry.meta;
    if (entry.description && String(entry.description).trim()) normalized.description = String(entry.description).trim();
    normalized.collection = collection;
    return normalized;
  }
  function validateTokenBundle(bundle) {
    const errors = [];
    if (!isObjectLike(bundle)) {
      return { valid: false, errors: ["TokenBundle must be an object."] };
    }
    const schemaVersion = String(bundle.schemaVersion || "").trim();
    if (!schemaVersion) {
      errors.push("schemaVersion is required.");
    }
    const collections = isObjectLike(bundle.collections) ? bundle.collections : null;
    if (!collections) {
      errors.push("collections is required.");
    }
    const normalizedSeen = /* @__PURE__ */ new Map();
    for (const collection of TOKEN_COLLECTIONS) {
      const tokens = collections ? collections[collection] : null;
      if (!Array.isArray(tokens)) {
        errors.push(`collections.${collection} must be an array.`);
        continue;
      }
      normalizedSeen.set(collection, /* @__PURE__ */ new Set());
      for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (!isObjectLike(token)) {
          errors.push(`collections.${collection}[${index}] must be an object.`);
          continue;
        }
        const name = normalizeTokenName(token.name);
        if (!name || !isSlashCaseTokenName(name)) {
          errors.push(`collections.${collection}[${index}].name must be slash-case.`);
        } else {
          const seen = normalizedSeen.get(collection);
          if (seen.has(name)) {
            errors.push(`Duplicate token name in ${collection}: ${name}`);
          } else {
            seen.add(name);
          }
        }
        const type = String(token.type || "").trim().toUpperCase();
        if (!TOKEN_TYPES.includes(type)) {
          errors.push(`collections.${collection}[${index}].type must be one of ${TOKEN_TYPES.join(", ")}.`);
        }
        if (!isObjectLike(token.values)) {
          errors.push(`collections.${collection}[${index}].values must be an object.`);
          continue;
        }
        for (const mode of TOKEN_MODES) {
          if (!(mode in token.values)) {
            errors.push(`collections.${collection}[${index}].values.${mode} is required.`);
            continue;
          }
          if (TOKEN_TYPES.includes(type)) {
            const modeError = validateModeValue(type, token.values[mode]);
            if (modeError) {
              errors.push(`collections.${collection}[${index}].values.${mode}: ${modeError}`);
            }
          }
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }
  function normalizeTokenBundle(input) {
    if (!isObjectLike(input)) {
      throw new Error("TokenBundle must be an object.");
    }
    const collections = isObjectLike(input.collections) ? input.collections : {};
    const normalizedCollections = {};
    for (const collection of TOKEN_COLLECTIONS) {
      const tokens = Array.isArray(collections[collection]) ? collections[collection] : [];
      normalizedCollections[collection] = tokens.map((entry) => normalizeTokenEntry(collection, entry)).sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
    }
    const normalized = {
      schemaVersion: String(input.schemaVersion || DEFAULT_SCHEMA_VERSION),
      source: String(input.source || DEFAULT_SOURCE),
      generatedAt: input.generatedAt ? String(input.generatedAt) : void 0,
      collections: normalizedCollections
    };
    const validation = validateTokenBundle(normalized);
    if (!validation.valid) {
      throw new Error(`TokenBundle validation failed: ${validation.errors.join(" | ")}`);
    }
    return normalized;
  }

  // src/code.ts
  var UI_WIDTH = 532;
  var UI_HEIGHT = 700;
  var UI_TITLE = "ombrstudio - Build your design system foundation";
  var isGenerationRunning = false;
  figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT, themeColors: true, title: UI_TITLE });
  var COLLECTIONS = {
    primitives: "primitives",
    colorModes: "1. color-modes",
    spacing: "2. spacing",
    radius: "3. radius",
    typography: "6. Typography"
  };
  var DEFAULT_BASE_WHITE = "#ffffff";
  var DEFAULT_BASE_BLACK = "#000000";
  var DEFAULT_BRAND = "#82BE5C";
  var DEFAULT_DISPLAY_FAMILY = TYPOGRAPHY_REFERENCE.fontFamily.display || "Roboto";
  var DEFAULT_BODY_FAMILY = TYPOGRAPHY_REFERENCE.fontFamily.body || "Inter";
  var DEFAULT_ICON_LIBRARY = "lucide";
  var DEFAULT_ICON_PACKS = ["navigation", "actions"];
  var LEGACY_ICONS_PAGE_NAME = "7. Icons";
  var ICONS_PAGE_NAME = "Icons";
  var ICON_COMPONENT_SET_NAME = "Icon";
  var DEFAULT_ICON_SIZE = 24;
  var DEFAULT_ICON_COLOR_ALIAS = "icon/primary";
  var ICON_STROKE_WIDTHS = {
    light: 1.5,
    regular: 1.75,
    medium: 2,
    bold: 2.5
  };
  var ICON_LIBRARY_CONFIG = {
    lucide: {
      buildUrl: (iconName) => `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/${iconName}.svg`
    },
    tabler: {
      buildUrl: (iconName) => `https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/outline/${iconName}.svg`
    },
    phosphor: {
      buildUrl: (iconName) => `https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/${iconName}.svg`
    },
    iconoir: {
      buildUrl: (iconName) => `https://raw.githubusercontent.com/iconoir-icons/iconoir/main/icons/regular/${iconName}.svg`
    }
  };
  var STARTER_ICON_PACK = [
    "search",
    "close",
    "plus",
    "minus",
    "check",
    "chevron-down",
    "chevron-up",
    "chevron-left",
    "chevron-right",
    "ellipsis",
    "ellipsis-vertical",
    "user",
    "mail",
    "calendar",
    "logout",
    "filter",
    "trash",
    "edit",
    "loader",
    "settings",
    "home"
  ];
  var ICON_PACK_DEFINITIONS = {
    navigation: ["home", "search", "chevron-left", "chevron-right", "chevron-up", "chevron-down", "ellipsis", "ellipsis-vertical"],
    actions: ["plus", "minus", "check", "close", "edit", "trash", "filter", "settings"],
    "status-feedback": ["check", "info", "warning", "loader"],
    "files-folders": ["folder", "file", "upload", "download"]
  };
  var ICON_LIBRARY_NAME_MAP = {
    lucide: {
      search: "search",
      close: "x",
      plus: "plus",
      minus: "minus",
      check: "check",
      "chevron-down": "chevron-down",
      "chevron-up": "chevron-up",
      "chevron-left": "chevron-left",
      "chevron-right": "chevron-right",
      ellipsis: "ellipsis",
      "ellipsis-vertical": "ellipsis-vertical",
      user: "user",
      mail: "mail",
      calendar: "calendar",
      logout: "log-out",
      filter: "list-filter",
      trash: "trash",
      edit: "pencil",
      loader: "loader",
      settings: "settings",
      home: "house",
      info: "circle-alert",
      warning: "triangle-alert",
      folder: "folder",
      file: "file",
      download: "download",
      upload: "upload"
    },
    tabler: {
      search: "search",
      close: "x",
      plus: "plus",
      minus: "minus",
      check: "check",
      "chevron-down": "chevron-down",
      "chevron-up": "chevron-up",
      "chevron-left": "chevron-left",
      "chevron-right": "chevron-right",
      ellipsis: "dots",
      "ellipsis-vertical": "dots-vertical",
      user: "user",
      mail: "mail",
      calendar: "calendar",
      logout: "logout",
      filter: "filter",
      trash: "trash",
      edit: "pencil",
      loader: "loader",
      settings: "settings",
      home: "home",
      info: "info-circle",
      warning: "alert-triangle",
      folder: "folder",
      file: "file",
      download: "download",
      upload: "upload"
    },
    phosphor: {
      search: "magnifying-glass",
      close: "x",
      plus: "plus",
      minus: "minus",
      check: "check",
      "chevron-down": "caret-down",
      "chevron-up": "caret-up",
      "chevron-left": "caret-left",
      "chevron-right": "caret-right",
      ellipsis: "dots-three",
      "ellipsis-vertical": "dots-three-vertical",
      user: "user",
      mail: "envelope",
      calendar: "calendar",
      logout: "sign-out",
      filter: "funnel",
      trash: "trash",
      edit: "pencil-simple",
      loader: "spinner-gap",
      settings: "gear",
      home: "house",
      info: "info",
      warning: "warning",
      folder: "folder",
      file: "file",
      download: "download",
      upload: "upload"
    },
    iconoir: {
      search: "search",
      close: "xmark",
      plus: "plus",
      minus: "minus",
      check: "check",
      "chevron-down": "nav-arrow-down",
      "chevron-up": "nav-arrow-up",
      "chevron-left": "nav-arrow-left",
      "chevron-right": "nav-arrow-right",
      ellipsis: "more-horiz",
      "ellipsis-vertical": "more-vert",
      user: "user",
      mail: "mail",
      calendar: "calendar",
      logout: "log-out",
      filter: "filter",
      trash: "trash",
      edit: "edit-pencil",
      loader: "refresh-double",
      settings: "settings",
      home: "home",
      info: "info-circle",
      warning: "warning-triangle",
      folder: "folder",
      file: "page",
      download: "download",
      upload: "upload"
    }
  };
  var PRESET_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  var OPACITY_STEPS = [4, 6, 8, 9, 10, 15, 20, 28, 30, 36, 40, 48, 50, 60, 70, 75, 80, 90, 100];
  var PIXEL_VALUES = [
    0,
    2,
    4,
    6,
    8,
    10,
    12,
    14,
    16,
    20,
    24,
    28,
    32,
    40,
    44,
    48,
    56,
    64,
    80,
    96,
    112,
    128,
    144,
    160,
    176,
    192,
    208,
    224,
    240,
    256
  ];
  var SPACING_ALIAS_MAP = [
    ["spacing-none", "0"],
    ["spacing-xxs", "2"],
    ["spacing-xs", "4"],
    ["spacing-sm", "6"],
    ["spacing-md", "8"],
    ["spacing-lg", "12"],
    ["spacing-xl", "16"],
    ["spacing-2xl", "20"],
    ["spacing-3xl", "24"],
    ["spacing-4xl", "32"],
    ["spacing-5xl", "40"],
    ["spacing-6xl", "48"],
    ["spacing-7xl", "64"],
    ["spacing-8xl", "80"],
    ["spacing-9xl", "96"],
    ["spacing-10xl", "128"],
    ["spacing-11xl", "160"]
  ];
  var RADIUS_ALIAS_MAP = [
    ["radius-none", "0"],
    ["radius-xxs", "2"],
    ["radius-xs", "4"],
    ["radius-sm", "6"],
    ["radius-md", "8"],
    ["radius-lg", "10"],
    ["radius-xl", "12"],
    ["radius-2xl", "16"],
    ["radius-3xl", "20"],
    ["radius-4xl", "24"],
    ["radius-full", "full"]
  ];
  var DEFAULT_FONT_SIZES = __spreadValues({ label: 10 }, TYPOGRAPHY_REFERENCE.fontSize);
  var DEFAULT_LINE_HEIGHTS = __spreadProps(__spreadValues({ label: 14 }, TYPOGRAPHY_REFERENCE.lineHeight), { "display-2xl": 88 });
  var DEFAULT_LETTER_SPACINGS = Object.fromEntries(Object.keys(DEFAULT_FONT_SIZES).map((key) => [key, 0]));
  var DEFAULT_FONT_WEIGHT_STYLES = __spreadValues({}, TYPOGRAPHY_REFERENCE.fontWeight);
  var FONT_SIZE_ORDER = Object.keys(DEFAULT_FONT_SIZES);
  var COLLECTION_LEGACY_NAMES = {
    [COLLECTIONS.primitives]: ["primitives", "_primitives", " _primitives"],
    [COLLECTIONS.colorModes]: ["1. color modes", "1. color-modes", "semantic", "color-modes"],
    [COLLECTIONS.spacing]: ["2. spacing", "spacing"],
    [COLLECTIONS.radius]: ["3. radius", "radius"],
    [COLLECTIONS.typography]: ["6. typography", "6. Typography", "typography", "6.typography", "6 Typography"]
  };
  function raw(value) {
    return { kind: "raw", value };
  }
  function alias(ref, collection) {
    return { kind: "alias", ref, collection };
  }
  function mapBundleAlias(aliasPath) {
    const segments = String(aliasPath || "").trim().split("/").filter(Boolean);
    if (segments.length < 2) {
      throw new Error(`Alias bundle invalide: ${aliasPath}`);
    }
    const [collectionSegment, ...tokenPath] = segments;
    const ref = tokenPath.join("/");
    if (collectionSegment === "primitives") {
      return { ref, collection: COLLECTIONS.primitives };
    }
    if (collectionSegment === "semantic" || collectionSegment === "components") {
      return { ref, collection: COLLECTIONS.colorModes };
    }
    throw new Error(`Collection alias non supportee dans TokenBundle: ${collectionSegment}`);
  }
  function bundleValueToRuntimeTokenValue(value) {
    if (value && typeof value === "object" && "alias" in value) {
      const mapped = mapBundleAlias(String(value.alias || ""));
      return alias(mapped.ref, mapped.collection);
    }
    return raw(value);
  }
  function toVariableType(value) {
    if (value === "FLOAT" || value === "STRING") return value;
    return "COLOR";
  }
  function sanitizeBundleScopes(scopes, tokenName) {
    if (!Array.isArray(scopes) || !scopes.length) {
      return semanticScopes(tokenName);
    }
    const allowed = /* @__PURE__ */ new Set([
      "ALL_SCOPES",
      "TEXT_CONTENT",
      "ALL_FILLS",
      "FRAME_FILL",
      "SHAPE_FILL",
      "TEXT_FILL",
      "STROKE_COLOR",
      "EFFECT_FLOAT",
      "EFFECT_COLOR",
      "FONT_SIZE",
      "LINE_HEIGHT",
      "LETTER_SPACING",
      "PARAGRAPH_SPACING",
      "PARAGRAPH_INDENT",
      "FONT_FAMILY",
      "FONT_STYLE",
      "FONT_WEIGHT",
      "OPACITY",
      "WIDTH_HEIGHT",
      "GAP",
      "STROKE_FLOAT",
      "CORNER_RADIUS"
    ]);
    const scoped = scopes.map((scope) => String(scope || "").trim()).filter((scope) => allowed.has(scope));
    return scoped.length ? scoped : semanticScopes(tokenName);
  }
  function buildColorModeTokensFromBundle(bundle) {
    const semanticEntries = Array.isArray(bundle.collections.semantic) ? bundle.collections.semantic : [];
    return semanticEntries.map((entry) => ({
      collection: COLLECTIONS.colorModes,
      name: entry.name,
      type: toVariableType(entry.type),
      scopes: sanitizeBundleScopes(entry.scopes, entry.name),
      modeValues: {
        light: bundleValueToRuntimeTokenValue(entry.values.light),
        dark: bundleValueToRuntimeTokenValue(entry.values.dark)
      }
    }));
  }
  function normalizeLookup(input) {
    return String(input).trim().replace(/^\{/, "").replace(/\}$/, "").toLowerCase().replace(/\./g, "/").replace(/\s+/g, "").replace(/\/+/g, "/").replace(/^\//, "").replace(/\/$/, "");
  }
  function aliasCandidates(reference) {
    const trimmed = reference.trim().replace(/^\{/, "").replace(/\}$/, "").trim();
    return [trimmed, trimmed.replace(/\./g, "/"), trimmed.replace(/\//g, ".")];
  }
  function normalizeCollectionLookup(name) {
    return String(name).trim().toLowerCase().replace(/\s+/g, " ");
  }
  function sanitizeScopes(scopes) {
    const unique = Array.from(new Set(scopes));
    if (unique.includes("ALL_SCOPES")) return ["ALL_SCOPES"];
    if (!unique.includes("ALL_FILLS")) return unique;
    return unique.filter((scope) => scope === "ALL_FILLS" || !["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL"].includes(scope));
  }
  function clampNumber(value, min, max, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(min, Math.min(max, Math.round(numeric)));
  }
  function buildModeMap(collection) {
    const map = {};
    for (const mode of collection.modes) {
      map[mode.name] = mode.modeId;
    }
    return map;
  }
  function addAliasEntry(index, variable) {
    const normalized = [normalizeLookup(variable.name), normalizeLookup(variable.name.replace(/\//g, "."))].filter(Boolean);
    if (!index.byCollectionId.has(variable.variableCollectionId)) {
      index.byCollectionId.set(variable.variableCollectionId, /* @__PURE__ */ new Map());
    }
    const byCollectionId = index.byCollectionId.get(variable.variableCollectionId);
    const collectionName = index.collectionNameById.get(variable.variableCollectionId);
    if (collectionName && !index.byCollectionName.has(collectionName)) {
      index.byCollectionName.set(collectionName, /* @__PURE__ */ new Map());
    }
    const byCollectionName = collectionName ? index.byCollectionName.get(collectionName) : void 0;
    for (const key of normalized) {
      if (!index.global.has(key)) index.global.set(key, variable);
      if (!byCollectionId.has(key)) byCollectionId.set(key, variable);
      if (byCollectionName && !byCollectionName.has(key)) byCollectionName.set(key, variable);
    }
  }
  function resolveAlias(index, reference, fallbackCollectionId, targetCollection) {
    const fallbackCollection = index.byCollectionId.get(fallbackCollectionId);
    for (const candidate of aliasCandidates(reference)) {
      const lookup = normalizeLookup(candidate);
      if (!lookup) continue;
      const targetMap = index.byCollectionName.get(targetCollection);
      if (targetMap == null ? void 0 : targetMap.has(lookup)) return targetMap.get(lookup);
      if (fallbackCollection == null ? void 0 : fallbackCollection.has(lookup)) return fallbackCollection.get(lookup);
      if (index.global.has(lookup)) return index.global.get(lookup);
    }
    return null;
  }
  function makeAlias(variable) {
    if (figma.variables.createVariableAlias) {
      return figma.variables.createVariableAlias(variable);
    }
    return { type: "VARIABLE_ALIAS", id: variable.id };
  }
  function getCollectionReport(report, name) {
    let found = report.collections.find((entry) => entry.name === name);
    if (!found) {
      found = { name, created: 0, updated: 0, collisionsReplaced: 0 };
      report.collections.push(found);
    }
    return found;
  }
  function upsertVariable(collection, variableName, type, variableIndex, report) {
    const key = `${collection.id}::${variableName}`;
    const existing = variableIndex.get(key);
    if (existing) {
      if (existing.resolvedType !== type) {
        report.warnings.push(
          `Type conflict on ${collection.name}/${variableName}: existing=${existing.resolvedType}, expected=${type}`
        );
        return null;
      }
      report.updated += 1;
      report.collisionsReplaced += 1;
      const collectionReport2 = getCollectionReport(report, collection.name);
      collectionReport2.updated += 1;
      collectionReport2.collisionsReplaced += 1;
      return existing;
    }
    const created = figma.variables.createVariable(variableName, collection.id, type);
    variableIndex.set(key, created);
    report.created += 1;
    const collectionReport = getCollectionReport(report, collection.name);
    collectionReport.created += 1;
    return created;
  }
  function setRawValue(variable, modeId, type, value) {
    if (type === "COLOR") {
      if (typeof value !== "string") throw new Error(`Invalid color value on ${variable.name}`);
      variable.setValueForMode(modeId, parseColorInput(value));
      return;
    }
    if (type === "FLOAT") {
      const numeric = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numeric)) throw new Error(`Invalid float value on ${variable.name}: ${value}`);
      variable.setValueForMode(modeId, numeric);
      return;
    }
    variable.setValueForMode(modeId, String(value));
  }
  function createToken(collection, name, type, scopes, value) {
    return {
      collection,
      name,
      type,
      scopes,
      value
    };
  }
  function normalizePaletteKey2(input) {
    return String(input || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function createModeToken(collection, name, type, scopes, modeValues) {
    return {
      collection,
      name,
      type,
      scopes,
      modeValues
    };
  }
  function semanticScopes(name) {
    if (name.startsWith("text/")) return ["TEXT_FILL"];
    if (name.startsWith("bg/")) return ["FRAME_FILL", "SHAPE_FILL"];
    if (name.startsWith("border/")) return ["STROKE_COLOR"];
    if (name.startsWith("icon/")) return ["STROKE_COLOR", "SHAPE_FILL"];
    if (name.startsWith("alpha/")) return ["ALL_FILLS"];
    return ["ALL_SCOPES"];
  }
  function closestStep(steps, target) {
    if (!steps.length) return target;
    let best = steps[0];
    let delta = Math.abs(best - target);
    for (const step of steps) {
      const current = Math.abs(step - target);
      if (current < delta) {
        best = step;
        delta = current;
      }
    }
    return best;
  }
  function parsePresetNumericStep(step) {
    if (!/^-?\d+(?:\.\d+)?$/.test(step)) return null;
    const numeric = Number(step);
    return Number.isFinite(numeric) ? numeric : null;
  }
  function sortPresetSteps(steps) {
    return [...new Set(steps)].sort((a, b) => {
      const na = parsePresetNumericStep(a);
      const nb = parsePresetNumericStep(b);
      if (na !== null && nb !== null) return na - nb;
      if (na !== null) return -1;
      if (nb !== null) return 1;
      return a.localeCompare(b);
    });
  }
  function fallbackPresetSteps() {
    return PRESET_STEPS.map((step) => String(step));
  }
  function getPaletteSteps(preset, paletteName) {
    const palette = preset.palettes[paletteName];
    if (!palette) return [];
    return sortPresetSteps(Object.keys(palette));
  }
  function resolveClosestPaletteStep(preset, paletteName, requestedStep) {
    const palette = preset.palettes[paletteName];
    if (!palette) return requestedStep;
    if (palette[requestedStep]) return requestedStep;
    const steps = getPaletteSteps(preset, paletteName);
    if (!steps.length) return requestedStep;
    const exactCaseInsensitive = steps.find((step) => step.toLowerCase() === requestedStep.toLowerCase());
    if (exactCaseInsensitive) return exactCaseInsensitive;
    const requestedNumeric = parsePresetNumericStep(requestedStep);
    if (requestedNumeric !== null) {
      const numericPairs = steps.map((step) => ({ step, numeric: parsePresetNumericStep(step) })).filter((entry) => entry.numeric !== null);
      if (numericPairs.length) {
        let best = numericPairs[0];
        let delta = Math.abs(best.numeric - requestedNumeric);
        for (const pair of numericPairs) {
          const currentDelta = Math.abs(pair.numeric - requestedNumeric);
          if (currentDelta < delta) {
            best = pair;
            delta = currentDelta;
          }
        }
        return best.step;
      }
    }
    return steps.includes("500") ? "500" : steps[0];
  }
  function basePatternSteps(pattern) {
    if (pattern === "hundreds") {
      return [100, 200, 300, 400, 500, 600, 700, 800, 900, 1e3];
    }
    return [...PRESET_STEPS];
  }
  function pickSubset(baseSteps, count) {
    if (count >= baseSteps.length) return [...baseSteps];
    if (count <= 1) return [baseSteps[Math.floor(baseSteps.length / 2)]];
    const points = /* @__PURE__ */ new Set();
    for (let i = 0; i < count; i += 1) {
      points.add(Math.round(i * (baseSteps.length - 1) / (count - 1)));
    }
    const base500Index = baseSteps.indexOf(500);
    if (base500Index >= 0 && !points.has(base500Index) && count >= 3) {
      const sorted = Array.from(points);
      let replace = sorted[0];
      let distance = Math.abs(replace - base500Index);
      for (const point of sorted) {
        if (point === 0 || point === baseSteps.length - 1) continue;
        const delta = Math.abs(point - base500Index);
        if (delta < distance) {
          replace = point;
          distance = delta;
        }
      }
      points.delete(replace);
      points.add(base500Index);
    }
    return Array.from(points).sort((a, b) => a - b).map((index) => baseSteps[index]);
  }
  function nextShadeStep(previous) {
    return previous === 950 ? 1e3 : previous + 100;
  }
  function extendSteps(baseSteps, count) {
    const unique = Array.from(new Set(baseSteps)).sort((a, b) => a - b);
    while (unique.length < count) {
      unique.push(nextShadeStep(unique[unique.length - 1]));
    }
    return unique.slice(0, count);
  }
  function deriveShadeSteps(pattern, shadeCount) {
    const base = basePatternSteps(pattern);
    const requested = clampNumber(shadeCount, 6, 14, 11);
    if (requested <= base.length) return pickSubset(base, requested);
    return extendSteps(base, requested);
  }
  function resolveBaseStep(shadeSteps) {
    if (shadeSteps.includes(500)) return 500;
    const midpoint = (shadeSteps[0] + shadeSteps[shadeSteps.length - 1]) / 2;
    return closestStep(shadeSteps, midpoint);
  }
  var COLOR_MODE_FAMILIES = ["bg", "text", "icon", "border"];
  var KIGEN_ALPHA_OPACITY_STEPS = {
    "00": 100,
    "50": 6,
    "100": 9,
    "200": 20,
    "300": 28,
    "400": 36,
    "500": 48,
    "600": 60,
    "700": 70,
    "800": 75,
    "900": 80,
    "1000": 100
  };
  var KIGEN_COLOR_MODES_TEMPLATE = {
    bg: {
      primary: "{b&w/white}",
      secondary: "{slate/50}",
      tertiary: "{slate/100}",
      quartiary: "{slate/300}",
      "primary-hover": "{slate/50}",
      "secondary-hover": "{slate/100}",
      "tertiary-hover": "{slate/200}",
      "quartiary-hover": "{slate/400}",
      "black-solid": "{slate/900}",
      "black-solid-hover": "{slate/800}",
      disabled: "{slate/300}",
      "disabled-alt": "{slate/100}",
      "accent-primary": "{purple/50}",
      "accent-primary-hover": "{purple/100}",
      "accent-solid": "{purple/500}",
      "accent-solid-hover": "{purple/600}",
      "error-primary": "{red/50}",
      "error-primary-hover": "{red/100}",
      "error-secondary": "{red/600}",
      "error-secondary-hover": "{red/700}",
      "success-primary": "{green/100}",
      "success-primary-hover": "{green/200}",
      "success-secondary": "{green/600}",
      "success-secondary-hover": "{green/700}",
      "warning-primary": "{orange/100}",
      "warning-primary-hover": "{orange/200}",
      "warning-secondary": "{orange/600}",
      "warning-secondary-hover": "{orange/700}",
      "info-primary": "{blue/50}",
      "info-primary-hover": "{blue/100}",
      "info-secondary": "{blue/600}",
      "info-secondary-hover": "{blue/700}",
      "offer-primary": "{green/100}",
      "offer-primary-hover": "{green/200}",
      "offer-secondary": "{green/600}",
      "offer-secondary-hover": "{green/700}",
      "overlay-alpha-primary": "{alpha/light/200}",
      "overlay-alpha-secondary": "{alpha/light/500}",
      "overlay-alpha-white-primary": "{alpha/dark/300}",
      "overlay-alpha-white-secondary": "{alpha/dark/500}"
    },
    text: {
      primary: "{slate/900}",
      secondary: "{slate/600}",
      tertiary: "{slate/500}",
      "primary-hover": "{slate/800}",
      "secondary-hover": "{slate/700}",
      "tertiary-hover": "{slate/600}",
      disabled: "{slate/400}",
      "disabled-alt": "{slate/300}",
      placeholder: "{slate/400}",
      white: "{b&w/white}",
      "on-dark-color": "{b&w/white}",
      "accent-primary": "{purple/500}",
      "accent-secondary": "{purple/300}",
      "accent-primary-hover": "{purple/600}",
      "accent-secondary-hover": "{purple/400}",
      "error-primary": "{red/600}",
      "error-secondary": "{red/400}",
      "error-primary-hover": "{red/700}",
      "error-secondary-hover": "{red/500}",
      "success-primary": "{green/600}",
      "success-secondary": "{green/400}",
      "success-primary-hover": "{green/700}",
      "success-secondary-hover": "{green/700}",
      "warning-primary": "{orange/600}",
      "warning-secondary": "{orange/400}",
      "warning-primary-hover": "{orange/700}",
      "warning-secondary-hover": "{orange/500}",
      "info-primary": "{blue/600}",
      "info-secondary": "{blue/400}",
      "info-primary-hover": "{blue/700}",
      "info-secondary-hover": "{blue/500}",
      "offer-primary": "{green/600}",
      "offer-secondary": "{green/500}",
      "offer-primary-hover": "{green/700}",
      "offer-secondary-hover": "{green/600}"
    },
    icon: {
      primary: "{slate/900}",
      secondary: "{slate/600}",
      tertiary: "{slate/400}",
      "primary-hover": "{slate/800}",
      "secondary-hover": "{slate/700}",
      "tertiary-hover": "{slate/600}",
      disabled: "{slate/400}",
      "disabled-alt": "{slate/300}",
      placeholder: "{slate/400}",
      white: "{b&w/white}",
      "on-dark-color": "{b&w/white}",
      "accent-primary": "{purple/500}",
      "accent-secondary": "{purple/300}",
      "accent-primary-hover": "{purple/600}",
      "accent-secondary-hover": "{purple/400}",
      "error-primary": "{red/600}",
      "error-secondary": "{red/300}",
      "error-primary-hover": "{red/600}",
      "error-secondary-hover": "{red/500}",
      "success-primary": "{green/600}",
      "success-secondary": "{green/200}",
      "success-primary-hover": "{green/700}",
      "success-secondary-hover": "{green/300}",
      "warning-primary": "{orange/600}",
      "warning-secondary": "{orange/400}",
      "warning-primary-hover": "{orange/700}",
      "warning-secondary-hover": "{orange/500}",
      "info-primary": "{blue/600}",
      "info-secondary": "{blue/400}",
      "info-primary-hover": "{blue/700}",
      "info-secondary-hover": "{blue/500}",
      "offer-primary": "{green/600}",
      "offer-secondary": "{green/400}",
      "offer-primary-hover": "{green/700}",
      "offer-secondary-hover": "{green/500}"
    },
    border: {
      primary: "{slate/300}",
      secondary: "{slate/200}",
      tertiary: "{slate/100}",
      "primary-solid": "{slate/900}",
      disabled: "{slate/300}",
      "disabled-alt": "{slate/200}",
      "accent-primary": "{purple/500}",
      "accent-secondary": "{purple/100}",
      "error-primary": "{red/500}",
      "error-secondary": "{red/300}",
      "success-primary": "{green/500}",
      "success-secondary": "{green/300}",
      "warning-primary": "{orange/500}",
      "warning-secondary": "{orange/300}",
      "info-primary": "{blue/500}",
      "info-secondary": "{blue/300}",
      "offer-primary": "{green/500}",
      "offer-secondary": "{green/300}"
    }
  };
  var DARK_NEUTRAL_STEP_MAP = {
    50: 900,
    100: 800,
    200: 700,
    300: 600,
    400: 500,
    500: 400,
    600: 300,
    700: 200,
    800: 100,
    900: 50,
    950: 50
  };
  var DARK_INTENT_STEP_MAP_BG = {
    50: 100,
    100: 200,
    200: 300,
    300: 400,
    400: 500,
    500: 600,
    600: 700,
    700: 800,
    800: 900,
    900: 950,
    950: 1e3,
    1e3: 1100,
    1100: 1100
  };
  var DARK_INTENT_STEP_MAP_FG = {
    50: 50,
    100: 50,
    200: 100,
    300: 200,
    400: 300,
    500: 400,
    600: 400,
    700: 500,
    800: 600,
    900: 700,
    950: 800,
    1e3: 900,
    1100: 1e3
  };
  var INTENT_PALETTE_CANDIDATES = {
    error: ["error", "red", "rose", "danger"],
    success: ["success", "emerald", "green", "moss"],
    warning: ["warning", "amber", "orange", "yellow"],
    info: ["info", "sky", "blue", "azure", "cyan"],
    offer: ["offer", "fuchsia", "pink", "purple", "magenta"]
  };
  var PALETTE_SYNONYMS = {
    blue: ["sky", "indigo"],
    green: ["emerald", "teal", "lime"],
    orange: ["amber", "yellow"],
    purple: ["violet", "fuchsia", "pink"]
  };
  var LEGACY_COLOR_MODE_ALIASES = [
    ["text/brand", "text/accent-primary"],
    ["text/on-brand", "text/white"],
    ["text/muted", "text/tertiary"],
    ["text/inverse", "text/white"],
    ["bg/canvas", "bg/primary"],
    ["bg/surface", "bg/secondary"],
    ["bg/muted", "bg/tertiary"],
    ["bg/overlay", "bg/overlay-alpha-secondary"],
    ["bg/brand", "bg/accent-solid"],
    ["border/default", "border/primary"],
    ["border/muted", "border/secondary"],
    ["border/strong", "border/primary-solid"],
    ["border/brand", "border/accent-primary"],
    ["border/focus", "border/accent-primary"],
    ["icon/brand", "icon/accent-primary"],
    ["icon/on-brand", "icon/white"],
    ["text/danger", "text/error-primary"],
    ["bg/danger", "bg/error-secondary"],
    ["border/danger", "border/error-primary"],
    ["icon/danger", "icon/error-primary"]
  ];
  function resolvePaletteFromCandidates(preset, candidates, fallback) {
    for (const candidate of candidates) {
      if (preset.palettes[candidate]) return candidate;
    }
    return preset.palettes[fallback] ? fallback : Object.keys(preset.palettes)[0] || fallback;
  }
  function resolvePaletteWithSynonyms(preset, paletteName, fallback) {
    if (preset.palettes[paletteName]) return paletteName;
    const lower = paletteName.toLowerCase();
    const candidates = [lower, ...PALETTE_SYNONYMS[lower] || []];
    return resolvePaletteFromCandidates(preset, candidates, fallback);
  }
  function resolveIntentPalette(preset, intent) {
    return resolvePaletteFromCandidates(preset, INTENT_PALETTE_CANDIDATES[intent], INTENT_PALETTE_CANDIDATES[intent][0]);
  }
  function parseKigenReference(reference) {
    const cleaned = reference.trim().replace(/^\{/, "").replace(/\}$/, "").trim();
    if (!cleaned) return [];
    return cleaned.split("/").map((segment) => segment.trim().toLowerCase()).filter(Boolean);
  }
  function extractIntentFromTokenName(tokenName) {
    const match = tokenName.match(/\/(error|success|warning|info|offer)-/);
    return match ? match[1] : null;
  }
  function isAccentToken(tokenName) {
    return /\/accent-/.test(tokenName);
  }
  function remapStepForBrand(stepInput, shadeSteps) {
    const step = Number(stepInput);
    if (!Number.isFinite(step)) return shadeSteps.includes(500) ? "500" : String(resolveBaseStep(shadeSteps));
    return String(closestStep(shadeSteps, step));
  }
  function resolveOpacityStepFromAlphaKey(alphaKey) {
    const mapped = KIGEN_ALPHA_OPACITY_STEPS[alphaKey];
    if (!Number.isFinite(mapped)) return 50;
    if (OPACITY_STEPS.includes(mapped)) return mapped;
    return closestStep([...OPACITY_STEPS], mapped);
  }
  function remapNeutralStepForDark(step) {
    if (DARK_NEUTRAL_STEP_MAP[step] !== void 0) {
      return String(DARK_NEUTRAL_STEP_MAP[step]);
    }
    if (step <= 100) return "900";
    if (step >= 900) return "50";
    if (step === 500) return "400";
    return String(step < 500 ? 900 - step : 500 - Math.round((step - 500) * 0.8));
  }
  function colorModeFamilyFromTokenName(tokenName) {
    const family = tokenName.split("/")[0];
    if (family === "bg" || family === "text" || family === "icon" || family === "border") {
      return family;
    }
    return null;
  }
  function remapIntentStepForDark(step, family) {
    const table = family === "bg" ? DARK_INTENT_STEP_MAP_BG : DARK_INTENT_STEP_MAP_FG;
    if (table[step] !== void 0) {
      return String(table[step]);
    }
    const fallback = family === "bg" ? step + 100 : step >= 550 ? step - 200 : step - 100;
    return String(Math.max(50, Math.min(1100, fallback)));
  }
  function resolveDarkStepForPalette(preset, paletteName, step, shadeSteps) {
    if (paletteName === "brand") {
      const numeric = parsePresetNumericStep(step);
      const target = numeric === null ? 500 : numeric;
      return String(closestStep(shadeSteps, target));
    }
    return resolveClosestPaletteStep(preset, paletteName, step);
  }
  function resolveDarkNeutralStep(preset, neutralPalette, sourceStep) {
    var _a;
    const paletteSteps = getPaletteSteps(preset, neutralPalette);
    if (!paletteSteps.length) return sourceStep;
    const numericEntries = paletteSteps.map((step) => ({ step, numeric: parsePresetNumericStep(step) })).filter((entry) => entry.numeric !== null);
    if (!numericEntries.length) {
      return paletteSteps[0];
    }
    const sourceNumeric = parsePresetNumericStep(sourceStep);
    if (sourceNumeric === null) {
      return paletteSteps[paletteSteps.length - 1] || paletteSteps[0];
    }
    const exact = numericEntries.find((entry) => entry.numeric === sourceNumeric);
    const baseStep = (_a = exact == null ? void 0 : exact.step) != null ? _a : resolveClosestPaletteStep(preset, neutralPalette, sourceStep);
    const baseIndex = numericEntries.findIndex((entry) => entry.step === baseStep);
    if (baseIndex < 0) return baseStep;
    const mirrored = numericEntries[numericEntries.length - 1 - baseIndex];
    return mirrored.step;
  }
  function resolvePrimitivePaletteStep(preset, paletteName, requestedStep, shadeSteps) {
    if (paletteName === "brand") return remapStepForBrand(requestedStep, shadeSteps);
    return resolveClosestPaletteStep(preset, paletteName, requestedStep);
  }
  function normalizePresetSteps(preset) {
    if (preset.steps.length) return sortPresetSteps(preset.steps.map((step) => String(step)));
    return fallbackPresetSteps();
  }
  function ensureNeutralStepExists(preset, neutralPalette, step) {
    return resolveClosestPaletteStep(preset, neutralPalette, step);
  }
  function remapNeutralStepForDarkFallback(preset, neutralPalette, step) {
    const stepNumeric = parsePresetNumericStep(step);
    if (stepNumeric === null) return resolveDarkNeutralStep(preset, neutralPalette, step);
    const darkTarget = remapNeutralStepForDark(stepNumeric);
    return ensureNeutralStepExists(preset, neutralPalette, darkTarget);
  }
  function applyDarkModeTransformForReference(tokenName, pluginReference, neutralPalette, preset, shadeSteps) {
    if (tokenName.startsWith("alpha/")) return pluginReference;
    if (tokenName.includes("/white") || tokenName.includes("on-dark-color")) return pluginReference;
    if (pluginReference === "colors/base/white" && tokenName.startsWith("bg/")) {
      const darkest = resolveDarkNeutralStep(preset, neutralPalette, "50");
      return `colors/${neutralPalette}/${darkest}`;
    }
    if (pluginReference === "colors/base/black" && (tokenName.startsWith("text/") || tokenName.startsWith("icon/"))) {
      return "colors/base/white";
    }
    const neutralMatch = pluginReference.match(/^colors\/([^/]+)\/([^/]+)$/);
    if (!neutralMatch) return pluginReference;
    const paletteName = neutralMatch[1];
    const sourceStep = neutralMatch[2];
    if (paletteName !== neutralPalette) {
      const family = colorModeFamilyFromTokenName(tokenName);
      const isIntentOrAccent = Boolean(extractIntentFromTokenName(tokenName)) || isAccentToken(tokenName);
      if (!family || !isIntentOrAccent) return pluginReference;
      const stepNumeric = parsePresetNumericStep(sourceStep);
      if (stepNumeric === null) return pluginReference;
      const darkTarget = remapIntentStepForDark(stepNumeric, family);
      const darkStep2 = resolveDarkStepForPalette(preset, paletteName, darkTarget, shadeSteps);
      return `colors/${paletteName}/${darkStep2}`;
    }
    const darkStep = remapNeutralStepForDarkFallback(preset, neutralPalette, sourceStep);
    return `colors/${neutralPalette}/${darkStep}`;
  }
  function convertKigenReferenceToPluginRef(tokenName, kigenReference, uiMode, preset, neutralPalette, shadeSteps, useBrandForAccent) {
    const segments = parseKigenReference(kigenReference);
    if (!segments.length) return "colors/base/black";
    if (segments[0] === "alpha") {
      const alphaMode = segments[1] === "dark" ? "dark" : "light";
      const alphaKey = segments[2] || "500";
      const opacityStep = resolveOpacityStepFromAlphaKey(alphaKey);
      const tone = alphaMode === "dark" ? "white" : "black";
      return `opacity/${tone}/${opacityStep}`;
    }
    if (segments[0] === "b&w") {
      const tone = segments[1] === "black" ? "black" : "white";
      const resolved2 = `colors/base/${tone}`;
      return uiMode === "dark" ? applyDarkModeTransformForReference(tokenName, resolved2, neutralPalette, preset, shadeSteps) : resolved2;
    }
    const sourcePalette = segments[0];
    const sourceStep = segments[1] || "500";
    let palette = sourcePalette;
    const tokenIntent = extractIntentFromTokenName(tokenName);
    if (isAccentToken(tokenName)) {
      palette = useBrandForAccent ? "brand" : resolvePaletteWithSynonyms(preset, "purple", "purple");
    } else if (tokenIntent) {
      palette = resolveIntentPalette(preset, tokenIntent);
    } else if (["slate", "gray", "zinc", "neutral", "stone"].includes(sourcePalette)) {
      palette = neutralPalette;
    } else {
      palette = resolvePaletteWithSynonyms(preset, sourcePalette, sourcePalette);
    }
    const step = resolvePrimitivePaletteStep(preset, palette, sourceStep, shadeSteps);
    const resolved = `colors/${palette}/${step}`;
    if (uiMode !== "dark") return resolved;
    return applyDarkModeTransformForReference(tokenName, resolved, neutralPalette, preset, shadeSteps);
  }
  function createEmptyColorModes() {
    return {
      bg: {},
      text: {},
      icon: {},
      border: {}
    };
  }
  function normalizeSemanticOverridesInput(value) {
    if (!value || typeof value !== "object") return {};
    const normalized = {};
    for (const [tokenName, rawReference] of Object.entries(value)) {
      const cleanTokenName = String(tokenName || "").trim().toLowerCase();
      const cleanReference = String(rawReference || "").trim();
      if (!cleanTokenName || !cleanReference) continue;
      if (!cleanReference.startsWith("{") || !cleanReference.endsWith("}")) continue;
      normalized[cleanTokenName] = cleanReference;
    }
    return normalized;
  }
  function generateColorModesTokens(uiMode, preset, neutralChoice, shadeSteps, useBrandForAccent, semanticOverrides = {}) {
    const neutralPalette = preset.palettes[neutralChoice] ? neutralChoice : preset.defaultNeutral;
    const generated = createEmptyColorModes();
    for (const family of COLOR_MODE_FAMILIES) {
      const templateEntries = KIGEN_COLOR_MODES_TEMPLATE[family];
      for (const [key, kigenRef] of Object.entries(templateEntries)) {
        const tokenName = `${family}/${key}`;
        const overrideReference = semanticOverrides[tokenName];
        generated[family][key] = convertKigenReferenceToPluginRef(
          tokenName,
          overrideReference || kigenRef,
          uiMode,
          preset,
          neutralPalette,
          shadeSteps,
          useBrandForAccent
        );
      }
    }
    return generated;
  }
  function compareColorModesStructure(generated) {
    const missing = [];
    for (const family of COLOR_MODE_FAMILIES) {
      const templateEntries = KIGEN_COLOR_MODES_TEMPLATE[family];
      for (const key of Object.keys(templateEntries)) {
        if (!generated[family][key]) {
          missing.push(`${family}/${key}`);
        }
      }
    }
    return missing;
  }
  function buildColorModeTokens(uiMode, preset, neutralChoice, shadeSteps, useBrandForAccent, semanticOverrides = {}) {
    if (uiMode === "both") {
      const generatedLight = generateColorModesTokens("light", preset, neutralChoice, shadeSteps, useBrandForAccent, semanticOverrides);
      const generatedDark = generateColorModesTokens("dark", preset, neutralChoice, shadeSteps, useBrandForAccent, semanticOverrides);
      const missing2 = Array.from(
        /* @__PURE__ */ new Set([...compareColorModesStructure(generatedLight), ...compareColorModesStructure(generatedDark)])
      );
      const tokens2 = [];
      for (const family of COLOR_MODE_FAMILIES) {
        const lightEntries = generatedLight[family];
        const darkEntries = generatedDark[family];
        for (const key of Object.keys(KIGEN_COLOR_MODES_TEMPLATE[family])) {
          const tokenName = `${family}/${key}`;
          const lightRef = lightEntries[key];
          const darkRef = darkEntries[key];
          if (!lightRef || !darkRef) continue;
          tokens2.push(
            createModeToken(COLLECTIONS.colorModes, tokenName, "COLOR", semanticScopes(tokenName), {
              light: alias(lightRef, COLLECTIONS.primitives),
              dark: alias(darkRef, COLLECTIONS.primitives)
            })
          );
        }
      }
      for (const [legacyName, sourceName] of LEGACY_COLOR_MODE_ALIASES) {
        tokens2.push(
          createModeToken(COLLECTIONS.colorModes, legacyName, "COLOR", semanticScopes(legacyName), {
            light: alias(sourceName, COLLECTIONS.colorModes),
            dark: alias(sourceName, COLLECTIONS.colorModes)
          })
        );
      }
      return { tokens: tokens2, missing: missing2 };
    }
    const generated = generateColorModesTokens(uiMode, preset, neutralChoice, shadeSteps, useBrandForAccent, semanticOverrides);
    const missing = compareColorModesStructure(generated);
    const tokens = [];
    for (const family of COLOR_MODE_FAMILIES) {
      const generatedEntries = generated[family];
      for (const [key, reference] of Object.entries(generatedEntries)) {
        const tokenName = `${family}/${key}`;
        tokens.push(createToken(COLLECTIONS.colorModes, tokenName, "COLOR", semanticScopes(tokenName), alias(reference, COLLECTIONS.primitives)));
      }
    }
    for (const [legacyName, sourceName] of LEGACY_COLOR_MODE_ALIASES) {
      tokens.push(createToken(COLLECTIONS.colorModes, legacyName, "COLOR", semanticScopes(legacyName), alias(sourceName, COLLECTIONS.colorModes)));
    }
    return { tokens, missing };
  }
  function sanitizePrimaryName(input, preset) {
    const reserved = /* @__PURE__ */ new Set([
      ...Object.keys(preset.palettes).map((name) => name.toLowerCase()),
      "base",
      "gray",
      "brand",
      "pixel",
      "opacity",
      "font-family",
      "font-size"
    ]);
    const base = sanitizeKebabSegment(input || "brand-primary", "brand-primary");
    let candidate = base;
    let i = 1;
    const isBlocked = (value) => reserved.has(value) || /^brand-\d+$/i.test(value);
    while (isBlocked(candidate) && i < 1e3) {
      candidate = `${base}-token-${i}`;
      i += 1;
    }
    if (isBlocked(candidate)) {
      candidate = "brand-primary";
    }
    return candidate;
  }
  function extractCustomBrandScale(scaleInput, shadeSteps) {
    if (!scaleInput || typeof scaleInput !== "object") return null;
    const input = scaleInput;
    const normalized = {};
    for (const step of shadeSteps) {
      const raw2 = input[String(step)];
      if (typeof raw2 !== "string") continue;
      const value = raw2.trim();
      if (!value) continue;
      try {
        parseColorInput(value);
        normalized[step] = value;
      } catch (_error) {
      }
    }
    return Object.keys(normalized).length === shadeSteps.length ? normalized : null;
  }
  function normalizeBrands(brandsInput, preset, shadeSteps, baseStep) {
    const prepared = brandsInput.slice(0, 10).map((brand) => ({
      name: String((brand == null ? void 0 : brand.name) || "").trim(),
      color: String((brand == null ? void 0 : brand.color) || "").trim(),
      scale: brand == null ? void 0 : brand.scale
    })).filter((brand, index) => index === 0 || brand.color.length > 0);
    if (!prepared.length) {
      prepared.push({ name: "brand-primary", color: DEFAULT_BRAND, scale: void 0 });
    }
    if (!prepared[0].color) {
      prepared[0].color = DEFAULT_BRAND;
    }
    for (const brand of prepared) {
      parseColorInput(brand.color);
    }
    const primaryName = sanitizePrimaryName(prepared[0].name, preset);
    return prepared.map((brand, index) => {
      const tokenName = index === 0 ? primaryName : `brand-${index + 1}`;
      const opacityName = `brand-${index + 1}`;
      const customScale = extractCustomBrandScale(brand.scale, shadeSteps);
      const scale = customScale ? customScale : buildBrandScale(brand.color, shadeSteps, baseStep);
      const baseColor = scale[baseStep] || brand.color;
      return { tokenName, opacityName, baseColor, scale };
    });
  }
  var TYPOGRAPHY_FAMILY_VARIABLES = {
    display: "font-family/font-family-display",
    body: "font-family/font-family-body"
  };
  function orderedTypographySizeKeys(fontSizes) {
    const known = FONT_SIZE_ORDER.filter((key) => Object.prototype.hasOwnProperty.call(fontSizes, key));
    const extras = Object.keys(fontSizes).filter((key) => !known.includes(key)).sort((a, b) => a.localeCompare(b));
    return [...known, ...extras];
  }
  function resolveTypographyLineHeights(fontSizes) {
    const lineHeights = {};
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(fontSizes), ...Object.keys(DEFAULT_LINE_HEIGHTS)]);
    for (const key of allKeys) {
      const size = Number(fontSizes[key]);
      if (!Number.isFinite(size) || size <= 0) continue;
      const baseSize = Number(DEFAULT_FONT_SIZES[key]);
      const baseLine = Number(DEFAULT_LINE_HEIGHTS[key]);
      const ratio = Number.isFinite(baseSize) && baseSize > 0 && Number.isFinite(baseLine) && baseLine > 0 ? baseLine / baseSize : 1.4;
      lineHeights[key] = roundTo(size * ratio, 2);
    }
    return lineHeights;
  }
  function buildTypographyTokens(options) {
    const tokens = [];
    const fontSizes = options.typography.fontSizes;
    const lineHeights = options.typography.lineHeights && typeof options.typography.lineHeights === "object" ? __spreadValues(__spreadValues({}, resolveTypographyLineHeights(fontSizes)), options.typography.lineHeights) : resolveTypographyLineHeights(fontSizes);
    const letterSpacings = options.typography.letterSpacings && typeof options.typography.letterSpacings === "object" ? __spreadValues(__spreadValues({}, DEFAULT_LETTER_SPACINGS), options.typography.letterSpacings) : __spreadValues({}, DEFAULT_LETTER_SPACINGS);
    const sizeKeys = orderedTypographySizeKeys(fontSizes);
    tokens.push(createToken(COLLECTIONS.typography, TYPOGRAPHY_FAMILY_VARIABLES.display, "STRING", ["FONT_FAMILY"], raw(options.typography.displayFamily)));
    tokens.push(createToken(COLLECTIONS.typography, TYPOGRAPHY_FAMILY_VARIABLES.body, "STRING", ["FONT_FAMILY"], raw(options.typography.bodyFamily)));
    for (const sizeKey of sizeKeys) {
      const value = Number(fontSizes[sizeKey]);
      if (!Number.isFinite(value) || value <= 0) continue;
      tokens.push(createToken(COLLECTIONS.typography, `font-size/${sizeKey}`, "FLOAT", ["FONT_SIZE"], raw(value)));
    }
    for (const sizeKey of orderedTypographySizeKeys(lineHeights)) {
      const value = Number(lineHeights[sizeKey]);
      if (!Number.isFinite(value) || value <= 0) continue;
      tokens.push(createToken(COLLECTIONS.typography, `line-height/${sizeKey}`, "FLOAT", ["FONT_SIZE"], raw(value)));
    }
    for (const sizeKey of orderedTypographySizeKeys(letterSpacings)) {
      const value = Number(letterSpacings[sizeKey]);
      if (!Number.isFinite(value)) continue;
      tokens.push(createToken(COLLECTIONS.typography, `letter-spacing/${sizeKey}`, "FLOAT", ["FONT_SIZE"], raw(value)));
    }
    for (const [weightKey, weightLabel] of Object.entries(DEFAULT_FONT_WEIGHT_STYLES)) {
      tokens.push(createToken(COLLECTIONS.typography, `font-weight/${weightKey}`, "STRING", ["FONT_STYLE"], raw(weightLabel)));
    }
    return tokens;
  }
  function buildPrimitiveTokens(options, preset, brands, shadeSteps) {
    var _a, _b, _c, _d;
    const tokens = [];
    const presetSteps = normalizePresetSteps(preset);
    const neutralPaletteSteps = getPaletteSteps(preset, options.neutralChoice);
    const selectedPaletteSet = Array.isArray(options.selectedPalettes) && options.selectedPalettes.length ? new Set(options.selectedPalettes.map((palette) => normalizePaletteKey2(palette))) : null;
    if (selectedPaletteSet && options.neutralChoice) {
      selectedPaletteSet.add(normalizePaletteKey2(options.neutralChoice));
    }
    tokens.push(createToken(COLLECTIONS.primitives, "colors/base/white", "COLOR", ["ALL_SCOPES"], raw(options.baseWhite)));
    tokens.push(createToken(COLLECTIONS.primitives, "colors/base/black", "COLOR", ["ALL_SCOPES"], raw(options.baseBlack)));
    for (const [paletteName, palette] of Object.entries(preset.palettes)) {
      const paletteKey = normalizePaletteKey2(paletteName);
      if (selectedPaletteSet && !selectedPaletteSet.has(paletteKey)) continue;
      const overridesByStep = (_d = (_c = (_a = options.paletteOverrides) == null ? void 0 : _a[paletteKey]) != null ? _c : (_b = options.paletteOverrides) == null ? void 0 : _b[paletteName]) != null ? _d : {};
      for (const step of presetSteps) {
        const value = overridesByStep[step] || palette[step];
        if (!value) continue;
        tokens.push(createToken(COLLECTIONS.primitives, `colors/${paletteName}/${step}`, "COLOR", ["ALL_SCOPES"], raw(value)));
      }
    }
    const grayAliasSteps = neutralPaletteSteps.length ? neutralPaletteSteps : presetSteps;
    for (const step of grayAliasSteps) {
      const neutralStep = resolveClosestPaletteStep(preset, options.neutralChoice, step);
      tokens.push(
        createToken(
          COLLECTIONS.primitives,
          `colors/gray/${step}`,
          "COLOR",
          ["ALL_SCOPES"],
          alias(`colors/${options.neutralChoice}/${neutralStep}`, COLLECTIONS.primitives)
        )
      );
    }
    const primary = brands[0];
    for (const brand of brands) {
      for (const step of shadeSteps) {
        const value = brand.scale[step];
        if (!value) continue;
        tokens.push(
          createToken(COLLECTIONS.primitives, `colors/${brand.tokenName}/${step}`, "COLOR", ["ALL_SCOPES"], raw(value))
        );
      }
    }
    for (const step of shadeSteps) {
      tokens.push(
        createToken(
          COLLECTIONS.primitives,
          `colors/brand/${step}`,
          "COLOR",
          ["ALL_SCOPES"],
          alias(`colors/${primary.tokenName}/${step}`, COLLECTIONS.primitives)
        )
      );
    }
    for (const value of PIXEL_VALUES) {
      tokens.push(
        createToken(
          COLLECTIONS.primitives,
          `pixel/${value}`,
          "FLOAT",
          ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"],
          raw(value)
        )
      );
    }
    tokens.push(createToken(COLLECTIONS.primitives, "pixel/full", "FLOAT", ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"], raw(9999)));
    for (const pct of OPACITY_STEPS) {
      tokens.push(createToken(COLLECTIONS.primitives, `opacity/white/${pct}`, "COLOR", ["ALL_FILLS"], raw(colorWithAlpha(options.baseWhite, pct))));
      tokens.push(createToken(COLLECTIONS.primitives, `opacity/black/${pct}`, "COLOR", ["ALL_FILLS"], raw(colorWithAlpha(options.baseBlack, pct))));
    }
    for (const brand of brands) {
      for (const pct of OPACITY_STEPS) {
        tokens.push(
          createToken(
            COLLECTIONS.primitives,
            `opacity/${brand.opacityName}/${pct}`,
            "COLOR",
            ["ALL_FILLS"],
            raw(colorWithAlpha(brand.baseColor, pct))
          )
        );
      }
    }
    return tokens;
  }
  function buildSpacingTokens() {
    return SPACING_ALIAS_MAP.map(
      ([name, pixelRef]) => createToken(COLLECTIONS.spacing, name, "FLOAT", ["GAP", "WIDTH_HEIGHT"], alias(`pixel/${pixelRef}`, COLLECTIONS.primitives))
    );
  }
  function buildRadiusTokens() {
    return RADIUS_ALIAS_MAP.map(
      ([name, pixelRef]) => createToken(COLLECTIONS.radius, name, "FLOAT", ["CORNER_RADIUS"], alias(`pixel/${pixelRef}`, COLLECTIONS.primitives))
    );
  }
  function normalizeTokenLevel(value) {
    return value === "color-modes" ? "color-modes" : "foundations";
  }
  function normalizeUiMode(value) {
    if (value === "dark") return "dark";
    if (value === "both") return "both";
    return "light";
  }
  function normalizeNamingPattern(value) {
    return value === "hundreds" ? "hundreds" : "tailwind";
  }
  function normalizeTokenBundleInput(value) {
    if (!value) return void 0;
    const validation = validateTokenBundle(value);
    if (!validation.valid) {
      throw new Error(`TokenBundle invalide: ${validation.errors.join(" | ")}`);
    }
    return normalizeTokenBundle(value);
  }
  function buildGenerationOptions(rawPayload) {
    var _a, _b;
    if (!rawPayload || typeof rawPayload !== "object") {
      throw new Error("Payload generation invalide.");
    }
    const input = rawPayload;
    const presetId = String(input.presetId || ((_a = BUILTIN_PRESETS[0]) == null ? void 0 : _a.id) || "default");
    const preset = getPresetById(presetId) || BUILTIN_PRESETS[0];
    if (!preset) throw new Error("Aucun preset interne disponible.");
    const tokenLevel = normalizeTokenLevel(input.tokenLevel);
    const uiMode = normalizeUiMode(input.uiMode);
    const namingPattern = normalizeNamingPattern(input.namingPattern);
    const shadeCount = clampNumber(input.shadeCount, 6, 14, 11);
    const createTextStyles = input.createTextStyles !== false;
    const tokenBundle = normalizeTokenBundleInput(input.tokenBundle);
    const baseWhite = String(input.baseWhite || DEFAULT_BASE_WHITE).trim();
    const baseBlack = String(input.baseBlack || DEFAULT_BASE_BLACK).trim();
    parseColorInput(baseWhite);
    parseColorInput(baseBlack);
    const candidateNeutral = String(input.neutralChoice || preset.defaultNeutral).trim().toLowerCase();
    const neutralChoice = preset.neutralOptions.includes(candidateNeutral) ? candidateNeutral : preset.defaultNeutral;
    const rawBrandsInput = Array.isArray(input.brands) ? input.brands : [];
    const selectedPalettesInput = Array.isArray(input.selectedPalettes) ? (_b = input.selectedPalettes) != null ? _b : [] : [];
    const selectedPalettes = selectedPalettesInput.map((entry) => normalizePaletteKey2(String(entry || ""))).filter(Boolean);
    const paletteOverridesInput = input.paletteOverrides;
    const paletteOverrides = {};
    if (paletteOverridesInput && typeof paletteOverridesInput === "object") {
      for (const [paletteName, stepValues] of Object.entries(paletteOverridesInput)) {
        if (!stepValues || typeof stepValues !== "object") continue;
        const normalizedPalette = normalizePaletteKey2(paletteName);
        if (!normalizedPalette) continue;
        const overridesForPalette = {};
        for (const [step, rawValue] of Object.entries(stepValues)) {
          if (typeof rawValue !== "string") continue;
          const value = rawValue.trim();
          if (!value) continue;
          try {
            parseColorInput(value);
            overridesForPalette[String(step)] = value;
          } catch (_error) {
          }
        }
        if (Object.keys(overridesForPalette).length) {
          paletteOverrides[normalizedPalette] = overridesForPalette;
        }
      }
    }
    const semanticOverrides = normalizeSemanticOverridesInput(input.semanticOverrides);
    const hasCustomBrand = rawBrandsInput.some(
      (entry) => Boolean(entry) && typeof entry === "object" && String(entry.color || "").trim().length > 0
    );
    const brands = rawBrandsInput.slice(0, 10).filter((entry) => Boolean(entry) && typeof entry === "object").map((entry) => ({
      name: String(entry.name || "").trim(),
      color: String(entry.color || "").trim(),
      contrast: Number.isFinite(Number(entry.contrast)) ? Number(entry.contrast) : void 0,
      scale: entry.scale && typeof entry.scale === "object" ? Object.entries(entry.scale).reduce((acc, [key, value]) => {
        if (typeof value !== "string") return acc;
        const trimmed = value.trim();
        if (!trimmed) return acc;
        acc[String(key)] = trimmed;
        return acc;
      }, {}) : void 0
    }));
    if (!brands.length) {
      brands.push({ name: "brand-primary", color: DEFAULT_BRAND, contrast: void 0, scale: void 0 });
    }
    if (!brands[0].color) {
      brands[0].color = DEFAULT_BRAND;
    }
    for (const brand of brands) {
      if (!brand.color) continue;
      parseColorInput(brand.color);
    }
    const inputTypography = input.typography && typeof input.typography === "object" ? input.typography : void 0;
    const displayFamily = inputTypography && typeof inputTypography.displayFamily === "string" && inputTypography.displayFamily.trim().length ? inputTypography.displayFamily.trim() : DEFAULT_DISPLAY_FAMILY;
    const bodyFamily = inputTypography && typeof inputTypography.bodyFamily === "string" && inputTypography.bodyFamily.trim().length ? inputTypography.bodyFamily.trim() : DEFAULT_BODY_FAMILY;
    const fontSizes = __spreadValues({}, DEFAULT_FONT_SIZES);
    if (inputTypography && inputTypography.fontSizes && typeof inputTypography.fontSizes === "object") {
      for (const key of Object.keys(DEFAULT_FONT_SIZES)) {
        const candidate = Number(inputTypography.fontSizes[key]);
        if (Number.isFinite(candidate) && candidate > 0) {
          fontSizes[key] = candidate;
        }
      }
    }
    const lineHeights = __spreadValues({}, DEFAULT_LINE_HEIGHTS);
    if (inputTypography && inputTypography.lineHeights && typeof inputTypography.lineHeights === "object") {
      for (const key of Object.keys(DEFAULT_LINE_HEIGHTS)) {
        const candidate = Number(inputTypography.lineHeights[key]);
        if (Number.isFinite(candidate) && candidate > 0) {
          lineHeights[key] = candidate;
        }
      }
    }
    const letterSpacings = __spreadValues({}, DEFAULT_LETTER_SPACINGS);
    if (inputTypography && inputTypography.letterSpacings && typeof inputTypography.letterSpacings === "object") {
      for (const key of Object.keys(DEFAULT_LETTER_SPACINGS)) {
        const candidate = Number(inputTypography.letterSpacings[key]);
        if (Number.isFinite(candidate)) {
          letterSpacings[key] = candidate;
        }
      }
    }
    const styleFamilies = inputTypography && inputTypography.styleFamilies && typeof inputTypography.styleFamilies === "object" ? Object.entries(inputTypography.styleFamilies).reduce((acc, [key, value]) => {
      const cleanKey = String(key || "").trim();
      const cleanValue = String(value || "").trim();
      if (cleanKey && cleanValue) acc[cleanKey] = cleanValue;
      return acc;
    }, {}) : {};
    const styleWeights = inputTypography && inputTypography.styleWeights && typeof inputTypography.styleWeights === "object" ? Object.entries(inputTypography.styleWeights).reduce((acc, [key, value]) => {
      if (!Array.isArray(value)) return acc;
      const cleanKey = String(key || "").trim();
      const cleanValues = value.map((entry) => String(entry || "").trim()).filter(Boolean);
      if (cleanKey && cleanValues.length) acc[cleanKey] = cleanValues;
      return acc;
    }, {}) : {};
    const inputIcons = input.icons && typeof input.icons === "object" ? input.icons : void 0;
    const iconLibrary = inputIcons && typeof inputIcons.library === "string" && inputIcons.library.trim().length ? inputIcons.library.trim() : DEFAULT_ICON_LIBRARY;
    const includeStarterPack = !(inputIcons && inputIcons.includeStarterPack === false);
    const iconPacks = Array.isArray(inputIcons == null ? void 0 : inputIcons.packs) ? inputIcons.packs.map((entry) => String(entry || "").trim()).filter(Boolean) : [...DEFAULT_ICON_PACKS];
    const iconSizeCandidate = Number(inputIcons == null ? void 0 : inputIcons.size);
    const iconSize = Number.isFinite(iconSizeCandidate) && iconSizeCandidate >= 12 && iconSizeCandidate <= 64 ? Math.round(iconSizeCandidate) : DEFAULT_ICON_SIZE;
    const iconColorAlias = inputIcons && typeof inputIcons.colorAlias === "string" && inputIcons.colorAlias.trim().length ? inputIcons.colorAlias.trim().toLowerCase() : DEFAULT_ICON_COLOR_ALIAS;
    const iconStroke = normalizeIconStrokeId(inputIcons == null ? void 0 : inputIcons.stroke);
    return {
      tokenLevel,
      uiMode,
      presetId,
      hasCustomBrand,
      baseWhite,
      baseBlack,
      neutralChoice,
      namingPattern,
      shadeCount,
      createTextStyles,
      brands,
      selectedPalettes,
      paletteOverrides,
      semanticOverrides,
      tokenBundle,
      icons: {
        library: iconLibrary,
        includeStarterPack,
        packs: iconPacks,
        size: iconSize,
        colorAlias: iconColorAlias,
        stroke: iconStroke
      },
      typography: {
        displayFamily,
        bodyFamily,
        fontSizes,
        lineHeights,
        letterSpacings,
        styleFamilies,
        styleWeights
      }
    };
  }
  function findCollectionByNames(collections, names) {
    const lookups = new Set(names.map((name) => normalizeCollectionLookup(name)));
    for (const collection of collections) {
      if (lookups.has(normalizeCollectionLookup(collection.name))) {
        return collection;
      }
    }
    return null;
  }
  function resolveCollection(canonicalName, collections, report) {
    const canonicalMatch = findCollectionByNames(collections, [canonicalName]);
    if (canonicalMatch) {
      if (canonicalMatch.name !== canonicalName) {
        const previous = canonicalMatch.name;
        canonicalMatch.name = canonicalName;
        report.migrations.push(`Collection renomm\xC3\xA9e: ${previous} -> ${canonicalName}`);
      }
      return canonicalMatch;
    }
    const legacyNames = COLLECTION_LEGACY_NAMES[canonicalName].filter(
      (name) => normalizeCollectionLookup(name) !== normalizeCollectionLookup(canonicalName)
    );
    const legacyMatch = findCollectionByNames(collections, legacyNames);
    if (legacyMatch) {
      const previous = legacyMatch.name;
      legacyMatch.name = canonicalName;
      report.migrations.push(`Collection migr\xC3\xA9e: ${previous} -> ${canonicalName}`);
      return legacyMatch;
    }
    const created = figma.variables.createVariableCollection(canonicalName);
    collections.push(created);
    report.migrations.push(`Collection cr\xC3\xA9\xC3\xA9e: ${canonicalName}`);
    return created;
  }
  function ensureCollectionModes(collection, requestedModes, report) {
    const desired = Array.from(new Set(requestedModes));
    let modeMap = buildModeMap(collection);
    for (const name of desired) {
      if (!modeMap[name]) {
        collection.addMode(name);
        report.migrations.push(`Mode ajoute (${collection.name}): ${name}`);
        modeMap = buildModeMap(collection);
      }
    }
    for (const mode of [...collection.modes]) {
      if (desired.includes(mode.name)) continue;
      if (collection.modes.length > desired.length) {
        collection.removeMode(mode.modeId);
        report.migrations.push(`Mode supprime (${collection.name}): ${mode.name}`);
      }
    }
    modeMap = buildModeMap(collection);
    if (desired.length === 1 && !modeMap[desired[0]] && collection.modes.length === 1) {
      const previous = collection.modes[0].name;
      collection.renameMode(collection.modes[0].modeId, desired[0]);
      report.migrations.push(`Mode renomme (${collection.name}): ${previous} -> ${desired[0]}`);
      modeMap = buildModeMap(collection);
    }
    for (const name of desired) {
      if (!modeMap[name]) {
        collection.addMode(name);
        report.migrations.push(`Mode ajoute (${collection.name}): ${name}`);
        modeMap = buildModeMap(collection);
      }
    }
    const resolved = {};
    for (const name of desired) {
      if (!modeMap[name]) {
        throw new Error(`Impossible de definir le mode ${name} pour ${collection.name}`);
      }
      resolved[name] = modeMap[name];
    }
    return resolved;
  }
  function removeDeprecatedVariablesByPrefix(collection, prefixes, report) {
    if (!collection) return;
    const allVariables = figma.variables.getLocalVariables();
    const toRemove = allVariables.filter(
      (variable) => variable.variableCollectionId === collection.id && prefixes.some((prefix) => variable.name.startsWith(prefix))
    );
    for (const variable of toRemove) {
      report.migrations.push(`Variable supprimee: ${collection.name}/${variable.name}`);
      variable.remove();
    }
  }
  var TEXT_CASE_VALUES = /* @__PURE__ */ new Set(["ORIGINAL", "UPPER", "LOWER", "TITLE", "SMALL_CAPS", "SMALL_CAPS_FORCED"]);
  var TEXT_DECORATION_VALUES = /* @__PURE__ */ new Set(["NONE", "UNDERLINE", "STRIKETHROUGH"]);
  function normalizeFontLookup(input) {
    return String(input || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function roundTo(value, precision = 2) {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  }
  async function withTimeout(promise, timeoutMs, label) {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${label} timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      promise.then((value) => {
        clearTimeout(timer);
        resolve(value);
      }).catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }
  function resolveTextCase(value) {
    return TEXT_CASE_VALUES.has(value) ? value : "ORIGINAL";
  }
  function resolveTextDecoration(value) {
    return TEXT_DECORATION_VALUES.has(value) ? value : "NONE";
  }
  function buildFontCatalog(fonts) {
    const catalog = /* @__PURE__ */ new Map();
    for (const font of fonts) {
      const key = normalizeFontLookup(font.fontName.family);
      if (!key) continue;
      if (!catalog.has(key)) {
        catalog.set(key, { family: font.fontName.family, styles: [] });
      }
      const entry = catalog.get(key);
      if (!entry.styles.includes(font.fontName.style)) {
        entry.styles.push(font.fontName.style);
      }
    }
    return catalog;
  }
  function resolveFamilyName(catalog, requested) {
    const direct = catalog.get(normalizeFontLookup(requested));
    if (direct) return direct.family;
    return null;
  }
  function preferredStyleCandidates(weight, italic) {
    const base = weight >= 700 ? ["Bold", "Semi Bold", "SemiBold", "Medium", "Regular"] : weight >= 600 ? ["Semi Bold", "SemiBold", "Demi Bold", "DemiBold", "Bold", "Medium", "Regular"] : weight >= 500 ? ["Medium", "Regular", "Semi Bold", "SemiBold", "Bold"] : ["Regular", "Book", "Roman", "Medium"];
    if (!italic) return base;
    const italicized = base.flatMap((candidate) => [`${candidate} Italic`, candidate]);
    return ["Italic", ...italicized];
  }
  function resolveFontStyle(availableStyles, preferredStyle, fallbackWeight, italic) {
    if (!availableStyles.length) return "Regular";
    const normalizedMap = new Map(availableStyles.map((style) => [normalizeFontLookup(style), style]));
    const lookupPreferred = normalizeFontLookup(preferredStyle);
    if (lookupPreferred && normalizedMap.has(lookupPreferred)) {
      return normalizedMap.get(lookupPreferred);
    }
    const candidates = [...preferredStyleCandidates(fallbackWeight, italic), preferredStyle].filter(Boolean);
    for (const candidate of candidates) {
      const lookup = normalizeFontLookup(candidate);
      if (lookup && normalizedMap.has(lookup)) {
        return normalizedMap.get(lookup);
      }
    }
    if (italic) {
      const italicMatch = availableStyles.find((style) => /italic/i.test(style));
      if (italicMatch) return italicMatch;
    }
    const regularMatch = availableStyles.find((style) => /^regular$/i.test(style));
    if (regularMatch) return regularMatch;
    return availableStyles[0];
  }
  async function ensureFontLoaded(fontName, loaded, report) {
    const key = `${fontName.family}::${fontName.style}`;
    if (loaded.has(key)) return true;
    try {
      await withTimeout(figma.loadFontAsync(fontName), 1e4, `loadFontAsync ${fontName.family}/${fontName.style}`);
      loaded.add(key);
      return true;
    } catch (_error) {
      report.warnings.push(`Font missing: ${fontName.family}/${fontName.style}`);
      return false;
    }
  }
  function resolveTemplateFontSize(template, options) {
    const candidate = Number(options.typography.fontSizes[template.sizeToken]);
    if (Number.isFinite(candidate) && candidate > 0) return candidate;
    return template.baseSize;
  }
  function resolveTemplateLineHeight(template, options, fontSize) {
    var _a;
    const candidate = Number((_a = options.typography.lineHeights) == null ? void 0 : _a[template.sizeToken]);
    if (Number.isFinite(candidate) && candidate > 0) return candidate;
    return roundTo(fontSize * template.lineHeightRatio);
  }
  function resolveTemplateLetterSpacing(template, options) {
    var _a;
    const candidate = Number((_a = options.typography.letterSpacings) == null ? void 0 : _a[template.sizeToken]);
    if (Number.isFinite(candidate)) return candidate;
    return template.letterSpacingValue;
  }
  function upsertTextStyleByName(name, index) {
    const existing = index.get(name);
    if (existing) return { style: existing, created: false };
    const created = figma.createTextStyle();
    created.name = name;
    index.set(name, created);
    return { style: created, created: true };
  }
  function variableIndexKey(collectionId, variableName) {
    return `${collectionId}::${variableName}`;
  }
  function getVariableFromIndex(variableIndex, collectionId, variableName) {
    var _a;
    return (_a = variableIndex.get(variableIndexKey(collectionId, variableName))) != null ? _a : null;
  }
  function tryBindTextStyleVariable(style, field, variable, report, styleName) {
    try {
      style.setBoundVariable(field, variable);
    } catch (_error) {
      const variableLabel = variable ? `${variable.name} (${variable.resolvedType})` : "null";
      report.warnings.push(`Text style bind failed: ${styleName} -> ${field} with ${variableLabel}`);
    }
  }
  async function applyTypographyTextStyles(options, report, typographyCollection, variableIndex, progress) {
    var _a, _b;
    if (!TEXT_STYLE_TEMPLATES.length) {
      report.warnings.push("No typography style templates available.");
      return;
    }
    if (!typographyCollection) {
      report.warnings.push("Typography binding skipped: typography collection unavailable.");
      return;
    }
    progress == null ? void 0 : progress("Typography: chargement des polices...");
    let availableFonts = [];
    try {
      availableFonts = await withTimeout(figma.listAvailableFontsAsync(), 15e3, "listAvailableFontsAsync");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.warnings.push(`Typography skipped: ${message}`);
      report.migrations.push("Text styles skipped (polices indisponibles ou timeout).");
      return;
    }
    const catalog = buildFontCatalog(availableFonts);
    const localStyles = figma.getLocalTextStyles();
    const styleIndex = new Map(localStyles.map((style) => [style.name, style]));
    const loadedFonts = /* @__PURE__ */ new Set();
    const warnedMissingVars = /* @__PURE__ */ new Set();
    const typographyCollectionId = typographyCollection.id;
    const displayFamilyVar = getVariableFromIndex(variableIndex, typographyCollectionId, TYPOGRAPHY_FAMILY_VARIABLES.display);
    const bodyFamilyVar = getVariableFromIndex(variableIndex, typographyCollectionId, TYPOGRAPHY_FAMILY_VARIABLES.body);
    let created = 0;
    let updated = 0;
    for (const template of TEXT_STYLE_TEMPLATES) {
      const preferredFamily = ((_a = options.typography.styleFamilies) == null ? void 0 : _a[template.sizeToken]) || (template.familyKind === "display" ? options.typography.displayFamily : options.typography.bodyFamily);
      const family = (_b = resolveFamilyName(catalog, preferredFamily)) != null ? _b : resolveFamilyName(catalog, template.familyKind === "display" ? "Roboto" : "Inter");
      if (!family) {
        report.warnings.push(`Font family missing for text style: ${template.name}`);
        continue;
      }
      const familyEntry = catalog.get(normalizeFontLookup(family));
      if (!familyEntry || !familyEntry.styles.length) {
        report.warnings.push(`No styles found for font family: ${family}`);
        continue;
      }
      const styleName = resolveFontStyle(
        familyEntry.styles,
        template.preferredFontStyle,
        template.fallbackWeight,
        template.italic
      );
      const fontName = { family: familyEntry.family, style: styleName };
      if (!await ensureFontLoaded(fontName, loadedFonts, report)) continue;
      const { style, created: justCreated } = upsertTextStyleByName(template.name, styleIndex);
      style.name = template.name;
      style.fontName = fontName;
      const fontSize = resolveTemplateFontSize(template, options);
      style.fontSize = fontSize;
      style.lineHeight = { unit: "PIXELS", value: resolveTemplateLineHeight(template, options, fontSize) };
      style.letterSpacing = template.letterSpacingUnit === "PERCENT" ? { unit: "PERCENT", value: template.letterSpacingValue } : { unit: "PIXELS", value: resolveTemplateLetterSpacing(template, options) };
      style.paragraphSpacing = roundTo(fontSize * template.paragraphSpacingRatio);
      style.paragraphIndent = template.paragraphIndent;
      style.textCase = resolveTextCase(template.textCase);
      style.textDecoration = resolveTextDecoration(template.textDecoration);
      const familyVariable = template.familyKind === "display" ? displayFamilyVar : bodyFamilyVar;
      if (familyVariable && familyVariable.resolvedType === "STRING") {
        tryBindTextStyleVariable(style, "fontFamily", familyVariable, report, template.name);
      } else {
        const key = `fontFamily:${template.familyKind}`;
        if (!warnedMissingVars.has(key)) {
          warnedMissingVars.add(key);
          report.warnings.push(`Missing STRING variable for text style binding: ${TYPOGRAPHY_FAMILY_VARIABLES[template.familyKind]}`);
        }
      }
      const sizeVariableName = `font-size/${template.sizeToken}`;
      const sizeVariable = getVariableFromIndex(variableIndex, typographyCollectionId, sizeVariableName);
      if (sizeVariable && sizeVariable.resolvedType === "FLOAT") {
        tryBindTextStyleVariable(style, "fontSize", sizeVariable, report, template.name);
      } else if (!warnedMissingVars.has(sizeVariableName)) {
        warnedMissingVars.add(sizeVariableName);
        report.warnings.push(`Missing FLOAT variable for text style binding: ${sizeVariableName}`);
      }
      const lineHeightVariableName = `line-height/${template.sizeToken}`;
      const lineHeightVariable = getVariableFromIndex(variableIndex, typographyCollectionId, lineHeightVariableName);
      if (lineHeightVariable && lineHeightVariable.resolvedType === "FLOAT") {
        tryBindTextStyleVariable(style, "lineHeight", lineHeightVariable, report, template.name);
      } else if (!warnedMissingVars.has(lineHeightVariableName)) {
        warnedMissingVars.add(lineHeightVariableName);
        report.warnings.push(`Missing FLOAT variable for text style binding: ${lineHeightVariableName}`);
      }
      const styleVariant = template.name.split("/")[1] || template.preferredFontStyle;
      const variantLookup = styleVariant.toLowerCase();
      let weightKey = "regular";
      if (variantLookup.includes("semi")) weightKey = "semibold";
      else if (variantLookup.includes("bold")) weightKey = "bold";
      else if (variantLookup.includes("medium")) weightKey = "medium";
      if (variantLookup.includes("italic")) {
        weightKey = `${weightKey}-italic`;
      }
      const weightVariableName = `font-weight/${weightKey}`;
      const weightVariable = getVariableFromIndex(variableIndex, typographyCollectionId, weightVariableName);
      if (weightVariable && weightVariable.resolvedType === "STRING") {
        tryBindTextStyleVariable(style, "fontStyle", weightVariable, report, template.name);
      } else if (!warnedMissingVars.has(weightVariableName)) {
        warnedMissingVars.add(weightVariableName);
        report.warnings.push(`Missing STRING variable for text style binding: ${weightVariableName}`);
      }
      if (justCreated) created += 1;
      else updated += 1;
    }
    report.migrations.push(`Text styles: ${created} created, ${updated} updated (family/size/weight/line-height linked).`);
  }
  async function applyGeneration(options, progress) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const totalStart = Date.now();
    const preset = getPresetById(options.presetId);
    if (!preset) throw new Error(`Preset inconnu: ${options.presetId}`);
    progress == null ? void 0 : progress("Pr\xE9paration des tokens...");
    const tokenPhaseStart = Date.now();
    const shadeSteps = deriveShadeSteps(options.namingPattern, options.shadeCount);
    const baseStep = resolveBaseStep(shadeSteps);
    const brands = normalizeBrands(options.brands, preset, shadeSteps, baseStep);
    const tokens = [];
    tokens.push(...buildPrimitiveTokens(options, preset, brands, shadeSteps));
    tokens.push(...buildTypographyTokens(options));
    tokens.push(...buildSpacingTokens());
    tokens.push(...buildRadiusTokens());
    let bundleColorModeTokens = [];
    let colorModesResult = null;
    if (options.tokenLevel === "color-modes") {
      if (options.tokenBundle) {
        bundleColorModeTokens = buildColorModeTokensFromBundle(options.tokenBundle);
        tokens.push(...bundleColorModeTokens);
      } else {
        colorModesResult = buildColorModeTokens(
          options.uiMode,
          preset,
          options.neutralChoice,
          shadeSteps,
          options.hasCustomBrand,
          options.semanticOverrides
        );
        tokens.push(...colorModesResult.tokens);
      }
    }
    const tokenPhaseMs = Date.now() - tokenPhaseStart;
    progress == null ? void 0 : progress(`Tokens pr\xE9par\xE9s (${tokens.length}).`);
    const targetCollections = [COLLECTIONS.primitives, COLLECTIONS.typography, COLLECTIONS.spacing, COLLECTIONS.radius];
    if (options.tokenLevel === "color-modes") {
      targetCollections.push(COLLECTIONS.colorModes);
    }
    const report = {
      created: 0,
      updated: 0,
      collisionsReplaced: 0,
      aliasApplied: 0,
      aliasMissing: 0,
      warnings: [],
      migrations: [],
      collections: targetCollections.map((name) => ({ name, created: 0, updated: 0, collisionsReplaced: 0 }))
    };
    if (bundleColorModeTokens.length) {
      report.migrations.push(`TokenBundle semantic branche: ${bundleColorModeTokens.length} tokens utilises.`);
    } else if (colorModesResult == null ? void 0 : colorModesResult.missing.length) {
      for (const tokenName of colorModesResult.missing) {
        const message = `Color modes token missing from generated structure: ${tokenName}`;
        report.warnings.push(message);
        console.warn(`[ombrstudio] ${message}`);
      }
    } else if (colorModesResult) {
      console.log("[ombrstudio] Color modes structure check: OK");
    }
    const localCollections = figma.variables.getLocalVariableCollections();
    const collectionsByName = /* @__PURE__ */ new Map();
    for (const name of targetCollections) {
      collectionsByName.set(name, resolveCollection(name, localCollections, report));
    }
    const modeIdsByCollection = /* @__PURE__ */ new Map();
    for (const [name, collection] of collectionsByName.entries()) {
      const desiredModes = name === COLLECTIONS.colorModes && (bundleColorModeTokens.length > 0 || options.uiMode === "both") ? ["light", "dark"] : ["default"];
      modeIdsByCollection.set(name, ensureCollectionModes(collection, desiredModes, report));
    }
    removeDeprecatedVariablesByPrefix(
      (_a = collectionsByName.get(COLLECTIONS.primitives)) != null ? _a : null,
      ["colors/alpha/", "font-family/", "font-size/", "font-weight/", "line-height/"],
      report
    );
    const colorModesCleanupCollection = (_b = collectionsByName.get(COLLECTIONS.colorModes)) != null ? _b : findCollectionByNames(localCollections, [COLLECTIONS.colorModes, ...COLLECTION_LEGACY_NAMES[COLLECTIONS.colorModes]]);
    removeDeprecatedVariablesByPrefix(colorModesCleanupCollection, ["alpha/"], report);
    const localVariables = figma.variables.getLocalVariables();
    const variableIndex = new Map(localVariables.map((variable) => [`${variable.variableCollectionId}::${variable.name}`, variable]));
    const refreshedCollections = figma.variables.getLocalVariableCollections();
    const aliasIndex = {
      global: /* @__PURE__ */ new Map(),
      byCollectionId: /* @__PURE__ */ new Map(),
      byCollectionName: /* @__PURE__ */ new Map(),
      collectionNameById: new Map(refreshedCollections.map((collection) => [collection.id, collection.name]))
    };
    for (const variable of localVariables) {
      addAliasEntry(aliasIndex, variable);
    }
    const pendingAliases = [];
    let processedTokens = 0;
    progress == null ? void 0 : progress("\xC9criture des variables...");
    const writePhaseStart = Date.now();
    for (const token of tokens) {
      const collection = collectionsByName.get(token.collection);
      if (!collection) continue;
      const variable = upsertVariable(collection, token.name, token.type, variableIndex, report);
      if (!variable) continue;
      variable.scopes = sanitizeScopes(token.scopes);
      const modeMap = modeIdsByCollection.get(token.collection);
      if (!modeMap) {
        report.warnings.push(`Mode map missing for ${collection.name}/${token.name}`);
        continue;
      }
      const resolvedModeValues = [];
      if (token.modeValues && Object.keys(token.modeValues).length) {
        for (const [modeName, modeValue] of Object.entries(token.modeValues)) {
          if (!modeValue) continue;
          resolvedModeValues.push([modeName, modeValue]);
        }
      } else if (token.value) {
        resolvedModeValues.push(["default", token.value]);
      } else {
        report.warnings.push(`Aucune valeur pour token: ${collection.name}/${token.name}`);
        continue;
      }
      for (const [modeName, tokenValue] of resolvedModeValues) {
        const modeId = (_e = (_d = (_c = modeMap[modeName]) != null ? _c : modeMap.default) != null ? _d : modeMap.light) != null ? _e : modeMap.dark;
        if (!modeId) {
          report.warnings.push(`Mode missing for ${collection.name}/${token.name} (${modeName})`);
          continue;
        }
        if (tokenValue.kind === "raw") {
          setRawValue(variable, modeId, token.type, tokenValue.value);
        } else {
          pendingAliases.push({
            variable,
            modeId,
            ref: tokenValue.ref,
            sourceCollectionId: collection.id,
            targetCollection: tokenValue.collection
          });
        }
      }
      addAliasEntry(aliasIndex, variable);
      processedTokens += 1;
      if (progress && processedTokens % 250 === 0) {
        progress(`\xC9criture des variables... ${processedTokens}/${tokens.length}`);
      }
    }
    const writePhaseMs = Date.now() - writePhaseStart;
    progress == null ? void 0 : progress("R\xE9solution des alias...");
    const aliasPhaseStart = Date.now();
    for (const pending of pendingAliases) {
      const target = resolveAlias(aliasIndex, pending.ref, pending.sourceCollectionId, pending.targetCollection);
      if (!target) {
        report.aliasMissing += 1;
        report.warnings.push(`Alias unresolved: ${pending.variable.name} -> ${pending.ref}`);
        continue;
      }
      pending.variable.setValueForMode(pending.modeId, makeAlias(target));
      report.aliasApplied += 1;
    }
    const aliasPhaseMs = Date.now() - aliasPhaseStart;
    const typographyPhaseStart = Date.now();
    if (options.createTextStyles) {
      await applyTypographyTextStyles(options, report, (_f = collectionsByName.get(COLLECTIONS.typography)) != null ? _f : null, variableIndex, progress);
    } else {
      report.migrations.push("Text styles skipped by user option.");
    }
    const typographyPhaseMs = Date.now() - typographyPhaseStart;
    const iconsPhaseStart = Date.now();
    await importIconLibraryStarterPack(
      options,
      report,
      preset,
      brands,
      shadeSteps,
      (_h = (_g = collectionsByName.get(COLLECTIONS.colorModes)) != null ? _g : colorModesCleanupCollection) != null ? _h : null,
      variableIndex,
      progress
    );
    const iconsPhaseMs = Date.now() - iconsPhaseStart;
    const totalMs = Date.now() - totalStart;
    report.migrations.push(
      `Timing(ms): tokens=${tokenPhaseMs}, write=${writePhaseMs}, alias=${aliasPhaseMs}, typography=${typographyPhaseMs}, icons=${iconsPhaseMs}, total=${totalMs}`
    );
    progress == null ? void 0 : progress("Finalisation...");
    return report;
  }
  function compactReportForUi(report) {
    const clampMessages = (items, label) => {
      const MAX_ITEMS = 120;
      if (!Array.isArray(items) || items.length <= MAX_ITEMS) return Array.isArray(items) ? items : [];
      const hidden = items.length - MAX_ITEMS;
      return [...items.slice(0, MAX_ITEMS), `... ${hidden} ${label} suppl\xE9mentaires`];
    };
    return __spreadProps(__spreadValues({}, report), {
      warnings: clampMessages(report.warnings, "warnings"),
      migrations: clampMessages(report.migrations, "migrations"),
      collections: Array.isArray(report.collections) ? report.collections.slice(0, 32) : []
    });
  }
  function normalizeIconLibraryId(input) {
    const value = String(input || "").trim().toLowerCase();
    if (value === "tabler" || value === "phosphor" || value === "iconoir") return value;
    return "lucide";
  }
  function normalizeIconStrokeId(input) {
    const value = String(input || "").trim().toLowerCase();
    if (value === "light" || value === "regular" || value === "bold") return value;
    return "medium";
  }
  function normalizeIconPackIds(input) {
    if (!Array.isArray(input)) return [];
    const valid = /* @__PURE__ */ new Set(["navigation", "actions", "status-feedback", "files-folders"]);
    return Array.from(
      new Set(
        input.map((entry) => String(entry || "").trim()).filter((entry) => valid.has(entry))
      )
    );
  }
  function resolveRequestedIconIds(library, includeStarterPack, packs) {
    const ordered = [];
    ordered.push(...STARTER_ICON_PACK);
    const requiredPacks = ["navigation", "actions", "status-feedback", "files-folders"];
    for (const packId of requiredPacks) {
      ordered.push(...ICON_PACK_DEFINITIONS[packId]);
    }
    const unique = Array.from(new Set(ordered));
    return unique.map((id) => ({
      id,
      sourceName: ICON_LIBRARY_NAME_MAP[library][id]
    })).filter((entry) => Boolean(entry.sourceName));
  }
  async function fetchIconSvg(library, sourceName) {
    const url = ICON_LIBRARY_CONFIG[library].buildUrl(sourceName);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Impossible de charger ${sourceName} (${library}) [${response.status}]`);
    }
    return await response.text();
  }
  function ensureIconsPage(report) {
    const existing = figma.root.children.find((node) => node.type === "PAGE" && node.name === ICONS_PAGE_NAME);
    if (existing) {
      return existing;
    }
    const legacy = figma.root.children.find((node) => node.type === "PAGE" && node.name === LEGACY_ICONS_PAGE_NAME);
    if (legacy) {
      legacy.name = ICONS_PAGE_NAME;
      report.migrations.push(`Page renomm\xE9e: ${LEGACY_ICONS_PAGE_NAME} -> ${ICONS_PAGE_NAME}`);
      return legacy;
    }
    const page = figma.createPage();
    page.name = ICONS_PAGE_NAME;
    report.migrations.push(`Page cr\xE9\xE9e: ${ICONS_PAGE_NAME}`);
    return page;
  }
  function centerNodeInComponent(component, node) {
    node.x = (component.width - node.width) / 2;
    node.y = (component.height - node.height) / 2;
  }
  function normalizeSvgIconMarkup(svg, size, strokeWidth, color) {
    const safeSize = Math.max(12, Math.min(64, Math.round(size || DEFAULT_ICON_SIZE)));
    const safeStroke = Math.max(1, Math.min(4, Number(strokeWidth) || ICON_STROKE_WIDTHS.medium));
    const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : "#171717";
    return String(svg || "").replace(/\bwidth="[^"]*"/i, `width="${safeSize}"`).replace(/\bheight="[^"]*"/i, `height="${safeSize}"`).replace(/\bstroke-width="[^"]*"/gi, `stroke-width="${safeStroke}"`).replace(/\bstroke="currentColor"/gi, `stroke="${safeColor}"`).replace(/\bfill="currentColor"/gi, `fill="${safeColor}"`);
  }
  function resolvePrimitiveColor(options, preset, brands, shadeSteps) {
    var _a, _b;
    const tokenName = resolveIconSemanticTokenName((_a = options.icons) == null ? void 0 : _a.colorAlias);
    const key = tokenName.startsWith("icon/") ? tokenName.slice("icon/".length) : "primary";
    const kigenRef = KIGEN_COLOR_MODES_TEMPLATE.icon[key] || KIGEN_COLOR_MODES_TEMPLATE.icon.primary;
    const neutralPalette = preset.palettes[options.neutralChoice] ? options.neutralChoice : preset.defaultNeutral;
    const primitiveRef = convertKigenReferenceToPluginRef(
      `icon/${key}`,
      ((_b = options.semanticOverrides) == null ? void 0 : _b[`icon/${key}`]) || kigenRef,
      options.uiMode === "dark" ? "dark" : "light",
      preset,
      neutralPalette,
      shadeSteps,
      brands.length > 0
    );
    const segments = primitiveRef.split("/").filter(Boolean);
    if (segments[0] !== "colors") return "#171717";
    if (segments[1] === "base") {
      if (segments[2] === "white") return options.baseWhite;
      if (segments[2] === "black") return options.baseBlack;
    }
    if (segments[1] === "brand") {
      const step = Number(segments[2] || 500);
      const brand = brands[0];
      return (brand == null ? void 0 : brand.scale[step]) || (brand == null ? void 0 : brand.baseColor) || DEFAULT_BASE_BLACK;
    }
    const palette = preset.palettes[segments[1]];
    const value = palette == null ? void 0 : palette[segments[2]];
    return value && /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_BASE_BLACK;
  }
  function resolveIconSemanticTokenName(input) {
    const value = String(input || DEFAULT_ICON_COLOR_ALIAS).trim().toLowerCase().replace(/^\{/, "").replace(/\}$/, "").replace(/\./g, "/").replace(/\/+/g, "/").replace(/^\//, "").replace(/\/$/, "");
    if (value.startsWith("semantic/icon/")) return value.slice("semantic/".length);
    if (value.startsWith("icon/")) return value;
    const key = value.split("/").filter(Boolean).pop() || "primary";
    return `icon/${key}`;
  }
  function resolveIconSemanticVariable(colorModesCollection, variableIndex, colorAlias) {
    const tokenName = resolveIconSemanticTokenName(colorAlias);
    if (!colorModesCollection) return { tokenName, variable: null };
    const direct = getVariableFromIndex(variableIndex, colorModesCollection.id, tokenName);
    if ((direct == null ? void 0 : direct.resolvedType) === "COLOR") return { tokenName, variable: direct };
    const lookup = normalizeLookup(tokenName);
    for (const variable of variableIndex.values()) {
      if (variable.variableCollectionId === colorModesCollection.id && variable.resolvedType === "COLOR" && normalizeLookup(variable.name) === lookup) {
        return { tokenName, variable };
      }
    }
    return { tokenName, variable: null };
  }
  function isSolidVisiblePaint(paint) {
    return paint.type === "SOLID" && paint.visible !== false;
  }
  function hasVisibleStrokePaints(paints) {
    return paints.some((paint) => paint.visible !== false);
  }
  function bindPaintsToIconVariable(paints, variable, fallbackColor) {
    if (paints === figma.mixed || !Array.isArray(paints) || paints.length === 0) {
      return { paints, bound: 0, failures: 0 };
    }
    let bound = 0;
    let failures = 0;
    const nextPaints = paints.map((paint) => {
      if (!isSolidVisiblePaint(paint)) return paint;
      const fallbackPaint = __spreadProps(__spreadValues({}, paint), {
        color: { r: fallbackColor.r, g: fallbackColor.g, b: fallbackColor.b },
        opacity: fallbackColor.a < 1 ? fallbackColor.a : paint.opacity
      });
      try {
        const boundPaint = figma.variables.setBoundVariableForPaint(fallbackPaint, "color", variable);
        bound += 1;
        return boundPaint;
      } catch (_error) {
        failures += 1;
        return fallbackPaint;
      }
    });
    return { paints: nextPaints, bound, failures };
  }
  function applyIconVariableBinding(node, variable, fallbackHex) {
    const fallbackColor = parseColorInput(fallbackHex);
    const stats = {
      nodesVisited: 0,
      fillPaintsBound: 0,
      strokePaintsBound: 0,
      bindFailures: 0
    };
    const visit = (current) => {
      stats.nodesVisited += 1;
      if ("fills" in current) {
        const result = bindPaintsToIconVariable(current.fills, variable, fallbackColor);
        if (result.paints !== current.fills) {
          current.fills = result.paints;
        }
        stats.fillPaintsBound += result.bound;
        stats.bindFailures += result.failures;
      }
      if ("strokes" in current) {
        const result = bindPaintsToIconVariable(current.strokes, variable, fallbackColor);
        if (result.paints !== figma.mixed) {
          current.strokes = result.paints;
        }
        stats.strokePaintsBound += result.bound;
        stats.bindFailures += result.failures;
      }
      if ("children" in current) {
        for (const child of current.children) {
          visit(child);
        }
      }
    };
    visit(node);
    return stats;
  }
  function applyIconStrokeWeight(node, strokeWidth) {
    const safeStroke = Math.max(1, Math.min(4, Number(strokeWidth) || ICON_STROKE_WIDTHS.medium));
    const stats = {
      nodesVisited: 0,
      nodesUpdated: 0,
      updateFailures: 0
    };
    const visit = (current) => {
      stats.nodesVisited += 1;
      if ("strokes" in current && "strokeWeight" in current && Array.isArray(current.strokes) && hasVisibleStrokePaints(current.strokes)) {
        try {
          current.strokeWeight = safeStroke;
          stats.nodesUpdated += 1;
        } catch (_error) {
          stats.updateFailures += 1;
        }
      }
      if ("children" in current) {
        for (const child of current.children) {
          visit(child);
        }
      }
    };
    visit(node);
    return stats;
  }
  function addIconBindingStats(total, current) {
    total.nodesVisited += current.nodesVisited;
    total.fillPaintsBound += current.fillPaintsBound;
    total.strokePaintsBound += current.strokePaintsBound;
    total.bindFailures += current.bindFailures;
  }
  function addIconStrokeWeightStats(total, current) {
    total.nodesVisited += current.nodesVisited;
    total.nodesUpdated += current.nodesUpdated;
    total.updateFailures += current.updateFailures;
  }
  function createIconComponentFromSvg(svg, componentName, size, strokeWidth, color, colorVariable) {
    const safeSize = Math.max(12, Math.min(64, Math.round(size || DEFAULT_ICON_SIZE)));
    const imported = figma.createNodeFromSvg(normalizeSvgIconMarkup(svg, safeSize, strokeWidth, color));
    const component = figma.createComponent();
    component.name = componentName;
    component.resizeWithoutConstraints(safeSize, safeSize);
    component.fills = [];
    component.strokes = [];
    component.clipsContent = false;
    if ("children" in imported && imported.type === "FRAME" && imported.children.length === 1) {
      const child = imported.children[0];
      component.appendChild(child);
      centerNodeInComponent(component, child);
      imported.remove();
    } else {
      component.appendChild(imported);
      centerNodeInComponent(component, imported);
    }
    const strokeWeightStats = applyIconStrokeWeight(component, strokeWidth);
    const bindingStats = colorVariable ? applyIconVariableBinding(component, colorVariable, color) : null;
    return { component, bindingStats, strokeWeightStats };
  }
  function cleanupGeneratedIcons(page) {
    const legacyFrame = page.children.find((node) => node.type === "FRAME" && node.name === "Imported icons");
    if (legacyFrame) {
      legacyFrame.remove();
    }
    const existingSet = page.children.find(
      (node) => node.type === "COMPONENT_SET" && node.name === ICON_COMPONENT_SET_NAME
    );
    if (existingSet) {
      existingSet.remove();
    }
    page.children.filter((node) => node.type === "COMPONENT" && /^Icon\s*\/\s*/.test(node.name)).forEach((component) => component.remove());
  }
  async function importIconLibraryStarterPack(options, report, preset, brands, shadeSteps, colorModesCollection, variableIndex, progress) {
    const iconOptions = options.icons;
    if (!iconOptions) return;
    const library = normalizeIconLibraryId(iconOptions.library);
    const packs = normalizeIconPackIds(iconOptions.packs);
    const requestedIcons = resolveRequestedIconIds(library, iconOptions.includeStarterPack !== false, packs);
    if (!requestedIcons.length) {
      report.migrations.push("Import d'ic\xF4nes ignor\xE9: aucun starter pack ou pack s\xE9lectionn\xE9.");
      return;
    }
    progress == null ? void 0 : progress(`Icons: import ${library}...`);
    const page = ensureIconsPage(report);
    cleanupGeneratedIcons(page);
    let importedCount = 0;
    const warningsBefore = report.warnings.length;
    const components = [];
    const columns = 8;
    const cell = 56;
    const originX = 64;
    const originY = 64;
    const iconSize = Number(iconOptions.size) || DEFAULT_ICON_SIZE;
    const stroke = normalizeIconStrokeId(iconOptions.stroke);
    const strokeWidth = ICON_STROKE_WIDTHS[stroke];
    const color = resolvePrimitiveColor(options, preset, brands, shadeSteps);
    const { tokenName: iconColorTokenName, variable: iconColorVariable } = resolveIconSemanticVariable(
      colorModesCollection,
      variableIndex,
      iconOptions.colorAlias
    );
    const bindingTotals = {
      nodesVisited: 0,
      fillPaintsBound: 0,
      strokePaintsBound: 0,
      bindFailures: 0
    };
    const strokeWeightTotals = {
      nodesVisited: 0,
      nodesUpdated: 0,
      updateFailures: 0
    };
    let iconsWithoutBindablePaints = 0;
    if (!iconColorVariable) {
      report.warnings.push(
        `Icon variable binding skipped: ${COLLECTIONS.colorModes}/${iconColorTokenName} introuvable. Fallback hex applique (${color}).`
      );
    }
    for (let index = 0; index < requestedIcons.length; index += 1) {
      const iconEntry = requestedIcons[index];
      try {
        const svg = await fetchIconSvg(library, iconEntry.sourceName);
        const { component, bindingStats, strokeWeightStats } = createIconComponentFromSvg(
          svg,
          `icon=${iconEntry.id}`,
          iconSize,
          strokeWidth,
          color,
          iconColorVariable
        );
        addIconStrokeWeightStats(strokeWeightTotals, strokeWeightStats);
        if (bindingStats) {
          addIconBindingStats(bindingTotals, bindingStats);
          if (bindingStats.fillPaintsBound + bindingStats.strokePaintsBound === 0) {
            iconsWithoutBindablePaints += 1;
          }
        }
        page.appendChild(component);
        const col = components.length % columns;
        const row = Math.floor(components.length / columns);
        component.x = originX + col * cell;
        component.y = originY + row * cell;
        components.push(component);
        importedCount += 1;
        if (progress && importedCount % 8 === 0) {
          progress(`Icons: ${importedCount}/${requestedIcons.length}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        report.warnings.push(`Icon import skipped (${iconEntry.id}/${library}): ${message}`);
      }
    }
    if (!components.length) {
      report.warnings.push(`Import d'ic\xF4nes ignor\xE9: aucune ic\xF4ne ${library} n'a pu \xEAtre import\xE9e.`);
      return;
    }
    let generatedNode;
    if (components.length === 1) {
      generatedNode = components[0];
      generatedNode.name = ICON_COMPONENT_SET_NAME;
    } else {
      const componentSet = figma.combineAsVariants(components, page);
      componentSet.name = ICON_COMPONENT_SET_NAME;
      generatedNode = componentSet;
    }
    generatedNode.x = originX;
    generatedNode.y = originY;
    report.migrations.push(`Ic\xF4nes import\xE9es (${library}): ${importedCount}/${requestedIcons.length}`);
    report.migrations.push(`Composant g\xE9n\xE9r\xE9: ${ICON_COMPONENT_SET_NAME} (${importedCount} variante${importedCount > 1 ? "s" : ""})`);
    report.migrations.push(`Icon strokeWeight applique (${stroke}=${strokeWidth}): ${strokeWeightTotals.nodesUpdated} node(s).`);
    if (strokeWeightTotals.updateFailures > 0) {
      report.warnings.push(`Icon strokeWeight: ${strokeWeightTotals.updateFailures} node(s) n'ont pas pu recevoir ${strokeWidth}.`);
    }
    if (iconColorVariable) {
      report.migrations.push(
        `Ic\xF4nes li\xE9es \xE0 ${COLLECTIONS.colorModes}/${iconColorTokenName}: ${bindingTotals.fillPaintsBound} fills, ${bindingTotals.strokePaintsBound} strokes.`
      );
      if (iconsWithoutBindablePaints > 0) {
        report.warnings.push(`Icon binding: ${iconsWithoutBindablePaints} ic\xF4ne(s) sans fill/stroke SOLID bindable.`);
      }
      if (bindingTotals.bindFailures > 0) {
        report.warnings.push(`Icon binding: ${bindingTotals.bindFailures} paint(s) n'ont pas pu \xEAtre li\xE9s \xE0 ${iconColorTokenName}.`);
      }
    }
    if (report.warnings.length > warningsBefore) {
      report.migrations.push(`Import d'ic\xF4nes avec warnings: ${report.warnings.length - warningsBefore}`);
    }
  }
  function postPresetList() {
    figma.ui.postMessage({
      type: "preset-list",
      presets: getPresetSummaries()
    });
  }
  function sanitizeFontFamilyLabel(input) {
    return String(input != null ? input : "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  }
  async function postFontFamiliesList() {
    try {
      const fonts = await withTimeout(figma.listAvailableFontsAsync(), 1e4, "listAvailableFontsAsync(ui-ready)");
      const families = Array.from(
        new Set(
          fonts.map((font) => sanitizeFontFamilyLabel(font.fontName.family)).filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, void 0, { sensitivity: "base" }));
      figma.ui.postMessage({
        type: "font-families-list",
        families
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[ombrstudio] Unable to load font families list: ${message}`);
      figma.ui.postMessage({
        type: "font-families-list",
        families: []
      });
    }
  }
  figma.ui.onmessage = async (msg) => {
    const payload = msg;
    try {
      if (payload.type === "ui-ready") {
        postPresetList();
        await postFontFamiliesList();
        return;
      }
      if (payload.type === "generate-variables") {
        if (isGenerationRunning) {
          figma.ui.postMessage({
            type: "generate-error",
            message: "Une g\xE9n\xE9ration est d\xE9j\xE0 en cours. Attends la fin avant de relancer."
          });
          return;
        }
        isGenerationRunning = true;
        const sendProgress = (message) => {
          figma.ui.postMessage({ type: "generate-progress", message });
        };
        try {
          sendProgress("Validation de la demande...");
          const options = buildGenerationOptions(payload.payload);
          sendProgress("G\xE9n\xE9ration des variables...");
          const report = await applyGeneration(options, sendProgress);
          figma.notify(
            `ombrstudio: +${report.created} / ~${report.updated} / collisions ${report.collisionsReplaced}` + (report.aliasMissing ? ` / alias manquants ${report.aliasMissing}` : "")
          );
          figma.ui.postMessage({
            type: "generate-result",
            report: compactReportForUi(report)
          });
        } finally {
          isGenerationRunning = false;
        }
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      figma.notify(`Erreur: ${message}`, { error: true });
      figma.ui.postMessage({
        type: "generate-error",
        message
      });
    }
  };
})();
