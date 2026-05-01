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
      a: clean.length === 4 ? pairToByte(clean[3]) / 255 : 1,
    };
  }

  return {
    r: pairToByte(clean.slice(0, 2)) / 255,
    g: pairToByte(clean.slice(2, 4)) / 255,
    b: pairToByte(clean.slice(4, 6)) / 255,
    a: clean.length === 8 ? pairToByte(clean.slice(6, 8)) / 255 : 1,
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
  const alpha = alphaInput
    ? alphaInput.endsWith("%")
      ? clamp01(Number(alphaInput.slice(0, -1)) / 100)
      : clamp01(Number(alphaInput))
    : 1;

  return {
    r: parseChannel(parts[0]),
    g: parseChannel(parts[1]),
    b: parseChannel(parts[2]),
    a: alpha,
  };
}

function toHexChannel(value) {
  return Math.round(clamp01(value) * 255)
    .toString(16)
    .padStart(2, "0");
}

function parseColorInput(value) {
  const text = value.trim();
  if (text.startsWith("#")) return parseHex(text);
  if (/^rgba?\(/i.test(text)) return parseRgb(text);
  throw new Error(`Unsupported color format: ${value}`);
}

function sanitizeKebabSegment(input, fallback = "brand") {
  const source = String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  const sanitized = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
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

export {
  colorWithAlpha,
  parseColorInput,
  rgbaToHex,
  sanitizeKebabSegment,
};
