# Project Brief

## User Story

As a contributor, I want pull requests and pushes to `initialdev` or `main` to run the same parser tests and typecheck I run locally after `npm ci`, so a change that breaks a parser test or compile fails CI before merge.

Authoritative spec: https://github.com/Texarkanine/vscode-terminal-themes/issues/3

## Use-Case(s)

### Use-Case 1

A pull request that breaks `npm run test:parsers` or `npm run compile` fails GitHub Actions.

### Use-Case 2

A green run on `initialdev` or `main` is `npm ci`, then `npm run test:parsers`, then `npm run compile`, with Node taken from `.nvmrc` and dependencies from a committed `package-lock.json`.

## Requirements

1. Workflow on `pull_request` and `push` to `initialdev` and `main` (this repo's integration branch now; house-shape `main` when it exists).
2. Shape matches other Texarkanine Node repos, closest being tab-yeet (`npm` + `actions/setup-node` with npm cache) and a16n (`.nvmrc` + lockfile install).
3. `.nvmrc` plus `actions/setup-node` with npm cache.
4. Committed `package-lock.json` so CI can `npm ci`.
5. Job runs `npm run test:parsers` and `npm run compile`.

## Constraints

1. No REUSE lint. Licensed by root `LICENSE` (AGPL-3.0-or-later). No `REUSE.toml`, no reuse job.
2. No Codecov until the test runner emits coverage.
3. `vsce package` is not a required gate until a Marketplace `publisher` id is in `package.json`.
4. Do not wait on intent clarification; the operator approved this issue as the task.

## Acceptance Criteria

1. A PR that breaks a parser test or typecheck fails CI.
2. A green `initialdev` or `main` run is the same commands a contributor runs locally after `npm ci`.
