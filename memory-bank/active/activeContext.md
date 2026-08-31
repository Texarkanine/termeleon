# Active Context

## Current Task: changelog-release-please
**Phase:** BUILD - COMPLETE

## What Was Done
- Added CHANGELOG.md, release-please-config.json, .release-please-manifest.json, and `.github/workflows/release-please.yaml`.
- Ignored the new CI/config files in `.vscodeignore`. Recorded Releases in `memory-bank/techContext.md`.
- Implementation commit `cabf8aa` has `Fixes #7`.
- Parser tests: 11 passed. `npm run compile` succeeded. No new tests (prose/policy).

## Files created or modified
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-7-changelog-release-please/CHANGELOG.md`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-7-changelog-release-please/release-please-config.json`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-7-changelog-release-please/.release-please-manifest.json`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-7-changelog-release-please/.github/workflows/release-please.yaml`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-7-changelog-release-please/.vscodeignore`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-7-changelog-release-please/memory-bank/techContext.md`

## Key implementation decisions
- `release-type: node`, no extra-files, no VS Code exception.
- Helper app token via `client-id: vars.HELPER_APP_ID` (tab-yeet).
- Did not take preflight advisories (no VSIX attach job, no package-lock.json).

## Deviations from Plan
- None - built to plan. Preflight advisories left for the operator.

## Next Step
- QA review.
