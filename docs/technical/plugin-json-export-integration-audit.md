# Plugin JSON Export Integration Audit

## Purpose

This audit describes how the pure TokenDefinition JSON export bridge could be connected to the plugin runtime and UI later.

No integration is implemented here. The current task is to identify the safest future touch points and risks before adding export buttons, copy, download, or runtime message payloads.

## Files inspected

- `packages/plugin-starter-tokens/src/code.ts`
- `packages/plugin-starter-tokens/src/ui.html`
- `packages/plugin-starter-tokens/src/token-definitions-to-token-bundle.ts`
- `packages/plugin-starter-tokens/src/token-definitions-export.ts`
- `packages/plugin-starter-tokens/src/token-definitions-export.test.mjs`
- `packages/exporters/src/index.js`
- `packages/exporters/tests/json-token-bundle.test.mjs`
- `docs/technical/generated-foundations-to-token-bundle-audit.md`
- `docs/technical/developer-export-surface-audit.md`

## Current `applyGeneration` Flow

`applyGeneration(options, progress?)` currently does five broad things:

1. resolves the selected preset and generation inputs
2. assembles plugin-local `TokenDefinition[]`
3. creates or resolves Figma variable collections and modes
4. writes raw values and resolves aliases into Figma variables
5. applies text styles and imports/binds icon components

The complete generated token list exists here:

```ts
const tokens: TokenDefinition[] = [];
tokens.push(...buildPrimitiveTokens(options, preset, brands, shadeSteps));
tokens.push(...buildTypographyTokens(options));
tokens.push(...buildSpacingTokens());
tokens.push(...buildRadiusTokens());
// optionally push color mode tokens
```

This point is after all foundation and optional color-mode tokens are assembled and before any Figma write begins.

## Safest Future Integration Point

The safest future integration point is immediately after token assembly and before Figma collection writes:

```ts
const tokenPhaseMs = Date.now() - tokenPhaseStart;
progress?.(`Tokens préparés (${tokens.length}).`);
```

At this point:

- `tokens` is complete for the selected generation options
- no Figma variables have been created or updated yet
- aliases are still pure runtime token references
- no Figma variable IDs, mode IDs, node IDs, or alias objects have entered the token list

This is the best place to call a future pure bridge such as:

```ts
const exportJson = exportTokenDefinitionsJson(tokens, {
  mapperOptions: {
    source: "figma-plugin",
    generatedAt: new Date().toISOString(),
  },
});
```

Do not call the bridge after alias resolution or icon import. Those later phases introduce Figma runtime objects and failure states that should not affect developer export data.

## Can Tokens Be Captured Without Changing Generation Behavior?

Yes, in principle.

`tokens` is already a local array used by the Figma write loop. Capturing it for export should not require changing the token generation functions, as long as the integration only reads the array and does not mutate token entries.

However, exposing the JSON requires a runtime contract decision:

- include JSON in the existing `generate-result` message
- send a separate `generate-export-ready` message
- store the most recent generated JSON in plugin controller memory and let the UI request it later

The safest option is likely a separate request/response flow after successful generation, not automatic large payload delivery in every `generate-result`.

## UI/Data Flow Recommendation

Recommended staged flow for a future implementation:

1. add an explicit UI option or action for JSON export
2. keep generation unchanged
3. after successful token assembly, prepare JSON only if requested
4. send a small export summary in `generate-result`
5. send or request the full JSON separately

Possible message model:

- UI -> plugin: `generate-variables` with `exportJson: true`
- plugin -> UI: `generate-result` with normal report plus export metadata
- plugin -> UI: `generate-export-json-ready` with `{ filename, json }`

Alternative safer model for large payloads:

- plugin stores `lastGeneratedExportJson` in memory after successful generation
- UI -> plugin: `request-last-json-export`
- plugin -> UI: `json-export-result`

The second model avoids automatically sending large JSON with every generation result and makes copy/download actions explicit.

## Copy JSON to Clipboard

Clipboard copy should happen in the UI layer, not in `code.ts`.

Future flow:

- plugin sends JSON string to UI
- UI calls browser clipboard APIs if available
- UI provides fallback selection/copy UI if clipboard is unavailable in the plugin iframe environment

