# Source Of Truth

## Date

- 2026-04-13

## But

Ce document explique clairement :

- quelle est la source de verite actuelle du projet
- quels chemins sont actifs
- quels chemins sont legacy ou transitoires
- quel document doit faire foi quand plusieurs sources se recoupent

Son role est simple :

- eviter les confusions
- eviter de coder dans les mauvais fichiers
- reduire le temps de recontextualisation en debut de session

## Version courte

On suit cette hierarchie :

1. Figma = source de verite de l'intention design
2. `packages/ds-core` = source de verite du contrat technique
3. `packages/plugin-starter-tokens` = source de verite du runtime plugin
4. `manifest.json` = source de verite des entrypoints executes par Figma
5. `docs/` = source de verite des decisions produit, architecture et roadmap
6. les anciens fichiers plugin a la racine ne doivent pas etre traites comme l'implementation active par defaut

## Modele global de source de verite

Le projet suit un modele hybride.

Ce n'est pas :

- Figma seul
- repo seul

C'est :

1. Figma-first pour l'intention design et produit
2. repo-first pour la stabilite technique et le contrat
3. runtime plugin-first pour le comportement reel actuellement implemente

Concretement :

- les designers definissent la logique DS dans Figma
- le repo formalise cette logique dans un contrat exploitable
- le plugin applique l'etat reel de cette logique dans Figma et plus tard cote export dev

## Source de verite par domaine

## 1. Intention design

Source principale :

- le fichier Figma DS et les decisions design associees

Cela couvre :

- l'intention des composants
- les variants
- les states
- la structure des pages
- la logique visuelle
- les conventions de design

Si la question est :

- comment un composant doit se comporter
- quels states sont obligatoires
- quelle structure Figma est attendue

alors la reponse commence par le design, pas par le code.

## 2. Contrat technique

Source principale :

- `packages/ds-core`

Fichiers principaux :

- `packages/ds-core/src/index.js`
- `packages/ds-core/src/index.d.ts`
- `packages/ds-core/fixtures/token-bundle.sample.json`

Cela couvre :

- ce qu'est un `TokenBundle` valide
- les noms canoniques
- les modes supportes
- les types supportes
- la normalisation
- la validation

Si la question est :

- est-ce que ce bundle est valide
- est-ce que ce nom de token est accepte
- est-ce qu'un alias est autorise
- sur quoi le runtime et les exports peuvent s'appuyer

alors la reponse doit venir de `ds-core`.

## 3. Runtime du plugin

Source principale :

- `packages/plugin-starter-tokens`

Fichiers principaux :

- `packages/plugin-starter-tokens/src/code.ts`
- `packages/plugin-starter-tokens/src/ui.html`
- `packages/plugin-starter-tokens/package.json`

Cela couvre :

- ce que fait vraiment le plugin aujourd'hui
- ce que l'UI expose vraiment aujourd'hui
- quels payloads sont consommes aujourd'hui
- ce qui est effectivement genere aujourd'hui
- ce qui n'est pas encore implemente

Si la question est :

- quel est le comportement actuel du plugin
- quel est le flow actuel du wizard
- quels ecrans existent aujourd'hui
- quelle generation est disponible aujourd'hui

alors la reponse doit venir de ce package, pas des anciens fichiers racine.

## 4. Entry points reels utilises par Figma

Source principale :

- `manifest.json`

Verite runtime actuelle :

- `main`: `packages/plugin-starter-tokens/dist/code.js`
- `ui`: `packages/plugin-starter-tokens/dist/ui.html`

Point important :

- Figma n'utilise plus les anciens `code.js` et `ui.html` racine comme entrypoints principaux

## 5. Vision produit et architecture

Source principale :

- `docs/shared-source-of-truth-plan.md`

Docs de support :

- `docs/source-of-truth.md`
- `docs/token-bundle-contract.md`
- `docs/bridge-token-research.md`
- `docs/local-machine-recap.md`
- `docs/project-operating-system.md`

Cela couvre :

- la vision produit
- l'architecture cible
- la roadmap
- la repartition design/dev
- les decisions transverses

Si la question est :

- qu'est-ce qu'on construit reellement
- pourquoi une direction a ete choisie
- quelle est la prochaine etape
- comment le DS mutualise, le plugin et l'export dev s'articulent

alors il faut commencer par `docs/shared-source-of-truth-plan.md`.

## Chemins actifs

Ce sont les chemins a traiter comme actifs et prioritaires.

## Couche contrat

- `packages/ds-core/src/index.js`
- `packages/ds-core/src/index.d.ts`
- `packages/ds-core/fixtures/token-bundle.sample.json`
- `packages/ds-core/tests/token-bundle.test.mjs`

## Couche plugin

- `packages/plugin-starter-tokens/src/code.ts`
- `packages/plugin-starter-tokens/src/ui.html`
- `packages/plugin-starter-tokens/src/presets/*`
- `packages/plugin-starter-tokens/scripts/*`
- `packages/plugin-starter-tokens/dist/*`

## Configuration repo

- `manifest.json`
- `package.json`
- `README.md`

