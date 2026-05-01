# DS Core

`@starter-tokens/ds-core` contient le contrat `TokenBundle` et les utilitaires de validation/normalisation.

## Contrat stable

- `TokenCollections`: `primitives | semantic | components`
- `TokenModes`: `light | dark`
- `TokenTypes`: `COLOR | FLOAT | STRING`
- Format source: Figma-first export vers JSON

## API

- `validateTokenBundle(bundle)`
- `normalizeTokenBundle(bundle)`
- `createPluginInputFromTokenBundle(bundle)`
- `toFlatTokenList(bundle)`

## Fixture

- `fixtures/token-bundle.sample.json`

## Tests

```bash
npm run test -w @starter-tokens/ds-core
```
