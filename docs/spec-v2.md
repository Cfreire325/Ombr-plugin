# Starter Tokens V2 - Specification Produit et Technique

## 1. Vision
`Starter Tokens` V2 est un plugin Figma qui genere un systeme de variables complet, propre et maintenable a partir de presets internes (Tailwind par defaut) et de couleurs brand utilisateur.

La generation est idempotente: relancer le plugin met a jour les valeurs, aliases, modes et scopes sans creer de doublons.

## 2. Portee V2

### 2.1 Collections generees (toujours)
1. `primitives`
2. `semantic`
3. `components`

### 2.2 Contraintes
- Naming: segments en `kebab-case`, hierarchie via `/`.
- Collisions: si une variable existe deja (meme path dans la collection), elle est mise a jour/remplacee.
- Brand:
  - `brand-1` est la premiere couleur et pilote semantic + components.
  - `brand-2..brand-10` sont disponibles en primitives uniquement.
- UI: wizard minimal en 5 etapes.

## 3. Wizard UI V2

### Etape 1 - Base
- `Base white` (defaut `#ffffff`)
- `Base black` (defaut `#000000`)
- `Neutral gray palette` (defaut: neutral du preset choisi)
  - Tailwind: `slate | gray | zinc | neutral | stone`

### Etape 2 - Preset palette
- Preset interne par defaut: `Tailwind`
- Presets additionnels possibles (facultatif): Flowbite / Untitled

### Etape 3 - Brand colors (max 10)
- Liste editable: `name + hex/rgb(a)`
- Ligne 1 labellee: `Brand primary (drives semantics)`
- Lignes suivantes: `Additional brand palettes (primitives only)`

### Etape 4 - Modes
- Option A: `Generate 2 modes (light/dark)`
- Option B: `Generate 1 mode` avec choix:
  - `light only`
  - `dark only`

### Etape 5 - Generate
- CTA: `Generate / Update tokens`
- Resume + rapport:
  - created / updated
  - aliases appliques / manquants
  - collisions remplacees
  - avertissements

## 4. Nommage canonique

## 4.1 Primitives

### Colors
- `colors/base/white`
- `colors/base/black`
- `colors/{tailwindPalette}/{step}` (step: `50,100,...,950`)
- `colors/gray/{step}` -> alias vers `colors/{neutralChosen}/{step}`
- `colors/brand/{step}` -> alias vers `colors/brand-1/{step}`
- `colors/brand-1/{step}` ... `colors/brand-10/{step}`
- `colors/{brandName}/{step}` (alias lisible de la brand-1 si nom custom)

### Spacing (FLOAT px)
- `spacing/0`
- `spacing/2`
- `spacing/4`
- `spacing/6`
- `spacing/8`
- `spacing/12`
- `spacing/16`
- `spacing/20`
- `spacing/24`
- `spacing/32`
- `spacing/40`
- `spacing/48`
- `spacing/64`
- `spacing/80`
- `spacing/96`
- `spacing/128`
- `spacing/160`

### Radius (FLOAT px)
- `radius/0`
- `radius/2`
- `radius/4`
- `radius/6`
- `radius/8`
- `radius/10`
- `radius/12`
- `radius/16`
- `radius/20`
- `radius/24`
- `radius/full` (`9999`)

### Typography
- `font-family/display` (STRING)
- `font-family/body` (STRING)
- `font-size/text-xs` (FLOAT)
- `font-size/text-sm` (FLOAT)
- `font-size/text-md` (FLOAT)
- `font-size/text-lg` (FLOAT)
- `font-size/text-xl` (FLOAT)
- `font-size/display-xs` (FLOAT)
- `font-size/display-sm` (FLOAT)
- `font-size/display-md` (FLOAT)
- `font-size/display-lg` (FLOAT)
- `font-size/display-xl` (FLOAT)
- `font-size/display-2xl` (FLOAT)

### Opacity (COLOR alpha)
- `opacity/white/{pct}`
- `opacity/black/{pct}`
- `opacity/brand-1/{pct}`
- `opacity/brand-2/{pct}` ... `opacity/brand-10/{pct}`
- `pct` autorises:
  - `4,6,8,10,15,20,30,40,50,60,70,80,90`

## 4.2 Semantic

### Text
- `text/primary`
- `text/secondary`
- `text/muted`
- `text/placeholder`
- `text/disabled`
- `text/inverse`
- `text/brand`
- `text/on-brand`

### Background
- `bg/canvas`
- `bg/surface`
- `bg/muted`
- `bg/overlay`
- `bg/brand`

