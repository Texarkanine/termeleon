# Active Context

## Current Task: investigate-mobaxterm-themes
**Phase:** BUILD - COMPLETE

## What Was Done

- Implemented `fromByteComponents` in `src/palette.ts` and `parseMobaXterm` in `src/parsers/mobaxterm.ts`.
- Wired `discoverMobaXterm`: Documents, OneDrive Documents, AppData, extraDirs; first default-root `MobaXterm.ini` is active.
- Added `mobaxterm` to `termeleon.sources`, keywords, and `SOURCE_LABELS`.
- Documented support and gaps in README, STORE, productContext, systemPatterns.

## Files

- `/home/mobaxterm/git/termeleon/src/palette.ts`
- `/home/mobaxterm/git/termeleon/src/parsers/mobaxterm.ts`
- `/home/mobaxterm/git/termeleon/src/discover.ts`
- `/home/mobaxterm/git/termeleon/src/extension.ts`
- `/home/mobaxterm/git/termeleon/package.json`
- `/home/mobaxterm/git/termeleon/test/parsers.test.ts`
- `/home/mobaxterm/git/termeleon/test/discover.test.ts`
- `/home/mobaxterm/git/termeleon/test/fixtures/mobaxterm-colors.ini`
- `/home/mobaxterm/git/termeleon/test/fixtures/mobaxterm-index-only.ini`
- `/home/mobaxterm/git/termeleon/test/fixtures/extra/extra-mobaxterm.ini`
- `/home/mobaxterm/git/termeleon/README.md`
- `/home/mobaxterm/git/termeleon/STORE.md`
- `/home/mobaxterm/git/termeleon/memory-bank/productContext.md`
- `/home/mobaxterm/git/termeleon/memory-bank/systemPatterns.md`

## Decisions

- British `Colour` keys only. RGB conversion lives beside `fromFloatComponents`, not in `normalizeColor`.
- INI section walking stays private in `parseMobaXterm` (no shared INI module).
- Host tests were not used as a gate: they hung in this WSL Electron/X11 session; CI does not run them; apply path unchanged.

## Next Step

- QA review.
