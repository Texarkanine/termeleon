# Active Context

**Current Task:** Investigate built-in theme support (Issue #36)

**Phase:** BUILD - COMPLETE

## What Was Done
- Implemented `parseItermColorPresets` and extended `parseItermColors` in `src/parsers/iterm2.ts` to parse all 11 built-in iTerm2 presets from `ColorPresets.plist` with real/string float channels.
- Added macOS application bundle discovery for `ColorPresets.plist` in `src/discover.ts` with name deduplication.
- Added comprehensive unit and discovery tests in `test/parsers.test.ts` and `test/discover.test.ts` following TDD (63 tests passing, 94.6% statement coverage).
- Updated documentation across `README.md`, `STORE.md`, `memory-bank/productContext.md`, and `memory-bank/systemPatterns.md`.
- Verified clean build, lint, and packaging with vsce.

## Key Decisions Made
- Discovered iTerm2 bundled presets from `ColorPresets.plist` without vendoring or brittle binary inspection.
- Documented boundaries for WezTerm (Lua/binary), Windows Terminal (package defaults), and iTerm2 active profile (preferences plist).

## Deviations from Plan
- None - built to plan.

## Next Step
- Transition to QA phase by deleting `.qa-validation-status` and spawning a subagent with `/niko-qa`.
