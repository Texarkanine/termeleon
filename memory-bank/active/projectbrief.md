# Project Brief

## User Story

As a maintainer of vscode-terminal-themes, I want CHANGELOG.md and release-please on main so that conventional commits can cut tagged releases the same way sibling Texarkanine repos do.

## Use-Case(s)

### Use-Case 1

A conventional-commit merge to main causes release-please to open or update a release PR that bumps the package version, updates CHANGELOG.md, and tags a GitHub release when that PR merges.

### Use-Case 2

A contributor or maintainer reads CHANGELOG.md (and the release-please config) to see what version is current and how releases are produced, without needing a Marketplace publisher or extra secrets beyond the sibling helper-app pattern.

## Requirements

1. Add `release-please-config.json` (and the matching manifest if siblings use one).
2. Add a GitHub Actions workflow that runs release-please on main.
3. Add `CHANGELOG.md`.
4. Package version in `package.json` is the version release-please bumps.
5. Follow tab-yeet's node `release-type` unless a VS Code extension needs a documented exception.
6. Put `Fixes #7` in a commit.

## Constraints

1. Do not copy tab-yeet's AMO/CWS publish jobs. This is a VS Code extension.
2. If siblings use the helper GitHub App pattern (`HELPER_APP_ID` / `HELPER_APP_PRIVATE_KEY`) for the token, follow that; do not invent new secrets.
3. Do not require the human to provision a Marketplace publisher.
4. Do not modify `/Users/tex/git/vscode-terminal-themes` (parent checkout). Work only in this worktree.
5. Markdown must not have SPDX comments (repo is LICENSE-only; no REUSE.toml).

## Acceptance Criteria

1. `release-please-config.json` exists and uses node `release-type` unless an exception is documented in the plan.
2. A release-please GitHub Actions workflow exists.
3. `CHANGELOG.md` is present.
4. `package.json` `version` is the version release-please is configured to bump.
5. No AMO, Chrome Web Store, or VS Marketplace publish jobs are added.
6. Token/auth matches sibling helper-app secrets if that is the sibling pattern.
