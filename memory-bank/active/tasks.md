# Task: Investigate Built-in Theme Support

* Task ID: investigate-builtin-themes
* Complexity: Level 2
* Type: Simple Enhancement / Investigation & Documentation

Investigate built-in theme and active theme detection across terminal emulators (WezTerm, iTerm2, Windows Terminal, Ghostty, kitty, Alacritty, Xresources) per Issue #36. Document the findings and clarify in README.md, STORE.md, productContext.md, and systemPatterns.md that Termeleon scans theme files and addons on disk (and custom `schemes` in Windows Terminal's `settings.json`). Built-in presets and compiled-in default palettes (in WezTerm, iTerm2, and Windows Terminal's packaged `defaults.json`) do not appear unless exported or defined as custom theme files.

## Test Plan (TDD)

### Behaviors to Verify

No new executable behavior. This task is an architectural and platform investigation into built-in terminal theme storage and active theme detection mechanisms across all supported emulators, followed by comprehensive documentation updates across user-facing store/readme docs and memory bank architectural context.

### Test Infrastructure

- Framework: Node assert test harness via tsx (`test/parsers.test.ts`, `test/discover.test.ts`) and Mocha extension-host tests (`test/host/`)
- Test location: `test/`
- Conventions: Existing CI contract and parser tests
- New test files: none

## Implementation Plan

### 1. Documentation Updates — prose/policy

- Files: `README.md`, `STORE.md`, `memory-bank/productContext.md`, `memory-bank/systemPatterns.md`
- No tests: prose/policy artifact

1. Update `README.md`:
   - Clarify in the overview that Termeleon scans user-installed theme files and addons on disk.
   - Update the "Formats read" table to explicitly state the source file patterns and explain active theme detection per emulator (clarifying why WezTerm and iTerm2 do not report active themes from on-disk static files).
   - Update "Known limits" to explain built-in preset storage across WezTerm (Lua/binary), iTerm2 (binary plist / Cocoa defaults), and Windows Terminal (packaged `defaults.json`).
2. Update `STORE.md`:
   - Update the overview and "Supported Emulators" table, correcting the "Active Theme Detection" column for iTerm2 and WezTerm to accurately reflect that only static theme files are scanned, giving users upfront clarity.
3. Update `memory-bank/productContext.md`:
   - Update "Key Constraints" (preserving "Use Cases" in clean user language) to record the permanent boundary and rationale regarding built-in presets and active detection across WezTerm, iTerm2, and Windows Terminal.
4. Update `memory-bank/systemPatterns.md`:
   - Update "Best-Effort Discovery" to document the discovery boundaries and active detection rationale for each emulator.

## Technology Validation

No new technology - validation not required

## Dependencies

None

## Challenges & Mitigations

- Communicating technical distinction cleanly across all emulators: Users may expect built-in presets from WezTerm (embedded in binary), iTerm2 (embedded in binary / binary plist), or Windows Terminal (embedded in package `defaults.json`) to appear automatically. Mitigation: Explicitly document each emulator's scanning behavior and active detection details in the tables and known limits so the behavior is transparent and predictable.

## Pre-Mortem

- A user expects built-in presets (e.g. Campbell in Windows Terminal, Pastel in iTerm2, or Nord in WezTerm) to appear out of the box without defining theme files: Prevented by prominent documentation in both `STORE.md` (store listing) and `README.md` (repo documentation) explaining that Termeleon scans addon files on disk and custom `schemes`, not internal application binary/package presets.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
