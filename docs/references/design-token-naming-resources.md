# Design Token Naming Resources

Date: 2026-05-02

## Ressource

- Name Design Tokens Guide: https://www.namedesigntokens.guide/learn/1

## Pourquoi cette ressource est utile

Ce guide est une reference externe utile pour reflechir a la convention de nommage des design tokens. Il peut aider Ombr a mieux structurer les noms generes, a expliquer les choix de naming dans la web app, et a rendre les tokens plus lisibles pour les designers comme pour les developpeurs.

Il ne doit pas etre copie tel quel. Il doit servir de ressource de comparaison et d'inspiration, a adapter au contrat Ombr existant.

## Influence possible sur Ombr

La ressource peut guider les futures decisions sur:

- la separation entre primitives, semantic tokens et component tokens;
- la lisibilite des noms generes dans le Creator web;
- la pedagogie autour des noms de tokens;
- les previews de noms avant export;
- les futurs ecrans de token builder ou naming assistant;
- les messages d'aide qui expliquent pourquoi un nom est valide, ambigu ou trop specifique.

Pour Ombr, le point central reste le `TokenBundle`. Les conventions externes doivent donc etre adaptees a notre structure:

- `collections.primitives`;
- `collections.semantic`;
- `collections.components`;
- noms canonicalises en slash-case;
- aliases prefixes par collection, par exemple `primitives/colors/brand/500`;
- modes `light` et `dark`;
- exports vers JSON, puis CSS/Tailwind plus tard;
- import/sync vers Figma via le plugin.

## Ce qu'on peut appliquer maintenant

Sans modifier le produit, cette ressource peut deja alimenter les decisions suivantes:

- garder une convention de nommage explicite et documentee;
- eviter les noms trop lies a une couleur brute quand un usage semantic est attendu;
- distinguer clairement valeur source, intention produit et usage composant;
- verifier que les noms generes restent comprehensibles dans les exports;
- utiliser la web app comme lieu de pedagogie pour expliquer les noms;
- ajouter plus tard une preview de naming avant generation ou export.

## Hors scope MVP

Cette reference ne declenche pas encore:

- un assistant de naming automatise;
- un refactor du contrat TokenBundle;
- un changement des noms existants dans `ds-core`;
- un changement du plugin Figma;
- un builder de component tokens;
- une validation avancee de vocabulaire;
- une importation ou duplication du contenu du guide;
- une UI dediee dans `apps/web`.

Ces sujets pourront etre reconsideres apres stabilisation des flows V1: Colors, semantic tokens, preview, exports et handoff Figma.

## Risques a eviter

- Copier le guide au lieu de l'adapter au modele Ombr.
- Changer le naming TokenBundle sans migration documentee.
- Melanger les conventions externes avec des contraintes Figma runtime.
- Utiliser une convention trop abstraite qui rend les exports difficiles a lire.
- Introduire plusieurs systemes de naming paralleles entre `apps/web`, `ds-core`, `exporters` et le plugin.
- Laisser la future UI expliquer des concepts qui ne sont pas encore implementes.

## Recommandation

Utiliser cette ressource comme reference lors des prochaines decisions de naming, en particulier pour les futures phases:

1. enrichissement de `apps/web` Colors;
2. semantic token mapping;
3. preview des noms generes;
4. export CSS/Tailwind;
5. component tokens V2;
6. naming assistant eventuel.

Toute decision issue de cette ressource doit etre traduite dans les termes du TokenBundle Ombr et documentee avant implementation.
