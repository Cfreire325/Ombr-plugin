# Ombr Studio Creator — User Flow Source

## 1. Product overview

Ombr Studio Creator is a web app for building design systems. It is the primary interface where a user creates, organizes, previews, exports, and synchronizes a design system.

The current Figma plugin progressively becomes an importer and synchronizer for Figma. In the visible V1 direction, the web app is the source of creation and Figma receives the generated tokens through the plugin.

The product principle shown by the flow is: create a design system once, then export it to Figma and code.

## 2. MVP scope visible in the user flow

| Feature | User objective | Role in V1 | Visible dependency |
| --- | --- | --- | --- |
| Landing page | Discover Ombr and understand the value of tokens, colors, modes, exports, and Figma sync. | Public entry point before authentication or guest access. | Requires public website content and CTA routing. |
| Auth / Guest mode | Access the product either with an account or without signing in. | Low-friction access to the dashboard and project creation. | Requires authentication decisions and guest project persistence rules. |
| Dashboard | View, manage, and reopen design system projects. | Main project hub for created systems. | Requires project list metadata: name, last modified date, Figma sync status, token count, and mode count. |
| New project | Start a design system from a guided setup. | Primary creation path before entering Creator. | Requires project type, preset, and mode selection. |
| Colors | Define brand and system colors, generate palettes, validate contrast, and create tokens. | Core foundation editing surface. | Requires color library selection, palette generation from 50 to 950, primitive tokens, and semantic token generation. |
| Typography | Define font families and text styles, then generate typography tokens. | Core foundation editing surface. | Requires display/body font configuration, weights, sizes, line heights, letter spacing, and preview. |
| Spacing | Generate and edit spacing tokens from a scale. | Core foundation editing surface. | Requires spacing scale generation and preview. |
| Radius | Generate and edit radius tokens from a radius scale. | Core foundation editing surface. | Requires radius scale generation and corner preview. |
| Semantic tokens | Map primitives into usable semantic groups across modes. | Bridges foundations to product-ready token usage. | Requires primitive token review, light/dark validation, alias checks, naming consistency checks, and saving a semantic set. |
| Preview | Inspect foundations and sample UI in light and dark modes. | Feedback loop before export and sync. | Requires mode switching, sample UI, component-state preview examples, and contrast issue detection. |
| Export JSON / CSS / Tailwind | Generate usable code artifacts from the design system. | Developer-facing output for V1. | Requires target selection, export options, file generation, copy/download behavior, and export history. |
| Import to Figma via plugin | Bring web app tokens into Figma. | Figma delivery path for V1. | Requires Figma import key and plugin-side import behavior. |
| One-way sync: Web app -> Figma | Push the web app source of truth into Figma. | Keeps V1 sync constrained and predictable. | Requires connection state, sync preview or status, push action, and completion status. |

## 3. V2 scope visible in the user flow

| Feature | User objective | Why not V1 | Probable dependency |
| --- | --- | --- | --- |
| Team workspace | Collaborate around shared design systems. | Adds account, permission, and workspace complexity beyond first creation/export flows. | Team model, roles, shared storage, and billing or ownership rules. |
| GitHub sync | Connect exports to a code repository. | Requires external integration and repository conflict handling. | GitHub OAuth, repo selection, branch/PR strategy, file mapping. |
| Style Dictionary advanced | Generate advanced multi-platform token outputs. | V1 already includes simpler JSON, CSS variables, and Tailwind config. | Exporter architecture, transform configuration, platform targets. |
| Import from Figma | Start or update a project from existing Figma tokens. | Reverses the V1 source-of-truth direction. | Figma read adapter, token normalization, mapping rules. |
| Bidirectional sync | Keep web app and Figma mutually updated. | Requires change tracking and conflict rules absent from one-way V1. | Diff engine, source metadata, revision history. |
| Conflict resolution | Decide what wins when web app and Figma diverge. | Only relevant once bidirectional sync exists. | Conflict UI, merge strategy, history and rollback. |
| Component builder | Configure components visually. | The current milestone is foundations, semantic tokens, TokenBundle, and exports before generated components. | Component token model, preview renderer, Figma/code component adapters. |
| Component variants | Generate size, variant, and state combinations. | Depends on component builder and component token structure. | Variant schema, property controls, state mapping. |
| Storybook-like preview | Inspect components and states in a richer catalog. | Depends on component builder maturity. | Preview runtime, component stories, state matrix. |
| React theme export | Export a framework-specific theme. | V1 export targets are more general. | React package format, theme schema, package or file generation. |
| Version history | Restore or inspect previous project states. | Requires durable revision tracking. | Storage snapshots, diff display, restore behavior. |
| Auto documentation | Generate documentation from tokens and components. | Depends on stable token/component structures. | Documentation renderer, content templates, export/publish surface. |
| Advanced accessibility checks | Go beyond contrast detection. | V1 preview only visibly requires contrast issue detection. | Accessibility rules engine, component context, reporting UI. |

