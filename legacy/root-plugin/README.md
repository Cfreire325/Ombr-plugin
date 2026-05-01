# Legacy Root Plugin

Cette archive contient l'ancienne implementation plugin qui vivait a la racine du repo.

Contenu archive :

- `src/*`
- `scripts/*`
- `dist/*`
- `code.js`
- `ui.html`
- `tsconfig.json`

Regles :

- ne pas modifier cette archive par defaut
- toute implementation active du plugin se fait dans `packages/plugin-starter-tokens/*`
- Figma charge le plugin actif via `manifest.json`, qui pointe vers `packages/plugin-starter-tokens/dist/*`

Utilisation autorisee :

- comparaison historique
- verification de migration
- reference ponctuelle si un ancien comportement doit etre retrouve