### Border
- `border/default`
- `border/muted`
- `border/strong`
- `border/brand`
- `border/focus`

### Icon
- `icon/primary`
- `icon/secondary`
- `icon/muted`
- `icon/disabled`
- `icon/inverse`
- `icon/brand`
- `icon/on-brand`

### Intent set
- `text/{success|warning|danger|info}`
- `bg/{success|warning|danger|info}`
- `border/{success|warning|danger|info}`
- `icon/{success|warning|danger|info}`

## 4.3 Components
- Starter components:
  - `button`
  - `input`
  - `card`
  - `modal`
  - `badge`
  - `alert`
- Convention:
  - `components/{component}/{variant}/{property}[/{state}]`
- Etats:
  - `hover`
  - `active`
  - `focus`
  - `disabled`

Exemples cibles:
- `components/button/primary/bg`
- `components/button/primary/bg/hover`
- `components/button/primary/bg/active`
- `components/button/primary/bg/disabled`
- `components/input/border/focus`
- `components/modal/overlay`
- `components/alert/success/bg`

## 5. Mappings par defaut

## 5.1 Canon neutral
- `colors/gray/*` -> `colors/{neutralChosen}/*`

## 5.2 Canon brand
- `colors/brand/*` -> `colors/brand-1/*`

## 5.3 Semantic mapping
Toutes les variables semantic referencent uniquement des primitives (alias autorises), sans valeurs hardcodees.

### Light
- `text/primary` -> `colors/gray/900`
- `text/secondary` -> `colors/gray/700`
- `text/muted` -> `colors/gray/500`
- `text/placeholder` -> `colors/gray/400`
- `text/disabled` -> `colors/gray/300`
- `text/inverse` -> `colors/base/white`
- `text/brand` -> `colors/brand/600`
- `text/on-brand` -> `colors/base/white`

- `bg/canvas` -> `colors/base/white`
- `bg/surface` -> `colors/gray/50`
- `bg/muted` -> `colors/gray/100`
- `bg/overlay` -> `opacity/black/40`
- `bg/brand` -> `colors/brand/600`

- `border/default` -> `colors/gray/200`
- `border/muted` -> `colors/gray/100`
- `border/strong` -> `colors/gray/300`
- `border/brand` -> `colors/brand/600`
- `border/focus` -> `colors/brand/600`

- `icon/primary` -> `colors/gray/700`
- `icon/secondary` -> `colors/gray/500`
- `icon/muted` -> `colors/gray/400`
- `icon/disabled` -> `colors/gray/300`
- `icon/inverse` -> `colors/base/white`
- `icon/brand` -> `colors/brand/600`
- `icon/on-brand` -> `colors/base/white`

Intents light:
- `success` -> `colors/emerald/600`
- `warning` -> `colors/amber/600`
- `danger` -> `colors/red/600`
- `info` -> `colors/sky/600`

### Dark
- `text/primary` -> `colors/gray/50`
- `text/secondary` -> `colors/gray/200`
- `text/muted` -> `colors/gray/400`
- `text/placeholder` -> `colors/gray/500`
- `text/disabled` -> `colors/gray/600`
- `text/inverse` -> `colors/gray/900`
- `text/brand` -> `colors/brand/400`
- `text/on-brand` -> `colors/base/white`

- `bg/canvas` -> `colors/gray/950`
- `bg/surface` -> `colors/gray/900`
- `bg/muted` -> `colors/gray/800`
- `bg/overlay` -> `opacity/black/60`
- `bg/brand` -> `colors/brand/600`

- `border/default` -> `colors/gray/800`
- `border/muted` -> `colors/gray/900`
- `border/strong` -> `colors/gray/700`
- `border/brand` -> `colors/brand/500`
- `border/focus` -> `colors/brand/400`

- `icon/primary` -> `colors/gray/200`
- `icon/secondary` -> `colors/gray/400`
- `icon/muted` -> `colors/gray/500`
- `icon/disabled` -> `colors/gray/600`
- `icon/inverse` -> `colors/gray/900`
- `icon/brand` -> `colors/brand/400`
- `icon/on-brand` -> `colors/base/white`

Intents dark:
- `success` -> `colors/emerald/400`
- `warning` -> `colors/amber/400`
- `danger` -> `colors/red/400`
- `info` -> `colors/sky/400`

### Single mode
- `light only`: semantic avec table Light uniquement
- `dark only`: semantic avec table Dark uniquement

