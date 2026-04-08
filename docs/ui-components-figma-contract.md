# UI Components Figma Contract

Objectif: garder une source unique DA/UI avec le meme naming que Figma pour implementer les composants et leurs contraintes sans rework a chaque iteration.

## Naming Figma -> Code

- `Input` (Figma node `129:176`)
  - Code: `.ds-input` (alias legacy: `.ui-input`)
  - Etats: `empty`, `placeholder`, `value`, `focus`, `error`, `error-focus`, `disabled`

- `Input dropdown` (Figma node `163:685`)
  - Code: `.ds-select-*` (alias legacy: `.custom-select*`, `.ui-select`)
  - Variants: `default`, `search`
  - Etats: `placeholder`, `value`, `focus`, `open`, `disabled`

- `_Input dropdown menu item` (Figma node `165:225`)
  - Code: `.ds-select-option` + `.ds-select-option-content` (alias legacy: `.custom-select-option*`)
  - Etats: `default`, `hover`, `selected`, `disabled`
  - Type: `default`, `icon-leading`

- `_Scroll bar` (Figma node `166:398`)
  - Code: `.ds-select-options::-webkit-scrollbar*` (alias legacy: `.custom-select-options*`)
  - Token visuel: thumb neutre clair + radius full + track transparent

## API d'implementation (runtime)

Pour mapper exactement les variantes Figma sur un `option` HTML:

- `data-supporting-text="..."` -> texte secondaire menu item
- `data-icon="search|user"` -> icone leading
- `selected` natif -> etat `selected`
- `disabled` natif -> etat `disabled`

## Regles de fidelite

- Pas de style inline pour ces composants (sauf override ponctuel de layout).
- Tous les etats doivent etre pilotables par classe (`is-open`, `is-error`, `is-disabled`, `is-selected`, `is-active`).
- Toute evolution Figma de ces composants doit mettre a jour:
  1. ce document,
  2. les classes associees,
  3. au moins une capture de validation avant merge.

## Fichiers sources

- Source UI: `packages/plugin-starter-tokens/src/ui.html`
- Build output: `packages/plugin-starter-tokens/dist/ui.html`
