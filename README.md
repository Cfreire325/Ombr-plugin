# Ombr-plugin

## Starter Tokens Monorepo

Monorepo separe en deux produits relies:

1. `packages/ds-core`
   Contrat `TokenBundle` (Figma-first), validation, normalisation, fixture et tests.
2. `packages/plugin-starter-tokens`
   Plugin Figma Starter Tokens (wizard + generation variables), consommateur du contrat DS.

Le manifest racine Figma pointe maintenant vers le package plugin:

- `main`: `packages/plugin-starter-tokens/dist/code.js`
- `ui`: `packages/plugin-starter-tokens/dist/ui.html`

## Workspace scripts

```bash
npm run build
npm run typecheck
npm run test:ds-core
```

## DS Core

- Package: `@starter-tokens/ds-core`
- Fichier principal: `packages/ds-core/src/index.js`
- Fixture: `packages/ds-core/fixtures/token-bundle.sample.json`

## Plugin

- Package: `@starter-tokens/plugin-starter-tokens`
- Source: `packages/plugin-starter-tokens/src`
- Runtime: `packages/plugin-starter-tokens/dist`
- Le plugin accepte desormais un `tokenBundle` optionnel dans le payload `generate-variables` pour brancher des tokens semantic normalises.

## Docs de gouvernance

- `apps/docs/figma-ds-governance.md`
- `apps/docs/plugin-integration-checklist.md`
- `docs/project-operating-system.md` (source de verite: stack, setup, workflow, quality gates, plan)
