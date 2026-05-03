# Bug Registry — Ombr

This file is the project’s anti-regression memory.

It documents bugs and technical incidents that have already been encountered, understood, fixed, or intentionally monitored.

Before changing code, agents must check this file to avoid reintroducing known regressions.

## Agent Rule

Before any code change, agents must:
1. Read this file.
2. Check whether the task touches one of the registered areas.
3. Preserve all matching anti-regression rules.
4. Add or update an entry only after a bug is verified, fixed, or intentionally monitored.

## How To Use This File

- This is not a backlog.
- Add an entry only when the incident is observable from repo files or clearly documented.
- Do not invent causes. Use `Unknown` or `Not documented yet` when evidence is missing.
- Preserve useful existing entries; append or refine with sources instead of replacing history.
- Prefer stable anti-regression rules over session narration.

## Entry Template

```md
### BR-XXX — Short title

Status:
Date documented:
Source evidence:

Symptoms:
Root cause:
Correction applied:
Files impacted:
Anti-regression rule:
Validations:
Do not repeat:
Unknowns:
```

## Registry

### BR-001 — Legacy root plugin files confused with active implementation

Status: Fixed / monitored

Date documented: 2026-04-13 to 2026-05-03

Source evidence:

- `docs/source-of-truth.md`
- `docs/legacy-cleanup-status.md`
- `docs/session-handoff.md`
- `docs/agent/CURRENT_STATE.md`
- `docs/memory/LEARNINGS.md`

Symptoms:

- Older root plugin files and active package files coexisted.
- Historical docs referenced old paths such as `src/ui.html` and `dist/ui.html`.
- Agents could accidentally treat legacy root files as the active Figma plugin implementation.

Root cause:

- The repo migrated toward an active monorepo package structure while historical root plugin files, backups, and older handoff notes remained present.

Correction applied:

- Active plugin ownership was documented as `packages/plugin-starter-tokens/*`.
- Root Figma entrypoints were documented through `manifest.json`.
- Old root plugin implementation was moved under `legacy/root-plugin/`.
- Historical/transitional warnings were added to session/implementation docs.
- Build warnings now mark generated `dist/*` files as non-editable outputs.

Files impacted:

- `docs/source-of-truth.md`
- `docs/legacy-cleanup-status.md`
- `docs/session-handoff.md`
- `README.md` (documented as updated in `docs/legacy-cleanup-status.md`)
- `legacy/root-plugin/*`
- `packages/plugin-starter-tokens/*`
- `manifest.json`

Anti-regression rule:

- Default plugin work must happen in `packages/plugin-starter-tokens/*`.
- Do not edit `legacy/root-plugin/*` unless the task explicitly asks for legacy investigation or migration reference work.
- When changing executed Figma entrypoints, verify `manifest.json`.

Validations:

- Documentation states the active implementation hierarchy and the root manifest entrypoints.
- Exact command output for this cleanup is not documented yet.

Do not repeat:

- Do not treat `legacy/root-plugin/src/code.ts`, `legacy/root-plugin/src/ui.html`, `legacy/root-plugin/code.js`, or `legacy/root-plugin/ui.html` as active implementation by default.
- Do not manually edit generated `dist/*` files as the primary source of truth.

Unknowns:

- Exact cleanup commit or command output: Not documented yet.

### BR-002 — TokenBundle naming contract mismatch surfaced during ds-core hardening

Status: Fixed by documented compatibility decision / monitored

Date documented: 2026-04-13 and 2026-05-03

Source evidence:

- `docs/token-bundle-contract.md`
- `docs/technical/tokenbundle-naming-decision.md`
- `docs/technical/phase-1-behavior-lock-checkpoint.md`
- `docs/memory/LEARNINGS.md` (`LRN-003`)

Symptoms:

- The TokenBundle contract requires canonical slash-case token names.
- Current validation accepts some raw names that normalize deterministically, for example `Colors.Base.White` to `colors/base/white`.
- An older test expected dotted raw input to remain invalid.

Root cause:

- Validation currently operates on normalized names, not only raw author input.
- This preserves existing plugin compatibility, but it created a mismatch between strict contract wording and runtime behavior.

Correction applied:

