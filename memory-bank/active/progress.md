# Progress

Set up Open VSX publishing in the release workflow on release-please release creation using `OPENVSX_TOKEN`, wire up test coverage reporting and CI upload via Codecov using `CODECOV_TOKEN`, add the Codecov badge to `README.md`, and update CI contract tests and memory-bank context.

**Complexity:** Level 2

## 2026-08-31 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Ingested task input and clarified intent with operator.
    - Switched to feature branch `feat/ci-openvsx-codecov`.
    - Classified complexity as Level 2 (Simple Enhancement).
    - Initialized active memory bank documents.
* Decisions made
    - Use `ovsx` / `@vscode/vsce` or `npx ovsx publish` for Open VSX publishing with `OPENVSX_TOKEN`.
    - Use `codecov/codecov-action` in `ci.yaml` with `CODECOV_TOKEN`.
    - Integrate coverage runner for test suites and verify CI contract in `test/parsers.test.ts`.

## 2026-08-31 - PLAN - COMPLETE

* Work completed
    - Established detailed Level 2 implementation plan in `tasks.md`.
    - Defined 6 testable behaviors for CI, release-please, coverage scripts, ignores, and badge.
    - Validated technology choices: `c8` for V8 coverage and `ovsx` for Open VSX publishing.
    - Completed Pre-Mortem assessment.
* Decisions made
    - Add `c8` as devDependency for coverage collection and `test:coverage` script.
    - Publish to Open VSX using `npx --yes ovsx publish *.vsix --pat "$OPENVSX_TOKEN"` upon GitHub release.
    - Upload coverage with `codecov/codecov-action@v7` using `CODECOV_TOKEN`.

## 2026-08-31 - PREFLIGHT - COMPLETE

* Work completed
    - Validated the Level 2 implementation plan against the existing CI, release workflow, package scripts, test contracts, and memory-bank guidance.
    - Recorded `FAIL (fixable)` in `.preflight-status`.
* Findings
    - The plan omits the required `package-lock.json` update and clean-tree `npm ci` verification for the proposed `c8` dependency.
    - The planned coverage-ignore contract test omits `.gitignore`, although the requirement applies to both Git and VSIX packaging ignores.
* Advisory
    - Consider a future `codecov.yml` with baseline-derived project and patch thresholds after initial coverage uploads.

## 2026-08-31 - PREFLIGHT (re-run) - COMPLETE

* Work completed
    - Re-validated the revised Level 2 plan against the codebase: workflows, package scripts, existing CI contract tests, ignore files, and sibling-repo badge conventions.
    - Recorded `PASS WITH ADVISORY` in `.preflight-status`.
    - Verified both prior FAIL findings resolved (lockfile update with clean-tree `npm ci` verification; `.gitignore` coverage-ignore assertions).
* Findings
    - Struck the "[Readme Badge Contract]" behavior from the Test Plan as a change-detector (README badge presence can only fail on deliberate README edits); the badge work remains in Unit 3 as prose/policy with no tests.
    - Advisory: use `coverage/` in `.gitignore` (trailing-slash idiom) vs `coverage/**` in `.vscodeignore`.
    - Advisory: pre-existing techContext drift — release workflow actually uses `DOGGO_BOT_APP_ID`/`DOGGO_BOT_PRIVATE_KEY`, not the documented `HELPER_APP_*`; fix surgically in Unit 3.
    - Advisory: ensure the Open VSX namespace and `OPENVSX_TOKEN` secret exist before first release; order the publish step after `gh release upload`.
    - Advisory (radical innovation): add `c8 --check-coverage` thresholds so CI ratchets coverage instead of only reporting it.
