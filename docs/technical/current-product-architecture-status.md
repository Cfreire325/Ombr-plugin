# Current Product Architecture Status

Date: 2026-05-01

## Purpose

This note recovers the current architecture state after recent work focused on the Figma plugin, `ds-core`, TokenBundle mapping, and JSON export. It compares the repository reality against the intended direction:

- Web app: primary product surface where users create, configure, preview, save, and export a design system.
- Figma plugin: importer/sync bridge that receives a generated TokenBundle and writes it into Figma variables, styles, and later components.
- `ds-core`: shared token logic, validation, normalization, naming, and TokenBundle contracts.
- `exporters`: developer-facing exports, starting with JSON and later CSS/Tailwind/etc.

This is documentation-only. No runtime code was changed.

## Files Inspected

Repository and package structure:

- `README.md`
- `AGENTS.md`
- `package.json`
- `manifest.json`
- `apps/docs/README.md`
- `apps/docs/ownership-rules.md`
- `packages/ds-core/package.json`
- `packages/ds-core/src/index.js`
- `packages/ds-core/src/index.d.ts`
- `packages/ds-core/src/color-utils.js`
- `packages/ds-core/src/palette-steps.js`
- `packages/ds-core/src/naming.js`
- `packages/exporters/package.json`
- `packages/exporters/src/index.js`
- `packages/exporters/tests/json-token-bundle.test.mjs`
- `packages/plugin-starter-tokens/package.json`
- `packages/plugin-starter-tokens/README.md`
- `packages/plugin-starter-tokens/manifest.json`
- `packages/plugin-starter-tokens/tsconfig.json`
- `packages/plugin-starter-tokens/src/code.ts`
- `packages/plugin-starter-tokens/src/ui.html`
- `packages/plugin-starter-tokens/src/presets/color-utils.ts`
- `packages/plugin-starter-tokens/src/token-definitions-to-token-bundle.ts`
- `packages/plugin-starter-tokens/src/token-definitions-export.ts`
- `packages/plugin-starter-tokens/src/json-export-controller.test.mjs`

Product and architecture docs:

- `docs/product/product-vision.md`
- `docs/product/mvp-scope.md`
- `docs/product/user-flow-source.md`
- `docs/product/feature-map.md`
- `docs/product/ux-principles.md`
- `docs/product/visual-direction.md`
- `docs/shared-source-of-truth-plan.md`
- `docs/source-of-truth.md`
- `docs/token-bundle-contract.md`
- `docs/dev-export-strategy.md`
- `docs/technical/monorepo-target-architecture.md`
- `docs/technical/migration-roadmap.md`
- `docs/technical/token-bundle-source-of-truth.md`
- `docs/technical/tokenbundle-naming-decision.md`
- `docs/technical/export-strategy.md`
- `docs/technical/developer-export-surface-audit.md`
- `docs/technical/generated-foundations-to-token-bundle-audit.md`
- `docs/technical/plugin-json-export-integration-audit.md`
- `docs/technical/pure-logic-extraction-inventory.md`
- `docs/technical/phase-1-behavior-lock-checkpoint.md`
- `docs/technical/build-brand-scale-extraction-note.md`
- `docs/technical/palette-step-extraction-note.md`
- `docs/technical/palette-key-normalization-extraction-note.md`
- `docs/technical/preset-lookup-extraction-note.md`

Searches also checked for common web app entrypoints:

- `apps/web`
- `packages/web`
- `app/`
- `pages/`
- `src/App.*`
- `vite.config.*`
- `next.config.*`
- React/Next/Vite-style `main.*` and `index.html` entrypoints
- package scripts such as `dev`, `start`, `web`, and `app`

## Repo Structure Summary

Current active top-level structure:

```text
.
├── apps/
│   └── docs/
├── docs/
│   ├── agents/
│   ├── product/
│   └── technical/
├── legacy/
│   └── root-plugin/
├── packages/
│   ├── ds-core/
│   ├── exporters/
│   └── plugin-starter-tokens/
├── assets/
├── backups/
├── manifest.json
├── package.json
└── README.md
```

The root `package.json` currently declares workspaces only for:

```json
["packages/*"]
```

There is no active app workspace under `apps/*`.

## Does A Web App Exist Today?

No. There is no actual web app package today.

Evidence:

- No `apps/web` directory exists.
- No `packages/web` directory exists.
- No root-level `app/` or `pages/` app directory exists.
- No `src/App.*`, `vite.config.*`, `next.config.*`, `index.html`, or React/Vite/Next entrypoint was found for a web app.
- Root scripts contain plugin, `ds-core`, and exporter commands, but no `dev`, `start`, `web`, or app-specific script.
- `apps/` contains only `apps/docs`, which is documentation.

