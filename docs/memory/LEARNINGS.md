# Project Learnings

Short, evidenced memory for Ombr Studio. Read this file before structuring product, design-system, architecture, or workflow decisions.

## Index By Area

- product / ux: LRN-001
- design-system / tokens: LRN-002, LRN-003
- ds-core: LRN-002, LRN-003
- plugin-runtime: LRN-001, LRN-002
- apps-web: LRN-001, LRN-005
- exporters: LRN-004
- qa-tests: LRN-002, LRN-003, LRN-004, LRN-005
- docs-workflow: LRN-001, LRN-003

## Active Learnings

### LRN-001 : Web app is the primary product surface

Date: 2026-05-03
Area: product / ux; plugin-runtime; apps-web
Contexte: Ombr Studio evolved from a Figma-plugin-led flow toward a standalone creator.
Découverte: V1 product creation belongs in the web app; the Figma plugin should narrow toward import/sync and should not absorb dashboard, project, advanced export, or component-builder scope without explicit milestone validation.
Evidence: `AGENTS.md`; `docs/product/product-vision.md`; `docs/product/mvp-scope.md`; `docs/technical/monorepo-target-architecture.md`
Impact: New UX/product work should avoid growing `packages/plugin-starter-tokens/src/ui.html` as the long-term creator.
Application: For product flows, plan or implement in `apps/web` first unless the task is explicitly plugin import/sync or current plugin stabilization.
Status: active

### LRN-002 : TokenBundle is the shared contract boundary

Date: 2026-05-03
Area: design-system / tokens; ds-core; plugin-runtime; qa-tests
Contexte: The project needs one source model shared by web, plugin, exporters, and future adapters.
Découverte: `TokenBundle` is the central interchange contract; `packages/ds-core` owns validation, normalization, types, aliases, required collections, and light/dark mode rules.
Evidence: `docs/token-bundle-contract.md`; `docs/technical/token-bundle-source-of-truth.md`; `packages/ds-core/src/index.d.ts`; `packages/ds-core/tests/token-bundle.test.mjs`
Impact: Apps and adapters derive target payloads from TokenBundle instead of creating parallel product schemas.
Application: Any contract change must include ds-core impact review, tests, and version/migration thinking when non-backward-compatible.
Status: active

### LRN-003 : Normalized token names are canonical slash-case

Date: 2026-05-03
Area: design-system / tokens; ds-core; qa-tests; docs-workflow
Contexte: Current validation accepts raw names that can normalize cleanly, while the contract requires canonical output names.
Découverte: Raw input may remain permissive for compatibility, but normalized TokenBundle output must use slash-case path structure with kebab-case segments; duplicate checks happen after normalization.
Evidence: `docs/technical/tokenbundle-naming-decision.md`; `docs/token-bundle-contract.md`; `packages/ds-core/tests/token-bundle.test.mjs`; `packages/ds-core/tests/naming.test.mjs`
Impact: Exporters, web app, and future Figma adapter should consume normalized names, not raw input names.
Application: Do not tighten naming validation without schema/version review, migration notes, and aligned docs/tests.
Status: active

### LRN-004 : Exporters are pure TokenBundle transformations

Date: 2026-05-03
Area: exporters; qa-tests
Contexte: Developer export work needs to stay independent from Figma runtime and UI surfaces.
Découverte: `packages/exporters` currently implements deterministic JSON export by normalizing TokenBundle data through `@starter-tokens/ds-core`; CSS and Tailwind exports remain future work.
Evidence: `packages/exporters/package.json`; `packages/exporters/src/index.js`; `packages/exporters/tests/json-token-bundle.test.mjs`; `docs/technical/monorepo-target-architecture.md`
Impact: Exporter logic should not depend on plugin UI, `code.ts`, `ui.html`, Figma APIs, or web routes.
Application: Add export targets as pure string/file generators from normalized TokenBundle data with focused exporter tests.
Status: active

### LRN-005 : apps/web exists as a local-first Vite shell

Date: 2026-05-03
Area: apps-web; product / ux; qa-tests
Contexte: Earlier plans described `apps/web`; the repo now contains an implementation shell.
Découverte: `apps/web` is a React/Vite/TypeScript workspace that depends on `@starter-tokens/ds-core` and `@starter-tokens/exporters`, persists local projects, and builds a minimal color TokenBundle without importing plugin runtime code.
Evidence: `package.json`; `apps/web/package.json`; `apps/web/src/domain/project.ts`; `apps/web/src/domain/token-bundle.ts`; `apps/web/src/storage/local-projects.ts`; `apps/web/src/domain/token-bundle.test.mjs`
Impact: Docs that say `apps/web` does not exist are stale and should not be treated as current implementation evidence.
Application: When working on the web app, preserve the local-first shell and shared-package dependency boundary; update stale architecture notes during the next consolidation.
Status: active
