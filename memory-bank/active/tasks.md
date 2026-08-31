# Current Task: import-picker-ux-fix

**Complexity:** Level 1

## Fix Summary
- **Issue**: Uncolored `█` block characters in Quick Pick item details appeared as misleading identical gray swatches next to "Arrow keys preview", and live preview had no visible canvas if the terminal panel was closed.
- **Root Cause**: VS Code QuickPick API does not support arbitrary per-glyph RGB colors in item detail strings, and opening the picker did not ensure a terminal was visible in the window.
- **Changes**:
  - Removed `swatch()` helper and block glyphs from `toItem` and `toMirrorItem` in `src/extension.ts`.
  - Added `ensureTerminalVisible()` in `src/extension.ts` and called it in `pickAndApply()` with `preserveFocus: true`.
  - Added host tests in `test/host/picker.test.ts` covering item detail formatting without block characters and terminal visibility.
- **Files Affected**:
  - `src/extension.ts`
  - `test/host/picker.test.ts`

## QA Result: ✅ PASS

- Verified all 3 requirements met against `projectbrief.md`: swatch glyphs removed from both `toItem` and `toMirrorItem`, detail lines are plain origin paths, `ensureTerminalVisible()` wired into the import picker's `pickAndApply()`.
- Re-ran `npm run test:parsers` (50 passing) and `npm run test:host` (22 passing, including the 4 new picker tests) — all green.
- Two non-blocking advisories logged in `.qa-validation-status`: `ensureTerminalVisible`'s reuse-vs-create branches aren't separately tested; `ThemeItem`/`MirrorItem` were exported without being needed by the new tests. Neither blocks acceptance.
