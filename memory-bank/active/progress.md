# Progress

Remove misleading uncolored block glyphs from Quick Pick items and reveal an integrated terminal when opening the import picker so live preview is visible.

**Complexity:** Level 1

## 2026-08-31 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Clarified user intent from issue #21
    - Completed complexity analysis: Level 1
* Decisions made
    - Confirmed VS Code QuickPickItem detail does not support arbitrary per-glyph RGB colors; removing fake swatch blocks
    - Revealing a terminal on import picker open ensures live preview has an immediate canvas

## 2026-08-31 - BUILD - COMPLETE

* Work completed
    - Removed `swatch()` helper and block glyphs from `src/extension.ts`
    - Implemented `ensureTerminalVisible()` and integrated into `pickAndApply`
    - Added host tests in `test/host/picker.test.ts`
    - All parser, discover, and host tests passing (22 host tests, 50 parser/discover tests)
* Decisions made
    - Revealed terminal using `preserveFocus: true` so the user remains focused on the Quick Pick
