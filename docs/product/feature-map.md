# Ombr Studio Creator - Feature Map

This feature map uses `user-flow-source.md` and `visual-direction.md` as primary sources. It keeps V1 focused on local creation, foundations, semantic tokens, preview, exports, Figma import key, and one-way sync web app -> Figma.

## Public website

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Landing page | MVP | P1 | Understand Ombr and start creation. | Public content and CTA routing. | apps/web | Clear, premium, structured; avoid oversized empty hero sections. |
| Discover Ombr | MVP | P1 | Learn the product value. | Product messaging. | apps/web | Concrete product explanation over generic SaaS claims. |
| View benefits | MVP | P1 | See tokens, colors, modes, exports, and Figma sync benefits. | Landing content model. | apps/web | Show product surfaces, not decorative cards. |
| View demo | MVP | P2 | Inspect the product before creating. | Demo project or static walkthrough. | apps/web | Should feel like a real Creator preview, not a marketing animation. |

## Authentication / Guest mode

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Sign in | MVP | P2 | Access saved projects. | Auth provider decision. | apps/web | Calm, compact form with clear errors and helper text. |
| Sign up | MVP | P2 | Create an account. | Auth provider decision. | apps/web | Explain account value without blocking guest flow. |
| Forgot password | MVP | P3 | Recover account access. | Auth provider support. | apps/web | Simple recovery state, no decorative complexity. |
| Continue as Guest | MVP | P1 | Start without account friction. | Local persistence rules. | apps/web | Make guest limits visible without fear-based copy. |
| Redirect to Dashboard | MVP | P1 | Reach the project hub. | Auth/guest state. | apps/web | Fast transition with clear loading state if needed. |

## Dashboard

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Project list | MVP | P1 | See available projects. | Local project storage. | apps/web | Linear-like density with strong hierarchy and clear rows. |
| Project metadata | MVP | P1 | Compare name, last modified, sync status, token count, and mode count. | Project model. | apps/web, packages/ds-core | Use structured columns; token/mode counts should be scannable. |
| Open project | MVP | P1 | Continue editing. | Project routing. | apps/web | Primary action must be obvious without visual noise. |
| New project | MVP | P1 | Start a new system. | New project flow. | apps/web | Clear CTA, not a generic SaaS hero button. |
| Duplicate project | MVP | P2 | Reuse an existing setup. | Project copy behavior. | apps/web | Secondary action with safe feedback. |
| Rename project | MVP | P2 | Keep projects organized. | Project metadata editing. | apps/web | Inline editing with clear save/cancel/error states. |
| Delete project | MVP | P2 | Remove unused work. | Local deletion rules. | apps/web | Destructive action requires explicit confirmation. |
| Export from dashboard | MVP | P2 | Export without deep navigation. | Export generation. | apps/web, packages/exporters | Show export target and status transparently. |

## New project

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Enter project name | MVP | P1 | Name the system. | Project model. | apps/web | Label above input, helper/error text below. |
| Starter design system | MVP | P1 | Start from guided defaults. | Preset data. | apps/web, packages/ds-core | Guided setup first; avoid expert complexity. |
| Custom setup | MVP | P1 | Start from manual choices. | Empty project model. | apps/web, packages/ds-core | Clear choice, not overwhelming configuration. |
| Import from Figma | V2 | P3 | Start from existing Figma variables. | Figma read adapter. | packages/figma-adapter, apps/figma-plugin | Mark as V2; do not present as active V1 path. |
| Import from JSON | V2 | P3 | Start from external token data. | JSON parser and validation. | packages/ds-core | Mark as V2; avoid confusing V1 creation. |
| Preset selection | MVP | P1 | Choose Tailwind, Shadcn, Untitled UI, Flowbite, or Custom. | Preset definitions. | packages/ds-core | Preview differences with useful details, not decorative tiles. |
| Mode selection | MVP | P1 | Choose Light only, Dark only, or Light + Dark. | Mode model. | packages/ds-core | Make mode consequences visible early. |

