# Semantic Token Expert Roadmap

## Phase 1 - DS Foundation (done by this setup)

- Contrat `TokenBundle` versionne dans `packages/ds-core`.
- Validation + normalisation + fixture.
- Gouvernance Figma DS documentee.

## Phase 2 - Plugin Branch (done in this setup)

- Le plugin accepte `payload.tokenBundle`.
- Le bundle est valide et normalise avant generation.
- Les tokens `semantic` du bundle alimentent `1. color-modes` en `light` + `dark`.
- Fallback automatique sur le moteur historique si aucun bundle n'est fourni.

## Phase 3 - Semantic Token Expert (next)

- Debloquer la carte "Semantic tokens / expert" dans l'UI.
- Ajouter un ecran de preview semantic tokens (sources + aliases + etats).
- Ajouter un moteur dedie `components/*` base sur le meme contrat `TokenBundle`.
