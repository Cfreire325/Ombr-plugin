# Ombr Studio Creator - Monorepo Target Architecture

## Target structure

```text
ombr/
├── apps/
│   ├── web/
│   └── figma-plugin/
├── packages/
│   ├── ds-core/
│   ├── exporters/
│   ├── figma-adapter/
│   └── ui/ optional later
├── docs/
├── AGENTS.md
├── package.json
└── README.md
```

This is a target architecture, not a current migration instruction.

The target architecture supports the validated product flow and visual direction. The web app owns the premium, structured Creator experience; shared packages own stable data and transformation logic; the Figma plugin stays focused on import/sync.

## apps/web

`apps/web` is the future primary product interface. It owns:

- Public website.
- Authentication and guest mode.
- Local dashboard.
- New project flow.
- Creator workspace.
- Token editing UI.
- Preview UI.
- Export UI.
- Figma import key generation UI.
- Sync status UI.

`apps/web` should depend on shared packages for token logic and exports. It should not depend on Figma plugin runtime code.

## apps/figma-plugin

`apps/figma-plugin` is the Figma runtime app. Its long-term role is importer/synchronizer, not full product creator.

It owns:

- Figma plugin manifest and entrypoints.
- Minimal plugin UI for import/sync.
- Figma runtime permissions and messaging.
- Calls into Figma adapter logic where possible.

It should not own generic token schemas, exporter logic, or web app product state.

## packages/ds-core

`packages/ds-core` owns the design system data contract and pure logic:

- TokenBundle schema.
- Primitive token types.
- Semantic token types.
- Mode model.
- Alias model.
- Preset data where appropriate.
- Validation helpers.
- Pure generation helpers for foundations.

It must stay independent from Figma APIs, browser UI, and web framework state.

## packages/exporters

`packages/exporters` owns conversion from TokenBundle to developer-facing outputs:

- JSON export.
- CSS variables export.
- Tailwind config export.
- Later Style Dictionary advanced exports.
- Later React theme export.

It should consume TokenBundle from `ds-core` and produce strings/files. It should not know about Figma plugin UI or web app routes.

## packages/figma-adapter

`packages/figma-adapter` owns conversion from TokenBundle to Figma concepts:

- Variables.
- Collections.
- Modes.
- Aliases.
- Import payload mapping.
- Later diff and bidirectional sync helpers.

It may depend on `ds-core`. It should not contain plugin UI. The plugin can call it, but the adapter should remain focused on mapping and Figma API interactions.

## packages/ui optional later

`packages/ui` is optional and should come later only if shared UI becomes valuable across apps. V1 can avoid this package until there is repeated UI logic worth extracting.

Premature shared UI can slow down product iteration. The first priority is stable product behavior and token contracts.

If `packages/ui` is introduced later, it should support Ombr's visual direction: clean premium sans UI, structured token tables, clear states, restrained palette, and product clarity over decoration. It should not become a generic component library that pushes the product toward default SaaS patterns.

## Allowed dependencies

- `apps/web` may depend on `packages/ds-core`, `packages/exporters`, and later shared UI.
- `apps/web` may depend on `packages/figma-adapter` only for import-key payload preparation if that package exposes runtime-safe pure helpers.
- `apps/figma-plugin` may depend on `packages/ds-core` and `packages/figma-adapter`.
- `packages/exporters` may depend on `packages/ds-core`.
- `packages/figma-adapter` may depend on `packages/ds-core`.
- `packages/ui` may depend on design tokens but should avoid business logic.

## Forbidden dependencies

- `packages/ds-core` must not depend on `apps/web`.
- `packages/ds-core` must not depend on `apps/figma-plugin`.
- `packages/ds-core` must not depend on Figma plugin APIs.
- `packages/exporters` must not depend on plugin UI or Figma runtime code.
- `packages/figma-adapter` must not depend on web app routes, React views, or plugin UI.
- `apps/web` must not import from plugin entrypoint files such as `code.ts`, `ui.html`, manifest files, or plugin-only runtime modules.

## Why apps/web must never depend on plugin code

The web app is the source creation surface. If it imports plugin runtime code, the product architecture becomes constrained by Figma environment assumptions, plugin bundling, and Figma API availability.

The safe direction is:

- Shared token logic lives in `ds-core`.
- Shared exports live in `exporters`.
- Figma mapping lives in `figma-adapter`.
- The plugin consumes shared packages.
- The web app consumes shared packages.

## Why figma-adapter must not contain plugin UI

The adapter should be testable mapping logic. Plugin UI concerns such as screens, paste fields, loading states, and user messages belong in `apps/figma-plugin`.

Keeping UI out of the adapter makes it easier to test TokenBundle-to-Figma mapping and later reuse mapping logic for sync, imports, and conflict checks.
