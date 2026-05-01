# Dev Export Strategy

## Date

- 2026-04-13

## Status

- product and technical strategy
- not fully implemented yet

## Purpose

This document defines how the plugin should export developer-ready artifacts.

It covers:

- why export exists
- what to export first
- what not to export first
- how export relates to generation levels
- how export should evolve over time

## Why dev export exists

The plugin should not stop at generating a clean Figma DS foundation.

It should also help developers start from the same base.

That means:

- the designer does not define structure twice
- developers do not recreate token logic manually
- both sides begin from aligned names and values

The export is therefore a practical extension of the shared-source-of-truth model.

## Product rule

Developer export is:

- optional
- contextual
- scoped to what the user actually generated

Developer export is not:

- a separate top-level mode
- a hidden side effect
- a promise of full product implementation

## Main strategy

We should use a two-part strategy:

1. internal contract stays platform-neutral
2. first exports are web-first

This gives us:

- a realistic MVP
- broad practical usefulness
- a path to future platform expansion

## Why web-first is the right MVP

Web-first export is the best first step because it serves many common project starts:

- websites
- dashboards
- web apps
- SaaS products
- admin tools
- MVPs

It also lowers complexity compared with trying to support:

- React Native
- iOS native
- Android native

from day one.

## Internal source for exports

All exports should derive from the same contract logic.

Preferred source chain:

1. Figma design intention
2. normalized technical contract
3. export adapters

This means exports must not invent semantics that do not exist in the contract layer.

## MVP export targets

The first export targets should be:

1. `tokens.json`
2. CSS custom properties
3. TypeScript metadata

## 1. `tokens.json`

Purpose:

- canonical machine-readable export
- easiest base for future adapters
- easiest artifact to diff, test, and version

Expected content:

- collections
- token names
- types
- values
- aliases
- scopes when relevant
- metadata when useful

This file should remain as close as possible to the contract model.

## 2. CSS custom properties

Purpose:

- immediate use in web projects
- low-friction frontend integration
- easy consumption by teams not ready for a full DS package

Expected initial scope:

- color tokens
- spacing
- radius
- typography primitives where meaningful
- selected semantic tokens

Important:

- CSS export should be derived from the contract
- not from separate ad hoc naming logic

## 3. TypeScript metadata

Purpose:

- give developers typed metadata about token names and structure
- support editor autocompletion
- support later adapter generation

Possible early contents:

- token name unions
- collection name unions
- optional lookup maps
- optional token manifest interfaces

## Export scope by generation level

The plugin should export only what the user generated.

## Foundation level export

If the user generated foundation content only, export may include:

- primitives
- semantic tokens
- spacing
- radius
- typography metadata

## Expert level export

If the user generated starter components too, export may additionally include:

- component token data
- component state token data
- component metadata
- future component recipe data

## Example product behavior

Case 1:

- user generates colors and spacing only
- export includes color and spacing artifacts only

Case 2:

- user generates full foundation with typography
- export includes token JSON, CSS variables, and typography metadata

Case 3:

- user generates starter button contract in Expert Mode
- export includes the button-related component token surface too

## Recommended output structure

The exact file structure can evolve, but the MVP should follow a predictable pattern.

Recommended shape:

```text
export/
  tokens.json
  css/
    tokens.css
    semantic.css
    components.css
  ts/
    token-names.ts
    token-types.d.ts
    manifest.ts
```

For early MVP, it is acceptable to begin with:

```text
export/
  tokens.json
  tokens.css
  token-manifest.ts
```

## Naming strategy for exports

Exports must preserve canonical names as much as possible.

## JSON export

Should preserve:

- slash-case naming
- collection grouping
- mode grouping

## CSS export

Should convert canonical names predictably.

Example:

- `primitives/colors/brand/500` -> `--primitives-colors-brand-500`
- `semantic/text/primary` -> `--semantic-text-primary`
- `components/button/primary/bg` -> `--components-button-primary-bg`

Rule:

- the transform must be deterministic and documented

## TypeScript export

Should preserve canonical names in string form whenever possible.

This helps keep the bridge between Figma and code readable.

## Mode strategy in exports

The internal contract remains dual-mode aware.

Recommended MVP export behavior:

- export both `light` and `dark` values in JSON
- support web-friendly CSS outputs for mode switching

Possible CSS approaches:

- `:root` for default mode plus `[data-theme="dark"]`
- or separate light/dark files

The exact CSS implementation can be chosen later, but it should stay consistent across exports.

## Export messaging inside the plugin

The plugin UI should explain clearly:

- what export target is available now
- what the current export is meant for
- what is not yet supported

Recommended user-facing communication:

- `Web export available`
- `Platform-neutral contract generated`
- `React adapter later`
- `Native mobile export not available yet`

## Project usage selector

The plugin should eventually allow the user to signal the intended project usage.

Recommended options:

- `Website`
- `Web app`
- `Dashboard`
- `Multi-platform DS`
- `Native mobile later`

Important:

- this selector should inform messaging and defaults
- it should not silently alter the contract in undocumented ways

## What dev export should not do yet

In the MVP phase, export should not attempt:

- full React component generation
- full multi-platform package generation
- codebase patching
- design-to-code page implementation
- bidirectional sync

These belong to later phases.

## Relationship with React

React is a strong future target, but it should not be the first and only base of the export architecture.

Recommended progression:

1. contract-shaped JSON
2. CSS variables
3. TypeScript metadata
4. React-friendly adapter layer

This prevents React from becoming an accidental constraint on the whole DS pipeline.

## Relationship with future sync

Export strategy should prepare future sync, not block it.

That means exported artifacts should eventually include enough metadata for:

- source traceability
- token lineage
- version comparison
- controlled updates

Recommended future metadata ideas:

- bundle version
- export timestamp
- originating collection and token path
- generation scope
- component family scope

## Quality requirements

Developer export should be:

- deterministic
- documented
- inspectable
- aligned with Figma names
- aligned with the contract
- safe to regenerate

If an export cannot be generated cleanly, the plugin should show explicit warnings rather than silently producing misleading output.

## MVP acceptance criteria

The dev export MVP is successful when:

1. a designer can choose to export dev artifacts after generation
2. the generated dev files reflect only what was generated in Figma/plugin flow
3. token names are recognizable from Figma
4. light/dark behavior is preserved clearly
5. a web developer can start consuming the output without rebuilding the DS manually

## Future phases

## Phase 1

- `tokens.json`
- CSS variables
- TypeScript metadata

## Phase 2

- richer component token export
- starter recipe metadata
- improved export diagnostics

## Phase 3

- React adapter
- stronger component package generation
- export metadata for sync

## Phase 4

- multi-platform adapter strategy
- sync-ready structured outputs

## Immediate next implementation decisions

1. choose the first exact output folder structure
2. choose the first CSS mode strategy
3. define token-to-CSS name transform rules
4. define TypeScript manifest scope for MVP
5. define which generation levels unlock which export surfaces
