# Agents Guide

This file routes lightweight multi-agent work for Starter Tokens. Use it to keep decisions focused, avoid duplicated analysis, and protect the current product priority.

## Product Direction

Starter Tokens is a Figma plugin that generates a shared design system base between Figma and code: variables, styles, tokens, light/dark modes, icons, then developer exports. Button/Input/component generation comes later.

Current priority order:

1. Stabilize the current plugin UX/UI
2. Stabilize foundations
3. Stabilize semantic tokens
4. Stabilize TokenBundle
5. Add dev export MVP
6. Generate Button/Input/etc. only after that milestone is active

The user remains the final product decision-maker. Agents may recommend, challenge, or warn, but they must not redefine product direction without explicit user validation.

## Default Routing

Use one agent by default. Add a specialized agent only when its scope is directly affected.

- Stay in simple mode for small local fixes, docs cleanup, command checks, or build hygiene.
- Use Project Lead when scope, priority, or sequencing is unclear.
- Use UX/UI Reviewer when plugin screens, flow, copy, states, or `src/ui.html` behavior are affected.
- Use QA Reviewer before merge, or when build, manifest, runtime, tests, or generated outputs are affected.
- Use TokenBundle Architect when `packages/ds-core`, TokenBundle shape, aliases, collections, light/dark behavior, or semantic mapping are affected.

Do not drift into dev exports, Expert Mode, or component generation unless the current milestone explicitly asks for it.

## Agent Files

- `docs/agents/project-lead.md`
- `docs/agents/ux-ui-reviewer.md`
- `docs/agents/qa-reviewer.md`
- `docs/agents/tokenbundle-architect.md`

## Token Budget Rules

- Do not call multiple agents by default.
- Give each agent only the files and context needed for its scope.
- Ask for findings, risks, recommendation, and checklist only.
- Do not duplicate work already covered by another agent.
- Prefer short verdicts over broad audits.
- Keep durable decisions in docs; keep transient command output out of docs.

## Notion Updates

Do not update Notion by default. Update it only for durable decisions:

- priority changes
- TokenBundle or architecture rules
- milestone validation
- important accepted risks

Do not update Notion for routine command results, regenerated files, small wording changes, or temporary investigation notes.

Suggested Notion shape:

```text
Decision:
Context:
Files impacted:
Validation:
Next step:
```

## Before Merge

Validate changes before merge:

1. Scope stayed inside the current milestone
2. No unrequested feature work was added
3. Functional code changes are intentional and listed
4. Generated files are intentional and listed
5. `npm run typecheck` passes
6. `npm run test:ds-core` passes
7. `npm run build` passes when plugin runtime or build pipeline is touched
8. Manifest/dist are checked when Figma entrypoints are touched
9. Risks remaining are listed
10. Notion is updated only if a durable decision changed
