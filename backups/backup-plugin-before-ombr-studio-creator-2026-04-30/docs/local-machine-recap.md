# Recap Local Machine - Plugin + DS Mutual

## 1) But

Avoir un memo unique pour retrouver rapidement:
- les infos de contexte (Bridge, Context7, MCP)
- la structure du projet
- la facon de faire evoluer le plugin et le design system mutualise sans casser le contrat

Ce document est fait pour etre reutilise sur ton ordi (et sur une nouvelle session agent).

---

## 2) Infos Contexte Deja Posees

### 2.1 Bridge (reference workflow)

Source:
- https://github.com/noemuch/bridge

Ce qu'on reprend de Bridge:
- spec-first
- validations bloquees
- generation par petites etapes
- apprentissage via corrections
- sync incremental

Important:
- Bridge est une inspiration de methode, pas une dependance runtime du plugin.

### 2.2 Context7 (MCP docs)

Etat attendu:
- `context7` connecte via OAuth

Verification rapide:
```bash
codex mcp list
```

Usage attendu:
- chercher de la doc officielle de libs/frameworks
- eviter les hypotheses quand une API evolue
- documenter les choix techniques avec source fiable

### 2.3 Figma MCP

Etat attendu:
- `figma` connecte

Verification rapide:
```bash
codex mcp list
```

---

## 3) Structure Actuelle Du Projet (Monorepo)

Racine:
- `packages/ds-core`
- `packages/plugin-starter-tokens`

Roles:
1. `packages/ds-core`
- contrat `TokenBundle`
- validation / normalisation
- fixtures + tests

2. `packages/plugin-starter-tokens`
- plugin Figma (UI wizard + generation variables)
- consomme `ds-core`
- accepte un `tokenBundle` optionnel dans `generate-variables`

Manifest Figma racine:
- `main`: `packages/plugin-starter-tokens/dist/code.js`
- `ui`: `packages/plugin-starter-tokens/dist/ui.html`

---

## 4) Regles De Couplage Plugin <-> DS

Non negociable:
1. `ds-core` ne depend jamais du plugin.
2. Le plugin peut dependre de `ds-core`.
3. Toute evolution du contrat `TokenBundle` doit etre versionnee.
4. Si changement non retro-compatible: note de migration obligatoire.
5. Le plugin doit garder un fallback sans `tokenBundle`.

---

## 5) Contrat Data Minimal A Garder Stable

Payload plugin (phase 2):

```json
{
  "payload": {
    "tokenLevel": "color-modes",
    "tokenBundle": {
      "schemaVersion": "1.0.0",
      "source": "figma",
      "collections": {
        "primitives": [],
        "semantic": [],
        "components": []
      }
    }
  }
}
```

Checks minimum:
- `validateTokenBundle(bundle)`
- `normalizeTokenBundle(bundle)`
- aliases limites a `primitives|semantic|components`
- mode sans bundle = comportement historique conserve

---

## 6) Structure Figma DS Mutualisee (Document Design)

Pages obligatoires:
1. `00 Governance`
2. `01 Primitives`
3. `02 Semantic`
4. `03 Component Tokens`
5. `04 Handoff`

Variables:
- collections: `primitives`, `semantic`, `components`
- modes: `light`, `dark`

Nommage:
- slash-case
- kebab-case par segment
- ex: `text/primary`, `bg/canvas`, `input/border/focus`

Handoff Ready for Dev:
1. aucun hardcode local sur composants Ready for Dev
2. etats critiques presents: `default`, `hover`, `focus`, `error`, `disabled`
3. valeurs composant via `semantic` ou `components` (pas direct primitives sauf exception documentee)
4. export JSON conforme au contrat `TokenBundle`

---

## 7) Workflow Quotidien Recommande

1. Cadrage court
- probleme
- impact
- resultat attendu

2. Spec courte
- fichiers touches
- comportement cible
- risques

3. Implementation par petits lots

4. Verification locale
```bash
npm install
npm run build
npm run typecheck
npm run test:ds-core
```

5. Documentation synchronisee
- MAJ `README` + `docs/` dans la meme PR

6. Delivery GitHub
- PR propre
- checks CI verts
- review

---

## 8) Si Tu Veux La Meme Base Sur Un Autre Ordi

Checklist rapide:
1. cloner le repo
2. installer Node LTS
3. `npm install`
4. verifier build/typecheck/tests
5. verifier MCP: `figma` + `context7` via `codex mcp list`
6. ouvrir ce fichier + `docs/project-operating-system.md` comme base de session

---

## 9) Fichiers Source A Consulter En Priorite

- `README.md`
- `docs/project-operating-system.md`
- `apps/docs/figma-ds-governance.md`
- `apps/docs/plugin-integration-checklist.md`
- `apps/docs/ownership-rules.md`
- `docs/mutual-design-system.md`
- `packages/ds-core/README.md`
- `packages/plugin-starter-tokens/README.md`

