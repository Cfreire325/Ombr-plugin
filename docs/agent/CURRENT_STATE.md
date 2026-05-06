# Current State

## Project Snapshot

Ombr Studio is a Figma plugin and future web Creator for building design system foundations that can be shared between Figma and code. The current foundation scope includes primitive palettes, tokens, semantic aliases, light/dark modes, typography, spacing, radius, icons, and JSON exports. Broader developer exports and generated components are later milestones.

The repo is a monorepo with active packages for the Figma plugin, shared design-system core logic, pure exporters, and an initial web app shell.

## Current Focus

- Stabilize the current web Creator foundations model and generation behavior.
- Preserve and strengthen shared TokenBundle boundaries.
- Continue the web-app-primary direction without importing plugin runtime code into `apps/web`.
- Keep exporters pure and TokenBundle-based.
- Continue foundations UI work in small passes before adding exporter or Figma sync scope.
- Preserve the color architecture chain: primitives first, Color Modes / semantic aliases for light/dark intent, future component tokens later.

Unknown / not verified yet:

- Whether the next implementation milestone after Color Modes MVP is Color Modes refinement, component semantics, exporter MVP, or another task.

Verified local uncommitted work from `git status --short` on 2026-05-06:

- `apps/web` has uncommitted web Creator preview changes on top of the committed foundations work.
- `apps/web/src/views/FoundationsPreviewView.tsx` is new/untracked.
- `apps/web/src/views/CreatorShell.tsx`, `apps/web/src/styles.css`, `docs/agent/CURRENT_STATE.md`, and `docs/agent/PROJECT_LOG.md` are modified by the preview pass.

## Current Architecture

- `packages/plugin-starter-tokens` contains the active Figma plugin runtime, plugin UI, Figma API calls, plugin package manifest, build scripts, presets, and plugin-specific tests.
- `packages/ds-core` contains pure TokenBundle logic, validation, normalization, naming helpers, palette/color helpers, fixtures, and tests. It must remain independent from Figma APIs and UI runtimes.
- `packages/exporters` contains pure developer export logic. It currently has JSON TokenBundle export support and depends on `@starter-tokens/ds-core`.
- `apps/web` contains a local-first React/Vite/TypeScript shell for the future Ombr Studio Creator. It depends on `@starter-tokens/ds-core` and `@starter-tokens/exporters`.
- `docs` contains product, architecture, technical, memory, and agent documentation.
- `legacy/root-plugin` and `backups` are historical references, not active implementation by default.

## Recently Completed Work

From repo documentation and package evidence:

- `apps/web` exists as a local-first Vite/React shell.
- `packages/ds-core` owns TokenBundle validation/normalization and naming tests.
- `packages/exporters` exists and provides JSON TokenBundle export with tests.
- The root Figma `manifest.json` points to `packages/plugin-starter-tokens/dist/code.js` and `packages/plugin-starter-tokens/dist/ui.html`.
- Agent memory structure was initialized in `docs/agent` on 2026-05-03.
- A reusable session closeout routine exists at `docs/agent/SESSION_CLOSEOUT_SKILL.md`.
- Anti-regression and memory consolidation docs exist under `docs/memory`.
- `apps/web` now normalizes/repairs local `LocalProject` color-foundation data at the storage boundary and validates color values before TokenBundle generation.
- `apps/web` now includes domain-level `LocalProject` defaults, normalization, and validation for typography, spacing, and radius foundations.
- `apps/web` now maps typography, spacing, and radius foundations into TokenBundle primitive tokens.
- `apps/web` now exposes minimal Creator UI editing views for typography, spacing, and radius foundations.
- `apps/web` now separates color primitives from Color Modes in the colors UI and TokenBundle semantic aliases.
- `apps/web` now stores minimal editable Color Modes in `LocalProject` and generates semantic `color/*` aliases from that local model.
- `apps/web` now validates Color Mode light/dark references against generated color primitives before TokenBundle generation and shows unknown primitive references inline in the Color Modes editor.
- `apps/web` now includes a MVP Preview view showing foundations together across light/dark surfaces: semantic colors, typography, spacing, radius, and a sample action button.

