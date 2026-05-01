# Référentiel de design Figma (Côté dev)

## 1) Référence principale utilisée
- Fichier Figma: https://www.figma.com/design/g3ItIC4SnNh2YmFESQmIBk/Plugin-Figma
- Date d’extraction: 2026-03-11
- Node de départ déjà validée: `62:268` (`Starter Tokens - Select your mode`)

Objectif: disposer d’une base de conception 1:1 avant implémentation de la nouvelle UI.

---

## 2) Référence "Select your mode" (etape 1/5) — `62:268`

- Taille: `532 x 700`
- Structure: container principal + footer progression.
- Style: dark UI `neutral/900` avec cards `neutral/800`, texte light (`zinc/50`), texte secondaire `neutral/400`.
- Typo:
  - Titre principal: `Satoshi_Variable:Bold` (24px).
  - Labels secondaires: `Inter:Medium` (12px).
  - Tags/metadata: `Fira_Code` (`Medium/SemiBold`).
- Layout:
  - Padding principal: `24px`.
  - Cards options: `234x236`, radius `16`, padding `20`, gap `16`.
  - Footer: `24px` top + `90px` de hauteur, border-top et deux boutons.
- Points UX:
  - 3 niveaux visuels, niveau 3 désactivé/overlay.
  - Step indicator: `1` actif.
  - CTA principal: `Continuer`.

---

## 3) Frames complémentaires (désormais extraites via MCP)

- **Starter Tokens - Palette colors - Select** — `83:154`
- **Starter Tokens - Palette colors -Modal - Edit Color Shade** — `109:431`
- **Starter Tokens - Brand colors - default** — `109:302`
- **Starter Tokens - Brand colors - Modal - New Brand Color Shade** — `109:501`
- **Starter Tokens - Brand colors - Brand Add** — `75:165`

Capture: effectuée avec MCP (`get_screenshot`) pour chaque frame.

### 3.1) `83:154` — Starter Tokens - Palette colors - Select
- Step: `3/5 - Preset palette`.
- Header:
  - Label metadata + titre + sous-texte.
  - Bouton menu rond (fond `neutral/100`).
- Zone centrale:
  - Ligne preset:
    - Champ 1: sélecteur preset `Tailwind` (icon preview + chevron).
    - Champ 2: affiche `269 Shades`.
  - 4 cartes de presets de couleur en répétition:
    - Header checkbox bleu (`blue/500`) + label.
    - Label `Edit` en tag bleu.
    - Bande de 10 swatches (`brand-1/100` → `brand-1/950`) avec radius `5.491` et shadow doux.
- Footer:
  - Step context `Brand colors` avec step pills 1 à 5 (`3` actif en blanc).
  - Actions: `Annuler` (outline) + `Continuer` (primary blanc).

### 3.2) `109:431` — Starter Tokens - Palette colors -Modal - Edit Color Shade
- Type: modal overlay (`backdrop` blur `2px`, bg `rgba(0,0,0,0.3)`).
- Position: modal largeur `452px`, décalage `left 40` `top 144`.
- Header:
  - Titre: `Edit Color Shade` (`Satoshi_Variable Bold`, 18px).
  - Close icon `x`.
- Form:
  - Champ `Name`.
  - Champ preview couleur + hex (`#82BE5C`).
  - `Shade count` avec chevron.
  - Slider de contraste `Contrast Shift` + barre multi-segments.
  - Rangée des 10 shades avec label valeur (`50` à `950`), valeur de base `500` active.
- Footer:
  - `Annuler`.
  - CTA: `Enregistré les changement s` (texte à vérifier côté QA).

### 3.3) `109:302` — Starter Tokens - Brand colors - default
- Step: `2/5 - Brand colors`.
- Header:
  - Label + titre + texte d’aide.
  - Bouton menu.
- Zone centrale:
  - Bloc principal avec CTA `Ajouter votre primary brand`.
- Footer:
  - Step context `Brand colors` (`2` actif).
  - Actions `Annuler` + `Continuer`.

### 3.4) `109:501` — Starter Tokens - Brand colors - Modal - New Brand Color Shade
- Même pattern que `109:431` (overlay + header + form + footer).
- Différence principale: CTA final = `Ajouter votre primary brand`.
- Même structure de champs, slider, chips, états de sélection sur `500`.

### 3.5) `75:165` — Starter Tokens - Brand colors - Brand Add
- Step: `2/5 - Brand colors`.
- Zone centrale:
  - Bloc palette existante avec nom `azertty-color` + bouton `Edit`.
  - Bande swatches `brand-1/100` → `brand-1/950`.
  - Bloc secondaire avec CTA central `Ajouter une couleur`.
- Footer:
  - Step context `Brand colors` (`2` actif).
  - Actions `Annuler` + `Continuer`.

---

## 4) Variables visuelles transverses à réutiliser
- Fond shell: `neutral/900` / cards `neutral/800`.
- Textes:
  - primaire: `zinc/50` / secondaire: `neutral/400` / neutral clair `neutral/300`.
- Bordures: `zinc/400`, `neutral/700`.
- Accent: `blue/500` (edit/checkbox actif), `neutral/100` pour états actifs/secondary surfaces.
- Radius récurrents:
  - Boutons: `10`.
- Shadow répétée sur swatches:
  - `0.686px 0.686px 3.432px 0px rgba(0,0,0,0.1)`.

## 5) Sources locales et état d’extraction
- Présent localement:
  - `Starter Tokens - Select your mode.png`
  - `Starter Tokens - Select your mode.svg`
- Les autres frames ont été extraites directement via MCP (contextes + screenshots), donc pas de dépendance à des exports locaux.

## 6) Recommandation (avant dev)
1. Valider les labels textuels exacts (ex: typo “Enregistré les changement s”).
2. Valider les 5 captures + mapping 1:1.
3. Démarrer l’implémentation écran par écran avec ce référentiel.
