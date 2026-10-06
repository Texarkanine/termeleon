# Active Context

## Current Task: Windows Terminal inbox schemes and mirror
**Phase:** BUILD - COMPLETE

## What Was Done
- Inbox schemes are read from each install's `defaults.json`, and a `settings.json` scheme of the same name (case-insensitive) replaces that palette
- Active names resolve as an explicit user `colorScheme`, then the same resolution on `defaults.json`, then `WINDOWS_TERMINAL_ASSUMED_COLOR_SCHEME`
- Mirror is unchanged: it applies whatever discovery marks `active`
- Parser tests 94 passed, discovery tests 42 passed, cache tests 8 passed, host tests 47 passed. `npm run compile` succeeded
- Docs in `README.md`, `memory-bank/productContext.md`, and `memory-bank/systemPatterns.md` describe the new contract

## Files
- `/home/mobaxterm/worktrees/Texarkanine/termeleon/termeleon-windows-terminal-color/src/parsers/iterm2.ts`
- `/home/mobaxterm/worktrees/Texarkanine/termeleon/termeleon-windows-terminal-color/src/discover.ts`
- `/home/mobaxterm/worktrees/Texarkanine/termeleon/termeleon-windows-terminal-color/test/parsers.test.ts`
- `/home/mobaxterm/worktrees/Texarkanine/termeleon/termeleon-windows-terminal-color/test/discover.test.ts`
- `/home/mobaxterm/worktrees/Texarkanine/termeleon/termeleon-windows-terminal-color/README.md`
- `/home/mobaxterm/worktrees/Texarkanine/termeleon/termeleon-windows-terminal-color/memory-bank/productContext.md`
- `/home/mobaxterm/worktrees/Texarkanine/termeleon/termeleon-windows-terminal-color/memory-bank/systemPatterns.md`

## Key Decisions
- `presentColorSchemes` is the shared walk. `activeWindowsTerminalScheme` still returns no names when the key is absent. `wtDefaultsSchemes` was removed because that walk replaced it
- Unparseable user settings return `source: 'explicit'` and do not consult `defaults.json` (preflight advisory A1)
- Store and Preview `settings.json` paths are paired with `Get-AppxPackage` `defaults.json`. The unpackaged settings path has no defaults file
- The no-files discovery test skips on win32, because a real Appx install would still be found after `LOCALAPPDATA` is unset

## Next Step
- QA review
