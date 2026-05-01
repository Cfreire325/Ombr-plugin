# Ombr Studio Creator - Migration Roadmap

This roadmap is progressive and documentation-level. It does not authorize immediate migration work by itself.

## Phase 0 - backup + docs only

Objective:

- Establish product and technical direction without changing runtime behavior.

Files concerned:

- `docs/product/user-flow-source.md`.
- `docs/product/product-vision.md`.
- `docs/product/mvp-scope.md`.
- `docs/product/feature-map.md`.
- `docs/product/ux-principles.md`.
- `docs/technical/*.md`.

Risks:

- Over-specifying architecture before implementation starts.
- Letting docs imply features are already built.

Tests to launch:

- No build required for docs-only changes.
- Markdown review and link/path review.

Validation criteria:

- Docs separate V1 from V2.
- Docs do not modify plugin behavior.
- Docs do not create `apps/web`, `packages/exporters`, or `packages/figma-adapter`.

Rollback possible:

- Revert only the docs added in Phase 0.
- Keep `user-flow-source.md` and `visual-direction.md` if they remain validated sources.

## Phase 1 - reinforce ds-core

Objective:

- Make `ds-core` the stable home for TokenBundle and pure token logic.

Files concerned:

- `packages/ds-core`.
- Existing token contract docs.
- Tests around token structures and generators.

Risks:

- Duplicating types instead of consolidating them.
- Moving plugin-specific assumptions into core.

Tests to launch:

- `npm run typecheck`.
- `npm run test:ds-core`.

Validation criteria:

- TokenBundle contract is stable.
- Core has no Figma API dependency.
- Core has no web or plugin UI dependency.

Rollback possible:

- Revert `ds-core` contract changes if plugin or tests reveal incompatibility.
- Keep documentation notes about the failed assumption for the next attempt.

## Phase 2 - extract pure utilities

Objective:

- Move reusable pure helpers out of plugin-specific code when they are product-level logic.

Files concerned:

- Current pure utility files in plugin code.
- `packages/ds-core` utilities.
- Related tests.

Risks:

- Extracting runtime-coupled code too early.
- Breaking plugin behavior while moving helpers.

Tests to launch:

- `npm run typecheck`.
- `npm run test:ds-core`.
- Plugin tests if available.

Validation criteria:

- Extracted utilities are pure.
- Plugin still works with the extracted helpers.
- No UI files are moved into core.

Rollback possible:

- Move utility usage back to the plugin while preserving tests that describe expected behavior.
- Avoid deleting original helpers until extracted replacements are verified.

## Phase 3 - extract pure generators

Objective:

- Move foundation generators that are independent from UI and Figma runtime into shared core.

Files concerned:

- Color palette generation.
- Typography token generation.
- Spacing generation.
- Radius generation.
- Semantic token generation helpers.
- `packages/ds-core`.

Risks:

- Changing generated token names or values unintentionally.
- Losing preset compatibility.

Tests to launch:

- `npm run typecheck`.
- `npm run test:ds-core`.
- Snapshot or fixture tests for generated tokens.

Validation criteria:

- Generated output remains stable or changes are intentional and documented.
- Generators accept explicit input and return serializable data.
- Plugin can consume generated data without owning generator logic.

Rollback possible:

- Restore generator calls to the previous plugin-owned implementation.
- Keep fixtures showing the output mismatch that triggered rollback.

## Phase 4 - adapt plugin to ds-core

Objective:

- Make the current plugin consume `ds-core` contracts where safe.

Files concerned:

- Existing plugin source files.
- `plugin-starter-tokens/src/presets/types.ts`.
- `packages/ds-core`.

Risks:

- Runtime bundling issues.
- Type mismatch between plugin-specific and core contracts.
- Accidental UI changes.

Tests to launch:

- `npm run typecheck`.
- `npm run test:ds-core`.
- `npm run build` because plugin runtime or build pipeline may be touched.

Validation criteria:

- Plugin behavior remains stable.
- Duplicate product types are reduced.
- Plugin-specific runtime types remain in plugin code.

Rollback possible:

- Revert plugin imports back to existing local types.
- Keep `ds-core` improvements only if they remain unused and harmless.

## Phase 5 - create packages/exporters

Objective:

- Add export package for JSON, CSS variables, and Tailwind config.

