# Ombr Studio Creator - TokenBundle Source of Truth

## Central contract

TokenBundle is the central contract for Ombr Studio Creator. It should represent the design system independently from any specific output target.

The web app creates and edits TokenBundle data. Exporters transform it into code formats. The Figma adapter transforms it into Figma variables, collections, modes, and aliases.

## What belongs in ds-core

`packages/ds-core` should own:

- TokenBundle types.
- Primitive token types.
- Semantic token types.
- Mode model.
- Alias/reference model.
- Token groups such as text, background, border, foreground, icon, focus rings, shadows, and component colors.
- Foundation generation helpers for colors, typography, spacing, radius, widths, and containers.
- Preset definitions when they are product-neutral.
- Validation helpers for missing aliases, naming consistency, light/dark values, and basic contrast checks.
- Serialization-safe structures used by web, exporters, and Figma adapter.

## What does not belong in ds-core

`ds-core` should not contain:

- Web app views.
- Figma plugin UI.
- Figma API calls.
- Export file writing behavior.
- Route logic.
- Storage adapters.
- Authentication logic.
- Dashboard UI state.
- Plugin manifest or entrypoint code.

## Primitive, semantic, and component tokens

Primitive tokens are direct foundation values. Examples include palette colors, spacing scale values, radius values, and typography values.

Semantic tokens map primitive values to product meaning. Examples include text, background, border, foreground, icon, focus rings, shadows, and component colors.

Component tokens are component-specific mappings. They are visible as V2 and should not block V1. Examples include button size, variant, state, radius token, color token, and typography token.

## Token data vs output formats

Token data is the source model. It should preserve names, modes, token types, values, aliases, descriptions, and metadata.

Figma variables are a target representation. They require mapping TokenBundle data into Figma collections, modes, variable names, values, and aliases.

CSS variables are a target representation. They require naming rules and mode output such as `:root` and `[data-theme="dark"]`.

Tailwind config is a target representation. It requires mapping tokens into Tailwind theme sections such as colors, spacing, borderRadius, fontFamily, fontSize, and related values.

The same TokenBundle should be able to produce all of these without duplicating source data.

## Naming decision

See `docs/technical/tokenbundle-naming-decision.md` for the Phase 1 naming decision.

TokenBundle names are canonical slash-case in normalized output. Raw input names may remain permissive when they normalize deterministically, which preserves current plugin compatibility during Phase 1. Duplicate checks happen after normalization. Exporters, Figma adapter, and the future web app should consume normalized names, not raw names.

## Duplication risks

The main risk is allowing separate type definitions to evolve in parallel:

- `packages/ds-core` types.
- Existing plugin preset types.
- Exporter-specific types.
- Figma adapter payload types.
- Web app form state types.

When these diverge, exports and Figma sync become unreliable. The source-of-truth contract should live in `ds-core`, with adapters deriving their own target payloads from it.

## Plan to reduce duplicate types

This is a documentation-level roadmap, not an immediate refactor.

1. Audit current token and preset types, especially `plugin-starter-tokens/src/presets/types.ts`.
2. Identify which types describe product data and which describe plugin runtime needs.
3. Move product data shapes into `ds-core` only after tests exist.
4. Update plugin code to consume `ds-core` types where safe.
5. Keep plugin-specific UI or Figma runtime types inside the plugin.
6. Remove duplicate product types from plugin code only after imports are stable.
7. Add type-level and serialization tests around TokenBundle compatibility.

## User flow influence on data model

The user flow implies that TokenBundle must support:

- Project name and metadata.
- Preset origin.
- Light mode, dark mode, and later custom themes.
- Foundations: colors, typography, spacing, radius, widths, containers, and icons.
- Primitive tokens.
- Semantic tokens.
- Later component tokens.
- Aliases between semantic tokens and primitives.
- Export settings.
- Figma connection and sync metadata outside the pure token core.

The model should keep pure token data separate from app-specific dashboard state, but it must be rich enough to support preview, export, and Figma import.

## Visual direction influence on data shape

The validated visual direction reinforces the need for data that can be displayed clearly in token tables and preview panels.

TokenBundle should therefore make these concepts easy to render without adapter-specific guessing:

- Token names.
- Token groups.
- Token types.
- Light mode values.
- Dark mode values.
- Aliases or references.
- Descriptions.
- Validation issues.
- Export-relevant naming metadata.

The UI should not need to reverse-engineer these fields from Figma variables, CSS variables, or Tailwind config. Those are outputs; TokenBundle remains the editable source.