## Ombr Creator workspace

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Project header | MVP | P1 | See project name, settings, export, preview, and sync status. | Project state. | apps/web | Strong hierarchy; sync and export status visible but quiet. |
| Sidebar navigation | MVP | P1 | Move between foundations, tokens, preview, exports, and settings. | Route structure. | apps/web | Linear-like navigation with clear grouping. |
| Main editing area | MVP | P1 | Edit current section. | Section-specific editors. | apps/web | Figma Variables-like tables and precise spacing. |
| Preview/details area | MVP | P2 | See impact near configuration. | Preview renderer. | apps/web | Preview close to configuration; avoid separate decorative showcase. |

## Foundations

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Colors | MVP | P1 | Define palettes and color tokens. | Palette generation and contrast checks. | apps/web, packages/ds-core | Token table plus palette preview; visible light/dark values. |
| Typography | MVP | P1 | Define type styles and typography tokens. | Type scale model. | apps/web, packages/ds-core | Table values paired with text preview. |
| Spacing | MVP | P1 | Generate spacing scale. | Spacing scale model. | apps/web, packages/ds-core | Dense but readable values with visual spacing preview. |
| Radius | MVP | P1 | Generate radius scale. | Radius scale model. | apps/web, packages/ds-core | Corner preview close to token values. |
| Widths | MVP | P2 | Define max widths. | Layout token model. | apps/web, packages/ds-core | Layout preview should clarify impact. |
| Containers | MVP | P2 | Preview layout containers. | Layout preview. | apps/web, packages/ds-core | Structured grid preview, no ornamental containers. |
| Icons | MVP | P3 | Represent icon token needs. | Icon strategy. | apps/web, packages/ds-core | Keep minimal until icon strategy is defined. |
| Breakpoints | V2 | P3 | Configure responsive behavior. | Responsive token model. | packages/ds-core | V2; introduce only when layout token model is ready. |

## Tokens

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Primitive tokens | MVP | P1 | Store generated foundation values. | TokenBundle model. | packages/ds-core | Figma Variables-like table with clear type/value columns. |
| Semantic tokens | MVP | P1 | Map primitives to product roles. | Alias model and validation. | apps/web, packages/ds-core | Mapping UI must show aliases, missing values, and mode differences. |
| Component tokens | V2 | P3 | Configure component-specific values. | Component token schema. | packages/ds-core | V2; do not let this block foundation clarity. |

## Modes

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Light mode | MVP | P1 | Define default values. | Mode value storage. | packages/ds-core | Visible as a first-class value column. |
| Dark mode | MVP | P1 | Define alternate values. | Mode value storage. | packages/ds-core | Compare against light mode without hiding differences. |
| Custom themes | V2 | P3 | Add more themes later. | Multi-theme model. | packages/ds-core | V2; avoid adding theme complexity to V1 tables. |

## Preview

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Theme preview | MVP | P1 | Validate foundations visually. | Token-to-style runtime. | apps/web | Storybook-like logic later, but V1 preview stays close to editing. |
| Sample landing page | MVP | P2 | See tokens in a realistic screen. | Preview templates. | apps/web | Useful sample UI, not a marketing page generator. |
| Sample dashboard | MVP | P2 | See operational UI impact. | Preview templates. | apps/web | Linear-like density and structure. |
| Button/input/card examples | MVP | P2 | Inspect common states without full component builder. | Lightweight preview components. | apps/web | Examples only; not the V2 component builder. |
| Contrast issue detection | MVP | P2 | Catch obvious accessibility problems. | Contrast validation. | packages/ds-core | Inline issue feedback near affected values. |
| Accessibility preview | V2 | P3 | Run deeper checks. | Accessibility rules engine. | apps/web, packages/ds-core | V2; richer reports after core preview is stable. |

## Exports

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| JSON export | MVP | P1 | Use raw TokenBundle output. | Stable serialization. | packages/exporters | Show empty/loading/success/error states and copy/download action. |
| CSS variables export | MVP | P1 | Use tokens in web CSS. | CSS naming and mode mapping. | packages/exporters | Make `:root` and dark theme behavior understandable. |
| Tailwind config export | MVP | P1 | Use tokens in Tailwind. | Tailwind theme mapping. | packages/exporters | Show generated structure clearly. |
| Figma import key | MVP | P1 | Send project to the plugin. | Import handoff format. | apps/web, packages/figma-adapter | Safe handoff UI with clear next steps. |
| Style Dictionary | V2 | P3 | Produce advanced platform exports. | Transform pipeline. | packages/exporters | V2; do not crowd V1 export panel. |
| React theme | V2 | P3 | Use tokens in React theme systems. | Framework-specific mapping. | packages/exporters | V2; advanced target after basic exports are stable. |

