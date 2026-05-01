# Legacy Cleanup Status

## Date

- 2026-04-14

## Purpose

This document tracks the safe cleanup strategy for legacy root files and older transitional docs.

The goal is not to delete history too early.

The goal is:

- reduce ambiguity
- keep migration references
- avoid coding in the wrong place

## Current active implementation

The active plugin implementation lives in:

- `packages/plugin-starter-tokens/src`
- `packages/plugin-starter-tokens/dist`

The active contract implementation lives in:

- `packages/ds-core`

The runtime entrypoints used by Figma are defined by:

- `manifest.json`

## Current legacy or transitional areas

These paths still exist and can confuse future work:

- `legacy/root-plugin/src/*`
- `legacy/root-plugin/code.js`
- `legacy/root-plugin/ui.html`
- `legacy/root-plugin/scripts/*`
- `legacy/root-plugin/dist/*`
- `legacy/root-plugin/tsconfig.json`
- older planning docs written before the monorepo source-of-truth was clarified
- `backups/*`

## What cleanup means here

Cleanup does not mean immediate deletion.

At this stage, cleanup means:

1. identify active vs legacy paths
2. mark historical docs clearly
3. stop editing legacy files by accident
4. keep enough reference material for safe migration

## What was already cleaned

1. `README.md` now clarifies active and legacy paths
2. `docs/source-of-truth.md` defines active implementation hierarchy
3. `docs/implementation-plan-v2.md` now has a historical/transitional warning
4. `docs/session-handoff.md` now has a historical/transitional warning
5. the old root plugin implementation was moved into `legacy/root-plugin/`
6. the root of the repo now exposes the active package flow much more clearly
7. plugin build warnings now mark generated `dist/*` files as non-editable outputs

## What is intentionally not done yet

We are not yet:

- deleting the archived legacy implementation inside `legacy/root-plugin/`
- deleting historical backups

Reason:

- we still want safe access to migration references until the active package flow is fully stabilized

## Next safe cleanup steps

1. keep active work inside `packages/plugin-starter-tokens/*`
2. keep archived references inside `legacy/root-plugin/*`
3. compare archived and active assets one last time if needed
4. only then consider full removal of archived root plugin files

## Rule for future sessions

If a session starts editing:

- `legacy/root-plugin/src/code.ts`
- `legacy/root-plugin/src/ui.html`
- `legacy/root-plugin/code.js`
- `legacy/root-plugin/ui.html`

it should stop and verify whether this is intentional.

The default answer should be:

- use `packages/plugin-starter-tokens/*` instead
