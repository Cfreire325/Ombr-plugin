# Phase 1 Behavior Lock Checkpoint

## 1. Purpose

This checkpoint summarizes the behavior locked before extraction begins. It captures the Phase 1 behavior-locking tests, the current quirks intentionally preserved, and the recommended boundary for the first small extraction.

The goal is to make future extraction work safer by separating behavior documentation from code movement. No extraction has been performed as part of this checkpoint.

## 2. Phase 1 current status

- `ds-core` tests have been strengthened around the TokenBundle contract, validation, normalization, aliases, metadata, sorting, flat-list output, and plugin input creation.
- Color utilities are locked.
- Primitive tokens are locked.
- Palette steps and preset lookup are locked.
- Semantic color modes are locked.
- Typography tokens are locked.
- Spacing and radius tokens are locked.
- Generation options are locked.
- TokenBundle color-mode mapping is locked.
- No extraction has been done yet.
- No web app has been created.
- No exporters package has been created.
- No figma-adapter package has been created.
- The plugin runtime is unchanged.

## 3. Test commands currently available

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

## 4. Locked behavior summary by area

### TokenBundle contract

Covered: TokenBundle validation, normalized output, duplicate detection after normalization, required light/dark values, COLOR/FLOAT/STRING validation, aliases across primitives/semantic/components, metadata normalization, flat token output, and plugin input wrapping.

Why it matters before extraction: TokenBundle is the shared source-of-truth shape that future core logic, adapters, import/export code, and plugin generation should agree on.

Should not change silently: canonical normalized names, alias prefix rules, duplicate-after-normalization behavior, metadata preservation, validation errors, or collection ordering.

### Naming normalization

Covered: permissive raw TokenBundle names that can normalize deterministically, canonical slash-case normalized output, duplicate normalized names, normalized aliases, and related naming decision documentation.

Why it matters before extraction: extracted helpers should consume normalized token names and must not accidentally make raw naming stricter or looser without a schema decision.

Should not change silently: raw-name permissiveness, slash-case normalized output, kebab-case segment behavior, or duplicate detection after normalization.

### Color utilities

Covered: `parseColorInput`, `rgbaToHex`, `colorWithAlpha`, `sanitizeKebabSegment`, and exported `buildBrandScale` behavior where currently testable.

Why it matters before extraction: these are the first recommended pure helpers for `ds-core`, and they affect primitive colors, opacity tokens, generated brand scales, payload validation, and token naming.

Should not change silently: accepted color formats, invalid input behavior, channel rounding/clamping, exact `rgba(...)` string formatting, alpha interpretation, kebab sanitization, or generated brand-scale output.

### Primitive token generation

Covered: default brand generation, generated brand scale steps, base 500 behavior, opacity values, base black/white tokens, selected preset palettes, neutral aliases, brand aliases, and pixel primitives.

Why it matters before extraction: primitive output is the first downstream signal that color utility extraction preserved real generation behavior.

Should not change silently: primitive token names, collections, scopes, alias paths, raw values, brand scale values, opacity formatting, neutral references, or pixel foundation values.

### Palette steps and preset lookup

Covered: shade derivation patterns, subset selection, extension behavior, base-step resolution, closest-step logic, palette key normalization, preset step parsing/sorting, fallback steps, palette lookup, closest preset step resolution, synonym lookup, and intent palette resolution.

Why it matters before extraction: palette helpers determine generated primitive scales and semantic references. Small changes can create broad token diffs.

Should not change silently: shade count behavior, Tailwind/hundreds step arrays, 500 inclusion, fallback palette behavior, non-numeric step ordering, synonym order, or closest-step tie/boundary behavior.

### Semantic color modes

Covered: Kigen reference parsing, intent extraction, accent detection, alpha key resolution, token family detection, dark-mode remapping, primitive palette step resolution, reference conversion, generated semantic tokens, aliases/raw values, scopes, and structure comparison behavior.

Why it matters before extraction: semantic generation is high-impact product logic and should not move until the current light/dark output is fully protected.

Should not change silently: generated semantic token names, light/dark values, alias references, scope assignments, fallback refs, dark remap steps, or structure comparison rules.

### Typography tokens

Covered: default typography constants, size ordering, line-height resolution, rounding, default token output, font family/size/line-height/letter-spacing/font-weight tokens, custom family overrides, custom sizes, invalid numeric handling, token names, values, collections, and scopes.

Why it matters before extraction: typography foundations belong in core eventually, but current defaults and generated references must remain stable before moving helpers.

Should not change silently: default sizes, default line heights, font family variable names, weight style names, custom key ordering, invalid numeric skips, rounding behavior, or token count.

### Spacing and radius tokens

Covered: `PIXEL_VALUES`, `SPACING_ALIAS_MAP`, `RADIUS_ALIAS_MAP`, spacing token output, radius token output, alias targets, collections, values, scopes, token counts, and representative foundation values.

Why it matters before extraction: spacing and radius scales are foundation output. Extraction should preserve exact aliases and pixel references.

