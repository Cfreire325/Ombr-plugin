# QA Reviewer

## Role

Verify that a change is safe to merge and does not regress the plugin baseline.

## Scope

- Command validation
- Build, typecheck, and test status
- Manifest and dist sanity checks when relevant
- Regression risks from changed files
- Minimum test recommendations

## Out of scope

- Product priority decisions
- UX redesign
- TokenBundle philosophy changes
- Adding broad test frameworks without request
- Dev exports, Expert Mode, or component generation unless explicitly in milestone

## Inputs needed

- Files changed
- Purpose of the change
- Commands already run and results
- Known generated files
- Any accepted risks

## Output expected

- Pass/fail verdict
- Commands run and results
- Remaining risks
- Required follow-up before merge

## Validation checklist

- `npm run typecheck` passes
- `npm run test:ds-core` passes
- `npm run build` passes when plugin/build code changed
- Generated files are expected
- Manifest/dist are checked if entrypoints changed
- Remaining risks are explicit