## 5.4 Components mapping
- Button primary:
  - `components/button/primary/bg` -> `bg/brand`
  - `components/button/primary/bg/hover` -> `colors/brand/700`
  - `components/button/primary/bg/active` -> `colors/brand/800`
  - `components/button/primary/bg/disabled` -> `colors/gray/300` (dark: `colors/gray/700`)
  - `components/button/primary/text` -> `text/on-brand`
  - `components/button/primary/icon` -> `icon/on-brand`
  - `components/button/primary/border` -> `border/brand`
  - `components/button/primary/border/focus` -> `border/focus`
  - `components/button/primary/radius` -> `radius/8`
  - `components/button/primary/padding-x` -> `spacing/16`
  - `components/button/primary/padding-y` -> `spacing/12`
  - `components/button/primary/gap` -> `spacing/8`
- Button secondary:
  - surface/default/text-primary equivalents
- Input:
  - `components/input/bg` -> `bg/surface`
  - `components/input/bg/disabled` -> `bg/muted`
  - `components/input/text` -> `text/primary`
  - `components/input/placeholder` -> `text/placeholder`
  - `components/input/border` -> `border/default`
  - `components/input/border/hover` -> `border/strong`
  - `components/input/border/focus` -> `border/focus`
  - `components/input/border/disabled` -> `border/muted`
  - `components/input/radius` -> `radius/8`
  - `components/input/padding-x` -> `spacing/12`
  - `components/input/padding-y` -> `spacing/8`
- Card:
  - `components/card/bg` -> `bg/surface`
  - `components/card/border` -> `border/default`
  - `components/card/radius` -> `radius/12`
  - `components/card/padding` -> `spacing/24`
- Modal:
  - `components/modal/bg` -> `bg/surface`
  - `components/modal/border` -> `border/default`
  - `components/modal/radius` -> `radius/12`
  - `components/modal/padding` -> `spacing/24`
  - `components/modal/overlay` -> `bg/overlay`
- Badge:
  - `components/badge/bg` -> `bg/muted`
  - `components/badge/text` -> `text/primary`
  - `components/badge/border` -> `border/default`
  - `components/badge/radius` -> `radius/full`
  - `components/badge/padding-x` -> `spacing/8`
  - `components/badge/padding-y` -> `spacing/4`
- Alert intent-driven:
  - `components/alert/{intent}/bg` -> `bg/{intent}`
  - `components/alert/{intent}/text` -> `text/{intent}`
  - `components/alert/{intent}/border` -> `border/{intent}`
  - `components/alert/{intent}/icon` -> `icon/{intent}`

## 6. Scopes V2
- `semantic/text/*` -> `[TEXT_FILL]`
- `semantic/bg/*` -> `[FRAME_FILL, SHAPE_FILL]`
- `semantic/border/*` -> `[STROKE_COLOR]`
- `semantic/icon/*` -> `[STROKE_COLOR, SHAPE_FILL]`
- `opacity/*` -> `[ALL_FILLS]`
- `primitives/colors/*` -> `[ALL_SCOPES]`
- `spacing/*` + paddings/gaps -> `[GAP]`
- `radius/*` -> `[CORNER_RADIUS]`
- `font-size/*` -> `[FONT_SIZE]`
- `font-family/*` -> `[FONT_FAMILY]`

## 7. Preset Tailwind embarque
- Donnees internes compilees (pas d'appel internet au runtime).
- Palettes minimales incluses:
  - `slate`, `gray`, `zinc`, `neutral`, `stone`
  - `red`, `orange`, `amber`, `yellow`, `lime`
  - `green`, `emerald`, `teal`, `cyan`, `sky`
  - `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`
- Chaque palette contient exactement les steps:
  - `50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`

## 8. Generation rampe brand
- Entree: couleur base (idealement step `500`).
- Sortie: 11 steps `50..950`.
- Algorithme:
  - conservation de teinte principale
  - progression monotone de luminosite (clair -> sombre)
  - `500` egal (ou quasi egal) a l'entree

## 9. Idempotence et update
- Collections cherchees par nom (`primitives`, `semantic`, `components`).
- Variables cherchees par path complet.
- Si variable existe:
  - update valeurs par mode
  - update alias
  - update scopes
- Si absente:
  - creation
- Aucun doublon cree au rerun.

## 10. Acceptance criteria QA
- 3 collections presentes.
- `semantic` a 2 modes (dual) ou 1 mode (single).
- `colors/brand/*` alias vers `colors/brand-1/*`.
- `colors/gray/*` alias vers neutral choisie.
- Tous les semantic tokens pointent vers primitives (pas de hardcode direct).
- Scopes conformes section 6.
- `opacity/*` en variables COLOR alpha.
- Re-run: memes paths, aucun duplicate, valeurs et aliases mis a jour.
