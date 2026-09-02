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
    - Investigated built-in theme storage across supported emulators (WezTerm, iTerm2, Ghostty, kitty, Alacritty, Windows Terminal, Xresources).
    - Determined that Ghostty and Windows Terminal provide filesystem-accessible themes, while WezTerm and iTerm2 embed built-in presets in compiled binaries without static on-disk files.
    - Created detailed implementation plan in `memory-bank/active/tasks.md` focusing on clear user documentation in `README.md`, `STORE.md`, and `productContext.md`.
* Decisions made
    - Do not attempt brittle reflection or vendoring static copies of compiled-in emulator palettes.
    - Document clearly that Termeleon scans theme files and addons on disk, so built-in binary presets do not appear unless exported or installed as files.
