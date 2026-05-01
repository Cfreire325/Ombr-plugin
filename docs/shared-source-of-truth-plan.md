# Shared Source of Truth Plan

## Date

- 2026-04-13

## Purpose

This document is the main working plan for the project.

It exists to align:

- product vision
- design system strategy
- plugin scope
- export strategy for developers
- implementation roadmap
- design responsibilities
- development responsibilities

It should help us answer, at any moment:

- what we are really building
- what is already true in the repo
- what still needs to be designed
- what still needs to be coded
- what the next milestone is

## Product vision

We are not building only a token generator.

We are building a shared foundation between:

- designers working in Figma
- developers working in code

The long-term goal is:

1. a designer defines a strong DS foundation in Figma
2. the plugin helps structure and generate that foundation cleanly
3. the plugin exports a technical artifact developers can use directly
4. both sides work from the same base instead of recreating the same logic twice

The final product is therefore:

- a Figma-first DS authoring workflow
- backed by a repo-level technical contract
- with export capability for code consumption
- and later, sync capability

## Core product principles

## 1. Figma is the creative source of truth

Figma remains the place where designers:

- define component intent
- build variants
- define states
- express the UX structure
- decide the visual direction

This is important because the designer should not be forced to think like a build tool before designing.

## 2. The repo contract is the technical source of truth

Figma should not be the only machine-readable truth for engineering.

We need a stable contract in the repo for:

- versioning
- testing
- validation
- export
- migration
- future sync

This repo contract is the shared technical interpretation of the Figma truth.

## 3. The plugin is the bridge, not the origin of arbitrary design choices

The plugin must:

- generate structure
- normalize data
- validate rules
- export technical artifacts

The plugin must not:

- invent unstable DS semantics
- hide important alias or mapping logic
- become a source of undocumented hardcoded values

## 4. We build web-first, but not web-locked

The project should start with web-oriented exports because that is the fastest, broadest, and safest initial target.

But the internal contract should remain platform-neutral enough to support later outputs such as:

- React
- React Native
- native mobile
- other frontend stacks

## 5. Export is a complement, not a separate mode

The plugin should expose:

- generation levels for designers
- optional developer export at the end of each level

The export is not a separate product mode.
It is a complementary output based on what the user generated in Figma.

## High-level architecture

## Layer 1. Figma authoring layer

This is where the designer works.

Typical content:

- collections
- modes
- variables
- text styles
- semantic tokens
- component tokens
- component sets
- states
- documentation frames

This is the creative and UX-facing layer.

## Layer 2. Neutral contract layer

This is the most important technical layer.

It should define:

- canonical token names
- collections
- modes
- token types
- aliases
- metadata
- allowed scopes
- component contract structure

This layer should be represented in the repo.

Current foundation:

- `packages/ds-core`

This should become the central contract boundary between Figma and code.

## Layer 3. Plugin runtime layer

This layer consumes the contract and performs actions.

Responsibilities:

- read user choices from the plugin UI
- validate payloads
- normalize `TokenBundle`
- generate/update Figma variables
- generate/update styles
- later generate component foundations
- optionally export developer-ready artifacts

Current active runtime package:

- `packages/plugin-starter-tokens`

## Layer 4. Developer output layer

This layer contains the outputs developers consume.

The first targets should be:

- `tokens.json`
- CSS custom properties
- TypeScript metadata or typings

Later targets may include:

- React starter tokens package
- component recipe package
- sync metadata for future updates

## The main product loop

The intended loop should become:

1. Designer defines or updates DS in Figma
2. Plugin generates or updates Figma structure cleanly
3. Plugin normalizes the result into a technical contract
4. Plugin exports dev artifacts
5. Developers consume the same artifact as a project foundation
6. Later design changes can be synchronized through the same contract layer

This loop is the real product value.

## What the plugin should eventually do

## Foundation level

The plugin should be able to create:

- primitives
- semantic tokens
- typography styles
- spacing
- radius
- color modes
- naming conventions
- governance-ready structure

This gives the project a strong DS base from day one.

## Expert level

The expert level should later create:

- basic component contracts
- starter component tokens
- starter component variants
- starter states

Initial target families:

- button
- input
- badge
- alert
- card
- modal

The important thing is not to generate a full app.
It is to generate a reusable DS base for future app work.

## Dev export option

At the end of each relevant generation step, the user should be able to choose whether to export developer artifacts too.

This should feel like:

- an optional complement
- not a separate top-level mode

Example:

- generate colors only -> export only color-related dev artifacts
- generate typography too -> export typography artifacts too
- generate starter button contract -> export button artifacts too

