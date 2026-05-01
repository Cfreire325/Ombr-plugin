# Audit migration Colors du plugin vers apps/web

Date: 2026-05-02

## Objectif

Preparer la prochaine etape de la web app: rapprocher l'experience `Foundations / Colors` de ce qui existe deja dans le plugin Figma, sans copier le plugin, sans dependre de l'API Figma et sans modifier le runtime dans cette phase.

Direction cible:

- `apps/web` devient la surface principale de creation du Design System.
- Le plugin Figma devient un importateur/synchronisateur de TokenBundle.
- `packages/ds-core` concentre la logique partagee: tokens, validation, normalisation, naming, palettes, generation pure.
- `packages/exporters` consomme un TokenBundle normalise et produit des exports developpeur.

Cette note est documentation-only. Aucun code n'est modifie par cette phase.

## Fichiers inspectes

Docs produit et architecture:

- `docs/technical/current-product-architecture-status.md`
- `docs/technical/apps-web-implementation-plan.md`
- `docs/technical/migration-roadmap.md`
- `docs/technical/token-bundle-source-of-truth.md`
- `docs/token-bundle-contract.md`
- `docs/spec-v2.md`
- `docs/product/mvp-scope.md`
- `docs/product/feature-map.md`
- `docs/product/user-flow-source.md`
- `docs/technical/pure-logic-extraction-inventory.md`
- `docs/technical/build-brand-scale-extraction-note.md`
- `docs/technical/palette-step-extraction-note.md`
- `docs/technical/palette-key-normalization-extraction-note.md`
- `docs/technical/preset-lookup-extraction-note.md`

Plugin Figma:

- `packages/plugin-starter-tokens/package.json`
- `packages/plugin-starter-tokens/src/code.ts`
- `packages/plugin-starter-tokens/src/ui.html`
- `packages/plugin-starter-tokens/src/presets/types.ts`
- `packages/plugin-starter-tokens/src/presets/builtin.ts`
- `packages/plugin-starter-tokens/src/presets/static-presets.ts`
- `packages/plugin-starter-tokens/src/presets/tailwind-colors.ts`
- `packages/plugin-starter-tokens/src/presets/local-presets.generated.ts`
- `packages/plugin-starter-tokens/src/presets/color-utils.ts`
- `packages/plugin-starter-tokens/src/token-definitions-to-token-bundle.ts`
- `packages/plugin-starter-tokens/src/token-definitions-export.ts`
- `packages/plugin-starter-tokens/src/presets/color-utils.test.mjs`
- `packages/plugin-starter-tokens/src/presets/palette-steps.test.mjs`
- `packages/plugin-starter-tokens/src/presets/primitive-tokens.test.mjs`
- `packages/plugin-starter-tokens/src/presets/semantic-color-modes.test.mjs`
- `packages/plugin-starter-tokens/src/presets/generation-options.test.mjs`
- `packages/plugin-starter-tokens/src/presets/bundle-color-modes.test.mjs`
- `packages/plugin-starter-tokens/src/token-assembly.test.mjs`
- `packages/plugin-starter-tokens/src/token-bundle-mapper.test.mjs`
- `packages/plugin-starter-tokens/src/token-definitions-export.test.mjs`
- `packages/plugin-starter-tokens/src/json-export-controller.test.mjs`

Shared packages et web app:

- `packages/ds-core/src/index.js`
- `packages/ds-core/src/index.d.ts`
- `packages/ds-core/src/color-utils.js`
- `packages/ds-core/src/palette-steps.js`
- `packages/ds-core/src/naming.js`
- `packages/ds-core/tests/token-bundle.test.mjs`
- `packages/ds-core/README.md`
- `packages/exporters/src/index.js`
- `apps/web/src/App.tsx`
- `apps/web/src/domain/project.ts`
- `apps/web/src/domain/token-bundle.ts`
- `apps/web/src/views/CreatorShell.tsx`
- `apps/web/src/views/FoundationsColorsView.tsx`
- `apps/web/src/views/ExportJsonView.tsx`

## Synthese courte

Le plugin possede deja une experience Colors beaucoup plus avancee que `apps/web`: choix de preset, neutral, palettes selectionnees, edition de palettes, edition de brand colors, base white/black, light/dark, primitives, semantic colors, overrides et tests de comportement.

`apps/web` possede seulement une base Phase B: une couleur `brandPrimary`, `baseWhite`, `baseBlack`, trois primitives, deux semantic tokens et un export JSON.

