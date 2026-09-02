# Active Context

**Current Task:** Investigate built-in theme support (Issue #36)

**Phase:** PLAN - COMPLETE

## What Was Done
- Completed investigation into terminal emulator architectures regarding built-in themes and active theme colors (WezTerm, iTerm2, Ghostty, kitty, Alacritty, Windows Terminal, Xresources).
- Confirmed that emulators with themes compiled into binaries (WezTerm, iTerm2) do not store built-in themes on disk, and extracting them dynamically or vendoring would violate stability and licensing constraints.
- Formulated an implementation plan in `memory-bank/active/tasks.md` to document the built-in vs addon theme behavior across `README.md`, `STORE.md`, and `memory-bank/productContext.md`.

## Next Step
- Transition to Preflight phase by spawning a subagent with `/niko-preflight`.
