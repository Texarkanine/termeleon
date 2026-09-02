# Task: Investigate Built-in Theme Support

* Task ID: investigate-builtin-themes
* Complexity: Level 2
* Type: Simple Enhancement / Investigation & Documentation

Investigate built-in theme and active theme detection across terminal emulators (WezTerm, iTerm2, Ghostty, Kitty, Alacritty, Windows Terminal, Xresources) per Issue #36. Document the findings and clarify in README.md, STORE.md, and productContext.md that Termeleon scans theme files and addons on disk, and compiled-in binary themes (e.g., in WezTerm and iTerm2) do not appear unless exported or installed as files.

## Test Plan (TDD)

### Behaviors to Verify

No new executable behavior. This task is an investigation into built-in terminal theme architectures followed by user-facing and architectural documentation updates.

### Test Infrastructure

- Framework: Node assert test harness via tsx (`test/parsers.test.ts`, `test/discover.test.ts`) and Mocha extension-host tests (`test/host/`)
- Test location: `test/`
- Conventions: Existing CI contract and parser tests
- New test files: none

## Implementation Plan

### 1. Documentation Updates — prose/policy

- Files: `README.md`, `STORE.md`, `memory-bank/productContext.md`
- No tests: prose/policy artifact

1. Update `README.md` to explicitly state in the overview, supported formats table, and "Known limits" section that Termeleon scans theme files and addons on disk, and emulators with compiled-in binary presets (such as WezTerm and iTerm2) do not show built-in presets unless installed/exported as theme files.
2. Update `STORE.md` supported emulators table and descriptions to match, giving users browsing the store upfront clarity.
3. Update `memory-bank/productContext.md` key constraints and use cases to record the permanent boundary regarding built-in themes vs disk theme files.

## Technology Validation

No new technology - validation not required

## Dependencies

None

## Challenges & Mitigations

- Communicating technical distinction cleanly: Users may not realize that Ghostty and Windows Terminal provide on-disk theme files while WezTerm and iTerm2 embed themes in compiled code. Mitigation: Detail exactly how each emulator works in the documentation tables and known limits so the behavior is transparent and predictable.

## Pre-Mortem

- A user expects WezTerm or iTerm2 built-in presets to appear in the picker automatically and reports an issue: Addressed by upfront documentation in both `STORE.md` (extension store display) and `README.md` (repository documentation), specifically calling out that only addons/theme files on disk appear.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