`ds-core` possede deja plusieurs briques reutilisables immediatement, mais pas encore le generateur Colors complet. Les helpers bas niveau sont prets; les recettes de generation et les templates semantic restent encore dans `packages/plugin-starter-tokens/src/code.ts`.

Conclusion: la prochaine implementation ne doit pas copier `code.ts` dans `apps/web`. Le chemin le plus sur est d'extraire progressivement les generateurs Colors purs vers `ds-core`, puis de brancher `apps/web` sur ces APIs.

## Ce qui existe deja cote plugin pour Colors

### UI et flow

`packages/plugin-starter-tokens/src/ui.html` contient le flow couleur actuel:

- ecran "Couleurs de marque & palettes";
- champs `Base white` et `Base black`;
- liste de brand colors avec ajout, edition et limite a 10 couleurs;
- modale d'ajout/edition de couleur avec input hex, color picker, contraste et preview de shades;
- select de library/preset via `presetSelect`;
- select de neutral via `neutralSelect`;
- cartes de palettes disponibles via `paletteCards`;
- selection/deselection de palettes;
- edition d'une palette via la meme modale de couleur;
- ecran "Semantic colors";
- choix `uiMode`: `light`, `dark`, `both`;
- groupes semantic par famille;
- select par semantic token pour choisir une reference;
- overrides semantic;
- generation payload avec `brands`, `presetId`, `neutralChoice`, `selectedPalettes`, `paletteOverrides`, `semanticOverrides`, `baseWhite`, `baseBlack`.

Cette UI est utile comme reference fonctionnelle, mais elle est plugin-only: elle vit dans un HTML monolithique, avec DOM direct et messagerie plugin.

### Presets et bibliotheques de palettes

Le plugin a un registre de presets:

- `packages/plugin-starter-tokens/src/presets/static-presets.ts` construit le preset Tailwind depuis `tailwind-colors.ts`.
- `packages/plugin-starter-tokens/src/presets/tailwind-colors.ts` contient `TAILWIND_COLORS`, `TAILWIND_STEPS`, `TAILWIND_NEUTRALS`.
- `packages/plugin-starter-tokens/src/presets/local-presets.generated.ts` contient des presets extraits, notamment `material` et `untitled-ui`.
- `packages/plugin-starter-tokens/src/presets/builtin.ts` fusionne presets statiques et locaux, exclut `polaris`, expose `BUILTIN_PRESETS`, `getPresetById`, `getPresetSummaries`.

Etat par rapport a la cible produit:

- Tailwind est implemente comme preset statique.
- Untitled UI existe comme preset genere.
- Material existe comme preset genere.
- Polaris est present dans les donnees extraites mais explicitement exclu du registre actif.
- Flowbite existe comme export d'exemple dans les assets, mais n'apparait pas comme preset actif dans `BUILTIN_PRESETS`.
- Shadcn n'apparait pas comme preset actif dans le code inspecte.

Donc le futur selector web peut commencer par les presets reellement disponibles, puis traiter Flowbite/Shadcn comme "a ajouter plus tard" sauf si leurs donnees sont formalisees dans le registre.

### Palette steps

Le plugin supporte:

- steps Tailwind `50..950`;
- pattern `hundreds`;
- `shadeCount` borne de 6 a 14;
- resolution d'un `baseStep`;
- lookup de steps dans des presets reels;
- fallback vers les steps standards;
- resolution du step le plus proche quand un preset ne possede pas exactement le step demande.

Ces helpers ont depuis ete extraits dans `ds-core`:

- `basePatternSteps`
- `pickSubset`
- `nextShadeStep`
- `extendSteps`
- `deriveShadeSteps`
- `resolveBaseStep`
- `closestStep`
- `parsePresetNumericStep`
- `sortPresetSteps`
- `fallbackPresetSteps`
- `getPaletteSteps`
- `resolveClosestPaletteStep`
- `normalizePresetSteps`
- `closestPresetStep`

### Brand colors

Le plugin gere:

- `BrandColorInput` avec `name`, `color`, `contrast`, `scale`;
- maximum 10 brand colors;
- premiere brand comme primary, utilisee pour piloter semantic/accent;
- brands additionnelles en primitives;
- fallback `brand-primary` si aucune couleur n'est fournie;
- generation d'une scale complete via `buildBrandScale`;
- support d'une custom scale complete via `extractCustomBrandScale`;
- noms normalises avec `sanitizePrimaryName`;
- aliases `colors/brand/{step}` vers la primary brand;
- opacites brand `opacity/brand-N/{pct}`.

