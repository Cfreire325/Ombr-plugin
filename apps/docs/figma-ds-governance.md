# Figma DS Governance

Ce document definit le setup du **nouveau document Figma DS** (separe de la maquette UI plugin).

## Pages obligatoires

1. `00 Governance`
2. `01 Primitives`
3. `02 Semantic`
4. `03 Component Tokens`
5. `04 Handoff`

## Variables

- Collections:
  - `primitives`
  - `semantic`
  - `components`
- Modes obligatoires:
  - `light`
  - `dark`

## Nommage

- Slash-case uniquement (`segment/segment/...`)
- Kebab-case par segment
- Exemples:
  - `text/primary`
  - `bg/canvas`
  - `border/focus`
  - `input/border/focus`

## Statut composant

- `Draft`
- `Ready for Dev`
- `Locked`

Le statut doit etre visible dans la page `04 Handoff`.

## Regles handoff vers dev

1. Aucun token local non variable sur les composants `Ready for Dev`.
2. Tous les etats critiques doivent exister: `default`, `hover`, `focus`, `error`, `disabled`.
3. Les valeurs couleurs des composants passent par `semantic` ou `components`, jamais en direct depuis les primitives (sauf exception documentee).
4. Le JSON exporte doit respecter le contrat `TokenBundle` de `packages/ds-core`.
