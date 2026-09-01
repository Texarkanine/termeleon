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
