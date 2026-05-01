# Ombr Studio Creator - Export Strategy

## Source of truth

TokenBundle is the source of truth for all exports. Exporters should transform TokenBundle into target formats without changing the source data.

V1 export targets:

- JSON.
- CSS variables.
- Tailwind config.

V1 Figma export target:

- Figma import key.

V2 export targets:

- Style Dictionary.
- React theme.
- Platform-specific exports.

## JSON export

JSON export should preserve the TokenBundle shape as directly as possible. It is the most generic developer output and can also help debug other exports.

Expected qualities:

- Stable schema.
- Version field.
- Project metadata when appropriate.
- Modes.
- Primitive tokens.
- Semantic tokens.
- Aliases.
- Descriptions and token types.

## CSS variables export

CSS variables should generate readable variables from primitive and semantic tokens.

Expected structure:

```css
:root {
  --color-primary-500: #3366ff;
  --color-background-default: var(--color-neutral-50);
  --space-4: 1rem;
  --radius-md: 0.5rem;
}

[data-theme="dark"] {
  --color-background-default: var(--color-neutral-950);
}
```

Rules:

- Use stable kebab-case names.
- Keep aliases as CSS `var(...)` where possible.
- Put default/light values in `:root`.
- Put dark overrides in `[data-theme="dark"]`.
- Do not emit V2 component tokens as required V1 output.

## Tailwind config export

Tailwind config should map TokenBundle values into Tailwind theme sections.

Expected areas:

- `theme.colors`.
- `theme.spacing`.
- `theme.borderRadius`.
- `theme.fontFamily`.
- `theme.fontSize`.
- Later `theme.extend` choices if needed.

Expected qualities:

- Predictable key names.
- Mode-aware color strategy.
- Clear relationship to presets such as Tailwind, Shadcn, Untitled UI, Flowbite, and Custom.
- No dependency on Figma plugin runtime.

## Figma import key

The Figma import key is an export-like handoff, but its target is the plugin rather than a developer file.

It should identify or contain enough information for the plugin to import TokenBundle data and create Figma variables, collections, and modes.

Open decision:

- Local key.
- File payload.
- Remote key or link.

## Naming rules

Naming must stay consistent across outputs. The default should be simple, readable, and stable:

- Lowercase.
- Kebab-case for CSS variables.
- Predictable object keys for JSON and Tailwind.
- Semantic names that reflect usage, not only raw values.
- Mode names that map cleanly to light and dark.

Naming convention should be a project setting because it affects exports and Figma variables.

## Export options visible in the user flow

The user flow shows:

- Click Export.
- Select export target.
- Configure export options.
- Generate files.
- Download or copy code.
- Save export history.

V1 should support enough options to make exports useful without turning export into an advanced configuration product.

## Export UI states

The validated visual direction requires exports to be understandable, safe, and calm.

V1 export panels should cover:

| State | Meaning | User-facing behavior |
| --- | --- | --- |
| Empty | No export target is selected or no project data is ready. | Explain what can be exported and guide the user to select JSON, CSS variables, Tailwind config, or Figma import key. |
| Loading | Export generation is running. | Show target-specific progress text and avoid generic spinners where a skeleton or inline progress state is clearer. |
| Success | Files, code, or import key were generated. | Show copy/download actions and the generated target name. |
| Error | Export generation failed. | Show the failing target, likely cause, and recovery action. |

Export UI should be dense but readable. It should not hide generated output behind decorative cards, and it should not expose low-level exporter internals too early.

## Tests needed for stable exports

Export stability requires tests around:

- TokenBundle serialization.
- CSS variable names.
- CSS light/dark output.
- CSS alias output.
- Tailwind config shape.
- Tailwind token mapping.
- JSON schema compatibility.
- Export determinism.
- Invalid token handling.
- Missing alias handling.

When exporters are created, snapshot tests can help catch accidental output changes, but they should be paired with semantic assertions so snapshots do not hide incorrect behavior.
