# Plugin ombrstudio - Build your design system foundation

Package plugin Figma: wizard UI + generation de variables.

## Chemins

- Source code: `src/code.ts`
- Source UI: `src/ui.html`
- Build output: `dist/code.js`, `dist/ui.html`
- Manifest local package: `manifest.json`

## Build

```bash
npm run build -w @starter-tokens/plugin-starter-tokens
```

## Workflow recommande

- Source d'edition:
  - `src/code.ts`
  - `src/ui.html`
- Fichiers generes:
  - `dist/code.js`
  - `dist/ui.html`
- Regle:
  - ne pas editer `dist/*` a la main
  - apres une modification du plugin, lancer `npm run build`
  - Figma charge le plugin depuis `dist`, pas depuis `src`

## Integration DS Core

Le payload `generate-variables` accepte un champ optionnel:

- `tokenBundle` (contrat `@starter-tokens/ds-core`)

Comportement:

1. Si `tokenBundle` est fourni, le plugin valide + normalise le bundle.
2. Les tokens `semantic` du bundle sont appliques dans la collection `1. color-modes` avec modes `light` et `dark`.
3. Si absent, le moteur historique du plugin reste utilise.
