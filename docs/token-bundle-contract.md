# TokenBundle Contract

## Date

- 2026-04-13

## Purpose

This document defines the technical contract used to share DS data between:

- Figma-side authoring logic
- plugin runtime logic
- future developer exports
- future sync workflows

It is the main contract-level explanation for `TokenBundle`.

This doc should be read together with:

- `docs/shared-source-of-truth-plan.md`
- `docs/source-of-truth.md`
- `packages/ds-core/src/index.d.ts`

## Why this contract matters

`TokenBundle` is the central bridge format of the project.

It is important because it allows us to separate:

- design intention
- technical normalization
- runtime generation
- developer consumption

Without a stable contract, the plugin would become:

- harder to test
- harder to export
- harder to migrate
- harder to sync later

## Contract status

Current status:

- active
- already partially implemented
- should be preserved and hardened, not replaced

Current implementation source:

- `packages/ds-core`

Current runtime consumer:

- `packages/plugin-starter-tokens/src/code.ts`

## Main design goals of the contract

1. Be easy to validate
2. Be deterministic to normalize
3. Be explicit about names, types, modes, and aliases
4. Stay close to long-term design token standards
5. Stay practical for Figma plugin runtime use
6. Support future exports and sync

## Current schema

## Top-level shape

```json
{
  "schemaVersion": "1.0.0",
  "source": "figma",
  "generatedAt": "2026-03-14T00:00:00.000Z",
  "collections": {
    "primitives": [],
    "semantic": [],
    "components": []
  }
}
```

## Canonical TypeScript shape

Current contract types:

```ts
export type TokenCollection = "primitives" | "semantic" | "components";
export type TokenMode = "light" | "dark";
export type TokenType = "COLOR" | "FLOAT" | "STRING";

export type TokenModeValue = string | number | { alias: string };

export interface TokenEntry {
  collection?: TokenCollection;
  name: string;
  type: TokenType;
  values: Record<TokenMode, TokenModeValue>;
  scopes?: string[];
  description?: string;
  meta?: Record<string, unknown>;
}

export interface TokenBundle {
  schemaVersion: string;
  source: string;
  generatedAt?: string;
  collections: Record<TokenCollection, TokenEntry[]>;
}
```

## Required top-level fields

## `schemaVersion`

Type:

- `string`

Purpose:

- identifies the contract schema version
- supports future migrations

Current default:

- `1.0.0`

Rule:

- must always be present after normalization

## `source`

Type:

- `string`

Purpose:

- identifies where the bundle comes from

Current default:

- `figma`

Rule:

- must always be present after normalization

## `generatedAt`

Type:

- `string | undefined`

Purpose:

- optional traceability metadata

Rule:

- optional
- may be used later for sync/audit flows

## `collections`

Type:

- object

Required keys:

- `primitives`
- `semantic`
- `components`

Rule:

- each required collection key must exist
- each collection value must be an array

## Collection meanings

## `primitives`

Meaning:

- foundational values
- raw scales
- neutral base values

Examples:

- `colors/base/white`
- `colors/brand/500`
- `spacing/16`
- `radius/8`
- `font-size/text-md`

## `semantic`

Meaning:

- contextual meaning applied across UI

Examples:

- `text/primary`
- `bg/canvas`
- `border/focus`
- `icon/secondary`

## `components`

Meaning:

- component-level implementation decisions
- states
- variants
- properties tied to component recipes

Examples:

- `components/button/primary/bg`
- `components/button/primary/bg/hover`
- `components/input/border/focus`

Current reality:

- this collection exists in the contract
- but the plugin runtime does not yet expose a full first-class `components/*` flow end to end

## Token entry fields

## `name`

Type:

- `string`

Required:

- yes

Meaning:

- canonical token path identifier

Rule:

- must be slash-case
- must be normalized
- must be unique within its collection

## `type`

Type:

- `COLOR | FLOAT | STRING`

Required:

- yes

Meaning:

- describes the token value category

Current supported types:

- `COLOR`
- `FLOAT`
- `STRING`

## `values`

Type:

- `Record<"light" | "dark", TokenModeValue>`

Required:

- yes

Rule:

- both `light` and `dark` keys are required in the current contract

Important nuance:

- even if the plugin later supports single-mode output behavior, the normalized bundle contract should stay explicit about both modes unless we formally version that rule

