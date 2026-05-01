# Plan d'implementation - apps/web

Date: 2026-05-01

## Objectif

Demarrer la vraie web app du produit sans deplacer le plugin Figma, sans ajouter de backend, et sans reconstruire tout le produit d'un coup.

La web app doit devenir la surface principale de creation, configuration, preview, sauvegarde locale et export du Design System. Le plugin Figma doit rester, a terme, un pont d'import/sync qui prend un TokenBundle genere par la web app et l'ecrit dans Figma.

Ce document est un plan. Il ne cree pas encore `apps/web`.

## Sources inspectees

- `docs/technical/current-product-architecture-status.md`
- `docs/technical/monorepo-target-architecture.md`
- `docs/technical/migration-roadmap.md`
- `docs/product/mvp-scope.md`
- `package.json`
- `packages/ds-core/package.json`
- `packages/ds-core/src/index.d.ts`
- `packages/exporters/package.json`
- `packages/exporters/src/index.js`

## Recommandation de stack

Recommandation: React + Vite + TypeScript.

Pourquoi:

- Le repo est deja TypeScript/ESM cote plugin et packages.
- La premiere web app doit etre local-first, sans backend et sans routing serveur.
- Vite donne un demarrage simple pour une SPA produit.
- React est coherent avec une future interface riche: dashboard, Creator shell, token tables, previews, panneaux d'export.
- Next ajouterait maintenant des decisions inutiles: serveur, routing framework, conventions app/router, rendu hybride, deploiement, auth plus tentante.

Decision:

- Utiliser `apps/web` comme SPA Vite React TypeScript.
- Eviter Next pour le premier shell.
- Eviter Tailwind au demarrage; commencer avec CSS simple dans `src/styles.css` pour ne pas melanger le sujet "web app produit" avec le futur export Tailwind.
- Ajouter un routeur seulement quand plusieurs vrais ecrans existent. Le premier shell peut gerer les vues par etat React.

## Structure minimale recommandee

Structure a creer dans la prochaine phase, pas maintenant:

```text
apps/web/
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── styles.css
    ├── domain/
    │   ├── project.ts
    │   └── token-bundle.ts
    ├── storage/
    │   └── local-projects.ts
    └── views/
        ├── DashboardView.tsx
        ├── NewProjectView.tsx
        ├── CreatorShell.tsx
        ├── FoundationsColorsView.tsx
        └── ExportJsonView.tsx
```

### `apps/web/package.json`

Responsabilite:

- Declarer l'app web.
- Declarer les scripts web locaux.
- Dependre de React, Vite, TypeScript, `@starter-tokens/ds-core`, et `@starter-tokens/exporters`.

