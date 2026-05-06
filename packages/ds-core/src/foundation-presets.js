function rawToken(name, type, value) {
  return Object.freeze({
    name,
    type,
    values: Object.freeze({
      light: value,
      dark: value,
    }),
  });
}

function aliasToken(name, alias) {
  return Object.freeze({
    name,
    type: "FLOAT",
    values: Object.freeze({
      light: Object.freeze({ alias }),
      dark: Object.freeze({ alias }),
    }),
  });
}

const CANONICAL_PIXEL_TOKENS = Object.freeze([
  rawToken("pixel/0", "FLOAT", 0),
  rawToken("pixel/2", "FLOAT", 2),
  rawToken("pixel/4", "FLOAT", 4),
  rawToken("pixel/6", "FLOAT", 6),
  rawToken("pixel/8", "FLOAT", 8),
  rawToken("pixel/10", "FLOAT", 10),
  rawToken("pixel/12", "FLOAT", 12),
  rawToken("pixel/16", "FLOAT", 16),
  rawToken("pixel/20", "FLOAT", 20),
  rawToken("pixel/24", "FLOAT", 24),
  rawToken("pixel/32", "FLOAT", 32),
  rawToken("pixel/40", "FLOAT", 40),
  rawToken("pixel/48", "FLOAT", 48),
  rawToken("pixel/64", "FLOAT", 64),
  rawToken("pixel/80", "FLOAT", 80),
  rawToken("pixel/96", "FLOAT", 96),
  rawToken("pixel/128", "FLOAT", 128),
  rawToken("pixel/160", "FLOAT", 160),
  rawToken("pixel/full", "FLOAT", 9999),
]);

const CANONICAL_SPACING_TOKENS = Object.freeze([
  aliasToken("spacing/none", "primitives/pixel/0"),
  aliasToken("spacing/xxs", "primitives/pixel/2"),
  aliasToken("spacing/xs", "primitives/pixel/4"),
  aliasToken("spacing/sm", "primitives/pixel/6"),
  aliasToken("spacing/md", "primitives/pixel/8"),
  aliasToken("spacing/lg", "primitives/pixel/12"),
  aliasToken("spacing/xl", "primitives/pixel/16"),
  aliasToken("spacing/2xl", "primitives/pixel/20"),
  aliasToken("spacing/3xl", "primitives/pixel/24"),
  aliasToken("spacing/4xl", "primitives/pixel/32"),
  aliasToken("spacing/5xl", "primitives/pixel/40"),
  aliasToken("spacing/6xl", "primitives/pixel/48"),
  aliasToken("spacing/7xl", "primitives/pixel/64"),
  aliasToken("spacing/8xl", "primitives/pixel/80"),
  aliasToken("spacing/9xl", "primitives/pixel/96"),
  aliasToken("spacing/10xl", "primitives/pixel/128"),
  aliasToken("spacing/11xl", "primitives/pixel/160"),
]);

const CANONICAL_RADIUS_TOKENS = Object.freeze([
  aliasToken("radius/none", "primitives/pixel/0"),
  aliasToken("radius/xxs", "primitives/pixel/2"),
  aliasToken("radius/xs", "primitives/pixel/4"),
  aliasToken("radius/sm", "primitives/pixel/6"),
  aliasToken("radius/md", "primitives/pixel/8"),
  aliasToken("radius/lg", "primitives/pixel/10"),
  aliasToken("radius/xl", "primitives/pixel/12"),
  aliasToken("radius/2xl", "primitives/pixel/16"),
  aliasToken("radius/3xl", "primitives/pixel/20"),
  aliasToken("radius/4xl", "primitives/pixel/24"),
  aliasToken("radius/full", "primitives/pixel/full"),
]);

const TYPOGRAPHY_SIZE_KEYS = Object.freeze([
  "label",
  "text-xs",
  "text-sm",
  "text-md",
  "text-lg",
  "text-xl",
  "display-xs",
  "display-sm",
  "display-md",
  "display-lg",
  "display-xl",
  "display-2xl",
]);

const FONT_SIZE_VALUES = Object.freeze({
  label: 10,
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
  "display-2xl": 72,
});

const LINE_HEIGHT_VALUES = Object.freeze({
  label: 14,
  "text-xs": 16,
  "text-sm": 20,
  "text-md": 24,
  "text-lg": 28,
  "text-xl": 30,
  "display-xs": 32,
  "display-sm": 38,
  "display-md": 44,
  "display-lg": 60,
  "display-xl": 72,
  "display-2xl": 88,
});

const FONT_WEIGHT_VALUES = Object.freeze({
  regular: "Regular",
  "regular-italic": "Regular italic",
  medium: "Medium",
  "medium-italic": "Medium italic",
  semibold: "Semibold",
  "semibold-italic": "Semibold italic",
  bold: "Bold",
  "bold-italic": "Bold italic",
});

const CANONICAL_TYPOGRAPHY_TOKENS = Object.freeze([
  rawToken("font-family/display", "STRING", "Roboto"),
  rawToken("font-family/body", "STRING", "Inter"),
  ...TYPOGRAPHY_SIZE_KEYS.map((key) => rawToken(`font-size/${key}`, "FLOAT", FONT_SIZE_VALUES[key])),
  ...TYPOGRAPHY_SIZE_KEYS.map((key) => rawToken(`line-height/${key}`, "FLOAT", LINE_HEIGHT_VALUES[key])),
  ...TYPOGRAPHY_SIZE_KEYS.map((key) => rawToken(`letter-spacing/${key}`, "FLOAT", 0)),
  ...Object.entries(FONT_WEIGHT_VALUES).map(([key, value]) => rawToken(`font-weight/${key}`, "STRING", value)),
]);

export {
  CANONICAL_PIXEL_TOKENS,
  CANONICAL_RADIUS_TOKENS,
  CANONICAL_SPACING_TOKENS,
  CANONICAL_TYPOGRAPHY_TOKENS,
};
