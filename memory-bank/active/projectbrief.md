# Project Brief

Constrain Dependabot so toolchain majors track the repo's actual runtime and compiler generation, and align `@types/node` with Node 22 (`.nvmrc`).

## Requirements

1. Add `ignore` rules in `.github/dependabot.yaml`:
   - `typescript` versions `>=7.0.0` (TS 7 Go rewrite; not ready for this codebase)
   - `@types/node` versions `>=23.0.0` (types major should track Node 22, not latest Node release)
2. Bump `@types/node` in `package.json` from `^20.0.0` to `^22.0.0` and refresh `package-lock.json`.
3. Lock the policy in CI contract tests (existing `test/parsers.test.ts` `ci` section).
4. Close Dependabot PRs #43 and #44 with `@dependabot ignore this major version`.
5. Open a non-draft PR for the changes.
