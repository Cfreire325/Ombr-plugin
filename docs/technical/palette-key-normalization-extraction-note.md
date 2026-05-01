# Palette Key Normalization Extraction Note

## 1. What `normalizePaletteKey` currently does

`normalizePaletteKey` converts a palette-like input into a lowercase hyphenated key:

- coerces falsy values through `String(input || "")`
- trims outer whitespace
- lowercases the result
- replaces every run of non-`a-z` / non-`0-9` characters with `-`
- trims leading and trailing hyphens
- returns an empty string for empty or fully stripped input

Examples currently locked by tests:

- `"Brand Primary"` -> `"brand-primary"`
- `" brand.primary/Primary! "` -> `"brand-primary-primary"`
- `""` -> `""`
- `"Brand Primary"` and `"brand_primary"` normalize to the same key

Unlike `sanitizeKebabSegment`, it does not accept a fallback parameter and does not explicitly normalize accents before stripping non-ASCII characters.

## 2. Where `normalizePaletteKey` is used

Current `code.ts` use sites:

- `buildPrimitiveTokens`
  - normalizes `options.selectedPalettes`
  - normalizes `options.neutralChoice` before adding it to the selected palette set
  - normalizes preset palette names while filtering generated primitive palettes
  - normalizes palette override lookup keys
- `buildGenerationOptions`
  - normalizes `selectedPalettes` from UI payloads
  - normalizes `paletteOverrides` object keys

Related but separate naming helpers remain in the same file or in `ds-core`:

- `sanitizeKebabSegment` is used by `sanitizePrimaryName` for generated brand token names.
- `normalizeTokenName` in `ds-core` normalizes canonical TokenBundle token paths and aliases.
- `normalizeSemanticOverridesInput` lowercases semantic override token names but does not use palette-key normalization.

There is also a separate plugin preset registry helper with the same name in `packages/plugin-starter-tokens/src/presets/builtin.ts`. That registry helper should not move in this boundary because it is part of builtin preset summary/key preparation.

## 3. Purity and product neutrality

`normalizePaletteKey` is pure:

- no Figma API calls
- no UI, DOM, manifest, storage, network, or file-system side effects
- deterministic output for a given input

It is mostly product-neutral as a generic palette key normalizer, but its current behavior is also tied to plugin payload and generated token behavior. It determines which selected palettes are emitted, how palette overrides attach to preset palettes, and how duplicate-normalized palette names collapse.

Because it influences product generation rather than only preset step math, it is a naming/payload normalization helper more than a palette-step helper.

## 4. Overlap with `sanitizeKebabSegment`

There is clear overlap:

- both lowercase
- both replace punctuation and spaces with hyphens
- both trim leading/trailing separators
- both coerce inputs to strings in practice

Important differences:

- `sanitizeKebabSegment` uses Unicode normalization and removes combining accents.
- `sanitizeKebabSegment` collapses repeated hyphens after replacement.
- `sanitizeKebabSegment` returns a fallback when the result is empty.
- `normalizePaletteKey` returns an empty string for empty input.
- `normalizePaletteKey` does not expose a fallback argument.

Today, many ASCII inputs produce the same output, but they should not be merged casually. Replacing `normalizePaletteKey` with `sanitizeKebabSegment(input, "")` could change accent behavior and may change edge cases around empty inputs or non-ASCII-only values.

## 5. Overlap with TokenBundle name normalization

`normalizePaletteKey` overlaps conceptually with TokenBundle naming, but it is not the same contract.

TokenBundle normalization in `ds-core` uses `normalizeTokenName`:

- preserves slash path structure
- converts dots to slashes
- allows `/` as a path separator
- normalizes aliases and token names into canonical slash-case
- checks duplicates after normalization

`normalizePaletteKey` intentionally flattens all separators, including `/` and `.`, into a single kebab segment. For example:

- palette key: `"brand.primary/Primary"` -> `"brand-primary-primary"`
- TokenBundle name: `"Brand.Primary Primary"` would normalize as a slash-case token path

The TokenBundle naming decision says raw names may remain permissive if deterministically normalizable, while normalized output must be canonical slash-case. `normalizePaletteKey` should not be treated as the TokenBundle name normalizer because palette keys are single identifiers, not token paths.

## 6. Move now or wait

Recommendation: wait for a broader naming-normalization boundary.

Although `normalizePaletteKey` is small and pure, moving it by itself now would create a less coherent `ds-core` API:

- It does not belong with numeric shade-step helpers.
- It overlaps with `sanitizeKebabSegment`, but has different empty/fallback and Unicode behavior.
- It overlaps with `normalizeTokenName`, but uses a different single-segment palette-key contract.
- It participates in generation payload normalization, not just preset lookup.

The better extraction boundary is a future `ds-core` naming module or naming section that explicitly separates:

- token path normalization: `normalizeTokenName`
- token segment sanitization: `sanitizeKebabSegment`
- palette key normalization: `normalizePaletteKey`
- possibly alias/path normalization helpers if they become public

## 7. Behavior already protected by tests

Direct protection:

- `packages/plugin-starter-tokens/src/presets/palette-steps.test.mjs`
  - uppercase input
  - spaces
  - punctuation
  - empty value
  - duplicate-normalized examples

Indirect protection:

- `packages/plugin-starter-tokens/src/presets/primitive-tokens.test.mjs`
  - selected preset palette output
  - selected/unselected palette generation behavior
  - neutral aliases and selected neutral palette behavior
  - palette refs that would change if palette-key filtering changed
- `packages/plugin-starter-tokens/src/presets/generation-options.test.mjs`
  - selected palette normalization
  - palette override key normalization
  - empty selected palette filtering
  - invalid override color filtering while retaining normalized palette keys
- `packages/ds-core/tests/token-bundle.test.mjs`
  - canonical TokenBundle slash-case output
  - permissive raw token-name normalization
  - duplicate-after-normalization behavior
  - alias normalization

The existing tests cover the most important current outputs, but the direct `normalizePaletteKey` unit coverage is still fairly narrow.

## 8. Additional tests needed before extraction

Before extracting `normalizePaletteKey`, add focused tests for edge cases that distinguish it from the other naming helpers:

- accented/unicode input, especially compared with `sanitizeKebabSegment`
- repeated separators
- slash and dot flattening
- underscore behavior
- numeric input if a future exported signature allows unknown input
- whitespace-only input
- punctuation-only input
- non-ASCII-only input
- collision examples across selected palettes and palette overrides

Also consider a small comparison test documenting that:

- `normalizePaletteKey` flattens to one kebab segment
- `normalizeTokenName` preserves slash paths
- `sanitizeKebabSegment` may return a fallback

These tests should document current behavior, not redesign it.

## 9. Smallest safe extraction boundary

If extracted later, the smallest safe boundary is:

- `normalizePaletteKey`

Potential target:

- a new `packages/ds-core/src/naming.js` module, if a broader naming boundary is chosen
- or `packages/ds-core/src/palette-steps.js` only if the team intentionally treats palette keys as part of preset lookup

Preferred future target: a naming module. That keeps preset step mechanics separate from naming contracts.

The extracted helper should remain behavior-compatible, including returning an empty string for empty input.

## 10. Functions and constants that must not move with it

Do not move with this boundary:

- `resolvePaletteFromCandidates`
- `resolvePaletteWithSynonyms`
- `resolveIntentPalette`
- `PALETTE_SYNONYMS`
- `INTENT_PALETTE_CANDIDATES`
- builtin preset registry helpers: `BUILTIN_PRESETS`, `getPresetById`, `getPresetSummaries`
- plugin preset summary preparation from `packages/plugin-starter-tokens/src/presets/builtin.ts`
- `buildPrimitiveTokens`
- `buildGenerationOptions`
- `normalizeSemanticOverridesInput`
- icon normalization helpers
- TokenBundle color-mode mapping helpers
- Figma adapter logic

Also do not replace `sanitizeKebabSegment` or `normalizeTokenName` with `normalizePaletteKey`. They are related but not interchangeable.

## 11. Risks if it moves too early

- `ds-core` API becomes fragmented with one-off naming helpers spread across unrelated modules.
- Future naming consolidation may require a second move or breaking API cleanup.
- It may encourage using palette-key normalization for TokenBundle token paths, which would incorrectly flatten slash structure.
- It may encourage using `sanitizeKebabSegment` as a drop-in replacement, changing empty/fallback or unicode behavior.
- Payload normalization and primitive generation could drift if plugin and UI copies are not reconciled later.
- Builtin preset registry normalization has a separate copy today; moving only `code.ts` usage could leave duplicate behavior in place.

## 12. Validation commands required if extracted later

Before extraction:

```powershell
npm.cmd run test:palette-steps
npm.cmd run test:primitive-tokens
npm.cmd run test:generation-options
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

If a later extraction changes selected palette filtering, palette override keys, neutral palette inclusion, primitive palette output, or TokenBundle naming behavior, revert the extraction instead of changing expected outputs.

Keep the behavior-lock tests even if the extraction is reverted. Rollback should restore helper location and import/export wiring only. Do not edit `dist` manually. Do not touch `ui.html`, the manifest, `apps/web`, `packages/exporters`, or `packages/figma-adapter` during rollback.

## Recommendation

Do not extract `normalizePaletteKey` yet.

Add a small naming-normalization test pass first, then extract it as part of a coherent `ds-core` naming boundary rather than as part of palette-step helpers. The likely future boundary is a `ds-core` naming module that keeps palette keys, token paths, and kebab segments distinct while preserving all current quirks.
