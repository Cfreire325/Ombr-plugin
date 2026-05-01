# Ombr Studio Creator — Execution Checklist Phase 0 / Phase 1

## 1. Purpose

This checklist turns the existing product and technical framing documents into a controlled execution path before any code change.

It exists to keep Ombr Studio Creator aligned with the validated product flow, visual direction, MVP boundaries, and migration roadmap. Phase 0 confirms that documentation and safety baselines are in place. Phase 1 prepares `ds-core` strengthening without starting a plugin migration, web app creation, exporter extraction, or Figma adapter extraction.

## 2. Current confirmed baseline

- Backup plugin created.
- Current plugin preserved.
- `docs/product/user-flow-source.md` created.
- `docs/product/visual-direction.md` created.
- Product docs created.
- Technical docs created.
- `apps/web` not created.
- `packages/exporters` not created.
- `packages/figma-adapter` not created.

## 3. Phase 0 — Documentation and safety checklist

- [ ] Verify that the local backup exists.
- [ ] Verify that the backup has been committed/pushed if possible.
- [ ] Verify that `docs/product/user-flow-source.md` exists.
- [ ] Verify that `docs/product/visual-direction.md` exists.
- [ ] Verify that `docs/product/product-vision.md` exists.
- [ ] Verify that `docs/product/mvp-scope.md` exists.
- [ ] Verify that `docs/product/feature-map.md` exists.
- [ ] Verify that `docs/product/ux-principles.md` exists.
- [ ] Verify that `docs/technical/monorepo-target-architecture.md` exists.
- [ ] Verify that `docs/technical/token-bundle-source-of-truth.md` exists.
- [ ] Verify that `docs/technical/figma-import-strategy.md` exists.
- [ ] Verify that `docs/technical/export-strategy.md` exists.
- [ ] Verify that `docs/technical/migration-roadmap.md` exists.
- [ ] Verify that the plugin has not been modified.
- [ ] Verify that `apps/web` does not exist yet.
- [ ] Verify that `packages/exporters` does not exist yet.
- [ ] Verify that `packages/figma-adapter` does not exist yet.

## 4. Phase 0 validation commands

Run these commands before moving from Phase 0 to Phase 1:

```powershell
npm.cmd run test:ds-core
npm.cmd run typecheck
```

Do not make `npm run build` mandatory for Phase 0. Build should only be run when necessary because it may regenerate `dist`.

## 5. Phase 1 — ds-core strengthening checklist

This checklist prepares Phase 1 without executing it yet.

- [ ] Analyze `packages/ds-core`.
- [ ] Analyze `packages/plugin-starter-tokens/src/presets/types.ts`.
- [ ] Identify duplicated TokenBundle-related types.
- [ ] Identify the types that should be centralized in `ds-core`.
- [ ] Identify missing tests around TokenBundle, primitive tokens, semantic tokens, modes, aliases, and generators.
- [ ] Define priority tests for `ds-core`.
- [ ] Prepare a list of pure functions that can be extracted later.
- [ ] Document what must stay in the plugin.
- [ ] Document what must never enter `ds-core`.
- [ ] Prepare a rollback plan before changing any code.

Phase 1 analysis should preserve the product direction:

- V1 remains focused on foundations, semantic tokens, preview, exports, Figma import key, and one-way sync web app -> Figma.
- Visual quality remains guided by precision, structure, clear token tables, preview close to configuration, and safe feedback states.
- Component builder, exporters package, Figma adapter package, and web app creation stay out of Phase 1 execution.

## 6. Phase 1 allowed scope

During the future Phase 1, the allowed scope is:

- Modify only `packages/ds-core` if necessary.
- Add or strengthen `ds-core` tests.
- Add technical documentation.
- Do not touch plugin runtime.
- Do not touch `ui.html`.
- Do not touch the manifest.
- Do not move plugin files.

Any Phase 1 code change should be small, reversible, and validated by `test:ds-core` and `typecheck`.

## 7. Phase 1 forbidden scope

During Phase 1, the following is forbidden:

- Move `code.ts`.
- Move `ui.html`.
- Create `apps/web`.
- Create `packages/exporters`.
- Create `packages/figma-adapter`.
- Change the manifest.
- Modify plugin behavior.
- Launch a monorepo migration.
- Introduce frontend dependencies.

Phase 1 is not a UI implementation phase. It is not an exporter extraction phase. It is not a Figma sync rewrite phase.

## 8. Phase 1 success criteria

Phase 1 can be considered successful when:

- `npm.cmd run test:ds-core` passes.
- `npm.cmd run typecheck` passes.
- No known plugin regression is introduced.
- TokenBundle is better documented.
- Duplicated type risks are identified.
- Priority tests are listed or added.
- No premature web app or exporter package has been created.

If Phase 1 modifies `ds-core`, the changes must remain compatible with the current plugin until a later migration phase explicitly changes plugin integration.

## 9. Phase 1 rollback plan

If Phase 1 introduces risk or instability:

- Use the local backup.
- Use the Git backup commit if available.
- Revert to the previous `ds-core` files.
- Keep useful notes about the failed assumption in documentation.
- Do not manually restore `dist` unless explicitly needed.

Rollback should prefer reverting source changes over editing generated output.

## 10. Next recommended prompt

Recommended prompt for later, when Phase 1 should begin:

```text
Start Phase 1 for Ombr Studio Creator.

Use docs/technical/execution-checklist-phase-0-1.md as the execution checklist.

First, analyze packages/ds-core and packages/plugin-starter-tokens/src/presets/types.ts.
Do not modify code yet.
Summarize:
- current TokenBundle-related types;
- duplicated or overlapping types;
- missing ds-core tests;
- functions that may later be extracted as pure logic;
- what must stay in the plugin;
- rollback risks.

Do not touch code.ts, ui.html, the manifest, apps/web, packages/exporters, or packages/figma-adapter.
```
