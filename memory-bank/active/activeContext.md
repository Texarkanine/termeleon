# Active Context

**Current Task:** Investigate built-in theme support (Issue #36)

**Phase:** PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

## What Was Done
- Investigated both built-in preset storage and active-theme detection across all supported emulators (WezTerm, iTerm2, Windows Terminal, Ghostty, kitty, Alacritty, Xresources).
- Addressed Preflight findings:
  - Documented active-theme detection rationale per emulator (e.g. iTerm2 uses binary plist / CFPreferences and dynamic profiles; WezTerm uses dynamic Lua scripts).
  - Confirmed built-in preset boundaries for WezTerm, iTerm2, and Windows Terminal (`defaults.json`).
  - Aligned `productContext.md` so that limitations are recorded in "Key Constraints" rather than "Use Cases".
  - Standardized the "Active theme detected" columns in both `README.md` and `STORE.md`.
- Updated `memory-bank/active/tasks.md` with the full implementation plan.

## Next Step
- Proceed to Build; the preflight result permits the transition.