Risks:

- clipboard permissions can fail silently
- large JSON may exceed comfortable copy UX
- UI should show success/error states independent from variable generation success

## Download JSON File

Download should also happen in the UI layer.

Future flow:

- plugin sends JSON string and suggested filename to UI
- UI creates a `Blob`
- UI creates a temporary object URL
- UI triggers download from an `<a download>`

Filename should be deterministic and safe.

Possible filename:

```text
ombr-tokens-{presetId}-{YYYYMMDD-HHmmss}.json
```

Avoid using unsanitized brand, preset, or file names directly.

## Include Export in Generation Report

Do not place the full JSON string inside `GenerationReport`.

`GenerationReport` is currently a compact status object with counts, warnings, migrations, and collection reports. It is displayed in `reportBox` and clamped by `compactReportForUi`.

Safer report addition later:

```ts
export?: {
  jsonReady: boolean;
  filename: string;
  bytes: number;
  tokenCount: number;
}
```

The full JSON should be a separate message or requested payload.

## Timing and Failure Semantics

There are two possible meanings for export:

1. export generated token intent, even if later Figma writes fail
2. export only after Figma generation succeeds

Recommended first runtime behavior:

- prepare JSON after token assembly
- expose it to the UI only after `applyGeneration` completes successfully

This avoids presenting an export as successful when the corresponding Figma generation failed. It also avoids exporting partial data from a failed generation path.

If future UX wants "export even if Figma write failed", that should be an explicit recovery action with clear messaging.

## Risks To Avoid

### Large Payloads

Generated JSON may be large, especially with many palettes and semantic tokens.

Avoid:

- always sending JSON inside `generate-result`
- writing full JSON into `reportBox`
- duplicating JSON in multiple UI state objects

Prefer:

- explicit request/response
- size metadata
- copy/download actions that handle errors

### Alias Timing

Developer export aliases should come from `TokenDefinition[]`, not from resolved Figma variables.

Avoid:

- exporting after `pendingAliases` are resolved to Figma variables
- using `makeAlias(target)` output
- using Figma variable IDs in JSON

### Partial Tokens

If `applyGeneration` throws during Figma writes, text styles, or icon import, the UI should not automatically offer the export unless the product explicitly defines that recovery path.

### Runtime-Only Figma Data

Do not include:

- variable IDs
- collection IDs
- mode IDs
- node IDs
- text style IDs
- imported SVG node data
- icon component nodes
- collision counters as token metadata

### Export Options

Keep initial options small:

- final newline
- pretty JSON spacing
- filename

Defer:

- minified JSON preset
- include/exclude groups
- CSS/Tailwind target options
- custom naming transforms

### File Naming

Use sanitized deterministic filenames.

Avoid:

- raw preset labels
- raw brand names
- locale-dependent date strings
- spaces and punctuation-heavy names

## What Not To Do Next

- Do not add CSS variables export.
- Do not add Tailwind config export.
- Do not add Style Dictionary or React theme export.
- Do not add Button/Input/component generation.
- Do not convert aliases to Figma references.
- Do not connect export to the main generation button without an explicit UX state.
- Do not modify `applyGeneration` until the message contract and UI state are decided.

## Recommended Smallest Future Implementation Step

Add a runtime integration test seam before adding UI controls.

Suggested future implementation sequence:

1. Add a tiny pure helper around token assembly if needed, so token generation can be tested without Figma writes.
2. Add a plugin-controller-only option shape for `exportJson?: boolean`.
3. In `applyGeneration`, generate JSON after token assembly when requested, but only return export metadata initially.
4. Add a separate message path to request the last JSON payload.
5. Only then add UI copy/download controls.

This keeps the first UI integration reversible and avoids coupling exporter behavior to Figma write success details too early.

## Validation For Future Integration

Before any runtime connection:

```powershell
npm.cmd run test:token-definitions-export
npm.cmd run test:token-bundle-mapper
npm.cmd run test:exporters
npm.cmd run test:ds-core
npm.cmd run test:primitive-tokens
npm.cmd run test:generation-options
npm.cmd run typecheck
```

If `code.ts` or `ui.html` changes, run the plugin build only when that future task explicitly allows it.
