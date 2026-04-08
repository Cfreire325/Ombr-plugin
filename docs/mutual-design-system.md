# Mutual Design System (Figma <-> Code)

Cette base suit le meme principe que shadcn: `tokens` + `component recipes` + `variants/states`.

## 1) Tokens

Source de verite cote code: `:root` dans `packages/plugin-starter-tokens/src/ui.html`.

- Spacing: `--ds-spacing-*`
- Radius: `--ds-radius-*`
- Typography: `--ds-font-*`, `--ds-line-height-*`, `--ds-letter-spacing-*`
- Semantic colors: `--ds-color-*`

## 2) Primitives UI (reutilisables)

- Field: `.ds-field`
- Label: `.ds-label`
- Input: `.ds-input`
- Select: `.ds-select`
- Button: `.ds-button` + variant
  - `.ds-button--primary`
  - `.ds-button--secondary`

Note: l'existant reste compatible via alias (`ui-*`, `primary`, `secondary`, etc.).

## 3) Select custom (dropdown)

Le select custom expose aussi des primitives DS:

- `.ds-select-root`
- `.ds-select-trigger`
- `.ds-select-value`
- `.ds-select-panel`
- `.ds-select-search`
- `.ds-select-options`
- `.ds-select-option`
- `.ds-select-option-content`
- `.ds-select-option-label`
- `.ds-select-option-support`
- `.ds-select-option-check`

## 4) Mapping Figma

- `Input` -> `.ds-input`
- `Input dropdown` -> `.ds-select-*`
- `_Input dropdown menu item` -> `.ds-select-option*`
- `_Scroll bar` -> scrollbar de `.ds-select-options`

## 5) Règle d'evolution

Toute maj Figma d'un composant DS implique:
1. mise a jour des tokens ou recipes DS,
2. application sur les primitives `.ds-*`,
3. puis seulement integration dans les ecrans plugin.

Ainsi, un meme composant garde le meme rendu partout.
