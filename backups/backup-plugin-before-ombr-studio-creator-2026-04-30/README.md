# Ombr-plugin

## ombrstudio - Build your design system foundation Monorepo

Monorepo separe en deux produits relies:

1. `packages/ds-core`
   Contrat `TokenBundle` (Figma-first), validation, normalisation, fixture et tests.
2. `packages/plugin-starter-tokens`
   Plugin Figma ombrstudio - Build your design system foundation (wizard + generation variables), consommateur du contrat DS.

Le manifest racine Figma pointe maintenant vers le package plugin:

- `main`: `packages/plugin-starter-tokens/dist/code.js`
- `ui`: `packages/plugin-starter-tokens/dist/ui.html`

## Active Paths

Quand on travaille sur l'implementation active, il faut privilegier:

- `packages/ds-core/*`
- `packages/plugin-starter-tokens/*`
- `manifest.json`
- `docs/shared-source-of-truth-plan.md`
- `docs/source-of-truth.md`
- `docs/token-bundle-contract.md`

## Legacy Paths

L'ancienne implementation plugin racine a ete deplacee dans:

- `legacy/root-plugin/src`
- `legacy/root-plugin/scripts`
- `legacy/root-plugin/dist`
- `legacy/root-plugin/code.js`
- `legacy/root-plugin/ui.html`

Elle ne doit pas etre traitee comme la source active par defaut.
L'implementation vivante du plugin est dans:

- `packages/plugin-starter-tokens/src`
- `packages/plugin-starter-tokens/dist`

## Workspace scripts

```bash
npm run build
npm run typecheck
npm run test:ds-core
```

## Workflow Plugin

- Modifier le plugin dans `packages/plugin-starter-tokens/src/*`
- Ne pas modifier `packages/plugin-starter-tokens/dist/*` a la main
- Regenerer `dist` avec `npm run build`
- Le manifest Figma charge `packages/plugin-starter-tokens/dist/code.js` et `packages/plugin-starter-tokens/dist/ui.html`

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
- `docs/local-machine-recap.md` (recap machine: Bridge, Context7, structure plugin + DS mutual)
- `docs/shared-source-of-truth-plan.md` (vision produit + architecture + roadmap)
- `docs/source-of-truth.md` (hierarchie des sources actives et legacy)
- `docs/token-bundle-contract.md` (contrat technique central)
- `docs/expert-mode-spec.md` (spec produit/fonctionnelle du mode expert)
- `docs/dev-export-strategy.md` (strategie d'export pour les developpeurs)
- `docs/legacy-cleanup-status.md` (etat du nettoyage non destructif des anciens chemins)