Unknown / not verified yet:

- Whether all non-web package tests currently pass on this machine.

## Important Decisions

- `LRN-001`: Web app is the primary product surface; the Figma plugin should narrow toward import/sync over time.
- `LRN-002`: TokenBundle is the shared contract boundary across web, plugin, exporters, and future adapters.
- `LRN-003`: Normalized TokenBundle output names are canonical slash-case with kebab-case segments.
- `LRN-004`: Exporters are pure TokenBundle transformations and must not depend on plugin UI or Figma runtime code.
- `LRN-005`: `apps/web` exists as a local-first Vite shell and should preserve shared-package boundaries.
- `LRN-006`: Color primitives do not carry intent or light/dark mapping; Color Modes / semantic aliases do.

## Files/Directories To Know

- `AGENTS.md`: stable instructions for AI agents.
- `docs/agent/CURRENT_STATE.md`: quick handoff of current project state.
- `docs/agent/PROJECT_LOG.md`: concise session history.
- `docs/agent/CODEX_HANDOFF_TEMPLATE.md`: template for future handoffs.
- `docs/memory/LEARNINGS.md`: active durable learnings and decision constraints.
- `docs/memory/bug-registry.md`: anti-regression memory for verified bugs and monitored incidents.
- `docs/memory/consolidation-log.md`: memory consolidation history.
- `docs/source-of-truth.md`: source-of-truth hierarchy and active vs legacy paths.
- `docs/token-bundle-contract.md`: TokenBundle contract.
- `docs/technical/current-product-architecture-status.md`: architecture status snapshot from 2026-05-01.
- `docs/technical/monorepo-target-architecture.md`: target architecture and dependency boundaries.
- `docs/product/mvp-scope.md`: product MVP scope and exclusions.
- `packages/plugin-starter-tokens/src/code.ts`: active plugin controller/runtime source.
- `packages/plugin-starter-tokens/src/ui.html`: active plugin UI source.
- `packages/ds-core/src/index.js`: shared pure token logic.
- `packages/ds-core/src/index.d.ts`: shared public types.
- `packages/exporters/src/index.js`: pure exporter entrypoint.
- `apps/web/src`: web Creator shell source.
- `manifest.json`: root Figma entrypoint manifest.

## Known Open Issues

- `apps/web` is present but does not yet cover the full V1 Creator workflow.
- Color Modes are editable and reference-validated at MVP level, but the full semantic color model, add/remove flows, token-picker interaction, and component-token consumption are not implemented yet.
- Typography, spacing, and radius have editable MVP views and a first combined light/dark preview, but no advanced product preview refinement has been completed.
- `packages/exporters` currently implements JSON export only; CSS variables and Tailwind config exports are planned but not verified as implemented.
- No `packages/figma-adapter` package exists yet; adapter-like Figma mapping still appears to live in plugin runtime code.
- Some older docs may still describe `apps/web` or `packages/exporters` as future/nonexistent; prefer active learnings and current package evidence.
- `legacy/root-plugin` and `backups` may confuse agents if they are not treated as historical references.
- The working tree has uncommitted/untracked preview and documentation changes; web checks passed on 2026-05-06, but full repo and plugin tests were not run.

## Recommended Next Steps

1. For any new session, read `AGENTS.md`, `docs/memory/LEARNINGS.md`, and this file first.
2. Keep implementation work inside the package boundary matching the task.
3. Before product or architecture changes, cite relevant active LRN ids and update docs if a durable decision changes.
4. Continue expanding `apps/web` only through shared packages, not by importing plugin runtime code.
5. Continue extracting pure token behavior into `packages/ds-core` only when it is product-neutral and covered by tests.
6. Add exporter targets in `packages/exporters` as pure TokenBundle transformations with focused tests.
7. Keep plugin work focused on current stabilization and future import/sync behavior.
8. Next web pass should commit the preview changes, then choose between deeper preview QA/refinement, component semantics, or developer export work.

## Last Updated

2026-05-06
