---
task_id: github-actions-ci
complexity_level: 2
date: 2026-08-31
status: completed
---

# TASK ARCHIVE: GitHub Actions CI

## SUMMARY

Added GitHub Actions CI so a PR that breaks `npm run test:parsers` or `npm run compile` fails the check. Shape matches other Texarkanine Node repos (closest: tab-yeet): `.nvmrc`, `actions/setup-node` with npm cache, committed `package-lock.json`, `npm ci`, then those two scripts. No REUSE, Codecov, or `vsce package`. `Fixes #3` is on the feature commit. PR: https://github.com/Texarkanine/vscode-terminal-themes/pull/15

After review, `pull_request` and `push` list both `initialdev` (this repo's integration branch) and `main` (house shape when that branch exists). A `main`-only filter never queued because `pull_request.branches` is the base-branch filter and this repo has no `main`.

## REQUIREMENTS

- Workflow on `pull_request` and `push` to this repo's integration branch and to `main`.
- `.nvmrc` + `setup-node` with npm cache; committed lockfile so CI can `npm ci`.
- Gates: `npm run test:parsers` and `npm run compile`.
- Out of scope: REUSE lint, Codecov, `vsce package`.

## IMPLEMENTATION

- [.github/workflows/ci.yaml](https://github.com/Texarkanine/vscode-terminal-themes/blob/issue-3-github-actions-ci/.github/workflows/ci.yaml): checkout@v7, setup-node@v7 from `.nvmrc`, npm cache, `npm ci`, test, compile. Triggers: `initialdev` and `main`.
- [.nvmrc](https://github.com/Texarkanine/vscode-terminal-themes/blob/issue-3-github-actions-ci/.nvmrc): major `22`.
- [package-lock.json](https://github.com/Texarkanine/vscode-terminal-themes/blob/issue-3-github-actions-ci/package-lock.json): generated from a clean tree so esbuild optional packages for linux (and other platforms) remain.
- [test/parsers.test.ts](https://github.com/Texarkanine/vscode-terminal-themes/blob/issue-3-github-actions-ci/test/parsers.test.ts): `ci` contract section (lockfile, `.nvmrc` pin, workflow commands and both branch names).
- README Development documents `npm ci`; `techContext.md` records CI and the lockfile-from-clean-tree invariant.

## TESTING

- TDD: contract tests went red on missing lockfile/nvmrc/workflow, then green. After review, the contract required `initialdev` (red) then both names (green).
- Local Node 22.23.2: `npm run test:parsers` (14 passed), `npm run compile` passed.
- `/niko-preflight`: PASS WITH ADVISORY (`.vscodeignore` VSIX hygiene; optional `npm run ci` script). Neither adopted.
- `/niko-qa`: PASS. No blocking or advisory findings on the first implementation.
- cursor[bot] inline on PR 15: `main`-only filter never queued; fixed by listing both branches.

## LESSONS LEARNED

- Generate `package-lock.json` from a clean tree. npm 10 with `node_modules` already present keeps only the current-platform esbuild optional packages; linux CI then cannot `npm ci`.
- A cross-file contract in the existing `test:parsers` harness is enough TDD for a GitHub workflow. Do not add a YAML parser or a second test command.
- `on.pull_request.branches` filters by the PR **base**. On a repo whose default is not yet `main`, a tab-yeet-shaped `main`-only list never runs.

## PROCESS IMPROVEMENTS

- When copying sibling-repo CI, check this repo's actual default/integration branch before copying `branches: [main]`.
- A single `npm run ci` script would make "CI is what you run locally" true by construction. Not added because the issue named the two existing scripts.

## TECHNICAL IMPROVEMENTS

- Optional: exclude `.github/`, `.nvmrc`, and `package-lock.json` from the VSIX via `.vscodeignore` when packaging becomes a gate.
- Optional: `npm run ci` wrapping `test:parsers && compile`.

## NEXT STEPS

None required. Archive and PR 15 are the close of this task.
