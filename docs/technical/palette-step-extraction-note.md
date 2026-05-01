# Palette Step Extraction Note

## 1. Pure and product-neutral functions

These helpers are pure and mostly product-neutral. They take primitive values or arrays and return deterministic results without Figma, UI, storage, manifest, DOM, network, or file side effects:

- `closestStep`
- `pickSubset`
- `nextShadeStep`
- `extendSteps`
- `basePatternSteps`
- `deriveShadeSteps`
- `resolveBaseStep`

`normalizePaletteKey` is also pure and broadly reusable, but it is naming-normalization logic used by payload and palette generation. It can move later with naming or preset normalization, but it does not need to move with the first shade-step boundary.

## 2. Functions tied to plugin payload or current generation behavior

These functions are pure, but they encode current plugin/product generation behavior:

- `deriveShadeSteps` uses current shade count bounds and fallback behavior through `clampNumber`: minimum `6`, maximum `14`, fallback `11`.
- `basePatternSteps` encodes current `NamingPattern` behavior: `"hundreds"` maps to `100..1000`; unknown values fall back to Tailwind-like steps.
- `resolveBaseStep` preserves current quirks for string arrays and empty arrays.
- `fallbackPresetSteps` depends on the current `PRESET_STEPS` constant.
- `normalizePaletteKey` is used by generation options, palette overrides, selected palettes, and primitive generation naming.
- `resolvePaletteFromCandidates`, `resolvePaletteWithSynonyms`, and `resolveIntentPalette` encode current semantic intent palette choices and synonym order.

These are not plugin-runtime coupled, but they are product contracts. Moving them should preserve the locked behavior exactly.

## 3. Functions that should move to ds-core first

Recommended first extraction boundary:

- `basePatternSteps`
- `pickSubset`
- `nextShadeStep`
- `extendSteps`
- `deriveShadeSteps`
- `resolveBaseStep`
- `closestStep`
- private dependency needed by `deriveShadeSteps`: either move `clampNumber` as a private helper in the same ds-core module or extract a tiny numeric helper boundary first

This is the smallest safe boundary because these helpers only derive numeric shade arrays and the base shade used by `buildBrandScale` and primitive token generation. They do not require preset objects, semantic intent constants, palette synonym maps, or Figma scopes.

## 4. Functions that should stay in the plugin for now

Keep these in the plugin for now:

- `normalizePaletteKey`
- `parsePresetNumericStep`
- `sortPresetSteps`
- `fallbackPresetSteps`
- `getPaletteSteps`
- `resolveClosestPaletteStep`
- `normalizePresetSteps`
- `closestPresetStep`
- `resolvePaletteFromCandidates`
- `resolvePaletteWithSynonyms`
- `resolveIntentPalette`

These are still pure, but they depend on preset object shape, current semantic intent candidates, palette synonyms, or plugin generation naming. They should move as a second boundary after the numeric shade-step helpers are already stable in ds-core.

## 5. Functions that depend on preset data shape

These functions directly depend on `PresetDefinition` shape or preset palette conventions:

- `getPaletteSteps`
- `resolveClosestPaletteStep`
- `normalizePresetSteps`
- `resolvePaletteFromCandidates`
- `resolvePaletteWithSynonyms`
- `resolveIntentPalette`

These functions indirectly depend on preset step conventions:

- `parsePresetNumericStep`
- `sortPresetSteps`
- `fallbackPresetSteps`
- `closestPresetStep`

They should not be part of the first extraction because moving them cleanly raises a separate question: whether `PresetDefinition`, preset registry helpers, and semantic intent palette constants should also become ds-core contracts.

## 6. Behavior already protected by palette-steps tests

`packages/plugin-starter-tokens/src/presets/palette-steps.test.mjs` protects:

- Tailwind and hundreds base patterns.
- Unknown pattern fallback to Tailwind-like steps.
- Shade count clamping through `deriveShadeSteps`.
- Subset selection and inclusion of `500` where possible.
- Extended shade count behavior.
- `pickSubset(..., 0)` currently behaving like count `1`.
- `nextShadeStep` special-casing `950` to `1000`.
- `extendSteps` sorting, deduping, and extending.
- `resolveBaseStep` valid, missing, string, empty, and nonnumeric behavior.
- `closestStep` exact, tie, boundary, and empty-list behavior.
- Palette key normalization.
- Preset numeric parsing and sorting.
- Preset fallback steps.
- Palette step lookup.
- Closest palette step resolution.
- Preset step normalization.
- Palette candidate, synonym, and intent resolution.

