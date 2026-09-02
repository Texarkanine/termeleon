---
task_id: investigate-builtin-themes
date: 2026-09-02
complexity_level: 2
---

# Reflection: Investigate Built-in Theme Support

## Summary

Investigated built-in theme support across terminal emulators per Issue #36. Discovered and implemented full discovery and parsing for iTerm2's bundled presets via `ColorPresets.plist` (supporting both `<real>` and `<string>` float representations), while documenting clear technical boundaries in README, store description, and architecture docs for emulators where themes/active profiles are compiled in binaries (WezTerm) or internal package defaults (Windows Terminal).

## Requirements vs Outcome

Delivered all requirements from the project brief:
1. Conducted an accurate technical investigation into emulator storage mechanisms.
2. Implemented reliable, non-brittle discovery for iTerm2's bundled XML `ColorPresets.plist` without vendoring or fragile binary reflection.
3. Documented in `README.md`, `STORE.md`, and persistent memory bank files why WezTerm compiled-in themes, Windows Terminal package defaults, and iTerm2 active profile preferences plists are not scanned.

## Plan Accuracy

The initial plan assumed all iTerm2 built-in themes were stored only in Cocoa preferences or compiled in. Early QA caught that iTerm2 actually ships a static `ColorPresets.plist` XML resource file inside `iTerm.app/Contents/Resources/`. The plan was revised to include TDD implementation of `parseItermColorPresets` and discovery updates. During Build, QA also caught that darwin-only gating required a platform-independent `extraDirs` test to ensure CI (`ubuntu-latest`) remains green. Both adjustments made the final solution significantly more robust.

## Build & QA Observations

- **What went well:** TDD implementation of `parseItermColorPresets` was clean, using balanced `<dict>` matching to extract sub-palettes and reusing `parseItermColors` for palette mapping.
- **What was caught by QA:**
  1. Semantic review identified that iTerm2 bundled presets were discoverable from `ColorPresets.plist`, pivoting the task from docs-only to parser/discovery implementation.
  2. The initial discovery test only tested the macOS bundle path without `extraDirs`, which would fail on Linux CI; resolved by adding a platform-independent `extraDirs` test and gating the macOS path.

## Insights

### Technical
- iTerm2's `ColorPresets.plist` contains 11 presets where some presets (like Tango Light/Dark) format RGB float components as `<string>` rather than `<real>` tags. Robust float component regexes must match `<(?:real|string)>` tags.
- When adding platform-specific discovery paths (e.g. macOS `/Applications`), always pair them with an `extraDirs`-based test so discovery is exercised on every CI operating system.

### Process
- Verifying the existence of static resource files in application bundles (`.app/Contents/Resources/`) before assuming built-in themes are compiled into binaries prevents premature descoping.

### Million-Dollar Question

Treating multi-preset containers (like iTerm2's `ColorPresets.plist` or Windows Terminal's `settings.json` schemes array) as first-class discovery sources from the start creates a clean distinction: parsers either return a single `Palette` or a list `{ name, palette }[]`, which `discover.ts` uniformly normalizes into `DiscoveredTheme[]`. The current architecture accommodated this cleanly.
