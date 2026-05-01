# Expert Mode Spec

## Date

- 2026-04-13

## Status

- product and architecture specification
- not fully implemented yet

## Purpose

This document defines what the future Expert Mode should do.

It is written before full implementation on purpose, so that:

- design decisions are explicit
- engineering scope stays controlled
- the feature grows from a stable spec instead of ad hoc runtime behavior

## Why Expert Mode exists

Foundation mode gives teams a clean DS starting point:

- primitives
- semantic tokens
- typography
- spacing
- radius

Expert Mode exists to go one layer higher:

- starter component logic
- starter component tokens
- starter variants
- starter states
- better token provenance visibility

Its goal is not to generate a whole product UI.

Its goal is to generate a stronger shared DS base for both:

- the designer in Figma
- the developer in code

## Product role

Expert Mode should:

- extend the DS foundation
- make semantic and component logic more inspectable
- produce starter component structures
- optionally export corresponding dev artifacts

Expert Mode should not:

- generate final product screens automatically
- replace product design work
- replace future page-building tools like Bridge
- hide component logic behind unexplained automation

## Main user promise

If a designer uses Expert Mode, they should be able to leave with:

- a stronger Figma DS file
- first starter component families
- visible states and variants
- clearer semantic/component mapping
- optional developer outputs matching the same base

## Placement in the plugin

Expert Mode should remain part of the generation-level flow.

Recommended product behavior:

- keep visible levels or progression
- present Expert Mode as the advanced layer after foundation work
- keep developer export as an optional complement at the end of the flow

It should not become a separate disconnected tool.

## Initial scope

The first Expert Mode milestone should focus on:

1. semantic token inspection and diagnostics
2. one starter component family implemented properly

Recommended first family:

- `button`

Reason:

- high reuse
- easy to understand visually
- good surface for states, variants, and sizing
- strong value for both Figma and code

After `button`, recommended order:

1. `input`
2. `badge`
3. `alert`
4. `card`
5. `modal`

## Expert Mode user flow

## Step 1. Enter Expert Mode

The user should understand immediately:

- this mode builds on the foundation already generated
- it is meant for component-ready DS work
- it may generate both Figma-side structures and optional dev artifacts

## Step 2. Choose the component family

The user selects what they want to generate or inspect.

Initial options for the first milestone may be:

- `Button`
- `Input` soon
- `Badge` soon

For MVP, it is acceptable that only `Button` is enabled and the others are visibly marked as coming later.

## Step 3. Choose component axes

The user configures the starter contract for the selected family.

For `button`, the important axes are:

- hierarchy
- tone
- size
- shape
- icon mode
- state coverage

## Step 4. Preview generated structure

Before generation, the plugin should show a structured preview of what will be created.

Preview categories:

- semantic dependencies
- component token names
- states
- variants
- export eligibility

## Step 5. Generate in Figma

The plugin creates or updates:

- component tokens
- starter component variants
- starter documentation references
- state-ready structures

The operation must stay idempotent.

## Step 6. Optional developer export

At the end of the flow, the user can choose whether to export the generated component base for developers too.

This export should include only what was actually generated.

## MVP output for Expert Mode

The first MVP should generate:

- semantic diagnostics
- starter `button` contract support
- starter button token structure
- starter button state structure
- optional `button` dev export

It does not need to generate:

- multiple full component families at once
- fully coded React components
- design-to-page generation
- sync back from code

## Figma outputs

Expert Mode should be able to generate or update:

- component-related variables
- starter component token structure
- starter component variants
- starter state coverage
- Figma-side labels or metadata useful for handoff and export

For the first milestone, the generated Figma outputs should feel:

- understandable
- inspectable
- easy to refine manually by the designer

## Contract dependency

Expert Mode must stay contract-driven.

This means:

- no hidden component logic detached from `TokenBundle` thinking
- semantic dependencies must be explicit
- component tokens must be named canonically
- aliases must be inspectable
- future exports must map from the same structure

## Diagnostics requirement

Expert Mode should be more transparent than Foundation mode.

It should expose:

- token collection
- token type
- token name
- per-mode values
- alias targets
- unresolved alias warnings
- missing required states
- type conflicts

