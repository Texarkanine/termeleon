# Active Context

## Current Task: investigate-mobaxterm-themes
**Phase:** BUILD - COMPLETE

## What Was Done

- `alacrittyImports` / `resolveAlacrittyImport` in `src/parsers/toml.ts`.
- `discoverAlacritty` now walks `%APPDATA%\alacritty`, identifies configs by exact basename `alacritty.toml`, follows `import` / `[general].import`, and marks the last usable import active when the config itself is not a usable palette.
- Docs: `README.md`, `STORE.md`, `memory-bank/systemPatterns.md`. `productContext.md` unchanged.

## Files Modified

- `/home/mobaxterm/git/termeleon/src/parsers/toml.ts`
- `/home/mobaxterm/git/termeleon/src/discover.ts`
- `/home/mobaxterm/git/termeleon/test/parsers.test.ts`
- `/home/mobaxterm/git/termeleon/test/discover.test.ts`
- `/home/mobaxterm/git/termeleon/README.md`
- `/home/mobaxterm/git/termeleon/STORE.md`
- `/home/mobaxterm/git/termeleon/memory-bank/systemPatterns.md`
- `/home/mobaxterm/git/termeleon/memory-bank/active/tasks.md`

## Key Decisions

- Honor preflight advisories: per-import `parseAlacritty` try/catch; collect configs during the walk before `isUsable`; extraDirs same-file via overlapping directories, not a symlink; `%APPDATA%` import spec asserts the config-relative join.
- No field-by-field import merge (plan: config usable → config active, else last usable import).
- APPDATA base added in write-code, not the stub step.

## Next Step

- QA review of the Alacritty rework.
