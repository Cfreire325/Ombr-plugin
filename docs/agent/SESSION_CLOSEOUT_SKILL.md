# Session Closeout Skill

## Purpose

Use this routine to keep Ombr Studio project memory current after a significant Codex session. It helps future agents understand what changed, what was decided, what was verified, and what still needs attention.

This file is a project-specific closeout procedure, not a replacement for `AGENTS.md`, `docs/agent/CURRENT_STATE.md`, `docs/agent/PROJECT_LOG.md`, or `docs/memory/LEARNINGS.md`.

## When To Use

Use this routine when:

- code was modified
- files were created
- a durable decision was made
- architecture changed
- an important bug was fixed
- a stable limitation or risk was identified
- a product or technical session produced useful new context

This routine is not necessary for:

- a simple answer
- read-only investigation with no lasting decision
- a micro-fix with no durable impact

## Files To Read First

- `AGENTS.md`
- `docs/agent/CURRENT_STATE.md`
- `docs/agent/PROJECT_LOG.md`
- `docs/agent/CODEX_HANDOFF_TEMPLATE.md`
- `docs/memory/LEARNINGS.md`

`docs/memory/LEARNINGS.md` already exists and contains the active project learnings. Do not rewrite it entirely.

Modify `docs/memory/LEARNINGS.md` only if the session reveals:

- a durable decision
- an important architecture rule
- a recurring error to avoid
- a significant bug resolved with a clear cause
- a stable project constraint

Any new learning must follow the existing format:

- ID `LRN-00X`
- Date
- Area
- Contexte
- Découverte
- Evidence
- Impact
- Application
- Status

Do not add a learning for temporary, uncertain, or unverified information.

## Closeout Steps

### 1. Review the session

- Re-read the changes made during the session.
- Identify files created.
- Identify files modified.
- Identify decisions made.
- Identify tests and checks run.
- Identify remaining risks or follow-ups.

### 2. Update `docs/agent/CURRENT_STATE.md`

Update only the sections affected by the session:

- Current Focus
- Recently Completed Work
- Important Decisions
- Known Open Issues
- Recommended Next Steps
- Last Updated

Do not rewrite the whole file unnecessarily. Do not invent unverified information. Use `Unknown / not verified yet` when needed.

### 3. Append to `docs/agent/PROJECT_LOG.md`

Add a short dated entry using the existing format. Keep the log concise and avoid turning it into a full transcript.

Include:

- Summary
- Files created
- Files modified
- Decisions made
- Tests run
- Known risks / follow-ups
- Recommended next step

### 4. Update durable learnings if relevant

If a recurring bug, durable rule, error to avoid, or long-term decision was identified, propose an update to `docs/memory/LEARNINGS.md`.

Do not modify `docs/memory/LEARNINGS.md` automatically if:

- the information is temporary
- the information is uncertain
- the information has no durable impact
- the information is already covered by an active learning

If a new learning is added, it must:

- use the next available ID after the existing learnings
- cite verifiable evidence in the repo
- explain the concrete impact
- explain how to apply it in future sessions

### 5. Final response

End with a clear summary:

- files created
- files modified
- tests/checks run
- docs updated
- risks remaining
- next recommended step

## Output Format

Example final response:

```md
## Closeout Summary

### Files created
- ...

### Files modified
- ...

### Tests/checks run
- ...

### Memory updates
- `docs/agent/CURRENT_STATE.md`: updated ...
- `docs/agent/PROJECT_LOG.md`: appended ...
- `docs/memory/LEARNINGS.md`: updated / not updated

### Known risks
- ...

### Recommended next step
- ...
```
