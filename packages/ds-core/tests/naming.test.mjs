import assert from "node:assert/strict";

import { normalizePaletteKey, normalizeTokenName, sanitizeKebabSegment } from "../src/index.js";

assert.equal(normalizePaletteKey("Brand Primary"), "brand-primary", "normalizePaletteKey lowercases uppercase input");
assert.equal(normalizePaletteKey(""), "", "normalizePaletteKey keeps empty values empty");
assert.equal(normalizePaletteKey("   "), "", "normalizePaletteKey keeps whitespace-only input empty");
assert.equal(normalizePaletteKey("!!!"), "", "normalizePaletteKey keeps punctuation-only input empty");
assert.equal(normalizePaletteKey("\u2605\u2605\u2605"), "", "normalizePaletteKey keeps non-alphanumeric-only input empty");

assert.equal(normalizePaletteKey("\u00e9\u00e8\u00e0"), "", "normalizePaletteKey strips unicode-only accent input to empty");
assert.equal(sanitizeKebabSegment("\u00e9\u00e8\u00e0", ""), "eea", "sanitizeKebabSegment removes accents before kebab conversion");

assert.equal(normalizePaletteKey("brand.primary/test_name"), "brand-primary-test-name", "normalizePaletteKey flattens dot slash and underscore separators");
assert.equal(normalizePaletteKey("brand primary"), "brand-primary", "normalizePaletteKey flattens spaces");
assert.equal(normalizePaletteKey("brand---primary"), "brand-primary", "normalizePaletteKey collapses repeated hyphens through separator replacement");
assert.equal(normalizePaletteKey("brand___primary"), "brand-primary", "normalizePaletteKey collapses repeated underscores through separator replacement");
assert.equal(normalizePaletteKey("brand...primary"), "brand-primary", "normalizePaletteKey collapses repeated dots through separator replacement");

assert.equal(normalizePaletteKey("123"), "123", "normalizePaletteKey preserves numeric input strings");
assert.equal(normalizePaletteKey("brand-123"), "brand-123", "normalizePaletteKey preserves mixed alpha numeric hyphenated strings");
assert.equal(normalizePaletteKey("Brand 2 Primary 500"), "brand-2-primary-500", "normalizePaletteKey preserves mixed numeric alphabetic content");

assert.equal(normalizePaletteKey("Brand Primary"), "brand-primary", "normalizePaletteKey collision case: spaced words");
assert.equal(normalizePaletteKey("brand_primary"), "brand-primary", "normalizePaletteKey collision case: underscore");
assert.equal(normalizePaletteKey("brand-primary"), "brand-primary", "normalizePaletteKey collision case: existing kebab");

assert.equal(
  normalizePaletteKey("brand.primary/test_name"),
  sanitizeKebabSegment("brand.primary/test_name", ""),
  "normalizePaletteKey and sanitizeKebabSegment match for representative ASCII palette keys",
);
assert.equal(sanitizeKebabSegment("", "fallback-name"), "fallback-name", "sanitizeKebabSegment applies a fallback for empty input");
assert.equal(normalizeTokenName("brand.primary/test_name"), "brand/primary/test-name", "normalizeTokenName preserves slash-case path structure");
assert.notEqual(
  normalizePaletteKey("brand.primary/test_name"),
  normalizeTokenName("brand.primary/test_name"),
  "normalizePaletteKey flattens paths while normalizeTokenName preserves them",
);

console.log("ds-core naming tests passed.");
