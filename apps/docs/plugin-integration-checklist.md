# Plugin Integration Checklist (DS Core -> Plugin)

## Objectif

Connecter le plugin `Starter Tokens` a un `TokenBundle` valide sans changer le flow UX principal.

## Checklist

1. `TokenBundle` valide (`validateTokenBundle`).
2. `TokenBundle` normalise (`normalizeTokenBundle`).
3. Les tokens `semantic` du bundle sont ingeres par le plugin en mode `light` + `dark`.
4. Les alias du bundle resolvent uniquement vers `primitives|semantic|components`.
5. En absence de `TokenBundle`, le plugin conserve son comportement actuel.

## Payload plugin attendu (phase 2)

Le message `generate-variables` peut inclure:

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

## Gardes regression

1. Un bundle invalide doit etre rejete avec message d'erreur explicite.
2. La generation sans bundle doit rester idempotente.
3. Aucun changement de layout UX requis en phase 2.