Le coeur bas niveau `buildBrandScale` est maintenant exporte par `ds-core`, mais l'orchestration `normalizeBrands`, `extractCustomBrandScale`, `sanitizePrimaryName` et la generation de tokens brand restent dans `code.ts`.

### Neutral, white et black

Le plugin gere:

- `baseWhite` et `baseBlack`, valides par `parseColorInput`;
- `neutralChoice`, valide contre `preset.neutralOptions`;
- fallback vers `preset.defaultNeutral`;
- aliases `colors/gray/{step}` vers `colors/{neutralChoice}/{step}`;
- inclusion automatique du neutral selectionne quand une liste de palettes selectionnees existe.

### Primitives colors

`buildPrimitiveTokens` dans `code.ts` genere notamment:

- `colors/base/white`;
- `colors/base/black`;
- toutes les palettes selectionnees du preset;
- overrides de palettes;
- `colors/gray/*` comme alias vers la neutral choisie;
- `colors/{brand-token-name}/{step}`;
- `colors/brand/{step}` comme alias vers la primary brand;
- `opacity/white/*`, `opacity/black/*`, `opacity/brand-N/*`.

Attention: cette fonction genere aussi `pixel/*`, spacing, radius et d'autres primitives. Pour la migration web Colors, il faudra isoler la partie couleur au lieu de reprendre tout le bloc tel quel.

### Semantic color modes

Le plugin contient une generation semantic avancee:

- familles `bg`, `text`, `icon`, `border`;
- template `KIGEN_COLOR_MODES_TEMPLATE`;
- aliases legacy via `LEGACY_COLOR_MODE_ALIASES`;
- resolution d'intents `error`, `success`, `warning`, `info`, `offer`;
- candidats de palettes par intent;
- synonymes de palettes;
- transformation dark mode pour neutral, intent et accent;
- support `light`, `dark`, `both`;
- overrides semantic depuis l'UI;
- scopes Figma via `semanticScopes`.

Fonctions importantes dans `code.ts`:

- `generateColorModesTokens`
- `buildColorModeTokens`
- `compareColorModesStructure`
- `convertKigenReferenceToPluginRef`
- `applyDarkModeTransformForReference`
- `resolveIntentPalette`
- `resolvePaletteWithSynonyms`
- `resolvePrimitivePaletteStep`
- `resolveDarkNeutralStep`
- `remapNeutralStepForDark`
- `remapIntentStepForDark`

Cette logique est majoritairement pure, mais elle retourne aujourd'hui des `TokenDefinition[]` plugin avec collections runtime et scopes Figma. Elle doit etre extraite comme generateur TokenBundle ou generateur core avant usage dans `apps/web`.

### TokenBundle et export

Le plugin possede deja un pont:

- `token-definitions-to-token-bundle.ts` mappe les `TokenDefinition` runtime vers `TokenBundle`.
- `token-definitions-export.ts` exporte ces definitions via `exportTokenBundleJson`.
- `code.ts` peut accepter un `tokenBundle` optionnel pour brancher des semantic tokens normalises.

Ce pont est utile pour comprendre la migration, mais il reste centre sur le modele runtime du plugin. Pour `apps/web`, il vaut mieux generer directement un `TokenBundle` depuis l'etat projet web.

### Tests plugin autour des colors

Tests utiles existants:

- `color-utils.test.mjs`: parsing couleur, alpha, brand scale.
- `palette-steps.test.mjs`: steps, presets, normalisation de key, closest step.
- `primitive-tokens.test.mjs`: primitives, palettes selectionnees, neutral aliases, brand aliases.
- `semantic-color-modes.test.mjs`: mappings semantic light/dark, intents, neutral/dark remapping.
- `generation-options.test.mjs`: payload, presets, selected palettes, overrides.
- `bundle-color-modes.test.mjs`: TokenBundle semantic branche dans les modes couleur.
- `token-assembly.test.mjs`: assembly de primitives et color modes.
- `token-bundle-mapper.test.mjs`: mapping runtime vers TokenBundle.
- `token-definitions-export.test.mjs`: export JSON via TokenBundle.

Ces tests doivent devenir la base de verrouillage lors des extractions vers `ds-core`.

## Ce qui existe deja cote ds-core

`packages/ds-core` contient maintenant:

