# Backup Notes

## Date

- 2026-04-30

## Reason

This backup preserves the current functional Figma plugin state before preparing the transition toward Ombr Studio Creator.

## Project State

- Current active plugin package: `packages/plugin-starter-tokens`
- Current active DS contract package: `packages/ds-core`
- Root Figma manifest points to:
  - `packages/plugin-starter-tokens/dist/code.js`
  - `packages/plugin-starter-tokens/dist/ui.html`
- No plugin logic, manifest, source files, migrations, or generated build outputs were modified as part of this backup.

## Git State

- Git repository marker: `.git` exists at project root.
- Branch inferred from `.git/HEAD`: `sync/local-project-baseline`
- Last commit hash inferred from `.git/refs/heads/sync/local-project-baseline`: `5c16361aa1ef50bc7b9f925d56ecfbb79ec173b9`
- `git status` before backup: could not be executed because `git` was not found in the current PowerShell PATH.
- `where.exe git`: no git executable found in PATH.
- Full `git status` output remains unavailable until Git is available through the terminal or GitHub Desktop.

## Verification Commands

### `npm.cmd run test:ds-core`

Result: passed.

Output summary:

```text
ds-core token bundle tests passed.
```

### `npm.cmd run typecheck`

Result: passed.

Output summary:

```text
tsc --noEmit
```

### `npm run build`

Not run. Build was intentionally skipped because it can regenerate `dist`.

## Included Files and Folders

- `package.json`
- `package-lock.json`
- `manifest.json`
- `README.md`
- `docs/`
- `packages/ds-core/`
- `packages/plugin-starter-tokens/`
- `assets/`
- `legacy/root-plugin/`

## Included Generated Runtime Files

`packages/plugin-starter-tokens/dist/` was included.

Reason:

- The root `manifest.json` loads the current plugin from `packages/plugin-starter-tokens/dist/code.js` and `packages/plugin-starter-tokens/dist/ui.html`.
- Including `dist` makes this backup restorable as the current functional plugin state without requiring a rebuild.
- No build was run during this backup.

Git note:

- The root `.gitignore` contains a `dist` ignore rule.
- The local backup includes `packages/plugin-starter-tokens/dist/`, but GitHub Desktop may hide ignored `dist` files inside the backup unless they are force-added with Git CLI or preserved through a non-ignored archive.
- `.gitignore` was not modified during this backup.

## Excluded Files and Folders

- `.git/`
- `node_modules/`
- root `backups/` history other than this new backup folder
- temporary caches
- system files

## Restore Notes

To restore this snapshot manually:

1. Copy the included root files back to the project root:
   - `package.json`
   - `package-lock.json`
   - `manifest.json`
   - `README.md`
2. Copy `docs/` back to the project root.
3. Copy `packages/ds-core/` back to `packages/ds-core/`.
4. Copy `packages/plugin-starter-tokens/` back to `packages/plugin-starter-tokens/`.
5. Copy `assets/` back to the project root if needed.
6. Copy `legacy/root-plugin/` back to `legacy/root-plugin/` if historical comparison is needed.
7. Run:

```text
npm.cmd install
npm.cmd run test:ds-core
npm.cmd run typecheck
```

Do not run build unless you intentionally want to regenerate plugin `dist` files.

## Transition Reminder

This backup was created immediately before the planned transition toward Ombr Studio Creator. It should be treated as the preserved baseline of the current Figma plugin.