- The project decision is now explicit: raw input may remain permissive when deterministic normalization is possible.
- Normalized TokenBundle output must still be canonical slash-case with kebab-case segments.
- Duplicate token names are checked after normalization.
- Exporters, Figma adapter work, and `apps/web` should consume normalized TokenBundle data, not raw input names.

Files impacted:

- `docs/token-bundle-contract.md`
- `docs/technical/tokenbundle-naming-decision.md`
- `docs/technical/phase-1-behavior-lock-checkpoint.md`
- `docs/memory/LEARNINGS.md`
- `packages/ds-core/tests/token-bundle.test.mjs`
- `packages/ds-core/tests/naming.test.mjs`

Anti-regression rule:

- Do not tighten raw TokenBundle naming validation without schema/version review, migration notes, and aligned docs/tests.
- Do not let exporters or app code consume raw, non-normalized names as if they were canonical.
- Keep duplicate-after-normalization behavior protected.

Validations:

- Phase 1 docs state that ds-core tests were strengthened around validation, normalization, aliases, duplicate detection, and naming behavior.
- `LRN-003` cites `packages/ds-core/tests/token-bundle.test.mjs` and `packages/ds-core/tests/naming.test.mjs` as evidence.
- Exact latest test command output is not documented yet in this registry.

Do not repeat:

- Do not reintroduce a strict raw slash-case-only rule silently.
- Do not remove permissive normalization as a cleanup unless migration/versioning is explicitly handled.
- Do not allow two raw names that normalize to the same canonical path to pass silently.

Unknowns:

- Exact historical failing test output: Not documented yet.

### BR-003 — Stale architecture docs said implemented packages did not exist

Status: Fixed by active learnings / monitored until stale docs are consolidated

Date documented: 2026-05-01 to 2026-05-03

Source evidence:

- `docs/technical/current-product-architecture-status.md`
- `docs/memory/LEARNINGS.md` (`LRN-005`)
- `docs/memory/consolidation-log.md`
- `docs/agent/CURRENT_STATE.md`
- `docs/agent/PROJECT_LOG.md`

Symptoms:

- Some older technical docs described `apps/web` or `packages/exporters` as future or nonexistent.
- Repo evidence now shows `apps/web` exists as a local-first Vite/React shell.
- Repo evidence now shows `packages/exporters` exists and implements JSON TokenBundle export.
- Agents could follow stale docs and plan duplicate scaffolding or ignore active package boundaries.

Root cause:

- Documentation from earlier architecture phases was not fully consolidated after `apps/web` and `packages/exporters` became real workspaces.

Correction applied:

- `LRN-005` records `apps/web` as an active local-first Vite shell.
- `docs/technical/current-product-architecture-status.md` compares older documentation with current package evidence.
- `docs/memory/consolidation-log.md` marks `docs/technical/current-product-architecture-status.md` as containing stale evidence about `apps/web` not existing.
- `docs/agent/CURRENT_STATE.md` points agents to active package reality and warns that older docs may be stale.

Files impacted:

- `docs/memory/LEARNINGS.md`
- `docs/memory/consolidation-log.md`
- `docs/agent/CURRENT_STATE.md`
- `docs/technical/current-product-architecture-status.md`
- `apps/web/*`
- `packages/exporters/*`

Anti-regression rule:

- Treat active learnings and current package evidence as newer than older plans that say `apps/web` or `packages/exporters` do not exist.
- Do not scaffold a second web app or exporter package without first checking current workspaces.
- Keep `apps/web` decoupled from plugin runtime code.
- Keep `packages/exporters` pure and TokenBundle-based.

Validations:

- Documentation inspected package files including `apps/web/package.json`, `apps/web/src/*`, `packages/exporters/package.json`, and exporter tests.
- Exact command output for builds/tests is not documented yet.

Do not repeat:

- Do not use stale planning docs as the sole implementation evidence.
- Do not import plugin entrypoints, manifests, `code.ts`, or `ui.html` into `apps/web`.
- Do not make exporters depend on plugin UI or Figma runtime code.

Unknowns:

- Whether all package tests currently pass on this machine: Not documented yet.

### BR-004 — Phase 1 behavior quirks intentionally locked before extraction

