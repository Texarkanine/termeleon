# Task: Investigate Built-in Theme Support

* Task ID: investigate-builtin-themes
* Complexity: Level 2
* Type: Simple Enhancement / Implementation & Documentation

Investigate and implement built-in theme support for terminal emulators per Issue #36. Discover iTerm2 built-in presets from bundled `ColorPresets.plist` inside `iTerm.app` on macOS and via `extraDirs` on all platforms. For emulators where built-in presets or active themes are compiled into binaries (WezTerm) or internal package defaults (Windows Terminal) or dynamic preferences (iTerm2 active profile), document the boundaries clearly in README.md, STORE.md, and project architecture docs.

## Test Plan (TDD)

### Behaviors to Verify

1. `parseItermColors`: parses component values formatted with either `<real>` or `<string>` tags (e.g. Tango presets in `ColorPresets.plist`).
2. `parseItermColorPresets`: extracts all top-level presets from an iTerm2 `ColorPresets.plist` XML document into `{ name, palette }[]` structures with valid palettes.
3. `discoverIterm2`: discovers presets from `ColorPresets.plist` via `extraDirs` on all platforms (CI-safe).
4. `discoverIterm2`: discovers bundled presets from `/Applications/iTerm.app/Contents/Resources/ColorPresets.plist` (and user Applications) on macOS (gated by darwin platform).

### Test Infrastructure

- Framework: Node assert test harness via tsx (`test/parsers.test.ts`, `test/discover.test.ts`)
- Test location: `test/`
- Conventions: Existing parser & discovery tests with fixtures

## Implementation Plan

### 1. iTerm2 Built-in Presets Parser & Discovery — executable

- Files: `src/parsers/iterm2.ts`, `src/discover.ts`, `test/parsers.test.ts`, `test/discover.test.ts`

1. [x] Stub tests: Add empty test cases in `test/parsers.test.ts` and `test/discover.test.ts`.
2. [x] Stub interface: Add `parseItermColorPresets` signature in `src/parsers/iterm2.ts`.
3. [x] Write tests and run red: Implement assertions in `test/parsers.test.ts` and `test/discover.test.ts` and verify test failure.
4. [x] Write code and run green:
   - Update `parseItermColors` to accept `<string>` float representations.
   - Implement `parseItermColorPresets` to extract top-level preset dicts.
   - Update `discoverIterm2` in `src/discover.ts` to scan `ColorPresets.plist` locations on macOS and in `extraDirs`.
   - Verify all tests pass green.
5. [x] Stub rework test: Add stub test `discovers iTerm2 presets from ColorPresets.plist via extraDirs` in `test/discover.test.ts` and gate darwin-only test.
6. [x] Implement rework test and run green: Verify on macOS and simulated non-darwin environment.

### 2. Documentation Updates — prose/policy

- Files: `README.md`, `STORE.md`, `memory-bank/productContext.md`, `memory-bank/systemPatterns.md`
- No tests: prose/policy artifact

1. [x] Update `README.md` overview, formats table, and known limits.
2. [x] Update `STORE.md` overview and Supported Emulators table.
3. [x] Update `memory-bank/productContext.md` and `memory-bank/systemPatterns.md`.

## Technology Validation

No new technology - validation not required

## Dependencies

None

## Challenges & Mitigations

- Some iTerm2 presets (e.g. Tango Light/Dark) use `<string>` rather than `<real>` tags for float components. Mitigation: Regex in `comp()` matches both `<real>` and `<string>`.
- CI runner environment: CI runs on `ubuntu-latest` where `process.platform !== 'darwin'`. Mitigation: Provide a platform-independent test using `extraDirs` and gate darwin path assertions.

## Pre-Mortem

- A user expects WezTerm or Windows Terminal built-in defaults to be scanned from disk: Clearly documented in `README.md` and `STORE.md` that WezTerm schemes are compiled into the Rust binary and Windows Terminal presets are packaged defaults.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [ ] QA