## 4. Public website flow

Flow: Landing Page -> Discover Ombr -> View benefits -> CTA: Create your design system -> CTA: View demo -> Decision: user authenticated? -> Dashboard or Authentication / Guest mode.

User goal: understand the value of Ombr and decide whether to start, demo, sign in, sign up, or continue as guest.

User actions:

- Visit the landing page.
- Discover Ombr.
- Review benefits: tokens, colors, modes, export, and Figma sync.
- Choose "Create your design system" or "View demo".
- Continue into the authenticated dashboard, authentication flow, or guest mode.

System actions:

- Display product benefits.
- Route CTA clicks.
- Check whether the user is authenticated.
- Send authenticated users to Dashboard.
- Send unauthenticated users to Sign In, Sign Up, or Continue as Guest.

Output:

- Authenticated users reach the dashboard.
- Unauthenticated users enter authentication or guest mode.
- Demo viewers can inspect the product without necessarily creating an account.

Edge cases:

- User clicks Create but is not authenticated.
- User wants to view a demo before creating a project.
- User starts as guest and later may need account persistence.
- Auth state is stale or invalid and must be rechecked before dashboard access.

## 5. Authentication flow

The authentication branch includes Sign In, Sign Up, Forgot Password, Continue as Guest as an MVP option, and Redirect to Dashboard.

Sign in allows an existing user to access saved projects. Sign up creates a new account before reaching the dashboard. Forgot password supports account recovery. Continue as Guest allows immediate MVP usage without account creation.

Guest mode differs from a user account because the flow does not show team access, durable cross-device persistence, or account recovery for guests. A signed-in account is the safer path for saved projects, future team workspaces, and cloud-backed history.

V1 should include:

- Sign in.
- Sign up.
- Continue as Guest.
- Redirect to Dashboard.
- A clear guest/account distinction.

Forgot password appears in the PDF and should exist in the authentication surface, but its implementation depth can remain lighter than the core creation path if needed. Team workspace behavior and account-level collaboration can remain V2.

## 6. Dashboard flow

The dashboard is the project hub.

Visible project metadata:

- Project name.
- Last modified.
- Figma sync status.
- Token count.
- Mode count.

Visible quick actions:

- Open project.
- New project.
- Duplicate project.
- Rename project.
- Delete project.
- Export.

Dashboard outputs:

- Open existing project: sends the user to the Creator workspace for that project.
- New project: starts the guided New Project flow.

The dashboard must help users distinguish project freshness, sync health, token scale, and mode configuration before opening a project.

## 7. New project flow

Flow: New Project -> Enter project name -> Choose project type -> Choose preset -> Choose modes -> Create project.

Project types:

- Starter design system.
- Custom setup.
- Import from Figma, V2.
- Import from JSON, V2.

Presets:

- Tailwind.
- Shadcn.
- Untitled UI.
- Flowbite.
- Custom.

Modes:

- Light only.
- Dark only.
- Light + Dark.

Output:

- Project created.
- User redirected to Creator.

The V1 flow should prioritize creating from Starter design system or Custom setup. Import from Figma and Import from JSON are visible in the source flow but marked V2.

## 8. Ombr Creator workspace

The Creator workspace is the main editing surface for a project.

Visible workspace elements:

- Project name.
- Settings button.
- Export button.
- Preview button.
- Sync status.
- Sidebar / navigation.
- Main editing area.
- Optional preview/details area.

Foundations:

- Colors.
- Typography.
- Spacing.
- Radius.
- Widths.
- Containers.
- Icons.

Tokens:

