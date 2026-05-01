# Ombr Studio Creator - UX Principles

## Clarity over complexity

The product should make the next useful action obvious. Users should not need to understand the full token architecture before creating their first design system.

Use progressive disclosure for advanced choices. Keep V1 flows centered on project creation, foundations, semantic tokens, preview, export, and one-way Figma sync.

## Guided setup first, expert mode later

The new project flow should guide users through project name, project type, preset, and modes before opening the Creator workspace.

Expert controls, component builder behavior, custom themes, import from Figma, and conflict resolution belong later. They should not compete with the first successful creation path.

## Table-based editing for tokens

Token editing should use clear tables where structure matters:

- Token name.
- Light mode value.
- Dark mode value.
- Type.
- Description.
- Actions.

Tables are useful for scanning, renaming, editing, and deleting tokens. They should support the mental model of a design system as structured data.

## Avoid making the app feel like a spreadsheet only

The product should not become a flat token spreadsheet. Tables should be paired with visual context, previews, grouped navigation, and guided generation.

Foundations should feel like design decisions first and data editing second.

## Visual preview close to configuration

Users should see the impact of changes quickly. Preview should stay close to configuration, either as a dedicated view or an adjacent details area where useful.

Preview should cover:

- Foundations.
- Light and dark modes.
- Sample landing page.
- Sample dashboard.
- Button states.
- Input states.
- Card, badge, and alert examples.
- Contrast issues.

## Do not expose technical complexity too early

Users should not be forced to think about TokenBundle internals, Figma variable APIs, exporter transforms, or future package boundaries during the core V1 flow.

Technical concepts should appear through understandable product labels:

- JSON export.
- CSS variables.
- Tailwind config.
- Figma import key.
- Sync status.

## Make dev export understandable

Export should clearly explain what the user is generating, where it can be used, and whether it is copied, downloaded, or saved in export history.

V1 export options should focus on:

- JSON.
- CSS variables.
- Tailwind config.
- Figma import key.

Advanced targets such as Style Dictionary and React theme export should stay marked as V2.

## Make Figma sync safe and transparent

Figma sync should avoid surprising destructive behavior. V1 is one-way: web app -> Figma.

The interface should show:

- Whether a project is connected to Figma.
- Whether an import key has been generated.
- Whether the plugin has imported tokens.
- Whether variables, collections, and modes were created.
- The last known sync status.

Bidirectional sync and conflict resolution should not appear as active V1 promises.

## Make MVP usable without a full account

Guest mode is part of the MVP. Users should be able to reach the dashboard, create a local project, edit foundations, preview, export, and generate a Figma import key without being forced into a full account too early.

The UX must clearly communicate the difference between guest mode and a signed-in account, especially around persistence, recovery, and future collaboration.

## Separate V1 foundations from V2 component builder

V1 should focus on foundations and semantic tokens. Components and Expert Mode are visible in the user flow but should not block the first version.

Component examples can appear in preview as sample UI, but full component configuration, variants, component tokens, Storybook-like preview, and component exports are V2.

## Keep naming and modes understandable

Naming convention and token format are important settings, but they should be explained through outcomes. Users should understand that good naming improves exports, Figma variables, and code usage.

Light and dark modes should be visible throughout editing, preview, export, and sync so users understand how mode values travel through the system.

## Premium through precision, not decoration

Ombr should feel premium because it is precise, structured, and useful. Visual quality should support clarity, not compete with the product task.

The validated direction is:

- Figma Variables for token tables and mode comparison.
- Linear for hierarchy, navigation, structure, and density.
- Storybook for component preview logic later.

Avoid generic SaaS UI, excessive gradients, decorative AI-style visuals, meaningless cards, oversized empty hero sections, and noisy micro-interactions. Use clear spacing, restrained color, strong hierarchy, polished states, and preview surfaces that help users understand what changed.
