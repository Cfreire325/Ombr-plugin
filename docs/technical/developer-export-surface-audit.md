# Developer Export Surface Audit

## Purpose

This audit documents the current token and export-related surface before adding developer-facing export formats.

The goal is to identify the current flow, what is runtime behavior versus test-only support, and the smallest safe next step toward exports without changing generation behavior.

## Files inspected

- `packages/plugin-starter-tokens/src/code.ts`
- `packages/plugin-starter-tokens/src/ui.html`
- `packages/plugin-starter-tokens/src/presets/types.ts`
- `packages/plugin-starter-tokens/src/presets/bundle-color-modes.test.mjs`
- `packages/plugin-starter-tokens/src/presets/primitive-tokens.test.mjs`
- `packages/plugin-starter-tokens/src/presets/semantic-color-modes.test.mjs`
- `packages/plugin-starter-tokens/src/presets/generation-options.test.mjs`
- `packages/ds-core/src/index.js`
- `packages/ds-core/src/index.d.ts`
- `packages/ds-core/tests/token-bundle.test.mjs`
- `packages/ds-core/fixtures/token-bundle.sample.json`
- `docs/token-bundle-contract.md`
- `docs/technical/export-strategy.md`
- `docs/technical/monorepo-target-architecture.md`
- `docs/technical/migration-roadmap.md`

## Current Export Flow

There is no developer-facing exporter implementation yet.

The current runtime flow is Figma variable generation:

1. `ui.html` collects generation options and posts `generate-variables` to the plugin controller.
2. `code.ts` runs `buildGenerationOptions`.
3. `applyGeneration` assembles plugin-local `TokenDefinition[]`.
4. `applyGeneration` writes those tokens directly into Figma variable collections.
5. The UI receives only a compact generation report through `generate-result`.

Current generated token assembly happens in `code.ts`:

- `buildPrimitiveTokens`
- `buildTypographyTokens`
- `buildSpacingTokens`
- `buildRadiusTokens`
- `buildColorModeTokens`
- `buildColorModeTokensFromBundle`

These functions emit plugin-local `TokenDefinition` objects, not canonical `TokenBundle` entries.

## TokenBundle Flow

`TokenBundle` is currently the documented shared contract and is implemented in `ds-core`.

`ds-core` currently provides:

- `validateTokenBundle`
- `normalizeTokenBundle`
- `toFlatTokenList`
- `createPluginInputFromTokenBundle`
- `normalizeTokenName`
- shared collection/type/mode constants

The plugin uses TokenBundle as an input path:

- `normalizeTokenBundleInput` validates and normalizes a payload `tokenBundle`.
- If generation is in `color-modes` mode and `options.tokenBundle` exists, `applyGeneration` calls `buildColorModeTokensFromBundle`.
- `buildColorModeTokensFromBundle` maps only `bundle.collections.semantic` into current runtime color-mode tokens.

The plugin does not currently create a full TokenBundle from its internally generated primitive, typography, spacing, radius, or semantic generation pipeline.

## Existing Export Formats

Current implemented outputs:

- Figma variables and modes written at runtime.
- Figma text styles created at runtime when enabled.
- Figma icon components imported at runtime when enabled.
- UI generation report.

Current test/contract outputs:

- normalized TokenBundle object from `normalizeTokenBundle`
- flat token list from `toFlatTokenList`
- plugin input wrapper from `createPluginInputFromTokenBundle`
- `token-bundle.sample.json` fixture

Planned but not implemented developer export formats:

- JSON export
- CSS variables export
- Tailwind config export
- Style Dictionary export
- React theme export

`packages/exporters` does not exist yet.

## Runtime-Only vs Test-Only

Runtime-only surfaces:

- `applyGeneration`
- `buildPrimitiveTokens`
- `buildTypographyTokens`
- `buildSpacingTokens`
- `buildRadiusTokens`
- `buildColorModeTokens`
- Figma variable collection/mode creation
- raw value writes through `setRawValue`
- alias resolution through `PendingAlias` and `resolveAlias`
- text style binding
- icon import and variable binding
- UI generation reports

Runtime TokenBundle input surface:

- `normalizeTokenBundleInput`
- `buildColorModeTokensFromBundle`
- `mapBundleAlias`
- `bundleValueToRuntimeTokenValue`
- `toVariableType`
- `sanitizeBundleScopes`

Test-only or contract-support surfaces:

- `toFlatTokenList`
- `createPluginInputFromTokenBundle`
- `packages/ds-core/fixtures/token-bundle.sample.json`
- TokenBundle contract tests
- bundle-to-color-modes fixture tests

## Raw Values, Aliases, and Variable References

The plugin-local `RuntimeTokenValue` has two shapes:

- raw: `{ kind: "raw", value }`
- alias: `{ kind: "alias", ref, collection }`

Raw values:

- COLOR strings are parsed by `parseColorInput` and written to Figma variable modes.
- FLOAT values are coerced with `Number` before Figma writes.
- STRING values are written as strings.

Aliases:

- Plugin-generated aliases reference another variable by name and target collection.
- Aliases are resolved after all variables are upserted.
- Figma variable alias values are created only after `resolveAlias` finds the target variable.

TokenBundle alias mapping:

- `primitives/...` maps to the plugin primitives collection.
- `semantic/...` maps to the plugin `1. color-modes` collection.
- `components/...` also maps to `1. color-modes` today.

Important limitation:

- TokenBundle raw values are not coerced or converted during `bundleValueToRuntimeTokenValue`.
- TokenBundle aliases are converted to runtime references, not exported as developer-facing alias strings.

## Current Limitations

- There is no developer export command in the plugin UI.
- The UI does not download or copy generated token files.
- The plugin does not emit a TokenBundle after generating foundations.
- The main generation pipeline emits plugin-local `TokenDefinition[]`, not canonical TokenBundle data.
- `buildColorModeTokensFromBundle` only maps `collections.semantic`.
- `collections.primitives` and `collections.components` are not emitted as runtime tokens from TokenBundle input.
- Component aliases are only supported as references and currently route to `1. color-modes`.
- There is no `packages/exporters` package yet.
- JSON/CSS/Tailwind export behavior is only documented, not implemented.
- Figma variable references are runtime objects and should not leak into developer exports.
- The current `toFlatTokenList` helper is useful for tests/inspection but is not a developer export format.

## Recommended First Small Export Improvement

Recommended first implementation step: add a pure JSON TokenBundle export over an already-normalized TokenBundle.

Do this before CSS variables or Tailwind config.

Suggested boundary for a future implementation task:

- consume an unknown bundle input
- call `normalizeTokenBundle`
- emit deterministic pretty JSON
- preserve raw values, aliases, descriptions, scopes, metadata, collections, and modes
- add tests using `packages/ds-core/fixtures/token-bundle.sample.json`

Preferred future home when package creation is allowed:

- `packages/exporters`

If package creation is still not allowed, add only tests/spec notes first rather than burying exporter logic in `code.ts`.

This first step is safe because JSON export can preserve the TokenBundle shape without inventing platform-specific naming or alias semantics.

## Risks To Avoid

- Do not build CSS or Tailwind export directly from plugin-local `TokenDefinition[]` unless that is explicitly accepted as a temporary adapter path.
- Do not use Figma variable aliases as developer export data.
- Do not flatten aliases too early; preserve TokenBundle alias objects in JSON.
- Do not make exporters depend on `code.ts`, `ui.html`, or Figma APIs.
- Do not create Button/Input/component generation as part of export work.
- Do not treat `toFlatTokenList` as the final JSON export contract.
- Do not change TokenBundle naming, mode, collection, or alias rules as part of exporter implementation.
- Do not silently coerce TokenBundle raw values beyond existing `normalizeTokenBundle` behavior.

## Open Decision

Developer exports need a canonical source:

- use existing TokenBundle input when supplied, or
- first add a pure generator that creates TokenBundle output from the current foundation/semantic generation settings.

The current plugin generation path cannot yet export the generated foundations as TokenBundle without an additional mapping step.

For that reason, the safest first export should target known TokenBundle input/fixtures, while a separate later task defines how plugin-generated foundations become canonical TokenBundle data.
