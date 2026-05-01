# Generated Foundations to TokenBundle Audit

## Purpose

This audit defines how the current plugin-generated foundations could become canonical `TokenBundle` output before connecting developer exports to the plugin UI.

No mapper is implemented here. The goal is to make the future mapping boundary explicit and avoid exporting from plugin-local Figma write models.

## Files inspected

- `packages/plugin-starter-tokens/src/code.ts`
- `packages/plugin-starter-tokens/src/presets/types.ts`
- `packages/plugin-starter-tokens/src/presets/primitive-tokens.test.mjs`
- `packages/plugin-starter-tokens/src/presets/semantic-color-modes.test.mjs`
- `packages/plugin-starter-tokens/src/presets/typography-tokens.test.mjs`
- `packages/plugin-starter-tokens/src/presets/spacing-radius-tokens.test.mjs`
- `packages/plugin-starter-tokens/src/presets/bundle-color-modes.test.mjs`
- `packages/ds-core/src/index.d.ts`
- `docs/token-bundle-contract.md`
- `docs/technical/developer-export-surface-audit.md`

## Current Generation Shape

The plugin currently generates plugin-local `TokenDefinition[]` and writes it directly to Figma.

Current token builders:

- `buildPrimitiveTokens`
- `buildTypographyTokens`
- `buildSpacingTokens`
- `buildRadiusTokens`
- `buildColorModeTokens`
- `buildColorModeTokensFromBundle`

Current runtime token shape:

```ts
type TokenDefinition = {
  collection: CollectionName;
  name: string;
  type: "COLOR" | "FLOAT" | "STRING";
  scopes: VariableScope[];
  value?: RuntimeTokenValue;
  modeValues?: Partial<Record<"default" | "light" | "dark", RuntimeTokenValue>>;
};
```

This is a Figma write model, not a `TokenBundle` model.

Current `TokenBundle` entry shape:

```ts
interface TokenEntry {
  name: string;
  type: "COLOR" | "FLOAT" | "STRING";
  values: Record<"light" | "dark", string | number | { alias: string }>;
  scopes?: string[];
  description?: string;
  meta?: Record<string, unknown>;
}
```

The main differences are:

- plugin tokens use Figma collection names; TokenBundle uses `primitives`, `semantic`, and `components`
- plugin tokens can have a single `default` mode; TokenBundle requires both `light` and `dark`
- plugin aliases point to runtime collection names; TokenBundle aliases require collection prefixes
- plugin tokens include Figma scopes; TokenBundle may preserve scopes as strings but should not require Figma runtime objects

## Proposed Mapping

### Primitive Colors

Source:

- `buildPrimitiveTokens`

Plugin collection:

- `COLLECTIONS.primitives` -> `"primitives"`

TokenBundle collection:

- `collections.primitives`

Mapping:

- raw color tokens become `COLOR` entries with both `light` and `dark` set to the same raw value
- primitive aliases become `{ alias: "primitives/<ref>" }`
- scopes can be preserved as strings

Examples:

- `colors/base/white` -> `primitives/colors/base/white`
- `colors/base/black` -> `primitives/colors/base/black`
- `colors/red/500` -> `primitives/colors/red/500`
- `colors/acme-primary/500` -> `primitives/colors/acme-primary/500`
- `colors/brand/500` alias `colors/acme-primary/500` -> `{ alias: "primitives/colors/acme-primary/500" }`
- `colors/gray/500` alias `colors/slate/500` -> `{ alias: "primitives/colors/slate/500" }`
- `opacity/white/50` stays a raw `rgba(...)` color value in primitives

Open detail:

- these tokens are not currently generated with explicit descriptions or metadata

### Pixel Primitives

Source:

- `buildPrimitiveTokens`

TokenBundle collection:

- `collections.primitives`

Mapping:

- `pixel/*` tokens become `FLOAT` entries
- both `light` and `dark` use the same numeric value
- `pixel/full` remains `9999`

Examples:

- `pixel/0` -> `0`
- `pixel/8` -> `8`
- `pixel/256` -> `256`
- `pixel/full` -> `9999`

### Semantic Color Modes

Source:

- `buildColorModeTokens`

Plugin collection:

- `COLLECTIONS.colorModes` -> `"1. color-modes"`

TokenBundle collection:

- `collections.semantic`

Mapping for `uiMode === "both"`:

