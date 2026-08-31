# Active Context

## Current Task: discover-fixture-tests
**Phase:** BUILD - COMPLETE

## What Was Done
- Added `test/discover.test.ts`: five Node/`tsx` cases against a throwaway `$HOME` / `$XDG_CONFIG_HOME` tree (XDG is not `~/.config`). Assertions match `origin` under that tree.
- `src/discover.ts` reads home/XDG at scan time via `homeDir()` / `xdgConfigDir()` / `xdgDataDirectories()`. Public `discoverThemes` / `DiscoverOptions` unchanged.
- `package.json` `test:parsers` runs parsers then discover in separate processes.
- Updated `README.md`, `memory-bank/techContext.md`, `memory-bank/systemPatterns.md`.

## Files modified
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-5-discover-fixture-tests/test/discover.test.ts` (created)
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-5-discover-fixture-tests/src/discover.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-5-discover-fixture-tests/package.json`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-5-discover-fixture-tests/README.md`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-5-discover-fixture-tests/memory-bank/techContext.md`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-5-discover-fixture-tests/memory-bank/systemPatterns.md`

## Key implementation decisions
- Exact `origin` equality against planted paths, not result-list length, so Darwin `/Applications/Ghostty.app` themes cannot satisfy or break the suite.
- No new public injection API (preflight advisory left out of scope).

## Deviations from Plan
- None - built to plan.

## Next Step
- QA review.