Should not change silently: generated pixel values, omitted pixel values, spacing alias names, radius alias names, alias target paths, `radius-full` behavior, scopes, or collection names.

### Generation options normalization

Covered: default generation options, token level, UI mode, naming pattern, shade clamping, brand color input, preset selection, TokenBundle input normalization, semantic overrides, typography payload normalization, icon payload normalization helpers, and icon semantic token name resolution.

Why it matters before extraction: this boundary mixes pure normalization with plugin UI defaults and runtime choices, so tests clarify what should stay plugin-local for now.

Should not change silently: defaults, fallback choices, validation errors, preset fallback behavior, brand normalization, semantic override filtering, typography payload merging, icon defaults, or icon alias normalization.

### TokenBundle to color-modes mapping

Covered: `buildColorModeTokensFromBundle`, `mapBundleAlias`, `bundleValueToRuntimeTokenValue`, `toVariableType`, `sanitizeBundleScopes`, semantic entry mapping, raw values, aliases, scope fallbacks, runtime collections, and ignored metadata.

Why it matters before extraction: this is adapter-shaped behavior that should move toward a future figma-adapter package, not `ds-core`.

Should not change silently: emitted collection, semantic-only runtime token output, alias collection mapping, raw value passthrough, type fallback behavior, scope sanitization, or metadata omission.

## 5. Known quirks intentionally locked

### Color utilities

- `#ggg` returns `NaN` RGB channels instead of throwing.
- `rgb(foo, 0, 0)` returns `NaN` for the invalid channel instead of throwing.
- `colorWithAlpha(..., 0.5)` treats `0.5` as `0.5%`, producing alpha `0.005`.

### TokenBundle naming

- Raw names may remain permissive if deterministically normalizable.
- Normalized output must remain canonical slash-case.

### Palette steps

- `resolveBaseStep` does not treat string `"500"` as numeric `500`.
- `resolveBaseStep([])` returns `NaN`.
- `resolveBaseStep(["sm", "lg"])` returns `"sm"`.
- `pickSubset(..., 0)` behaves like count `1`.

### Semantic color modes

- `parseKigenReference` does not require braces.
- Focus, shadow, foreground, and component-like names can match intent extraction but are not generated color-mode families.
- `compareColorModesStructure` ignores extra tokens and changed values; it only reports missing/empty required entries.
- Unknown refs can fall back through first/fallback palette behavior.

### Typography

- `DEFAULT_LINE_HEIGHTS["display-2xl"]` is `88` in `code.ts`, overriding generated typography reference value `90`.

### Spacing / Radius

- `pixel/1` is not generated.
- `spacing-full` is not generated.
- `radius-full` aliases `pixel/full`.

### Generation options

- Invalid `presetId` is preserved in returned options, while defaults are resolved from the first preset.
- `buildGenerationOptions` keeps raw icon library and packs; it does not call `normalizeIconLibraryId` or `normalizeIconPackIds` there.
- `icons.colorAlias` is lowercased in `buildGenerationOptions`, but dotted/braced aliases are only fully normalized by `resolveIconSemanticTokenName`.

### TokenBundle color-mode mapping

- `buildColorModeTokensFromBundle` only maps `collections.semantic`.
- `collections.primitives` and `collections.components` are not emitted as runtime tokens.
- Component aliases are supported only as references and map to `1. color-modes`.
- Value mapping does not validate or coerce raw values.
- Description and meta are ignored.

## 6. Extraction readiness

The first extraction candidate remains color utilities. Extraction should start with the smallest pure functions from `color-utils.ts`, because they are isolated from the Figma runtime and already have focused behavior-lock tests.

Extraction should not include semantic generation, TokenBundle mapping, Figma scope logic, icon logic, or generation options yet. Those areas either mix plugin runtime concerns with pure logic or have larger behavioral blast radius.

Any extraction must preserve all behavior-lock tests. Test updates should only change import paths or harness wiring when required by the move, not expected output.

## 7. Recommended first extraction boundary

Recommended first extraction boundary:

- `parseColorInput`
- `rgbaToHex`
- `colorWithAlpha`
- `sanitizeKebabSegment`
- Private support helpers needed by those functions

Do not include yet:

- `buildBrandScale`, unless the team decides the color utility extraction is stable first.
- Semantic color mode helpers.
- `buildPrimitiveTokens`.
- `buildGenerationOptions`.
- Figma adapter mapping.

## 8. Validation before extraction

Before extraction, run:

```powershell
npm.cmd run test:color-utils
npm.cmd run test:primitive-tokens
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

## 9. Rollback strategy

If extraction tests fail in unexpected ways, revert the extraction commit instead of editing behavior to make tests pass. Keep the behavior-lock tests even if extraction is reverted, because they document the current contract and remain useful for the next attempt.

Do not edit `dist` manually during rollback. Do not touch the plugin UI, `ui.html`, or manifest during rollback. Use the Git backup if needed and prefer reverting source movement over restoring generated output by hand.

## 10. Next recommended task

Next recommended task is a small extraction PR for color utility functions into `ds-core`, but only after committing this checkpoint.