- Primitive tokens.
- Semantic tokens.
- Component tokens, V2.

Modes:

- Light mode.
- Dark mode.
- Custom themes, V2.

Components, V2:

- Button.
- Input.
- Badge.
- Card.
- Switch.
- Checkbox.
- Select.

Preview:

- Theme preview.
- Component preview.
- Accessibility preview, V2.

Exports:

- JSON.
- CSS variables.
- Tailwind config.
- Style Dictionary, V2.
- Figma import key.

Settings:

- Project settings.
- Naming convention.
- Token format.
- Team settings, V2.

## 9. Foundations — Colors flow

Flow: Open Colors -> Choose color library -> Define base colors -> Generate palette 50-950 -> Edit shades -> Delete colors -> Add custom colors -> Validate contrast -> Generate primitive tokens -> Generate semantic tokens.

Base colors:

- Primary brand color.
- Secondary brand color.
- Neutral color.
- Black / White.
- Error / Warning / Success.

Expected color token table:

| Token name | Light mode value | Dark mode value | Type | Description | Actions |
| --- | --- | --- | --- | --- | --- |
| Color token name | Light value or alias | Dark value or alias | Primitive or semantic | Token purpose and usage context | Edit / Rename / Delete |

Outputs:

- Color token table.
- Primitive color tokens.
- Semantic color tokens.

The color flow is both a foundation editor and a generator. It starts from base color decisions, expands them into palettes, then turns those values into primitive and semantic tokens.

## 10. Foundations — Typography flow

Flow: Open Typography -> Choose font family -> Define display font -> Define body font -> Generate text styles -> Configure weights -> Configure sizes -> Configure line heights -> Generate typography tokens -> Preview text styles.

Expected typography token table:

| Token name | Font family | Size / Weight / Line height | Letter spacing | Actions |
| --- | --- | --- | --- | --- |
| Typography token name | Display or body family | Configured type scale values | Configured letter spacing | Edit / Rename / Delete |

Outputs:

- Typography token table.
- Generated text styles.
- Typography tokens.
- Text style preview.

## 11. Foundations — Spacing, Radius, Widths, Containers flow

Spacing:

Flow: Open Spacing -> Choose scale -> Generate spacing tokens -> Edit values -> Preview spacing.

Output:

- Spacing token set.
- Spacing preview.

Radius:

Flow: Open Radius -> Choose radius scale -> Generate radius tokens -> Edit values -> Preview corners.

Output:

- Radius token set.
- Corner preview.

Widths / Containers:

Flow: Open Containers / Widths -> Define max widths -> Define breakpoints, V2 -> Preview layout.

Output:

- Width and container values.
- Layout preview.

Breakpoints are visible as V2, so V1 can focus on max widths and container previews without blocking on responsive breakpoint authoring.

## 12. Semantic tokens flow

Flow: Open Semantic Tokens -> Review primitive tokens -> Edit token mapping -> Validate light/dark values -> Check missing aliases -> Check naming consistency -> Save semantic token set.

Token groups:

- Text.
- Background.
- Border.
- Foreground.
- Icon.
- Focus rings.
- Shadows.
- Component colors.

The semantic tokens flow is a validation and mapping step. It makes primitives usable in product contexts and verifies that light/dark mode values, aliases, and naming remain coherent before export or sync.

## 13. Preview flow

Flow: Open Preview -> Choose mode -> Light / Dark -> Preview foundations -> Preview sample UI -> Sample landing page -> Sample dashboard -> Button states -> Input states -> Card / Badge / Alert -> Detect contrast issues -> Return to edit tokens.

Output:

- Preview changes.
- Preview updated.

The preview flow is an edit-feedback loop. It does not replace token editing; it reveals whether the generated tokens work across foundation previews, sample product screens, component states, and contrast checks.

## 14. Export flow

Flow: Click Export -> Select export target -> Configure export options -> Generate files -> Download or copy code -> Save export history.

Export targets:

- JSON.
- CSS variables.
- Tailwind config.
- Figma.
- Style Dictionary, V2.
- React theme, V2.

Outputs:

- JSON export.
- CSS variables export.
- Tailwind config export.
- Figma import key.

The V1 export path should cover general developer outputs and the Figma import handoff. Style Dictionary advanced and React theme export are visible but marked V2.

