# Pure Logic Extraction Inventory - Phase 1

Objective: prepare future extraction work without moving code yet.

This inventory separates pure product logic from Figma/plugin runtime behavior. It follows the current roadmap direction: reinforce `ds-core` first, extract pure utilities/generators later, and keep Figma API work out of `ds-core`.

Sources reviewed:

- `packages/plugin-starter-tokens/src/presets/color-utils.ts`
- `packages/plugin-starter-tokens/src/presets/types.ts`
- `packages/plugin-starter-tokens/src/code.ts`
- `docs/technical/migration-roadmap.md`
- `docs/technical/token-bundle-source-of-truth.md`

## 1. Color Utilities

| Current file | Function/type name | Pure or mixed | Target future package | Extraction priority | Risks | Tests needed before extraction |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/plugin-starter-tokens/src/presets/color-utils.ts` | `RGBA`, internal `HSL`, `OKLab`, `OKLCH` | Pure | `ds-core` | High | Type names may diverge from future TokenBundle color value contracts. | Type compatibility tests for serialized color values and parsed color objects. |
| `packages/plugin-starter-tokens/src/presets/color-utils.ts` | `parseColorInput`, `parseHex`, `parseRgb`, `pairToByte`, `clamp01` | Pure | `ds-core` | High | Existing behavior accepts only HEX and comma-separated `rgb()/rgba()`; extraction could accidentally broaden or narrow accepted payloads. | Unit tests for `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, percentages, whitespace, invalid values, alpha clamping. |
| `packages/plugin-starter-tokens/src/presets/color-utils.ts` | `rgbaToHex`, `toHexChannel` | Pure | `ds-core` | Medium | Rounding behavior must remain stable because generated palette snapshots may change. | Unit tests for rounding, clamp behavior, black/white, mid-channel values, alpha ignored. |
| `packages/plugin-starter-tokens/src/presets/color-utils.ts` | `colorWithAlpha` | Pure | `ds-core` | Medium | String formatting is currently an output contract for opacity tokens; changing spaces or alpha rounding may churn generated values. | Unit tests for HEX/RGB inputs, alpha percentages below/above range, exact `rgba(r, g, b, a)` string output. |
| `packages/plugin-starter-tokens/src/presets/color-utils.ts` | `sanitizeKebabSegment` | Pure | `ds-core` | Medium | Also useful for UI/plugin naming, but product-neutral enough for canonical token names; Unicode normalization behavior must be preserved. | Unit tests for accents, punctuation, repeated separators, empty fallback, numeric segments. |
| `packages/plugin-starter-tokens/src/presets/color-utils.ts` | `rgbToHsl`, `hslToRgb`, `srgbToLinear`, `linearToSrgb`, `rgbToOkLab`, `okLabToRgb`, `okLabToOklch`, `oklchToOkLab`, `isInGamut`, `oklchToGamutRgb` | Pure | `ds-core` | Medium | Internal color math can cause broad palette diffs from tiny numeric changes. | Golden tests for known conversions and generated palette fixtures rather than relying only on approximate unit tests. |

## 2. Palette Generation

