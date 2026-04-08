# DS Mutual - Core v1

Objectif: definir une base commune **Figma + Dev** pour les boutons, reutilisable dans le plugin et dans le futur DS.

## Scope v1

On couvre uniquement `Button` avec un contrat stable:

- Variants
- Etats
- Tokens minimum obligatoires
- Mapping entre ton systeme et Untitled

## Button Contract v1

### Axes normalises

1. `size`: `xs | sm | md | lg | xl | 2xl(optional)`
2. `hierarchy`: `primary | secondary | tertiary | link`
3. `tone`: `brand | neutral`
4. `shape`: `default | pill`
5. `icon`: `none | leading | trailing | only | dot-leading(optional)`
6. `state`: `default | hover | focus | focus-visible | disabled`

### Etats obligatoires v1

- Obligatoire pour toutes les combinaisons: `default`, `hover`, `focus`, `disabled`
- `focus-visible`: obligatoire en web/dev, optionnel en maquette si non visible

### Tokens composants minimum (collection `components`)

- `components/button/{hierarchy}/{tone}/bg`
- `components/button/{hierarchy}/{tone}/fg`
- `components/button/{hierarchy}/{tone}/border`
- `components/button/{hierarchy}/{tone}/bg-hover`
- `components/button/{hierarchy}/{tone}/fg-hover`
- `components/button/{hierarchy}/{tone}/border-hover`
- `components/button/{hierarchy}/{tone}/bg-disabled`
- `components/button/{hierarchy}/{tone}/fg-disabled`
- `components/button/{hierarchy}/{tone}/border-disabled`
- `components/button/focus/ring-outer`
- `components/button/focus/ring-inner`
- `components/button/radius/{size}`
- `components/button/padding-x/{size}`
- `components/button/padding-y/{size}`
- `components/button/gap/{size}`
- `components/button/icon-size/{size}`
- `components/button/text-style/{size}`

## Mapping rapide (ton fichier -> contrat v1)

- `Type=Filled` -> `hierarchy=primary`, `tone=brand`, `shape=default`
- `Type=Pill` -> meme style que Filled/Outline selon choix, avec `shape=pill`
- `Type=Outline` -> `hierarchy=secondary` ou `tertiary` selon contraste
- `Type=Link` -> `hierarchy=link`
- `Icon=Left/Right/Only/None` -> `leading/trailing/only/none`

## Mapping rapide (Untitled -> contrat v1)

- `Hierarchy=Primary` -> `primary + brand`
- `Hierarchy=Secondary color` -> `secondary + brand`
- `Hierarchy=Secondary gray` -> `secondary + neutral`
- `Hierarchy=Tertiary color` -> `tertiary + brand`
- `Hierarchy=Tertiary gray` -> `tertiary + neutral`
- `Hierarchy=Link color` -> `link + brand`
- `Hierarchy=Link gray` -> `link + neutral`

## Ce que tu fais cote Figma (checklist)

1. Creer un nouveau doc Figma DS avec les pages deja definies (`00` a `04`).
2. Creer la collection `components` avec modes `light` et `dark`.
3. Poser `Button` en composant unique avec les axes du contrat v1.
4. Marquer en `Ready for Dev` uniquement les variants avec etats obligatoires complets.
5. Verifier qu'aucune couleur hardcodee n'existe sur les variants `Ready for Dev`.
6. Exporter un premier lot: `size=md`, `hierarchy=primary|secondary|link`, `tone=brand|neutral`.

## Ce que je fais cote Dev (checklist)

1. Figer le schema `TokenBundle` pour accepter ces tokens button.
2. Ajouter les validations de noms autorises (`components/button/...`).
3. Ajouter des tests de mapping pour `state` et `icon`.
4. Brancher le plugin pour previsualiser ces variants sans casser l'UX actuelle.
5. Preparer la base de la partie 3 `Semantic Token Expert` sur ce contrat.

## Definition of Done v1

1. Les memes variants `md` existent dans Figma et dans le rendu plugin.
2. Les etats `default/hover/focus/disabled` matchent visuellement.
3. Les tokens viennent du bundle (pas de fallback hardcode).
4. Le contrat passe les tests de validation et de non-regression.