- contrat `TokenBundle`;
- `validateTokenBundle`;
- `normalizeTokenBundle`;
- `toFlatTokenList`;
- `createPluginInputFromTokenBundle`;
- `normalizeTokenName`;
- `isSlashCaseTokenName`;
- `normalizePaletteKey`;
- `parseColorInput`;
- `rgbaToHex`;
- `colorWithAlpha`;
- `sanitizeKebabSegment`;
- `buildBrandScale`;
- helpers de palette steps et preset steps.

Ce qui est deja exploitable directement par `apps/web`:

- validation et normalisation de TokenBundle;
- types `TokenBundle`, `TokenEntry`, `TokenMode`, `TokenType`;
- generation d'une scale brand avec `buildBrandScale`;
- parsing/validation couleur avec `parseColorInput`;
- opacites avec `colorWithAlpha`;
- normalisation de segments avec `sanitizeKebabSegment`;
- steps de palettes avec `deriveShadeSteps`, `resolveBaseStep`, `normalizePresetSteps`, `getPaletteSteps`, `resolveClosestPaletteStep`;
- normalisation de key palette avec `normalizePaletteKey`.

Limites actuelles de `ds-core`:

- pas de type `PresetDefinition` core public;
- pas de registre de presets public;
- pas de generateur `buildColorPrimitiveTokenBundle`;
- pas de generateur semantic light/dark core;
- pas de model de settings Colors web: presets, brands, neutral, selected palettes, overrides;
- pas de validation de completeness semantic;
- pas de validation de contraste;
- pas de fonction qui retourne un TokenBundle Colors complet.

## Ce qui existe deja cote apps/web

`apps/web` existe et fonctionne comme scaffold Phase B.

Etat projet:

- `apps/web/src/domain/project.ts`
- `LocalProject` contient `name`, `modeSetup`, `preset`, `syncStatus`, dates et `foundations.colors`.
- `foundations.colors` contient seulement `brandPrimary`, `baseWhite`, `baseBlack`.
- `ProjectPreset` vaut seulement `custom | starter`.

Generation TokenBundle:

- `apps/web/src/domain/token-bundle.ts`
- `buildMinimalTokenBundle(project)` genere:
  - `colors/base/white`;
  - `colors/base/black`;
  - `colors/brand/500`;
  - `text/primary`;
  - `bg/canvas`;
  - `components: []`.
- La generation appelle `normalizeTokenBundle` depuis `@starter-tokens/ds-core`.
- La validation est faite dans `App.tsx` via `validateTokenBundle`.

UI Colors:

- `apps/web/src/views/FoundationsColorsView.tsx`
- UI minimale avec input texte et input color pour `brandPrimary`.
- Table affichant primitives + semantic.
- Message indiquant explicitement que Phase B ne genere que base white, base black, brand 500, text primary et bg canvas.

Export:

- `apps/web/src/views/ExportJsonView.tsx`
- utilise `exportTokenBundleJson` depuis `@starter-tokens/exporters`.

Limites actuelles:

- pas de selector de library palette;
- pas de presets Tailwind/Untitled/Material visibles;
- pas de neutral selection;
- pas de selected palettes;
- pas de palette cards;
- pas de brand list;
- pas de brand scale 50..950;
- pas d'edition de shades;
- pas de `paletteOverrides`;
- pas de `semanticOverrides`;
- pas de semantic light/dark complet;
- pas de generation d'opacites;
- pas de validation contraste;
- pas de model Colors proche de la spec V1.

## Reutilisable maintenant dans apps/web via ds-core

Peut etre utilise directement, sans extraction prealable:

- `normalizeTokenBundle`
- `validateTokenBundle`
- `TokenBundle` et types associes
- `parseColorInput`
- `buildBrandScale`
- `colorWithAlpha`
- `sanitizeKebabSegment`
- `normalizePaletteKey`
- `deriveShadeSteps`
- `resolveBaseStep`
- `normalizePresetSteps`
- `getPaletteSteps`
- `resolveClosestPaletteStep`
- `closestPresetStep`

Usage recommande immediat:

- valider `baseWhite`, `baseBlack`, brand hex/rgb;
- generer une premiere brand scale 50..950;
- construire un TokenBundle Colors plus riche dans `apps/web`, mais seulement si la recette de generation est extraite ou dupliquee temporairement dans une couche web clairement provisoire.

Preference d'architecture:

- eviter de recreer dans `apps/web` une version differente de `buildPrimitiveTokens`;
- eviter d'importer `packages/plugin-starter-tokens/src/code.ts`;
- preferer une extraction core avant d'elargir fortement le Creator Colors.