Scripts recommandes:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  }
}
```

Dependances recommandees:

- `@starter-tokens/ds-core`
- `@starter-tokens/exporters`
- `@vitejs/plugin-react`
- `vite`
- `typescript`
- `react`
- `react-dom`
- `@types/react`
- `@types/react-dom`

Note workspace:

- Le `package.json` racine ne couvre aujourd'hui que `packages/*`.
- Lors du scaffold, il faudra ajouter `apps/*` aux workspaces racine ou utiliser une entree plus ciblee si besoin.

### `apps/web/index.html`

Responsabilite:

- Point d'entree HTML Vite.
- Monter React dans `#root`.

### `apps/web/src/main.tsx`

Responsabilite:

- Initialiser React.
- Importer `App`.
- Importer `styles.css`.

### `apps/web/src/App.tsx`

Responsabilite:

- Orchestrer le shell MVP.
- Gerer la navigation locale entre dashboard, creation projet, Creator et export JSON.
- Garder le premier etat produit simple avant d'ajouter un routeur.

### `apps/web/src/styles.css`

Responsabilite:

- Styles globaux du shell.
- Layout dashboard/creator.
- Tables et panneaux simples.
- Pas de design system partage encore.

### `apps/web/src/domain/project.ts`

Responsabilite:

- Types web app pour un projet local.
- Metadata: id, name, createdAt, updatedAt, modeSetup, syncStatus.
- Etat d'edition local qui ne doit pas entrer tel quel dans `ds-core`.

### `apps/web/src/domain/token-bundle.ts`

Responsabilite:

- Construire un TokenBundle minimal a partir de l'etat projet.
- Appeler `normalizeTokenBundle` et `validateTokenBundle`.
- Rester sans dependance plugin.

### `apps/web/src/storage/local-projects.ts`

Responsabilite:

- Sauvegarde locale via `localStorage`.
- Pas de backend.
- Pas d'auth.
- Pas de base de donnees.

### `apps/web/src/views/*`

Responsabilite:

- Garder les vues lisibles et separer rapidement les surfaces principales.
- Eviter un `App.tsx` qui devient le nouveau `ui.html` geant.

## Packages partages a utiliser au depart

Utiliser seulement:

- `@starter-tokens/ds-core`
- `@starter-tokens/exporters`

Usage initial de `ds-core`:

- `normalizeTokenBundle`
- `validateTokenBundle`
- types TokenBundle si disponibles via TypeScript
- helpers de couleur/palette uniquement si necessaires a la premiere section Colors

Usage initial de `exporters`:

- `exportTokenBundleJson`

Ne pas importer:

- `packages/plugin-starter-tokens/src/code.ts`
- `packages/plugin-starter-tokens/src/ui.html`
- modules plugin-only
- manifest plugin
- logique Figma runtime

## Premier scope MVP recommande

Le premier shell web doit prouver la boucle produit locale, pas tout le produit.

### 1. Dashboard local minimal

Objectif:

- Voir une liste de projets locaux.
- Creer un nouveau projet.
- Ouvrir un projet existant.

Donnees minimales:

- nom du projet
- date de modification
- nombre de tokens
- modes: light, dark, ou light + dark
- statut Figma simple: `not-connected`

Pas encore:

- auth
- equipes
- backend
- collaboration

### 2. Creation d'un nouveau projet local

Objectif:

- Saisir un nom.
- Choisir un preset minimal: `custom` ou `starter`.
- Choisir les modes: `light` ou `light-dark`.
- Creer un projet local.

Decision de scope:

- Garder le formulaire volontairement court.
- Ne pas reproduire tout le wizard plugin.
- Ne pas ajouter import Figma ou import JSON dans cette premiere etape.

### 3. Creator shell

Objectif:

- Installer la structure produit cible:
  - header projet
  - navigation laterale
  - zone principale
  - panneau preview/export simple

Sections visibles au debut:

- Dashboard
- Foundations / Colors
- Export JSON

Sections affichees mais desactivees si utile:

- Typography
- Spacing
- Radius
- Semantic tokens
- Figma handoff

Important:

- Les sections desactivees doivent etre signalees comme non implementees, sans simuler une feature finie.

### 4. Foundations / Colors

Objectif:

- Premier editeur de fondation.
- Saisir une couleur brand primaire.
- Generer ou definir quelques tokens primitifs minimum.
- Produire un TokenBundle valide.

Scope minimal:

- `colors/base/white`
- `colors/base/black`
- `colors/brand/500`
- `text/primary`
- `bg/canvas`

Le but n'est pas encore de reproduire toute la generation palette du plugin.

### 5. Generation TokenBundle local

Objectif:

- Convertir l'etat projet en TokenBundle minimal.
- Valider avec `validateTokenBundle`.
- Normaliser avec `normalizeTokenBundle`.
- Afficher les erreurs de validation si le bundle est invalide.

Regle:

- Le TokenBundle est le modele d'echange.
- L'etat UI du dashboard ou des formulaires ne doit pas devenir le contrat.

### 6. Preview JSON

Objectif:

- Afficher le TokenBundle normalise dans la web app.
- Montrer les collections `primitives`, `semantic`, `components`.
- Rendre visible light/dark et les alias.

Cette preview remplace le besoin d'un export avance au tout debut.

### 7. Export JSON via exporters

Objectif:

- Appeler `exportTokenBundleJson`.
- Afficher le JSON exporte.
- Ajouter une action copier.
- Ajouter une action telecharger seulement si simple et locale.

Pas encore:

- CSS variables
- Tailwind config
- ZIP
- historique d'exports
- options avancees

### 8. Pas encore de sync Figma avancee

Objectif:

- Preparer mentalement le handoff, pas l'implementer.

Le premier shell peut afficher une section "Figma handoff" informative:

- TokenBundle pret
- copier/exporter JSON
- importer plus tard dans le plugin

Mais il ne doit pas encore essayer de gerer:

- import key distante
- connexion Figma
- diff
- conflit
- sync bidirectionnelle

## Ce qu'il ne faut pas faire dans cette premiere etape

Ne pas faire:

- Pas d'auth.
- Pas de backend.
- Pas de base de donnees.
- Pas de billing.
- Pas de workspace equipe.
- Pas de CSS exporter.
- Pas de Tailwind exporter.
- Pas de Style Dictionary.
- Pas de React theme export.
- Pas de component builder.
- Pas de Button/Input generation.
- Pas de bidirectional sync.
- Pas de conflict resolution.
- Pas d'import depuis Figma.
- Pas d'import depuis JSON.
- Pas de deplacement massif du plugin UI vers la web app.
- Pas d'import depuis `packages/plugin-starter-tokens/src/*`.
- Pas de package `packages/ui` tant qu'il n'y a pas de repetition reelle.
- Pas de refactor plugin pendant le scaffold web.

## Connexion future avec le plugin Figma

Flux cible simple:

1. La web app cree et edite le projet.
2. La web app genere un TokenBundle normalise.
3. La web app exporte ou copie ce TokenBundle.
4. L'utilisateur ouvre le plugin Figma.
5. Le plugin importe le TokenBundle.
6. Le plugin valide et normalise le bundle avec `ds-core`.
7. Le plugin ecrit les variables, collections, modes, styles et plus tard composants dans Figma.
8. Le plugin renvoie un statut visible: succes, warnings, erreurs.

V1 peut rester fichier/copie-colle:

- export JSON depuis web app
- import JSON dans plugin

Plus tard, un import key pourra remplacer le copier/coller:

- la web app genere une cle ou un payload
- le plugin recupere le TokenBundle associe
- la sync reste one-way web app -> Figma tant que le modele de conflit n'existe pas

## Roadmap courte

### Phase A - Plan apps/web

Statut: ce document.

Livrable:

- `docs/technical/apps-web-implementation-plan.md`

Validation:

- Le plan confirme la stack.
- Le plan confirme le scope MVP.
- Le plan confirme les limites.
- Aucun code runtime n'est modifie.

### Phase B - Scaffold apps/web minimal

Livrables:

- `apps/web/package.json`
- `apps/web/index.html`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- mise a jour du workspace racine pour inclure `apps/*`

Validation:

- `npm install` si necessaire.
- `npm run typecheck --prefix apps/web`
- `npm run build --prefix apps/web`
- verifier que le plugin n'est pas modifie.

### Phase C - Premier ecran Creator shell

Livrables:

- dashboard local minimal
- creation projet minimal
- creator shell
- navigation locale

Validation:

- creer un projet local
- ouvrir le Creator
- revenir au dashboard
- recharger et retrouver le projet si `localStorage` est deja inclus

### Phase D - Generation TokenBundle local

Livrables:

- modele projet local
- fonction de construction TokenBundle minimal
- validation/normalisation via `ds-core`
- affichage erreurs

Validation:

- TokenBundle valide avec light/dark
- collections obligatoires presentes
- alias avec prefixe de collection
- aucune dependance plugin

### Phase E - Export JSON

Livrables:

- preview JSON
- export via `exportTokenBundleJson`
- action copier
- action telecharger si elle reste simple

Validation:

- JSON parseable
- JSON egal au TokenBundle normalise
- alias preserves
- exporter appele depuis `@starter-tokens/exporters`

### Phase F - Preparation handoff plugin Figma

Livrables:

- section Figma handoff dans la web app
- format de payload documente
- consignes pour import plugin ulterieur

Validation:

- le handoff reste one-way web app -> plugin
- pas de connexion distante obligatoire
- pas de bidirectional sync
- pas de modification du plugin tant que le format n'est pas valide

## Ordre d'implementation recommande

1. Scaffold `apps/web` avec Vite React TypeScript.
2. Ajouter `apps/*` aux workspaces racine.
3. Brancher uniquement `ds-core` et `exporters`.
4. Creer le dashboard local minimal.
5. Creer le flow nouveau projet minimal.
6. Creer le Creator shell.
7. Ajouter Foundations / Colors minimal.
8. Generer un TokenBundle local valide.
9. Afficher la preview JSON.
10. Exporter JSON via `exportTokenBundleJson`.
11. Documenter le format de handoff plugin avant toute integration Figma.

## Risques principaux

- Reproduire le plugin UI au lieu de concevoir une surface web native.
- Importer du code plugin et coupler la web app a Figma.
- Ajouter auth/backend trop tot.
- Transformer le premier sprint web en refactor general.
- Ajouter CSS/Tailwind exporters avant d'avoir une boucle JSON stable.
- Confondre etat UI web app et contrat TokenBundle.

## Definition de succes du premier shell

Le premier shell est reussi si:

- `apps/web` demarre localement.
- un utilisateur peut creer un projet local minimal.
- le Creator shell existe.
- la section Colors produit un TokenBundle valide.
- le JSON normalise est visible.
- l'export JSON utilise `@starter-tokens/exporters`.
- aucun code plugin n'est importe.
- aucune logique Figma runtime n'est requise.

## Prochaine etape d'implementation

Prochaine etape recommandee:

- creer `apps/web` avec Vite React TypeScript, en gardant le scope limite a la Phase B.

Le premier commit d'implementation devrait uniquement contenir:

- le scaffold web minimal
- la configuration workspace necessaire
- une page shell statique ou quasi statique
- aucune logique TokenBundle avancee
- aucune modification du plugin Figma