- each generated semantic token becomes a `COLOR` entry
- `light` and `dark` map from `modeValues.light` and `modeValues.dark`
- primitive aliases become `{ alias: "primitives/<ref>" }`
- legacy semantic aliases become `{ alias: "semantic/<sourceName>" }`

Examples:

- `text/primary`
  - light alias: `primitives/colors/slate/900`
  - dark alias: `primitives/colors/slate/50`
- `bg/primary`
  - light alias: `primitives/colors/base/white`
  - dark alias: `primitives/colors/slate/1100`
- `text/brand`
  - light/dark alias: `semantic/text/accent-primary`

Mapping for `uiMode === "light"` or `"dark"` is unresolved because the TokenBundle contract currently requires both `light` and `dark`.

Options:

- require `uiMode: "both"` for TokenBundle export
- mirror the generated single mode into both TokenBundle modes
- compute both modes for export even when the Figma write target is single-mode

The safest future mapper should probably compute both modes for TokenBundle export without changing Figma write behavior.

### TokenBundle Semantic Input

Source:

- `buildColorModeTokensFromBundle`

Current behavior:

- consumes an existing normalized `TokenBundle`
- maps only `collections.semantic`
- converts TokenBundle aliases into plugin runtime aliases
- does not emit primitives or components

Mapping recommendation:

- if an input `TokenBundle` is supplied, developer JSON export should prefer the normalized input bundle directly
- do not round-trip it through `buildColorModeTokensFromBundle`

### Typography

Source:

- `buildTypographyTokens`

Plugin collection:

- `COLLECTIONS.typography` -> `"6. Typography"`

TokenBundle collection:

- likely `collections.primitives`

Mapping:

- typography foundations should be primitive tokens because they are raw foundation values
- both `light` and `dark` should use the same value
- preserve type and scopes

Examples:

- `font-family/font-family-display` -> `STRING`
- `font-family/font-family-body` -> `STRING`
- `font-size/text-md` -> `FLOAT`
- `line-height/text-md` -> `FLOAT`
- `letter-spacing/text-md` -> `FLOAT`
- `font-weight/regular` -> `STRING`

Open detail:

- whether to keep current token names exactly or introduce a future more compact namespace is a contract decision
- current safest behavior is to preserve names exactly

### Spacing

Source:

- `buildSpacingTokens`

Plugin collection:

- `COLLECTIONS.spacing` -> `"2. spacing"`

TokenBundle collection:

- likely `collections.primitives`

Mapping:

- spacing aliases should become `FLOAT` entries in primitives
- both `light` and `dark` should be `{ alias: "primitives/pixel/<value>" }`
- preserve scopes as strings

Examples:

- `spacing-none` -> `{ alias: "primitives/pixel/0" }`
- `spacing-md` -> `{ alias: "primitives/pixel/8" }`
- `spacing-xl` -> `{ alias: "primitives/pixel/16" }`

Open detail:

- these names are single-segment aliases today, not `spacing/md`
- preserve current names for the first mapper to avoid token churn

### Radius

Source:

- `buildRadiusTokens`

Plugin collection:

- `COLLECTIONS.radius` -> `"3. radius"`

TokenBundle collection:

- likely `collections.primitives`

Mapping:

- radius aliases should become `FLOAT` entries in primitives
- both modes should be `{ alias: "primitives/pixel/<value>" }`
- `radius-full` aliases `primitives/pixel/full`

Examples:

- `radius-none` -> `{ alias: "primitives/pixel/0" }`
- `radius-md` -> `{ alias: "primitives/pixel/8" }`
- `radius-full` -> `{ alias: "primitives/pixel/full" }`

### Icon-Related Tokens

Current state:

- icon import uses `options.icons`
- icon color binding resolves semantic variables
- icon components and stroke weights are runtime Figma operations
- there are no dedicated icon foundation tokens generated as `TokenDefinition[]` beyond semantic icon color tokens from `buildColorModeTokens`

Mapping:

- semantic icon color tokens belong in `collections.semantic`
- imported icon components, pages, variants, SVG content, stroke application, and paint binding should not be included in TokenBundle foundation output

Open detail:

- future icon sizing/stroke tokens could be TokenBundle primitives, but they are not present as generated tokens today

### Component Tokens

Current state:

- `collections.components` exists in the TokenBundle contract
- the plugin does not currently generate first-class component tokens
- `buildColorModeTokensFromBundle` can consume component aliases only as references and routes them to `1. color-modes`

Mapping:

- generated plugin foundations should emit `components: []` for now
- do not invent Button/Input/component tokens in this mapper

