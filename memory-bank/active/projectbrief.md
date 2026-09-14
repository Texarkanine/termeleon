# Project Brief

## User Story

As a maintainer, I want to know which `npm audit` findings we can actually clear and to apply those fixes, so the report is honest about remaining risk and we do not ship a lockfile that still lists remediable issues.

## Use-Case(s)

### Use-Case 1

Run `npm audit` on the current tree and determine, for each finding (`diff` / jsdiff DoS, `serialize-javascript` RCE and DoS, both via mocha), whether a safe upgrade, override, or parent bump (`@vscode/test-cli` / mocha) can clear it.

### Use-Case 2

Apply the remediations that are safe, leave any that are not, and re-run `npm audit` so the remaining report matches that judgment.

## Requirements

1. Assess each of the three reported vulnerabilities for fixability without breaking host tests or the published VSIX.
2. Apply only the remediations that are safe (lockfile and/or `package.json` as needed).
3. Leave unfixable findings documented as such; do not paper over them with a silent ignore unless that is the honest outcome.

## Constraints

1. Mocha is not a direct dependency; it comes through `@vscode/test-cli`. Both `diff` and `serialize-javascript` are mocha's children.
2. These packages are not bundled into `dist/extension.js` and are not a runtime dependency of the published extension (`smol-toml` is the only runtime dep).
3. Lockfile refresh must stay compatible with `npm ci` on linux CI (generate from a clean tree if regenerating).
4. Host-test runner versions (`@vscode/test-cli`, `@vscode/test-electron`) are pinned in the lockfile; CI-contract tests in `test/parsers.test.ts` may notice a declared-range change.

## Acceptance Criteria

1. Each of the three audit findings has an explicit verdict: fixed, or cannot/should not be fixed, with a one-line reason.
2. After the work, `npm audit` no longer reports findings we judged fixable.
3. Parser and host test suites still pass.