The first extraction boundary is therefore directly covered by this test file.

## 7. Behavior indirectly protected by primitive-token tests

`packages/plugin-starter-tokens/src/presets/primitive-tokens.test.mjs` indirectly protects:

- `deriveShadeSteps("tailwind", 11)` returning the standard Tailwind-like steps.
- `resolveBaseStep` returning `500` for the standard generated steps.
- The interaction between derived shade steps, normalized brand generation, and `buildPrimitiveTokens`.
- Generated brand scale token names and aliases for every standard shade step.
- Primitive token count for the selected fixture setup.

This gives downstream coverage that the first numeric shade-step extraction does not change primitive token output.

## 8. Risks if these helpers move

- Primitive token output can change if shade step arrays change.
- Brand scale output can change because `buildBrandScale` receives different step arrays or base steps.
- Semantic color-mode references can drift if later preset lookup helpers move incorrectly.
- Current quirks could be accidentally fixed, including:
  - `resolveBaseStep` not treating string `"500"` as numeric `500`.
  - `resolveBaseStep([])` returning `NaN`.
  - `resolveBaseStep(["sm", "lg"])` returning `"sm"`.
  - `pickSubset(..., 0)` behaving like count `1`.
- Moving preset lookup together with shade derivation would broaden the surface into semantic palette resolution too early.
- `deriveShadeSteps` depends on `clampNumber`, which currently also belongs to payload normalization. Pulling it wholesale would couple this extraction to generation options.

## 9. Additional tests needed before extraction

No additional tests are required before extracting the smallest numeric shade-step boundary.

Before extracting preset lookup helpers, add or confirm coverage for:

- Builtin preset fixtures, not only ad hoc in-memory presets.
- `PresetDefinition` shape compatibility if it becomes a ds-core contract.
- Selected palette and neutral palette behavior across real builtins.
- Semantic intent palette resolution across real builtins.
- Missing `preset.steps` with real palette data.
- Duplicate normalized palette names if `normalizePaletteKey` moves with preset normalization.

## 10. Recommended extraction boundary

Recommendation: split into a smaller boundary and extract the numeric shade-step derivation helpers first.

Extract now, in the next implementation task:

- `basePatternSteps`
- `pickSubset`
- `nextShadeStep`
- `extendSteps`
- `deriveShadeSteps`
- `resolveBaseStep`
- `closestStep`

Include only the minimal private numeric clamp dependency needed by `deriveShadeSteps`; do not expose `clampNumber` publicly unless a later payload-normalization extraction needs it.

Delay extraction of:

- `normalizePaletteKey`
- `parsePresetNumericStep`
- `sortPresetSteps`
- `fallbackPresetSteps`
- `getPaletteSteps`
- `resolveClosestPaletteStep`
- `normalizePresetSteps`
- `closestPresetStep`
- `resolvePaletteFromCandidates`
- `resolvePaletteWithSynonyms`
- `resolveIntentPalette`

Those should be handled as a second preset lookup and semantic palette resolution boundary.

## 11. Validation commands required if extracted later

Before extraction, run:

```powershell
npm.cmd run test:palette-steps
npm.cmd run test:primitive-tokens
npm.cmd run test:color-utils
npm.cmd run test:ds-core
npm.cmd run typecheck
```

After extraction, run the full suite:

```powershell
npm.cmd run test:ds-core
npm.cmd run test:color-utils
npm.cmd run test:primitive-tokens
npm.cmd run test:palette-steps
npm.cmd run test:semantic-color-modes
npm.cmd run test:typography-tokens
npm.cmd run test:spacing-radius-tokens
npm.cmd run test:generation-options
npm.cmd run test:bundle-color-modes
npm.cmd run typecheck
```

Do not run `npm run build` unless a later task explicitly allows it.

## 12. Rollback notes

If extraction changes shade-step output or primitive token output, revert the extraction commit rather than changing expected test outputs.

Keep the behavior-locking tests even if extraction is reverted. Do not edit `dist` manually. Do not touch `ui.html`, the manifest, plugin runtime behavior, `apps/web`, `packages/exporters`, or `packages/figma-adapter` during rollback.

Rollback should restore only the import/export wiring and helper location, leaving the locked test expectations intact.
