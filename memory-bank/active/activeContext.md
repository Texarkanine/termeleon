# Active Context

**Current Task:** Investigate built-in theme support (Issue #36)

**Phase:** PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

## What Was Done
- Re-evaluated iTerm2 built-in presets based on QA findings and discovered that iTerm2 ships `ColorPresets.plist` (XML 1.0) under `iTerm.app/Contents/Resources/`.
- Tested parsing of `ColorPresets.plist` directly and confirmed all 11 built-in presets (Regular, Solarized Dark/Light, Tango Dark/Light, Pastel, Smoooooth, etc.) parse cleanly into `Palette`.
- Formulated an updated implementation plan in `memory-bank/active/tasks.md` with TDD steps for `parseItermColorPresets` and `discoverIterm2` bundled preset discovery, alongside comprehensive documentation updates.

## Next Step
- Proceed to Build (`/niko-build`). Treat preflight advisories as implementer guidance, not plan rewrites.
