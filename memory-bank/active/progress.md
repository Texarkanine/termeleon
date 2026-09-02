# Progress

Investigate built-in theme detection in terminal emulators, implement reliable discovery where possible, and document the built-in vs addon theme behavior in README.md, STORE.md, and project docs.

**Complexity:** Level 2

## 2026-09-02 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Clarified task intent with user.
    - Assessed complexity and determined Level 2.
* Decisions made
    - Classify as Level 2 since changes are contained to discovery/documentation and follow established project patterns.

## 2026-09-02 - PLAN - COMPLETE

* Work completed
    - Discovered that iTerm2 bundles an XML `ColorPresets.plist` file inside `iTerm.app/Contents/Resources/` containing 11 built-in presets.
    - Verified that WezTerm built-in themes are compiled in the Rust binary and config is Lua, and Windows Terminal defaults are in package `defaults.json`.
    - Formulated an updated implementation plan covering TDD implementation of `parseItermColorPresets` and `discoverIterm2` bundling, plus documentation updates.
* Decisions made
    - Add `parseItermColorPresets` and scan `ColorPresets.plist` on macOS (similar to Ghostty app bundle scanning).
    - Accurately document limits for WezTerm, Windows Terminal defaults, and active-theme detection.
