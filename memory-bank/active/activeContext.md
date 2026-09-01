# Active Context

## Current Task: rename-to-termeleon
**Phase:** BUILD - COMPLETE

## What Was Done
- Renamed package manifest, command contributions, and settings properties in `package.json` to `termeleon`.
- Updated `package-lock.json` root package name.
- Updated `src/extension.ts` (`CONFIG = 'termeleon'`).
- Updated `src/apply.ts` (`OWNED_STATE = 'termeleon.ownedKeys'` with automatic backward-compatible legacy migration from `terminalThemeImport.ownedKeys`).
- Added contract tests in `test/parsers.test.ts` locking package metadata, commands, and settings namespace.
- Updated `test/host/apply.test.ts` and `test/host/preview.test.ts` with legacy state migration coverage.
- Updated `README.md`, `memory-bank/techContext.md`, and `memory-bank/systemPatterns.md`.
- Verified all tests (`npm test`: 48 parser tests + 5 discover tests + 31 extension host tests) and packaging (`npm run package`).

## Next Step
- Spawning QA validation subagent.