Status: Intentionally monitored

Date documented: 2026-05-03

Source evidence:

- `docs/technical/phase-1-behavior-lock-checkpoint.md`
- `docs/technical/build-brand-scale-extraction-note.md`
- `docs/technical/palette-step-extraction-note.md`
- `docs/technical/palette-key-normalization-extraction-note.md`
- `docs/technical/preset-lookup-extraction-note.md`
- `docs/technical/pure-logic-extraction-inventory.md`

Symptoms:

- Several existing behaviors are surprising, but are documented as current behavior to preserve during extraction.
- Examples include invalid color parsing returning `NaN`, `colorWithAlpha(..., 0.5)` treating `0.5` as `0.5%`, `resolveBaseStep([])` returning `NaN`, `pixel/1` not being generated, and `buildColorModeTokensFromBundle` mapping only `collections.semantic`.

Root cause:

- Unknown as a single root cause.
- The checkpoint documents these as existing behavior before extraction, not as newly introduced bugs.

Correction applied:

- Behavior-lock tests were strengthened around TokenBundle contract behavior, color utilities, primitive tokens, palette steps, preset lookup, semantic modes, typography, spacing/radius, generation options, and TokenBundle color-mode mapping.
- Extraction notes explicitly state which quirks must not be accidentally changed while moving logic.

Files impacted:

- `docs/technical/phase-1-behavior-lock-checkpoint.md`
- `docs/technical/build-brand-scale-extraction-note.md`
- `docs/technical/palette-step-extraction-note.md`
- `docs/technical/palette-key-normalization-extraction-note.md`
- `docs/technical/preset-lookup-extraction-note.md`
- `docs/technical/pure-logic-extraction-inventory.md`
- `packages/plugin-starter-tokens/src/code.ts`
- `packages/plugin-starter-tokens/src/presets/color-utils.ts`
- `packages/ds-core/*`
- Related behavior-lock tests listed in the checkpoint.

Anti-regression rule:

- During extraction, preserve behavior-lock expectations unless the task explicitly authorizes a behavior change.
- Test updates should change import paths or harness wiring only when the move requires it, not expected output.
- If extraction tests fail unexpectedly, prefer reverting the extraction over editing behavior to make tests pass.

Validations:

- The checkpoint lists available validation commands:
  - `npm.cmd run test:ds-core`
  - `npm.cmd run test:color-utils`
  - `npm.cmd run test:primitive-tokens`
  - `npm.cmd run test:palette-steps`
  - `npm.cmd run test:semantic-color-modes`
  - `npm.cmd run test:typography-tokens`
  - `npm.cmd run test:spacing-radius-tokens`
  - `npm.cmd run test:generation-options`
  - `npm.cmd run test:bundle-color-modes`
  - `npm.cmd run typecheck`
- Exact latest command output is not documented yet in this registry.

Do not repeat:

- Do not "clean up" documented quirks while performing pure extraction.
- Do not edit `dist` manually during rollback.
- Do not touch plugin UI, `ui.html`, manifest, `apps/web`, `packages/exporters`, or a future `packages/figma-adapter` during narrow helper extraction unless the task explicitly requires it.

Unknowns:

- Which quirks are intended long-term product behavior versus temporary compatibility behavior: Not documented yet.

## Documented Risks Not Registered As Bugs Yet

These items are documented risks or future-work warnings, but this registry does not treat them as resolved bugs yet because a concrete incident, fix, or validation is not documented clearly enough.

- Plugin JSON export integration timing and clipboard failure semantics in `docs/technical/plugin-json-export-integration-audit.md`.
- Generated foundations to TokenBundle mapping gaps in `docs/technical/generated-foundations-to-token-bundle-audit.md`.
- Full CSS/Tailwind exporter absence in `docs/technical/current-product-architecture-status.md`.
- Future Figma adapter extraction and sync conflict handling in `docs/technical/migration-roadmap.md`.
- Contrast validation and semantic completeness gaps in web/colors planning docs.

If any of these become concrete bugs or resolved incidents, add a new registry entry with symptoms, root cause, correction, impacted files, anti-regression rule, validation, and "do not repeat" notes.
