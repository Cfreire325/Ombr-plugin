# Ombr Studio Creator — Visual Direction

## 1. Purpose

This document defines the visual and interaction direction for the future Ombr Studio Creator web app.

It translates the product direction, MVP scope, UX principles, and taste-skill guidance into a practical UI quality bar. It does not define implementation scope, migration steps, or plugin behavior.

## 2. Product UI direction

Ombr Studio Creator should feel like a mix of:

- Figma Variables for token tables.
- Linear for clarity, navigation, structure, and density.
- Storybook for component preview logic later.

The interface should feel clean, premium, structured, and useful. It should support design system work with strong hierarchy, clear spacing, readable data, and previews that stay close to configuration.

Ombr should avoid generic SaaS UI. It is a design system builder, not a marketing dashboard.

## 3. What the taste-skill is used for

The taste-skill is used as a frontend quality filter, not as a product strategy.

It should help avoid:

- Generic SaaS UI.
- Default shadcn look.
- Excessive gradients.
- Decorative AI-style visuals.
- Meaningless cards.
- Oversized empty hero sections.
- Noisy micro-interactions.

The taste-skill should raise the execution bar for layout, spacing, states, typography, dependency discipline, and interaction quality. It should not redefine V1 priorities, change the product roadmap, or push decorative UI over product clarity.

## 4. Visual principles

- Use a clean premium sans UI.
- Build strong hierarchy through spacing, weight, scale, and contrast.
- Use a restrained neutral palette.
- Use one controlled accent color.
- Keep spacing precise and consistent.
- Prefer structured grids for reliable layouts.
- Make the tool dense but readable.
- Avoid pure black unless justified.
- Avoid unnecessary glow or neon effects.
- Use quiet motion only when it supports understanding.
- Do not add decorative complexity over product clarity.

The visual language should feel calm and exact. Premium should come from precision, not from visual noise.

## 5. Product interface principles

- Use table-based token editing for structured token work.
- Keep token groups clear and scannable.
- Make light and dark values visible where mode comparison matters.
- Keep preview close to configuration.
- Make export states transparent.
- Make Figma sync feedback safe and explicit.
- Design clear empty, loading, and error states.
- Allow editable details without overwhelming users.
- Use progressive disclosure for expert features.

The product should help users understand what they are editing, what will be generated, and what will be exported or synced.

## 6. What must not happen

The taste-skill must not push the project into:

- Awwwards-style landing pages.
- Bento-heavy dashboards.
- Flashy component builders too early.
- Advanced motion systems.
- GSAP/ThreeJS experiments.
- Generic AI gradients.
- Decorative UI that weakens clarity.

Ombr Studio Creator must not become visually impressive at the expense of being understandable. The V1 product is a foundation and token builder; it should not behave like an experimental motion showcase.

## 7. V1 visual focus

For V1, prioritize:

- Dashboard clarity.
- Project creation clarity.
- Creator workspace structure.
- Token tables.
- Semantic token mapping.
- Preview panels.
- Export panels.
- Figma sync status.
- Polished empty, loading, and error states.

V1 should make the core workflow feel trustworthy: create a project, edit foundations, map semantic tokens, preview results, export files, and push one-way to Figma.

## 8. V2 visual direction

V2 can introduce richer surfaces once the V1 foundation is stable:

- Component builder.
- Component variants.
- Storybook-like preview.
- Version history.
- Team/workspace surfaces.
- Richer documentation views.

These surfaces can use more advanced interaction patterns, but only where they support inspection, comparison, collaboration, or documentation.

## 9. Implementation guidance for future apps/web

- Check dependencies before imports.
- Isolate interactive React client components.
- Use Tailwind carefully.
- Avoid hardcoding fragile viewport assumptions.
- Design all states, not only the happy path.
- Use performant animation only with transform/opacity.
- Keep components readable and maintainable.

Future `apps/web` implementation should use the taste-skill to improve craft while respecting Ombr's product scope. If a visual idea makes token editing, export, preview, or sync less clear, it should be simplified.

## 10. Relationship to other docs

- `user-flow-source.md` defines the product flow.
- `product-vision.md` defines the strategy.
- `mvp-scope.md` defines the V1 boundaries.
- `visual-direction.md` defines the UI quality bar.
- Technical docs define architecture and migration.

Visual quality should support product clarity. Ombr must feel premium because it is precise, structured, and useful — not because it is decorative.
