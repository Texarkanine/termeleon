---
task_id: changelog-release-please
complexity_level: 2
date: 2026-08-31
status: completed
---

# TASK ARCHIVE: changelog-release-please

## SUMMARY

Added CHANGELOG.md and release-please (node `release-type`, helper-app workflow) so conventional commits on `main` can cut tagged GitHub releases. No Marketplace, AMO, or CWS publish jobs. Closes #7. PR: https://github.com/Texarkanine/vscode-terminal-themes/pull/14

## REQUIREMENTS

- `release-please-config.json` and `.release-please-manifest.json` (manifest `"."` = `0.1.0`, matching `package.json`).
- Workflow on push to `main`; package version is what release-please bumps.
- Follow tab-yeet node `release-type` unless a VS Code exception is needed (none: vsce already reads `package.json`).
- Helper-app token (`HELPER_APP_ID` as `client-id`, `HELPER_APP_PRIVATE_KEY`); no new secrets; no Marketplace publisher.
- `Fixes #7` in the implementation commit.

## IMPLEMENTATION

Single-package node config with sibling bark header, `bump-minor-pre-major: true`, `include-component-in-tag: false`. Workflow is release-please only (`googleapis/release-please-action@v5`). After cursor[bot] review, the action sets `target-branch: ${{ github.ref_name }}` because the GitHub default is still `initialdev`. `.vscodeignore` excludes `.github/**` and the release-please files. `memory-bank/techContext.md` records how releases work.

## TESTING

No new tests (prose/policy; no change-detectors). `npm run test:parsers`: 11 passed. `npm run compile`: succeeded. Preflight PASS WITH ADVISORY. QA PASS.

## LESSONS LEARNED

- A VS Code extension does not need a special release-please type; node type without extra-files is enough.
- Sibling workflows disagree on `client-id` vs `app-id` for the same `HELPER_APP_ID` var. Follow the named sibling; the first run on `main` is the check. Do not invent a second secret.
- Siblings omit `target-branch` because their GitHub default is `main`. This repo must set it until the default switches.

## PROCESS IMPROVEMENTS

When the repo default branch is not the release branch, treat `target-branch` as part of copying a sibling workflow, not a later review find.

## TECHNICAL IMPROVEMENTS

Preflight advisories left out of scope: attach a VSIX to GitHub Releases; commit a `package-lock.json` before any `npm ci` job.

## NEXT STEPS

- After merge, the first release-please run on `main` verifies org `HELPER_APP_ID` works as `client-id`; if token minting fails, switch that field to `app-id`.
- Switch the GitHub default to `main` when that branch exists; `target-branch` remains correct either way.
- VSIX attach and package-lock are follow-ups, not this task.
