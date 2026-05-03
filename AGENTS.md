# Agents Guide

Stable repo memory for Codex and other AI agents working on Ombr Studio. Keep this file short, actionable, and stable. Do not use it as a session log.

For current context, read:

- `docs/agent/CURRENT_STATE.md`
- `docs/agent/PROJECT_LOG.md`
- `docs/agent/SESSION_CLOSEOUT_SKILL.md`
- `docs/memory/LEARNINGS.md`

## Product Snapshot

Ombr Studio is a Figma plugin and future web Creator for generating design system foundations shared between Figma and code:

- primitive palettes
- tokens and semantic aliases
- light/dark modes
- typography
- spacing
- radius
- icons
- JSON exports now, broader developer exports later
- components such as Button and Input later, after foundation and export milestones are stable

Current product direction from active learnings:

- `LRN-001`: the web app is the primary product surface; the Figma plugin should narrow toward import/sync over time.
- `LRN-002`: TokenBundle is the shared contract boundary.
- `LRN-004`: exporters are pure TokenBundle transformations.
- `LRN-005`: `apps/web` exists as a local-first Vite shell.

## Repo Architecture

- `packages/plugin-starter-tokens`: active Figma plugin runtime, plugin UI, manifest package, Figma API calls, and plugin-specific messaging.
- `packages/ds-core`: pure token logic, TokenBundle contract, validation, normalization, naming, palette helpers, and mapping helpers independent from Figma APIs.
- `packages/exporters`: pure developer-facing exports from TokenBundle data, decoupled from plugin UI and Figma runtime.
- `apps/web`: future Ombr Studio Creator web surface. It must stay decoupled from Figma plugin runtime code.
- `docs`: product, architecture, technical notes, agent memory, and decision history.
- `legacy/root-plugin` and `backups`: historical references only. Do not treat them as active implementation by default.

## Non-Negotiable Rules

- Read `docs/memory/LEARNINGS.md` before structuring product, design-system, architecture, or workflow decisions.
- Do not move Figma API logic into `packages/ds-core`.
- Keep `packages/ds-core` pure and independent from Figma APIs, plugin UI, browser UI, and framework state.
- Keep `packages/exporters` pure and decoupled from plugin UI, `code.ts`, `ui.html`, and Figma runtime code.
- Keep `apps/web` decoupled from the Figma plugin runtime. Do not import plugin entrypoints, manifests, `code.ts`, or `ui.html`.
- Do not treat legacy root plugin files as active implementation unless the task explicitly asks for legacy investigation.
- Do not drift into dev exports, Expert Mode, or component generation unless the current milestone explicitly asks for it.

## Modification Practice

- Prefer small, targeted, testable changes.
- Do not modify files unrelated to the task.
- Do not mix architecture refactors, UI work, tests, exporters, and runtime logic in one task unless explicitly requested.
- Follow existing package boundaries before adding new abstractions.
- Update generated files only when the task and build flow require it.
- When a durable decision, repeated error, or project constraint appears, propose adding it to the appropriate documentation.

## Agent Routing

Use one agent by default. Add a specialized agent only when its scope is directly affected:

- Project Lead: scope, priority, milestone, or sequencing ambiguity.
- UX/UI Reviewer: plugin or web screens, flow, copy, states, or visual behavior.
- QA Reviewer: merge readiness, build/runtime risk, manifest, generated outputs, tests.
- TokenBundle Architect: `packages/ds-core`, TokenBundle shape, aliases, collections, modes, semantic mapping.

Relevant agent notes live in:

- `docs/agents/project-lead.md`
- `docs/agents/ux-ui-reviewer.md`
- `docs/agents/qa-reviewer.md`
- `docs/agents/tokenbundle-architect.md`

## End-Of-Task Report

For significant sessions, run the closeout routine in `docs/agent/SESSION_CLOSEOUT_SKILL.md` before the final response.

Always report:

- files created
- files modified
- tests or checks run
- command results
- remaining risks or follow-ups

If no tests were run because the task was documentation-only, say that clearly.