Files concerned:

- `packages/exporters`.
- `packages/ds-core`.
- Export tests and fixtures.

Risks:

- Exporters depending on app or plugin code.
- Unstable naming.
- Divergence between export targets.

Tests to launch:

- `npm run typecheck`.
- Exporter unit tests.
- `npm run test:ds-core`.

Validation criteria:

- Exporters consume TokenBundle.
- JSON, CSS variables, and Tailwind config outputs are stable.
- No plugin UI or Figma runtime dependency exists in exporters.

Rollback possible:

- Remove `packages/exporters` from consumers while keeping docs and fixtures.
- Fall back to existing export behavior until target outputs are stable.

## Phase 6 - create apps/web

Objective:

- Create the web app as the primary product interface.

Files concerned:

- `apps/web`.
- `packages/ds-core`.
- `packages/exporters`.
- Product docs.

Risks:

- Rebuilding too much at once.
- Coupling web app to plugin code.
- Overbuilding V2 features before V1 is usable.

Tests to launch:

- `npm run typecheck`.
- Web app tests when available.
- Exporter tests.
- `npm run test:ds-core`.

Validation criteria:

- Web app can run independently from plugin code.
- Guest mode, dashboard, new project, foundations, semantic tokens, preview, and exports follow MVP scope.
- No dependency on plugin entrypoints.

Rollback possible:

- Keep `apps/web` isolated and remove it from workspace scripts if it blocks current plugin work.
- Do not change plugin behavior while the web app is still experimental.

## Phase 7 - create packages/figma-adapter

Objective:

- Isolate TokenBundle-to-Figma mapping logic.

Files concerned:

- `packages/figma-adapter`.
- `packages/ds-core`.
- Existing plugin import/sync code.

Risks:

- Hiding Figma API side effects inside generic code.
- Mixing adapter logic with plugin UI.
- Incomplete alias or mode mapping.

Tests to launch:

- `npm run typecheck`.
- Adapter unit tests with mocked Figma concepts.
- `npm run test:ds-core`.
- `npm run build` if plugin integration is touched.

Validation criteria:

- Adapter maps TokenBundle to variables, collections, modes, and aliases.
- Adapter does not contain plugin UI.
- Plugin can call adapter behavior through a narrow interface.

Rollback possible:

- Stop consuming `packages/figma-adapter` from the plugin and restore previous plugin-local mapping.
- Preserve adapter tests as documentation of the intended mapping.

## Phase 8 - transform plugin into importer

Objective:

- Narrow the plugin toward importing and synchronizing from web app source data.

Files concerned:

- Plugin UI.
- Plugin controller code.
- `packages/figma-adapter`.
- `packages/ds-core`.

Risks:

- Removing existing plugin creation features before the web app is ready.
- Confusing users if import key flow is not clear.
- Sync state mismatch between web app and Figma.

Tests to launch:

- `npm run typecheck`.
- `npm run test:ds-core`.
- Adapter tests.
- `npm run build`.
- Manual Figma plugin smoke test.

Validation criteria:

- Plugin imports TokenBundle data.
- Plugin creates variables, collections, and modes.
- V1 remains one-way web app -> Figma.
- Sync completion and failure states are visible.

Rollback possible:

- Restore previous plugin creation flow if importer behavior is not stable.
- Keep importer work behind an explicit experimental path until validated.

## Phase 9 - move plugin to apps/figma-plugin when stable

Objective:

- Move the plugin into the target monorepo app structure only after the importer flow is stable.

Files concerned:

- Current plugin root.
- `apps/figma-plugin`.
- Build config.
- Manifest paths.
- Documentation.

Risks:

- Breaking manifest paths.
- Breaking distribution output.
- Losing current plugin build behavior.

Tests to launch:

- `npm run typecheck`.
- `npm run test:ds-core`.
- Adapter tests.
- `npm run build`.
- Manifest/dist verification.
- Manual Figma plugin smoke test.

Validation criteria:

- Plugin builds from `apps/figma-plugin`.
- Manifest and dist are correct.
- Runtime behavior matches the stable importer flow.
- Old paths are removed only after the move is validated.

Rollback possible:

- Move the plugin back to the previous root location.
- Restore previous manifest and build paths from backup.
- Do not delete old plugin paths until the new app location passes build and manual smoke tests.