This is one of the main reasons the mode exists.

## Provenance view

One of the core Expert Mode features should be provenance visibility.

For a starter component token, the user should be able to understand:

1. what token was generated
2. what semantic dependency it uses
3. what primitive or final raw value sits below it
4. whether the chain is valid in both modes

Example:

- `components/button/primary/border/focus`
- aliases to `semantic/border/focus`
- which aliases to `primitives/colors/brand/500`

## `Button` contract for MVP

The first Expert Mode implementation should follow the DS direction already started in the repo.

Recommended MVP axes:

- `size`: `sm | md | lg`
- `hierarchy`: `primary | secondary`
- `tone`: `brand | neutral`
- `shape`: `default | pill`
- `icon`: `none | leading | trailing | only`
- `state`: `default | hover | focus | disabled`

Recommended minimal generated token families:

- `components/button/{hierarchy}/{tone}/bg`
- `components/button/{hierarchy}/{tone}/fg`
- `components/button/{hierarchy}/{tone}/border`
- `components/button/{hierarchy}/{tone}/bg/hover`
- `components/button/{hierarchy}/{tone}/fg/hover`
- `components/button/{hierarchy}/{tone}/border/hover`
- `components/button/{hierarchy}/{tone}/bg/disabled`
- `components/button/{hierarchy}/{tone}/fg/disabled`
- `components/button/{hierarchy}/{tone}/border/disabled`
- `components/button/focus/ring-outer`
- `components/button/focus/ring-inner`
- `components/button/radius/{size}`
- `components/button/padding-x/{size}`
- `components/button/padding-y/{size}`
- `components/button/gap/{size}`
- `components/button/icon-size/{size}`
- `components/button/text-style/{size}`

## State coverage policy

For MVP Expert Mode:

- `default` is required
- `hover` is required
- `focus` is required
- `disabled` is required

Future states may include:

- `active`
- `pressed`
- `loading`
- `focus-visible`

## Naming policy

Expert Mode must reuse the same naming rules as the contract:

- slash-case path
- kebab-case segments

## Generation rules

Expert Mode generation should be:

- idempotent
- collision-aware
- alias-aware
- explicit about warnings

If a variable already exists:

- update it when compatible
- warn on incompatible type
- never create silent duplicates in the same conceptual path

## UI behavior expectations

The Expert Mode UI should communicate:

- what is implemented now
- what is planned next
- whether dev export is available for the current family

Recommended UI sections:

- component family selector
- contract axes selector
- generated structure preview
- diagnostic summary
- export complement toggle

## Developer export relationship

Expert Mode should not own a separate export model.

It should reuse the same export principles as the rest of the plugin:

- export only what the user generated
- keep names aligned with Figma
- keep semantics aligned with the contract

For MVP, Expert Mode dev export should focus on:

- token JSON additions
- CSS variable additions
- TypeScript metadata additions

## What Expert Mode is not yet responsible for

In early phases, Expert Mode does not need to do:

- multi-family bulk generation
- framework-specific code generation
- full component implementation for all platforms
- code-to-Figma sync
- page or screen building

## Definition of done for Expert Mode MVP

The MVP is successful when:

1. a user can enter Expert Mode and understand its role
2. a user can generate a starter `button` foundation in Figma
3. semantic/component token relationships are visible
4. aliases and conflicts are diagnosable
5. optional dev export can include the generated component base
6. the result is reusable for future refinement by both designer and developers

## Open implementation questions

These questions can stay open during the spec phase:

1. Should starter Figma components be generated as full component sets immediately or as token-backed structure first?
2. How much manual refinement should remain expected after Expert Mode generation?
3. Should provenance be shown inline, in a side panel, or in a dedicated preview screen?
4. Should component contract metadata live directly inside `TokenBundle.meta` or in a parallel contract layer later?

## Immediate next engineering steps

1. unlock semantic-expert path in the UI in a limited way
2. build provenance and diagnostics views
3. define button contract metadata needs
4. add first end-to-end `components/*` flow through the runtime
5. connect optional dev export to the generated component surface