| Current file | Function/type name | Pure or mixed | Target future package | Extraction priority | Risks | Tests needed before extraction |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/plugin-starter-tokens/src/presets/color-utils.ts` | `buildBrandScale` | Pure | `ds-core` | High | Main reusable palette generator; fallback from OKLCH to HSL must stay behaviorally identical. | Fixture tests for default brand, low saturation, high saturation, invalid base step, non-500 base step, custom step arrays. |
| `packages/plugin-starter-tokens/src/presets/color-utils.ts` | `buildBrandScaleWithOklch`, `buildBrandScaleWithHsl` | Pure | `ds-core` | High | These are private today; extraction may expose implementation details too early. | Snapshot tests through public `buildBrandScale`; optional internal tests only if exported for testing. |
| `packages/plugin-starter-tokens/src/presets/color-utils.ts` | `LIGHT_RATIO`, `DARK_RATIO`, `ratioForStep`, `ratioForDynamicStep`, `ensureMonotone` | Pure | `ds-core` | Medium | Constants encode current visual taste; changing them changes every generated brand scale. | Golden scale fixtures across Tailwind and hundreds naming patterns. |
| `packages/plugin-starter-tokens/src/code.ts` | `basePatternSteps`, `pickSubset`, `nextShadeStep`, `extendSteps`, `deriveShadeSteps`, `resolveBaseStep`, `closestStep` | Pure | `ds-core` | High | Currently returns plugin generation step arrays; future core API needs explicit naming and bounds. | Unit tests for `tailwind` vs `hundreds`, min/max shade count clamping, inclusion of 500 where possible, extended counts. |
| `packages/plugin-starter-tokens/src/code.ts` | `extractCustomBrandScale` | Pure | `ds-core` | Medium | Requires a complete custom scale today; partial-scale behavior may be desirable later but must not change silently. | Unit tests for complete scale, partial scale fallback, invalid color skipping, numeric/string step keys. |
| `packages/plugin-starter-tokens/src/code.ts` | `sanitizePrimaryName`, `normalizeBrands`, `NormalizedBrand` | Mixed | `ds-core` | Medium | Pure calculation, but output shape is plugin-local and naming is tied to current primitive token aliases. | Tests for reserved preset palette names, empty primary brand, additional brands, custom scale precedence, generated brand alias compatibility. |

## 3. Preset Lookup

| Current file | Function/type name | Pure or mixed | Target future package | Extraction priority | Risks | Tests needed before extraction |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/plugin-starter-tokens/src/presets/types.ts` | `PresetDefinition`, `PresetSummary`, `PresetPalettePreview` | Pure | `ds-core` | High | Duplicate product types are already called out as a TokenBundle risk. | Type-level tests or fixture validation proving builtin presets serialize cleanly through `ds-core`. |
| `packages/plugin-starter-tokens/src/code.ts` | `normalizePaletteKey` | Pure | `ds-core` | High | Used by payload normalization and primitive generation; name normalization must match future canonical token naming. | Unit tests for case, spaces, punctuation, empty strings, duplicate-normalized palette names. |
| `packages/plugin-starter-tokens/src/code.ts` | `parsePresetNumericStep`, `sortPresetSteps`, `fallbackPresetSteps`, `getPaletteSteps`, `resolveClosestPaletteStep`, `normalizePresetSteps`, `closestPresetStep` | Pure | `ds-core` | High | Presets may contain numeric and non-numeric steps; sort/fallback rules affect primitive and semantic output. | Unit tests for numeric, non-numeric, mixed steps, case-insensitive matches, missing palettes, fallback to 500 or first step. |
| `packages/plugin-starter-tokens/src/code.ts` | `resolvePaletteFromCandidates`, `resolvePaletteWithSynonyms`, `resolveIntentPalette`, `PALETTE_SYNONYMS`, `INTENT_PALETTE_CANDIDATES` | Pure | `ds-core` | Medium | Product-neutral if semantic templates move to core; otherwise it can pull current Kigen-specific assumptions into core too early. | Tests for fallback palette selection, synonym order, missing intent palettes, first-palette fallback. |
| `packages/plugin-starter-tokens/src/code.ts` | `getPresetById`, `getPresetSummaries` imported from `./presets/builtin` | Pure | `ds-core` | Medium | Actual implementations are outside the requested inventory source files, but the call sites show product-level preset lookup. | Preset registry tests for stable IDs, summaries, default preset, palette counts, neutral defaults. |

## 4. Token Generation

