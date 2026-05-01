# Component Token Architecture

## Goal

Build plugin UI the same way as the shared design system:

- foundations tokens are the base truth
- semantic tokens express usage
- component tokens define how a component is built
- screens and blocks consume components and tokens instead of raw values

## Layering

### 1. Foundations

Raw reusable decisions:

- spacing
- radius
- typography
- primitive colors
- shadows
- icon sizes

Example:

- `spacing/3xl = 24px`
- `radius/md = 8px`

### 2. Semantic tokens

Meaningful aliases not tied to a single component:

- `color/background/canvas`
- `color/text/primary`
- `color/border/default`
- `color/icon/subtle`

These should alias foundations or palette tokens.

### 3. Component tokens

Component-specific decisions built on top of semantic and foundation tokens.

Example for button:

- `component/button/height/md`
- `component/button/padding/inline/md`
- `component/button/padding/block/md`
- `component/button/radius`
- `component/button/icon/gap`
- `component/button/color/text/primary/default`
- `component/button/color/text/primary/hover`
- `component/button/color/background/primary/default`
- `component/button/color/background/primary/hover`
- `component/button/color/background/primary/pressed`
- `component/button/color/border/secondary/default`

### 4. Recipes / component variants

The runtime component consumes component tokens through props:

- variant
- size
- state
- icon-left / icon-right

In code, prefer:

- `<Button variant="primary" size="md" state="hover" />`

Over a single flat token name like:

- `Button-default-pressed`

The token source stays structured; exports can flatten later if needed.

## Naming recommendation

Keep the source nested and path-based.

Recommended order:

- `component/<component>/<property-or-slot>/<variant>/<state>/<size>`

Or, when size is more structural:

- `component/<component>/<property-or-slot>/<size>/<variant>/<state>`

Rule of thumb:

- layout and construction tokens should group by property first
- visual state tokens should group by property -> variant -> state

Recommended examples:

- `component/button/height/md`
- `component/button/padding/inline/md`
- `component/button/padding/block/md`
- `component/button/icon/gap/md`
- `component/button/color/background/primary/default`
- `component/button/color/background/primary/hover`
- `component/button/color/background/primary/pressed`
- `component/button/color/text/primary/default`
- `component/input/height/md`
- `component/input/padding/inline/md`
- `component/input/color/border/default`
- `component/input/color/border/focus`
- `component/select/icon/chevron/size`

## Construction rules

### Rule 1

Never build components from raw values when a foundation token exists.

### Rule 2

Prefer semantic tokens for colors inside components.

Good:

- `component/button/color/background/primary/default -> {color/background/brand/bold}`

Avoid:

- `component/button/color/background/primary/default -> #3b82f6`

### Rule 3

Prefer foundation tokens for layout values.

Good:

- `component/button/padding/inline/md -> {spacing/3xl}`

### Rule 4

If a Figma element is not connected to a token, snap it to the closest existing token instead of keeping a raw value.

### Rule 5

If a recurring value has no good token, create a new token at the correct layer instead of hiding the value inline in a component.

## Suggested file split

For source files in the repo:

- `tokens/foundations/spacing.json`
- `tokens/foundations/radius.json`
- `tokens/foundations/typography.json`
- `tokens/foundations/color.json`
- `tokens/semantic/color.json`
- `tokens/components/button.json`
- `tokens/components/input.json`
- `tokens/components/select.json`
- `tokens/components/modal.json`
- `tokens/components/card.json`

## Plugin implementation rule

In plugin UI code:

- screens use component classes or component token vars
- blocks use layout tokens
- no ad hoc spacing or radius values

Examples:

- screen section gap -> `var(--ds-spacing-3xl)`
- card padding -> `var(--component-card-padding-md)`
- button height -> `var(--component-button-height-md)`

## Why this structure

- easier sync between Figma and code
- clearer handoff
- easier variant generation
- easier future export for web and React
- easier expert-mode component generation

## Source notes

This structure follows:

- DTCG: component-specific tokens should start with the component they support and stay close to the component code
- DTCG: source tokens should stay grouped/nested instead of relying on a single flattened string name
- Atlassian: choose tokens by meaning, not by matching a raw value
- Style Dictionary: nested token files with aliases are the normal build source for multi-platform outputs
