# Starter Tokens V2 - Plan d'Implementation

## 1. Objectif
Produire une V2 idempotente du plugin Figma `Starter Tokens` qui genere/met a jour 3 collections:
- `primitives`
- `semantic`
- `components`

La V2 doit appliquer un naming strict en `kebab-case`, des scopes Figma explicites, un wizard 5 etapes, et des mappings semantic/components branches sur `brand-1`.

## 2. Architecture cible

### 2.1 Modules
- `src/code.ts`
  - orchestration UI <-> moteur
  - validation payload
  - execution generation + reporting
- `src/presets/tailwind-colors.ts`
  - palette Tailwind embarquee (50..950)
  - metadonnees neutrals (`slate|gray|zinc|neutral|stone`)
- `src/presets/builtin.ts`
  - registre presets internes (V2: Tailwind par defaut; extensible)
- `src/presets/color-utils.ts`
  - parse couleurs
  - generation rampe brand 50..950 (progression monotone)
- `src/presets/types.ts`
  - types payload/report/preset/token definitions
- `src/ui.html`
  - wizard 5 etapes + resume + etat de generation

### 2.2 Couches moteur
- Layer 1: `normalize + validate` des entrees utilisateur
- Layer 2: `build token definitions` (primitives, semantic, components)
- Layer 3: `upsert` variable collections/modes/variables/scopes
- Layer 4: `resolve aliases` et rapport final (created/updated/collisions/missing)

## 3. Etapes de livraison

### Etape A - Contrat V2 et types
- Introduire `ModeStrategy = "dual" | "single-light" | "single-dark"`.
- Etendre `GenerationOptions`:
  - `presetId`
  - `baseWhite`, `baseBlack`
  - `neutralChoice`
  - `modeStrategy`
  - `brands` (max 10)
- Etendre `GenerationReport`:
  - `created`, `updated`, `aliasApplied`, `aliasMissing`
  - `collisionsReplaced`
  - stats par collection

### Etape B - Presets internes
- Creer fichier Tailwind embarque.
- Exposer une API preset simple (lookup by id, info UI, options neutrals).
- Default preset: `tailwind`.

### Etape C - Build des tokens V2
- Primitives:
  - `colors/base/*`
  - `colors/{palette}/{step}` (Tailwind)
  - `colors/gray/*` alias vers neutral choisie
  - `colors/brand/*` alias vers `colors/brand-1/*`
  - `colors/brand-1..10/*` + alias `colors/{brand-name}/*` pour la brand primaire
  - `spacing/*`, `radius/*`, `font-family/*`, `font-size/*`, `opacity/*`
- Semantic:
  - tokens text/bg/border/icon + intents
  - mapping light/dark selon spec
  - single-mode support (light only ou dark only)
- Components:
  - button, input, card, modal, badge, alert
  - states: hover, active, focus, disabled
  - alias vers semantic/primitives uniquement

### Etape D - Idempotence et collisions
- Rechercher collections par nom exact.
- Rechercher variable par `collectionId + fullPath`.
- Si variable existe:
  - verifier type
  - remplacer valeur (ou alias), scopes, valeurs de mode
  - compter update/collision remplacee
- Si absente:
  - creer
- Ne jamais dupliquer un path deja present dans la meme collection.

### Etape E - Scopes stricts
- `semantic/text/*` -> `TEXT_FILL`
- `semantic/bg/*` -> `FRAME_FILL`, `SHAPE_FILL`
- `semantic/border/*` -> `STROKE_COLOR`
- `semantic/icon/*` -> `STROKE_COLOR`, `SHAPE_FILL`
- `opacity/*` -> `ALL_FILLS`
- `primitives/colors/*` -> `ALL_SCOPES`
- Numeriques:
  - spacing/padding/gap -> `GAP`
  - radius -> `CORNER_RADIUS`
  - font-size -> `FONT_SIZE`
  - font-family -> `FONT_FAMILY`

### Etape F - UI Wizard V2
- 5 ecrans:
  1. Base
  2. Preset
  3. Brand
  4. Modes
  5. Generate
- Controls:
  - base white/black
  - preset + neutral gray
  - brand list max 10 (ligne 1 = primary)
  - toggle dual mode vs single mode + choix single light/dark
  - resume + bouton `Generate / Update tokens`

### Etape G - Verification
- `npm run typecheck`
- `npm run build`
- checklist QA acceptance criteria (collections, modes, aliases canon, scopes, idempotence)

## 4. Fonctions clefs
- `buildGenerationOptions(raw): GenerationOptions`
- `buildPrimitives(options, preset): TokenDefinition[]`
- `buildSemantic(options): TokenDefinition[]`
- `buildComponents(options): TokenDefinition[]`
- `getOrCreateCollection(name): VariableCollection`
- `ensureCollectionModes(collection, strategy): modeIds`
- `upsertVariable(definition): { variable, created|updated }`
- `setVariableValueOrAlias(variable, modeId, valueOrAliasRef)`
- `applyScopes(variable, scopes)`
- `resolvePendingAliases()`
- `sanitizeKebabSegment(name)`
- `toReportSummary(report)`

## 5. Risques et mitigations
- Risque: type mismatch sur variable existante
  - mitigation: logger conflit et ignorer cette variable
- Risque: alias cible introuvable
  - mitigation: defer aliases + index global + rapport `aliasMissing`
- Risque: renommage brand utilisateur
  - mitigation: conserver canoniques `brand-1..10` et maintenir alias `colors/brand/*`
