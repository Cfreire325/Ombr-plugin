# Project Learnings

Short, evidenced memory for Ombr Studio. Read this file before structuring product, design-system, architecture, or workflow decisions.

## Index By Area

- product / ux: LRN-001
- design-system / tokens: LRN-002, LRN-003, LRN-006, LRN-007
- ds-core: LRN-002, LRN-003, LRN-007
- plugin-runtime: LRN-001, LRN-002
- apps-web: LRN-001, LRN-005, LRN-006
- exporters: LRN-004
- qa-tests: LRN-002, LRN-003, LRN-004, LRN-005, LRN-006, LRN-007
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

### LRN-006 : Color modes carry intent, not color primitives

Date: 2026-05-04
Area: design-system / tokens; apps-web; qa-tests
Contexte: Ombr needed to correct product logic where the web Creator could make brands and palettes look like light/dark decisions.
DÃ©couverte: Brand colors, palette colors, neutral colors, spacing, and radius are primitives; light/dark intent belongs in semantic aliases / Color Modes, and future component tokens should point to semantics instead of primitives.
Evidence: `apps/web/src/domain/project.ts`; `apps/web/src/domain/token-bundle.ts`; `apps/web/src/domain/token-bundle.test.mjs`; `apps/web/src/views/FoundationsColorsView.tsx`
Impact: UI and exports should preserve the chain `Primitives -> Color Modes / semantic aliases -> future component semantics -> Figma/dev exports`.
Application: Do not add light/dark mapping UI to brand or palette primitive tables. Store editable mode-specific references in the local Color Modes layer, generate semantic `color/*` aliases from it, and cover that boundary with TokenBundle tests.
Status: active

### LRN-007 : Canonical foundation presets start in ds-core

Date: 2026-05-06
Area: design-system / tokens; ds-core; qa-tests
Contexte: The web Creator typography, spacing, and radius MVP model was shorter than the current Figma plugin coverage and needed a shared source before app migration.
Decouverte: Canonical Pixel, Spacing, Radius, and Typography preset coverage belongs in `packages/ds-core` as pure data-only TokenBundle-compatible primitive tokens. Canonical names use slash-case paths like `spacing/md`, `radius/2xl`, and `font-size/text-md`; plugin-style flat names like `spacing-md` are not canonical output names.
Evidence: `packages/ds-core/src/foundation-presets.js`; `packages/ds-core/tests/foundation-presets.test.mjs`; `packages/ds-core/src/index.d.ts`
Impact: Future web, exporter, and adapter work can consume shared preset token data without importing plugin runtime code or inventing parallel names.
Application: Use `CANONICAL_PIXEL_TOKENS`, `CANONICAL_SPACING_TOKENS`, `CANONICAL_RADIUS_TOKENS`, and `CANONICAL_TYPOGRAPHY_TOKENS` for foundation preset defaults and TokenBundle output. Keep spacing/radius aliases pointed to `primitives/pixel/*`, keep `font-weight/*` as `STRING`, and keep Figma text styles as a future adapter concern.
Status: active