| Current file | Function/type name | Pure or mixed | Target future package | Extraction priority | Risks | Tests needed before extraction |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/plugin-starter-tokens/src/presets/types.ts` | `TokenBundle`, `TokenBundleEntry`, `TokenCollection`, `TokenMode`, `TokenVariableType`, `TokenModeValue` | Pure | `ds-core` | High | These overlap directly with the central TokenBundle contract. | Type and serialization tests for primitives, semantic entries, aliases, light/dark values, unknown metadata. |
| `packages/plugin-starter-tokens/src/code.ts` | `TokenDefinition`, `RuntimeTokenValue`, `RawTokenValue`, `RuntimeModeName`, `CollectionName`, `VariableType` | Mixed | `figma-adapter` | Medium | These are serialization-safe-ish, but collection names and scopes are Figma/plugin runtime concepts. | Adapter tests mapping TokenBundle entries to Figma variable write plans without calling `figma`. |
| `packages/plugin-starter-tokens/src/code.ts` | `raw`, `alias`, `createToken`, `createModeToken` | Mixed | `figma-adapter` | Medium | Helpers are pure but return plugin-local write models, not canonical TokenBundle data. | Unit tests for generated write-plan shape, raw vs alias values, default vs light/dark modes. |
| `packages/plugin-starter-tokens/src/code.ts` | `buildPrimitiveTokens` | Mixed | `ds-core` first, then `figma-adapter` mapping | High | Contains product-level primitive token generation but emits plugin-specific `TokenDefinition` with Figma scopes and collection names. | Fixture tests for primitive TokenBundle output: base colors, preset palettes, selected palettes, neutral gray aliases, brand aliases, pixel values, opacity values. |
| `packages/plugin-starter-tokens/src/code.ts` | `buildColorModeTokensFromBundle`, `mapBundleAlias`, `bundleValueToRuntimeTokenValue`, `toVariableType`, `sanitizeBundleScopes` | Mixed | `figma-adapter` | Medium | Converts canonical TokenBundle data into current Figma collection names and scopes; should not become `ds-core`. | Adapter tests for primitive, semantic, and component alias paths; invalid alias collection errors; scope sanitization fallback. |
| `packages/plugin-starter-tokens/src/code.ts` | `buildGenerationOptions` | Mixed | Keep in plugin | Low | This is UI payload normalization plus defaults, icon settings, preset lookup, and TokenBundle validation. Moving it risks coupling app-specific input state to core. | Payload normalization tests in plugin before any split; later separate core input normalizers from plugin UI defaults. |

## 5. Typography Generation

| Current file | Function/type name | Pure or mixed | Target future package | Extraction priority | Risks | Tests needed before extraction |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/plugin-starter-tokens/src/code.ts` | `TYPOGRAPHY_FAMILY_VARIABLES`, `DEFAULT_FONT_SIZES`, `DEFAULT_LINE_HEIGHTS`, `DEFAULT_LETTER_SPACINGS`, `DEFAULT_FONT_WEIGHT_STYLES`, `FONT_SIZE_ORDER` | Pure | `ds-core` | High | Defaults come from generated typography reference and define product output. | Fixture tests for default typography token names and values. |
| `packages/plugin-starter-tokens/src/code.ts` | `orderedTypographySizeKeys`, `resolveTypographyLineHeights`, `roundTo` | Pure | `ds-core` | High | Line-height derivation can change many generated variables; `roundTo` is shared by text style application too. | Unit tests for known key order, extra key sorting, ratio preservation, precision behavior. |
| `packages/plugin-starter-tokens/src/code.ts` | `buildTypographyTokens` | Mixed | `ds-core` first, then `figma-adapter` mapping | High | Emits plugin `TokenDefinition` and Figma scopes, but the typography foundation values belong in core. | Fixture tests for font family, font size, line height, letter spacing, font weight tokens; override behavior; invalid numeric skip behavior. |
| `packages/plugin-starter-tokens/src/presets/types.ts` | `GenerationOptions.typography` | Mixed | `ds-core` for product settings, keep plugin-only style binding inputs in plugin | Medium | `styleFamilies` and `styleWeights` support Figma text style generation, not pure token data. | Type tests separating pure typography token inputs from plugin text-style binding options. |
| `packages/plugin-starter-tokens/src/code.ts` | `normalizeFontLookup`, `preferredStyleCandidates`, `resolveFamilyName`, `resolveFontStyle`, `resolveTemplateFontSize`, `resolveTemplateLineHeight`, `resolveTemplateLetterSpacing`, `resolveTextCase`, `resolveTextDecoration` | Mixed | Keep in plugin or future `figma-adapter` | Low | These support Figma text style creation and font availability matching, not core TokenBundle generation. | Text-style adapter tests with mocked font catalogs; no `ds-core` extraction until Figma style behavior is isolated. |

