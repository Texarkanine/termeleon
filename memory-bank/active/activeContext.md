# Active Context

**Current Task:** Investigate built-in theme support (Issue #36)

**Phase:** BUILD - COMPLETE (Rework Complete)

## What Was Done
- Implemented `parseItermColorPresets` and extended `parseItermColors` in `src/parsers/iterm2.ts` to parse all 11 built-in iTerm2 presets from `ColorPresets.plist` with real/string float channels.
- Added macOS application bundle discovery and `extraDirs` discovery for `ColorPresets.plist` in `src/discover.ts` with name deduplication.
- Added comprehensive unit and discovery tests in `test/parsers.test.ts` and `test/discover.test.ts`, including cross-platform `extraDirs` tests and darwin-gated bundle tests (64 tests passing, 95% statement coverage).
- Verified test suite passes in both standard macOS and simulated Linux environment.
- Updated documentation across `README.md`, `STORE.md`, `memory-bank/productContext.md`, and `memory-bank/systemPatterns.md`.
- Verified clean build, lint, and packaging with vsce.

## Key Decisions Made
- Discovered iTerm2 bundled presets from `ColorPresets.plist` without vendoring or brittle binary inspection.
- Documented boundaries for WezTerm (Lua/binary), Windows Terminal (package defaults), and iTerm2 active profile (preferences plist).

## Deviations from Plan
- None.

## Next Step
- Commit changes and transition to QA phase with `/niko-qa`.