## `scopes`

Type:

- `string[] | undefined`

Required:

- no

Meaning:

- indicates the allowed Figma variable scopes

Examples:

- `TEXT_FILL`
- `FRAME_FILL`
- `SHAPE_FILL`
- `STROKE_COLOR`
- `ALL_SCOPES`

Current behavior:

- if scopes are missing or invalid at runtime, the plugin can fall back to semantic scope inference for some tokens

## `description`

Type:

- `string | undefined`

Required:

- no

Meaning:

- human-readable explanation

Recommendation:

- increasingly use this field as the DS grows

## `meta`

Type:

- `Record<string, unknown> | undefined`

Required:

- no

Meaning:

- extension area for future metadata

Recommended future use:

- origin metadata
- export metadata
- sync hints
- component contract metadata

## Supported value formats

## COLOR

Allowed forms today:

- hex color strings
- `rgb(...)`
- `rgba(...)`
- `hsl(...)`
- `hsla(...)`
- alias objects

Examples:

```json
"#ffffff"
"rgba(16, 17, 20, 0.6)"
{ "alias": "primitives/colors/brand/500" }
```

## FLOAT

Allowed forms today:

- numbers
- numeric-like values accepted by normalization and converted to numbers
- alias objects

Examples:

```json
16
8
{ "alias": "primitives/spacing/16" }
```

## STRING

Allowed forms today:

- non-empty strings
- alias objects

Examples:

```json
"Inter"
"Semi Bold"
{ "alias": "primitives/font-family/body" }
```

## Alias contract

## Alias shape

Canonical alias shape:

```json
{ "alias": "primitives/colors/brand/500" }
```

## Alias requirements

Rules:

1. alias must be an object with an `alias` string
2. alias path must include the collection prefix
3. allowed collection prefixes are:
   - `primitives`
   - `semantic`
   - `components`
4. the token path after the collection prefix must be valid slash-case

## Alias examples

Valid:

```json
{ "alias": "primitives/colors/base/black" }
{ "alias": "semantic/border/focus" }
{ "alias": "components/input/border/focus" }
```

Invalid:

```json
{ "alias": "colors/base/black" }
{ "alias": "semantic\\border\\focus" }
{ "alias": "random/input/focus" }
```

## Current runtime alias mapping behavior

Current plugin runtime maps aliases as follows:

- `primitives/...` -> plugin primitive collection
- `semantic/...` -> plugin color modes collection
- `components/...` -> currently also routed into the plugin color modes collection

Important:

- this is a runtime implementation detail for today
- it should not be mistaken for the final architecture target
- the contract should continue to distinguish `semantic` and `components` clearly

## Naming rules

## Canonical naming convention

Use:

- slash-case path structure
- kebab-case per segment

Examples:

- `colors/base/white`
- `text/primary`
- `bg/canvas`
- `components/button/primary/bg`

## Normalization behavior

Current normalization behavior:

- trims spaces
- converts `.` into `/`
- removes unsupported characters into `-`
- collapses duplicate separators
- lowercases everything

This means some non-canonical names may still be normalized into canonical names.

Example:

- `Colors.Base.White` becomes `colors/base/white`

Important implication:

- canonical naming is still slash-case
- but validation currently happens on normalized names, not only raw input

Phase 1 decision:

- see `docs/technical/tokenbundle-naming-decision.md`
- raw input names may remain permissive when they normalize deterministically
- normalized TokenBundle output must use canonical slash-case names
- duplicate names are checked after normalization
- exporters, Figma adapter, and the future web app should consume normalized names
- this preserves current plugin compatibility before any stricter validation change

This is useful for resilience, but it also means tests and docs must clearly distinguish:

- raw author input
- normalized contract output

## Uniqueness rule

Token names must be unique inside a collection after normalization.

This is important because:

- collisions can hide semantic mistakes
- future exports depend on deterministic paths

## Modes contract

Current supported modes:

- `light`
- `dark`

Current rule:

- every token entry must define both modes

Long-term note:

- output workflows may later choose to export only one target mode in some contexts
- the bundle contract should not be changed lightly for that use case

## Scopes contract

Scopes represent Figma variable usage boundaries.

Current examples in the project:

- `ALL_SCOPES`
- `TEXT_FILL`
- `FRAME_FILL`
- `SHAPE_FILL`
- `STROKE_COLOR`
- `FONT_SIZE`
- `FONT_FAMILY`
- `GAP`
- `CORNER_RADIUS`

Recommended contract rule:

- scopes should be explicit whenever we know them
- fallback inference should be a convenience, not the main design strategy

## Validation rules

A bundle is valid when:

1. it is an object
2. `schemaVersion` is present
3. `collections` is present
4. all required collections exist and are arrays
5. each token entry is an object
6. each token name is valid after normalization
7. each token name is unique within its collection
8. each token type is one of the supported types
9. `values` exists as an object
10. both `light` and `dark` values exist
11. each mode value matches the declared token type
12. each alias points to an allowed collection prefix and valid slash-case path

## Normalization rules

Normalization should:

1. supply default `schemaVersion` when missing in normalization input
2. supply default `source` when missing in normalization input
3. normalize token names
4. normalize alias paths
5. normalize numeric values
6. normalize collection entries consistently
7. sort entries deterministically by name
8. return a contract that passes validation

## Current known gap

There is a current mismatch to keep in mind:

- validation currently accepts normalized names that were not raw slash-case initially
- an older test expects a dotted name input to stay invalid

This is not necessarily a contract bug.
It is a sign that:

- docs
- tests
- normalization expectations

need to be aligned more clearly.

## Example valid bundle

```json
{
  "schemaVersion": "1.0.0",
  "source": "figma",
  "generatedAt": "2026-03-14T00:00:00.000Z",
  "collections": {
    "primitives": [
      {
        "name": "colors/base/white",
        "type": "COLOR",
        "values": {
          "light": "#ffffff",
          "dark": "#ffffff"
        },
        "scopes": ["ALL_SCOPES"]
      }
    ],
    "semantic": [
      {
        "name": "text/primary",
        "type": "COLOR",
        "values": {
          "light": { "alias": "primitives/colors/base/black" },
          "dark": "#f5f6f7"
        },
        "scopes": ["TEXT_FILL"]
      }
    ],
    "components": [
      {
        "name": "input/border/focus",
        "type": "COLOR",
        "values": {
          "light": { "alias": "semantic/border/focus" },
          "dark": { "alias": "semantic/border/focus" }
        },
        "scopes": ["STROKE_COLOR"]
      }
    ]
  }
}
```

## What the contract is allowed to evolve on

Safe evolution areas:

- new metadata in `meta`
- richer descriptions
- richer component metadata
- additional documentation rules
- stronger scope rules

Sensitive evolution areas:

- collection names
- token types
- mode requirements
- alias path format
- naming normalization behavior

These sensitive changes must be versioned and documented.

## Migration policy

## Backward-compatible changes

Examples:

- adding optional metadata
- adding optional descriptions
- improving deterministic sorting
- adding docs or warnings

Rule:

- does not require major schema disruption

## Non-backward-compatible changes

Examples:

- changing required collections
- changing canonical mode keys
- changing alias format
- changing supported token types
- changing naming rules in a breaking way

Rule:

- requires a schema migration note
- should update `schemaVersion`
- should update docs and fixtures together

## Relationship with future exports

This contract should become the shared source for:

- JSON export
- CSS variable export
- TypeScript export
- future React adapter export
- future sync metadata

Important:

- exports may reshape data for their platform
- but they must not invent semantics outside the contract

## Relationship with future expert mode

Expert mode should use the same contract boundary.

That means:

- semantic tokens should remain contract-driven
- component tokens should be introduced through the same bundle logic
- provenance should be inspectable
- component families should not bypass the contract with hidden hardcoded logic

## Non-negotiable rules

1. `TokenBundle` remains the central interchange boundary.
2. Canonical names remain slash-case.
3. `primitives`, `semantic`, and `components` remain distinct concepts.
4. Alias paths must always include a collection prefix.
5. Normalization and validation must stay deterministic.
6. Runtime convenience should not silently redefine contract semantics.

## Immediate next work on this contract

1. align tests with the documented normalization strategy
2. decide how `components/*` should become first-class in runtime generation
3. define future metadata keys for export and sync
4. document allowed scope mappings by token family
5. formalize how single-target exports relate to dual-mode contract data
