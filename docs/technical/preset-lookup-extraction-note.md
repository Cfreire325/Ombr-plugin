# Preset Lookup Extraction Note

## 1. Pure and product-neutral functions

These helpers are pure and mostly product-neutral:

- `parsePresetNumericStep`
- `sortPresetSteps`
- `fallbackPresetSteps`
- `getPaletteSteps`
- `resolveClosestPaletteStep`
- `normalizePresetSteps`
- `closestPresetStep`

They operate on strings, numeric step values, arrays, or a minimal preset-like object. They have no Figma API, UI, storage, manifest, network, DOM, generated file, or runtime side effects.

`normalizePaletteKey` is also pure, but it is broader naming normalization rather than preset-step lookup. It is used by selected palettes, palette overrides, brand/palette generation, and payload normalization.

## 2. Functions depending on `PresetDefinition` or builtin preset shape

These functions depend directly on the current `PresetDefinition` shape:

- `getPaletteSteps`
- `resolveClosestPaletteStep`
- `normalizePresetSteps`
- `resolvePaletteFromCandidates`
- `resolvePaletteWithSynonyms`
- `resolveIntentPalette`

The required fields are mainly:

- `preset.palettes`
- `preset.steps`

The full plugin `PresetDefinition` also includes `id`, `label`, `description`, `neutralOptions`, `defaultNeutral`, and `previewPalettes`, but the generic step helpers do not need those fields.

The builtin preset registry itself should not move in this boundary. `BUILTIN_PRESETS`, `getPresetById`, and `getPresetSummaries` depend on plugin-local generated/static preset files and are a larger source-of-truth decision.

## 3. Semantic intent and product-specific palette assumptions

These helpers encode current semantic/product assumptions:

- `resolvePaletteFromCandidates`
- `resolvePaletteWithSynonyms`
- `resolveIntentPalette`
- `PALETTE_SYNONYMS`
- `INTENT_PALETTE_CANDIDATES`

`PALETTE_SYNONYMS` encodes product-specific synonym choices such as `green -> emerald/teal/lime` and `purple -> violet/fuchsia/pink`.

`INTENT_PALETTE_CANDIDATES` encodes semantic intent preferences such as `error -> error/red/rose/danger`, `success -> success/emerald/green/moss`, and `offer -> offer/fuchsia/pink/purple/magenta`.

These may eventually belong in `ds-core` as product constants, but only if semantic token generation moves with a clear core-level semantic contract. Moving them now would pull semantic color-mode assumptions into ds-core before that boundary is ready.

## 4. Functions that should move to ds-core first

Recommended first preset lookup extraction boundary:

- `parsePresetNumericStep`
- `sortPresetSteps`
- `fallbackPresetSteps`
- `getPaletteSteps`
- `resolveClosestPaletteStep`
- `normalizePresetSteps`
- `closestPresetStep`
- private/default `PRESET_STEPS` constant if needed by `fallbackPresetSteps`

This boundary is small enough to move safely because it only handles preset step parsing, sorting, fallback, and closest-step resolution.

## 5. Functions that should stay in the plugin for now

Keep these in the plugin for now:

- `normalizePaletteKey`
- `resolvePaletteFromCandidates`
- `resolvePaletteWithSynonyms`
- `resolveIntentPalette`
- `PALETTE_SYNONYMS`
- `INTENT_PALETTE_CANDIDATES`
- builtin preset registry helpers: `BUILTIN_PRESETS`, `getPresetById`, `getPresetSummaries`

These are either broader naming/payload normalization concerns or semantic intent palette decisions.

## 6. `normalizePaletteKey` boundary decision

Do not move `normalizePaletteKey` with the preset-step helper boundary.

It should move later with naming normalization or palette input normalization because it is used beyond preset lookup:

- selected palette normalization
- palette override keys
- payload normalization
- primitive generation naming
- duplicate-normalized palette behavior

Moving it with preset-step helpers would make the boundary less clear.

## 7. `PALETTE_SYNONYMS` and `INTENT_PALETTE_CANDIDATES`