The current implemented product surface is the Figma plugin UI in `packages/plugin-starter-tokens/src/ui.html`.

## Where The Web App Plan Is Documented

The web app direction is documented clearly in newer product and technical docs:

- `docs/product/product-vision.md`
  - Defines Ombr Studio Creator as a web app for building design systems.
  - Says the web app is the main product surface.
  - Says the Figma plugin progressively becomes importer/synchronizer.

- `docs/product/user-flow-source.md`
  - Defines the web app as the primary interface.
  - Lists public website, auth/guest mode, dashboard, new project, Creator workspace, preview, exports, Figma import key, and one-way sync.

- `docs/product/mvp-scope.md`
  - Defines V1 as local design system creation, foundations, semantic tokens, preview, JSON/CSS/Tailwind exports, Figma import key, and one-way web app -> Figma sync.

- `docs/product/feature-map.md`
  - Assigns MVP product areas to `apps/web`, `packages/ds-core`, `packages/exporters`, `packages/figma-adapter`, and `apps/figma-plugin`.

- `docs/technical/monorepo-target-architecture.md`
  - Defines target structure with `apps/web`, `apps/figma-plugin`, `packages/ds-core`, `packages/exporters`, and `packages/figma-adapter`.
  - States `apps/web` is the future primary product interface.
  - States `apps/figma-plugin` should be importer/synchronizer, not full product creator.

- `docs/technical/migration-roadmap.md`
  - Places `apps/web` creation in Phase 6.
  - Places plugin narrowing into importer behavior in Phase 8.
  - Places final move to `apps/figma-plugin` in Phase 9.

- `docs/technical/token-bundle-source-of-truth.md`
  - States directly: the web app creates and edits TokenBundle data; exporters transform it; the Figma adapter transforms it into Figma variables, collections, modes, and aliases.

Important older-direction document:

- `docs/shared-source-of-truth-plan.md`
  - Still describes a more Figma-first product loop where the designer defines the DS in Figma and the plugin generates/normalizes/exports.
  - This conflicts with the newer web-app-primary product direction.
  - Treat it as important historical architecture context, but not the current product target unless the user revalidates it.

## Current State Of The Figma Plugin

The active Figma plugin lives in:

- `packages/plugin-starter-tokens/src/code.ts`
- `packages/plugin-starter-tokens/src/ui.html`
- `packages/plugin-starter-tokens/dist/*`

The root `manifest.json` points Figma to:

- `main`: `packages/plugin-starter-tokens/dist/code.js`
- `ui`: `packages/plugin-starter-tokens/dist/ui.html`

Current plugin responsibilities include:

- Wizard-style UI for generating design system foundations.
- Figma variable collection and mode creation.
- Primitive, typography, spacing, radius, and semantic color-mode token generation.
- Text style generation/binding.
- Icon import/binding behavior.
- Optional TokenBundle input path for semantic tokens.
- JSON export controls in the plugin UI.
- JSON export controller state and `request-last-json-export` messaging.
- Fallback behavior when no `tokenBundle` is supplied.

Current plugin reality:

- The plugin is acting as the main product UI today.
- Some of that was useful for behavior discovery and foundation generation.
- If the web app is the intended product surface, the plugin UI should now stop growing into dashboard/project/editor/export-product territory.

## Current State Of ds-core

`packages/ds-core` exists and is active.

It currently owns:

- TokenBundle constants and types.
- `validateTokenBundle`
- `normalizeTokenBundle`
- `toFlatTokenList`
- `createPluginInputFromTokenBundle`
- `normalizeTokenName`
- `isSlashCaseTokenName`
- `normalizePaletteKey`
- color utilities such as `parseColorInput`, `rgbaToHex`, `colorWithAlpha`, and `sanitizeKebabSegment`
- `buildBrandScale`
- palette and preset step helpers such as `deriveShadeSteps`, `basePatternSteps`, `resolveBaseStep`, `getPaletteSteps`, and `resolveClosestPaletteStep`

This is already useful for a future web app because it provides the shared contract and several pure helpers.

But `ds-core` is not yet a complete web-app-ready product engine:

- It does not own a full project model.
- It does not own dashboard/project persistence.
- It does not own complete foundation generators for colors, typography, spacing, radius, widths, containers, and icons as canonical TokenBundle output.
- Several generator behaviors still live in plugin `code.ts`.
- It does not own validation concepts such as full semantic completeness, contrast checks, or export readiness.

## Current State Of Exporters