## Figma sync

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Connect project | MVP | P1 | Link web project to Figma import. | Import key and plugin flow. | apps/web, apps/figma-plugin | Transparent connection state, not hidden magic. |
| Plugin imports tokens | MVP | P1 | Bring tokens into Figma. | TokenBundle parser. | apps/figma-plugin, packages/figma-adapter | Clear progress and failure feedback. |
| Create variables | MVP | P1 | Materialize tokens in Figma. | Figma Variables API mapping. | packages/figma-adapter | Status should mention variables explicitly. |
| Create collections/modes | MVP | P1 | Preserve light/dark structure. | Collection and mode mapping. | packages/figma-adapter | Status should mention collections and modes explicitly. |
| Sync status | MVP | P1 | Understand connection health. | Sync metadata. | apps/web | Dashboard badge plus detailed state when needed. |
| Pull Figma -> web app | V2 | P3 | Read changes back from Figma. | Figma read adapter and diffing. | packages/figma-adapter | V2; requires conflict-aware UI. |
| Conflict resolution | V2 | P3 | Resolve divergent changes. | Conflict model and UI. | apps/web, packages/figma-adapter | V2; not visible as active V1 behavior. |

## Existing project

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Open existing project | MVP | P1 | Continue work. | Dashboard routing. | apps/web | Fast, clear return path. |
| Edit tokens | MVP | P1 | Update system values. | Token editors. | apps/web, packages/ds-core | Table editing with precise inline states. |
| Save changes | MVP | P1 | Preserve work locally. | Local persistence. | apps/web | Quiet save state and clear errors. |
| Export again | MVP | P1 | Regenerate outputs. | Exporters. | packages/exporters | Show what changed or what was generated. |
| Sync with Figma | MVP | P1 | Push changes to Figma. | Import/sync flow. | apps/web, apps/figma-plugin | Safe one-way action with preview/status. |
| Version history | V2 | P3 | Inspect previous states. | Revision storage. | apps/web | V2; structured timeline later. |
| Restore previous version | V2 | P3 | Roll back changes. | Revision restore. | apps/web | V2; requires confirmation and comparison UI. |

## Components / Expert Mode V2

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Component builder | V2 | P3 | Configure components visually. | Component token model. | apps/web, packages/ds-core | V2; Storybook-like logic only after foundations are stable. |
| Button | V2 | P3 | Configure size, variant, state, icon, radius, color, and typography. | Component schema. | apps/web, packages/ds-core | State matrix should be clear, not flashy. |
| Input | V2 | P3 | Configure form component tokens. | Component schema. | apps/web, packages/ds-core | Include default, focus, error, disabled states later. |
| Badge | V2 | P3 | Configure label/status tokens. | Component schema. | apps/web, packages/ds-core | Useful status preview over decorative badges. |
| Card | V2 | P3 | Configure surface tokens. | Component schema. | apps/web, packages/ds-core | Avoid meaningless card overuse. |
| Export component tokens | V2 | P3 | Deliver component config. | Component exporters. | packages/exporters | V2; depends on component token contract. |

## Settings

| Feature | Stage | Priority | User objective | Probable dependency | Probable app/package | UI direction link |
| --- | --- | --- | --- | --- | --- | --- |
| Project settings | MVP | P2 | Configure project metadata. | Project model. | apps/web | Compact settings, clear labels, visible consequences. |
| Naming convention | MVP | P1 | Keep tokens predictable. | Naming rules. | packages/ds-core, packages/exporters | Explain impact on Figma variables and code exports. |
| Token format | MVP | P1 | Control output shape. | TokenBundle schema. | packages/ds-core | Progressive disclosure; avoid exposing internals too early. |
| Team settings | V2 | P3 | Manage collaboration. | Team workspace. | apps/web | V2; do not imply teams exist in V1. |