## 15. Figma sync flow

Flow: Sync with Figma -> Project connected to Figma?

If no:

- Generate import key.
- Open Figma plugin.
- Paste key in plugin.
- Plugin imports tokens.
- Plugin creates variables.
- Plugin creates collections/modes.
- Mark project as connected.
- Update sync status.

If yes:

- Check differences.
- Show sync preview.
- User chooses action.
- Push web app -> Figma.
- Pull Figma -> web app, V2.
- Resolve conflicts, V2.
- Sync complete.

Important:

- V1 sync is one-way only: Web app -> Figma.
- V2 may support bidirectional sync and conflict resolution.

The Figma plugin acts as the importer/synchronizer. In V1, the web app remains the source and Figma is updated from it.

## 16. Existing project flow

Flow: Dashboard -> Open existing project -> Edit tokens -> Preview changes -> Save changes -> Export again -> Sync with Figma.

Additional actions:

- Version history, V2.
- Duplicate project.
- Archive project.
- Restore previous version, V2.

The existing project flow is the repeat usage loop. A user returns from the dashboard, edits tokens, validates them in preview, saves, exports again, and syncs with Figma when needed.

## 17. Components / Expert Mode V2 flow

Flow: Open Components -> Choose component type -> Configure properties -> Preview component -> Generate variants -> Export component tokens -> Export to Figma, V2 -> Export code config, V2.

Component types:

- Button.
- Input.
- Badge.
- Card.

Button properties:

- Size: Small / Medium / Large.
- Variant: Primary / Secondary / Tertiary.
- State: Default / Hover / Active / Disabled.
- Icon left/right.
- Radius token.
- Color token.
- Typography token.

This area is V2. It should not block V1, whose visible priority is foundations, semantic tokens, preview, general exports, and one-way Figma sync.

## 18. Product implications

The following implications are derived from the user flow. They are not a migration proposal and do not require implementation yet.

apps/web:

- Becomes the primary product interface.
- Needs public website, auth/guest entry, dashboard, project creation, Creator workspace, preview, export, and sync surfaces.
- Needs project-level state for modes, sync status, counts, export history, and settings.

packages/ds-core:

- Needs to represent foundations, primitive tokens, semantic tokens, modes, token groups, aliases, and generated outputs consistently.
- Needs validation concepts for light/dark values, missing aliases, naming consistency, and contrast checks.
- Later V2 scope may add component tokens, custom themes, and version-aware data structures.

packages/exporters:

- Needs export targets for JSON, CSS variables, and Tailwind config in V1.
- Needs options/configuration per target and a way to produce downloadable or copyable output.
- Later V2 scope may add Style Dictionary advanced, React theme export, documentation output, and GitHub sync integration.

packages/figma-adapter:

- Needs to translate web app token data into Figma-compatible variables, collections, and modes.
- Needs import-key based handoff for V1.
- Later V2 scope may add Figma reads, bidirectional diffs, conflict resolution, and import-from-Figma mapping.

apps/figma-plugin:

- Gradually shifts toward importer/synchronizer behavior.
- In V1, it should accept an import key, import tokens, create variables, create collections/modes, and report sync completion.
- V2 may require pull-from-Figma, conflict resolution UI, and component export support.

## 19. Open questions

- Guest mode should be local only, or should cloud save come later?
- Should the V1 dashboard work without an account?
- What is the priority between CSS variables and Tailwind config?
- Should the Figma import key be local, file-based, or a remote key?
- What naming convention should be the default?
- Which presets are truly V1: Tailwind, Shadcn, Untitled UI, Flowbite, Custom?
- Should dark mode be generated automatically or manually editable?
- Should exports be downloaded file by file or as a ZIP package?
- What does "View demo" expose: a static demo, a sample project, or a read-only Creator workspace?
- How much of Forgot Password is required for V1 if guest mode is available?
- What persistence rules apply to duplicated, renamed, deleted, and archived projects?
- Does export history exist in V1 storage or only as a future audit trail?
- What exact fields define the Figma sync status on the dashboard?

## 20. Next recommended step

Create the product and technical scoping documents from this `user-flow-source.md`, using it as the source product map for V1/V2 separation, implementation sequencing, and agent-ready task breakdowns.