## Documentation active

- `docs/shared-source-of-truth-plan.md`
- `docs/source-of-truth.md`
- `docs/token-bundle-contract.md`
- `docs/expert-mode-spec.md`
- `docs/dev-export-strategy.md`
- `docs/legacy-cleanup-status.md`

## Chemins legacy ou transitoires

L'ancienne implementation plugin racine a ete archivee, mais ne doit pas etre traitee comme la base active par defaut.

Exemples :

- `legacy/root-plugin/src/*`
- `legacy/root-plugin/scripts/*`
- `legacy/root-plugin/dist/*`
- `legacy/root-plugin/code.js`
- `legacy/root-plugin/ui.html`
- `legacy/root-plugin/tsconfig.json`
- `backups/*`

Important :

- ces fichiers peuvent encore servir de references de migration
- mais ils ne representent pas la source de verite principale actuelle

## Regle pratique d'edition

Quand on modifie le comportement du plugin :

- on edite `packages/plugin-starter-tokens/*`

Quand on modifie le contrat DS :

- on edite `packages/ds-core/*`

Quand on modifie les regles produit, architecture ou roadmap :

- on edite `docs/*`

Quand on modifie les entrypoints reels du plugin :

- on verifie `manifest.json`

## Precedence documentaire

Quand plusieurs docs se recoupent, on suit cet ordre :

1. `docs/shared-source-of-truth-plan.md`
2. `docs/source-of-truth.md`
3. `docs/token-bundle-contract.md`
4. implementation dans `packages/ds-core`
5. implementation dans `packages/plugin-starter-tokens`
6. docs de recap, handoff ou anciens plans

Pourquoi :

- les docs en tete definissent l'intention et l'organisation
- le code actif definit la realite implemente
- les anciens recaps sont utiles, mais vieillissent plus vite

## Comment resoudre un conflit entre sources

## Cas 1. Doc contrat vs runtime plugin

Interpretation :

- le runtime peut etre en avance ou en retard par rapport a l'architecture cible

Action :

- documenter l'ecart
- ne pas supposer en silence que les deux ont raison

## Cas 2. Ancien recap vs code actif du package

Interpretation :

- le recap est probablement date ou incomplet

Action :

- faire confiance au code actif du package
- puis mettre a jour la doc si besoin

## Cas 3. Intention Figma vs contrat technique

Interpretation :

- l'intention design peut etre juste conceptuellement, mais pas encore normalisee cote technique

Action :

- preserver l'intention design
- faire evoluer le contrat ou ajouter une migration

## Verite actuelle sur l'etat du plugin

## Ce qui est deja implemente

- separation monorepo entre contrat DS et runtime plugin
- manifest branche sur le package actif
- le plugin accepte `tokenBundle`
- le plugin valide et normalise l'entree bundle
- le plugin peut brancher la generation semantic depuis le bundle
- un fallback sans bundle existe encore

## Ce qui n'est pas encore pleinement implemente

- le mode expert n'est pas encore un flow fini et debloque
- `components/*` n'est pas encore un flux end-to-end complet
- l'export dev n'est pas encore formalise dans le flow produit visible
- la sync est encore une phase future

## Verite actuelle sur le DS mutualise

Aujourd'hui, le DS mutualise existe sur 3 couches :

1. l'intention design dans Figma et dans les docs DS
2. les primitives UI et conventions partagees dans `packages/plugin-starter-tokens/src/ui.html`
3. la direction contractuelle dans `packages/ds-core`

C'est une bonne base.
Ce n'est pas encore un systeme parfaitement unifie de bout en bout.

## Checklist de reprise de session

Pour reprendre le contexte rapidement et proprement, lire dans cet ordre :

1. `README.md`
2. `docs/shared-source-of-truth-plan.md`
3. `docs/source-of-truth.md`
4. `docs/token-bundle-contract.md`
5. `docs/expert-mode-spec.md`
6. `docs/dev-export-strategy.md`
7. `packages/ds-core/src/index.d.ts`
8. `packages/plugin-starter-tokens/src/code.ts`

## Regles non negociables

1. Ne pas traiter les anciens fichiers plugin racine comme source active par defaut.
2. Ne pas faire evoluer le contrat uniquement dans le runtime plugin.
3. Ne pas ajouter une nouvelle semantique DS sans la documenter.
4. Ne pas laisser l'export dev diverger silencieusement du contrat.
5. Ne pas melanger "ce qui est implemente aujourd'hui" et "ce qui est vise a terme".

## Etat du cleanup technique

Le cleanup technique est volontairement non destructif a ce stade.

Cela veut dire :

- on clarifie d'abord
- on marque les chemins legacy
- on verifie les dependances reelles
- puis seulement on envisage deplacer, archiver ou supprimer

Le document de suivi pour cette partie est :

- `docs/legacy-cleanup-status.md`

## Prochaine reference a lire apres ce fichier

Le document le plus important a lire ensuite cote contrat est :

- `docs/token-bundle-contract.md`

Le document le plus important a lire ensuite cote produit est :

- `docs/shared-source-of-truth-plan.md`