## 6. Spacing Generation

| Current file | Function/type name | Pure or mixed | Target future package | Extraction priority | Risks | Tests needed before extraction |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/plugin-starter-tokens/src/code.ts` | `PIXEL_VALUES` | Pure | `ds-core` | High | Shared primitive foundation for spacing and radius aliases; changing values breaks token output. | Fixture tests for generated `pixel/*` primitive values, including `pixel/full`. |
| `packages/plugin-starter-tokens/src/code.ts` | `SPACING_ALIAS_MAP` | Pure | `ds-core` | High | Alias names and pixel refs are product-level foundation decisions. | Unit tests for every spacing alias and referenced pixel token. |
| `packages/plugin-starter-tokens/src/code.ts` | `buildSpacingTokens` | Mixed | `ds-core` first, then `figma-adapter` mapping | High | Pure deterministic generation but emits plugin `TokenDefinition` and Figma scopes. | Fixture tests for spacing TokenBundle entries and adapter tests for Figma scopes. |

## 7. Radius Generation

| Current file | Function/type name | Pure or mixed | Target future package | Extraction priority | Risks | Tests needed before extraction |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/plugin-starter-tokens/src/code.ts` | `RADIUS_ALIAS_MAP` | Pure | `ds-core` | High | Alias values define product foundation scale; `radius-full` depends on `pixel/full`. | Unit tests for every radius alias and referenced pixel token. |
| `packages/plugin-starter-tokens/src/code.ts` | `buildRadiusTokens` | Mixed | `ds-core` first, then `figma-adapter` mapping | High | Pure deterministic generation but emits plugin `TokenDefinition` and Figma scopes. | Fixture tests for radius TokenBundle entries and adapter tests for Figma corner-radius scopes. |

## 8. Semantic Token Generation

| Current file | Function/type name | Pure or mixed | Target future package | Extraction priority | Risks | Tests needed before extraction |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/plugin-starter-tokens/src/code.ts` | `ColorModesIntent`, `ColorModesFamily`, `ColorModesTemplate`, `COLOR_MODE_FAMILIES`, `KIGEN_COLOR_MODES_TEMPLATE`, `LEGACY_COLOR_MODE_ALIASES` | Pure | `ds-core` | Medium | Template is product logic, but it encodes current Kigen naming and legacy compatibility. Moving too early may freeze unstable semantic naming. | Snapshot tests for generated semantic token names, alias references, and legacy aliases. |
| `packages/plugin-starter-tokens/src/code.ts` | `parseKigenReference`, `extractIntentFromTokenName`, `isAccentToken`, `resolveOpacityStepFromAlphaKey`, `colorModeFamilyFromTokenName` | Pure | `ds-core` | Medium | Helpers are tied to current semantic template syntax; should move only with the template. | Unit tests for alpha refs, b&w refs, intent extraction, accent detection, family detection. |
| `packages/plugin-starter-tokens/src/code.ts` | `remapStepForBrand`, `remapNeutralStepForDark`, `remapIntentStepForDark`, `resolveDarkStepForPalette`, `resolveDarkNeutralStep`, `resolvePrimitivePaletteStep`, `remapNeutralStepForDarkFallback`, `applyDarkModeTransformForReference` | Pure | `ds-core` | Medium | Dark-mode mapping can change generated semantics substantially; needs fixtures before extraction. | Light/dark semantic fixture tests across neutral palettes, brand accents, intent palettes, alpha tokens, base black/white behavior. |
| `packages/plugin-starter-tokens/src/code.ts` | `convertKigenReferenceToPluginRef`, `generateColorModesTokens`, `compareColorModesStructure` | Pure | `ds-core` | Medium | Function names and return references are plugin-oriented (`PluginRef`); core should expose canonical alias references. | Tests for reference conversion with selected neutral palette, missing palettes, synonyms, custom brand behavior, overrides. |
| `packages/plugin-starter-tokens/src/code.ts` | `buildColorModeTokens` | Mixed | `ds-core` first, then `figma-adapter` mapping | Medium | Pure semantic generation is wrapped in plugin `TokenDefinition`, Figma scopes, and runtime collection names. | Fixture tests for both single-mode and light/dark TokenBundle semantic entries; adapter tests for current Figma variable write plan. |
| `packages/plugin-starter-tokens/src/code.ts` | `semanticScopes` | Mixed | `figma-adapter` | Low | Scope assignment is Figma variable behavior, not core token data. | Adapter tests for text/bg/border/icon/alpha scopes and fallback scope. |

## 9. Payload Normalization

| Current file | Function/type name | Pure or mixed | Target future package | Extraction priority | Risks | Tests needed before extraction |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/plugin-starter-tokens/src/presets/types.ts` | `GenerationOptions`, `BrandColorInput`, `TokenLevel`, `UiMode`, `NamingPattern` | Mixed | Split between `ds-core` and keep in plugin | Medium | Some fields are product token inputs; others are plugin UI/runtime settings such as `createTextStyles` and `icons`. | Type split tests proving pure generation inputs can serialize without plugin-only runtime fields. |
| `packages/plugin-starter-tokens/src/code.ts` | `normalizeTokenLevel`, `normalizeUiMode`, `normalizeNamingPattern`, `clampNumber` | Pure | `ds-core` | Medium | Useful for product defaults, but current fallback choices may be UI-specific. | Unit tests for valid values, invalid fallbacks, shade count bounds. |
| `packages/plugin-starter-tokens/src/code.ts` | `normalizeTokenBundleInput` | Mixed | Keep validation in `ds-core`; keep plugin payload error handling in plugin | Medium | Already delegates to `ds-core`; extraction should avoid wrapping core validation in plugin-language errors. | Tests for valid TokenBundle normalization, invalid error propagation, plugin message behavior. |
| `packages/plugin-starter-tokens/src/code.ts` | `normalizeSemanticOverridesInput` | Pure | `ds-core` | Medium | Overrides currently require brace-wrapped references and lower-case token names; future UI may need richer validation feedback. | Unit tests for accepted references, rejected malformed values, trimming, lower-casing, empty entries. |
| `packages/plugin-starter-tokens/src/code.ts` | `buildGenerationOptions` | Mixed | Keep in plugin | Low | It reads UI payloads, applies plugin defaults, validates colors, resolves presets, normalizes icons, and includes text-style settings. | Plugin-level payload tests before refactor; later smaller tests for extracted pure normalizers. |
| `packages/plugin-starter-tokens/src/code.ts` | `normalizeIconLibraryId`, `normalizeIconStrokeId`, `normalizeIconPackIds`, `resolveIconSemanticTokenName` | Mixed | Keep in plugin | Low | Icon import is plugin/runtime behavior and should not block `ds-core` foundations. | Plugin icon payload tests with default library, pack filtering, size/stroke/color alias fallbacks. |

## 10. Figma-Specific Logic That Must NOT Be Extracted To Ds-Core

| Current file | Function/type name | Pure or mixed | Target future package | Extraction priority | Risks | Tests needed before extraction |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/plugin-starter-tokens/src/code.ts` | `figma.showUI`, `figma.ui.onmessage`, `postPresetList`, `postFontFamiliesList`, `compactReportForUi` | Mixed | Keep in plugin | Low | UI messaging and notification behavior are plugin entrypoint concerns. | Plugin/controller tests or manual smoke tests; no `ds-core` tests. |
| `packages/plugin-starter-tokens/src/code.ts` | `buildModeMap`, `findCollectionByNames`, `resolveCollection`, `ensureCollectionModes`, `removeDeprecatedVariablesByPrefix` | Mixed | `figma-adapter` | Medium | These call or mutate Figma variable collections and modes. | Adapter tests with mocked Figma collections; plugin smoke test after integration. |
| `packages/plugin-starter-tokens/src/code.ts` | `addAliasEntry`, `aliasCandidates`, `normalizeLookup`, `normalizeCollectionLookup`, `resolveAlias`, `makeAlias`, `PendingAlias`, `AliasIndex` | Mixed | `figma-adapter` | Medium | Alias lookup normalization is pure, but it indexes Figma variables and creates Figma aliases. | Adapter tests for slash/dot/braced references, collection-local lookup, global fallback, unresolved aliases. |
| `packages/plugin-starter-tokens/src/code.ts` | `getCollectionReport`, `upsertVariable`, `setRawValue`, `sanitizeScopes` | Mixed | `figma-adapter` | Medium | These mutate Figma variables or use Figma `VariableScope`/`Variable` types. | Mocked adapter tests for create/update/type conflicts, scope sanitization, raw COLOR/FLOAT/STRING writes. |
| `packages/plugin-starter-tokens/src/code.ts` | `applyGeneration` | Mixed | Keep orchestration in plugin; move write mapping later to `figma-adapter` | Medium | Main orchestration combines pure generation, Figma writes, alias resolution, text styles, icons, progress, and reports. | Integration tests around generation report shape plus mocked adapter tests before any decomposition. |
| `packages/plugin-starter-tokens/src/code.ts` | `withTimeout`, `ensureFontLoaded`, `buildFontCatalog`, `applyTypographyTextStyles`, `tryBindTextStyleVariable`, `upsertTextStyleByName`, `variableIndexKey`, `getVariableFromIndex` | Mixed | Keep in plugin or future `figma-adapter` | Low | Text styles require Figma font APIs and local style mutation. | Mocked Figma text-style tests and manual Figma smoke test. |
| `packages/plugin-starter-tokens/src/code.ts` | `fetchIconSvg`, `ensureIconsPage`, `centerNodeInComponent`, `normalizeSvgIconMarkup`, `resolvePrimitiveColor`, `resolveIconSemanticVariable`, `isSolidVisiblePaint`, `hasVisibleStrokePaints`, `bindPaintsToIconVariable`, `applyIconVariableBinding`, `applyIconStrokeWeight`, `addIconBindingStats`, `addIconStrokeWeightStats`, `createIconComponentFromSvg`, `cleanupGeneratedIcons`, `importIconLibraryStarterPack` | Mixed | Keep in plugin | Low | Icon import uses network fetch, Figma pages, components, SVG import, paint binding, and variable binding. It is outside the current `ds-core` milestone. | Plugin icon tests with mocks where possible and manual smoke test; no `ds-core` extraction. |

## Recommended First Extraction Candidate

Recommended first candidate: color parsing and normalization utilities from `packages/plugin-starter-tokens/src/presets/color-utils.ts`, centered on `parseColorInput`, `rgbaToHex`, `colorWithAlpha`, `sanitizeKebabSegment`, and their private support helpers.

Why it is safe:

- The functions are pure and have no Figma API, UI, storage, build, manifest, or runtime side effects.
- They already live in a small utility file rather than inside the large plugin controller.
- They support later palette, primitive token, opacity, payload, and naming extraction.
- The public surface is narrow and easy to preserve with fixture tests.
- Moving them to `ds-core` matches the source-of-truth rule that foundation generation helpers belong in core.

Tests that must exist before moving it:

- Unit tests for all accepted color input formats and invalid color errors.
- Unit tests for channel and alpha clamping behavior.
- Golden tests for `rgbaToHex` rounding and `colorWithAlpha` string output.
- Unit tests for `sanitizeKebabSegment` with accents, punctuation, empty input, and fallback behavior.
- At least one primitive-token fixture proving opacity colors and generated brand colors do not change after the utility import path changes.
