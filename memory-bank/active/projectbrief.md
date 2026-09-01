# Project Brief

## User Story

As an open-source extension maintainer and user, I want automated Open VSX publishing and Codecov coverage reporting in CI, so that releases are automatically published to the open extension registry and test coverage is tracked and visible on the repository README.

## Use-Case(s)

### Use-Case 1: Open VSX Publishing on Release
When release-please creates a GitHub release / tag on the `main` branch, the workflow packages the VSIX and publishes it to the Open VSX registry using the repository secret `OPENVSX_TOKEN`.

### Use-Case 2: Codecov Test Coverage in CI
When pull requests or commits to `main` and `initialdev` are tested in CI, test coverage is generated and uploaded to Codecov using `CODECOV_TOKEN`, with a status badge displayed in `README.md`.

## Requirements

1. Create and work on a dedicated feature branch so conventional commits will trigger release-please.
2. Update `.github/workflows/release-please.yaml` to publish the packaged VSIX to Open VSX using the `OPENVSX_TOKEN` secret when a release is created.
3. Configure test coverage collection (e.g. c8 / v8 / vitest or appropriate runner for the parser/discover suite) and update `package.json` with coverage scripts.
4. Update `.github/workflows/ci.yaml` to run test coverage and upload reports to Codecov via `codecov/codecov-action` using `CODECOV_TOKEN`.
5. Add the Codecov badge to `README.md` consistent with sibling repositories (`../a16n` and `../stockroom`).
6. Update CI contract tests in `test/parsers.test.ts` and documentation in `memory-bank/` to cover the new Open VSX and Codecov integrations.

## Constraints

1. Do not break existing release-please behavior (GitHub App token minting, release creation, VSIX attachment to GitHub Releases).
2. Do not publish to VS Code Marketplace (only Open VSX).
3. Do not hardcode secrets; use `OPENVSX_TOKEN` and `CODECOV_TOKEN`.
4. Keep the vscode-free core and parser test suite portable and fast.
5. All tests must pass before completion.

## Acceptance Criteria

1. Feature branch created and active.
2. `release-please.yaml` includes an Open VSX publishing step gated on `release_created` using `OPENVSX_TOKEN`.
3. CI runs tests with coverage and uploads coverage artifacts to Codecov using `CODECOV_TOKEN`.
4. `README.md` includes the Codecov badge.
5. `test/parsers.test.ts` asserts on the updated CI and release workflow contracts.
6. Memory bank persistent files (`techContext.md`, `systemPatterns.md`, etc.) are updated to reflect the new CI and release behaviors.
