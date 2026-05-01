# Ombr Studio Creator - MVP Scope

## V1 scope

V1 is centered on a usable local design system creation loop: start quickly, create foundations, map semantic tokens, preview, export, and push one-way into Figma.

Included in V1:

| Feature | Priority | Purpose |
| --- | --- | --- |
| Landing page | P1 | Explain Ombr and route users into creation or demo. |
| Auth / guest mode | P1 | Let users start with minimal friction. |
| Local dashboard | P1 | List and manage local projects. |
| New project | P1 | Guide setup through name, project type, preset, and modes. |
| Colors | P1 | Define base colors, palettes, primitive tokens, and semantic color tokens. |
| Typography | P1 | Define fonts, type styles, and typography tokens. |
| Spacing | P1 | Generate and edit spacing tokens. |
| Radius | P1 | Generate and edit radius tokens. |
| Semantic tokens | P1 | Map primitives into usable design roles. |
| Preview | P1 | Check foundations and sample UI in light and dark modes. |
| JSON export | P1 | Provide a generic developer output. |
| CSS variables export | P1 | Provide a direct web implementation output. |
| Tailwind config export | P1 | Provide a Tailwind-oriented output. |
| Figma import key | P1 | Hand off the web app source to the Figma plugin. |
| One-way sync web app -> Figma | P1 | Push TokenBundle data into Figma variables, collections, and modes. |

## Excluded from V1

The following features are explicitly outside V1:

- Billing.
- Teams.
- GitHub sync.
- Import from Figma.
- Import from JSON.
- Bidirectional sync.
- Conflict resolution.
- Full component builder.
- Advanced Storybook-like component preview.
- Version history.
- Auto documentation.
- Advanced accessibility checks.

## V2 scope

V2 can extend V1 after the source-of-truth model is stable:

- Team workspace.
- GitHub sync.
- Style Dictionary advanced.
- Import from Figma.
- Import from JSON.
- Bidirectional sync.
- Conflict resolution.
- Component builder.
- Component variants.
- Storybook-like preview.
- React theme export.
- Version history.
- Auto documentation.
- Advanced accessibility checks.

## Priorities

1. Stabilize the product path from landing page to created project.
2. Make guest mode and local dashboard reliable.
3. Make foundation generation clear and editable.
4. Make semantic tokens understandable and valid across modes.
5. Make preview close enough to editing to support fast iteration.
6. Make JSON, CSS variables, and Tailwind exports stable.
7. Make Figma import key and one-way sync safe and transparent.

## Definition of a successful MVP

The MVP is successful when a user can:

- Start without a full account.
- Create a local design system project.
- Choose a preset and light/dark mode setup.
- Configure colors, typography, spacing, and radius.
- Generate primitive and semantic tokens.
- Preview the result in light and dark modes.
- Export JSON, CSS variables, and Tailwind config.
- Generate a Figma import key.
- Import tokens into Figma through the plugin.
- Understand whether the project is connected and synced.

## What V1 must prove

V1 must prove that Ombr can be the primary place where a user creates a design system foundation once and sends it to both code and Figma.

It must prove:

- A user can start in guest mode without losing the core value of the product.
- A local dashboard is enough to manage the first project loop.
- Guided project creation reduces setup friction.
- Tables can make token editing precise without making the app feel like a spreadsheet only.
- Preview close to configuration helps users trust generated tokens.
- JSON, CSS variables, and Tailwind config exports are understandable and stable.
- A Figma import key can safely hand off TokenBundle data to the plugin.
- One-way sync web app -> Figma is clear enough to avoid conflict-resolution complexity in V1.
- The product can feel premium through structure, spacing, hierarchy, and useful states rather than decoration.

## Assumed limits

- Guest mode may be local-first.
- Dashboard may be local-first.
- Figma sync is one-way only in V1.
- Figma remains a target, not the V1 source of truth.
- Component builder work must not block foundations.
- Advanced export targets must not block JSON, CSS variables, and Tailwind config.
- Version history and conflict resolution wait until bidirectional flows exist.
- The V1 UI should not over-invest in Awwwards-style landing pages, bento-heavy dashboards, decorative motion, or generic SaaS visuals.