Keep `PALETTE_SYNONYMS` and `INTENT_PALETTE_CANDIDATES` plugin-local for now.

They should be treated as semantic token generation constants, not generic preset lookup constants. They can move later if the semantic color-mode template and reference conversion helpers move into ds-core as a cohesive semantic-token boundary.

## 8. Behavior already protected by palette-steps tests

`packages/plugin-starter-tokens/src/presets/palette-steps.test.mjs` already protects:

- numeric preset step parsing
- leading-zero numeric parsing
- decimal and negative numeric parsing
- nonnumeric and mixed-unit rejection
- numeric sorting and deduplication
- mixed numeric/nonnumeric sorting
- localeCompare-based nonnumeric sorting
- fallback preset step output
- existing palette step lookup
- missing palette behavior
- preset `steps` normalization
- exact and case-insensitive step matching
- closest numeric palette step behavior
- tie behavior choosing the earlier numeric step
- nonnumeric requested-step fallback to `500` or first step
- `closestPresetStep` behavior for numeric, mixed, nonnumeric, and empty lists
- palette candidate fallback behavior
- synonym lookup behavior
- semantic intent palette lookup behavior

The generic preset-step boundary is therefore covered directly.

## 9. Indirect coverage from primitive and semantic tests

`packages/plugin-starter-tokens/src/presets/primitive-tokens.test.mjs` indirectly protects:

- selected preset palette output
- neutral palette output
- gray aliases to the selected neutral palette
- unselected non-neutral palettes not being generated
- generated primitive token count and representative palette refs

`packages/plugin-starter-tokens/src/presets/semantic-color-modes.test.mjs` indirectly protects:

- closest preset step behavior inside dark-mode palette resolution
- missing palette fallback behavior
- sparse palette neutral mirroring
- primitive palette step resolution
- unknown reference fallback through neutral/preset behavior
- generated semantic light/dark references for neutral and intent palettes

This indirect coverage is useful, but it also shows why semantic intent/synonym constants should not move with the generic preset-step boundary.

## 10. Additional tests needed before extraction

No additional tests are required before extracting the generic preset-step helper boundary.

Before moving semantic palette resolution constants and helpers, add or confirm tests against real builtin presets for:

- each semantic intent candidate order
- synonym fallback order across actual builtin palettes
- fallback to first palette when fallback is missing
- behavior when builtin preset palettes are sparse or nonnumeric
- behavior when `PresetDefinition.steps` differs from palette object keys

Before moving builtin preset registry helpers, add registry-level tests for:

- stable builtin preset IDs
- default preset availability
- summary shape
- palette counts
- neutral defaults
- preview palette metadata

## 11. Recommended extraction boundary

Recommendation: split into a smaller boundary and extract the generic preset-step helpers now.

Extract now in the next implementation task:

- `parsePresetNumericStep`
- `sortPresetSteps`
- `fallbackPresetSteps`
- `getPaletteSteps`
- `resolveClosestPaletteStep`
- `normalizePresetSteps`
- `closestPresetStep`
- `PRESET_STEPS` only as a private/default step constant for fallback behavior if needed

Delay extraction of:

- `normalizePaletteKey`
- `resolvePaletteFromCandidates`
- `resolvePaletteWithSynonyms`
- `resolveIntentPalette`
- `PALETTE_SYNONYMS`
- `INTENT_PALETTE_CANDIDATES`
- builtin preset registry helpers

This keeps ds-core focused on reusable preset step mechanics without prematurely absorbing semantic-token product policy.

## 12. Validation commands required if extracted later

Before extraction, run:

```powershell
npm.cmd run test:palette-steps
npm.cmd run test:primitive-tokens
npm.cmd run test:semantic-color-modes
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

## 13. Rollback notes

If extraction changes preset step lookup, primitive palette output, or semantic references, revert the extraction commit instead of changing expected outputs.

Keep the behavior-locking tests even if extraction is reverted. Do not edit `dist` manually. Do not touch `ui.html`, the manifest, plugin runtime behavior, `apps/web`, `packages/exporters`, or `packages/figma-adapter` during rollback.

Rollback should restore helper location and import/export wiring only.
