# Project Operating System

## 1. But

Ce document est la source de verite pour travailler proprement sur:
- le plugin Figma
- le design system et les tokens
- la documentation et la qualite projet

Objectif: avancer vite, avec moins d'erreurs, et garder une direction stable entre les sessions.

---

## 2. Principes Non Negociables

1. Spec avant implementation sur les changements importants.
2. Zero logique critique "dans la tete": tout doit etre trace ici ou dans `docs/`.
3. Pas de hardcode arbitraire pour les tokens design.
4. Chaque changement doit etre testable (build/typecheck/tests).
5. Flux GitHub propre: PR, review, checks.

---

## 3. Stack Active (Booster)

### 3.1 Skills utiles
- `Doc`
- `GH Address Comments`
- `GH Fix CI`
- `Skill Installer`
- `OpenAI Docs` (optionnel selon besoins API)

### 3.2 MCP / Context
- `figma` (actif)
- `context7` (actif via OAuth)

Verification rapide:
```bash
codex mcp list
```

---

## 4. Installation / Setup Checklist

## 4.1 GitHub (par repo)
- [ ] Repo cree (`ombr-plugin` / `ombr-tokens`)
- [ ] README initialise
- [ ] `.gitignore` Node
- [ ] Ruleset actif sur branche par defaut
- [ ] PR obligatoire + 1 approval
- [ ] Force push bloque
- [ ] Checks CI requis avant merge
- [ ] Collaborateurs ajoutes

## 4.2 Outils locaux
- [ ] Node LTS installe
- [ ] `npm install` ok
- [ ] `npm run build` ok
- [ ] `npm run typecheck` ok
- [ ] Tests passes (`npm run test:ds-core`)

## 4.3 Agent / MCP
- [ ] `figma` connecte
- [ ] `context7` connecte (OAuth valide)
- [ ] Skills list ci-dessus actives

---

## 5. Architecture Cible

1. `ombr-tokens` = source unique des tokens.
2. `ombr-plugin` = consomme les tokens, n'invente pas les valeurs DS.
3. Contrat clair entre tokens et plugin (format stable, validation, versioning).

Minimum attendu:
- source tokens versionnee
- build artifact stable (`dist/tokens.json` ou equivalent)
- sync simple vers plugin

---

## 6. Workflow De Travail

1. Cadrage
- probleme, impact, resultat attendu

2. Spec courte
- fichiers touches
- comportement cible
- risques

3. Implementation
- changements petits et verifies

4. Verification
- build + typecheck + tests + verification fonctionnelle

5. Documentation
- mise a jour `README`/`docs` au meme moment

6. Delivery GitHub
- PR propre + checklist + review + merge

---

## 7. Quality Gates

Avant validation d'une PR:
- [ ] comportement conforme a la spec
- [ ] pas de regression visible
- [ ] naming coherent
- [ ] tests/build/typecheck verts
- [ ] docs mises a jour
- [ ] pas de TODO critique oublie

Pour les tokens:
- [ ] format stable
- [ ] alias valides
- [ ] collisions detectees
- [ ] valeurs non arbitraires

---

## 8. Ressources De Reference

## 8.1 GitHub
- Rulesets: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- Protected branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- CODEOWNERS: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- Templates issues/PR: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates
- Node CI: https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs

## 8.2 Figma Plugin
- Intro: https://developers.figma.com/docs/plugins/
- Manifest: https://developers.figma.com/docs/plugins/manifest/

## 8.3 Design Tokens
- Style Dictionary: https://styledictionary.com/getting-started/using_the_cli/
- Tokens overview: https://styledictionary.com/info/tokens/
- DTCG draft: https://www.designtokens.org/TR/third-editors-draft/

## 8.4 Etude Bridge (inspiration workflow)
- Repo: https://github.com/noemuch/bridge

Elements repris en logique:
- spec-first
- validations bloquees
- generation par petites etapes
- apprentissage via corrections
- sync incremental

---

## 9. Backlog Pilotage (Format)

Chaque changement plugin/tokens doit avoir une entree courte:

```md
## [ID] Titre
- Type: feature | fix | refactor | docs
- Scope: plugin | tokens | infra
- Pourquoi:
- Definition of done:
  - [ ]
  - [ ]
- Risques:
- Liens:
```

---

## 10. Plan Maintenant

Phase 1: Stabiliser la base
- verrouiller setup GitHub + CI + quality gates
- clarifier contrat tokens <-> plugin

Phase 2: Modifications plugin (tes idees)
- lister les changements
- prioriser impact/risque
- implementer par lots petits

Phase 3: Durcissement
- couverture de tests
- docs utilisateurs et docs dev
- checklist release

---

## 11. Prochaine Etape Immediate

Partager la liste de tes modifications plugin sous ce format:

```md
1) Changement:
   - Objectif:
   - Ecran/Fonction:
   - Resultat attendu:
```

Je transforme ensuite ca en plan d'execution concret et on code directement.
