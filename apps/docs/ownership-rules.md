# Ownership Rules

## Dependencies

1. `packages/ds-core` ne depend jamais du plugin.
2. `packages/plugin-starter-tokens` peut dependre de `ds-core`.

## Evolution

1. Toute evolution du contrat `TokenBundle` doit etre versionnee.
2. Toute evolution non retro-compatible exige une note de migration.
3. Le plugin doit conserver un fallback sans `tokenBundle`.

## Reviews

1. Changement `ds-core`: review design + dev requise.
2. Changement plugin uniquement: review dev suffit si contrat inchange.