## Alias Mapping Rules

Plugin runtime alias:

```ts
{ kind: "alias", ref: "colors/brand/500", collection: "primitives" }
```

TokenBundle alias:

```json
{ "alias": "primitives/colors/brand/500" }
```

Proposed mapping:

- `COLLECTIONS.primitives` -> `primitives/<ref>`
- `COLLECTIONS.colorModes` -> `semantic/<ref>`
- `COLLECTIONS.spacing` -> unresolved, preferably map spacing tokens into `primitives` and use `primitives/<ref>`
- `COLLECTIONS.radius` -> unresolved, preferably map radius tokens into `primitives` and use `primitives/<ref>`
- `COLLECTIONS.typography` -> unresolved, preferably map typography tokens into `primitives` and use `primitives/<ref>` if aliases appear later

Do not map aliases to Figma variable IDs or Figma variable alias objects.

## Gaps and Ambiguous Decisions

### Collection Naming

The contract has only:

- `primitives`
- `semantic`
- `components`

The plugin has separate Figma collections:

- `primitives`
- `1. color-modes`
- `2. spacing`
- `3. radius`
- `6. Typography`

Recommendation:

- map foundation collections into `collections.primitives`
- map color-mode tokens into `collections.semantic`
- leave `collections.components` empty until component generation exists

### Mode Naming

Plugin foundations usually use `default`.

TokenBundle requires:

- `light`
- `dark`

Recommendation:

- map default foundation values to both `light` and `dark`
- for semantic color modes, preserve distinct light/dark when generated
- define explicit behavior for single-mode UI before implementation

### Alias Representation

Plugin aliases use collection names and refs.

TokenBundle aliases use collection-prefixed paths.

Recommendation:

- convert plugin aliases to TokenBundle alias objects
- preserve alias objects in JSON export
- never convert aliases to Figma variable references in TokenBundle output

### Typography Structure

Typography currently emits flat foundation variables.

Recommendation:

- preserve current names and put them in `collections.primitives`
- do not introduce nested typography metadata in the first mapper

### Descriptions

Current plugin-generated tokens do not include descriptions.

Recommendation:

- omit descriptions initially
- add descriptions later only as an intentional TokenBundle enrichment task

### Scopes

Current plugin-generated tokens include Figma scopes.

Recommendation:

- preserve scopes as strings for compatibility
- do not let scopes drive developer exporter semantics

### Metadata

Current plugin-generated tokens do not include metadata.

Potential future metadata:

- source generator: `primitive`, `semantic`, `typography`, `spacing`, `radius`
- preset id
- neutral palette
- naming pattern
- generated brand names

Recommendation:

- omit metadata in the first mapper unless tests explicitly lock it

### Runtime-Only Figma Concepts

Exclude from TokenBundle output:

- Figma collection IDs
- Figma mode IDs
- Figma variable IDs
- Figma variable alias objects
- text style IDs
- imported SVG/icon node data
- plugin progress/report messages
- collision replacement counters
- migration warnings

## Recommended Smallest Safe Implementation Step

Add a pure mapper test harness before connecting any exporter UI.

Suggested first implementation boundary:

- create a pure function that converts plugin-local `TokenDefinition[]` into a `TokenBundle`
- use existing generated fixture tests to supply representative tokens
- map `default` values to both `light` and `dark`
- map plugin aliases into TokenBundle alias objects
- preserve names, types, and scopes
- return all foundation tokens under `collections.primitives`
- return semantic color-mode tokens under `collections.semantic`
- return `collections.components: []`

Suggested function name:

- `tokenDefinitionsToTokenBundle(tokens, options?)`

Preferred future home:

- initially a plugin-side test seam or a small pure module if `TokenDefinition` stays plugin-local
- later `ds-core` only if the input shape becomes core-owned rather than Figma/plugin-owned

Do not connect this to `packages/exporters` or UI until it is behavior-locked.

## Validation For Future Mapper Task

Before implementation, run existing fixture tests:

```powershell
npm.cmd run test:primitive-tokens
npm.cmd run test:semantic-color-modes
npm.cmd run test:typography-tokens
npm.cmd run test:spacing-radius-tokens
npm.cmd run test:ds-core
npm.cmd run test:exporters
npm.cmd run typecheck
```

After implementation, add mapper-specific tests and run the same validation set.

Do not run `npm run build` unless runtime/plugin bundling is intentionally touched.
