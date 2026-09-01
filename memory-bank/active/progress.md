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
