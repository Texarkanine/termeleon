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

## 2026-09-02 - PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

* Work completed
    - Validated the implementation plan against `src/parsers/iterm2.ts`, `src/discover.ts`, parser/discovery tests, and current README/STORE/systemPatterns wording.
    - Wrote `memory-bank/active/.preflight-status` with first line `PASS WITH ADVISORY`.
* Decisions made
    - Plan is acceptable as-is: TDD order is explicit; executable unit has test steps; docs unit is prose/policy.
    - Advisories only: hermetic ColorPresets fixture via `$HOME/Applications/...`, balanced dict extraction for nested plists, user-vs-bundled name order, optional `extraDirs` plist recognition.
* Insights
    - Real iTerm `ColorPresets.plist` has 11 top-level presets; Tango Light/Dark encode RGB as `<string>` floats, so the `parseItermColors` regex change is required for those presets to be usable.