## Future sync option

Later, the product can introduce a sync workflow:

- selected Figma elements
- compared against a previously generated technical artifact
- then updated through a controlled sync layer

This should not be the first milestone.
It depends on a strong contract and stable exports.

## Recommended source-of-truth model

We should adopt this rule:

1. Figma is the source of design intention
2. the repo contract is the source of technical interpretation
3. exported code artifacts are the source of developer consumption

This avoids two bad extremes:

- pure Figma without technical stability
- pure repo truth that ignores actual design authoring behavior

## What “perfect file” should mean for us

For the Figma side, a perfect file does not mean “everything exists from day one”.

It means:

- the file starts cleanly
- the structure is coherent
- tokens are named properly
- modes are predictable
- styles are reusable
- starter components are consistent
- future growth is safe

For the code side, a perfect output does not mean “the whole product UI is generated”.

It means:

- the DS base is reusable
- names match Figma
- values match Figma
- aliases are understandable
- future changes are manageable

## Recommended Figma structure

The full DS target should evolve around pages such as:

1. `00 Governance`
2. `01 Primitives`
3. `02 Semantic`
4. `03 Component Tokens`
5. `04 Components`
6. `05 Recipes` or `05 Patterns`
7. `06 Handoff` or `06 Export`

Important nuance:

- the final DS file can be richer than what the plugin generates on day one
- the plugin should generate only the level the user selected

## Recommended internal contract structure

The contract should keep these major domains:

- `primitives`
- `semantic`
- `components`

And these core metadata dimensions:

- `schemaVersion`
- `source`
- `modes`
- `types`
- `scopes`
- `descriptions`
- `aliases`
- `component metadata`

## Canonical naming rule

Keep one canonical naming system:

- slash-case for paths
- kebab-case for segments

Examples:

- `colors/brand/500`
- `text/primary`
- `bg/canvas`
- `components/button/primary/bg`

Compatibility aliases may exist, but they must not replace the canonical naming system.

## Platform strategy

## Internal strategy

The internal contract must remain neutral enough to support future non-web targets.

## Initial output strategy

The first developer outputs should be web-first:

- JSON token export
- CSS variables
- TypeScript metadata

Reason:

- covers a large share of real project starts
- supports websites, dashboards, web apps, SaaS products, and MVPs
- lowers implementation complexity
- still allows future extension

## User communication strategy inside the plugin

The plugin should clearly communicate export availability.

The user should understand:

- what export target is available now
- what is coming later
- what is not supported yet

Recommended UI ideas:

- `Project usage`
- `Website`
- `Web app`
- `Dashboard`
- `Multi-platform DS`
- `Native mobile (coming later)`

And in export status:

- `Web export available`
- `React adapter later`
- `Native mobile export not available yet`

This is important to avoid false expectations.

## Current repo reality

## What is already good

The current base is directionally strong for the final goal.

Existing strengths:

- monorepo separation between contract and plugin
- `ds-core` already exists as a technical boundary
- plugin runtime already accepts `tokenBundle`
- plugin runtime already normalizes and validates the bundle
- fallback without bundle still exists
- part of the DS mutual language already exists in the plugin UI

These are not small things.
They give us a serious foundation.

## What is not clean enough yet

The current base is not “final-architecture clean” yet.

Main gaps:

1. active files and historical root files still coexist
2. expert mode is visible as an idea but not actually unlocked
3. `components/*` is present in the vision but not implemented as a first-class export path
4. tests and validation are not fully green today
5. the export strategy for developers is not yet formalized in the product flow
6. source-of-truth hierarchy is still spread across several docs

So the answer is:

- yes, the base is good enough to continue
- no, it is not yet clean enough to be treated as the finished foundation

## Clear answer about the current plugin base

The current plugin base is:

- good enough for the final direction
- not yet clean enough for the final form

That means:

- preserve the current architecture
- do not restart from zero
- but tighten the contract, docs, testing, and product boundaries before scaling further

## Responsibilities by role

## Design responsibilities

Design side should define:

- DS intent
- visual naming logic
- component axes
- states
- mode strategy
- what belongs to primitives vs semantic vs components
- what the expert output should look like in Figma
- what the export experience should feel like in the plugin UI

Design side should also validate:

- whether generated Figma output is truly usable
- whether naming remains understandable
- whether starter components feel production-worthy
- whether the plugin UI communicates clearly

## Development responsibilities

Development side should define and maintain:

- the contract boundary
- normalization logic
- validation logic
- collision policy
- export pipeline
- migration behavior
- sync architecture
- future adapters

