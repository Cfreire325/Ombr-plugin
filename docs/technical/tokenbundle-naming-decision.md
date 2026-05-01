# TokenBundle Naming Decision

## 1. Context

TokenBundle uses canonical slash-case token names.

Current validation accepts some raw names that can normalize cleanly. For example, `Colors.Base.White` can normalize to `colors/base/white`.

This mismatch was surfaced during Phase 1 ds-core test strengthening. The documented contract describes canonical names, while current implementation behavior accepts normalizable raw input and produces canonical normalized output.

## 2. Current decision

For now, TokenBundle validation remains permissive on raw input names when they can be deterministically normalized.

Normalized TokenBundle output must still use canonical slash-case names.

## 3. Rationale

This preserves compatibility with current plugin behavior.

It avoids breaking existing generated or user-provided names too early.

It keeps normalization useful as a resilience layer.

It separates raw author input from normalized contract output.

## 4. Contract rule

- Raw input may be permissive.
- Normalized output must be canonical.
- Canonical names use slash-case path structure and kebab-case segments.
- Duplicate names are checked after normalization.
- Exports, Figma adapter, and future web app should consume normalized names, not raw names.

## 5. Risks

- Permissive validation can hide naming mistakes.
- Different raw inputs may normalize to the same token path.
- Users may think non-canonical names are officially supported.
- Exports may become inconsistent if they consume raw names.

## 6. Mitigations

- Keep duplicate-after-normalization tests.
- Surface warnings in future UI when raw names are auto-normalized.
- Document canonical naming clearly.
- Ensure exporters consume normalized TokenBundle data.
- Consider stricter validation only in a future schema version.

## 7. Future decision point

Future versions may choose to tighten validation, but only if:

- plugin compatibility is verified;
- migration behavior is defined;
- schema versioning is considered;
- tests and docs are updated together.

## 8. Related files

- `docs/token-bundle-contract.md`
- `docs/technical/token-bundle-source-of-truth.md`
- `packages/ds-core/tests/token-bundle.test.mjs`

Validation:

- No build required.
- No tests required for docs-only change.
- Safe optional checks:
  - `npm.cmd run test:ds-core`
  - `npm.cmd run typecheck`
