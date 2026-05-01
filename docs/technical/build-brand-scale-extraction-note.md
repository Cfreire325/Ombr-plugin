# Build Brand Scale Extraction Note

## 1. Functions that would need to move with `buildBrandScale`

`buildBrandScale` is not a small standalone wrapper. To preserve current behavior exactly, it would need to move with the full private color-scale implementation it depends on:

- `buildBrandScale`
- `buildBrandScaleWithOklch`
- `buildBrandScaleWithHsl`
- `rgbToHsl`
- `hslToRgb`
- `srgbToLinear`
- `linearToSrgb`
- `rgbToOkLab`
- `okLabToRgb`
- `okLabToOklch`
- `oklchToOkLab`
- `isInGamut`
- `oklchToGamutRgb`
- `ratioForStep`
- `ratioForDynamicStep`
- `ensureMonotone`
- `LIGHT_RATIO`
- `DARK_RATIO`
- Internal `HSL`, `OKLab`, and `OKLCH` shapes if typed in TypeScript later

It also depends on the already-extracted `parseColorInput`, `rgbaToHex`, and `clamp01` behavior. `clamp01` is currently private in both the ds-core color utility module and the remaining plugin brand-scale implementation; moving `buildBrandScale` would require keeping one private ds-core copy or making a local private helper in the same ds-core module.

## 2. Purity

`buildBrandScale` is still a pure function.

It has no Figma API calls, UI calls, storage reads or writes, manifest access, network access, DOM access, plugin messaging, generated file writes, or runtime side effects. Its output is determined by:

- `baseColor`
- `steps`
- `baseStep`
- internal color conversion math
- internal ratio constants
- current parser and hex formatting behavior

This makes it eligible for `ds-core` eventually. The question is not whether it belongs in `ds-core`; it does. The question is whether its behavior is protected enough to move now.

## 3. Behavior already protected by tests

Current behavior-locking tests already protect the main public path:

- `packages/plugin-starter-tokens/src/presets/color-utils.test.mjs` locks:
  - default Tailwind-like steps for `#82BE5C`
  - exact generated scale output for `50` through `950`
  - custom base-step output for `[100, 300, 500, 700]` with base step `300`
  - empty step list returning `{}`
  - missing base step error message
  - invalid base color error message through the public wrapper

- `packages/plugin-starter-tokens/src/presets/primitive-tokens.test.mjs` locks:
  - brand normalization output using `buildBrandScale`
  - generated brand primitive tokens
  - `colors/brand/*` aliases to the generated brand scale
  - primitive token count with one generated brand scale
  - downstream generated output for the default `#82BE5C` brand path

Together, these tests prove the current default brand scale and the main primitive-token dependency stay stable across the first color utility extraction.

## 4. Behavior not protected enough yet

The current tests do not yet cover enough of the internal palette math to make this the next safest move.

Missing or thin areas:

- Low-saturation or grayscale base colors.
- High-saturation colors that stress OKLCH chroma and gamut mapping.
- Very dark and very light base colors.
- Non-500 base steps beyond the single custom `300` fixture.
- Unsorted and duplicate step inputs.
- Extended shade arrays beyond the standard Tailwind-like set.
- Hundreds-pattern steps such as `100` through `900` as a direct `buildBrandScale` fixture.
- Explicit proof that the public OKLCH-to-HSL fallback behavior remains stable.
- Gamut mapping edge cases where `oklchToGamutRgb` repeatedly reduces chroma.
- Numeric rounding around `rgbaToHex` after OKLab/OKLCH conversion.
- Behavior with invalid or surprising parsed colors such as currently accepted `NaN` channels.

The existing primitive-token fixture protects one important downstream route, but it does not fully cover the color math space.

## 5. Recommended extraction strategy

Recommendation: delay extraction and add more tests first.

When it is extracted later, move only the public `buildBrandScale` API into ds-core and keep the OKLCH/HSL implementation helpers private inside ds-core. The helper functions should move together with `buildBrandScale`, but they should not be exported unless a future task has a clear testing or product API reason.

This keeps the future ds-core surface small:

- Public: `buildBrandScale`
- Private: OKLCH/HSL conversion helpers, ratio helpers, monotonicity helper, and scale constants

Do not split `buildBrandScaleWithOklch` and `buildBrandScaleWithHsl` across plugin and ds-core. That would create two coupled color-math locations and make fallback behavior harder to preserve.

## 6. Risks

- Broad palette diffs from tiny changes in color conversion math.
- OKLCH fallback changes if the wrapper/catch behavior is moved incorrectly.
- Numeric rounding changes in `rgbaToHex` after OKLab/OKLCH conversion.
- Gamut mapping changes from loop count, chroma reduction ratio, or clamping differences.
- Brand scale output changes for generated primitive tokens.
- Accidental public exposure of internal color math APIs too early.
- Duplicate private helpers drifting between plugin and ds-core if extraction is partial.

## 7. Validation required if extracted later

Before extracting `buildBrandScale`, run:

```powershell
npm.cmd run test:color-utils
npm.cmd run test:primitive-tokens
npm.cmd run test:palette-steps
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

Do not run `npm run build` for this Phase 1 extraction unless a later task explicitly changes the allowed validation scope.

## 8. Recommendation

Do not extract `buildBrandScale` yet. Add tests first.

The next safe Phase 1 task should add focused `buildBrandScale` fixture coverage for grayscale, saturated colors, dark/light bases, duplicate or unsorted steps, hundreds-pattern steps, extended shade arrays, and at least one case that protects the current OKLCH fallback or gamut behavior. After that, extract `buildBrandScale` as one public ds-core boundary with all required OKLCH/HSL helpers kept private in ds-core.
