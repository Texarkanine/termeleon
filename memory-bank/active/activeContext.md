# Active Context

## Current Task: import-picker-ux-fix
**Phase:** QA - COMPLETE (PASS)

## What Was Done
- Removed `swatch()` and uncolored block glyphs from `toItem` and `toMirrorItem`
- Added `ensureTerminalVisible()` on picker open in `pickAndApply`
- Added test suite in `test/host/picker.test.ts` and verified with full test suite
- QA reviewed the diff against the plan and re-ran the full test suite (50 parser/discover + 22 host tests, all passing); PASS with two non-blocking advisories

## Next Step
- Level 1 workflow complete; task ready for archive