## Ce qui doit etre extrait avant reutilisation propre

### Preset registry

Actuellement bloque dans le plugin:

- `PresetDefinition`
- `PresetSummary`
- `PresetPalettePreview`
- `BUILTIN_PRESETS`
- `getPresetById`
- `getPresetSummaries`
- `STATIC_PRESETS`
- `TAILWIND_COLORS`
- `LOCAL_PRESETS`

Cible recommandee:

- extraire vers `ds-core` ou un sous-module core de presets, par exemple `@starter-tokens/ds-core/presets` si l'API publique est formalisee;
- garder les scripts d'extraction dans le plugin ou dans un futur package tooling si besoin;
- ne pas forcer `apps/web` a importer depuis `packages/plugin-starter-tokens/src/presets/*`.

### Colors generation inputs

Actuellement dans le plugin:

- `GenerationOptions`
- `BrandColorInput`
- `UiMode`
- `NamingPattern`
- champs `baseWhite`, `baseBlack`, `neutralChoice`, `selectedPalettes`, `paletteOverrides`, `semanticOverrides`, `brands`.

Cible recommandee:

- definir un type core dedie aux colors, par exemple `ColorGenerationInput`;
- separer les champs purement produit des champs plugin-only (`createTextStyles`, `icons`, Figma runtime).

### Primitive color generator

Actuellement bloque dans `buildPrimitiveTokens`.

A extraire en core:

- generation base white/black;
- generation palettes selectionnees;
- palette overrides;
- neutral aliases `colors/gray/*`;
- brands normalisees;
- brand scales;
- aliases `colors/brand/*`;
- opacites white/black/brand.

Important:

- ne pas extraire en meme temps typography, spacing et radius;
- la Phase C Colors doit garder un scope couleur.

### Semantic color generator

Actuellement bloque dans `code.ts`.

A extraire en core apres primitives:

- template semantic;
- mapping light/dark;
- intents;
- neutral dark transform;
- brand/accent transform;
- semantic overrides;
- sortie TokenBundle semantic, avec aliases prefixes `primitives/...`.

A ne pas mettre dans core:

- `semanticScopes` si on le considere strictement Figma;
- mutation Figma;
- collections runtime `1. color-modes`;
- helpers d'alias Figma.

### TokenDefinition runtime bridge

`token-definitions-to-token-bundle.ts` est utile mais ne doit pas devenir le chemin web principal.

Pour `apps/web`:

- generer directement `TokenBundle.collections.primitives`;
- generer directement `TokenBundle.collections.semantic`;
- laisser le futur plugin/importer transformer le TokenBundle vers Figma.

## Ce qui ne doit pas etre migre tel quel vers apps/web

Ne pas importer ou copier:

- `packages/plugin-starter-tokens/src/code.ts`;
- `packages/plugin-starter-tokens/src/ui.html`;
- la logique DOM du wizard plugin;
- `figma.*`;
- `figma.ui.postMessage`;
- mutation de variables Figma;
- text style binding;
- icon import/binding;
- logique `lastGeneratedExportJson` du plugin;
- collections runtime plugin comme source produit.

Le web peut reprendre les concepts UX, pas la structure technique du plugin.

## Roadmap recommandee pour un Colors Creator proche du plugin

### Etape 1 - Palette library selector

But:

- afficher les libraries/presets disponibles;
- commencer par les presets reellement actifs: Tailwind, Untitled UI, Material si valide;
- marquer Flowbite/Shadcn comme non disponibles tant que le registre ne les expose pas.

Pre-requis recommande:

- extraire ou exposer le preset registry cote `ds-core`;
- ajouter tests de registry: ids, labels, neutralOptions, defaultNeutral, previewPalettes.

Validation:

- `apps/web` ne depend pas de `plugin-starter-tokens`;
- selector alimente par une API shared.

### Etape 2 - Brand colors editor

But:

- remplacer le simple `brandPrimary` par une liste de brands;
- supporter name + color;
- limiter a 10;
- primary brand pilote semantic;
- afficher scale 50..950 generee via `buildBrandScale`.

Pre-requis recommande:

- type shared `BrandColorInput` ou equivalent;
- helper core pour normaliser brands et custom scales.

Validation:

- scale stable;
- `colors/brand/*` alias vers primary;
- brands additionnelles restent primitives.

### Etape 3 - Neutral / black / white config

But:

- edition de `baseWhite`;
- edition de `baseBlack`;
- choix `neutralChoice` depuis le preset;
- generation `colors/gray/*` comme alias vers neutral.

Pre-requis recommande:

- preset registry expose `neutralOptions` et `defaultNeutral`;
- helper core pour valider neutral contre le preset.

Validation:

- neutral selectionnee incluse meme si selected palettes est limite;
- aliases `colors/gray/*` valides dans le TokenBundle.

### Etape 4 - Primitives color TokenBundle

But:

- produire un TokenBundle primitives colors proche du plugin:
  - base;
  - preset palettes selectionnees;
  - neutral aliases;
  - brand scales;
  - brand aliases;
  - opacites.

Pre-requis recommande:

- extraire un generateur core qui retourne des `TokenEntry[]` ou un sous-bundle couleur.

Validation:

- tests core avec fixtures provenant des tests plugin;
- `validateTokenBundle` OK;
- export JSON OK via `packages/exporters`.

### Etape 5 - Semantic light/dark TokenBundle

But:

- generer semantic colors pour light, dark et light+dark;
- supporter overrides semantic;
- garder aliases vers primitives;
- eviter les hardcodes directs dans semantic.

Pre-requis recommande:

- extraire semantic template et mapping vers `ds-core`;
- definir si les legacy aliases du plugin doivent rester dans le web MVP ou rester compat plugin.

Validation:

- semantic tokens couvrent `text`, `bg`, `border`, `icon`;
- dark mode transforme neutral/intents/brand de maniere stable;
- aliases prefixes `primitives/...`;
- tests equivalents a `semantic-color-modes.test.mjs`.

### Etape 6 - Preview/export JSON

But:

- afficher primitives et semantic dans `apps/web`;
- preview light/dark lisible;
- export JSON via `exportTokenBundleJson`;
- conserver `components: []` tant que component builder reste V2.

Validation:

- JSON parseable;
- TokenBundle normalise;
- export independant du plugin.

### Etape 7 - Preparation import plugin

But:

- definir le payload que le plugin importera;
- garder le flux one-way `apps/web -> plugin`;
- ne pas ajouter de bidirectional sync.

Validation:

- le plugin consomme un TokenBundle;
- le web ne connait pas l'API Figma;
- le handoff est documente avant implementation.

## Prochaine etape d'implementation recommandee

Prochaine etape la plus sure:

1. Extraire ou formaliser dans `ds-core` le registre de presets Colors minimum.
2. Ajouter les tests core qui verrouillent:
   - ids et labels des presets disponibles;
   - `neutralOptions`;
   - `defaultNeutral`;
   - `previewPalettes`;
   - steps disponibles.
3. Ensuite seulement, brancher `apps/web` sur un premier `PaletteLibrarySelector`.

Pourquoi commencer par le preset registry:

- le selector de library est la premiere marche UX de la Phase C;
- il evite de coder `apps/web` contre des donnees plugin-locales;
- il clarifie tout de suite quelles libraries sont vraiment disponibles;
- il ne force pas encore l'extraction du generateur semantic complet.

Ne pas commencer par:

- copier `ui.html`;
- importer `code.ts`;
- reconstruire tout `buildPrimitiveTokens` dans `apps/web`;
- ajouter le sync Figma;
- ajouter Flowbite/Shadcn tant que leurs presets ne sont pas dans le registre actif;
- etendre les components ou Expert Mode.

## Risques si on migre trop vite

- `apps/web` peut devenir couplee au plugin et perdre son independance produit.
- Deux generateurs Colors peuvent diverger: un dans le plugin, un dans le web.
- Les exports JSON peuvent ne plus correspondre aux variables Figma generees.
- Les mappings light/dark peuvent diverger si la logique semantic est dupliquee.
- Le registre de presets peut etre incoherent entre UI plugin, web et TokenBundle.
- Le plugin peut rester la vraie source de verite par inertie.
- Les features V2 comme component builder, bidirectional sync ou Expert Mode peuvent revenir trop tot.

## Definition de succes pour la Phase C implementation

La prochaine implementation sera reussie si:

- `apps/web` affiche un selector de library alimente par une source shared;
- Tailwind et les presets actifs sont representes sans import plugin;
- le projet web stocke une configuration Colors plus riche;
- les primitives couleur sont generees via `ds-core`;
- les semantic colors sont planifiees comme extraction core, pas comme copie de plugin;
- le TokenBundle reste le contrat central;
- le plugin Figma n'est pas modifie sauf dans une phase importer ulterieure.