`packages/exporters` exists now.

It currently provides:

- `exportTokenBundleJson(input, options)`
- normalization through `@starter-tokens/ds-core`
- deterministic pretty JSON output
- optional final newline behavior
- tests in `packages/exporters/tests/json-token-bundle.test.mjs`

This is a good web-app-ready foundation because it is pure, TokenBundle-based, and independent from Figma runtime code.

Current limits:

- JSON is the only implemented exporter.
- CSS variables export is documented but not implemented.
- Tailwind config export is documented but not implemented.
- There is no file/package export UI outside the plugin.
- Older docs such as `docs/technical/developer-export-surface-audit.md` and `docs/technical/phase-1-behavior-lock-checkpoint.md` say `packages/exporters` does not exist yet; those statements are now stale.

## Current State Of Figma Adapter

There is no `packages/figma-adapter` package today.

Adapter-like logic currently lives inside `packages/plugin-starter-tokens/src/code.ts`, especially:

- TokenBundle semantic entry mapping into plugin runtime tokens.
- runtime alias conversion.
- Figma collection/mode lookup and creation.
- variable upsert/write behavior.
- alias resolution into Figma variable references.
- text style and icon runtime behavior.

The target architecture says this should eventually move behind a Figma adapter boundary, but it has not happened yet.

## Recent Completed Work Classification

### Shared/core

Useful shared work:

- TokenBundle validation and normalization in `packages/ds-core`.
- Canonical slash-case naming and permissive raw-name normalization.
- Color utilities moved behind `ds-core` exports.
- Brand scale and palette/preset step helpers now available through `ds-core`.
- `normalizePaletteKey` now available through `ds-core`.
- TokenBundle fixture and tests.

This supports the web app direction.

### Exporter/shared

Useful exporter work:

- `packages/exporters` exists.
- JSON TokenBundle export exists.
- Exporter tests prove JSON output equals normalized TokenBundle data and preserves aliases, scopes, descriptions, and metadata.

This supports the web app direction.

### Plugin-specific

Plugin-only work:

- Figma variable generation and collection/mode mutation.
- Text style creation/binding.
- Icon import/binding.
- Plugin wizard UI.
- Plugin report UI.
- Plugin-specific JSON export UI controls.
- `request-last-json-export` plugin message flow.
- Runtime state for last generated JSON export.

This is valuable for the current plugin but should not become the long-term primary product surface.

### Web-app-ready foundation

Work already usable by a future web app:

- TokenBundle contract and docs.
- `ds-core` normalization and validation.
- `ds-core` naming and palette/color helpers.
- `packages/exporters` JSON output.
- `tokenDefinitionsToTokenBundle` as a useful migration/bridge concept, though its current input shape is plugin-local.
- Product docs defining dashboard, project flow, Creator workspace, preview, export, and Figma sync.

### Potentially misplaced plugin UI work

Potentially misplaced if continued:

- Adding richer product creation, project management, preview, or export workflows inside `src/ui.html`.
- Treating plugin JSON export UI as the main developer export experience.
- Adding dashboard-like state to the plugin.
- Expanding Expert Mode/component generation in plugin before web app, `ds-core`, and exporter boundaries are stable.

The existing work is not wasted, but further expansion should be constrained.

## What Should Remain In The Figma Plugin

Keep in the plugin:

- Figma plugin manifest and entrypoints.
- Minimal import/sync UI.
- Paste/import key or payload handoff from the web app.
- Progress, success, warning, and failure states for Figma writes.
- Figma API calls and runtime permissions.
- Figma variable, collection, mode, style, and later component creation.
- Runtime fallback only while the web app is not ready.

## What Should Move To Or Be Owned By The Web App

Own in `apps/web`:

- Public website and product onboarding.
- Auth/guest mode.
- Local dashboard and project list.
- New project flow.
- Project metadata and persistence.
- Creator workspace.
- Foundation editors for colors, typography, spacing, radius, widths, containers, and icons.
- Primitive and semantic token editing.
- Preview surfaces.
- Export UI for JSON, CSS variables, Tailwind, and Figma import handoff.
- Figma connection/sync status from the product user's perspective.

## What Should Stay Shared In ds-core

Keep or move into `ds-core`:

- TokenBundle schema/types/constants.
- Naming normalization and validation.
- Alias model and validation.
- Mode model.
- Pure foundation generation helpers.
- Product-neutral preset data/helpers.
- Serialization-safe token generation output.
- Validation useful across web, exporters, and Figma import.

Do not move into `ds-core`:

- Figma API calls.
- Web routes/views.
- Plugin UI state.
- Dashboard state.
- file download/copy UI behavior.
- auth/storage adapters.

## What Should Stay In Exporters

Keep in `packages/exporters`:

- JSON TokenBundle export.
- Future CSS variables export.
- Future Tailwind config export.
- Future TypeScript metadata export.
- Target-specific export options.
- Deterministic string/file content generation.

Exporters should consume normalized TokenBundle data and must not depend on plugin UI, `code.ts`, `ui.html`, or Figma APIs.

## What Should Not Be Expanded Further In Plugin UI

Pause plugin UI expansion for:

- Dashboard.
- Project creation and persistence.
- Full token table editors.
- Rich preview surfaces.
- Advanced export center.
- CSS/Tailwind export UX as the main product experience.
- Auth/guest flows.
- Version history.
- Import-from-Figma product flows.
- Bidirectional sync/conflict UI.
- Component builder, Button/Input generation, or Expert Mode expansion unless explicitly reactivated.

The plugin can keep minimal controls needed to validate current behavior, but new product UX should be planned for `apps/web`.

## Comparison Against Intended Product Direction

Current implementation:

- Plugin is the only real app UI.
- `ds-core` exists and is increasingly useful.
- `exporters` exists with JSON export only.
- Web app is documented but not implemented.
- Figma adapter is documented but not implemented.
- Plugin still contains several product-level generators and adapter-like runtime logic.

Intended direction:

- Web app becomes the primary design system creation surface.
- Plugin narrows to import/sync bridge.
- `ds-core` owns canonical token logic.
- `exporters` owns developer outputs.
- Future `figma-adapter` owns TokenBundle-to-Figma mapping.

Conclusion:

The repository is partially aligned at the shared-core/exporter layer, but not yet aligned at the product surface layer. Recent work made the future web app more feasible, but the only implemented UI still lives in the Figma plugin.

## Recommended Next Implementation Step

Smallest safe next step:

1. Create a short `apps/web` implementation plan before scaffolding runtime code.
2. Define the V1 web app data flow around TokenBundle:
   - local project metadata
   - project settings
   - foundation inputs
   - generated TokenBundle
   - preview state
   - export state
   - Figma import handoff
3. Decide the first web app MVP screen sequence:
   - dashboard
   - new project
   - Creator shell
   - foundations/colors first
   - JSON export
4. Then scaffold `apps/web` as a minimal app that imports only `@starter-tokens/ds-core` and `@starter-tokens/exporters`.

Do not start by moving plugin UI into the web app. The safer move is to define a small web app shell that consumes shared packages, then gradually extract reusable generation logic from the plugin into `ds-core` as each web screen needs it.

## Risks If Plugin UI Continues As Main Product Surface

- Product architecture stays shaped by Figma runtime constraints.
- Web app dashboard/project/persistence decisions get delayed or duplicated.
- Export UX becomes plugin-specific instead of product-level.
- Token creation logic may remain coupled to Figma write models.
- `ds-core` may stop short of becoming the true source contract.
- Future `apps/web` may be tempted to import plugin code, which target architecture explicitly forbids.
- CSS/Tailwind/export behavior may drift from TokenBundle if built around plugin-local `TokenDefinition[]`.
- User expectations may blur: the plugin appears to be the product, while the product plan says it should be the bridge.
- Component/Expert Mode work may pull the project into V2 before V1 web app foundations exist.

## Status Summary

Web app:

- Does not exist today.
- Planned clearly in `docs/product/*` and `docs/technical/monorepo-target-architecture.md`.

Figma plugin:

- Exists and is active.
- Currently carries the main implemented UX.
- Should be narrowed toward import/sync once the web app begins.

`ds-core`:

- Exists and is useful.
- Already owns TokenBundle validation/normalization and several pure helpers.
- Still needs more product-level foundation generation and validation before it can fully power the web app.

`exporters`:

- Exists.
- JSON TokenBundle export is implemented.
- CSS/Tailwind are planned but absent.

Roadmap/schema locations:

- Current web-app-primary product roadmap: `docs/product/product-vision.md`, `docs/product/user-flow-source.md`, `docs/product/mvp-scope.md`, `docs/product/feature-map.md`.
- Target architecture: `docs/technical/monorepo-target-architecture.md`.
- Migration sequence: `docs/technical/migration-roadmap.md`.
- TokenBundle source-of-truth: `docs/technical/token-bundle-source-of-truth.md` and `docs/token-bundle-contract.md`.

Recommended next move:

- Plan and then scaffold `apps/web` as a minimal web product shell that depends only on shared packages, while pausing advanced plugin UI expansion.
