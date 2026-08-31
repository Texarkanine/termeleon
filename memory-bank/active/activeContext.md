# Active Context

## Current Task: Detect Windows Terminal's active colorScheme
**Phase:** QA - COMPLETE (PASS)

## What Was Done
- Added `activeWindowsTerminalScheme` in `src/parsers/iterm2.ts` and wired `discoverWindowsTerminal` to set `active` from it.
- Fixture `test/fixtures/windows-terminal-settings.json` plus eight helper tests in `test/parsers.test.ts` (19 passing).
- README and `systemPatterns.md` now say Windows Terminal reports an in-use scheme.

## Files created or modified
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-10-wt-active-scheme/src/parsers/iterm2.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-10-wt-active-scheme/src/discover.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-10-wt-active-scheme/test/parsers.test.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-10-wt-active-scheme/test/fixtures/windows-terminal-settings.json`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-10-wt-active-scheme/README.md`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-10-wt-active-scheme/memory-bank/systemPatterns.md`

## Key implementation decisions
- Default profile `colorScheme` wins over `profiles.defaults` (WT inheritance).
- GUID compare is case-insensitive; legacy `profiles` array is supported.
- Shared private `parseWindowsTerminalSettings` used by both parse and active helpers (preflight advisory).

## Next Step
- QA passed. Ready for reflect/archive.
