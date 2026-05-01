# Bridge + Token Research Notes

## Date

- 2026-04-09

## Context7 status

- `context7` has been added to the local Codex MCP config at `~/.codex/config.toml`.
- Current local Codex CLI status: `enabled`, but `Not logged in`.
- Important: it is installed for the local Codex CLI, but it is not exposed as a usable MCP tool inside this already-running session yet.

## Why this note exists

- Align the plugin architecture with a more robust DS-first workflow.
- Capture the most reusable ideas from Bridge before we write more plugin and DS mutual files.
- Keep a practical reference focused on our project, not a generic summary.

## Bridge: what matters most for us

## 1. Bridge is not "AI writes raw Figma scripts"

Bridge's core idea is:

1. user intent
2. knowledge base lookup
3. compilable spec
4. scene graph with token refs
5. compiler validation
6. generated Figma API code
7. execution in Figma

The key lesson for us:

- the agent should not invent visual values ad hoc
- the agent should consume a documented DS contract
- validation should happen before Figma writes when possible

## 2. The knowledge base is the real multiplier

Bridge centers everything on a knowledge base containing:

- registries
- guides
- recipes
- learnings

Applied to our project, that means our "real intelligence layer" should not live only in prompts or in memory. It should live in repo files such as:

- DS contract docs
- token schema docs
- component mapping docs
- plugin payload docs
- migration notes

## 3. Zero hardcoded values is the right bar

Bridge explicitly pushes:

- real components
- bound variables
- text styles
- zero hardcoded values

For our plugin and DS mutual, this strongly suggests:

- semantic/component generation must resolve from named tokens
- UI plugin primitives should map to DS recipes, not scattered CSS decisions
- any "expert" mode should preview aliases and token provenance, not just values

## 4. Compiler-first thinking is more important than tool choice

Even if we do not copy Bridge literally, the architectural idea is valuable:

- use declarative input
- validate structure
- resolve aliases/tokens centrally
- generate the final runtime output from a stable intermediate model

For us, `TokenBundle` is already the beginning of that compiler boundary.

## Design token principles worth keeping

## 1. Keep a stable interchange format

The DTCG format is the best external reference for long-term interoperability.

Practical implication:

- our internal model can stay Figma-friendly
- but our exchange format should stay close to DTCG concepts:
  - typed tokens
  - explicit values
  - aliases/references
  - optional descriptions
  - vendor extensions when needed

## 2. Names must be normalized and collision-safe

Important interoperability rule:

- token names are long-lived identifiers, not just labels

Implication for us:

- keep slash-case as canonical exchange naming
- avoid multiple naming dialects as "equally canonical"
- allow aliases for compatibility, but define one source naming convention

## 3. Collections should express responsibility, not just storage

The current split remains good:

- `primitives`
- `semantic`
- `components`

Recommended meaning:

- `primitives`: raw scales and foundational values
- `semantic`: contextual meaning such as `text/primary`, `bg/canvas`
- `components`: implementation-level decisions for component states and variants

## 4. Modes are first-class, not an afterthought

Figma variables and token import/export both make modes central.

Implication for us:

- modes should be defined in the contract, not inferred late
- every semantic/component token should clearly define whether it is:
  - dual mode
  - light-only
  - dark-only

## 5. Alias chains should stay understandable

Good token systems do not only resolve aliases. They keep them inspectable.

Implication for our plugin:

- expert mode should show:
  - token name
  - collection
  - type
  - mode values
  - alias target
  - unresolved alias warnings

## 6. Composite tokens should be used deliberately

The DTCG format supports composite values like typography, shadow, border, transition.

For our current phase, a practical stance is:

- keep interchange mostly atomic for variables that map cleanly to Figma variables
- use composite structures in docs/contracts when helpful
- flatten to Figma-compatible output where needed

This is especially relevant for:

- typography recipes
- shadows/effects
- component recipe definitions

## What this means for our plugin

## 1. The current architecture is directionally good

What is already strong in our repo:

- `ds-core` defines a validation/normalization boundary
- plugin runtime accepts `tokenBundle`
- fallback behavior still exists without bundle

This is a solid base and should be preserved.

## 2. The next real upgrade is not "more generation"

It is better observability and stricter DS mediation.

Priority upgrades:

1. unlock the expert branch in UI
2. show semantic token provenance
3. support `components/*` through the same contract
4. make errors and migration states explicit

## 3. The plugin UI should become a DS consumer too

Right now, part of the DS mutual already informs the plugin UI.

We should formalize that by separating:

- plugin UI tokens
- plugin UI component recipes
- plugin generation engine tokens

Even if some values overlap, their responsibilities are different.

## What this means for our DS mutual

## 1. We need one source-of-truth stack, not one source-of-truth file

Recommended hierarchy:

1. contract
   - `packages/ds-core`
2. governance
   - `docs/` and `apps/docs/`
3. generated/exported examples
   - JSON exports
4. plugin consumption layer
   - `packages/plugin-starter-tokens`

## 2. Component contracts should be explicit before scale-up

Before adding many components, define for each one:

- axes
- states
- required tokens
- allowed alias targets
- fallback policy

The `Button Contract v1` approach is the right pattern to repeat.

## 3. "Ready for Dev" needs a harder definition

A component should not be considered handoff-ready if:

- it still contains local hardcoded colors
- it lacks critical states
- its token lineage is unclear
- its export cannot be normalized into the DS contract

## Recommended file strategy for our next docs

Based on Bridge's strengths, our next files should aim to cover these roles explicitly:

1. `source-of-truth.md`
   - what is active
   - what is historical
   - what doc wins on conflict

2. `token-bundle-contract.md`
   - canonical schema
   - naming rules
   - modes
   - alias constraints
   - migration policy

3. `component-contracts/`
   - one file per component family
   - button, input, select, modal, badge, alert

4. `expert-mode-spec.md`
   - expected UI
   - expected payloads
   - expected diagnostics

## Recommendations I would carry forward

1. Keep `TokenBundle` as the central interchange boundary.
2. Do not let the plugin invent new DS semantics locally.
3. Treat `components/*` as a first-class next phase, not a later nice-to-have.
4. Make provenance visible in the plugin UI.
5. Prefer one canonical naming system with compatibility aliases.
6. Keep docs and validation rules versioned together.
7. Separate "spec target" from "implemented today" in every major doc.

## Open questions to answer next

1. Is our long-term source of truth meant to be Figma-first, repo-first, or bi-directional with one arbitration layer?
2. Do we want `components/*` to generate Figma variables only, or also feed plugin UI recipes directly?
3. Should the DS mutual cover only the plugin UI at first, or also prepare a broader reusable product DS?
4. Do we want DTCG-shaped JSON as the external export target from day one, or only as a compatibility direction?