Development side should also guarantee:

- stable schema evolution
- deterministic outputs
- idempotent generation
- actionable warnings and errors
- trustworthy export behavior

## Shared responsibilities

Both sides must agree on:

- naming rules
- token hierarchy
- mode strategy
- component contract granularity
- export expectations
- status of what is implemented versus planned

## Product roadmap

## Phase 0. Stabilize the foundation

Goal:

- remove ambiguity before adding new scope

Deliverables:

- central source-of-truth document
- clarified active paths
- clarified role of each package
- test and setup cleanup
- contract review

Definition of done:

- a new session can understand the project from docs without re-investigating everything

## Phase 1. Formalize the contract

Goal:

- make the DS contract robust enough to support future exports and sync

Deliverables:

- `TokenBundle` documentation
- migration rules
- naming policy
- alias policy
- mode policy
- component metadata direction

Definition of done:

- we can describe exactly what a valid DS export is

## Phase 2. Foundation generation in Figma

Goal:

- produce a clean DS base in Figma for designers

Deliverables:

- primitives
- semantic tokens
- typography
- spacing
- radius
- light/dark handling
- UI guidance for export target visibility

Definition of done:

- the plugin can generate a strong project foundation for a new web-first team

## Phase 3. Developer export MVP

Goal:

- let developers consume the same foundation immediately

Deliverables:

- JSON token export
- CSS variable export
- TypeScript metadata export
- export scope based on what the user generated

Definition of done:

- a dev team can start implementing from the generated DS base without rebuilding tokens manually

## Phase 4. Expert components

Goal:

- generate starter component foundations through the contract

Deliverables:

- button contract implementation
- input contract implementation
- badge contract implementation
- starter variants and states
- component token exports

Definition of done:

- designers and devs can both start from the same base component system

## Phase 5. Sync architecture

Goal:

- support controlled evolution over time

Deliverables:

- export metadata for traceability
- change detection strategy
- selected-element sync flow
- migration-safe update path

Definition of done:

- design changes can update technical artifacts in a controlled and explainable way

## Priority workstreams now

## Workstream A. Documentation consolidation

Files to produce or tighten:

- `docs/shared-source-of-truth-plan.md`
- `docs/source-of-truth.md`
- `docs/token-bundle-contract.md`
- `docs/expert-mode-spec.md`
- `docs/dev-export-strategy.md`

## Workstream B. Contract hardening

Main tasks:

- confirm canonical schema fields
- confirm alias resolution rules
- confirm naming normalization rules
- confirm mode semantics
- confirm component metadata direction

## Workstream C. Plugin product flow

Main tasks:

- keep current generation levels
- add explicit export target communication
- make dev export a complement at the end of each level
- define what each level is allowed to export

## Workstream D. Expert mode implementation

Main tasks:

- unlock semantic expert path
- expose token provenance
- preview alias chains and states
- prepare first component family support

## Workstream E. Developer output MVP

Main tasks:

- define output folder/file structure
- define token JSON format
- define CSS variable output
- define TypeScript metadata format
- ensure the exported names match Figma

## Deliverables by discipline

## Design deliverables

1. Define the DS mutual visual and structural rules
2. Validate collections and mode behavior in Figma
3. Define component contract axes for starter components
4. Define expected expert-mode UX in the plugin UI
5. Validate export wording and project-usage wording

## Development deliverables

1. Harden `ds-core`
2. Stabilize plugin architecture around the active package only
3. Implement export pipeline
4. Implement expert diagnostics
5. Prepare future sync metadata

## Shared acceptance criteria

We can consider the project healthy when:

1. a designer can generate a DS base in Figma cleanly
2. a developer can consume an exported artifact immediately
3. names match between Figma and code
4. aliases are understandable and testable
5. a DS change can be propagated without manual reinterpretation
6. docs explain the system without requiring memory of previous sessions

## Immediate next actions

## For design

1. Confirm the first starter component families to support in expert mode
2. Confirm the minimal Figma page structure expected from the plugin
3. Confirm the export wording and user-facing labels

## For development

1. Create the source-of-truth and contract docs
2. clean the distinction between active and legacy files
3. fix the current test/setup issues
4. define the dev export MVP format
5. scope expert mode around semantic + first component family

## Final decision for now

We move forward with this project model:

- Figma-first for design intention
- neutral repo contract for technical stability
- web-first exports for MVP
- export as a complement to each generation level
- expert mode as the future path for starter DS components
- sync only after the contract and export pipeline are truly stable
